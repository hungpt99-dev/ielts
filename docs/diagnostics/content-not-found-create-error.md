# Diagnostic Report: "Content Not Found: Create" Error

## Summary

When the user clicks **"Start Next Task"** on the Dashboard, the app navigates to the study content page with a task title from the database. If that title does not match any of the hardcoded content templates, the page displays **"Content Not Found"** with the error message `Content not found: "Create"` (or whatever the task title is).

---

## Root Cause

**Task titles stored in the database do not match any of the registered content templates.**

### Error Generation Chain

1. **Dashboard.tsx:391-392** — "Start Next Task" click navigates to:
   ```
   /study/${encodeURIComponent(todayUnfinished[0].title)}
   ```
   where `todayUnfinished` comes from `TaskEntry` objects in the indexedDB `tasks` table.

2. **StudyContentPage.tsx:326** — The route param `taskId` is decoded via `decodeTaskTitle()` to get the task title.

3. **StudyContentPage.tsx:337** — `getContentByTitle(title)` does an exact-match lookup in `ALL_CONTENT` templates:
   ```typescript
   // ieltsContent.ts:438-439
   export function getContentByTitle(title: string): ContentTemplate | null {
     return ALL_CONTENT.find(c => c.title === title) ?? null
   }
   ```

4. **StudyContentPage.tsx:346-348** — When no match is found (`null` return), the error is set:
   ```typescript
   setLoading(false)
   setError(`Content not found: "${title}". Click "Generate with AI" to create personalized content.`)
   ```

5. **StudyContentPage.tsx:582-602** — The error is rendered via `EmptyState` with title "Content Not Found" and description showing the task title.

### Why Titles Don't Match

| Source of task titles | Example titles | 
|---|---|
| **Roadmap system** (`roadmapService.ts:192-253`) | `"Learn 10 new IELTS vocabulary words"`, `"Skim a passage for main ideas"`, `"Study Task 2 essay structure"` |
| **Study Plan system** (`studyPlanService.ts:256-272`) | `"Learn new vocabulary on Environment"`, `"Read IELTS passage on Technology"`, `"Complete a listening exercise"` |
| **AI-generated plans** (OpenAI/fallback) | Any arbitrary title, e.g. `"Create a daily study plan"` |
| **Content templates** (`ieltsContent.ts:16-419`) | `"Learn 10 Useful Environment Vocabulary Words"`, `"Practice Skimming with a Short Reading Passage"`, `"Write One Opinion Paragraph for Task 2"` |

The databases are populated via:
- `createTasksFromPlan()` in `studyPlanService.ts:448-502` — creates `TaskEntry` records with `item.title` from plan data
- `toggleTask()` in `roadmapService.ts:496-525` — updates existing tasks but doesn't create them
- AI-generated study plans can produce arbitrary titles via `buildStudyPlanUserPrompt`

The content templates in `ALL_CONTENT` (`ieltsContent.ts:420`) are a fixed set of ~18 hardcoded `ContentTemplate` objects with specific, verbose titles that are never referenced by the task-creation pipeline.

---

## Affected Files

| File | Line(s) | Role |
|---|---|---|
| `apps/web/src/features/dashboard/Dashboard.tsx` | 391-392 | "Start Next Task" navigation |
| `apps/web/src/features/content/StudyContentPage.tsx` | 326, 337, 346-348, 582-602 | Content lookup & error display |
| `apps/web/src/features/tasks/ieltsContent.ts` | 420, 438-440 | Content template registry & lookup |
| `apps/web/src/features/roadmap/roadmapService.ts` | 192-253, 272-379 | Roadmap task title generation |
| `apps/web/src/features/study-plan/studyPlanService.ts` | 232-322, 448-502 | Study plan task creation |

---

## The "Create" Specificity

The `"Create"` suffix in the error message is simply the task title (or the first word of it). For example, if a task was created with title `"Create a daily study plan"`, the error would read `Content not found: "Create a daily study plan"`. The `EmptyState` component renders "Content Not Found" as the heading and the error string as the description, so the user sees:

> **Content Not Found**
> Content not found: "Create a daily study plan". Click "Generate with AI" to create personalized content.

This matches the user's report of seeing `Content Not Found` followed by `Content not found: Create`.

---

## Resolution Path

There are two approaches:

1. **Make task titles match content templates** — Change `getTaskTitle()` in `roadmapService.ts` and `fallbackSchedule()` in `studyPlanService.ts` to use the exact titles from `ieltsContent.ts` templates. This would require mapping each generated task to a matching content template.

2. **Remove the hardcoded template dependency** — Instead of requiring an exact title match in `getContentByTitle()`, the `StudyContentPage` could dynamically generate/fetch content based on the skill focus and objective, falling back to AI generation without requiring an exact template match.
