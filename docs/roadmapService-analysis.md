# roadmapService.ts Analysis

## Overview

`apps/web/src/features/roadmap/roadmapService.ts` (658 lines) generates a static, deterministic IELTS study roadmap. It produces a 4-phase, 16-week, 112-day plan with daily tasks across 6 fixed skills.

## Data Structures

- **`RoadmapDay`**: id, date, dayNumber, skillFocus, taskId, isComplete, objective
- **`RoadmapWeek`**: weekNumber, label, focus, goal, 7 `RoadmapDay`s, completion stats
- **`RoadmapPhase`**: name, description, order, targetRange, 4 `RoadmapWeek`s, completion stats
- **`RoadmapData`**: phases[], currentPhaseIndex/WeekIndex, overallProgress, timestamps

## Current Data Inputs

| Input | Source | Usage |
|---|---|---|
| `AppSettings.targetBand` | User settings | Phase descriptions (4 fixed bands) |
| `AppSettings.weakSkills` | User settings | Skill rotation order for week focuses and daily tasks |
| `TaskEntry[]` | Database | Check existing/completed tasks, match to roadmap days |
| Today's date | `new Date()` | Calculate week start dates |

## Hardcoded Elements (all purely static)

| Function | Issue |
|---|---|
| `getPhaseName` | 4 hardcoded names (`Foundation Building`, `Skill Development`, `Advanced Practice`, `Test Readiness`) |
| `getPhaseDescription` | 4 hardcoded descriptions |
| `getPhaseTargetRange` | 4 hardcoded band ranges (`4.0-5.5`, `5.5-6.5`, etc.) |
| `getWeekFocus` | Cycles through `weakSkills` using modulo arithmetic; fallback to all 6 skills |
| `getWeekGoal` | 4 hardcoded goal templates per week |
| `getDayObjective` | 6 skill-specific hardcoded arrays × 7 templates each |
| `getTaskTitle` | 6 skill-specific hardcoded arrays × 7 templates each |
| `getTaskDescription` | Single static template string |
| `getTaskMinutes` | 6 skill-specific hardcoded minute estimates |
| `numberOfPhases = 4` | Magic number |
| `weeksPerPhase = 4` | Magic number |
| `7 days per week` | Hardcoded — no schedule flexibility |

**Result**: The same inputs always produce the identical plan. `preferredTopics`, `examDate`, `currentBand`, `dailyStudyMinutes`, `studyGoal`, and `preferredSchedule` from `AppSettings` are **ignored** by `generateRoadmap`.

## Extension Points for AI & User Profile Integration

### 1. Replace `generateRoadmap` with AI-driven generation

**Current**: Pure deterministic function `generateRoadmap(settings, tasks)`.

**Extension**: Add an `async generateRoadmapWithAI(settings, tasks, userHistory)` that calls an AI service (already exists at `apps/web/src/features/ai-tutor/aiTutorService.ts`) and returns the same `RoadmapData` shape. The AI prompt should include:

- All `AppSettings` fields (especially `currentBand`, `examDate`, `dailyStudyMinutes`, `studyGoal`, `preferredTopics`, `preferredSchedule`)
- User progress/history (mock test scores, skill-level estimates, past task completion rates)
- AI-suggested personalization: adaptive daily time allocation, topic-preference-aware tasks, schedule-aware week distribution, exam countdown-based intensity ramp

The current deterministic functions become fallback/content-source helpers the AI can use or override.

### 2. Replace getWeekFocus/getWeekGoal with AI-driven weekly planning

Use AI to generate week focus and goal based on user's actual weak areas, not modulo rotation. For example, if `preferredTopics = ['Environment', 'Technology']`, those topics should appear in tasks.

### 3. Replace getDayObjective/getTaskTitle/getTaskDescription with AI-generated daily tasks

Use AI to generate personalized daily objectives and task titles considering user's preferred topics, past mistakes, and recently practiced skills. The current arrays serve as a fallback.

### 4. Use `getRoadmapUserProfile()` to power AI prompts

The existing `getRoadmapUserProfile()` (line 621) already extracts a `RoadmapUserProfile` — it should be expanded to include more user data and fed into AI prompt construction.

### 5. Adaptive phase structure from user data

- Use `examDate` to compute study time horizon and adjust phase count/length dynamically
- Use `currentBand` and `targetBand` gap to determine phase difficulty ramp
- Use `dailyStudyMinutes` to set per-task time budgets
- Use `studyGoal` (`academic` vs `general`) to customize content focus

### 6. Recommendation engine improvements

`getRecommendations` currently generates static messages based on simple task counts. AI could produce context-aware recommendations based on user's skill-level trend, upcoming exam date, and recent performance.

### 7. Route-level integration

`RoadmapPage.tsx` calls `ensureRoadmap()` → `generateRoadmap()` — swapping to an AI route requires only changing the function called in `ensureRoadmap` (line 426).

## Architecture Flow

```
RoadmapPage.tsx
  └─ ensureRoadmap()          [decision: use cached ≤1 day old or regenerate]
       ├─ loadRoadmap()        [localStorage cache]
       ├─ loadUserSettings()   [AppSettings from storage]
       ├─ DatabaseService.getAll('tasks')
       └─ generateRoadmap()    [PURE DETERMINISTIC — extension point]
            └─ recalculateProgress()  [reusable regardless of generator]
```

## Summary of Changes Needed

1. **New AI service function** — wrap AI call to generate `RoadmapData` from user profile + history
2. **Extend `RoadmapUserProfile`** — add `preferredTopics`, `aiApiKey`, `aiProvider`, `aiModel` (already in `AppSettings`)
3. **Modify `ensureRoadmap`** — route to AI generator when AI is enabled, fall back to deterministic
4. **Add prompt construction** — build AI prompt from user data, existing tasks, skill-level history
5. **Preserve deterministic fallback** — keep current functions as fallback when AI is unavailable

## Key Files

| File | Role |
|---|---|
| `apps/web/src/features/roadmap/roadmapService.ts` | Roadmap generation (this file) |
| `apps/web/src/features/roadmap/RoadmapPage.tsx` | UI entry point |
| `apps/web/src/features/ai-tutor/aiTutorService.ts` | Existing AI service to reuse |
| `apps/web/src/models/index.ts` | `AppSettings`, `TaskEntry` models |
| `apps/web/src/services/storage/Database.ts` | `DatabaseService` |
| `apps/web/src/services/storage/SettingsStorage.ts` | `loadAppSettings` |
| `apps/web/src/features/personalization/personalizationService.ts` | User personalization data |
