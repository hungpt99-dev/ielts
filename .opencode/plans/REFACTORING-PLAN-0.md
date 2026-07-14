# IELTS Journey — Comprehensive Refactoring Plan

> Generated: 2026-07-13
> Branch: `main`
> Commit: `5461dcf`

---

## 1. Executive Summary

### Current Architecture

IELTS Journey is a **local-first, offline-capable** IELTS preparation monorepo (pnpm workspace) with two applications and eight shared packages:

| Layer | Packages |
|-------|----------|
| **Apps** | `apps/web` (React PWA + Capacitor mobile), `apps/extension` (Chrome MV3) |
| **Engines** | `@ielts/learning-engine` (session/activity/attempt lifecycle), `@ielts/ai-tutor-engine` (chat/context/memory/proactive), `@ielts/ai` (AI adapter) |
| **Shared** | `@ielts/shared` (domain types), `@ielts/storage` (Dexie persistence), `@ielts/settings`, `@ielts/theme`, `@ielts/ui` |

### Primary Problems

1. **Duplicate exercise models** — Three `ExerciseQuestion` definitions across `@ielts/shared`, `@ielts/learning-engine`, and `@ielts/storage`
2. **Direct AI calls from apps** — `engineBootstrap.ts` wraps `callAI` inline; extension `aiEnrichmentService.ts` duplicates AI logic; ArticleCollector calls OpenAI directly
3. **Feature components bypass the Learning Engine** — All 6 skill features have hardcoded generation instead of using `engine.generateActivity()`
4. **No AI evaluation for Writing/Speaking** — `evaluationPolicy: 'ai-assisted'` set but never wired
5. **Extension maintains separate storage** — 5 IndexedDB stores + engine adapters + chrome.storage keys
6. **Incomplete learner context** — `engineBootstrap.ts` builds partial context; full `LearnerContextBuilder` exists but not wired
7. **Settings in 3 locations** — localStorage, `@ielts/settings`, chrome.storage
8. **383 pre-existing web test failures**

### Recommended Target

- All exercise generation through **Learning Engine facade**
- All AI through **AI Tutor Engine** or `@ielts/ai`
- All persistence through `@ielts/storage`
- Full learner context from 9 sources
- Complete feedback loop: learning outcomes → AI Tutor Engine → proactive recommendations

### Complexity

**Medium-High**. Engines exist with correct hexagonal architecture. Main work is **consumer migration** — converting web/extension features from direct implementations to engine consumers.

### Highest-Risk Areas

- Extension storage consolidation (data loss potential)
- Duplicate outcome recording during migration
- AI regression in Writing/Speaking evaluation
- Offline behavior regression

---

## 2. Current Architecture

### 2.1 Package Map & Dependencies

```
@ielts/journey (root)
├── apps/web ──→ all 8 packages
├── apps/extension ──→ all 8 packages (including @ielts/shared)
├── @ielts/learning-engine ──→ @ielts/ai, @ielts/shared
├── @ielts/ai-tutor-engine ──→ @ielts/ai, @ielts/shared
├── @ielts/storage ──→ dexie, zod
├── @ielts/ai, @ielts/settings, @ielts/shared ──→ zod only
```

No circular dependencies detected.

### 2.2 Feature Matrix

