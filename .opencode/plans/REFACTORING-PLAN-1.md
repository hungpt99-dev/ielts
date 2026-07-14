# IELTS Journey — Complete Refactoring Plan

## 1. Executive Summary

### Current Architecture
The IELTS Journey codebase is a local-first, offline-capable monorepo with 2 applications (web React 19 SPA + Chrome MV3 extension) and 8 shared packages. It uses three hexagonal engines (Learning Engine, AI Tutor Engine, Study Plan Engine inside Learning Engine) with ports-and-adapters architecture. Data lives in IndexedDB (47 tables, Dexie) with web app as primary and extension as secondary. All AI calls route through the `@ielts/ai` package.

### Primary Problems
1. **Duplicate models** — 10+ model sets duplicated between shared, learning-engine domain, and web models (LearningAttempt, AnswerEvaluation, LearningOutcome, MistakeEvidence, etc.)
2. **Fragmented exercise generation** — Exercises generated via engine AND via component-level AI calls
3. **Direct AI bypasses from React** — 12+ locations call `callAI` directly from UI components/services
4. **Incomplete feedback loop** — Learning outcomes not universally fed back to Tutor Engine, progress, mistakes, vocabulary, roadmap
5. **Six event systems** — SharedLearningEvent, LearningEvent, TutorEvent, eventEmitters, LearningEventBus, postMessage bridge
6. **Engine bootstrap coupling** — `engineBootstrap.ts` wires adapters directly to DatabaseService bypassing port contracts
7. **Incomplete context awareness** — Learning Engine's context port returns hardcoded minimal context
8. **Extension engine adapter duplication** — 8 adapter files duplicating web app logic
9. **Legacy services/ directory** with dead/delegating code
10. **Pre-existing test failures** — 17 failures in SettingsStorage and progressReviewService tests

### Recommended Target
A fully hexagonal system where every learning feature flows through the Learning Engine facade, all AI outcomes feed the AI Tutor Engine, Study Plan Engine schedules independently, and web/extension share contracts with platform-specific adapters only at infrastructure boundaries.

### Estimated Complexity
**High** — 9 phases, ~150+ files affected. Estimated 4-8 weeks.

### Highest-Risk Areas
1. Settings migration (pre-existing test failures)
2. Existing user data migration (IndexedDB schema)
3. AI behavior changes when consolidating prompts
4. Extension sync compatibility during migration
5. Offline mode regression for YouTube learning

---

## 2. Current Architecture

### 2.1 Package Map

```
@ielts/web (apps/web) — React 19, Vite 6, 25+ routes
  Deps: all 8 packages
  AI calls: 7 direct callAI sites + wrapper in engineBootstrap

@ielts/extension (apps/extension) — Chrome MV3
  Deps: all 8 packages
  AI calls: 11 direct callAI sites

@ielts/ai (packages/ai) — AI client, prompts, schemas, cache
  Exports: callAI, createAIClient, OpenAIAdapter, 40+ Zod schemas
  Services: explain, dictionary, vocabulary, video, article

@ielts/ai-tutor-engine — Hexagonal AI Tutor
  Exports: AITutorEngine facade, 13 ports, context, memory, proactive, 6 skill modules
  AI: TutorAIClient + FallbackTutorAIClient + FallbackPolicy (2 retries)
  Legacy: services/{proactiveMessageEngine,messageStorage,proactiveEventBus}.ts

@ielts/learning-engine — Hexagonal Learning + Study Plan
  Exports: LearningEngine facade, 12 ports, 6 skill modules, content system
  Study Plan: DailyPlanEngine, AiPlanOrchestrator, PlanRegenerator (inside daily-plan/)

@ielts/shared — Cross-engine contracts
  ~45 types/interfaces, 13 Zod validation schemas, shared events

@ielts/storage — IndexedDB via Dexie
  47 tables (v8), 43+ repository classes, backup/restore, sync

@ielts/settings — AI config, defaults, settings service
@ielts/theme — ThemeProvider, design tokens
@ielts/ui — 18 UI components, 66+ icons
```

