# Study Links Tab — User Interaction Flows

## Overview

This document defines detailed step-by-step user interaction flows for every action within the Study Links tab, including error handling, edge cases, and state transitions.

---

## 1. Flow: Open Study Links Tab

```
User clicks "Study Links" action card on PopupDashboard
  │
  ▼
onNavigate('studyLinks') → App.tsx sets view='studyLinks'
  │
  ▼
<StudyLinks onBack={() => setView('dashboard')}> mounts
  │
  ▼
useEffect calls getAllStudyLinks()
  │
  ▼
studyLinkStore.ts → openDB() → transaction('studyLinks', 'readonly') → getAll()
  │
  ├── Success → setLinks(result), setLoading(false)
  │             ├── links.length > 0 → render LinkList
  │             └── links.length === 0 → render EmptyState
  │
  └── Failure → setError('Failed to load study links'), setLoading(false)
                ↓
                Render error state with retry button
```

### States

| State | Render | User Can |
|-------|--------|----------|
| Loading | Spinner / skeleton | Wait |
| Empty | 🔗 illustration + "No study links yet" + `[Add Your First Link]` | Tap Add |
| List | Scrollable LinkCards + StatsBar | Interact with items |
| Error | Error message + `[Retry]` button | Tap Retry → re-run load |

### Edge Cases

- **IndexedDB not available**: `openDB()` throws → caught in try/catch → `setError` → retry button shown
- **DB version mismatch**: Migration runs on `onupgradeneeded`; if migration fails, entire transaction aborts → error state
- **Zero links, first visit**: Empty state is shown; no flicker since `loading` prevents render until complete

---

## 2. Flow: Add a New Link

```
User taps [+ Add] button in Header
  │
  ▼
setModalOpen(true), setEditingLink(null), form reset to default
  │
  ▼
LinkFormModal slides up (bottom sheet overlay)
  │
  ▼
┌──────────────────────────────────────────────┐
│ User fills fields:                            │
│                                              │
│ (1) URL * (required)                         │
│     └── On blur: auto-fetch title + favicon  │
│                                              │
│ (2) Title (optional, auto-filled from URL)   │
│                                              │
│ (3) Description/Notes (optional, textarea)   │
│                                              │
│ (4) Tags (optional, comma-separated)         │
│     └── Live preview tag chips below input   │
│                                              │
│ (5) Tap [Save]                               │
└──────────────────────────────────────────────┘
  │
  ▼
Client-side validation (before any async op):
  ├── URL empty? → setFormError('URL is required') → stop
  ├── Invalid URL? → setFormError('Please enter a valid URL (https://...)') → stop
  └── Passes validation → proceed
  │
  ▼
Set saving=true, clear formError
  │
  ▼
Create StudyLink object:
  id = crypto.randomUUID()
  url = validated URL (normalized: trim, ensure http/https)
  title = title field (or extracted from page title, or '')
  description = description field
  favicon = `https://www.google.com/s2/favicons?domain=<domain>`
  tags = parse comma-separated string → trimmed, de-duped, lowercased
  isFavorite = false
  createdAt = new Date().toISOString()
  updatedAt = same as createdAt
  │
  ▼
Validate entire object with studyLinkSchema
  ├── Schema fails → setFormError('Invalid data, please check your entries') → stop
  └── Schema passes → proceed
  │
  ▼
saveStudyLink(link) → openDB() → put(link)
  │
  ├── Success:
  │     setLinks(prev => [link, ...prev])
  │     incrementDailyProgress({ linksSaved: current + 1 })
  │     setToast({ message: 'Link saved!', type: 'success' })
  │     setModalOpen(false)
  │     setSaving(false)
  │
  └── Failure:
        setFormError('Failed to save link. Please try again.')
        setSaving(false)
```

### Error Handling for URL Auto-Fetch

```
On URL blur:
  │
  ▼
Extract domain from URL
  │
  ▼
Set favicon immediately: `https://www.google.com/s2/favicons?domain=<domain>`
  │
  ▼