| Feature | UI Entry | Current Generator | AI Caller | Profile-Aware | Learning Engine | AI Tutor Engine | Persistence | Feedback Loop | Tests |
|---------|----------|-------------------|-----------|---------------|-----------------|-----------------|-------------|---------------|-------|
| Reading | ReadingPractice.tsx | `startEngineSession('reading')` | Via engine | Partial | Yes (partial) | No | `readingPracticeSessions` | To `mistakes` via component | 1 file (failing) |
| Listening | ListeningPractice.tsx | `startEngineSession('listening')` | Via engine | Partial | Yes (partial) | No | `listeningPracticeSessions` | Manual | 1 file (failing) |
| Writing | WritingPractice.tsx | `startEngineSession('writing')` | Heuristic only | No | Yes (generation only) | No | `writingSessions` | None | 1 file (failing) |
| Speaking | SpeakingPractice.tsx | `startEngineSession('speaking')` | Heuristic only | No | Yes (generation only) | No | `speakingSessions` | None | 1 file |
| Grammar | GrammarLearning.tsx | `startEngineSession('grammar')` + seeds | No | No | Yes (generation) | No | `grammarNotes`, `mistakes` | Saves mistakes | None |
| Vocabulary | VocabularyManager.tsx | Direct `callAI` | `enrichVocabulary()` | No | No | No | `vocabulary`, `vocabularyReviews` | SM-2 review | None |
| Vocabulary review | ReviewSession.tsx | `reviewService.ts` | No | No | No | No | `vocabulary`, `vocabularyReviews` | SM-2 | None |
| Mistake review | MistakeNotebook.tsx | Manual | "Ask AI Tutor" routing | No | No | Via routing | `mistakes` | To practice pages | None |
| Roadmap | roadmapService.ts | `DailyPlanEngine` | No (deterministic) | Yes (profile) | No (uses engine directly) | No | `tasks` + localStorage | Task completion | None |
| Dashboard | Dashboard.tsx | `dashboardService.ts` | No | Yes (reads all) | No | No | All tables aggregated | No | None |
| Progress | ProgressTracker.tsx | `progressService.ts` | No | Yes | No | No | `progressRecords` | No | 2 files |
| AI Tutor | AITutorPage.tsx | `engine.getNextBestAction()` | Via `AITutorEngine` | Full (via context) | No | Yes | localStorage + `aiContents` | Yes | None |
| Proactive msgs | ProactiveMessagePanel | Orchestrator | Via `AITutorEngine` | Yes | No | Yes | localStorage | Yes | 4 files (utils only) |
| Articles (web) | PublicApiImportPage | `api/import.ts` | Via `@ielts/ai` classify | No | No | No | `publicApiContent` | No | None |
| Articles (ext) | ArticleCollector.tsx | Direct OpenAI fetch | Direct fetch | No | No | No | `articleStore` + `learningEntries` | No | None |
| YouTube learning | YouTube iframe | `LearningEngine` + direct AI | Mixed | No | Partial | No | chrome.storage + IDB | Exercises | None |
| Saved text (ext) | SelectionPanel | Direct `callAI` | `enrichVocabulary()`, `explain()` | No | No | No | `learningEntries` + `vocabularyStore` | No | None |
| Extension sync | SyncService.ts | `postMessage` bridge | No | No | No | No | All extension stores | Web ↔ Ext | 3 files |

### 2.3 Engine Responsibility Matrix

| Responsibility | Current Owner | Correct Owner | Problem |
|---------------|---------------|---------------|---------|
| Study scheduling | `DailyPlanEngine` (in learning-engine) | Study Plan Engine | Colocated but conceptually distinct |
| Session creation | `LearningEngine.createSession` | Learning Engine | ✅ Correct |
| Exercise generation | Engine skill modules + direct component logic | Learning Engine (exclusively) | Components bypass engine |
| Answer evaluation | Deterministic + heuristic | Learning Engine (AI-assisted for WS) | Writing/Speaking heuristic only |
| Progress calculation | `progressService.ts` + engine domain services | Learning Engine | Duplicate |
| Mistake extraction | Component-level + manual | Learning Engine | Not centralized |
| Vocabulary mastery | `VocabularyManager` SM-2 | Learning Engine | No engine integration |
| Learner context | `LearnerContextBuilder` + partial bootstrap | AI Tutor Engine | Builder not fully wired |
| Tutor memory | `TutorMemoryManager` | AI Tutor Engine | ✅ Correct |
| Proactive messages | `Orchestrator` + legacy `proactiveMessageEngine` | AI Tutor Engine | Dual implementation |
| AI orchestration | `@ielts/ai` | `@ielts/ai` | ✅ Correct |
| Persistence | `@ielts/storage` + extension stores | `@ielts/storage` | Extension has separate stores |

### 2.4 AI Usage Map

