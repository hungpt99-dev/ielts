# Import & Export

> How the IELTS Learning Journey handles data portability through JSON backup/restore, content pack exchange, and cross-origin synchronization.

---

## 1. Overview

The import/export system provides full data portability. Users can back up their entire study database, transfer data between the web app and browser extension, and share content packs.

**Three import/export contexts:**

| Context | Description | Format |
|---------|-------------|--------|
| **Full Backup** | All user data (vocabulary, sessions, mistakes, etc.) | `AppExportData` JSON |
| **Content Packs** | Built-in or curated content collections | `ContentPack` JSON |
| **Extension Sync** | Data transfer between extension and web app | `ExtensionExportData` JSON |

---

## 2. Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  ImportExport page · Settings > Data Management            │
│  File picker · Download trigger · Progress indicator       │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                       │
│  ImportExportService                                       │
│  ├── exportAllData() → JSON blob                          │
│  ├── importBackup(json, mode) → ImportResult               │
│  ├── validateImportData(data) → ValidationResult           │
│  └── downloadJson(data, filename) → File download          │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                    │
│  packages/import-export/src/                              │
│  ├── handlers/ (file read/write)                          │
│  ├── schemas/ (Zod validation for import format)          │
│  └── utils/ (merge logic, dedup)                          │
│                                                           │
│  packages/storage/src/backup/                             │
│  ├── exportAllData()                                      │
│  ├── importBackup()                                       │
│  └── mergeBackupWithDedup()                               │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                           │
│  All repositories read/write data during export/import    │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Export Flow

```
User clicks "Export Backup"
        │
        ▼
Service calls exportAllData()
        │
        ▼
Each repository reads all records from IndexedDB
  ├── vocabulary, vocabularyReviews
  ├── tasks, readingSessions, listeningSessions
  ├── writingSessions, speakingSessions
  ├── grammarNotes, mistakes
  ├── mockTests, passages
  ├── topicsProgress, progressRecords
  └── contentMeta, userContentEdits
        │
        ▼
Data assembled into AppExportData structure
        │
        ▼
Zod schema validates the complete export
        │
        ▼
JSON blob triggers browser download
  File: ielts-journey-backup-{YYYY-MM-DD}.json
```

### 3.1 Export Format

```typescript
interface AppExportData {
  version: number           // Schema version at export time
  exportedAt: string        // ISO timestamp
  appVersion: string        // App version
  vocabulary: VocabularyEntry[]
  vocabularyReviews: VocabReview[]
  tasks: TaskEntry[]
  readingSessions: ReadingSession[]
  listeningSessions: ListeningSession[]
  writingSessions: WritingSession[]
  speakingSessions: SpeakingSession[]
  grammarNotes: GrammarNote[]
  mistakes: MistakeEntry[]
  mockTests: MockTestEntry[]
  passages: PassageEntry[]
  topicsProgress: TopicProgress[]
  progressRecords: ProgressRecord[]
  contentMeta: ContentMeta[]
  userContentEdits: UserContentEdit[]
}
```

The export file is a plain JSON file that can be viewed, edited, or transferred.

---

## 4. Import Flow

```
User selects a .json file via file picker
        │
        ▼
File read as text → JSON.parse()
        │
        ▼
Validate against AppExportDataSchema (Zod)
        │
        ├── Validation fails → Show error messages (field-level)
        │                      No data written
        │
        └── Validation passes → User chooses mode:
                │
                ├── Replace Mode:
                │   Clear all existing data in each store
                │   Bulk insert imported records
                │
                └── Merge Mode:
                    For each record:
                      ├── ID exists in DB → skip (keep existing)
                      └── ID is new → insert
        │
        ▼
Show import result:
  ├── Total records imported
  ├── Records skipped (duplicates)
  ├── Any errors per store
  └── Warnings (e.g., schema version mismatch)
```

### 4.1 Import Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Replace** | Clears all data, inserts imported data | Restoring from backup |
| **Merge** | Inserts new records, keeps existing | Combining data sources |

### 4.2 Duplicate Detection

During merge mode, duplicates are identified by:
1. **Primary key (`id`)** — If the same ID exists, skip import
2. **Content hash** — For extension ↔ web sync, content-based dedup

---

## 5. Content Pack Import/Export

Built-in content packs can be exported and imported separately from user data:

```typescript
interface ContentPack {
  meta: ContentPackMeta
  items: ContentPackItem[]
}

interface ContentPackMeta {
  version: number
  type: 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary'
  name: string
  description: string
  createdAt: string
}
```

Content import respects the **user edit copy** pattern:
- Built-in content is version-tracked
- User edits create a `userContentEdits` record
- Content updates never overwrite user modifications

---

## 6. Extension ↔ Web Sync

The browser extension maintains its own IndexedDB database. The `syncService.ts` module provides:

### 6.1 Manual Export/Import

Both the extension and web app produce/consume the same JSON format. Users can:
1. Export from extension → download JSON
2. Import into web app → upload JSON
3. Export from web app → download JSON
4. Import into extension → upload JSON

### 6.2 Bridge Protocol (Live Sync)

When the website is open in a tab, the extension can sync data in real-time:

```
Extension → Page:  { source: "ielts-extension", action: "SAVE_ITEM", item: {...} }
Page → Extension:  { source: "ielts-page", action: "ITEM_SAVED", id: "..." }
```

This enables dual-write to both databases simultaneously.

### 6.3 Pending Sync Tracking

```typescript
interface SyncStatus {
  lastSyncAt: string | null
  pendingItems: Array<{ id: string; type: string; savedAt: string }>
  lastSyncResult: 'success' | 'partial' | 'failed' | null
}
```

Items saved while the bridge is inactive are tracked as pending. They sync automatically when the website tab is next opened.

---

## 7. Validation

All import data is validated against Zod schemas:

```typescript
const appExportDataSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  vocabulary: z.array(vocabularyEntrySchema),
  // ... other stores
})

const result = appExportDataSchema.safeParse(data)
if (!result.success) {
  // Field-level error reporting
  const errors = result.error.issues.map(i => ({
    path: i.path.join('.'),
    message: i.message
  }))
}
```

Validation catches:
- Missing required fields
- Wrong data types
- Invalid enum values
- Out-of-range numbers

---

## 8. Error Handling

| Error | Handling |
|-------|----------|
| Invalid JSON file | Show "File is not valid JSON" message |
| Schema validation failure | Show field-level error list |
| IndexedDB write failure | Show retry button |
| Partial import failure | Show per-store success/error counts |
| File too large | Show size limit warning |
| Version mismatch | Show migration warning, attempt import |

---

## 9. UI Integration

The import/export UI lives in:
- **Web app:** `src/pages/ImportExport.tsx`, `src/pages/Settings/DataManagement.tsx`
- **Extension:** `apps/extension/src/options/SettingsPage.tsx`, `apps/extension/src/popup/components/BackupRestore.tsx`

Each provides:
- Export button with download
- File picker for import with mode selection
- Progress indicator during import
- Result summary after completion
- Error display with retry
