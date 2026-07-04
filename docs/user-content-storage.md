# User Content Storage — Data Models & APIs

## Architecture Overview

User-generated content is stored across two layers:

```
Extension (apps/extension/)
  ├── chrome.storage.local     — savedItems, dailyProgress, settings
  └── IndexedDB (ielts-journey-extension)
        ├── learningEntries    — LearningEntry (text, category, tags, page info)
        └── vocabulary         — ExtensionVocabEntry (word, meaning, review state)

Shared Dexie DB (packages/storage/)
  └── Tables via BaseRepository<T>
        ├── userContentEdits   — UserContentEdit (tracks edits to built-in content)
        ├── contentMeta        — ContentMeta (seeding metadata)
        ├── studyNotes         — StudyNote
        ├── vocabulary         — (full vocab with SRS)
        └── ... (ieltsTopics, readingPassages, etc.)
```

---

## Data Models

### 1. LearningEntry (Extension — IndexedDB)
**File:** `apps/extension/src/types.ts:37`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `text` | `string` | Saved text content |
| `category` | `'vocabulary' \| 'phrase' \| 'sentence' \| 'grammar' \| 'reading' \| 'writing' \| 'speaking' \| 'mistake'` | Content category |
| `topic` | `string` | Topic label |
| `skill` | `string` | Related skill (vocabulary, grammar, reading, etc.) |
| `difficulty` | `string` | `'easy' \| 'medium' \| 'hard' \| ''` |
| `tags` | `string[]` | User-defined tags |
| `personalNote` | `string` | User note |
| `pageTitle` | `string` | Source page title |
| `pageUrl` | `string` | Source page URL |
| `status` | `string` | Learning status |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp |

### 2. UserContentEdit (Shared — Dexie)
**File:** `packages/storage/src/schema.ts:427`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `originalId` | `string` | ID of the original built-in content |
| `userItemId` | `string` | ID of the user's copy in the target table |
| `contentType` | `string` | Type of content (e.g. `'reading-passage'`) |
| `tableName` | `string` | Dexie table name (e.g. `'readingPassages'`) |
| `editedAt` | `string` | ISO timestamp |
| `createdAt` | `string` | ISO timestamp |