| Location | Feature | Input | Context Used | Output Validation | Cache | Retry | Future Owner |
|----------|---------|-------|-------------|-------------------|-------|-------|--------------|
| `@ielts/ai` services (7) | Explain, vocab, article, video, dictionary | System + user prompts | None | Zod schemas | AiGenerateResultCache | No | `@ielts/ai` |
| `engineBootstrap.ts` inline | Exercise generation | AI prompts | LearnerContext (partial) | JSON.parse only | No | No | `@ielts/ai` via engine |
| `engineBootstrap.ts` TutorPort | Evaluate open response | AI prompt + rubric | Partial context | JSON.parse only | No | No | AI Tutor Engine |
| `vocabularyEnrichmentService.ts` | Enrich vocabulary | Word + topic | None | Manual validation | No | No | AI Tutor Engine |
| `ArticleCollector.tsx` (extension) | Generate questions | Article content | None | articleQuestionSchema | No | No | Learning Engine |
| `VideoHelper.tsx` (4 services) | YouTube analysis | Transcript | None | Zod schemas | No | No | Learning Engine |
| `aiEnrichmentService.ts` (ext) | Vocabulary enrichment | Word | None | Manual | No | No | AI Tutor Engine |
| `content-script/aiExplain.ts` | 7-tab explain | Selected text | None | Zod schemas | In-memory | No | AI Tutor Engine |
| `youtube-learning` VocabularyService | Word details | Word + context | None | Manual | localStorage | No | AI Tutor Engine |

### 2.5 Persistence Map

**IndexedDB (Dexie `ielts-journey`)**: 53 tables across 8 schema versions
- Core (14 v1): vocabulary, vocabularyReviews, tasks, readingSessions, writingSessions, speakingSessions, listeningSessions, readingPracticeSessions, listeningPracticeSessions, grammarNotes, mistakes, mockTests, topicsProgress, passages
- Content (11 v2): ieltsTopics, exampleSentences, readingPassages, listeningTranscripts, writingPrompts, speakingQuestions, studyNotes, customStudyPlans, usefulPhrases, aiContents, progressRecords
- Public (1 v3): publicApiContent
- Meta (2 v4): contentMeta, userContentEdits
- Exercises (4 v5): speakingExercises, writingExercises, readingExercises, listeningExercises
- Artifacts (1 v6): artifacts
- Events (1 v7): learningEvents
- YouTube (19 v8): youtubeVideos, transcripts, videoAnalyses, videoVocabularySources, savedSentences, timestampedNotes, learningPlaylists, playlistItems, videoStudySessions, studyActivities, youtubeExercises, exerciseAttempts, dictationAttempts, shadowingAttempts, speakingAttempts, summaryAttempts, tutorInterventions, aiGenerationCache, channelEvaluations

**localStorage**: ielts-settings, ielts-roadmap, ielts-progress-snapshot, ielts-ai-tutor-engine, tutor-memory-*

**Extension chrome.storage.local**: 20+ keys (aiApiKey, extensionSettings, engine-*, yt-learning-*)

---

## 3. Findings

### Critical

**C-01: Feature components parse engine output as raw JSON**
- `apps/web/src/services/learning/ai-exercise-session.ts:65-68` — `content.indexOf('{')`, `JSON.parse(jsonStr)` — loses type safety

**C-02: Writing/Speaking evaluation is heuristic-only**
- `packages/learning-engine/src/skills/writing/writing-module.ts`, `speaking/speaking-module.ts` — `evaluate()` does word count only. `evaluationPolicy: 'ai-assisted'` not wired.

**C-03: Engine bootstrap builds minimal learner context**
- `apps/web/src/services/engineBootstrap.ts:220-260` — `buildLearningContext()` returns hardcoded empty arrays

**C-04: Extension calls OpenAI directly in ArticleCollector**
- `apps/extension/src/popup/components/ArticleCollector.tsx` — directly fetches `{baseUrl}/chat/completions`, bypasses `@ielts/ai`

**C-05: No feedback loop from learning outcomes to AI Tutor Engine**
- After `submitAndComplete()`, no component calls `AITutorEngine.handleLearningEvent()`

### High

**H-01: Extension maintains separate persistence** — 5 IndexedDB stores + 8 engine adapters + 20 chrome.storage keys

**H-02: AI Tutor Engine has no domain tests** — 4 test files only cover utilities/IO

**H-03: Duplicate proactive message implementations** — `proactive/` (new) + `services/proactiveMessageEngine.ts` (legacy)

**H-04: 383 pre-existing web test failures** — Must be isolated before migration

**H-05: AI config read directly from localStorage in app code** — `readAiConfig()` parses localStorage manually

**H-06: No semantic cancellation for AI operations** — No AbortController, stale responses can overwrite

