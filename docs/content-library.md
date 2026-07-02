# Content Library

> The built-in content library with versioning, seeding, user edit tracking, and content pack management.

---

## 1. Overview

The Content Library provides pre-built IELTS study content that ships with the application. It is seeded into IndexedDB on first run and supports versioned updates without overwriting user modifications.

**Package:** `packages/content/src/`

### 1.1 Content Types

| Type | Description | Built-in Pack |
|------|-------------|---------------|
| Grammar Notes | Pre-written grammar explanations with examples | `BUILT_IN_GRAMMAR_NOTES` |
| Reading Passages | IELTS-style reading passages | `BUILT_IN_READING_PASSAGES` |
| Listening Transcripts | IELTS-style listening transcripts | `BUILT_IN_LISTENING_TRANSCRIPTS` |
| Writing Prompts | Task 1 and Task 2 writing prompts | `BUILT_IN_WRITING_PROMPTS` |
| Speaking Questions | Part 1, 2, and 3 speaking questions | `BUILT_IN_SPEAKING_QUESTIONS` |
| Useful Phrases | Academic and topic-specific phrases | `BUILT_IN_USEFUL_PHRASES` |
| IELTS Topics | Curated IELTS topic definitions | `BUILT_IN_IELTS_TOPICS` |

---

## 2. Architecture

```
packages/content/src/
├── index.ts                   # Public API barrel
├── types.ts                   # Content type definitions
├── schemas.ts                 # Zod validation schemas
├── seeding.ts                 # First-run content seeding
├── userContent.ts             # User edit management
├── search.ts                  # Full-text search
├── importExport.ts            # Content pack import/export
└── built-in/                  # Static content packs
    ├── index.ts               # Aggregates all packs
    ├── grammar.ts
    ├── reading.ts
    ├── listening.ts
    ├── writing.ts
    ├── speaking.ts
    ├── phrases.ts
    └── topics.ts
```

---

## 3. Seeding Process

On first launch (when `sampleDataLoaded` is false in settings), content is seeded:

```
App starts → check sampleDataLoaded flag
        │
        ├── Already loaded → skip seeding
        │
        └── Not loaded:
            │
            ▼
        ContentSeedingService.seedAll()
            │
            ├── Read all built-in packs from static data
            ├── Validate each item against Zod schema
            ├── Bulk insert into IndexedDB
            │   (contentMeta, grammarNotes, readingPassages, etc.)
            └── Set sampleDataLoaded = true
```

### 3.1 Seeding Options

```typescript
interface ContentSeedingOptions {
  overwrite?: boolean           // Default: false — skip existing
  onlyTypes?: ContentType[]     // Seed only specific types
}

interface ContentSeedingResult {
  seeded: number               // Items successfully seeded
  skipped: number              // Items skipped (already exist)
  errors: Array<{ item: string; error: string }>
}
```

### 3.2 First-Run Detection

The `isSeedDataLoaded()` function checks the `sampleDataLoaded` flag in localStorage settings. If `false` or missing, seeding runs automatically.

---

## 4. Content Versioning

Each content pack has a version identifier:

```typescript
interface ContentPackMeta {
  version: number               // Incremented on content updates
  contentVersion: string        // Semantic version (e.g., "1.2.0")
  type: ContentType
  name: string
  description: string
  createdAt: string
}
```

### 4.1 Update Strategy

When the app updates and content versions change:

1. New content items are added (new IDs)
2. Existing items keep their IDs but may have updated fields
3. **User edits are never overwritten** — see User Edit Tracking below
4. Removed items (from old versions) are flagged as deprecated, not deleted

---

## 5. User Edit Tracking

Users can modify built-in content (e.g., add notes to a grammar topic, edit a writing prompt). These edits are stored separately from the original content:

### 5.1 How It Works

```typescript
interface UserContentEdit {
  id: string
  originalId: string             // References the built-in content ID
  contentType: ContentType
  changes: Partial<ContentItem>  // The user's modifications
  appliedAt: string
  createdAt: string
  updatedAt: string
}
```

### 5.2 Merge Logic

When displaying content:
1. Load the built-in item from its store
2. Check for a `userContentEdits` record matching `originalId`
3. If found, merge `changes` on top of the built-in item
4. Display the merged result

### 5.3 Content Update Safety

During app updates that modify built-in content:
- New items are added unconditionally
- Modified items check for user edits first
- If a user edit exists for an item, the built-in content is updated but user edits are preserved on top
- If no user edit exists, the built-in content is updated directly

---

## 6. Search & Filter

The `ContentSearchService` provides full-text search across all content types:

```typescript
interface ContentFilter {
  type?: ContentType[]
  skill?: ExerciseSkill[]
  topic?: string[]
  difficulty?: Difficulty[]
  tags?: string[]
  favorites?: boolean
  searchQuery?: string
}

interface ContentSearchResult {
  items: ContentItem[]
  total: number
  types: ContentType[]          // Types that matched
  suggestions?: string[]        // Search suggestions
}
```

Search indexes built-in and user-created content together, unified by the merge logic.

---

## 7. Content Import/Export

Content packs can be exported and imported separately from user data:

```typescript
interface ExportContentOptions {
  types: ContentType[]           // Which types to export
  includeUserEdits?: boolean     // Include user modifications
}

interface ImportContentOptions {
  mode: 'merge' | 'replace'     // How to handle conflicts
  validateOnly?: boolean        // Dry run for validation
}
```

### 7.1 Content Pack Format

```typescript
interface ContentPack {
  meta: {
    version: number
    appVersion: string
    exportedAt: string
    type: ContentType
    name: string
    description: string
  }
  items: ContentPackItem[]
}

interface ContentPackItem {
  id: string
  type: ContentType
  data: unknown                  // Type-specific content
  version: number
}
```

---

## 8. Built-in Content Organization

Each built-in module exports an array of content items and a metadata descriptor:

```typescript
// packages/content/src/built-in/grammar.ts
export const BUILT_IN_GRAMMAR_NOTES = [
  {
    id: 'grammar-tenses-001',
    topic: 'Present Perfect Tense',
    explanation: '...',
    exampleSentences: ['...'],
    commonMistakes: ['...'],
    difficulty: 'intermediate',
  },
  // ... more items
]
```

All packs are aggregated in `built-in/index.ts`:

```typescript
export const ALL_BUILT_IN_PACKS = {
  grammar: BUILT_IN_GRAMMAR_NOTES,
  reading: BUILT_IN_READING_PASSAGES,
  listening: BUILT_IN_LISTENING_TRANSCRIPTS,
  writing: BUILT_IN_WRITING_PROMPTS,
  speaking: BUILT_IN_SPEAKING_QUESTIONS,
  phrases: BUILT_IN_USEFUL_PHRASES,
  topics: BUILT_IN_IELTS_TOPICS,
}
```

---

## 9. Adding New Built-in Content

1. Create a new file in `packages/content/src/built-in/your-type.ts`
2. Define the content array with proper IDs (use `your-type-###` naming)
3. Define metadata in `ContentPackMeta` format
4. Add the export to `built-in/index.ts`
5. Add the content type to `ContentType` union in `types.ts`
6. Add a Zod schema in `schemas.ts`
7. Add the store to `migrations.ts` if needed
8. Add seed logic in `seeding.ts`
9. Write unit tests