fetch(url, { mode: 'cors', signal: AbortSignal.timeout(5000) })
  │
  ├── Response OK → parse HTML → extract <title> → set title field
  │
  ├── CORS error → title stays empty → show subtle hint "Could not auto-fetch title"
  │
  ├── Timeout → title stays empty → no error shown (silent fallback)
  │
  └── Invalid URL → no fetch attempted → title stays empty
```

### Edge Cases

- **URL without protocol**: Prepend `https://` before validation; store normalized URL
- **Duplicate URL**: Allow duplicates (user may want to save same page with different notes); no dedup enforced
- **Very long URL**: Truncate display in LinkCard but store full URL
- **Rapid double-tap Save**: `saving=true` disables the button immediately; second tap is no-op
- **Empty tags string**: Parse to `[]` (not `['']`)
- **Tags with extra spaces**: `'ielts , reading '` → trimmed to `['ielts', 'reading']`
- **Tags with uppercase**: Normalized to lowercase → `'IELTS'` stored as `'ielts'`
- **Special characters in URL (Unicode)**: `new URL()` handles punycode; store as-is

---

## 3. Flow: Edit Notes / Description

```
User expands LinkCard → taps [Edit]
  │
  ▼
setEditingLink(link), setForm pre-filled with current values
  │
  ▼
LinkFormModal opens (same bottom sheet) with:
  - URL field → disabled / read-only (cannot change URL)
  - Title → editable
  - Description → editable, cursor in this field if "edit notes"
  - Tags → editable
  │
  ▼
User modifies fields → on change, update form state
  │
  ▼
User taps [Save]
  │
  ▼
Client-side validation:
  ├── Title can be empty (cleared → saved as '')
  └── Other fields are optional → always passes
  │
  ▼
Build updates object (only changed fields, compute diff):
  const updates: Partial<StudyLink> = {}
  if (form.title !== editingLink.title) updates.title = form.title
  if (form.description !== editingLink.description) updates.description = form.description
  if (form.tags !== editingLink.tags) updates.tags = parseTags(form.tags)
  │
  ▼
If updates is empty → no-op, close modal
  │
  ▼
If updates is non-empty:
  updates.updatedAt = new Date().toISOString()
  │
  ▼
updateStudyLink(id, updates) → openDB() → transaction('studyLinks', 'readwrite') → get(id) → merge → put
  │
  ├── Success:
  │     Update local state: setLinks(prev => prev.map(l => l.id === id ? {...l, ...updates} : l))
  │     setToast({ message: 'Link updated', type: 'success' })
  │     setModalOpen(false), setEditingLink(null)
  │
  └── Failure (e.g. link was deleted by another context):
        setFormError('Could not update: link no longer exists. Refresh the list.')
        setModalOpen(false)
        // Trigger a refresh
        getAllStudyLinks() → setLinks
```

### Edge Cases

- **User opens edit, then modifies nothing, then saves**: Detect no changes → no-op close (no DB write)
- **User opens edit, navigates away (popup closes)**: Modal is unmounted; no partial state persisted (safe)
- **Editing a link that was deleted by another window**: `get(id)` returns undefined → error path above
- **Very long description (10k+ chars)**: Storage accepts it; UI truncates display at 3 lines with "Show more"

---

## 4. Flow: Tag Management

### 4a. Add Tags While Saving/Editing

Part of the Add/Edit flow above. Tags are entered as comma-separated text and parsed on save.

### 4b. Filter by Tag

```
User taps tag filter dropdown [All tags ▼]
  │
  ▼
Dropdown shows:
  - "All tags" (default)
  - Divider
  - Each unique tag from allTags (sorted alphabetically)
    e.g. "#grammar", "#ielts", "#listening", "#reading", "#vocabulary"
  │
  ▼
User selects a tag → setTagFilter(selectedTag)
  │
  ▼
useMemo recomputes filteredLinks:
  links
    .filter(l => tagFilter === '' || l.tags.includes(tagFilter))
    .filter(l => !showFavoritesOnly || l.isFavorite)
    .filter(l => search === '' || matchesSearch(l, search))
    .sort(...)
  │
  ▼
LinkList re-renders with filtered subset
  │
  ├── Result is non-empty → render filtered list
  └── Result is empty → "No links match this filter" message
```

### 4c. Remove a Tag (via Edit)