**H-07: Multiple exercise models with inconsistent fields** — 3 models: typed union (shared), re-export (engine), flat (storage)

### Medium

**M-01: DailyPlanEngine (2116 lines) is a god class** — Largest file, mixed concerns

**M-02: daily-plan/types.ts (797 lines) duplicates domain types** — Mirrors domain entities with different shapes

**M-03: Grammar learning mixes seed exercises + AI generation** — 30 hardcoded exercises + AI path

**M-04: Web features use different session models than engine** — 4+ custom session interfaces

**M-05: Settings in 3 locations** — localStorage, @ielts/settings, chrome.storage

**M-06: Test file duplicates** — `useProactiveMessages.test.ts` duplicates `chatHelpers.test.ts`

### Low

**L-01: Empty component directories in AI Tutor Engine** — `components/`, `presentation/components/`, `presentation/hooks/` all empty

**L-02: Backup schema only covers 27 of 53 tables** — YouTube tables excluded

**L-03: Brittle difficulty mapping** — `difficulty.includes('6')` in ai-exercise-session.ts

---

## 4. Target Architecture

### 4.1 Dependency Diagram

```
APPLICATIONS (web, extension)
       │
       ▼
APPLICATION PORTS (LearningEnginePort, AITutorEnginePort, StudyPlanPort)
       │               │                  │
       ▼               ▼                  ▼
  @ielts/        @ielts/            @ielts/learning-engine
  learning-engine ai-tutor-engine    (daily-plan/)
  (sessions,     (chat, context,     (plan generation,
   attempts,      memory, proactive,  regeneration,
   evaluation,     skill tutors)      feasibility)
   skill modules,
   evidence)
       │               │                  │
       └───────────────┼──────────────────┘
                       ▼
              SHARED LAYER
    @ielts/shared | @ielts/ai | @ielts/storage
```

### 4.2 Engine Boundaries

**Learning Engine owns**: Learning objectives, sessions, exercises, attempts, evaluation, difficulty adaptation, mistake/skill/progress/vocabulary evidence, review activities, offline exercise templates, learning result events

**AI Tutor Engine owns**: Learner context construction, learner state understanding, tutor memory, teaching strategies, AI-generated content, AI-assisted evaluation, progress interpretation, next-best-action recommendations, proactive tutoring, tutor conversations

**Study Plan Engine owns**: Exam timeline, study phases, weekly objectives, scheduled dates, capacity, skill allocation, roadmap task scheduling, review/mock scheduling, feasibility, regeneration, missed-task rescheduling

### 4.3 Public Facades

**LearningEngineFacade** (exists, needs stabilization):
```typescript
interface LearningEngineFacade {
  createSession(req): OperationResult<LearningSession>
  resumeSession(id): OperationResult<LearningSession>
  completeSession(req): OperationResult<LearningOutcome>
  generateActivity(req): OperationResult<LearningActivity>
  startAttempt(req): OperationResult<LearningAttempt>
  submitAnswer(req): OperationResult<SubmitAnswerResult>
  adaptDifficulty(req): OperationResult<DifficultyDecision>
  generateMistakeReview(req): OperationResult<MistakeReviewResult>
  publishEvent(event): void
}
```

**AITutorEngineFacade** (exists, needs stabilization):
```typescript
interface AITutorEngineFacade {
  initialize(): Promise<void>
  chat(req): OperationResult<ChatResult>
  getNextBestAction(state): OperationResult<NextBestAction>
  generateProgressReview(req): OperationResult<ProgressReviewResult>
  generateContextSuggestions(state): OperationResult<Suggestion[]>
  handleLearningEvent(event): Promise<void>
  updateMemory(req): OperationResult<void>
  getTutorState(): TutorState
}
```

### 4.4 Data Flow: Target Pipeline

```
Study Plan → scheduled task
  → LearningEngine.createSession()
  → LearningEngine.generateActivity() → SkillModule (template or AI)
  → LearningEngine.startAttempt()
  → User submits → LearningEngine.submitAnswer()
    → EvaluationPolicy (deterministic or AI-assisted)
  → LearningEngine.completeSession()
    → builds LearningOutcome (mistakes, evidence, progress, vocabulary)
    → StudyPlanPort.markTaskFulfilled()
    → AITutorEngine.handleLearningEvent(event)
      → updates tutor memory
      → evaluates proactive opportunities
    → OutcomeRepository stores evidence
    → MistakeRepository stores mistakes
    → VocabularyRepository updates mastery
```

