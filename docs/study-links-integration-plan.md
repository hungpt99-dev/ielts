# Study Links Tab — Integration Plan

## 1. Integration Points Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Extension Popup                           │
│                                                                  │
│  App.tsx                                                         │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  ViewState: 'studyLinks' added to union type              │   │
│  │  Conditional render: <StudyLinks onBack={...} />           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                          │ onNavigate('studyLinks')               │
│                          ▼                                        │
│  PopupDashboard.tsx                                               │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  ActionItem: 🔗 Study Links added to Quick Actions        │   │
│  │  onNavigate union extended with 'studyLinks'              │   │
│  └───────────────────────────────────────────────────────────┘   │
│                          │                                        │
│                          ▼                                        │
│  StudyLinks.tsx (NEW)                                             │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  Calls: studyLinkStore.ts CRUD functions                   │   │
│  │  State: links[], filters, modal, form                      │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Storage Layer (IndexedDB)                      │
│                                                                  │
│  indexedDB.ts                                                    │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  DB_VERSION: 1 → 2                                       │   │
│  │  onupgradeneeded: create 'studyLinks' store + indexes     │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  studyLinkStore.ts (NEW)                                         │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  CRUD: saveStudyLink, getAllStudyLinks, getStudyLinkById  │   │
│  │  updateStudyLink, deleteStudyLink, searchStudyLinks       │   │
│  │  getFavoriteStudyLinks, getStudyLinksByTag                │   │
│  │  importStudyLinks, exportStudyLinks                       │   │
│  │  Uses: studyLinkSchema validation (zod) on writes         │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               Daily Progress (chrome.storage.local)               │
│                                                                  │
│  On add/delete: increment/decrement a 'linksSaved' counter      │
│  in dailyProgress. Update PopupDashboard stats card.             │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Storage Integration

### 2.1 New File: `apps/extension/src/storage/studyLinkStore.ts`

Follows the exact same indexedDB CRUD pattern as `indexedDB.ts` and `vocabularyStore.ts`.

```typescript
// StudyLink type (shared from data model)
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

// DB config — same DB_NAME, separate store
const DB_NAME = 'ielts-journey-extension'
const DB_VERSION = 2   // bump from 1
const STORE_NAME = 'studyLinks'
```

### 2.2 Migration: `apps/extension/src/storage/indexedDB.ts`

Bump `DB_VERSION` from 1 to 2. Add `onupgradeneeded` block to create the `studyLinks` store (idempotent — `if (!db.objectStoreNames.contains(STORE_NAME))`).

### 2.3 No chrome.storage.local for study links

Study links use IndexedDB exclusively (rationale documented in study-links-data-model.md: queries, indexes, capacity). The only `chrome.storage.local` interaction is updating `dailyProgress.linksSaved` counter after add/delete operations.

## 3. API Integration

### 3.1 StudyLinkStore CRUD API (new module)

| Method | Signature | Description |
|--------|-----------|-------------|
| `saveStudyLink` | `(link: StudyLink): Promise<void>` | Insert or overwrite by id |
| `getAllStudyLinks` | `(): Promise<StudyLink[]>` | All links, sorted by createdAt desc |
| `getStudyLinkById` | `(id: string): Promise<StudyLink \| undefined>` | Single link lookup |
| `updateStudyLink` | `(id: string, updates: Partial<StudyLink>): Promise<void>` | Merge partial updates, bump updatedAt |
| `deleteStudyLink` | `(id: string): Promise<void>` | Remove by id |
| `searchStudyLinks` | `(query: string): Promise<StudyLink[]>` | Client-side filter on title+url+description |
| `getFavoriteStudyLinks` | `(): Promise<StudyLink[]>` | Indexed lookup on `isFavorite` |
| `getStudyLinksByTag` | `(tag: string): Promise<StudyLink[]>` | Multi-entry index lookup on `tags` |
| `importStudyLinks` | `(json: string): Promise<number>` | Bulk import, returns count imported |
| `exportStudyLinks` | `(): Promise<string>` | JSON export with version metadata |

### 3.2 UI Component API

**`StudyLinks` component** (new, `apps/extension/src/popup/components/StudyLinks.tsx`):
- Props: `onBack: () => void` (same pattern as `BackupRestore`, `MiniTutor`)
- No `onSaved` callback — this is a standalone tool view, not a form

