# Learning Lifecycle

## End-to-End Flow

```
Objective ──> Session ──> Activity ──> Exercise ──> Attempt ──> Evaluation
    │                                                              │
    │                                                              ▼
    │                                                     Outcome + Evidence
    │                                                         │
    │                                                         ├──> MistakeEvidence
    │                                                         ├──> SkillEvidence
    │                                                         ├──> ProgressEvidence
    │                                                         └──> VocabularyEvidence
    │                                                              │
    │                                                              ▼
    │                                                     Progress Update
    │                                                              │
    │                                                              ├──> Study Plan (task fulfilled)
    │                                                              └──> Tutor Engine (learning event)
    │                                                                    │
    │                                                                    ▼
    │                                                            Memory Update
    │                                                                    │
    │                                                                    ▼
    │                                                            Next Recommendation
    │                                                                    │
    └────────────────────────────────────────────────────────────────────┘
                                                                 (loop back)
```

## Session State Diagram

```
              createSession()
                    │
                    ▼
              ┌──────────┐
              │ PREPARED │
              └──────────┘
                    │
             generateActivity()
                    │
                    ▼
              ┌──────────┐
              │IN-PROGRESS│◄────────────────────┐
              └──────────┘                      │
                    │                           │
              submitAnswer()                    │
                    │                           │
                    ▼                           │
          ┌─────────────────┐                  │
          │ Attempt Created  │                  │
          └─────────────────┘                  │
                    │                           │
              (more exercises?)                 │
              ┌──────┴──────┐                   │
              │             │                   │
             YES            NO                  │
              │             │                   │
              └─────────────┘                   │
                            │                   │
                      completeSession()         │
                            │                   │
                      ┌───────────┐            │
                      │ COMPLETED │            │
                      └───────────┘            │
                            │                   │
                      (pause/resume)            │
                            │                   │
                      ┌────────┐    resumeSession()
                      │ PAUSED ├────────────────┘
                      └────────┘
                            │
                     (abandon/timeout)
                            │
                      ┌───────────┐
                      │ ABANDONED │
                      └───────────┘
                      ┌─────────┐
                      │ EXPIRED │
                      └─────────┘
```

## Attempt State Diagram

```
         submitAnswer()
               │
               ▼
         ┌──────────┐
         │ SUBMITTED│
         └──────────┘
               │
          (evaluate)
               │
               ▼
         ┌──────────┐
         │ EVALUATED│
         └──────────┘
               │
          (feedback)
               │
               ▼
         ┌──────────┐
         │ REVIEWED │
         └──────────┘
```

## Implementation Status

| Step | Status | Location | Notes |
|---|---|---|---|
| **1. Objective Definition** | ✅ Implemented | `domain/entities/learning-objective.ts` | LearningObjective with type, source, priority, criteria |
| **2. Session Creation** | ✅ Implemented | `application/sessions/create-learning-session.ts` | `createSession` in `engine-impl.ts:49` |
| **3. Activity Generation** | ✅ Implemented | `application/activities/generate-learning-activity.ts` | `generateActivity` in `engine-impl.ts:69` |
| **4. Exercise Selection** | ✅ Implemented | `domain/services/exercise-selector.ts` | Selects configs by skill + difficulty |
| **5. Attempt Start** | ✅ Implemented | `application/attempts/start-attempt.ts` | Creates LearningAttempt |
| **6. Answer Submission** | ✅ Implemented | `application/attempts/submit-answer.ts` | `submitAnswer` in `engine-impl.ts:92` |
| **7. Evaluation** | ⚠️ Partial | `domain/policies/evaluation-policy.ts` | Deterministic grader done; AI eval wired via `TutorIntelligencePort` but also duplicated in components |
| **8. Outcome Production** | ✅ Implemented | `application/sessions/complete-learning-session.ts` | Produces LearningOutcome in `engine-impl.ts:118` |
| **9. Mistake Evidence** | ✅ Implemented | `domain/services/mistake-evidence-builder.ts` | `buildMistakeEvidence` + `detectRecurrencePattern` |
| **10. Skill Evidence** | ✅ Implemented | `domain/services/skill-evidence-builder.ts` | `buildSkillEvidence` + `aggregateSkillEvidence` |
| **11. Progress Evidence** | ✅ Implemented | `domain/services/progress-evidence-builder.ts` | `buildProgressEvidence` |
| **12. Progress Update** | ⚠️ Partial | `ports/progress-repository.ts` | Interface defined, implementation in `engineBootstrap.ts:159` is a stub |
| **13. Study Plan Update** | ⚠️ Partial | `ports/study-plan-port.ts` | `markTaskFulfilled` wired in `engineBootstrap.ts:520` but `getCurrentTask` returns null |
| **14. Tutor Engine Event** | ⚠️ Partial | `ports/learning-event-publisher.ts` | Events published to IndexedDB; Tutor Engine's `handleLearningEvent` called in some flows |
| **15. Memory Update** | ✅ Implemented | `ai-tutor-engine/application/memory/update-tutor-memory.ts` | Full memory pipeline (dedup, compact, persist) |
| **16. Next Recommendation** | ✅ Implemented | `orchestration/engine-impl.ts:161` | `getRecommendedActivity` returns top recommendation |
| **17. Resume Session** | ✅ Implemented | `application/sessions/resume-learning-session.ts` | Returns session + current activity + saved answers |

