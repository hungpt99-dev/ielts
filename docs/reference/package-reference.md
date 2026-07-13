# Package Reference

## Packages

### `@ielts/shared`

**Purpose**: Cross-package types, schemas, and utilities shared between all packages and apps.

**Public exports**:
- Exercise question types (`ExerciseQuestion`, `ExerciseQuestionType`, 8+ question interfaces)
- Operation result (`OperationResult`, `OperationResultStatus`)
- Learner context (`LearnerContext`)
- Mistake/skill/vocabulary evidence types
- `LearningOutcome`
- `SharedLearningEvent`, `SharedLearningEventType`, `SharedEventSource`
- `ProactiveMessage` types and schemas
- Evaluation types (`EvaluationStatus`, `EvaluationMethod`, `AnswerEvaluation`, `WritingEvaluation`, `SpeakingEvaluation`)
- Attempt types (`LearningAttemptStatus`, `LearningAttempt`, `LearningAnswer`)
- Feedback types (`LearningFeedback`)
- Validation Zod schemas (ieltsSectionSchema, mistakeEvidenceSchema, etc.)
- Mappers: `createSharedEvent`, `mapLegacyMistakeToEvidence`, `mapLegacySessionToOutcome`, `mapLegacyResultToEvaluation`

**Stability**: Stable. Core contract between all packages.

**Consumers**: All packages and apps.

---

### `@ielts/settings`

**Purpose**: AI provider settings, theme preferences, native language definitions, and settings bridge between web app and extension.

**Public exports**:
- `aiSettingsSchema`, `sharedSettingsSchema`, `AI_PROVIDERS`, `THEME_MODES`, `NATIVE_LANGUAGES`
- `DEFAULT_AI_SETTINGS`, `DEFAULT_SHARED_SETTINGS`
- Types: `AISettings`, `SharedSettings`, `SharedSettingsPatch`
- Bridge: `SETTINGS_BRIDGE_ACTIONS`, `BRIDGE_SOURCES`
- Utilities: `themeModeFromDarkMode`, `darkModeFromThemeMode`, `translationTarget`

**Stability**: Stable.

**Consumers**: `@ielts/ui`, `@ielts/ai-tutor-engine`, apps/web, apps/extension.

---

### `@ielts/theme`

**Purpose**: Design tokens, theme provider, and colour system.

**Public exports**:
- `ThemeProvider`, `useTheme`
- `TOKENS`, `DARK_TOKENS`, `ACCENT_COLOR_PRESETS`, `THEME_MODES`
- Types: `ThemeMode`, `DesignTokens`, `ThemeContextValue`

**Stability**: Stable.

**Consumers**: `@ielts/ui`, apps/web.

---

### `@ielts/ui`

**Purpose**: Shared React component library.

**Public exports**:
- 22 components: `AITutorRecommendationCard`, `Badge`, `Button`, `Card`, `Drawer`, `EmptyState`, `ErrorState`, `ExtensionSyncStatusBadge`, `LoadingSkeleton`, `MobileBottomNavigation`, `Modal`, `ProgressBar`, `ProgressRing`, `ProgressSummaryCard`, `SearchInput`, `Select`, `SkillCard`, `Tabs`, `ToastProvider`/`useToast`
- 180+ icons (IconMap, IconHeadphones, etc.)
- Theme re-exports (`ThemeProvider`, `useTheme`, `TOKENS`, `DARK_TOKENS`, `ACCENT_COLOR_PRESETS`)

**Stability**: Stable. Components may be deprecated in favour of shadcn/ui.

**Consumers**: apps/web, apps/extension.

---

### `@ielts/storage`

**Purpose**: IndexedDB database management, repositories, backup/import, sync protocol, and error types.

**Public exports**:
- `initDb`, `getDb`, `destroyDb`, `isDbOpen`, `safeDb`, `TABLE_NAMES`, `AppDatabase`
- `APP_SCHEMA`
- `ValidationError`, `exportAllData`, `importBackup`, `clearAllTables`
- 37+ repository classes
- Types for all entities
- YouTube-related repositories and schemas (19 entity types)
- Sync protocol: `DATA_SYNC_ACTION`, `createMessageId`, `DataSyncPayload`, `SyncEntityType`, `SyncOperation`
- `AppBackupData`, `ImportMode`, `ImportSummary`

