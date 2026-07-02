# Local-First Design

> How the IELTS Learning Journey implements a local-first architecture with no backend dependency.

---

## 1. Principles

### 1.1 Data Ownership

The user owns all their data. It is stored exclusively in their browser's IndexedDB and localStorage. There is no cloud sync, no server-side database, and no third-party data storage.

### 1.2 Offline Capability

Core features work without internet access:

- Vocabulary CRUD and review
- Reading/listening/writing/speaking session logging
- Mistake notebook
- Grammar notes
- Mock test tracking
- Daily planning
- Progress analytics
- Content library browsing
- Import/export

Only AI-powered features require internet (and are entirely optional).

### 1.3 Privacy by Default

- No data leaves the browser unless the user explicitly triggers an AI request
- No analytics, telemetry, or tracking scripts
- No backend endpoints to receive data
- User provides their own AI API key if they want AI features

---

## 2. Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    localStorage                          │
│  Settings (theme, target band, API key, preferences)     │
│  Synchronous access — fast reads for UI initialization   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    IndexedDB (idb)                       │
│  All user data: vocabulary, sessions, progress, etc.    │
│  Asynchronous — structured, indexed, queryable           │
│  via Repository Pattern                                    │
└─────────────────────────────────────────────────────────┘
```

### 2.1 localStorage

Used for settings that need synchronous access on app startup:

- Theme preference (dark/light/system)
- Target band and current band
- API key and AI provider configuration
- Daily study minutes
- Onboarding completion flag

**Key**: Settings are stored under a single `"app-settings"` key as a JSON object.

### 2.2 IndexedDB

Used for all structured learning data:

| Store | Content |
|-------|---------|
| `vocabulary` | Vocabulary words with metadata |
| `vocabularyReviews` | SM-2 spaced repetition data |
| `tasks` | Daily study tasks |
| `readingSessions` | Reading practice entries |
| `listeningSessions` | Listening practice entries |
| `writingSessions` | Writing practice entries |
| `speakingSessions` | Speaking practice entries |
| `grammarNotes` | Grammar topic notes |
| `mistakes` | Mistake notebook entries |
| `mockTests` | Mock test band scores |
| `topicsProgress` | Per-topic aggregated progress |
| `passages` | Saved reading passages |

---

## 3. Repository Pattern

All IndexedDB access goes through repository interfaces. No component or service calls IndexedDB directly.

```
Domain Layer (interfaces)
    │
    ▼
Infrastructure Layer (implementations)
    │
    ▼
IndexedDB (via idb library)
```

**Example flow:**

```typescript
// Domain interface (packages/types)
interface IVocabularyRepository {
  findById(id: string): Promise<VocabularyWord | null>
  findAll(options?: QueryOptions): Promise<VocabularyWord[]>
  create(word: CreateVocabularyInput): Promise<VocabularyWord>
  update(id: string, data: Partial<VocabularyWord>): Promise<VocabularyWord>
  delete(id: string): Promise<void>
}

// Infrastructure implementation (packages/storage)
class VocabularyRepository implements IVocabularyRepository {
  async create(input: CreateVocabularyInput): Promise<VocabularyWord> {
    const db = await getDb()
    const word = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    await db.add('vocabulary', word)
    return word
  }
}
```

---

## 4. Data Consistency

### 4.1 Schema Validation

All data is validated at layer boundaries using Zod schemas:

- User input → Feature schemas
- Service → Storage schemas
- Import → Import/export schemas
- AI response → Response schemas

### 4.2 Versioned Migrations

The IndexedDB schema is versioned. The `openDB` upgrade callback handles:

- Creating new object stores
- Adding/removing indexes
- Transforming existing data

```typescript
const DB_VERSION = 1

export async function getDb(): Promise<IDBPDatabase<Schema>> {
  return openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        db.createObjectStore('vocabulary', { keyPath: 'id' })
        // ... other stores
      }
    },
  })
}
```

### 4.3 Error Handling

Storage operations never crash the app:

- Wrapped in try/catch at the repository layer
- Errors return `StorageError` typed results
- UI shows friendly messages with retry options
- Corrupted data is isolated and reported

---

## 5. Browser Extension Storage

The extension maintains its own IndexedDB database (`ielts-journey-extension`) because IndexedDB is origin-bound. Chrome extensions and web pages cannot share the same database directly.

### Bridge Strategy

When the website tab is open, a bridge script enables data synchronization:

1. Content script detects the website URL
2. Injects a bridge script into the page's main world
3. Uses `window.postMessage` for communication
4. Dual-writes data to both databases when bridge is active

When the website is closed, saves go only to the extension database. The user can manually sync via JSON export/import.

See [extension-architecture.md](extension-architecture.md) for details.

---

## 6. Limitations of Local-First

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| No cross-device sync | Data is device-bound | Import/export JSON for manual transfer |
| IndexedDB origin-bound | Extension and web cannot share DB | Bridge protocol + manual export/import |
| Storage limits | Browser may evict data under pressure | Export regularly for backup |
| No push notifications | Reminders only work while page is open | Extension alarms for background reminders |
| Single-browser | Cannot use across Chrome and Firefox simultaneously | Manual export/import |

---

## 7. Trade-offs vs. Backend Architecture

| Aspect | Local-First (this project) | Backend Architecture |
|--------|---------------------------|---------------------|
| Data privacy | Maximum — user controls all data | Data stored on servers |
| Offline capability | Full offline for core features | Requires internet |
| Infrastructure cost | Zero | Server hosting costs |
| Cross-device sync | Manual via export/import | Automatic |
| Data backup | User responsibility | Server-managed backups |
| Collaboration | Not supported | Multi-user supported |
| Push notifications | Limited (extension only) | Full push notification support |
| Development complexity | Lower (no backend) | Higher (full stack) |