### 2.2 Persistence Map

| Entity | Primary Store | Extension Store |
|--------|--------------|----------------|
| User Profile | localStorage (ielts-settings) | chrome.storage.local |
| Tasks/Roadmap | IndexedDB (tasks) | — |
| Progress | IndexedDB (progressRecords) | chrome.storage.local |
| Mistakes | IndexedDB (mistakes) | chrome.storage.local + IndexedDB |
| Vocabulary | IndexedDB (vocabulary + vocabularyReviews) | IndexedDB + chrome.storage.local |
| Learning Sessions | IndexedDB (per-skill tables: readingSessions, etc.) | chrome.storage.local |
| Tutor Memory | localStorage (tutor-memory-*) | — |
| Chat Messages | IndexedDB (aiContents?) | — |
| Proactive Messages | localStorage + chrome.storage | chrome.storage.local |
| AI Cache | In-memory (AiGenerateResultCache) | — |
| YouTube Data | IndexedDB (youtube-* tables) | IndexedDB + chrome.storage |

### 2.3 Feature Matrix (Key Excerpts)

| Feature | Generator | AI Caller | Profile-Aware | Learning Engine | AI Tutor Engine | Feedback Loop |
|---------|-----------|-----------|---------------|----------------|-----------------|---------------|
| Reading Practice | Engine + Component | Via ports + direct callAI | Partial | Yes (partial) | No | Partial |
| Writing Practice | Engine + Component | evaluateOpenResponse (engineBootstrap) | No | Yes (partial) | No | Partial |
| Speaking Practice | Engine + Component | Self-eval + evaluateOpenResponse | No | Yes (partial) | No | Partial |
| Grammar Practice | Component + Engine | Via engine port | No | Yes (partial) | No | Partial |
| Vocabulary | Component (SM-2) + Engine | Direct callAI (vocabularyEnrichmentService) | Partial | Partial | No | Partial |
| AI Tutor Chat | — | TutorAIClient (wraps callAI) | Yes (full) | No | Yes | Yes |
| Proactive Messages | AI Tutor Engine | TutorAIClient | Yes | No | Yes | Partial |
| YouTube Learning | Engine (extension) | Direct callAI | Partial | Yes (ext) | No | Partial |
| Selected Text | — | Direct callAI (aiExplain.ts) | No | No | No | No |

---

## 3. Findings

### 3.1 Critical

| ID | Finding | Evidence | Detail |
|----|---------|----------|--------|
| C1 | Learning Engine context port returns hardcoded minimal context | `learning-engine/src/infrastructure/adapters/` — InMemoryLearnerContextAdapter | Empty skill bands, empty progress, hardcoded defaults |
| C2 | Exercise generation has 3 parallel paths | Engine (generateActivity) + Component (classify.ts) + Extension (direct callAI) | `apps/web/src/features/publicApiIntegration/ai/classify.ts` has 7 AI generators |
| C3 | AI evaluation wired through engineBootstrap.ts (bypasses port) | `engineBootstrap.ts:570-591` | `evaluateOpenResponse()` directly calls `callAI` instead of TutorIntelligencePort |
| C4 | ProgressRepository is a stub | `learning-engine/src/ports/progress-repository.ts` | Real calculation in `apps/web/src/features/progress/progressService.ts` |
| C5 | 12+ direct AI calls from React components | Extension: VocabularyCollector, ArticleCollector, SavedItemDetailView, aiExplain, youtube-learning; Web: classify.ts, vocabularyEnrichmentService, engineBootstrap | No engine abstraction |
| C6 | No test coverage for Learning Engine or AI Tutor Engine facades | Codegraph: "no covering tests found" for both facades | Untracked test files exist |

### 3.2 High

