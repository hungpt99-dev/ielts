# Public API Reference

This document lists the intentionally exported public APIs from each package, their stability, and deprecation notes.

## Stability Levels

| Status | Meaning |
|---|---|
| **Stable** | API is production-ready and will not change without a major version |
| **Proposed** | API is new and may change based on feedback |
| **Deprecated** | API still works but should not be used in new code; will be removed |

## `@ielts/ai`

| API | Status | Notes |
|---|---|---|
| `callAI()` | Stable | |
| `complete()` | Stable | |

## `@ielts/ai-tutor-engine`

| API | Status | Notes |
|---|---|---|
| `createAITutorEngine()` | Stable | Main entry point |
| `sendTutorMessage()` | Stable | |
| `generateProactiveMessages()` | Stable | |
| `updateTutorMemory()` | Stable | |
| All Zod schemas | Stable | |
| `generateVocabularyExercises()` | Deprecated | Use learning engine's `generateActivity()` |

## `@ielts/learning-engine`

| API | Status | Notes |
|---|---|---|
| `createLearningEngine()` | Stable | Main entry point |
| `createLearningSession()` | Stable | |
| `completeLearningSession()` | Stable | |
| `generateLearningActivity()` | Stable | |
| `startAttempt()` / `submitAnswer()` | Stable | |
| `gradeAnswer()` | Stable | |
| `DailyPlanEngine` | Stable | |
| `AiPlanOrchestrator` | Stable | |
| `buildProgressEvidence()` | Stable | |
| `aggregateSkillProgress()` | Stable | |
| `buildMistakeEvidence()` | Stable | |
| `detectRecurrencePattern()` | Stable | |
| All `SkillModule` classes | Proposed | May have API refinements |
| `OfflineTutorIntelligenceAdapter` | Proposed | |

## `@ielts/storage`

| API | Status | Notes |
|---|---|---|
| `initDb()` | Stable | |
| `getDb()` | Stable | |
| `exportAllData()` | Stable | |
| `importBackup()` | Stable | |
| `clearAllTables()` | Stable | |
| `APP_SCHEMA` | Stable | |
| All repository classes | Stable | |
| YouTube repositories (v8) | Proposed | May have API refinements |
| `DataSyncPayload` / sync types | Proposed | Sync protocol evolving |

## `@ielts/settings`

| API | Status | Notes |
|---|---|---|
| `aiSettingsSchema` | Stable | |
| `sharedSettingsSchema` | Stable | |
| `AI_PROVIDERS` | Stable | |
| `THEME_MODES` | Stable | |
| `NATIVE_LANGUAGES` | Stable | |
| `SETTINGS_BRIDGE_ACTIONS` | Stable | |

## `@ielts/theme`

| API | Status | Notes |
|---|---|---|
| `ThemeProvider` | Stable | |
| `useTheme` | Stable | |
| `TOKENS` | Stable | |
| `DARK_TOKENS` | Stable | |
| `ACCENT_COLOR_PRESETS` | Stable | |

## `@ielts/ui`

| API | Status | Notes |
|---|---|---|
| All 22 components | Stable | |
| All 180+ icons | Stable | |
| Theme re-exports | Stable | Mirrors `@ielts/theme` |

## `@ielts/shared`

| API | Status | Notes |
|---|---|---|
| All Zod schemas | Stable | |
| `createSharedEvent()` | Stable | |
| `mapLegacyMistakeToEvidence()` | Proposed | Migration utility, may be removed after full migration |
| `mapLegacySessionToOutcome()` | Proposed | Same |
| `mapLegacyResultToEvaluation()` | Proposed | Same |
