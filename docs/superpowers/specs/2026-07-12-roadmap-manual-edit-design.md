# Roadmap Manual Edit Mode — Design Spec

## Overview

Allow users to manually edit their IELTS study roadmap with a dedicated edit mode. Users can modify task objectives, skill focus, week/phase metadata, add/remove items, reorder, and undo/redo changes.

## Architecture

### Pattern: Command Pattern

Every edit operation is a pure function `(RoadmapData, params) => RoadmapData`:

- `roadmapCommands.ts` — All command functions (pure, no side effects)
- `useRoadmapEditor` hook — Manages edit mode state, undo/redo stacks, auto-save
- Components receive `applyCommand` and `isEditMode` as props

### Commands

| Command | Scope |
|---|---|
| `updateDay` | objective, skillFocus, date |
| `addDay` / `removeDay` / `moveDay` | Day CRUD within a week |
| `updateWeek` | label, focus, goal |
| `addWeek` / `removeWeek` / `moveWeek` | Week CRUD within a phase |
| `updatePhase` | name, description, targetRange |
| `addPhase` / `removePhase` / `movePhase` | Phase CRUD |

All commands deep-clone the roadmap, apply changes, and call `recalculateProgress` for consistency.

### Undo/Redo

- `pastStates: RoadmapData[]` — stack of previous states
- `futureStates: RoadmapData[]` — stack of undone states
- Each command pushes current state to `pastStates`
- Undo restores previous state, Redo restores next state
- `saveRoadmap()` called on every change for persistence

## UX

### Edit Mode Toggle

- Button in `RoadmapHeader` toggles "Edit Plan" / "Editing..."
- Active state shown with primary color and ring indicator

### Edit Mode UI

| Element | Interaction |
|---|---|
| Text fields | Hover → pencil icon → click → inline input/textarea. Blur/Enter saves. |
| Skill badges | Become dropdown select |
| Reorder | ↑/↓ arrow buttons on each item |
| Delete | × button with `window.confirm()` |
| Add | Dashed "+" buttons between items |
| Floating toolbar | Bottom bar with Undo / Redo / Done Editing |

### States

- **Edit Mode ON**: all items auto-expand, sidebar hidden, timeline hidden
- **Edit Mode OFF**: normal view, all changes persisted
- **Loading/Error/Null**: edit mode unavailable
- **Empty roadmap**: cannot enter edit mode (no roadmap to edit)

## Files

### New files

- `apps/web/src/features/roadmap/roadmapCommands.ts` — 12 pure command functions
- `apps/web/src/features/roadmap/hooks/useRoadmapEditor.ts` — Editor hook
- `apps/web/src/features/roadmap/components/EditableText.tsx` — Inline editable text

### Modified files

- `DayCard.tsx` — Edit controls (objective, skillFocus, delete, move)
- `WeekSection.tsx` — Edit controls (label, focus, goal, add/remove/move days)
- `PhaseSection.tsx` — Edit controls (name, description, targetRange, add/remove/move weeks)
- `RoadmapHeader.tsx` — Edit mode toggle button
- `FullStudyRoadmapPage.tsx` — Wire editor hook, floating toolbar, Add Phase button