| ID | Finding | Evidence |
|----|---------|----------|
| H1 | 10+ model sets duplicated | LearningAttempt (3 copies), AnswerEvaluation (2), LearningOutcome (3), MistakeEvidence (3), etc. between shared/, learning-engine/domain/, and web/extension |
| H2 | Three event systems + bridge + EventBus | SharedLearningEvent (30 types), LearningEvent (7 types), TutorEvent (11 types), eventEmitters (10), postMessage bridge |
| H3 | Study Plan Engine inside Learning Engine | `learning-engine/src/daily-plan/` — 6 files with test files and design doc |
| H4 | Extension engine adapters duplicate web adapter code | `apps/extension/src/storage/engine-adapters/` — 8 files re-implementing engineBootstrap logic |
| H5 | Legacy services/ directory not fully dead | `ai-tutor-engine/src/services/` — documented as delegating but still exists |
| H6 | 17 pre-existing test failures | SettingsStorage (4), progressReviewService (3), others | In-progress refactoring broke existing tests |

### 3.3 Medium

| ID | Finding |
|----|---------|
| M1 | In-memory AI cache not persisted across sessions |
| M2 | No retry logic at AI client level (only in engine layers) |
| M3 | 203 lint warnings (all warnings, no errors) |
| M4 | Duplicate SM-2 implementations (web + extension) |
| M5 | Prompt construction in extension UI components |
| M6 | Two recommendation systems (Learning Engine + AI Tutor Engine) |

### 3.4 Low

| ID | Finding |
|----|---------|
| L1 | Per-skill Dexie tables for old sessions remain write-targets |
| L2 | No circular dependency or bundle-size analysis configured |
| L3 | Commented-out code in daily-plan/types.ts |
| L4 | Duplicate aiTutor directories (different casing) in web app |

---

## 4. Target Architecture

### 4.1 Package Dependency Diagram

```
┌─────────────┐     ┌───────────────┐     ┌──────────┐
│  @ielts/web  │     │@ielts/extension│     │@ielts/ai │
└──────┬───────┘     └───────┬───────┘     └────┬─────┘
       │                     │                  │
       ▼                     ▼                  │
┌──────────────────────────────────────┐        │
│       @ielts/study-plan-engine        │        │
│  (extracted from learning-engine)     │        │
└─────────────────┬────────────────────┘        │
                  │                             │
                  ▼                             │
┌──────────────────────────────────────┐        │
│       @ielts/learning-engine          │        │
│  (sessions, exercises, evaluation)    │        │
└─────────────────┬────────────────────┘        │
                  │                             │
                  ▼                             │
┌──────────────────────────────────────┐        │
│       @ielts/ai-tutor-engine          │◄───────┘
│  (context, memory, proactive, chat)  │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│           @ielts/shared               │
│  (canonical types, events, schemas)  │
└─────────────────┬────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────┐
│          @ielts/storage               │
│  (Dexie, migrations, repositories)   │
└──────────────────────────────────────┘

@ielts/ui ← @ielts/theme (presentation only)
@ielts/settings (consumed by applications, not engines)

Dependencies flow downward only.
No circular package dependencies.
```

### 4.2 Engine Responsibilities

| Engine | Owns | Consumes | Does NOT Own |
|--------|------|----------|-------------|
| **Study Plan Engine** | Exam timeline, phases, weekly objectives, schedules, capacity, skill allocation, task scheduling, review scheduling, plan feasibility, regeneration | Profile data, AI enrichment (optional) | Exercise generation, evaluation, session lifecycle |
| **Learning Engine** | Objectives, sessions, lessons, activities, exercises, questions, attempts, submission, evaluation, difficulty, mistakes, skills, progress, vocabulary, review activities, event publication | Learner context (port), AI evaluation (port), study plan tasks (port) | Chat, proactive tutoring, memory, recommendations |
| **AI Tutor Engine** | Context construction, learner state, memory, strategies, AI content, open-response evaluation, progress interpretation, next-best-action, proactive tutoring, chat | Learning outcomes (from LE), learner data (through ports), AI client | Session lifecycle, exercise generation (deterministic), study scheduling |