---

## 5. Gap Analysis

| Area | Current | Target | Gap | Priority |
|------|---------|--------|-----|----------|
| **Exercise model** | 3 models (shared, engine, storage) | Single canonical model | Storage is flat, loses type structure | **C** |
| **AI client** | 4+ AI call paths | All through `@ielts/ai` | Multiple bypasses | **C** |
| **Writing evaluation** | Heuristic only | AI-powered | Not wired | **C** |
| **Speaking evaluation** | Heuristic only | AI-powered | Not wired | **C** |
| **Learner context** | Partial + hardcoded empties | Full from 9 sources | Context sources missing | **C** |
| **Learning → Tutor** | No outcomes sent | Events flow to tutor | Missing feedback loop | **C** |
| **Bridge typing** | `JSON.parse` of engine output | Typed facade responses | Breaks type safety | **C** |
| **Exercise generation** | Engine + hardcoded components | All through engine | Components duplicate logic | **H** |
| **Persistence** | `@ielts/storage` + extension DB | `@ielts/storage` only | Extension separate | **H** |
| **Proactive tutor** | Dual implementation | Single | Legacy code not removed | **H** |
| **AI Tutor tests** | No domain tests | Full coverage | Complete gap | **H** |
| **Settings** | 3 locations | Single flow | Fragmented | **M** |
| **Web tests** | 383 failures | All pass | Remediation needed | **H** |
| **DailyPlanEngine** | 2116 lines | Modular | God class | **M** |

---

## 6. Refactoring Phases

### Phase 0: Baseline (Weeks 1-2)
- Fix/isolate 383 pre-existing web test failures
- Add 20+ domain tests for AI Tutor Engine
- Add characterization tests for `ai-exercise-session.ts`

### Phase 1: Shared Contracts (Weeks 2-4)
- Remove `exercise-question.ts` re-export from learning-engine
- Add storage serialization adapter for typed `ExerciseQuestion`
- Validate all port interfaces

### Phase 2: Learning Engine Facade (Weeks 3-5)
- Fix `ai-exercise-session.ts` to use typed engine responses
- Wire all 9 learner context sources in `engineBootstrap.ts`
- Connect MistakeRepository, VocabularyRepository ports
- Send learning outcomes to AITutorEngine

### Phase 3: Skill Module Adoption (Weeks 5-8)
- Migrate Vocabulary → engine (lowest risk)
- Migrate Grammar → engine
- Migrate Reading, Listening, Writing, Speaking → engine
- Remove hardcoded generation from each feature

### Phase 4: AI Evaluation (Weeks 6-9)
- Wire Writing/Speaking evaluation to AI Tutor Engine
- Add evaluation prompts and schemas to `@ielts/ai`
- Mock-tested AI evaluation

### Phase 5: AI Tutor Integration (Weeks 8-11)
- Wire full learner context
- Send learning events → tutor
- Remove legacy `proactiveMessageEngine`
- Remove legacy `services/` files

### Phase 6: Storage Consolidation (Weeks 10-13)
- Extension uses `@ielts/storage` (not separate IDB)
- Remove `engine-adapters/`, extension IDB code
- `ArticleCollector` uses `@ielts/ai` (not direct fetch)

### Phase 7: Settings Centralization (Week 12)
- Web + extension read through `@ielts/settings`
- Single `getSettings()` call

### Phase 8: Cleanup (Weeks 14-15)
- Remove verified unused files
- Remove legacy mappers if no consumers
- Verify zero direct AI calls from apps

---

## 7. File-by-File Plan

### `@ielts/shared`
- `exercise-question.ts` — **Keep** (canonical)
- `mappers/legacy-to-canonical.ts` — **Deprecate→Remove** after no consumers
- `learner-context.ts`, `validation.ts` — **Keep**

### `@ielts/learning-engine`
- `exercise-question.ts` — **Remove** after migration (re-export)
- `DailyPlanEngine.ts` — **Split** into 3-4 modules
- `daily-plan/types.ts` — **Split** (use domain entities where possible)
- `writing-module.ts`, `speaking-module.ts` — **Keep and enrich** with AI evaluation
- `learning-engine-facade.ts` — **Keep, promote** as standard entry point
- `submit-answer.ts` — **Add event publishing** after completion