```
User edits a link → in Tag input, removes a tag from the comma-separated list
  → e.g. "ielts, reading, grammar" → "ielts, grammar"
  │
  ▼
On save: parseTags → ['ielts', 'grammar']
  │
  ▼
updateStudyLink updates tags → IndexedDB updated
  │
  ▼
LinkCard shows updated TagList
  │
  ▼
If removed tag no longer appears on ANY link → it disappears from tagFilter dropdown
```

### Edge Cases

- **No tags on any link**: Filter dropdown shows only "All tags" (or hidden entirely)
- **Many tags (20+)**: Dropdown is scrollable; alphabetical ordering helps scanning
- **Tag with special characters**: Tags are validated to be non-empty strings; special chars allowed
- **Clicking a tag badge on LinkCard**: Shortcut to filter by that tag → setTagFilter(tag)
- **Clearing tag filter**: Select "All tags" → setTagFilter('')

---

## 5. Flow: Delete a Link

```
User expands LinkCard → taps [Delete]
  │
  ▼
Inline confirmation appears INSIDE the LinkCard (or a small confirmation bar):
  ┌─────────────────────────────────┐
  │ "Delete this link?"             │
  │ [Cancel]  [Yes, Delete]   🗑️   │
  └─────────────────────────────────┘
  │
  ├── User taps [Cancel] → hide confirmation, return to normal card view
  │
  └── User taps [Yes, Delete]:
        │
        ▼
        deleteStudyLink(id) → openDB() → transaction('studyLinks', 'readwrite') → delete(id)
        │
        ├── Success:
        │     setLinks(prev => prev.filter(l => l.id !== id))
        │     decrementDailyProgress({ linksSaved: current - 1 }) (or refresh)
        │     setToast({ message: 'Link deleted', type: 'success' })
        │     setDeleteConfirm(null)  // clear pending confirm
        │
        └── Failure (e.g. IndexedDB error):
              setToast({ message: 'Failed to delete. Please try again.', type: 'error' })
              setDeleteConfirm(null)
```

### Edge Cases

- **Delete last link**: After deletion, `links.length === 0` → EmptyState renders
- **Delete while tag filter active**: Deleted link is removed from local state; if no links match the tag filter, show "No links match this filter"
- **Delete a link that's currently being edited in another window**: Not possible (popup is single-instance)
- **Accidental delete**: Inline confirmation requires explicit "Yes, Delete" — Cancel is the easy/close button
- **Rapid double-tap Delete**: `deleteConfirm` state prevents second confirmation from appearing

---

## 6. Flow: View Details / Expand a LinkCard

```
User taps on a LinkCard (non-action area)
  │
  ├── (a) If card is collapsed → toggle to expanded view
  │
  └── (b) If card is expanded → toggle to collapsed view
```

### Collapsed Card (Default)

```
┌──────────────────────────────────────┐
│ [Favicon] Example.com                │
│           How to use articles in B2   │  ← title (1 line, ellipsis)
│           📝 Brief note...           │  ← description (1-2 lines truncated)
│           #ielts #reading    ❤️ 2m ago│  ← tags + favorite + timestamp
└──────────────────────────────────────┘
```

### Expanded Card

```
┌──────────────────────────────────────┐
│ [Favicon] Example.com                │
│           How to use articles in B2   │
│           https://example.com/article │  ← full URL shown
│                                      │
│ 📝 Notes:                            │
│ Brief note about link. This can be    │
│ several paragraphs of user notes.     │
│                                      │
│ #ielts #reading #grammar             │
│                                      │
│ Saved: Jun 15, 2026   Updated: 2d ago│
│                                      │
│ [Open] [Copy URL] [Edit] [Delete]    │  ← action buttons
└──────────────────────────────────────┘
```

### States

| Card State | Triggers | Shows |
|------------|----------|-------|
| Collapsed | Default; tap to expand | Title (1 line), description (2 lines truncated), tags, timestamp, favorite icon |
| Expanded | Tap card body | Full title, full URL, full description, all tags, full timestamps, action row |
| Action (delete confirm) | Tap [Delete] in expanded card | Delete confirmation bar replaces action row |

### Edge Cases