### 4.3 Data Flow — Roadmap Task to Completed Outcome

```
User clicks roadmap task
  → StudyPlanEngine.getCurrentTask() returns task
  → LearningEngine.createSessionFromRoadmapTask(task)
    → LearnerContextPort.buildLearningContext(scope) returns full context (now real, not hardcoded)
  → LearningEngine.generateActivity(context + skill) returns Exercise
  → User completes exercise
  → LearningEngine.submitAnswer(answers) returns Evaluation
  → LearningEngine.completeSession()
    → saves LearningOutcome (canonical)
    → StudyPlanPort.markTaskFulfilled(taskId) — idempotent
    → MistakeRepository.save(mistakes) — canonical
    → VocabularyRepository.updateMastery(vocab) — if applicable
    → ProgressRepository.saveSnapshot(progress) — computed from outcomes
    → AITutorEngine.handleLearningEvent(outcome event)
      → TutorMemoryManager.updateMemory(outcome)
      → ProactiveTutorOrchestrator.evaluateOpportunity(new state)
```

### 4.4 Port Proposals

| Port | Owner | Key Methods |
|------|-------|------------|
| LearnerContextPort | AI Tutor Engine | `buildLearningContext(request): Promise<LearnerContext>` |
| TutorIntelligencePort | AI Tutor Engine | `evaluateOpenResponse(request)`, `generateEducationalContent(request)`, `recordLearningOutcome(outcome)` |
| StudyPlanPort | Study Plan Engine | `getCurrentTask()`, `getTaskById(id)`, `markTaskFulfilled(id)` |
| SessionRepository | Storage | CRUD for LearningSession |
| AttemptRepository | Storage | CRUD for LearningAttempt |
| OutcomeRepository | Storage | CRUD for LearningOutcome |
| MistakeRepository | Storage | CRUD for MistakeEvidence |
| VocabularyRepository | Storage | CRUD, getDueForReview, updateMastery |
| ProgressRepository | Storage | saveSnapshot, getTrend, getAggregate |
| ClockPort | Shared | now(), today() |
| AIProviderPort | @ielts/ai | call(systemPrompt, userMessage, config) |

---

## 5. Gap Analysis

| Current State | Target State | Gap |
|--------------|-------------|-----|
| Learning Engine context: hardcoded minimal | Full context from AI Tutor Engine | Wire real LearnerContextBuilder |
| 3 exercise generation paths | Single path through Learning Engine facade | Remove component-level generators |
| AI evaluation in engineBootstrap.ts | Through TutorIntelligencePort | Add evaluateOpenResponse to port |
| ProgressRepository stub | Real computation from outcomes | Implement progress computation |
| 10+ duplicated model sets | Single canonical in @ielts/shared | Remove duplicates; add mappers |
| 6 event systems | SharedLearningEvent as canonical | Consolidate event types |
| 12+ direct AI calls from React | All through engine ports | Move to appropriate engines |
| Two recommendation systems | Unified through AI Tutor Engine | Deprecate LE recommendations |
| Study Plan inside LE package | Separate @ielts/study-plan-engine | Extract daily-plan/ |
| Two SM-2 implementations | Single in @ielts/shared | Extract algorithm |
| Legacy services/ directory | Removed | Delete after verification |

---

## 6. Refactoring Phases

### Phase 0: Baseline (Week 1)
- Fix 17 pre-existing test failures
- Add characterization tests for current behavior
- Add facade tests for both engines
- Document current behavior

### Phase 1: Shared Contracts (Week 2)
- Remove duplicate model definitions from learning-engine/domain/
- Add canonical Zod schemas for all cross-engine types
- Add domain↔persistence mappers
- Consolidate ProactiveMessage
- Extract SM-2 to shared

### Phase 2: Learning Engine & Real Context (Weeks 3-4)
- Replace InMemoryLearnerContextAdapter with real context wiring
- Implement ProgressRepository from outcomes
- Fix attempt lifecycle (no pre-submission)
- Wire all 6 skill modules through facade

