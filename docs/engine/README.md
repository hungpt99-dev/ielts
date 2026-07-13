# Engine Architecture

The IELTS Journey monorepo contains three engines that form the backbone of the learning platform. Each follows hexagonal (ports-and-adapters) architecture.

## Responsibility Matrix

| Engine | Package | Primary Responsibility | Architecture | AI Dependency |
|---|---|---|---|---|
| **Study Plan Engine** | `@ielts/learning-engine` (daily-plan/) | Generate, validate, and adapt study roadmaps | Deterministic + optional AI enrichment | Optional (AiPlanOrchestrator) |
| **Learning Engine** | `@ielts/learning-engine` (orchestration/) | Create sessions, generate exercises, evaluate answers, produce outcomes | Hexagonal + tactical DDD | Optional (TutorIntelligencePort) |
| **AI Tutor Engine** | `@ielts/ai-tutor-engine` | Chat, proactive messages, context/memory management, progress reviews | Hexagonal + tactical DDD | Required for full functionality |
| **AI Orchestration** | `@ielts/ai` | OpenAI adapter, prompt builders, caching, Zod validation | Service layer | Always (OpenAI) |

## Package Dependency Graph

```
@ielts/ai  ────>  OpenAI API
    ^
    |
@ielts/ai-tutor-engine  ────>  @ielts/ai
    ^
    |
@ielts/learning-engine  ────>  @ielts/ai (via TutorIntelligencePort)
    ^
    |
apps/web  ────>  @ielts/learning-engine, @ielts/ai-tutor-engine, @ielts/ai
```

## Engine Wiring

Both engines are initialized in `apps/web/src/services/engineBootstrap.ts`. Singletons are exposed via `getAITutorEngine()` and `getLearningEngine()`. Both can be `null` when no AI API key is configured.

- `initializeAITutorEngine` — creates `TutorAIClient` wrapping `@ielts/ai`'s `callAI`, builds `LearnerContextBuilder` with context sources reading from localStorage and IndexedDB, wires repositories, creates engine
- `initializeLearningEngine` — creates `LearningEngine` with empty `progressRepository`, `studyPlanPort`, all session/attempt/outcome/exercise repositories backed by `DatabaseService`, `TutorIntelligencePort` wrapping `callAI`, `contextPort` returning minimal context, skill registry with all 6 default skill modules

The browser extension (`packages/extension/`) has its own engine adapters in `packages/extension/src/storage/engine-adapters/` for offline/limited mode.

## Integration Summary

```
StudyPlanEngine  ──schedules──>  LearningEngine  ──outcomes──>  TutorEngine
                                    ^                              |
                                    |                              |
                                    └──── context ────────────────┘
```

- Study Plan Engine generates tasks → Learning Engine creates sessions from tasks
- Learning Engine produces outcomes → outcomes flow to Tutor Engine as learning events
- Tutor Engine maintains learner context → Learning Engine reads context for personalization
- (Target) Full bidirectional data flow with Study Plan progress updates
