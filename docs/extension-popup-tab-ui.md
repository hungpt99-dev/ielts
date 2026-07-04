# Extension Popup Tab UI Structure

## Overview

The popup uses a **view-based navigation** pattern (not a classic tab bar). The parent `App` component holds a `ViewState` and conditionally renders the active view. Navigation is done through a callback prop `onNavigate`.

## Key Files

| File | Role |
|------|------|
| `apps/extension/src/popup/App.tsx` | Root — manages `view` state, routes to sub-views |
| `apps/extension/src/popup/components/PopupDashboard.tsx` | Home dashboard — lists action buttons that navigate to other views |
| `apps/extension/src/popup/components/DashboardCard.tsx` | Stat card used in the dashboard grid |

## View State Definition (`App.tsx`)

```typescript
type ViewState = 'dashboard' | 'saveForm' | 'vocabularyCollector' | 'articleCollector' | 'videoHelper' | 'backupRestore' | 'miniTutor'
```

- `useState<ViewState>('dashboard')` controls the current view.
- Conditional `if (view === ...)` blocks render the corresponding component.

## Navigation Flow

1. `PopupDashboard` receives `onNavigate` as a prop.
2. An `ActionItem` array (line 275 of `PopupDashboard.tsx`) defines each action card with `onClick: () => onNavigate('viewName')`.
3. Clicking an action sets `view` in `App`, which re-renders the matching component.
4. Each sub-view receives `onCancel={() => setView('dashboard')}` to go back.

## How to Add a New Tab

### 1. Create the component

Add a new file under `apps/extension/src/popup/components/`, e.g. `StudyLinks.tsx`.

Follow the existing pattern:
- Accept `onSaved` and `onCancel` callbacks (or `onBack` for non-form views).
- Wrap content in `<ToastProvider>` if the component uses toast notifications.

### 2. Register the view in `App.tsx`

- Add the view name to the `ViewState` union type.
- Add an `if` block before the default dashboard return:

```typescript
if (view === 'studyLinks') {
  return (
    <ToastProvider>
      <div style={{ padding: '16px', minHeight: '500px' }}>
        <StudyLinks onSaved={handleSaved} onCancel={() => setView('dashboard')} />
      </div>
    </ToastProvider>
  )
}
```

### 3. Add an action item in `PopupDashboard.tsx`

- Update the `onNavigate` callback type in `PopupDashboardProps` to include the new view name.
- Add a new entry to the `actions` array in the dashboard (line 275) with an icon, label, description, `onClick`, and color.

### 4. (Optional) Add storage logic

If the new tab requires its own storage, add functions in `apps/extension/src/storage/` or reuse the existing IndexedDB store in `indexedDB.ts`. The current `LearningEntry` type already supports a `category` field that could be used for study links.

## Extension Points Summary

| Extension Point | File | What to change |
|----------------|------|----------------|
| View type union | `App.tsx:11` | Add new view name |
| Conditional render | `App.tsx:22-78` | Add `if (view === '...')` block |
| Navigation prop type | `PopupDashboard.tsx:8` | Add view to `onNavigate` union |
| Action button list | `PopupDashboard.tsx:275-328` | Add `ActionItem` entry |
| New component | `components/YourView.tsx` | Create the view component |