### Phase 3: Study Plan Engine Extraction (Week 5)
- Create @ielts/study-plan-engine package
- Move daily-plan/ files
- Move roadmapService AI enrichment
- Update all imports

### Phase 4: AI Tutor Engine Integration (Weeks 6-7)
- Move evaluateOpenResponse to AI Tutor Engine
- Move generateEducationalContent to AI Tutor Engine
- Wire recordLearningOutcome through handleLearningEvent
- Move vocabulary enrichment AI calls
- Remove direct AI from classify.ts
- Remove direct AI from extension components

### Phase 5: Consumer Migration (Weeks 8-9)
- Migrate all 6 practice features to engine facade
- Migrate mistakes, vocabulary, dashboard, progress

### Phase 6: Extension Consolidation (Week 10)
- Extract common adapter patterns
- Refactor extension engine adapters
- Replace direct AI in YouTube learning
- Standardize events

### Phase 7: Data Migration (Week 11)
- Add v9 migration with canonical tables
- Copy data from per-skill tables
- Add backward-compatible readers
- Update import/export

### Phase 8: Event System Consolidation (Week 12)
- Map all event types to SharedLearningEvent
- Deprecate LearningEventBus
- Add event TTL

### Phase 9: Cleanup (Week 13)
- Remove legacy services/
- Remove duplicate model files
- Remove duplicate directories
- Remove unused exports

---

## 7. File-by-File Plan (Key Files)

| File | Problem | Action | New Owner |
|------|---------|--------|-----------|
| `learning-engine/src/domain/entities/learning-attempt.ts` | Duplicate of shared | Remove; reference shared | shared |
| `learning-engine/src/domain/entities/evaluation.ts` | Duplicate of shared | Remove; reference shared | shared |
| `learning-engine/src/domain/entities/feedback.ts` | Duplicate of shared | Remove; reference shared | shared |
| `learning-engine/src/domain/entities/learning-outcome.ts` | Duplicate of shared | Remove; reference shared | shared |
| `learning-engine/src/domain/entities/mistake-evidence.ts` | Duplicate of shared | Remove; reference shared | shared |
| `learning-engine/src/domain/entities/skill-evidence.ts` | Duplicate of shared | Remove; reference shared | shared |
| `learning-engine/src/domain/entities/learning-context.ts` | Context model | Deprecate; use shared LearnerContext | shared |
| `learning-engine/src/domain/entities/learning-recommendation.ts` | Duplicate recommendation | Deprecate; route through AI Tutor Engine | ai-tutor-engine |
| `learning-engine/src/infrastructure/adapters/` | Hardcoded context | Replace with real wiring | learning-engine |
| `learning-engine/src/ports/progress-repository.ts` | Stub | Implement properly | learning-engine |
| `learning-engine/src/daily-plan/` | Study Plan inside LE | Move to new package | study-plan-engine |
| `learning-engine/src/content/` | Content system | Keep | learning-engine |
| `ai-tutor-engine/src/services/proactiveMessageEngine.ts` | Legacy, delegates | Remove after verification | — |
| `ai-tutor-engine/src/services/messageStorage.ts` | Legacy | Remove after verification | — |
| `ai-tutor-engine/src/services/proactiveEventBus.ts` | Legacy | Remove after verification | — |
| `apps/web/src/services/engineBootstrap.ts` | God class (641 lines) | Split: extract AI wiring, adapter factories | web + shared |
| `apps/web/src/services/ai/vocabularyEnrichmentService.ts` | Direct AI call | Move to AI Tutor Engine | ai-tutor-engine |
| `apps/web/src/features/publicApiIntegration/ai/classify.ts` | 7 direct AI generators | Route through engine | learning-engine |
| `apps/web/src/features/reading/ReadingPractice.tsx` | Mixed engine + component | Use engine exclusively | web |
| `apps/web/src/features/writing/WritingPractice.tsx` | Mixed evaluation | Use evaluation port | web |
| `apps/web/src/features/grammar/GrammarLearning.tsx` | Component + inline | Use engine facade | web |
| `apps/web/src/features/roadmap/roadmapService.ts` | AI enrichment | Move to Study Plan Engine | study-plan-engine |
| `apps/web/src/models/index.ts` | 60+ UI models | Keep; reference shared for domain | web |
| `apps/web/src/features/aiTutor/` (lowercase) | Duplicate directory | Remove | — |
| `apps/web/src/storage/engine-adapters/` | Extension-specific | Refactor to use shared patterns | extension |
| `apps/web/src/popup/components/VocabularyCollector.tsx` | Direct AI call | Remove; route through AI Tutor Engine | extension |
| `apps/web/src/popup/components/ArticleCollector.tsx` | Direct AI call | Remove; route through engine | extension |
| `apps/web/src/popup/services/reviewService.ts` | Duplicate SM-2 | Use shared SM-2 | shared |
| `apps/web/src/youtube-learning/` | Direct AI calls | Route through AI Tutor Engine | extension |

