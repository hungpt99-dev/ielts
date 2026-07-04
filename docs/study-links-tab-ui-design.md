# Study Links Tab — UI Component Design

## 1. Component Tree

```
StudyLinks                    (main view — full-page popup view)
├── Header                    (← Back + "Study Links" title + Add button)
├── FilterBar                 (search input + sort/tag filter row)
├── StatsBar                  (total / favorites / tag count chips)
├── LinkList                  (scrollable list of saved links)
│   └── LinkCard              (individual link entry)
│       ├── Favicon + LinkInfo  (title, url, description preview)
│       ├── TagList             (tag badges)
│       ├── MetaRow             (timestamp, favorite toggle, open link)
│       └── ExpandableActions   (Edit, Delete, copy URL)
└── LinkFormModal             (bottom-sheet modal for add/edit)
    ├── URL input (auto-fetches title + favicon)
    ├── Title input
    ├── Description textarea
    ├── Tags input (comma-separated, rendered as chips)
    └── Footer (Cancel + Save)
```

## 2. Props Interface

```typescript
interface StudyLinksProps {
  onBack: () => void       // Navigate back to dashboard
}
```

Follows the same pattern as `MistakeNotebookProps` — this view is a full-page tool view, so it receives `onBack` (not `onSaved`/`onCancel`).

## 3. State Management

### 3.1 Data State (in StudyLinks component)

| State Variable      | Type                    | Purpose                              |
|---------------------|-------------------------|--------------------------------------|
| `links`             | `StudyLink[]`           | Full list from IndexedDB             |
| `loading`           | `boolean`               | Initial load spinner                  |
| `error`             | `string \| null`        | Error message on load failure         |

### 3.2 Filter / Sort State

| State Variable      | Type                    | Purpose                              |
|---------------------|-------------------------|--------------------------------------|
| `search`            | `string`                | Filter by title/url/description      |
| `tagFilter`         | `string`                | Filter by selected tag ('' = all)    |
| `showFavoritesOnly` | `boolean`               | Toggle to show only favorites        |
| `sortBy`            | `'newest' \| 'oldest' \| 'title'` | Sort order              |

### 3.3 Modal / Interaction State

| State Variable      | Type                    | Purpose                              |
|---------------------|-------------------------|--------------------------------------|
| `modalOpen`         | `boolean`               | Bottom-sheet form visibility         |
| `editingLink`       | `StudyLink \| null`     | Non-null when editing existing entry |
| `form`              | `LinkFormData`          | Add/edit form fields                 |
| `saving`            | `boolean`               | Save button loading state             |
| `formError`         | `string \| null`        | Inline form validation error          |
| `deleteConfirm`     | `string \| null`        | ID of link pending deletion confirm  |
| `toast`             | `{message, type} \| null` | Toast notification                 |

### 3.4 Form Data Type

```typescript
interface LinkFormData {
  url: string
  title: string
  description: string
  tags: string            // Comma-separated string (parsed to string[] on save)
}
```

### 3.5 Derived State (useMemo)

| Variable             | Derivation                           |
|----------------------|--------------------------------------|
| `allTags`            | Unique tags across all links         |
| `filteredLinks`      | search + tagFilter + favoritesFilter + sort applied |
| `stats`              | Total count, favorites count, tags breakdown |

## 4. UI Layout (Wireframe)

```
┌────────────────────────────────┐
│ ← Back  Study Links    [+ Add] │  ← Header
├────────────────────────────────┤
│ 🔍 Search links...             │  ← Search input
│ [All tags ▼] [Newest ▼] [⭐]   │  ← Filter row
├────────────────────────────────┤
│ Links: 12    Favorites: 3      │  ← Stats row
├────────────────────────────────┤
│ ┌─ LinkCard ────────────────┐  │
│ │ 🔗 Example.com             │  │
│ │ How to use articles in B2  │  │
│ │ 📝 Brief note about link   │  │
│ │ #ielts #reading  ❤️  2m ago│  │
│ │ [Edit] [Delete] [Open]     │  │
│ └────────────────────────────┘  │
│ ┌─ LinkCard ────────────────┐  │
│ │ ...                        │  │  ← Scrollable list
│ └────────────────────────────┘  │
│ ...                             │
├────────────────────────────────┤
│ (Empty state when no links)    │
└────────────────────────────────┘
```

### Empty State