- **No description**: "📝 Notes:" section is hidden entirely in expanded state
- **No tags**: Tag row hidden entirely
- **Very long title (100+ chars)**: Truncated in collapsed (1 line), wraps in expanded
- **Very long URL**: Full URL shown in expanded (wraps); in collapsed, domain only
- **Favicon fails to load**: `onerror` handler → show generic globe icon as fallback

---

## 7. Flow: Toggle Favorite

```
User taps the favorite icon (❤️/🖤) on LinkCard
  │
  ▼
Optimistic UI update:
  const newValue = !link.isFavorite
  setLinks(prev => prev.map(l => l.id === link.id ? {...l, isFavorite: newValue} : l))
  │
  ▼
Background: updateStudyLink(id, { isFavorite: newValue, updatedAt: new Date().toISOString() })
  │
  ├── Success: no-op (UI already updated)
  │
  └── Failure: revert optimistic update
        setLinks(prev => prev.map(l => l.id === link.id ? {...l, isFavorite: !newValue} : l))
        setToast({ message: 'Failed to update favorite', type: 'error' })
```

### States

| isFavorite | Icon | Behavior |
|------------|------|----------|
| `false` | 🖤 (outline heart) | Tap → set to true (filled) |
| `true` | ❤️ (filled heart) | Tap → set to false (outline) |

### Edge Cases

- **Rapid toggle**: Each tap triggers optimistic update + background write; last state wins
- **Toggle while offline**: Optimistic update still works; IndexedDB write succeeds (local-first)
- **Toggle + filter by favorites only**: If `showFavoritesOnly=true` and user unfavorites a link, it disappears from the list immediately (optimistic update filter re-runs)

---

## 8. Flow: Search

```
User types in search input 🔍
  │
  ▼
setSearch(value) (controlled input, debounced by 200ms)
  │
  ▼
useMemo re-filters links:
  search term is lowercased
  link.title.toLowerCase().includes(search) ||
  link.url.toLowerCase().includes(search) ||
  link.description.toLowerCase().includes(search)
  │
  ▼
LinkList re-renders with search results
  │
  ├── Matches found → show filtered list
  │
  └── No matches → "No links matching 'search term'" + clear search button
```

### Edge Cases

- **Empty search**: Show all links (respecting other active filters)
- **Search while tag filter active**: Both filters apply (AND logic)
- **Search while favorites-only active**: All three filters apply (AND)
- **Very long search term (>100 chars):** Acceptable; matches are rare
- **Special regex chars** (`.`, `*`, `+`): Simple `includes()` not regex — no injection risk
- **IME / CJK input**: `compositionstart`/`compositionend` events respected; debounce only fires after composition ends

---

## 9. Flow: Open Link in New Tab

```
User taps [Open] on expanded LinkCard
  │
  ▼
chrome.tabs.create({ url: link.url, active: true })
  │
  ├── Success: New tab opens with the saved URL; popup stays open
  │
  └── Error (invalid URL stored, chrome API error):
        setToast({ message: 'Could not open link', type: 'error' })
```

### Edge Cases

- **Chrome blocks opening**: Some chrome API restrictions (e.g., incognito); toast shown
- **URL with fragment/hash**: Preserved as-is
- **javascript: or chrome: URLs**: Validation on save prevents these; schema rejects non-http(s) URLs

---

## 10. Flow: Copy URL

```
User taps [Copy URL] on expanded LinkCard
  │
  ▼
navigator.clipboard.writeText(link.url)
  │
  ├── Success → setToast({ message: 'URL copied!', type: 'success' })
  │
  └── Failure (permission denied, insecure context) → fallback:
        const textarea = document.createElement('textarea')
        textarea.value = link.url
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setToast({ message: 'URL copied!', type: 'success' })
```

### Edge Cases

- **Clipboard API unavailable**: Fallback to `execCommand('copy')` (deprecated but still works in extension context)
- **Extension popup losing focus**: Clipboard write works synchronously; popup focus is irrelevant
- **Copy in insecure context**: Extension pages are treated as secure contexts → clipboard API should work

---

## 11. Flow: Sort Links

