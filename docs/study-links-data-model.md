# Study Links Tab — Data Model & Storage Schema

## Overview

The Study Links tab lets users save web links (URLs, pages, resources) for study reference. Links persist in the extension's IndexedDB database under a dedicated object store, following the same patterns as `learningEntries`.

---

## Data Model

### StudyLink — TypeScript Interface

```typescript
interface StudyLink {
  id: string           // UUID (crypto.randomUUID())
  url: string          // The saved URL (validated)
  title: string        // Page title (auto-fetched or user-edited)
  description: string  // User's notes / description of why this link is useful
  favicon: string      // Favicon URL (https://www.google.com/s2/favicons?domain=...)
  tags: string[]       // User-defined tags for filtering
  isFavorite: boolean  // Bookmark/favorite flag
  createdAt: string    // ISO 8601 timestamp
  updatedAt: string    // ISO 8601 timestamp
}
```

### Zod Schema (for validation at write boundaries)

```typescript
import { z } from 'zod'

export const studyLinkSchema = z.object({
  id: z.string().min(1),
  url: z.string().url('Must be a valid URL'),
  title: z.string().default(''),
  description: z.string().default(''),
  favicon: z.string().default(''),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  createdAt: z.string().refine(v => !isNaN(Date.parse(v)), 'Invalid ISO date'),
  updatedAt: z.string().refine(v => !isNaN(Date.parse(v)), 'Invalid ISO date'),
})

export type StudyLink = z.infer<typeof studyLinkSchema>
```

### Field Reference

| Field        | Type        | Required | Default  | Description                                |
|--------------|-------------|----------|----------|--------------------------------------------|
| `id`         | `string`    | yes      | —        | UUID generated at creation                 |
| `url`        | `string`    | yes      | —        | The saved URL; validated as a proper URL   |
| `title`      | `string`    | no       | `''`     | Page title, auto-fetched or user-provided  |
| `description`| `string`    | no       | `''`     | User's notes or summary of the link        |
| `favicon`    | `string`    | no       | `''`     | URL to the site's favicon                  |
| `tags`       | `string[]`  | no       | `[]`     | User-defined tags for categorization       |
| `isFavorite` | `boolean`   | no       | `false`  | Marks a link as a favorite/bookmark        |
| `createdAt`  | `string`    | yes      | —        | ISO 8601 timestamp of creation             |
| `updatedAt`  | `string`    | yes      | —        | ISO 8601 timestamp of last update          |

### Indexes

| Index Name     | Field       | Unique | Purpose                          |
|----------------|-------------|--------|----------------------------------|
| (primary key)  | `id`        | yes    | Default key path                 |
| `byCreatedAt`  | `createdAt` | no     | Sort by newest/oldest            |
| `byUrl`        | `url`       | no     | Deduplicate / find by URL        |
| `byFavorite`   | `isFavorite`| no     | Filter favorites                 |
| `byTag`        | `tags`      | no     | Filter by tag (multi-entry)      |

---

## Storage Location: Extension IndexedDB

**Database:** `ielts-journey-extension` (existing extension DB)
**Object store:** `studyLinks`

The same IndexedDB already holds `learningEntries`, `vocabulary`, and `mistakes` stores — `studyLinks` is a new store alongside them, using the same `id` keyPath pattern.

### Why IndexedDB (not `chrome.storage.local`)

| Criterion            | chrome.storage.local        | IndexedDB (extension DB)          |
|----------------------|-----------------------------|-----------------------------------|
| Capacity             | ~5–10 MB (browser quota)    | Unbounded (disk-based)            |
| Query/index support  | None (full read + filter)   | Indexed queries, ranges, cursors  |
| Tag filtering        | O(n) in-memory filter       | Index-driven lookup               |
| Favicon storage      | Not suitable (binary)       | Blob storage available            |
| Existing integration | Already used for `savedItems`| Already used for structured data  |

A dedicated store avoids mixing link data into the `learningEntries` schema (which expects a `text` field as primary content), keeping each data type clean.

---

## Storage Service API

### File: `apps/extension/src/storage/studyLinkStore.ts`

```typescript
// CRUD operations following the existing pattern in index.ts

async function saveStudyLink(link: StudyLink): Promise<void>
async function getAllStudyLinks(): Promise<StudyLink[]>
async function getStudyLinkById(id: string): Promise<StudyLink | undefined>
async function updateStudyLink(id: string, updates: Partial<StudyLink>): Promise<void>
async function deleteStudyLink(id: string): Promise<void>
async function searchStudyLinks(query: string): Promise<StudyLink[]>
async function getFavoriteStudyLinks(): Promise<StudyLink[]>
async function getStudyLinksByTag(tag: string): Promise<StudyLink[]>
async function importStudyLinks(json: string): Promise<number>
async function exportStudyLinks(): Promise<string>
```

Each function mirrors the existing `indexedDB.ts` pattern (`openDB`, transaction, promise wrapper) and validates data with `studyLinkSchema` on writes.

---

## Schema Version (IndexedDB Migration)

The existing extension DB version (`DB_VERSION = 1`) needs a bump to `2`:

```typescript
const DB_NAME = 'ielts-journey-extension'
const DB_VERSION = 2   // was 1
const STORE_NAME = 'learningEntries'
const LINK_STORE_NAME = 'studyLinks'  // new store

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      // Existing store (unchanged)
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('category', 'category', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        store.createIndex('topic', 'topic', { unique: false })
        store.createIndex('skill', 'skill', { unique: false })
        store.createIndex('status', 'status', { unique: false })
      }
      // New store for study links
      if (!db.objectStoreNames.contains(LINK_STORE_NAME)) {
        const store = db.createObjectStore(LINK_STORE_NAME, { keyPath: 'id' })
        store.createIndex('byCreatedAt', 'createdAt', { unique: false })
        store.createIndex('byUrl', 'url', { unique: false })
        store.createIndex('byFavorite', 'isFavorite', { unique: false })
        store.createIndex('byTag', 'tags', { unique: false, multiEntry: true })
      }
    }
    // ...
  })
}
```

Key migration detail: using `multiEntry: true` on `byTag` so an array of tags expands into multiple index entries (allowing indexed lookup by a single tag).

---

## Future: Shared Dexie DB (Web App)

If study links should also appear in the web app, add a `studyLinks` table to the shared Dexie DB (`packages/storage/src/schema.ts`) following the same pattern as existing content entities:

1. Add a `studyLinkSchema` Zod schema in `packages/storage/src/schema.ts`
2. Create a `StudyLinkRepository extends BaseRepository<StudyLink>` in `packages/storage/src/repositories/`
3. Register the table in `packages/storage/src/db.ts`
4. Bump the Dexie migration version

The extension-to-web sync can reuse the existing `syncService.ts` bridge protocol.

---

## Comparison to Existing Models

| Aspect                | `LearningEntry` (indexedDB.ts)   | `StudyLink` (proposed)            |
|-----------------------|----------------------------------|-----------------------------------|
| Primary content       | `text` (saved selection)         | `url` (bookmarked link)           |
| Categories            | `SaveCategory` enum              | Tags only (free-form)             |
| Page metadata         | `pageTitle`, `pageUrl`           | `title`, `url`, `favicon`         |
| Notes                 | `personalNote`                   | `description`                     |
| Favorite flag         | No                               | `isFavorite: boolean`             |
| Storage               | `learningEntries` store          | `studyLinks` store                |
