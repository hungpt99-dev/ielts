# AI-Driven Plan & Roadmap Generation — Architecture Design

> **Status:** Draft  
> **Scope:** Dynamic, personalized study plan and roadmap generation using AI, user profile data, and configuration.  
> **Design Principles:** Provider-agnostic AI, prompt-code separation, Zod validation, graceful fallback, no hardcoded content.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                           │
│                                                                   │
│  RoadmapPage.tsx                                                  │
│    └─ ensureRoadmap()                                             │
│         ├─ loadRoadmap()          [localStorage cache]            │
│         ├─ loadUserSettings()     [AppSettings from storage]      │
│         ├─ loadPersonalizationContext()  [aggregated user data]   │
│         └─ generateRoadmap()      [delegates to strategy]         │
│              └─ recalculateProgress()  [shared post-processing]   │
│                                                                   │
│  DailyPlanView (UI)                                               │
│    └─ DailyPlanService.generateDailyPlan()  [delegates to AI]     │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                    APPLICATION / SERVICE LAYER                     │
│                                                                   │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐  │
│  │ RoadmapOrchestrator     │  │ PlanOrchestrator              │  │
│  │  - routes to AI or      │  │  - routes to AI or            │  │
│  │    deterministic        │  │    deterministic              │  │
│  │  - manages fallback     │  │  - manages fallback           │  │
│  │  - parses AI response   │  │  - enriches with daily data   │  │
│  └───────────┬─────────────┘  └───────────┬────────────────────┘  │
│              │                             │                       │
│  ┌───────────▼─────────────────────────────▼────────────────────┐  │
│  │              AiPlanService (NEW — packages/ai/)               │  │
│  │  - buildRoadmapPrompt(userContext, config) → PromptMessage[] │  │
│  │  - buildDailyPlanPrompt(userContext, schedule) → PromptMsg[] │  │
│  │  - callAIAgent(messages, schema) → validated structured JSON │  │
│  │  - mapRoadmapResponse(raw) → RoadmapData                      │  │
│  │  - mapPlanResponse(raw) → DailyPlan                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           PersonalizationService (existing)                   │  │
│  │  buildPersonalizationContext() → PersonalizationContext       │  │
│  │    - profile (goals, settings, schedule)                      │  │
│  │    - progress (streak, study hours, tasks)                    │  │
│  │    - vocabulary (counts, due reviews, mastery)                │  │
│  │    - mistakes (counts, by skill, due for review)              │  │
│  │    - exam (countdown, urgency)                                │  │
│  │    - tasks (today's, pending, completed)                      │  │
│  │    - roadmap (current phase, focus)                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AI PACKAGE (packages/ai/)                      │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Client    │  │  Adapters    │  │  Schemas     │             │
│  │  (fetch)   │  │  (OpenAI,    │  │  (Zod)       │             │
│  │            │  │   Generic)   │  │              │             │
│  └────────────┘  └──────────────┘  └──────────────┘             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  NEW: prompts/plan.ts   — roadmap + daily plan prompt fns   │ │
│  │  NEW: schemas/plan.ts   — Zod schemas for structured output  │ │
│  │  NEW: services/plan.ts  — AiPlanService implementation       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐                    │
│  │  Cache     │  │  Errors  │  │  Utils   │                    │
│  │  (TTL)     │  │  (typed) │  │  (parse) │                    │
│  └────────────┘  └──────────┘  └──────────┘                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow

### 2.1 AI Roadmap Generation Flow

```
User navigates to RoadmapPage
        │
        ▼
ensureRoadmap()
        │
        ├── loadRoadmap()           ← check localStorage cache
        ├── loadUserSettings()      ← AppSettings
        ├── buildPersonalizationContext()
        │       └── aggregates: profile, progress, vocabulary,
        │                        mistakes, exam, tasks, roadmap
        │
        ├── shouldRegenerate?(ctx, cached) → boolean
        │     based on: cache age, profile changes, exam date shift
        │
        ├── if AI enabled → generateRoadmapWithAI(ctx, settings)
        │     │
        │     ├── buildRoadmapPrompt(ctx)
        │     │     Constructs: system prompt + user context payload
        │     │     Output: typed messages for the AI adapter
        │     │
        │     ├── AiPlanService.generateRoadmap(prompt)
        │     │     ├── Adapter.generateCompletion(messages)
        │     │     ├── Parse JSON from response
        │     │     ├── Validate with RoadmapResponseSchema (Zod)
        │     │     └── Return structured RoadmapData
        │     │
        │     ├── Fallback: if AI fails → generateRoadmap(ctx)
        │     │     (existing deterministic logic)
        │     │
        │     └── store AI metadata on roadmap
        │           { generatedBy: 'ai-v1', model, promptTokens, timing }
        │
        └── saveRoadmap(roadmap)
        └── return roadmap
```

### 2.2 AI Daily Plan Generation Flow

```
DailyPlanService.generateDailyPlan(...)
        │
        ├── computeFullState()   ← LearningEngine
        │     Provides: weakSkills, dueReviews, skillProgress,
        │                studyConsistency, nextBestActions
        │
        ├── buildPersonalizationContext()
        │
        ├── if AI enabled → generateDailyPlanWithAI(ctx, settings, schedule)
        │     │
        │     ├── buildDailyPlanPrompt(ctx, schedule)
        │     │     - Includes today's available minutes
        │     │     - Includes weak skills with severity
        │     │     - Includes due reviews count
        │     │     - Includes preferred topics
        │     │     - Includes study streak / momentum
        │     │
        │     ├── AiPlanService.generateDailyPlan(prompt)
        │     │     ├── Adapter.generateCompletion(...)
        │     │     ├── Validate with DailyPlanResponseSchema
        │     │     └── Return structured DailyPlan
        │     │
        │     └── Fallback: if AI fails → buildPlanItems(...)
        │           (existing deterministic logic)
        │
        └── Return DailyPlan
```

---

## 3. Module Responsibilities

### 3.1 `RoadmapOrchestrator` (NEW — `apps/web/src/features/roadmap/roadmapOrchestrator.ts`)

| Responsibility | Detail |
|---|---|
| Strategy selection | Decide AI vs deterministic based on `settings.aiEnabled` + AI availability |
| Context aggregation | Gather `PersonalizationContext` + `AppSettings` + `LearningEngineState` |
| Cache invalidation | Detect when user data changed enough to warrant re-generation |
| AI response mapping | Convert structured AI output → `RoadmapData` (calling existing mapping fn) |
| Fallback management | Catch AI errors and fall back to deterministic generation |
| Metadata attachment | Stamp `generatedBy`, `model`, `generationTiming` on roadmap |

### 3.2 `PlanOrchestrator` (NEW — `packages/learning-engine/src/plan/PlanOrchestrator.ts`)

| Responsibility | Detail |
|---|---|
| Context preparation | Gather `LearningEngineState` + `PersonalizationContext` for daily plan |
| AI routing | Send to AI when enabled + available, else use deterministic |
| Schedule awareness | Incorporate preferred schedule days, today's date, available minutes |
| Plan enrichment | Merge AI-generated items with reviews, mistakes, deadlines |
| Output validation | Ensure plan fits within time budget, covers all due items |

### 3.3 `AiPlanService` (NEW — `packages/ai/src/services/plan.ts`)

| Responsibility | Detail |
|---|---|
| Prompt building | Construct domain-specific prompts from user context |
| AI invocation | Call the adapter layer with constructed messages |
| Response parsing | Extract structured JSON from LLM response |
| Schema validation | Validate against Zod schemas before returning |
| Error handling | Wrap errors with typed `AIError` codes for upstream handling |
| Caching | Cache identical prompt → response pairs with TTL |

### 3.4 `PersonalizationService` (existing — enhancement)

| Responsibility | Detail |
|---|---|
| Data aggregation | Pull from ProfileService, ProgressService, WeaknessDetection, etc. |
| Context shaping | Already provides all fields needed for AI prompt context |
| Enhancement needed | Add `aiContextVersion` field for prompt version tracking |

---

## 4. Interface Definitions

### 4.1 AI Input — Prompt Context

```typescript
// packages/ai/src/services/plan.ts

interface PlanGenerationInput {
  /* --- User Profile --- */
  targetBand: number
  currentBand: number
  bandGap: number                      // targetBand - currentBand
  examDate: string | null              // ISO date
  examCountdownDays: number | null
  dailyStudyMinutes: number
  studyGoal: 'academic' | 'general'
  preferredTopics: string[]
  preferredSchedule: string[]          // e.g. ['mon','wed','fri']

  /* --- Skill Data --- */
  weakSkills: Array<{
    skill: string
    accuracy: number
    severity: 'high' | 'medium' | 'low'
    trend: 'improving' | 'declining' | 'stable'
    sessionCount: number
  }>
  skillProgress: Array<{
    skill: string
    accuracy: number
    minutesStudied: number
    trend: string
  }>

  /* --- Review Load --- */
  dueReviews: {
    totalDue: number
    vocabularyDue: number
    mistakesDue: number
  }
  repeatedMistakes: Array<{
    category: string
    count: number
    example: string
  }>

  /* --- Study Context --- */
  studyStreak: number
  studyConsistency: number             // percentage
  weeklyStudyHours: number
  skillTimeBalance: Array<{
    skill: string
    percentage: number
  }>
  bandProgressHistory: Array<{
    date: string
    estimatedBand: number
  }>

  /* --- Content Preferences --- */
  preferredContentTypes: string[]      // reading-passage, writing-prompt, etc.
  userContentTopics: string[]          // topics from user content edits

  /* --- Current State --- */
  currentPhaseIndex?: number           // null if starting fresh
  currentWeekIndex?: number
  existingTaskCount: number
  completedTaskCount: number
  overallProgress: number             // percentage
}
```

### 4.2 AI Output — Roadmap Response

```typescript
// packages/ai/src/schemas/plan.ts

const PhaseSchema = z.object({
  name: z.string(),                     // e.g. "Foundation Building"
  description: z.string(),              // AI-generated description
  targetRange: z.string(),             // e.g. "4.0–5.5"
  order: z.number().min(0).max(10),
  weeks: z.array(z.object({
    weekNumber: z.number(),
    label: z.string(),                  // e.g. "Week 1"
    focus: z.string(),                  // e.g. "Vocabulary & Reading"
    goal: z.string(),                   // AI-generated weekly goal
    days: z.array(z.object({
      dayNumber: z.number().min(1).max(7),
      skillFocus: z.string(),
      objective: z.string(),            // AI-generated daily objective
      taskTitle: z.string(),            // AI-generated task title
      taskDescription: z.string(),      // AI-generated description
      estimatedMinutes: z.number().min(5).max(120),
    })).length(7),
  })).min(1).max(16),
})

const RoadmapResponseSchema = z.object({
  phases: z.array(PhaseSchema).min(1).max(6),
  metadata: z.object({
    generatedBy: z.string(),            // e.g. "ai-plan-v1"
    model: z.string(),
    totalDurationWeeks: z.number(),
    totalTasks: z.number(),
    reasoningSummary: z.string(),       // AI explains plan rationale
  }),
})
```

### 4.3 AI Output — Daily Plan Response

```typescript
const DailyPlanItemSchema = z.object({
  skill: z.string(),
  activity: z.string(),
  description: z.string().optional(),
  minutes: z.number().min(5).max(120),
  reason: z.string(),                  // AI explains why this item
  priority: z.number().min(1).max(5),  // 1 = highest
  contentType: z.string().optional(),  // e.g. "reading-passage", "vocabulary-practice"
  topicSuggestion: z.string().optional(),
})

const DailyPlanResponseSchema = z.object({
  items: z.array(DailyPlanItemSchema).min(1).max(8),
  totalMinutes: z.number(),
  focusSkills: z.array(z.string()),
  studyPriority: z.number().min(1).max(10),
  reasoningSummary: z.string(),
})
```

### 4.4 Orchestrator Strategy Pattern

```typescript
// packages/ai/src/strategies/planGenerationStrategy.ts

interface PlanGenerationStrategy {
  readonly type: 'ai' | 'deterministic'
  canGenerate(context: PlanGenerationInput): boolean
  generate(context: PlanGenerationInput, existingTasks?: TaskEntry[]): Promise<RoadmapData | DailyPlan>
}

class AiRoadmapStrategy implements PlanGenerationStrategy {
  readonly type = 'ai' as const
  canGenerate(context: PlanGenerationInput): boolean {
    return context.aiEnabled && !!context.aiApiKey
  }
  async generate(context: PlanGenerationInput): Promise<RoadmapData> {
    // 1. Build prompt
    // 2. Call AI adapter
    // 3. Validate with Zod schema
    // 4. Map to RoadmapData
    // 5. Fall back on error
  }
}

class DeterministicRoadmapStrategy implements PlanGenerationStrategy {
  readonly type = 'deterministic' as const
  canGenerate(): boolean {
    return true  // always available as fallback
  }
  async generate(context: PlanGenerationInput, existingTasks: TaskEntry[]): Promise<RoadmapData> {
    return generateRoadmap(context, existingTasks)  // existing logic
  }
}
```

---

## 5. Prompt Design

### 5.1 Roadmap Generation Prompt (System)

```
You are an expert IELTS study plan generator. Your task is to create a personalized,
structured study roadmap based on the user's profile, skill data, and preferences.

=== RULES ===
1. Generate a phased roadmap from now until the exam date.
2. Each phase must progress in difficulty. Adapt phase count to time horizon.
3. Distribute time across skills proportionally to weakness severity.
4. Incorporate the user's preferred topics into task titles and objectives.
5. Respect the user's preferred study schedule (days of week).
6. Phase descriptions must reference the user's target band range.
7. Weekly goals must be specific, measurable, and skill-targeted.
8. Daily objectives must be concrete actions (not vague).
9. Estimated minutes per task must fit dailyStudyMinutes / tasksPerDay.
10. If examCountdownDays < 30, increase intensity and focus on mock tests.

=== RESPONSE FORMAT ===
Return valid JSON conforming to:
{
  "phases": [
    {
      "name": "string",
      "description": "string",
      "targetRange": "string",
      "order": number,
      "weeks": [
        {
          "weekNumber": number,
          "label": "string",
          "focus": "string",
          "goal": "string",
          "days": [
            {
              "dayNumber": number,
              "skillFocus": "string",
              "objective": "string",
              "taskTitle": "string",
              "taskDescription": "string",
              "estimatedMinutes": number
            }
          ]
        }
      ]
    }
  ],
  "metadata": {
    "generatedBy": "ai-roadmap-v1",
    "model": "string",
    "totalDurationWeeks": number,
    "totalTasks": number,
    "reasoningSummary": "string"
  }
}
```

### 5.2 Daily Plan Generation Prompt (System)

```
You are an expert daily study scheduler for IELTS preparation. Given the user's
profile, weak areas, upcoming exam, and today's study budget, create the optimal
daily study plan.

=== RULES ===
1. Priority order: mistake review > vocabulary review > weak skill practice > task completion
2. Total minutes must not exceed the user's dailyStudyMinutes.
3. Mix skills to prevent fatigue — no more than 2 consecutive items on same skill.
4. Include at least one item from the user's preferred topics if possible.
5. If user has a streak > 7 days, add a review consolidation item.
6. If exam is within 30 days, prioritize mock-test-style practice.

=== RESPONSE FORMAT ===
{
  "items": [
    {
      "skill": "string",
      "activity": "string",
      "minutes": number,
      "reason": "string",
      "priority": number
    }
  ],
  "totalMinutes": number,
  "focusSkills": ["string"],
  "studyPriority": number,
  "reasoningSummary": "string"
}
```

---

## 6. Data Enrichment Pipeline

```
Raw User Data                    Aggregated Context                AI Prompt
─────────────────               ─────────────────                ──────────
AppSettings                      PersonalizationContext            System prompt
  └ targetBand                   └ profile                         └ rules + format
  └ currentBand                  └ progress
  └ examDate                     └ vocabulary                    User context block
  └ dailyStudyMinutes             └ mistakes                       └ JSON-serialized
  └ weakSkills                   └ exam                            └ PlanGenerationInput
  └ preferredTopics              └ tasks
  └ studyGoal                    └ roadmap                      Schema instruction
  └ preferredSchedule                                                └ Zod-derived
                                                                      JSON schema desc
SkillProgress[]
  └ accuracy                     LearningEngineState (optional)
  └ trend                        └ profile                    ====================
  └ sessionCount                 └ progress.skills
                                 └ weaknessReport                    AI Adapter
WeaknessReport                    └ dueReviews
  └ weakSkills[]                  └ dailyPlan                        └ OpenAI / custom
  └ repeatedMistakes              └ studyConsistency
  └ frequentMistakeCategories     └ skillBalance                     └ structured JSON
                                 └ bandProgressHistory
ReviewScheduler                                                    Zod Validation
  └ dueReviews                                                      └ safeParse
  └ vocabularyDue                                                    └ error handling
  └ mistakesDue
                                                                 Map to Domain Model
UserContentService
  └ getEffectiveItems()           Content filter                    └ RoadmapData
  └ topics, tags, difficulty      └ user's preferred content        └ DailyPlan
```

---

## 7. Error Handling & Fallback Strategy

```typescript
enum PlanGenerationErrorCode {
  AI_UNAVAILABLE = 'AI_UNAVAILABLE',       // No adapter configured
  PROVIDER_ERROR = 'PROVIDER_ERROR',       // API returned error
  INVALID_RESPONSE = 'INVALID_RESPONSE',   // Zod validation failed
  TIMEOUT = 'TIMEOUT',                     // Request timed out
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

class PlanGenerationError extends Error {
  constructor(
    message: string,
    public code: PlanGenerationErrorCode,
    public fallbackUsed: boolean,       // true if deterministic fallback was triggered
    public aiTimingMs?: number,
  ) {
    super(message)
    this.name = 'PlanGenerationError'
  }
}
```

### Fallback Chain

```
generateRoadmap()
  │
  ├── AI enabled + available?
  │   ├── YES → call AI adapter
  │   │         ├── success → parse, validate → return RoadmapData
  │   │         └── failure →
  │   │               ├── log error (code, timing, response snippet)
  │   │               ├── track in metrics
  │   │               └── FALLBACK → deterministic generateRoadmap()
  │   │
  │   └── NO → deterministic generateRoadmap()
  │
  └── return result (with metadata about which strategy was used)
```

---

## 8. Caching Strategy

| Cache Scope | Key | TTL | Invalidation |
|---|---|---|---|
| AI roadmap response | `roadmap:${userId}:${profileHash}` | 24h | Profile change, exam date change, manual refresh |
| AI daily plan response | `plan:${userId}:${todayDate}` | Until next day | Manual refresh |
| Deterministic roadmap | (existing localStorage key) | 24h | (existing logic) |
| PersonalizationContext | (in-memory memoization) | Per request | N/A |

### Profile Hash

```typescript
function computeProfileHash(context: PlanGenerationInput): string {
  const relevantFields = {
    targetBand: context.targetBand,
    currentBand: context.currentBand,
    examCountdownDays: context.examCountdownDays,
    dailyStudyMinutes: context.dailyStudyMinutes,
    weakSkills: context.weakSkills.map(w => `${w.skill}:${w.severity}`).sort(),
    preferences: context.preferredTopics.sort().join(','),
    studyGoal: context.studyGoal,
    progress: context.overallProgress,
  }
  return createHash('sha256', JSON.stringify(relevantFields)).slice(0, 16)
}
```

---

## 9. Implementation Plan

### Phase 1 — Foundation (packages/ai/)

| Task | File | Detail |
|---|---|---|
| 1. Zod schemas | `packages/ai/src/schemas/plan.ts` | `RoadmapResponseSchema`, `DailyPlanResponseSchema`, validation helpers |
| 2. Prompt templates | `packages/ai/src/prompts/plan.ts` | `buildRoadmapPrompt()`, `buildDailyPlanPrompt()` with versioning |
| 3. AiPlanService | `packages/ai/src/services/plan.ts` | Core service with context→prompt→AI→validate→map pipeline |
| 4. Strategy interfaces | `packages/ai/src/strategies/planGenerationStrategy.ts` | AiRoadmapStrategy, DeterministicRoadmapStrategy |
| 5. Export from barrel | `packages/ai/src/index.ts` | Re-export all new symbols |

### Phase 2 — Integration (apps/web + packages/learning-engine)

| Task | File | Detail |
|---|---|---|
| 6. RoadmapOrchestrator | `apps/web/src/features/roadmap/roadmapOrchestrator.ts` | Strategy selection, context gathering, fallback |
| 7. Enhance ensureRoadmap | `apps/web/src/features/roadmap/roadmapService.ts` | Route to orchestrator, keep deterministic as fallback |
| 8. PlanOrchestrator | `packages/learning-engine/src/plan/PlanOrchestrator.ts` | Surround DailyPlanService with AI routing |
| 9. Extend PersonalizationContext | `apps/web/src/features/personalization/personalizationService.ts` | Add fields needed for AI prompt (trend, content topics) |

### Phase 3 — Polish

| Task | Detail |
|---|---|
| 10. Metrics & observability | Track AI vs deterministic usage, latency, fallback rate |
| 11. Prompt versioning | Version-aware prompt templates, migrate when schemas change |
| 12. User-facing indicators | Show "AI-generated" badge on roadmap, allow manual re-generate |

---

## 10. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Strategy pattern** for generation | Clean separation of AI and deterministic paths; easy to test, extend, or replace |
| **Prompt as data, not code** | Versioned templates stored in `prompts/` — no string interpolation in service logic |
| **Zod schemas shared with UI** | Same schema validates AI output and typed responses for the frontend |
| **Profile hash for cache** | Avoid re-generating when nothing relevant changed; invalidate on meaningful data shifts |
| **AI metadata on roadmap** | Transparency: user can see how the plan was generated; enables A/B comparison |
| **Fallback is silent** | User never sees an error — if AI fails, they get the deterministic plan without interruption |
| **Separate orchestrator from service** | Orchestrator handles decisions (AI vs deterministic), service handles AI communication |
| **Context always aggregated by existing service** | `PersonalizationService` and `LearningEngine` already own this — don't duplicate |

---

## 11. Testing Strategy

| Layer | Test Type | What to Test |
|---|---|---|
| Zod schemas | Unit | Valid JSON passes, malformed JSON fails, all fields required |
| Prompt builders | Unit | Output contains all required sections, no template injection |
| AiPlanService | Integration (with mock adapter) | Correct messages sent, output mapped correctly, errors handled |
| RoadmapOrchestrator | Integration | AI enabled → uses AI strategy; AI fails → falls back; disabled → deterministic |
| Fallback behavior | Unit | AI error codes trigger correct fallback path |
| Profile hash | Unit | Same input → same hash; different input → different hash |
| End-to-end | Playwright | Roadmap page loads with AI-generated or deterministic plan |

---

## 12. Files to Create / Modify

### New Files

| File | Purpose |
|---|---|
| `packages/ai/src/schemas/plan.ts` | Roadmap + DailyPlan Zod response schemas |
| `packages/ai/src/prompts/plan.ts` | Prompt template builders for roadmap and daily plan |
| `packages/ai/src/services/plan.ts` | AiPlanService — orchestrates prompt → AI → validate → map |
| `packages/ai/src/strategies/planGenerationStrategy.ts` | Strategy pattern interface + implementations |
| `apps/web/src/features/roadmap/roadmapOrchestrator.ts` | Roadmap generation orchestrator with fallback |

### Files to Modify

| File | Change |
|---|---|
| `packages/ai/src/index.ts` | Export new modules |
| `apps/web/src/features/roadmap/roadmapService.ts` | Enhance `ensureRoadmap()` to use orchestrator |
| `packages/learning-engine/src/daily-plan/DailyPlanService.ts` | Optional AI routing in `generateDailyPlan()` |
| `apps/web/src/features/personalization/personalizationService.ts` | Extend context with trend, content topics |

---

*End of design document.*
