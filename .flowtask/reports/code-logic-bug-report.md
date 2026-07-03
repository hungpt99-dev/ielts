# Code and Logic Bug Report

**Generated**: 2026-07-02
**Scope**: All TypeScript/JavaScript source files in the monorepo
**Total bugs found**: 52

---

## CRITICAL / HIGH SEVERITY

### 1. Stale closure in cue card timer causes infinite loop
- **File**: `apps/web/src/pages/SpeakingPractice.tsx`
- **Function**: `toggleTimer`
- **Line**: 292
- **Type**: runtime
- **Description**: The `setInterval` callback captures `timerPhase` in closure at creation time. When transition occurs, the closure still sees the old phase, causing the timer to oscillate indefinitely between prep→speak and never terminate.
- **Fix**: Use a ref to track `timerPhase` inside the interval callback.

### 2. Difficulty filter checks snippet text instead of difficulty field
- **File**: `apps/web/src/pages/Search.tsx`
- **Function**: `filteredResults`
- **Line**: 297-303
- **Type**: logic
- **Description**: `filters.difficulties.has(entry.snippet)` checks if difficulty string appears in snippet text. The `SearchResult` interface has no `difficulty` field. The filter is a no-op.
- **Fix**: Add `difficulty` field to `SearchResult` or filter vocabulary data before building results.

### 3. Status filter UI shown but never applied to results
- **File**: `apps/web/src/pages/Search.tsx`
- **Function**: `filteredResults` memo
- **Line**: 274-318
- **Type**: logic
- **Description**: `Filters` interface defines `statuses`, UI renders toggle buttons, `activeFilterCount` counts it, but `filteredResults` memo never checks `filters.statuses`. Toggling statuses has zero effect.
- **Fix**: Add filtering logic for `filters.statuses` in the memo.

### 4. Incorrectly flags "a university", "a one", "a European" as article errors
- **File**: `apps/web/src/components/aiTutor/SpeakingPartner.tsx`
- **Function**: `analyzeText` → article detection
- **Line**: 316-319
- **Type**: logic
- **Description**: Regex includes "university", "one", "european" which start with consonant sounds (/juː/, /wʌ/, /jʊər/) and correctly take "a". Would suggest "an university", "an one", "an european".
- **Fix**: Remove "university", "one", "european" from the alternation.

### 5. Fluency band estimate overwritten for < 30 words
- **File**: `apps/web/src/components/aiTutor/SpeakingPartner.tsx`
- **Function**: `estimateBand`
- **Line**: 347-355
- **Type**: logic
- **Description**: Sequential `if` statements overwrite earlier results. `< 30` check is completely negated by `< 50` check that follows. Same pattern in grammar ranges (L374-376) and coherence ranges (L382-383).
- **Fix**: Use `else if` chain or reverse order (largest threshold first).

### 6. Multiple generated messages overwrite each other in checkAndGenerate
- **File**: `apps/web/src/services/ProactiveMessageEngine.ts`
- **Function**: `checkAndGenerate`
- **Line**: 317-336
- **Type**: logic
- **Description**: When `analyzeAndGenerate()` returns multiple messages, each loop iteration reconstructs `stored` from the original `existing` array (loaded once), so each `saveMessages()` call overwrites the previous. Only the last message survives.
- **Fix**: Re-read `loadMessages()` inside the loop, or accumulate into a single array and save once.

### 7. getPinnedSessions queries boolean field with integer 1
- **File**: `apps/web/src/services/storage/LocalTutorStorage.ts`
- **Function**: `getPinnedSessions`
- **Line**: 208
- **Type**: code
- **Description**: `db.chatSessions.where('isPinned').equals(1)` — `isPinned` is stored as boolean `true`/`false`, but `.equals(1)` uses strict equality. Always returns empty array.
- **Fix**: Change `.equals(1)` to `.equals(true)`.