### 3.3 DailyProgress Integration

A new field `linksSaved: number` is added to the `DailyProgress` interface (defined in `storage.ts` and `usePopupData.ts`). The `saveStudyLink` / `deleteStudyLink` functions will update this counter via `chrome.storage.local`.

## 4. Existing Extension Points Modified

| File | Change |
|------|--------|
| `apps/extension/src/popup/App.tsx` | Add `'studyLinks'` to `ViewState` union. Add conditional render block: `<StudyLinks onBack={() => setView('dashboard')} />` |
| `apps/extension/src/popup/components/PopupDashboard.tsx` | Add `'studyLinks'` to `onNavigate` parameter union. Add ActionItem: `icon: '🔗'`, `color: '#06b6d4'`, `label: 'Study Links'`, `description: 'Save and organize study links'` |
| `apps/extension/src/storage/indexedDB.ts` | Bump `DB_VERSION: 1 → 2`. Add `onupgradeneeded` handler to create `studyLinks` store with indexes (`byCreatedAt`, `byUrl`, `byFavorite`, `byTag`) |
| `apps/extension/src/services/storage.ts` | Add `linksSaved` field to `DailyProgress` interface (`wordsAdded`, `notesAdded`, etc.) |
| `apps/extension/src/popup/hooks/usePopupData.ts` | Add `linksSaved: 0` to `DEFAULT_PROGRESS`; update `DailyProgress` interface |

## 5. Data Flow Diagrams

### 5.1 Load Study Links

```
PopupDashboard → onNavigate('studyLinks')
       │
       ▼
App.tsx renders <StudyLinks onBack={...} />
       │
       ▼
StudyLinks useEffect → getAllStudyLinks()
       │
       ▼
studyLinkStore.ts → openDB() → transaction('studyLinks', 'readonly')
       │
       ▼
IndexedDB returns StudyLink[] → setState(links)
       │
       ▼
Component renders LinkList + StatsBar
```

### 5.2 Save a New Link

```
User fills LinkFormModal → clicks Save
       │
       ▼
StudyLinks validates with studyLinkSchema
       │
       ▼
studyLinkStore.saveStudyLink(link) → openDB() → put(link)
       │
       ▼
Update local state: setLinks(prev => [link, ...prev])
       │
       ├─→ Update dailyProgress.linksSaved via chrome.storage.local
       │
       └─→ Show success toast → close modal
```

### 5.3 Delete a Link

```
User clicks Delete → inline confirmation "Sure? Yes / No"
       │
       ▼
studyLinkStore.deleteStudyLink(id) → openDB() → delete(id)
       │
       ▼
Update local state: setLinks(prev => prev.filter(l => l.id !== id))
       │
       └─→ Update dailyProgress.linksSaved via chrome.storage.local
```

## 6. New Files Summary

| File Path | Purpose |
|-----------|---------|
| `apps/extension/src/storage/studyLinkStore.ts` | IndexedDB CRUD for StudyLink objects |
| `apps/extension/src/popup/components/StudyLinks.tsx` | Main tab component with state, filters, list, form modal |
| `docs/study-links-integration-plan.md` | This document |

## 7. Third-Party Dependencies

None. The integration uses only:
- `crypto.randomUUID()` — built-in (UUID generation)
- Google Favicons API — `https://www.google.com/s2/favicons?domain=...` (external, no key needed)
- Existing `zod` (already a project dependency for schema validation)
- Existing IndexedDB API (browser built-in)
- Existing `chrome.storage.local`, `chrome.tabs` APIs

## 8. Validation Checklist

- [ ] `studyLinkStore.ts` CRUD functions follow `indexedDB.ts` / `vocabularyStore.ts` patterns
- [ ] `indexedDB.ts` DB_VERSION bumped to 2, onupgradeneeded creates `studyLinks` store
- [ ] `ViewState` union in `App.tsx` includes `'studyLinks'`
- [ ] `PopupDashboardProps.onNavigate` parameter union includes `'studyLinks'`
- [ ] ActionItem added to Quick Actions list
- [ ] `DailyProgress` interface updated with `linksSaved` field
- [ ] `DEFAULT_PROGRESS` in both `storage.ts` and `usePopupData.ts` includes `linksSaved: 0`
- [ ] No new npm dependencies required