**Stability**: Stable. YouTube storage is newer (v8) and may evolve.

**Consumers**: apps/web, apps/extension.

---

### `@ielts/learning-engine`

**Purpose**: Study plan generation and learning/exercise orchestration. Single authoritative engine for planning and learning.

**Public exports**:
- `createLearningEngine`, `DailyPlanEngine`, `AiPlanOrchestrator`, `PlanRegenerator`
- Session use cases: `createLearningSession`, `resumeLearningSession`, `completeLearningSession`
- Activity use cases: `generateLearningActivity`
- Attempt use cases: `startAttempt`, `submitAnswer`
- Review: `generateMistakeReview`, `adaptDifficulty`
- Domain entities: `LearningSession`, `Exercise`, `LearningAttempt`, `LearningOutcome`, `MistakeEvidence`, `SkillEvidence`, `ProgressEvidence`
- Domain services: `buildProgressEvidence`, `aggregateSkillProgress`, `buildMistakeEvidence`, `detectRecurrencePattern`, `buildSkillEvidence`, `getWeakestSkills`
- Policies: `gradeAnswer`, `determineDifficulty`, `planActivities`, `selectEvaluationMethod`, `isDeterministicallyGradable`
- Skill modules: `SkillRegistry`, `WritingSkillModule`, `SpeakingSkillModule`, `ReadingSkillModule`, `ListeningSkillModule`, `VocabularySkillModule`, `GrammarSkillModule`
- Infrastructure: `InMemorySessionRepository`, `OfflineTutorIntelligenceAdapter`, `CachedActivityGenerator`, `MigrationRunner`
- Ports: `TutorIntelligencePort`, `LearnerContextPort`, `StudyPlanPort`, all repository ports

**Stability**: Core entities stable; skill modules and infrastructure adapters may evolve.

**Consumers**: apps/web.

---

### `@ielts/ai-tutor-engine`

**Purpose**: AI tutor with chat, proactive messages, memory, progress review, and recommendations.

**Public exports**:
- `createAITutorEngine`
- Chat: `sendTutorMessage`, `continueTutorSession`, `summarizeChatSession`
- Recommendations: `getNextBestAction`, `getDailyRecommendation`, `generateContextSuggestions`
- Progress: `generateProgressReview`
- Memory: `updateTutorMemory`, `extractMemoryFromChat`, `TutorMemoryManager`
- Proactive: `ProactiveTutorOrchestrator`, `createDefaultGenerators`, `generateProactiveMessages`
- Domain entities: `LearnerProfile`, `LearnerStateSnapshot`, `TutorChatMessage`, `TutorMemory`, `ProactiveMessage`
- Events: `LearningEvent`, `TutorEvent`
- Ports: `TutorMemoryRepository`, `LearnerProfileRepository`, `LearnerProgressRepository`, `TutorAIClient`, etc.
- Errors: `TutorError`, `TutorErrorCode`, `createTutorError`
- Skill modules: writing, speaking, reading, listening, vocabulary, grammar tutor modules

**Stability**: Core chat and proactive systems stable; skill modules may evolve.

**Consumers**: apps/web.

---

### `@ielts/ai`

**Purpose**: Low-level AI client with adapters for OpenAI, error handling, and response parsing.

**Public exports**:
- `callAI`, `complete`
- Errors: `AIError`, `AIAuthError`, `AIRateLimitError`, `AINetworkError`, `AIEmptyResponseError`, `AIConfigError`
- OpenAI adapter, response utilities

**Stability**: Stable.

**Consumers**: `@ielts/ai-tutor-engine`, `@ielts/learning-engine`, apps/web.

## Monorepo Structure

```
packages/
  shared/         — Cross-package types and schemas
  settings/       — AI and theme settings
  theme/          — Design tokens and theme provider
  ui/             — Shared React components
  storage/        — IndexedDB persistence layer
  learning-engine/— Study planning and learning orchestration
  ai-tutor-engine/— AI tutor engine
  ai/             — Low-level AI client
apps/
  web/            — Main web application
  extension/      — Browser extension
```