### 8. getEnabledReminders queries boolean field with integer 1
- **File**: `apps/web/src/services/storage/LocalTutorStorage.ts`
- **Function**: `getEnabledReminders`
- **Line**: 346
- **Type**: code
- **Description**: Same as above — `db.reminders.where('isEnabled').equals(1)`. All reminder checks silently fail.
- **Fix**: Change `.equals(1)` to `.equals(true)`.

### 9. Extension proactive suggestions never persisted
- **File**: `apps/web/src/extension/ProactiveAssistant.ts`
- **Function**: `storeAsProactiveMessage`
- **Line**: 393-413
- **Type**: logic
- **Description**: Creates a `ProactiveMessage` but never saves it to engine's storage. Only calls `forceGenerate()` which runs own analysis and generates unrelated messages.
- **Fix**: Save the message directly instead of calling `forceGenerate()`.

### 10. Wrong App import path in main.tsx
- **File**: `apps/web/src/main.tsx`
- **Function**: module import
- **Line**: 4
- **Type**: code
- **Description**: Imports `App` from `'./app/App'` but the file is at `./App.tsx`. Import will fail at build/runtime.
- **Fix**: Change to `import App from './App'`.

### 11. Weekly chart labels show "Invalid Date"
- **File**: `apps/web/src/features/analytics/Analytics.tsx`
- **Function**: `compute` callback
- **Line**: 233
- **Type**: logic
- **Description**: `getWeekLabel(weekId)` receives `"2025-W14"` which is not a valid date string. `new Date("2025-W14")` returns `Invalid Date`. All weekly chart labels render as "Invalid Date".
- **Fix**: Replace with a version that extracts year/week and computes start date manually.

### 12. ReviewStatus never promotes to 'mastered'
- **File**: `apps/web/src/features/vocabulary/components/ReviewMode.tsx`
- **Function**: `handleRate`
- **Line**: 99-102
- **Type**: logic
- **Description**: Vocab status only transitions 'new'/'learning' → 'learning'. No promotion path to 'mastered' from 'reviewing'.
- **Fix**: Add promotion: if rating is 'good'/'easy' and status is 'reviewing', promote to 'mastered'.

### 13. Incorrect zod import path (v3 vs v4)
- **File**: `apps/web/src/features/vocabulary/components/WordForm.tsx`
- **Function**: module import
- **Line**: 4
- **Type**: code
- **Description**: Imports `z` from `'zod/v4'` but rest of project uses `'zod'` (v3). If zod v3 is installed, this import fails.
- **Fix**: Change to `import { z } from 'zod'`.

### 14. Snooze causes permanent message disappearance
- **File**: `packages/ai-tutor/src/hooks/useProactiveMessages.ts`
- **Function**: `getPendingMessages`
- **Line**: 45
- **Type**: logic
- **Description**: Filter `!m.isSnoozed` removes ALL snoozed messages before snoozedUntil expiry check. Snoozed messages are never reconsidered after snooze period expires.
- **Fix**: Replace both filters with a single combined check that only checks `snoozedUntil`.

### 15. Duplicate messages on generateFromInput
- **File**: `packages/ai-tutor/src/hooks/useProactiveMessages.ts`
- **Function**: `generateFromInput`
- **Line**: 86-94
- **Type**: logic
- **Description**: `generateFromInput` both directly appends messages to state AND emits them through event bus. The component's own subscription catches the emission and adds duplicates.
- **Fix**: Remove the event bus emission from `generateFromInput`.

### 16. snoozeMessage never resets isSnoozed
- **File**: `packages/ai-tutor/src/hooks/useProactiveMessages.ts`
- **Function**: `snoozeMessage`
- **Line**: 125-130
- **Type**: logic
- **Description**: Sets `isSnoozed: true` and `snoozedUntil`. No mechanism to reset `isSnoozed` when `snoozedUntil` expires. Combined with filter bug, snoozed messages are permanently hidden.
- **Fix**: `getPendingMessages` should not check `isSnoozed` at all — only check `snoozedUntil`.