---

## 8. Data Migration Plan

### Legacy → Canonical Table Mapping

| Legacy Table | New Table | Strategy |
|-------------|-----------|----------|
| readingSessions | learningSessions | Copy with 'rs-' prefixed IDs |
| listeningSessions | learningSessions | Copy with 'ls-' prefixed IDs |
| writingSessions | learningSessions + feedbacks | Split essay/feedback to feedback table |
| speakingSessions | learningSessions + feedbacks | Same |
| grammarNotes | learningSessions + mistakes | Convert notes to exercises |
| mistakes | mistakes (enhanced) | Keep; add new MistakeEvidence fields |
| progressRecords | progressRecords | Keep schema; add evidenceId |

### Migration Rules
1. Never delete old tables; always non-destructive copy
2. Migration cursor in localStorage for resumability
3. Old tables remain readable during transition
4. Export/import includes both old and new tables
5. Rollback: delete new tables, reset cursor

---

## 9. Testing Strategy

| Phase | Key Tests |
|-------|-----------|
| 0 | Characterization: all current AI call I/O, facade behavior; fix 17 failures |
| 1 | Contract: shared type schemas, mappers, serializers |
| 2 | Domain: session lifecycle, attempt lifecycle, policies, evidence builders |
| 2 | Integration: complete exercise→evaluation→outcome→progress pipeline |
| 3 | Integration: Study Plan Engine in own package |
| 4 | AI: TutorAIClient, FallbackPolicy, retry, timeout, cache |
| 4 | Integration: evaluateOpenResponse through TutorIntelligencePort |
| 5 | UI/Integration: all 6 practice flows through engine |
| 6 | Persistence: extension adapters, offline, engine bootstrap with adapters |
| 7 | Migration: v9 copy, backward-compatible readers, export/import |
| 8 | Event: production, consumption, versioning |
| 9 | Regression: no behavior change after cleanup |

---

## 10. Risk Register

| Risk | Likelihood | Impact | Prevention | Recovery |
|------|-----------|--------|------------|----------|
| User data loss | Medium | Critical | Never delete old tables; non-destructive copy | Restore from backup |
| Duplicate progress | High | High | Feature flags; migrate writes first | Recompute from canonical |
| Duplicate roadmap completion | Medium | Medium | Idempotent markTaskFulfilled | Deduplicate by event ID |
| Web/extension drift | High | Medium | Compatible sync protocol | Pin versions |
| Circular deps | Low | Critical | Enforce dependency direction | Inline types temporarily |
| AI behavior changes | Medium | High | Characterization tests before changes | Revert prompts |
| Cache incompatibility | Medium | Medium | Bump cache key on schema change | Clear cache |
| Offline regression | High | High | Keep extension adapter offline-native | Test with AI key removed |
| Late AI responses | Medium | High | correlationId; reject stale | Version attempts |
| Import/export breakage | High | High | Test with both schemas | Keep old format |
| Pre-existing test failures | High (current) | Medium | Fix before Phase 0 | Already tracked |

