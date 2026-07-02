# Storage Design

> How the IELTS Learning Journey implements local-first persistent storage using IndexedDB with a repository pattern.

---

## 1. Overview

The storage layer is the foundation of the local-first architecture. All user data is persisted in the browser using **IndexedDB** (via the `idb` and `dexie` libraries), organized behind a **Repository Pattern** that cleanly separates data access from business logic.

**Two storage systems:**

| System | Purpose | Access Pattern |
|--------|---------|----------------|
| **IndexedDB** | Structured learning data (vocabulary, sessions, mistakes, etc.) | Async via repositories |
| **localStorage** | App settings (theme, AI config, preferences) | Synchronous |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  Feature Services · Hooks · Use Cases                   │
│  (import from repositories, not from DB directly)       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  REPOSITORY LAYER                        │
│  BaseRepository (generic CRUD + Zod validation)         │
│  ├── VocabularyRepository                               │
│  ├── MistakeRepository                                  │
│  ├── TaskRepository                                     │
│  ├── SessionRepository                                  │
│  ├── ProgressRepository                                 │
│  └── ContentRepository                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                         │
│  Dexie/IDB Wrapper (migrations, schema, connection)      │
│  ├── 27 object stores with indexes                      │
│  ├── Versioned migrations (v1–v4)                       │
│  └── Zod validation at write boundaries                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  BROWSER INDEXEDDB                       │
│  Database: ielts-journey                                 │
│  Origin-bound, async, structured storage                │
└─────────────────────────────────────────────────────────┘
```

### 2.1 Package Location

The storage layer lives in `packages/storage/` and is organized as:

```
packages/storage/src/
├── index.ts              # Public API barrel
├── db.ts                 # Database initialization (Dexie)
├── schema.ts             # Zod validation schemas (all entities)
├── migrations.ts         # Schema version definitions
├── errors.ts             # Storage-specific error classes
├── repositories/         # Repository implementations
│   ├── BaseRepository.ts # Generic CRUD with validation
│   ├── VocabularyRepository.ts
│   ├── MistakeRepository.ts
│   ├── TaskRepository.ts
│   ├── SessionRepository.ts
│   ├── ProgressRepository.ts
│   ├── ContentRepository.ts
│   └── index.ts
├── backup/               # Export/import utilities
├── reviewService.ts      # SM-2 spaced repetition
├── syncService.ts        # Extension-website sync
├── mistakeService.ts     # Mistake CRUD (extension context)
└── __tests__/            # Unit tests
```

---

## 3. Database Schema

**Database name:** `ielts-journey`
**Current version:** 4

### 3.1 Object Stores (27 total)

| Store | Description | Key Path |
|-------|-------------|----------|
| `vocabulary` | Vocabulary words with metadata | `id` |
| `vocabularyReviews` | SM-2 spaced repetition data | `id` |
| `tasks` | Daily study tasks | `id` |
| `readingSessions` | Reading practice sessions | `id` |
| `readingPracticeSessions` | Detailed reading practices | `id` |
| `listeningSessions` | Listening practice sessions | `id` |
| `listeningPracticeSessions` | Detailed listening practices | `id` |
| `writingSessions` | Writing practice sessions | `id` |
| `speakingSessions` | Speaking practice sessions | `id` |
| `grammarNotes` | Grammar topic notes | `id` |
| `mistakes` | Mistake notebook entries | `id` |
| `mockTests` | Mock test band scores | `id` |
| `topicsProgress` | Per-topic aggregated progress | `id` |
| `passages` | Saved reading passages | `id` |
| `ieltsTopics` | IELTS topic definitions | `id` |
| `exampleSentences` | Example sentence entries | `id` |
| `readingPassages` | Extended reading passages | `id` |
| `listeningTranscripts` | Listening transcripts | `id` |
| `writingPrompts` | Writing prompt entries | `id` |
| `speakingQuestions` | Speaking question entries | `id` |
| `studyNotes` | General study notes | `id` |
| `usefulPhrases` | Useful phrase entries | `id` |
| `aiContents` | AI-generated content cache | `id` |
| `customStudyPlans` | User-created study plans | `id` |
| `publicApiContent` | Public API imported content | `id` |
| `contentMeta` | Content metadata (versioning) | `id` |
| `userContentEdits` | User edits to built-in content | `id` |
| `progressRecords` | Daily progress records | `id` |

See [database-schema.md](database-schema.md) for detailed field definitions and indexes.

### 3.2 Migrations

Schema changes are managed through versioned migrations:

```typescript
// packages/storage/src/migrations.ts
const CURRENT_DB_VERSION = 4