### `@ielts/ai-tutor-engine`
- `services/proactiveMessageEngine.ts` — **Deprecate→Remove**
- `services/messageStorage.ts` — **Deprecate→Remove**
- `services/proactiveEventBus.ts` — **Keep**
- `learner-context-builder.ts` — **Keep, wire properly**
- `proactive-tutor-orchestrator.ts`, `default-generators.ts` — **Keep**
- `tutor-ai-client.ts`, `tutor-prompt-builder.ts` — **Keep**
- 6 skill tutor modules in `skill-modules/` — **Keep and enrich**
- 5 domain policies — **Keep**
- 3 domain services — **Keep**
- `useProactiveMessages.test.ts` — **Delete** (duplicate)
- Empty `components/`, `presentation/` dirs — **Delete**

### `@ielts/ai`
- All service files — **Keep** (canonical)
- `client/index.ts`, `adapters/openai.ts` — **Keep**
- `utils/generateResultCache.ts` — **Keep**

### `@ielts/storage`
- `schema.ts` (exerciseEntrySchema) — **Migrate** (store typed JSON)
- `backup/types.ts` — **Migrate** (include all 53 tables)
- `appExportDataSchema` — **Migrate** (include YouTube tables)
- `MistakeRepository` — **Keep and extend** (add pattern methods)

### `apps/web`
- `engineBootstrap.ts` — **Rewrite**: use `@ielts/ai` client, wire full context, connect events
- `ai-exercise-session.ts` — **Rewrite**: typed facade, send learning events
- `vocabularyEnrichmentService.ts` — **Replace** (move to AI Tutor Engine)
- `ReadingPractice.tsx` — **Convert**: use `engine.generateActivity()`
- `ListeningPractice.tsx` — **Convert**
- `WritingPractice.tsx` — **Convert** + AI evaluation
- `SpeakingPractice.tsx` — **Convert** + AI evaluation
- `GrammarLearning.tsx` — **Convert**: use engine exclusively
- `VocabularyManager.tsx` — **Convert**: use engine for exercises
- `vocabularyService.ts` — **Replace** enrichment with engine call
- `progressService.ts` — **Deprecate** (use engine evidence output)

### `apps/extension`
- `storage/engine-adapters/*` — **Remove** after migration to `@ielts/storage`
- `storage/db.ts`, `storage/indexedDB.ts` — **Remove** after migration
- `services/aiEnrichmentService.ts` — **Remove** after migration
- `ArticleCollector.tsx` — **Rewrite**: use `@ielts/ai`
- `aiExplain.ts` — **Keep** (already uses `@ielts/ai`)
- `VideoHelper.tsx` — **Keep** (already uses `@ielts/ai`)
- `reviewService.ts` — **Keep** (correct)

---

## 8. Data Migration Plan

### Legacy → Canonical Mapping

| Legacy Table | Target | Key Mappings |
|-------------|--------|-------------|
| `readingSessions` | `LearningOutcome` | `accuracy → score/maxScore`, `mistakes → MistakeEvidence[]` |
| `listeningSessions` | `LearningOutcome` | Same pattern |
| `writingSessions` | `LearningOutcome` + `WritingEvaluation` | Preserve essay text |
| `speakingSessions` | `LearningOutcome` + `SpeakingEvaluation` | Preserve recording ref |
| `grammarNotes` | `MistakeEvidence[]` | Link to skill=grammar |
| `vocabulary` | Keep + add engine mastery | SM-2 fields already present |
| `vocabularyReviews` | Keep | Already correct |
| `mistakes` (web) | `MistakeEvidence` (14 fields) | Add skill, severity, confidence |
| `mistakes` (ext) | `MistakeEvidence` | Same mapping, merge with web |
| `learningEntries` (ext) | `VocabularyEvidence[]` + `LearningOutcome` | Category-dependent |

### Strategy
1. **Backward-compatible reads**: Old tables remain readable forever
2. **Write-new, read-old**: Engine writes canonical; legacy reads continue on old tables
3. **Idle migration**: Background migration on startup
4. **No forced migration**: Old data never deleted