## Data Flow Details

### Session Creation → Activity

```
CreateLearningSessionRequest
  ├── objective (LearningObjective)
  ├── skill (IELTSSection)
  ├── mode (learn | practice | review | assess | apply)
  ├── source (roadmap | tutor-recommendation | ...)
  ├── plannedDurationMinutes
  ├── difficulty (optional)
  └── contextScope (string)

  → CreateLearningSessionResult
       ├── session (LearningSession)
       └── warnings (string[])
```

Activity generation consumes the session's context:
```
GenerateLearningActivityRequest
  └── context (from session)

  → GenerateLearningActivityResult
       ├── activity (LearningActivity)
       ├── aiUsed (boolean)
       └── cacheHit (boolean)
```

### Attempt → Evaluation → Outcome

```
SubmitLearningAnswerRequest
  ├── sessionId
  ├── activityId
  └── answers (LearningAnswer[])

  → SubmitLearningAnswerResult
       └── evaluations (AnswerEvaluation[])

CompleteLearningSessionRequest
  ├── sessionId
  ├── actualDurationMinutes
  └── correlationId

  → CompleteLearningSessionResult
       ├── session (LearningSession)
       ├── outcomes (LearningOutcome[])
       └── recommendations (LearningRecommendation[])
```

Each `LearningOutcome` aggregates:
- Score + maximum score + accuracy
- MistakeEvidence[] — per-question mistakes
- SkillEvidence[] — demonstrated skills
- VocabularyEvidence — vocabulary used

### Evidence Pipeline

```
AnswerEvaluation[]
  │
  ├── MistakeEvidenceBuilder
  │     ├── buildMistakeEvidence(evaluations) → MistakeEvidence[]
  │     └── detectRecurrencePattern(mistakes) → pattern detection
  │
  ├── SkillEvidenceBuilder
  │     ├── buildSkillEvidence(evaluations) → SkillEvidence[]
  │     └── aggregateSkillEvidence(evidence) → aggregated
  │
  └── ProgressEvidenceBuilder
        └── buildProgressEvidence(outcomes) → ProgressEvidence
```

### Grading Methods

Evaluation method selection (`evaluation-policy.ts`):

| Question Type | Method | Deterministic |
|---|---|---|
| MultipleChoice | deterministic | ✅ |
| TrueFalseNotGiven | deterministic | ✅ |
| GapFill | deterministic (exact match) | ✅ |
| ShortAnswer | fuzzy string match | ⚠️ |
| Matching | deterministic | ✅ |
| ErrorCorrection | ai-assisted | ❌ |
| Essay | ai-only or hybrid | ❌ |
| SpeakingResponse | ai-only | ❌ |