### 17. Invalid examDate causes NaN to render
- **File**: `packages/ai-tutor/src/services/proactiveMessageEngine.ts`
- **Function**: `generateExamCountdown`
- **Line**: 105
- **Type**: runtime
- **Description**: No validation that `examDate` is valid. `new Date(examDate).getTime()` returns `NaN` for malformed input, rendering `"NaN days until your exam"`.
- **Fix**: Validate before calculation with `isNaN` check.

### 18. totalMinutes inflated by Math.max hiding incomplete plan
- **File**: `packages/learning-engine/src/daily-plan/DailyPlanService.ts`
- **Function**: `generateDailyPlan`
- **Line**: 30
- **Type**: logic
- **Description**: `totalMinutes: Math.max(totalMinutes, dailyStudyMinutes)` overwrites actual planned minutes with daily target. If items fill 15m but target is 60m, plan reports 60m — misleading.
- **Fix**: Use actual sum of planned minutes only.

### 19. WeeklyReflection.totalTasksCompleted set to study days, not tasks
- **File**: `packages/learning-engine/src/analytics/AnalyticsService.ts`
- **Function**: `getWeeklyReflection`
- **Line**: 108
- **Type**: logic
- **Description**: `totalTasksCompleted: consistency.totalStudyDays` assigns count of unique study days to a field named "total tasks completed". Different metrics.
- **Fix**: Pass actual task completion count or rename field.

### 20. buildDailyBreakdown hardcodes 30 minutes per session
- **File**: `packages/learning-engine/src/progress/ProgressService.ts`
- **Function**: `buildDailyBreakdown`
- **Line**: 204
- **Type**: logic
- **Description**: `sessionCountByDay.get(dayStr) * 30` assumes every session is exactly 30 minutes. Actual session duration data is discarded upstream.
- **Fix**: Pass session data with duration info into `buildDailyBreakdown`.

### 21. getWeeklySchedule date iteration wrong in non-UTC timezones
- **File**: `packages/learning-engine/src/daily-plan/DailyPlanService.ts`
- **Function**: `getWeeklySchedule`
- **Line**: 50-69
- **Type**: logic
- **Description**: `new Date("YYYY-MM-DD")` creates midnight UTC, then `d.setDate(d.getDate() + 1)` in local time. In UTC+X timezones, produces duplicate or missing dates.
- **Fix**: Use UTC-based date arithmetic.

---

## MEDIUM SEVERITY

### 22. Subject-verb agreement misses "We/They + singular verb"
- **File**: `apps/web/src/components/aiTutor/SpeakingPartner.tsx`
- **Function**: `analyzeText` → `subjVerbMatches`
- **Line**: 293-313
- **Type**: logic
- **Description**: Regex matches "We is", "They is" etc., but only filters for "I" and "he/she/it". "We is" and "They is" pass undetected.
- **Fix**: Add `subject === 'we' || subject === 'they'` to the condition at L306.

### 23. Incorrect subject extraction for compound subjects
- **File**: `apps/web/src/components/aiTutor/WritingTutor.tsx`
- **Function**: `detectGrammarIssues`
- **Line**: 481-491
- **Type**: code
- **Description**: Regex matches compound subjects like "The child are", but L484 uses `m.split(' ')[0]` extracting only "The" instead of "The child" as subject.
- **Fix**: Use the first capturing group from the regex match.

### 24. Unhandled promise rejection when onConfirm throws
- **File**: `apps/web/src/components/ui/ConfirmDialog.tsx`
- **Function**: `ConfirmDialog`
- **Line**: 38-41
- **Type**: runtime
- **Description**: If `onConfirm()` throws/rejects, unhandled rejection and `onClose()` never called, leaving modal open.
- **Fix**: Wrap in try/catch with `finally { onClose() }`.

### 25. ChatPopup rendered from both Layout and ChatIcon
- **File**: `apps/web/src/components/aiTutor/ChatIcon.tsx:117`, `apps/web/src/components/Layout.tsx:151`
- **Component**: Both render `<ChatPopup>`
- **Type**: runtime
- **Description**: Two separate chat popup instances render, both respond to `toggle-ai-tutor-chat` event, leading to duplicated UI and conflicting state.
- **Fix**: Render ChatPopup in only one place.