// v1: Initial schema (12 stores)
// v2: Added 13 stores (extended content types)
// v3: Added publicApiContent store
// v4: Added contentMeta, userContentEdits stores
```

---

## 4. Repository Pattern

Every domain entity has a corresponding repository class that extends `BaseRepository`.

### 4.1 BaseRepository

```typescript
class BaseRepository<T extends { id: string }> {
  async findAll(options?: QueryOptions): Promise<T[]>
  async findById(id: string): Promise<T | null>
  async findByIdOrThrow(id: string): Promise<T>
  async create(input: unknown): Promise<T>            // validates with Zod
  async createReturningId(input: unknown): Promise<string>
  async update(id: string, data: Partial<T>): Promise<T>
  async patch(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<void>
  async count(): Promise<number>
  async exists(id: string): Promise<boolean>
  async bulkCreate(items: unknown[]): Promise<T[]>
  async bulkUpsert(items: T[]): Promise<void>
  async clear(): Promise<void>
  async queryByIndex(index: string, value: unknown): Promise<T[]>
  async findByDateRange(field: string, start: string, end: string): Promise<T[]>
  async searchByText(field: string, query: string): Promise<T[]>
}
```

### 4.2 Example: VocabularyRepository

```typescript
class VocabularyRepository extends BaseRepository<VocabularyWord> {
  constructor() {
    super('vocabulary', vocabularyEntrySchema)
  }

  async findByTopic(topic: string): Promise<VocabularyWord[]>
  async findByStatus(status: VocabularyStatus): Promise<VocabularyWord[]>
  async searchByWord(query: string): Promise<VocabularyWord[]>
  async findByDifficulty(difficulty: Difficulty): Promise<VocabularyWord[]>
}
```

### 4.3 Rules

- Components **never** call IndexedDB directly
- Feature services **always** go through repositories
- Every write validates data with a Zod schema
- Repositories throw typed `StorageError` on failure

---

## 5. Validation at Boundaries

All data is validated with Zod schemas at the repository boundary:

```
User Input → Feature Schema → Service → Repository Schema → IndexedDB
```

The `schema.ts` file defines Zod schemas for every entity. The `BaseRepository.create()` method validates input against the schema before writing to the database.

---

## 6. Spaced Repetition (SM-2)

The `reviewService.ts` implements the SM-2 algorithm for vocabulary review scheduling:

```typescript
function calculateNextReview(rating: ReviewRating, current: ReviewState): ReviewState {
  // Rating: Again(0), Hard(1), Good(2), Easy(3)
  // Calculates: interval, easeFactor, nextReviewDate
}
```

The `packages/storage/src/reviewService.ts` provides:
- `addVocabularyToReview()` — Creates initial review record
- `getDueReviews()` — Returns items due for review
- `updateReview()` — Updates review state after rating
- `getReviewStats()` — Aggregate review statistics

---

## 7. Settings Storage

App settings use `localStorage` for synchronous access:

```typescript
// Stored under key "app-settings"
interface AppSettings {
  targetBand: number       // default: 7.0
  currentBand: number      // default: 5.5
  examDate: string         // ISO date or empty
  dailyStudyMinutes: number
  weakSkills: string[]
  preferredTopics: string[]
  aiApiKey: string         // user-provided, never hard-coded
  aiProvider: string       // "openai" | "openai-compatible"
  aiEndpoint: string
  aiModel: string
  darkMode: boolean
  accentColor: string
  sampleDataLoaded: boolean
  onboardingCompleted: boolean
}
```

---

## 8. Error Handling

```typescript
// packages/storage/src/errors.ts
class StorageError extends Error    // Base storage error
class ValidationError extends Error  // Data validation failure
class MigrationError extends Error   // Schema migration failure
class BackupError extends Error      // Backup/restore failure
class EntityNotFoundError extends Error
class DuplicateEntityError extends Error
class DatabaseClosedError extends Error
```

All storage operations wrap errors in these typed classes. UI components catch them and display friendly messages with retry options.

---

## 9. Backup & Restore

The `backup/` module provides:

- `exportAllData()` — Reads all stores and produces a JSON blob
- `importBackup(data, mode)` — Imports with replace or merge mode
- `downloadBackup(data)` — Triggers browser file download
- `mergeBackupWithDedup(items, mode)` — Duplicate-aware merge

Both export and import validate all data against Zod schemas.

---

## 10. Extension Storage Bridge

The extension maintains a separate IndexedDB database (`ielts-journey-extension`) at its own origin. The `syncService.ts` module provides a bridge protocol for synchronization:

- `exportExtensionData()` — Reads extension stores
- `importExtensionData()` — Writes to extension stores
- Bridge protocol via `window.postMessage` when website tab is open

---

## 11. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Dexie (not raw idb) | Dexie provides a cleaner API, indexable stores, and built-in versioning |
| Repository Pattern | Isolates DB implementation, enables testing with fake IndexedDB |
| Zod validation at write | Prevents corrupted data from entering the database |
| Two storage systems | localStorage for fast sync reads, IndexedDB for structured async data |
| Versioned migrations | Safe schema evolution without data loss |
| Typed errors | Callers can handle specific failures (not found, duplicate, DB closed) |
