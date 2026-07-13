# Learner Context

The Learner Context is the shared understanding of the learner across all three engines. It is defined in two locations:

- **`@ielts/shared`** (`packages/shared/src/learner-context.ts:3`) — canonical `LearnerContext` interface used by both engines
- **`@ielts/ai-tutor-engine`** (`packages/ai-tutor-engine/src/domain/entities/learner-context.ts:177`) — richer `LearnerStateSnapshot` with typed sub-contexts

## Context Sources

The AI Tutor Engine's `LearnerContextBuilder` (`learner-context-builder.ts:33`) collects data from 9 source functions, all fetched in parallel:

| Source | Data | Default When Missing |
|---|---|---|
| **Profile** | Overall bands, skill bands, exam type, timezone, language, study intensity, weak/strong skills | Null bands, `'english'` language, `'moderate'` intensity |
| **Exam** | Exam date, days until exam, urgency flags | Null date, not urgent |
| **Roadmap** | Active plan, current phase/week, today's tasks, next tasks, completed/missed counts, weekly targets | No active plan, empty tasks |
| **Progress** | Overall completion %, skill progress, weekly completion, streak, inactive days, consistency | Zero values |
| **Skill States** | Per-skill: current/target band, gap, performance, trend, confidence, priority, weaknesses, strengths | Unknown trend, default 0.5 confidence |
| **Mistakes** | Total count, unreviewed count, recent count, recurring patterns, by-skill breakdown | Zero counts, no patterns |
| **Vocabulary** | Total saved, due for review, mastered, by-topic breakdown | Zero counts |
| **Activity** | Last active timestamp, today's minutes, weekly minutes, tasks completed today | Null timestamp, zero minutes |
| **Preferences** | Tutor mode, language, explanation level, correction style, proactive settings, quiet hours, max messages, allowed categories | `general-teacher` mode, `'english'`, `'detailed'`, `'gentle'` |

## Scope Types

`TutorContextScope` (`learner-context.ts:4`):

```
chat | proactive | progress-review | roadmap | writing
speaking | reading | listening | vocabulary | saved-content | reminder
```

The `context-selector.ts` filters collected sources to only those relevant for a given scope. For example, a `vocabulary` scope would skip roadmap and progress data, while a `proactive` scope needs all sources.

## Freshness Evaluation

`evaluateFreshness` (`context-freshness-evaluator.ts:21`) per-source TTL thresholds:

| Source | Max Age |
|---|---|
| `user-profile` | 24h |
| `study-roadmap` | 5min |
| `progress` | 10min |
| `mistakes` | 5min |
| `vocabulary` | 10min |
| `saved-content` | 10min |
| `tutor-history` | 5min |
| `environment` | 1min |
| `extension-page` | 1min |

Sources older than their TTL are marked `stale`. The `CachedContextBuilder` (`cached-context-builder.ts:6`) wraps the builder with a 30-second TTL cache, using `AiGenerateResultCache` with minute-granularity cache keys.

## Quality Assessment

`evaluateContextQuality` (`learner-context-builder.ts:167`) compares available sources against scope requirements:

- `complete` — All required sources available, none stale
- `partial` — 1–2 sources missing
- `insufficient` — > 2 sources missing
- `stale` — Some sources exceed freshness TTL

Quality is reported in the `LearnerStateSnapshot.contextQuality` field with `missingSources`, `staleSources`, and `warnings` arrays.

## Snapshot Reuse

`LearnerStateSnapshot` (`learner-context.ts:177`) is the assembled output of the context builder. It includes all sub-contexts plus:

- `currentConstraints` — detected constraints (quiet hours, daily limit, offline, no-AI, cooldown)
- `contextQuality` — freshness/quality metadata

The snapshot is cached by `CachedContextBuilder` and reused within the same minute for the same scope. Cache is invalidated on explicit `invalidate(scope)` calls.

## Current Incomplete Wiring

### Engine Bootstrap (`engineBootstrap.ts`)

`initializeAITutorEngine` (`engineBootstrap.ts:221`) wires the `LearnerContextBuilder` with context sources reading from:

| Source | Implementation |
|---|---|
| `getProfile` | `localStorage.getItem('ielts-settings')` |
| `getExamContext` | Parses examDate from settings, computes days until |
| `getRoadmapContext` | `DatabaseService.getAll('tasks')` — basic, no phase/week info |
| `getProgress` | Aggregates `progressRecords` records |
| `getSkillStates` | From `progressRecords` — currentBand/targetBand always undefined |
| `getMistakes` | `DatabaseService.getAll('mistakes')` |
| `getVocabulary` | `DatabaseService.getAll('vocabulary')` |
| `getActivity` | `DatabaseService.getAll('tasks')` — todayStudyMinutes always 0 |
| `getPreferences` | From localStorage settings |

### `initializeLearningEngine` (`engineBootstrap.ts:434`)

The Learning Engine's `contextPort.buildLearningContext` returns a **hardcoded minimal context** (`engineBootstrap.ts:444-465`):

- Current skill bands: `{}` (empty)
- Progress: empty with `skillProgress: {}`, `recentAccuracy: {}`, `trendBySkill: {}`
- Weaknesses, strengths, mistakes: all empty
- Preferences: hardcoded defaults
- `contextQuality: { status: 'partial' }`

All context building uses hardcoded fallback values instead of reading from shared context sources.

### Missing Context Behavior

When sources are missing:

- The `LearnerContextBuilder` fills in safe defaults (null bands, zero counts, `'unknown'` trends)
- The `contextQuality` field reports the gap but the engine continues
- Features degrade gracefully — e.g., no skill data means default difficulty
- The `incomplete` quality status is currently informational only; no engine adjusts behavior based on it

## `@ielts/shared` Shared Context

The canonical `LearnerContext` interface (`packages/shared/src/learner-context.ts:3`) defines:

- Profile, exam, study plan, progress
- Skill states, weaknesses, strengths
- Mistake summary, vocabulary summary
- Activity summary, recent attempts, previous feedback
- Relevant content, preferences, constraints
- Context quality

A conversion function exists at `packages/learning-engine/src/infrastructure/adapters/to-shared-learner-context.ts` that maps the Learning Engine's internal `LearningContext` to the shared `LearnerContext`. The AI Tutor Engine has its own `context/to-shared-learner-context.ts` for the same purpose.

## Constraints

Determined in `LearnerContextBuilder.determineConstraints` (`learner-context-builder.ts:159`):

- `quiet-hours` — when current time falls within quiet hours (stored in preferences)
- `daily-limit-reached` — proactive messages sent today ≥ max allowed
- `offline` — browser is offline
- `no-ai` — AI API key not configured
- `cooldown` — proactive message cooldown active

Constraints affect functionality: `offline` disables AI calls, `quiet-hours` suppresses proactive messages, `daily-limit-reached` prevents new proactive messages.