```
┌────────────────────────────────┐
│        🔗                      │
│   No study links yet           │
│   Save links from webpages     │
│   to build your study library  │
│         [Add Your First Link]  │
└────────────────────────────────┘
```

## 5. Add/Edit Modal (Bottom Sheet)

```
┌────────────────────────────────┐
│  ✕                             │
│  Add Study Link      (heading) │
│                                │
│  ┌─────────────────────────┐   │
│  │ URL *                   │   │  ← URL input
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Title                   │   │  ← Auto-filled from page
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Notes / Description     │   │  ← textarea
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Tags (comma separated)  │   │  ← tags input
│  └─────────────────────────┘   │
│  #ielts #reading #grammar      │  ← live tag chips preview
│                                │
│  ──────────────────────────    │
│      [Cancel]    [Save]        │  ← footer actions
└────────────────────────────────┘
```

### Auto-fetch Behavior

When the user types/pastes a URL and blurs the field:
1. Send a `fetch` request to the page URL (via background script or `fetch` with CORS fallback)
2. Parse `<title>` tag from HTML response
3. Auto-fill the **Title** field
4. Set favicon: `https://www.google.com/s2/favicons?domain=<domain>`
5. If fetch fails (CORS, timeout), leave title empty and show a subtle "Could not auto-fetch title" hint — user can type it manually

## 6. Component Responsibilities

### StudyLinks (Main)
- Initializes data load via `useEffect`
- Owns all state
- Renders header, filters, stats, link list, and modal
- Handles CRUD operations (save, update, delete)
- Computes derived data (filteredLinks, stats, allTags)

### LinkCard
- Receives: `link: StudyLink`, `onEdit`, `onDelete`, `onToggleFavorite`, `onOpen`
- Renders favicon, title, url, description preview (truncated), tags, timestamp
- Toggle expand for action buttons
- Show delete confirmation inline

### LinkFormModal
- Receives: `open`, `editingLink`, `form`, `onChange`, `onSave`, `onClose`, `saving`, `formError`
- Renders bottom-sheet overlay
- URL input with auto-fetch on blur
- Tag chips preview below tag input
- Validation before save

## 7. Styling Approach

Follow the exact inline `React.CSSProperties` pattern from `MistakeNotebook.tsx`:

- Use CSS custom properties from `index.css` (`--color-background`, `--color-primary`, `--color-surface`, `--color-border`, `--color-muted`, `--radius-md`, etc.)
- Same `backBtnStyle`, `actionBtnStyle(color)`, `inputStyle` helpers
- Bottom-sheet modal matching the existing mistake notebook modal pattern
- Same toast notification pattern

## 8. Integration Checklist

### Files to create:
- `apps/extension/src/storage/studyLinkStore.ts` — IndexedDB CRUD (follows the data model doc)
- `apps/extension/src/popup/components/StudyLinks.tsx` — Main component as designed above

### Files to modify:
- `apps/extension/src/popup/App.tsx` — Add `'studyLinks'` to `ViewState`, add conditional render block
- `apps/extension/src/popup/components/PopupDashboard.tsx` — Add `'studyLinks'` to `onNavigate` union type; add an `ActionItem` entry to the Quick Actions list (icon: `🔗`, color: `#06b6d4`, label: "Study Links", description: "Save and organize study links")

### Storage version bump:
- `apps/extension/src/storage/indexedDB.ts` — bump `DB_VERSION` and add `onupgradeneeded` handler for `studyLinks` store (already detailed in `study-links-data-model.md`)

## 9. Key Interaction Patterns

| Action | Behavior |
|--------|----------|
| **Add link** | Opens empty form modal. On save: validate URL, parse tags, generate UUID, save to IndexedDB, update local state, show success toast |
| **Edit link** | Opens form modal pre-filled. On save: merge with existing entry, update `updatedAt`, persist, update local state |
| **Delete link** | Inline "Sure? Yes / No" confirmation. On confirm: delete from IndexedDB, remove from local state |
| **Toggle favorite** | Optimistic UI update + `updateStudyLink(id, { isFavorite: !prev })` |
| **Open link** | `chrome.tabs.create({ url: link.url })` — opens in a new tab |
| **Copy URL** | `navigator.clipboard.writeText(link.url)` with toast confirmation |
| **Auto-fetch title** | On URL blur → fetch page → extract `<title>` → populate title field |
| **Filter by tag** | Dropdown of unique `allTags`; filtering happens client-side via useMemo |
| **Search** | Case-insensitive match on title + url + description |