### 26. getWeekLabel receives unparseable date format
- **File**: `apps/web/src/pages/Progress.tsx`
- **Function**: `getWeekLabel`
- **Line**: 31-38
- **Type**: runtime
- **Description**: `getWeekLabel` receives `"2024-W1"` from `getWeekId`. `new Date("2024-W1")` returns Invalid Date, causing charts to display raw week IDs.
- **Fix**: Extract year/week from format and compute actual dates.

### 27. DatabaseService.remove/put not awaited in click handlers
- **File**: Multiple files (ListeningJournal, Mistakes, GrammarNotes, Vocabulary, WritingPractice, ReadingJournal, SpeakingPractice, MockTests, DailyPlan)
- **Type**: code
- **Description**: `DatabaseService.remove()` and `put()` return Promise but called without `await`. UI optimistically updates before DB operation completes. If DB write fails, state shows success while data is lost.
- **Fix**: Make each handler async and add `await`.

### 28. isRecentlyDismissed text-selection check never matches
- **File**: `apps/web/src/extension/ProactiveAssistant.ts`
- **Function**: `onTextSelected` / `isRecentlyDismissed`
- **Line**: 263-264, 417-418, 427
- **Type**: logic
- **Description**: Checks `isRecentlyDismissed('text-selected-...')` but `dismissSuggestion` dismisses by `suggestion.id` (UUID). Key formats don't match, cooldown never activates.
- **Fix**: Use `suggestion.id` for both or remove the check.

### 29. Multiple update* methods bypass error wrapper
- **File**: `apps/web/src/services/storage/Database.ts`
- **Function**: Multiple `update*` methods
- **Line**: 273-458 (various)
- **Type**: code
- **Description**: `update*` methods call `repo.<table>.update(id, changes)` directly without `safeDbLocal` wrapper. Errors throw raw Dexie errors instead of `DatabaseError`.
- **Fix**: Wrap each in `safeDbLocal`.

### 30. Unhandled promise rejection in setInterval callback
- **File**: `apps/web/src/services/ProactiveMessageEngine.ts`
- **Function**: `initialize` / `checkAndGenerate`
- **Line**: 220-222
- **Type**: runtime
- **Description**: `checkAndGenerate` is async, its promise is never awaited or caught. If `analyzeAndGenerate` throws, rejection is unhandled.
- **Fix**: Add `.catch(e => console.error(...))`.

### 31. extractJSON throws on malformed JSON
- **File**: `apps/web/src/services/ai/AIService.ts`
- **Function**: `extractJSON`
- **Line**: 90-101
- **Type**: runtime
- **Description**: `JSON.parse` can throw if AI returns brackets surrounding non-JSON content. Callers don't consistently catch.
- **Fix**: Wrap in try/catch.

### 32. Fire-and-forget DB deletion with no error handling
- **File**: `apps/web/src/features/writing/WritingPromptsPage.tsx`
- **Function**: `handleDelete`
- **Line**: 246-250
- **Type**: code
- **Description**: `DatabaseService.remove()` called without `await`. Error silently swallowed. Item disappears from UI but persists in DB.
- **Fix**: Await with try-catch and user notification.

### 33. saveDraft fire-and-forget with error silently caught
- **File**: `apps/web/src/features/writing/WritingPractice.tsx`
- **Function**: `saveDraft`
- **Line**: 198-202
- **Type**: code
- **Description**: `DatabaseService.put()` called with `.catch(() => {})`. Silent error swallowing. User loses draft without notification.
- **Fix**: Add proper error handling and notification.

### 34. Streak includes yesterday even if today has no activity
- **File**: `apps/web/src/features/analytics/Analytics.tsx`
- **Function**: Anonymous IIFE inside JSX
- **Line**: 552-566
- **Type**: logic
- **Description**: Streak computation has `else if (key !== today)` which skips breaking on today. User who last studied 3 days ago but not today sees streak of 1 instead of 0.
- **Fix**: Remove `else if (key !== today)` exception.