---

## 11. Cleanup Candidates

### Safe to Remove
- Empty hooks directory in ai-tutor-engine
- Already-deleted test files (commit `D` status)
- Duplicate aiTutor directory (lowercase)
- Commented-out code in daily-plan/types.ts
- Unused import of LearningEngine in ai-exercise-session.ts

### Migrate Then Remove
- Legacy services/ in ai-tutor-engine (verify no imports first)
- Per-skill session table writes from practice components
- Duplicate SM-2 in extension
- All 6 duplicate model files in learning-engine/domain/entities/

### Keep for Compatibility
- Per-skill session tables (read-only for historical data)
- ProgressRecord table (old schema)
- Old export format reader
- Extension adapter offline mode
- PostMessage bridge (platform-specific)

### Needs Verification
- useProactiveMessages hook (check if used)
- ProgressReview service (check component consumers)
- Search page, Artifacts, Notes features (verify if active)
- Sync service (verify real usage)
- PublicApiIntegration feature (verify if active)

---

## 12. Baseline Verification

| Check | Result |
|-------|--------|
| TypeScript (root) | PASS |
| TypeScript (all packages) | PASS (10/10) |
| Lint (all packages) | PASS (0 errors, 203 warnings) |
| Tests (all packages) | **3 FAILURES / 74 passed** |
| Git branch | `main` |
| Uncommitted changes | Modified + deleted + untracked files |

### Pre-existing Test Failures (must fix before Phase 0)
1. `SettingsStorage.test.ts` — 4 failures (aiEndpoint→aiBaseUrl migration)
2. `progressReviewService.test.ts` — 3 failures (AI mocking)
3. Additional failures in AIService.test.ts (untracked output)

---

## 13. Implementation Checklist

### Phase 0 — Baseline
- [ ] Fix 17 test failures
- [ ] Add characterization tests for engineBootstrap AI wrapper
- [ ] Add characterization tests for vocabularyEnrichmentService
- [ ] Add characterization tests for classify.ts generators
- [ ] Add facade tests for LearningEngine (createSession, generateActivity, submitAnswer, completeSession)
- [ ] Add facade tests for AITutorEngine (chat, evaluateProactiveSupport, handleLearningEvent)
- [ ] Commit Phase 0

### Phase 1 — Shared Contracts
- [ ] Remove duplicate types from learning-engine/domain/entities/
- [ ] Update learning-engine imports to reference @ielts/shared
- [ ] Add missing Zod schemas to shared/validation.ts
- [ ] Add domain↔persistence mappers to shared/src/mappers/
- [ ] Consolidate ProactiveMessage
- [ ] Standardize LearnerContext
- [ ] Extract SM-2 to shared/src/spaced-repetition.ts
- [ ] Typecheck + tests pass; commit

### Phase 2 — Learning Engine & Real Context
- [ ] Replace InMemoryLearnerContextAdapter with real wiring
- [ ] Wire LearnerContextPort in engineBootstrap
- [ ] Implement proper ProgressRepository
- [ ] Fix attempt pre-submission issue
- [ ] Update all 6 skill modules
- [ ] Typecheck + tests pass; commit

### Phase 3 — Study Plan Engine Extraction
- [ ] Create @ielts/study-plan-engine package
- [ ] Move daily-plan/ files
- [ ] Update imports and exports
- [ ] Move roadmapService AI enrichment
- [ ] Move planConverter.ts
- [ ] Typecheck + tests pass; commit

### Phase 4 — AI Tutor Engine Integration
- [ ] Move evaluateOpenResponse to AI Tutor Engine
- [ ] Move generateEducationalContent to AI Tutor Engine
- [ ] Wire recordLearningOutcome through handleLearningEvent
- [ ] Move vocabulary enrichment AI calls
- [ ] Remove direct AI from classify.ts
- [ ] Remove direct AI from extension components
- [ ] Typecheck + tests pass; commit