### Preservation Guarantees
- All IDs preserved (UUIDs)
- All timestamps preserved
- All user content preserved
- Dedup by (skill, originalResponse) for mistakes
- Dedup by (word, source) for vocabulary

---

## 9. Testing Strategy

### Characterization Tests (Phase 0)
- Snapshot current AI-generated exercise output
- Integration tests with in-memory repositories
- AI Tutor Engine: 20+ new domain tests

### Contract Tests (Phase 1)
- ExerciseQuestion round-trip: typed → storage → typed
- LearnerContext completeness: all 9 sources

### Domain Tests (Phases 2-4)
- Difficulty policy, deterministic grader, evaluation policy
- Mistake evidence builder (recurrence, severity)
- Skill evidence builder (trend detection)

### AI Tests (Phase 4)
- Prompt schema validation (Zod)
- Timeout and cancellation (AbortController)
- Cache hit/miss behavior
- Writing/Speaking evaluation with mocked AI

### Persistence Tests (Phase 6)
- Extension → @ielts/storage migration (fake-indexeddb)
- Backup with 53 tables

### Integration Tests
- Full session lifecycle: create → generate → attempt → submit → complete
- AI evaluation with mocked responses
- Mistake extraction pipeline
- Learning outcome → Tutor event

### Phase Gates
| Phase | Gate |
|-------|------|
| 0 | `pnpm ai` passes |
| 1 | Storage adapter round-trip |
| 2 | Typed engine responses |
| 3 | Feature integration with engine |
| 4 | AI evaluation mock tests |
| 5 | Event flow verified |
| 6 | Extension → @ielts/storage |
| 9 | Historical data readable |

---

## 10. Risk Register

| Risk | Prob | Impact | Detection | Prevention | Rollback |
|------|------|--------|-----------|------------|----------|
| Data loss during storage consolidation | M | H | Migration test failure | Backward-compatible reads; Export/Import safety net | Revert Phase 6, restore from export |
| Duplicate outcomes (old + new paths) | M | M | Duplicate records | Feature flags; log code path | Disable new path |
| AI regression | M | H | A/B comparison | Mocks; canary Phase 4 | Fall back to heuristic |
| Circular dependencies | L | H | madge check | Event bus decouples | Revert offending commit |
| Offline regression | M | H | Manual test | Keep old storage until verified | Revert storage changes |
| Migration crash | M | H | initDb retry | Schema versioning | clearAppliedVersion() + reload |
| Web ↔ Extension drift | H | M | Cross-platform test | Shared schemas | Pin shared types |
| Performance regression | L | M | Benchmark | Thin adapters; cache | Remove adapter |
| Bundle size growth | M | L | CI tracking | Tree-shake; remove legacy | Deferred |

---

## 11. Cleanup Candidates

### Safe to Remove
- `packages/ai-tutor-engine/src/tests/useProactiveMessages.test.ts` (duplicate)
- `packages/ai-tutor-engine/src/components/` (empty)
- `packages/ai-tutor-engine/src/presentation/components/` (empty)
- `packages/ai-tutor-engine/src/presentation/hooks/` (empty)

### Migrate Then Remove
- `apps/extension/src/storage/engine-adapters/*`
- `apps/extension/src/storage/db.ts`, `indexedDB.ts`
- `apps/extension/src/services/aiEnrichmentService.ts`
- `apps/web/src/services/ai/vocabularyEnrichmentService.ts`
- `packages/ai-tutor-engine/src/services/proactiveMessageEngine.ts`
- `packages/ai-tutor-engine/src/services/messageStorage.ts`
- `packages/learning-engine/src/domain/entities/exercise-question.ts`
- `packages/shared/src/mappers/legacy-to-canonical.ts`
- `apps/web/src/features/progress/progressService.ts`

### Keep for Compatibility
- Old session tables in `@ielts/storage`
- `localStorage['ielts-settings']`
- Extension `chrome.storage` keys
- Legacy `services/` in ai-tutor-engine (until migrated)

### Needs Further Verification
- `packages/learning-engine/src/daily-plan/types.ts`
- `apps/web/src/services/ai/AIService.ts`
- `packages/ai-tutor-engine/src/domain/entities/tutor-memory.ts`

---

## 12. Baseline Verification