### 35. Schedule generation duplicates when called multiple times
- **File**: `apps/web/src/features/planner/Planner.tsx`
- **Function**: `confirmGenerateSchedule`
- **Line**: 320-344
- **Type**: logic
- **Description**: React state updates within loop are batched and async. New tasks created during loop not visible to subsequent checks. Second generation uses stale state.
- **Fix**: Reload tasks from DB before generating.

### 36. Notification center actions silently fail for engine messages
- **File**: `packages/ai-tutor/src/components/ChatWidget.tsx`
- **Function**: `handleNotificationAction`
- **Line**: 133-143
- **Type**: logic
- **Description**: Engine generates actions with `type: 'action'`, but handler only handles `type: 'navigate'`. Clicking notification action buttons has no effect.
- **Fix**: Add missing `'action'` handler.

### 37. Stale closure can exceed maxMessagesPerDay
- **File**: `packages/ai-tutor/src/hooks/useProactiveMessages.ts`
- **Function**: `generateFromInput`
- **Line**: 77
- **Type**: logic
- **Description**: `todayCount` computed from `messages` closure, not latest state. Multiple rapid calls see same stale count, allowing more messages than `maxMessagesPerDay`.
- **Fix**: Recalculate from latest saved state using ref.

### 38. ProactiveMessageService.loadMessages crashes during SSR
- **File**: `packages/ai-tutor/src/services/proactiveMessageService.ts`
- **Function**: `loadMessages`
- **Line**: 73
- **Type**: runtime
- **Description**: `localStorage.getItem()` throws `ReferenceError` in SSR. Unlike `loadSnapshot` which wraps in try/catch, this has no guard.
- **Fix**: Wrap in try/catch.

### 39. crypto.randomUUID() unavailable in older Node.js
- **File**: `packages/learning-engine/src/review-scheduler/ReviewSchedulerService.ts`
- **Function**: `createInitialReviewEntry`
- **Line**: 172
- **Type**: runtime
- **Description**: `crypto.randomUUID()` was added in Node.js 19. On Node 18, throws `TypeError`, crashing any code path processing new vocabulary items.
- **Fix**: Use `import { randomUUID } from 'node:crypto'`.

### 40. sessionDates array mutated in place
- **File**: `packages/learning-engine/src/profile/ProfileService.ts`
- **Function**: `getProfileData`
- **Line**: 24
- **Type**: code
- **Description**: `sessionDates.sort().reverse()` mutates original array. Latent bug for any code relying on original order.
- **Fix**: Use `[...sessionDates].sort().reverse()`.

### 41. mockTests array mutated in place
- **File**: `packages/learning-engine/src/analytics/AnalyticsService.ts`
- **Function**: `getBandProgressHistory`
- **Line**: 161
- **Type**: code
- **Description**: `.sort()` mutates the array. Callers reusing the array find it unexpectedly sorted.
- **Fix**: Use `[...mockTests].sort()`.

### 42. getExamCountdown timezone mismatch
- **File**: `packages/learning-engine/src/profile/ProfileService.ts`
- **Function**: `getExamCountdown`
- **Line**: 47-50
- **Type**: logic
- **Description**: `new Date(examDate)` parses as midnight UTC, then `setHours(0,0,0,0)` manipulates in local time. In UTC+X, shifts day backward, making exam appear 1 day earlier.
- **Fix**: Use UTC methods consistently.

### 43. calculateStudyStreak only uses session dates, excludes task completion dates
- **File**: `packages/learning-engine/src/profile/ProfileService.ts`
- **Function**: `calculateStudyStreak`
- **Line**: 54
- **Type**: logic
- **Description**: Only receives `sessionDates`, not `taskDates`. If user studies via tasks without logging a session, streak drops to 0.
- **Fix**: Pass `taskDates` into `calculateStudyStreak`.

### 44. ToastItem second setTimeout not cleaned up on unmount
- **File**: `packages/ui/src/components/Toast.tsx`
- **Function**: `ToastItem`
- **Line**: 54-60
- **Type**: runtime
- **Description**: Inner `setTimeout(() => onRemove(toast.id), 200)` not tracked or cleaned up. If component unmounts during exit animation, `onRemove` fires on unmounted component.
- **Fix**: Use ref to track inner timer and clear in cleanup.