```
User taps sort dropdown [Newest ▼]
  │
  ▼
Dropdown options:
  - Newest first (default)
  - Oldest first
  - Title (A-Z)
  │
  ▼
User selects sort → setSortBy(value)
  │
  ▼
useMemo re-sorts filteredLinks:
  switch (sortBy):
    'newest'  → .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    'oldest'  → .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
    'title'   → .sort((a,b) => a.title.localeCompare(b.title))
```

### Edge Cases

- **Links with same createdAt**: Stabilize sort by secondary key (id) to avoid jitter
- **Links with empty title**: `localeCompare('', otherTitle)` — empty titles sort first/last depending on locale; acceptable
- **Changing sort while search/filter active**: All derived state recomputes together

---

## 12. Flow: Back Navigation

```
User taps ← Back in Header
  │
  ▼
onBack() → App.tsx sets view='dashboard'
  │
  ▼
StudyLinks component unmounts (state discarded)
  │
  ▼
PopupDashboard re-renders with fresh progress data
```

### Edge Cases

- **Unsaved form**: If modal is open, closing it is the user's responsibility first; Back button is always visible but closing modal first is natural UX
- **Data loss warning**: Not needed — form state is ephemeral; no partial saves
- **Pop-up close**: Browser closing the popup is equivalent to Back; no cleanup needed

---

## 13. Summary: State Machine

```
                    ┌─────────────────────────────────────────────────────────────────────┐
                    │                                                                     │
                    ▼                                                                     │
              ┌──────────┐    load success,    ┌──────────┐    add      ┌──────────┐      │
   Open ─────►│ LOADING  │─── links.length ──►│  EMPTY   │──────────►│  LIST    │──────┘
              └──────────┘    = 0              └──────────┘           └──────────┘
                    │                                  ▲                    │  │
                    │ load failure                   delete last          │  │
                    ▼                                  │                 │  │
              ┌──────────┐                            └─────────────────┘  │  │
              │  ERROR   │──tap Retry ──► LOADING                          │  │
              └──────────┘                                                  │  │
                                                                     expanded  │
                                                                     /collapsed │
                                                                     toggle     │
                                                                        │  │    │
                                                                  ┌─────┘  │    │
                                                                  ▼        ▼    │
                                                            ┌────────┐ ┌──────┐ │
                                                            │EXPANDED│ │COLL. │ │
                                                            └────────┘ └──────┘ │
                                                                  │              │
                                                            [Delete]       [Edit]
                                                                  │              │
                                                            ┌──────────┐   ┌──────┐
                                                            │CONFIRM   │   │MODAL │
                                                            │DELETE    │   │(open)│
                                                            └──────────┘   └──────┘
                                                                  │              │
                                                            Yes   │        Save  │
                                                                  ▼              ▼
                                                            back to LIST    back to LIST
```

---

## 14. Error Handling Matrix

| Error | Where | Impact | Recovery |
|-------|-------|--------|----------|
| IndexedDB not supported | Initial load | Cannot use tab | Show "Your browser doesn't support IndexedDB" message, disable Add |
| DB migration fails | Initial load | Cannot use tab | Show "Storage upgrade failed" + Retry |
| Save fails (disk full, quota) | Add/Edit | Entry not saved | Toast error + form stays open, data preserved |
| Delete fails | Delete | Entry not removed | Toast error + card reappears |
| Update fails | Edit/Toggle fav | Changes not persisted | Toast error + revert optimistic update |
| URL fetch (CORS) | Add form — auto-fetch | Title not auto-filled | Subtle hint, user can type manually |
| URL fetch (timeout) | Add form — auto-fetch | Title not auto-filled | Silent fallback (no error shown) |
| Clipboard API fails | Copy URL | URL not copied | Fallback to `execCommand`, then toast |
| `chrome.tabs.create` fails | Open link | Link not opened | Toast error + link remains in list |

---

## 15. Performance Considerations

| Scenario | Approach |
|----------|----------|
| 500+ links | Virtualized list (if needed); for MVP, flat list with reasonable card height |
| Typing in search | Debounce 200ms to avoid re-render per keystroke |
| Modal open/close | No re-fetch; uses local state only |
| Optimistic toggle | Instant UI update; background write on toggle favorite |
| Tag dropdown | Computed once from all links; cached via useMemo |
| Large descriptions | CSS `line-clamp` for collapsed; full render only when expanded |