| Check | Result |
|-------|--------|
| TypeScript — `@ielts/learning-engine` | ✅ PASS |
| TypeScript — `@ielts/ai-tutor-engine` | ✅ PASS |
| TypeScript — `@ielts/ai` | ✅ PASS |
| TypeScript — `@ielts/storage` | ✅ PASS |
| TypeScript — `@ielts/shared` | ✅ PASS |
| Tests — `@ielts/learning-engine` | ✅ 12 files, 248 tests, ALL PASS |
| Tests — `@ielts/ai-tutor-engine` | ✅ 4 files, 46 tests, ALL PASS |
| Tests — `@ielts/ai` | ✅ 8 files, 147 tests, ALL PASS |
| Tests — `@ielts/storage` | ✅ 11 files, 161 tests, ALL PASS |
| Tests — `@ielts/extension` | ✅ 10 files, 219 tests, ALL PASS |
| Tests — `@ielts/web` | ❌ 37 FAIL, 41 pass (383/1206) — pre-existing |
| Circular dependencies | ✅ No circular deps found |
| Documentation | ✅ 62 new docs files (accurate, current) |

---

## 13. Implementation Checklist

- [ ] **Phase 0**: Fix/isolate 383 web test failures; add AI Tutor Engine domain tests
- [ ] **Phase 1**: Consolidate ExerciseQuestion; storage serialization adapter
- [ ] **Phase 2**: Typed engine responses; full learner context; event publishing
- [ ] **Phase 3**: Migrate vocabulary → grammar → reading → listening → writing → speaking
- [ ] **Phase 4**: Wire AI evaluation for Writing and Speaking
- [ ] **Phase 5**: Full AI Tutor Engine integration; remove legacy services
- [ ] **Phase 6**: Extension storage consolidation; remove direct AI calls
- [ ] **Phase 7**: Centralized settings
- [ ] **Phase 8**: Remove verified dead code; zero direct AI calls in apps
- [ ] **Verification**: typecheck, lint, tests, builds all pass

---

## 14. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | Every exercise generation uses Learning Engine facade | `grep generateActivity apps/web/src/features/` shows all 6 skills |
| 2 | Single ExerciseQuestion model | `packages/learning-engine/src/domain/entities/exercise-question.ts` removed |
| 3 | Single AI service path through `@ielts/ai` | `grep -r "callAI" apps/` only in legit engine dependencies |
| 4 | Writing/Speaking evaluation uses AI Tutor Engine | Integration test with mocked AI |
| 5 | Learning outcomes update progress, mistakes, vocabulary | Engine evidence pipeline verified |
| 6 | Outcomes published to AI Tutor Engine | `handleLearningEvent` receives events |
| 7 | Roadmap task fulfillment is idempotent | `markTaskFulfilled` safe to call multiple times |
| 8 | Web and extension use compatible contracts | Both import from `@ielts/shared` |
| 9 | Offline mode supports complete sessions | Manual test: offline → practice → reconnect |
| 10 | Existing user data remains readable | `exportAllData()` includes all records |
| 11 | `pnpm typecheck` passes | Exit code 0 |
| 12 | `pnpm lint` passes | Exit code 0 |
| 13 | `pnpm ai` passes | Exit code 0 for all package tests |
| 14 | `pnpm build` passes | Exit code 0 |
| 15 | No circular dependencies | `npx madge --circular` |
| 16 | Zero direct AI calls from apps | `grep "callAI\|/chat/completions" apps/web/src/features/ apps/extension/src/popup/` returns zero |
| 17 | Zero JSON.parse of AI responses in components | `grep "JSON.parse" apps/web/src/features/` returns only non-AI uses |

---

## 15. Repository State

| Property | Value |
|----------|-------|
| Branch | `main` |
| Last commit | `5461dcf` fix: resolve broken import paths |
| Staged changes | README.md modified, 60+ docs/ files deleted |
| Untracked | New `docs/` directory (62 files), `.flowtask/`, `.wrangler/` |
| No uncommitted source changes | ✅ |
| TypeScript | Strict mode, ES2020 |
| Build system | pnpm workspaces, Vite 6, Vitest 3 |
| Users | Local-first, no backend, user owns AI API key |

### Pre-Migration Steps
1. Commit or stash `docs/` changes (deletion + new docs)
2. Isolate 383 failing web tests as known failures
3. Add AI Tutor Engine domain tests (20+ files)
4. Install `madge` for circular dependency detection