---

## LOW SEVERITY

### 45. "herb" listed as needing "an" regardless of dialect
- **File**: `apps/web/src/components/aiTutor/WritingTutor.tsx`
- **Function**: `detectGrammarIssues`
- **Line**: 504
- **Type**: logic
- **Description**: Regex includes "herb". In British English, "herb" has pronounced 'h', so "a herb" is correct.
- **Fix**: Remove "herb" from article error list.

### 46. improveVocabulary removes "very" entirely without replacement
- **File**: `apps/web/src/components/aiTutor/WritingTutor.tsx`
- **Function**: `improveVocabulary`
- **Line**: 719
- **Type**: code
- **Description**: `.replace(/\bvery\b/gi, '')` removes "very" completely without substitution, producing awkward phrasing.
- **Fix**: Replace with alternative like 'extremely'.

### 47. Grammar issue regex only matches hardcoded subset of subjects
- **File**: `apps/web/src/components/aiTutor/WritingTutor.tsx`
- **Function**: `detectGrammarIssues`
- **Line**: 481
- **Type**: logic
- **Description**: Regex only lists 6 specific nouns. Misses countless third-person singular subjects like "The team", "The manager".
- **Fix**: Use broader matching pattern or expand list significantly.

### 48. Inconsistent date-timezone in recurring task generation
- **File**: `apps/web/src/pages/DailyPlan.tsx`
- **Function**: `handleSave` — recurring branch
- **Line**: 219-236
- **Type**: logic
- **Description**: `addDays` uses local midnight, but task's `date` is explicitly UTC. For negative UTC offsets, `getDay()` returns wrong day.
- **Fix**: Use UTC consistently for date parsing.

### 49. calculateOverall function defined but unused
- **File**: `apps/web/src/pages/MockTests.tsx`
- **Function**: `calculateOverall`
- **Line**: 210-212
- **Type**: code
- **Description**: Function is defined but never called. Inline expression duplicates the logic.
- **Fix**: Remove unused function or replace inline with call.

### 50. maskWord renders garbled output for words >= 3 chars
- **File**: `apps/web/src/pages/VocabularyReview.tsx`
- **Function**: `maskWord`
- **Line**: 28-31
- **Type**: logic
- **Description**: Output has underscores separated by spaces but not letters, creating confusing visual gap-fill hints.
- **Fix**: Use non-breaking separators or remove spacing.

### 51. False positive keyword matching in lesson detection
- **File**: `apps/web/src/components/aiTutor/TeachingMode.tsx`
- **Function**: `detectLessonFromMessage`
- **Line**: 553-558
- **Type**: logic
- **Description**: Splits lesson titles into individual words, checks `lower.includes(k)`. Common words like "present" match unrelated messages.
- **Fix**: Use `\b` word boundaries and filter stop words.

### 52. generateFeedbackMessage can produce NaN for score
- **File**: `apps/web/src/components/aiTutor/TeachingMode.tsx`
- **Function**: `generateFeedbackMessage`
- **Line**: 654
- **Type**: runtime
- **Description**: `Math.round((correct / total) * 100)` — if `total` is 0, produces `NaN`.
- **Fix**: Guard with `total > 0 ? ... : 0`.

---

## Summary by File

| Area | Bugs |
|------|------|
| `apps/web/src/pages/` | 10 |
| `apps/web/src/components/` | 11 |
| `apps/web/src/services/` | 8 |
| `apps/web/src/features/` | 7 |
| `apps/web/src/extension/` | 2 |
| `apps/web/src/main.tsx` | 1 |
| `packages/ai-tutor/` | 7 |
| `packages/learning-engine/` | 8 |
| `packages/ui/` | 1 |
| **Total** | **55** |

Note: Some bugs span multiple files (e.g., fire-and-forget DB operations in 10+ page files), counted as single entries above but affecting many locations.
