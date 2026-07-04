# AI-Driven Plan & Roadmap Generation

> **Status:** Implemented  
> **Last updated:** 2026-07-04  
> **Related docs:** [Architecture Design](./ai-plan-roadmap-integration-design.md), [AI Architecture](./ai-architecture.md)

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Key Components](#key-components)
- [Data Flow](#data-flow)
- [Configuration Options](#configuration-options)
- [User Profile Data Integration](#user-profile-data-integration)
- [Prompt System](#prompt-system)
- [Fallback Mechanism](#fallback-mechanism)
- [Usage Instructions](#usage-instructions)
- [Testing](#testing)
- [Best Practices for Maintenance & Extension](#best-practices-for-maintenance--extension)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                   ensureRoadmap()                             │
│  (apps/web/src/features/roadmap/roadmapService.ts)            │
│                                                               │
│  1. Load cached roadmap from localStorage                     │
│  2. If recent (< 24h) → recalculate & return                  │
│  3. Try AI generation via generatePlanWithAI()                │
│  4. Fall back to deterministic generateRoadmap()              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│               generatePlanWithAI()                             │
│  (apps/web/src/features/roadmap/aiRoadmapGenerator.ts)         │
│                                                               │
│  ┌─────────────────┐    ┌──────────────────────────┐          │
│  │ Input Extraction │───▶│  Prompt Construction     │          │
│  │ (extractAiPlan   │    │  (buildPlanSystemPrompt  │          │
│  │  Input + enrich  │    │   + buildPlanUserPrompt) │          │
│  │  WithLearning    │    └───────────┬──────────────┘          │
│  │  Data)           │                │                         │
│  └─────────────────┘                ▼                         │
│                     ┌──────────────────────────┐               │
│                     │   AI Adapter (callAI)     │               │
│                     │   (packages/ai/src/       │               │
│                     │    client/)               │               │
│                     └───────────┬──────────────┘               │
│                                 ▼                             │
│                     ┌──────────────────────────┐               │
│                     │  Parse + Validate JSON   │               │
│                     │  (tryParseAiResponse)     │               │
│                     └───────────┬──────────────┘               │
│                                 ▼                             │
│                     ┌──────────────────────────┐               │
│                     │  Map → RoadmapData       │               │
│                     │  (aiRoadmapResultTo       │               │
│                     │   RoadmapData)           │               │
│                     └──────────────────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

**Design principles:**

- **No hardcoded content** — All roadmap content is either AI-generated (dynamic) or computed deterministically from user settings
- **Provider-agnostic** — Uses the existing `@ielts/ai` adapter layer (OpenAI-compatible API)
- **Prompt-code separation** — Prompts live in `aiPlanPrompts.ts`, isolated from generation logic
- **Graceful degradation** — Every failure path falls back to deterministic `generateRoadmap()`
- **Privacy-safe** — AI is opt-in; users must configure an API key in settings; no data sent without action

---

## Key Components

### 1. `aiPlanPrompts.ts` (`apps/web/src/features/roadmap/aiPlanPrompts.ts`)

Responsible for extracting user profile data and building AI prompts.

| Function | Role |
|---|---|
| `extractAiPlanInput(settings)` | Transforms `AppSettings` into `AiPlanInput` (the structured context sent to AI) |
| `enrichWithLearningData(input, extras)` | Adds real study behavior data (streak, last study date, mock bands, accuracy) |
| `buildPlanSystemPrompt()` | Returns the system prompt defining AI role, rules, and JSON format |
| `buildPlanUserPrompt(input)` | Builds the user prompt from `AiPlanInput` with structured learner profile |

**Key interfaces:**

```typescript
interface AiPlanInput {
  targetBand: number          // e.g. 7.0
  currentBand: number         // e.g. 5.5
  bandGap: number             // target - current (computed, not hardcoded)
  examDate: string | null     // null if not set
  examCountdownDays: number | null
  dailyStudyMinutes: number
  weakSkills: string[]         // from user settings, falls back to all skills
  preferredTopics: string[]
  studyGoal: StudyGoal         // 'academic' | 'general'
  preferredSchedule: string[]  // ['mon','wed','fri',...]
  studyStreak: number          // enriched from learning data
  lastStudyDate: string | null
}
```

### 2. `aiRoadmapGenerator.ts` (`apps/web/src/features/roadmap/aiRoadmapGenerator.ts`)

The core orchestration module that ties everything together.

| Function | Role |
|---|---|
| `generatePlanWithAI(settings, extras?)` | Main entry — checks AI config, builds prompts, calls AI, parses response, converts to `RoadmapData`, falls back on failure |
| `getAiConfig(settings)` | Extracts `ProviderConfig` from `AppSettings`; returns `null` if AI disabled |
| `tryParseAiResponse(content)` | Extracts JSON from AI response (handles markdown code fences) and validates structure |
| `aiRoadmapResultToRoadmapData(result)` | Converts `AiRoadmapResult` → `RoadmapData` with proper IDs, dates, progress tracking |
| `generateFallbackRoadmap(settings)` | Delegates to deterministic `generateRoadmap()` |

### 3. `roadmapService.ts` (modified — `apps/web/src/features/roadmap/roadmapService.ts`)

The entry point `ensureRoadmap()` now triages:

```
ensureRoadmap()
  ├── Load cached roadmap from localStorage
  ├── If cached < 24h old → recalculateProgress() → return
  ├── Try AI: import('./aiRoadmapGenerator').generatePlanWithAI()
  │     ├── Success → saveRoadmap() → return
  │     └── Failure → fall through
  └── Deterministic: generateRoadmap(settings, tasks) → saveRoadmap() → return
```

### 4. `callAI` (`packages/ai/src/client/`)

The existing AI client adapter. Called with system prompt, user prompt, a config provider function, and options `{ temperature: 0.7, maxTokens: 4096 }`.

---

## Data Flow

### AI Roadmap Generation

```
User Settings (AppSettings)
  ├── targetBand, currentBand, examDate, dailyStudyMinutes
  ├── weakSkills, preferredTopics, studyGoal, preferredSchedule
  ├── aiApiKey, aiEndpoint, aiModel, aiEnabled
  │
  ▼
extractAiPlanInput(settings)
  ├── Computes bandGap, examCountdownDays
  ├── Defaults weakSkills if empty → ['reading','listening','writing',...]
  │
  ▼ (optional)
enrichWithLearningData(input, extras)
  ├── Adds studyStreak, lastStudyDate
  ├── Can add completedTaskCount, recentMockBands, weakSkillAccuracy
  │
  ▼
buildPlanSystemPrompt() + buildPlanUserPrompt(input)
  │
  ▼
callAI(systemPrompt, userPrompt, getConfig, { temperature: 0.7, maxTokens: 4096 })
  │
  ▼
tryParseAiResponse(content)
  ├── Extracts JSON from response (handles ```json fences)
  ├── Validates structure: must have phases array
  │
  ▼
aiRoadmapResultToRoadmapData(result)
  ├── Assigns generated IDs, dates starting from today
  ├── Computes progress, currentPhaseIndex, currentWeekIndex
  │
  ▼
saveRoadmap(roadmap) → localStorage
```

### Deterministic Fallback

When AI is disabled, not configured, or fails:

```
User Settings (AppSettings)
  │
  ▼
generateRoadmap(settings, existingTasks)
  ├── 4 phases × 4 weeks × 7 days = 112 days
  ├── Phase structure: Foundation → Skill Development → Advanced → Test Readiness
  ├── Week focus cycles through weak skills
  ├── Day objectives from predefined templates (getDayObjective, getTaskTitle)
  ├── Existing task completion status from database
  │
  ▼
saveRoadmap(roadmap) → localStorage
```

---

## Configuration Options

AI behavior is controlled entirely through `AppSettings` (user-editable in settings UI):

### AI Provider Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `aiEnabled` | `boolean` | `false` | Master toggle for AI features |
| `aiApiKey` | `string` | `''` | API key for the AI provider |
| `aiProvider` | `'openai' \| 'custom'` | `'openai'` | Provider selection |
| `aiEndpoint` | `string` | `''` (→ `https://api.openai.com/v1`) | Custom base URL for OpenAI-compatible API |
| `aiModel` | `string` | `'gpt-4o-mini'` | Model identifier |

### Generation Options (hardcoded in code)

| Option | Value | Description |
|---|---|---|
| `temperature` | `0.7` | Controls AI response randomness |
| `maxTokens` | `4096` | Maximum response length |

### User Profile Settings (affect prompt content)

| Setting | Type | Impact |
|---|---|---|
| `targetBand` | `number` | Goal band, determines plan ambition |
| `currentBand` | `number` | Starting level, determines bandGap |
| `examDate` | `string` | Generates countdown, adjusts intensity near exam |
| `dailyStudyMinutes` | `number` | Constraints daily task time budget |
| `weakSkills` | `string[]` | Prioritized in skill distribution |
| `preferredTopics` | `string[]` | Injected into task descriptions |
| `studyGoal` | `'academic' \| 'general'` | Determines task type relevance |
| `preferredSchedule` | `string[]` | Available study days (affects plan density) |

---

## User Profile Data Integration

### Data Sources

| Data | Source | How It's Used |
|---|---|---|
| Band targets | `AppSettings` | Band gap calculation, phase target ranges |
| Exam date | `AppSettings` | Countdown, urgency detection |
| Study time | `AppSettings` | Daily task budget constraint |
| Weak skills | `AppSettings` | Prioritized skill distribution in plan |
| Preferred topics | `AppSettings` | Topic-aware task generation |
| Schedule | `AppSettings` | Available day detection |
| Study streak | `LearningExtras` (enriched) | Momentum indicator for AI |
| Last study date | `LearningExtras` (enriched) | Recency detection |
| Mock bands | `LearningExtras` (enriched) | Progress trend for AI |
| Weak skill accuracy | `LearningExtras` (enriched) | Fine-grained weakness data |

### Data Flow

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ AppSettings  │───▶│ extractAiPlan   │───▶│ AiPlanInput      │
│ (persistent  │    │ Input()         │    │ (structured      │
│  storage)    │    │                 │    │  context for AI) │
└──────────────┘    └─────────────────┘    └────────┬─────────┘
                                                    │
┌──────────────┐    ┌─────────────────┐             │
│ Learning     │───▶│ enrichWith      │────────────▶│
│ Extras       │    │ LearningData()  │             │
│ (computed)   │    │                 │             │
└──────────────┘    └─────────────────┘             │
                                                    ▼
                                           ┌──────────────────┐
                                           │ buildPlanUser    │
                                           │ Prompt(input)   │
                                           │ → string         │
                                           └──────────────────┘
```

---

## Prompt System

### System Prompt

Defines the AI's role and behavior rules:

> "You are an expert IELTS study plan advisor..."
>
> Rules:
> 1. Match the learner's level, target, and available time
> 2. Prioritize weak skill areas
> 3. Adapt duration based on exam proximity
> 4. Suggest realistic, actionable daily tasks within study budget
> 5. Align with study goal (academic / general training)
> 6. Output must be valid JSON

### User Prompt

Constructed dynamically from `AiPlanInput`:

```
## Learner Profile
- Target Band: 7.0
- Current Band: 5.5
- Band Gap: 1.5 bands
- Study Goal: Academic
- Daily Study Time: 60 minutes
- Exam Date: 2026-09-15
- Days Until Exam: 73
- Weak Areas (prioritize these):
    - Writing
    - Speaking
- Preferred Topics: Environment, Education
- Available Study Days: mon, wed, fri (3 of 7 days)
- Current Study Streak: 10 days
- Last Study Date: 2026-07-01

## Requirements
[Detailed structuring rules and JSON format specification]
```

### Response Format (validated by code, not Zod in this version)

```json
{
  "phases": [
    {
      "name": "Phase name",
      "description": "Phase description",
      "order": 0,
      "targetRange": "Band X-Y",
      "weeks": [
        {
          "weekNumber": 1,
          "label": "Week 1",
          "focus": "Weekly focus area",
          "goal": "Weekly goal statement",
          "days": [
            {
              "dayNumber": 1,
              "skillFocus": "skill-name",
              "objective": "Specific objective for this day",
              "task": {
                "title": "Task title",
                "description": "Task description with details",
                "estimatedMinutes": 30
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Fallback Mechanism

### Fallback Chain

```
generatePlanWithAI(settings)
  │
  ├── Get AI config from settings
  │     ├── aiApiKey missing OR aiEnabled = false
  │     │     └── RETURN fallback (deterministic)
  │     └── Config valid → proceed
  │
  ├── callAI(systemPrompt, userPrompt, config)
  │     ├── API error / network failure / timeout
  │     │     └── RETURN fallback (deterministic)
  │     └── Success → proceed
  │
  ├── tryParseAiResponse(content)
  │     ├── No valid JSON found
  │     │     └── RETURN fallback (deterministic, with rawResponse)
  │     └── Valid → proceed
  │
  └── aiRoadmapResultToRoadmapData(parsed)
        └── RETURN AI-generated RoadmapData
```

### Fallback behavior at each level:

| Failure | `usedAi` | `error` | `rawResponse` |
|---|---|---|---|
| AI not configured | `false` | `"AI not configured..."` | `null` |
| API error | `false` | API error message | `null` |
| Empty response | `false` | `"AI returned empty response..."` | `null` |
| Unparseable JSON | `true` | `"Failed to parse AI response..."` | Raw text |
| Exception | `false` | Exception message | `null` |
| Success | `true` | `null` | Raw JSON text |

### At the `ensureRoadmap` level:

```typescript
// try AI first
try {
  const result = await generatePlanWithAI(settings, { completedTaskCount })
  if (result.roadmap) return result.roadmap // AI or fallback roadmap
} catch {
  // AI threw exception; fall through
}

// absolute fallback
const roadmap = generateRoadmap(settings, tasks)
saveRoadmap(roadmap)
return roadmap
```

The user never sees an error — they always get a roadmap.

---

## Usage Instructions

### Enabling AI Generation

1. Open app settings
2. Set `aiEnabled` to `true`
3. Enter your AI provider API key (e.g., OpenAI API key)
4. (Optional) Configure custom endpoint, model, or provider
5. Save settings
6. Navigate to Roadmap page — next generation will use AI

### Programmatic Usage

```typescript
import { generatePlanWithAI } from './features/roadmap/aiRoadmapGenerator'
import type { AppSettings } from './models'

// Basic usage — uses settings directly
const result = await generatePlanWithAI(settings)

// With learning enrichment
const enriched = await generatePlanWithAI(settings, {
  studyStreak: 14,
  lastStudyDate: '2026-07-03',
  completedTaskCount: 42,
  recentMockBands: [6.0, 6.5],
  weakSkillAccuracy: { Writing: 0.55, Speaking: 0.6 },
})

// Check result
if (result.usedAi) {
  console.log('AI-generated roadmap:', result.roadmap)
} else {
  console.log('Fallback used:', result.error)
  console.log('Raw AI response:', result.rawResponse)
}
```

### Via `ensureRoadmap` (recommended)

```typescript
import { ensureRoadmap } from './features/roadmap/roadmapService'

const roadmap = await ensureRoadmap()
// Returns RoadmapData — either AI-generated, cached, or deterministic fallback
```

### Manual Re-generation

```typescript
import { saveRoadmap, loadRoadmap } from './features/roadmap/roadmapService'
import { generatePlanWithAI } from './features/roadmap/aiRoadmapGenerator'

// Force re-generate
const result = await generatePlanWithAI(settings, { completedTaskCount })
if (result.roadmap) {
  saveRoadmap(result.roadmap)
}
```

---

## Testing

### Test File

`apps/web/src/features/roadmap/__tests__/aiRoadmapGenerator.test.ts`

### Test Coverage

| Category | Tests | What's Verified |
|---|---|---|
| Input extraction | 4 | Field mapping, defaults, edge cases (empty weakSkills, no exam, bandGap) |
| Data enrichment | 2 | Study streak override, optional extras handling |
| Prompt building | 9 | System prompt content, user prompt fields, weak areas, topics, schedule, time constraints, streak |
| AI generation | 10 | Config check (no key, disabled), API error, empty response, unparseable JSON, valid response, exceptions, enrichment pass-through, custom endpoint, markdown code fences, invalid JSON detection |
| Conversion | 5 | Structure correctness, multiple phase offset, timestamps |
| Integration | 5 | RoadmapService integration, fallback on AI failure, caching, recalculate, save |

### Running Tests

```bash
npx vitest run apps/web/src/features/roadmap/__tests__/aiRoadmapGenerator.test.ts
```

---

## Best Practices for Maintenance & Extension

### Adding New User Profile Fields to AI Prompts

1. Add the field to `AiPlanInput` interface in `aiPlanPrompts.ts`
2. Update `extractAiPlanInput()` to populate the field from `AppSettings`
3. Add the field to `buildPlanUserPrompt()` in the appropriate section (time, skill, or preference context)
4. If the field comes from learning data (not `AppSettings`), update `enrichWithLearningData()` and `LearningExtras`
5. Update tests in `aiRoadmapGenerator.test.ts` to verify the new field appears in prompts

### Modifying the AI Response Format

1. Update the `AiRoadmapResult` / `AiRoadmapPhase` / `AiRoadmapWeek` / `AiRoadmapDay` interfaces in `aiPlanPrompts.ts`
2. Update the JSON format example in both `buildPlanUserPrompt()` and `buildPlanSystemPrompt()`
3. Update `tryParseAiResponse()` if structural validation logic needs changing
4. Update the conversion functions (`aiDayToRoadmapDay`, `aiPhaseToRoadmapPhase`, `aiRoadmapResultToRoadmapData`) in `aiRoadmapGenerator.ts`
5. Update tests — both mock responses and validation assertions

### Changing the Fallback Behavior

- Modify `generatePlanWithAI()` to add new failure conditions
- Update `AiRoadmapGenerationResult` interface if new metadata fields are needed
- Update the `ensureRoadmap()` catch block if fallback strategy changes

### Adding a New AI Model

1. No code changes needed — model is configured via `AppSettings.aiModel`
2. Verify the model supports the requested `maxTokens: 4096` and JSON output format
3. Adjust `temperature` in `generatePlanWithAI` if the model behaves differently

### Adding a New AI Provider

1. Implement `IAiAdapter` in `packages/ai/src/adapters/` (see `openai.ts`)
2. Register in the adapter factory in `packages/ai/src/adapters/index.ts`
3. User configures `aiProvider: 'new-provider'` in settings — no roadmap code changes needed

### Prompt Versioning Strategy

- Current prompt version is implicit (inline in `buildPlanSystemPrompt` / `buildPlanUserPrompt`)
- To version: add a `PROMPT_VERSION = 'v2'` constant, add version metadata to the generated roadmap, and handle backward compatibility in parsing

### Performance Considerations

- AI generation is async and can take 5–30 seconds depending on model and provider
- Cached roadmap (if < 24h old) avoids unnecessary API calls
- The deterministic fallback is synchronous and fast (~1ms)
- Consider adding response caching with a profile hash for identical inputs (see design doc section 8)

### Security & Privacy

- API keys are stored in `localStorage` / `chrome.storage.local` — never hardcoded, never sent to our servers
- AI is opt-in: `aiEnabled` defaults to `false`, `aiApiKey` defaults to `''`
- Only the structured `AiPlanInput` data is sent to the AI — no raw database contents
- Users can see what will be sent by inspecting the prompt builders
- The `DEFAULT_SETTINGS` in `models/index.ts` ensure safe defaults

---

## Troubleshooting

| Symptom | Likely Cause | Resolution |
|---|---|---|
| Roadmap always falls back to deterministic | AI not configured | Check `aiEnabled` is `true` and `aiApiKey` is set in settings |
| AI returns "Failed to parse" | AI response format changed | Check the raw response via `result.rawResponse`; verify AI model supports the requested JSON format |
| AI generation slow | Large response (maxTokens 4096) | Consider reducing `maxTokens`, or switch to a faster model |
| AI generation fails silently | Exception caught in `generatePlanWithAI` | Check browser console for error; verify API endpoint and key validity |
| Cached roadmap never updates | Cache TTL (24h) not expired | Manually trigger re-generation by calling `generatePlanWithAI` directly |
| Study streak not appearing in prompts | `LearningExtras` not provided | Pass `extras` to `generatePlanWithAI` or update `ensureRoadmap` to compute and pass streak data |

---

## File Inventory

| File | Purpose |
|---|---|
| `apps/web/src/features/roadmap/aiPlanPrompts.ts` | Input extraction, enrichment, prompt builders |
| `apps/web/src/features/roadmap/aiRoadmapGenerator.ts` | AI orchestration, response parsing, conversion, fallback |
| `apps/web/src/features/roadmap/roadmapService.ts` | `ensureRoadmap` triage, deterministic generator, cache |
| `apps/web/src/features/roadmap/__tests__/aiRoadmapGenerator.test.ts` | Unit + integration tests |
| `apps/web/src/models/index.ts` | `AppSettings` interface and defaults |
| `packages/ai/src/client/types.ts` | `ProviderConfig`, `AICallResult`, `AIClient` |
| `packages/ai/src/client/index.ts` | `callAI` function |
| `docs/ai-plan-roadmap-integration-design.md` | Initial architecture design doc |
| `docs/ai-plan-roadmap.md` | This file — implementation documentation |
| `docs/ai-architecture.md` | Overall AI package architecture |