### 3. ContentMeta (Shared — Dexie)
**File:** `packages/storage/src/schema.ts:417`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `packId` | `string` | ID of the content pack |
| `packName` | `string` | Human-readable pack name |
| `packVersion` | `number` | Seeded version |
| `contentCount` | `number` | Number of items |
| `seededAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp |

### 4. ExtensionVocabEntry (Extension — IndexedDB)
**File:** `apps/extension/src/storage/vocabularyStore.ts:3`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `word` | `string` | The vocabulary word |
| `meaning` | `string` | Definition |
| `meaningVi` | `string` | Vietnamese translation |
| `sourceSentence` | `string` | Sentence where word was found |
| `pageTitle` | `string` | Source page title |
| `pageUrl` | `string` | Source page URL |
| `topic` | `string` | Topic |
| `difficulty` | `'easy' \| 'medium' \| 'hard' \| ''` | Difficulty |
| `status` | `'new' \| 'learning' \| 'reviewing' \| 'mastered'` | SRS status |
| `addedToReview` | `boolean` | Whether added to review queue |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp |

### 5. StudyNote (Shared — Dexie)
**File:** `packages/storage/src/schema.ts:314`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `title` | `string` | Note title |
| `content` | `string` | Note body |
| `topic` | `string` | Topic |
| `skill` | `string` | Skill |
| `tags` | `string[]` | Tags |
| `isFavorite` | `boolean` | Favorite flag |
| `isDraft` | `boolean` | Draft flag |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp |

---

## Storage APIs

### Extension Layer (`apps/extension/src/storage/`)

#### IndexedDB (`indexedDB.ts`)
| Function | Description |
|---|---|
| `saveEntry(entry)` | Save a LearningEntry |
| `getAllEntries()` | Get all entries |
| `getTodayEntries()` | Get entries created today |
| `getEntriesByCategory(category)` | Filter by category |
| `updateEntry(id, updates)` | Partial update |
| `deleteEntry(id)` | Delete by ID |
| `searchEntries(query)` | Full-text search on text, topic, pageTitle, tags |
| `getStats()` | Counts: total, byCategory, todayCount |

#### chrome.storage API (`services/storage.ts`)
| Function | Description |
|---|---|
| `getSavedItems<T>()` | Get all saved items array |
| `addSavedItem<T>(item)` | Prepend item to saved items array |
| `getDailyProgress()` | Get daily progress stats |
| `updateDailyProgress(patch)` | Update daily progress |
| `incrementDailyProgress(field)` | Increment a progress field |

#### Vocabulary Store (`vocabularyStore.ts`)
| Function | Description |
|---|---|
| `saveVocabularyEntry(entry)` | Save a vocabulary entry |
| `getAllVocabulary()` | Get all vocabulary |
| `updateVocabularyEntry(id, updates)` | Partial update |
| `deleteVocabularyEntry(id)` | Delete by ID |
| `getVocabularyDueForReview()` | Get entries flagged for review |

---

### Shared Dexie Layer (`packages/content/src/`)

#### UserContentService (`userContent.ts`)
| Method | Description |
|---|---|
| `editBuiltInContent(input)` | Create/edit user copy of built-in content |
| `getEffectiveItems<T>(tableName, filter?)` | Get merged built-in + user-edited items |
| `getEffectiveItem<T>(tableName, itemId)` | Get single item (with user edit overlay) |
| `revertToBuiltIn(originalId)` | Delete user edit, restore built-in |
| `deleteUserEdit(editId)` | Delete a user edit |
| `searchUserContent<T>(tableName, filter)` | Paginated search with filtering |
| `getUserEditsForTable(tableName)` | Get all edits for a table |

#### ContentSearchService (`search.ts`)
| Method | Description |
|---|---|
| `search<T>(tableName, filter)` | Search with ContentFilter |
| `searchAll<T>(filter)` | Search across all built-in tables |
| `applyFilter<T>(items, filter)` | In-memory filter pipeline |
| `searchByTags / searchByTopic / searchBySkill / searchByDifficulty` | Convenience methods |

#### BaseRepository<T> (`packages/storage/src/repositories/BaseRepository.ts`)
| Method | Description |
|---|---|
| `findAll()` | Get all items |
| `findById(id)` | Get by ID |
| `create(item)` | Create with auto-ID and timestamps |
| `update(id, changes)` | Partial update |
| `delete(id)` | Delete by ID |
| `queryByIndex(index, value)` | Query by indexed field |
| `searchByText(query, fields)` | Text search on specified fields |

---

## Reusable Patterns for New "Saved Links" Tab

### 1. ContentFilter Pattern
**File:** `packages/content/src/types.ts:41`

Extend or reuse `ContentFilter` for the new tab's query/filter model:
```ts
interface ContentFilter {
  query?: string
  tags?: string[]
  isFavorite?: boolean
  page?: number
  pageSize?: number
  // Existing fields like contentType, skill, topic, difficulty
}
```

### 2. LearningEntry as the Base Model
The existing `LearningEntry` already stores `pageTitle` and `pageUrl` — ideal for saved links. A new tab can:
- Add a `'link'` or `'bookmark'` category to `SAVE_CATEGORIES`
- Store links using the same `entrySchema` validated structure
- Use existing `saveEntry()` / `getAllEntries()` / `searchEntries()` APIs

### 3. SaveItemPayload Pattern
**File:** `apps/extension/src/background/messaging.ts:10`

```ts
interface SaveItemPayload {
  category: SaveCategory
  text: string
  pageTitle: string
  pageUrl: string
  topic?: string
  skill?: string
  tags?: string[]
  note?: string
}
```

Already supports messaging from content scripts to background. Add a `link` category to enable saving links directly.

### 4. BaseRepository + Zod Schema (for shared Dexie storage)
If saved links should be stored in the shared Dexie DB (not just extension):
1. Define a Zod schema (e.g. `savedLinkSchema`) in `packages/storage/src/schema.ts`
2. Create a `SavedLinkRepository extends BaseRepository<SavedLink>` in `packages/storage/src/repositories/ContentRepository.ts`
3. Register the table in the Dexie schema maps (both packages and web app)
4. Expose CRUD through existing services

### 5. Tab UI Pattern (Extension Popup)
The popup uses a tab pattern (see `apps/web/src/pages/PublicApiImportPage.tsx`):
```tsx
type Tab = 'dashboard' | 'save' | 'saved-links'
const [activeTab, setActiveTab] = useState<Tab>('dashboard')
```

The existing `PopupDashboard` component can be extended with a tab bar that navigates between Dashboard, Save Text, and the new Saved Links tab.