### Phase 5 — Consumer Migration
- [ ] Migrate ReadingPractice to engine exclusively
- [ ] Migrate ListeningPractice
- [ ] Migrate WritingPractice (evaluation port)
- [ ] Migrate SpeakingPractice (evaluation port)
- [ ] Migrate GrammarLearning (engine facade)
- [ ] Migrate MistakeNotebook (generateReview)
- [ ] Migrate VocabularyReview (engine module)
- [ ] Migrate Dashboard (computed evidence)
- [ ] Migrate Progress (ProgressRepository)
- [ ] Typecheck + tests pass; commit

### Phase 6 — Extension Consolidation
- [ ] Extract common adapter patterns from engineBootstrap
- [ ] Create shared adapter implementations in @ielts/storage
- [ ] Refactor extension engine adapters
- [ ] Replace direct AI in YouTube learning
- [ ] Remove duplicate SM-2
- [ ] Standardize extension events
- [ ] Typecheck + tests pass; commit

### Phase 7 — Data Migration
- [ ] Add v9 migration with canonical tables
- [ ] Write migration copies
- [ ] Add backward-compatible readers
- [ ] Update extension IndexedDB
- [ ] Update import/export
- [ ] Migration tests pass; commit

### Phase 8 — Event System Consolidation
- [ ] Map LearningEvent types to SharedLearningEvent
- [ ] Map TutorEvent types to SharedLearningEvent
- [ ] Deprecate LearningEventBus
- [ ] Map extension eventEmitters
- [ ] Add event TTL
- [ ] Typecheck + tests pass; commit

### Phase 9 — Cleanup
- [ ] Remove legacy services/ from ai-tutor-engine
- [ ] Remove duplicate model files
- [ ] Commit deleted test files
- [ ] Remove duplicate aiTutor directory
- [ ] Remove commented-out code
- [ ] Remove unused exports
- [ ] Typecheck + tests + builds pass; commit

---

## 14. Final Acceptance Criteria

| # | Criterion | Method |
|---|-----------|--------|
| 1 | No feature component calls low-level AI directly | `grep -r "callAI" apps/web/src/features/` = 0 |
| 2 | No learning component parses raw AI JSON | Zero non-engine `JSON.parse` in features |
| 3 | Every exercise uses Learning Engine facade | All callers go through `engine.generateActivity()` |
| 4 | Every attempt uses canonical lifecycle | `submitAnswer` not called before user answers |
| 5 | Every activity produces LearningOutcome | `completeSession` always saves outcome |
| 6 | Outcomes update progress | ProgressRepository called in completeSession |
| 7 | Outcomes update mistakes | MistakeRepository called with MistakeEvidence |
| 8 | Outcomes update vocabulary | VocabularyRepository called for vocab exercises |
| 9 | Outcomes published to AI Tutor Engine | `handleLearningEvent` called from completeSession |
| 10 | Roadmap tasks create time-appropriate sessions | plannedDurationMinutes respected |
| 11 | Roadmap completion is idempotent | Two calls produce same state |
| 12 | Web and extension use compatible contracts | Same port interfaces |
| 13 | Offline supports complete sessions | Deterministic grading works without AI |
| 14 | Existing user data remains readable | v9 migration preserves all old data |
| 15 | Type checking passes | `pnpm -r typecheck` = 0 errors |
| 16 | Linting passes | `pnpm -r lint` = 0 errors |
| 17 | Tests pass | `pnpm -r test` = 0 failures |
| 18 | Production web build passes | `pnpm build:web` succeeds |
| 19 | Production extension build passes | `pnpm build:extension` succeeds |
| 20 | No circular package dependencies | Dependency graph verified |
| 21 | Public APIs remain intentionally small | LE: 9 methods, AITutor: 8 methods, SPE: 7 methods |

---

*End of refactoring plan. Generated from source-code evidence across 100+ files in 8 packages and 2 applications.*
