# Offline Learning

The platform degrades gracefully when no AI API key is configured or when the device is offline. Different features have different AI requirements.

## What Works Without AI

| Feature | Engine | Mechanism | Status |
|---|---|---|---|
| **Multiple Choice grading** | Learning Engine | `deterministic-grader.ts` — exact match | ✅ |
| **True/False/Not Given grading** | Learning Engine | `deterministic-grader.ts` — exact match | ✅ |
| **Gap-fill grading** | Learning Engine | `deterministic-grader.ts` — exact match | ✅ |
| **Vocabulary review (spaced repetition)** | Learning Engine | `vocabulary-module.ts` — template-based review | ✅ |
| **Grammar exercises** | Learning Engine | `grammar-module.ts` — template-based generation + deterministic grading | ✅ |
| **Reading existing content** | Web App | Display saved content without AI processing | ✅ |
| **Mistake review (browsing)** | Learning Engine | List + filter mistakes from repository | ✅ |
| **Study plan generation** | Study Plan Engine | `DailyPlanEngine.generatePlan` — fully deterministic | ✅ |
| **Plan regeneration** | Study Plan Engine | `PlanRegenerator.regenerate` — works with `aiProviderAvailable: false` | ✅ |
| **Plan feasibility analysis** | Study Plan Engine | `analyzeFeasibility` — no AI | ✅ |
| **Session lifecycle** | Learning Engine | Create, manage, complete sessions — no AI required | ✅ |
| **Progress tracking** | Learning Engine | `completeSession` → outcomes → progress repository | ✅ |
| **Skill gap analysis** | Study Plan Engine | `analyzeSkillGaps` — deterministic weighted formula | ✅ |
| **Difficulty adaptation** | Learning Engine | `adaptDifficulty` — rule-based from accuracy + streak | ✅ |
| **Learner context building** | AI Tutor Engine | `LearnerContextBuilder.build` — reads from storage directly | ✅ |
| **Context suggestions (basic)** | AI Tutor Engine | `generateContextSuggestions` — rule-based | ✅ |

## What Requires AI

| Feature | Engine | Falls Back To | Status |
|---|---|---|---|
| **Question generation from passages** | Learning Engine | Template-based exercises (no passage-specific) | ✗ |
| **Question generation from transcripts** | Learning Engine | No listening exercises | ✗ |
| **Writing evaluation (rubric scoring)** | Learning Engine | No evaluation (returns `unavailable`) | ✗ |
| **Speaking evaluation** | Learning Engine | No evaluation (returns `unavailable`) | ✗ |
| **Writing/Speaking feedback** | Learning Engine | No detailed feedback | ✗ |
| **Vocabulary enrichment** | Learning Engine | Template-based only | ✗ |
| **AI Tutor chat** | AI Tutor Engine | Returns `{ status: 'unavailable' }` | ✗ |
| **Proactive messages (AI-enhanced)** | AI Tutor Engine | Rule-based only (trigger + template) | ⚠️ |
| **Progress review (AI analysis)** | AI Tutor Engine | `{ status: 'unavailable' }` | ✗ |
| **Profile analysis** | Study Plan Engine | Skips AI enrichment, uses deterministic allocation | ✅ |
| **Weekly objectives (AI)** | Study Plan Engine | No AI-authored objectives | ✅ |
| **Task candidates (AI)** | Study Plan Engine | No AI-suggested tasks | ✅ |
| **Plan explanation** | Study Plan Engine | `buildExplanation` works without AI, but shows fewer details | ✅ |
| **Chat conversation** | AI Tutor Engine | No chat | ✗ |
| **Memory extraction** | AI Tutor Engine | Regex-based extraction (basic) | ⚠️ |

## How Fallback is Selected

### API Key Presence Check

In `engineBootstrap.ts`, the AI API key is read from `localStorage`:

```typescript
// engineBootstrap.ts:427-432
function readAiConfig() {
  const s = JSON.parse(localStorage.getItem('ielts-settings') ?? '{}')
  return { apiKey: s.aiApiKey ?? '', ... }
}
```

### Learning Engine Fallback (`engineBootstrap.ts:434-541`)

```typescript
// engineBootstrap.ts:472
if (!cfg.apiKey) return { success: false, error: { code: 'ai_not_configured', message: 'No AI API key', recoverable: true } }
```

The `TutorIntelligencePort` checks the key before any AI call. Without a key, all AI-dependent operations return an error tagged `ai_not_configured` with `recoverable: true`.

The `contextPort.buildLearningContext` reports `constraints.aiAvailable = !!readAiConfig().apiKey` (`engineBootstrap.ts:445`), allowing downstream components to check availability.

### AI Tutor Engine Fallback

`createAIClient` (`engineBootstrap.ts:19-33`) wraps `callAI`. If `callAI` fails (no key, network error, etc.), the client returns `{ success: false, error: ... }`.

`AITutorEngineImpl.initialize()` (`engine-impl.ts:47-54`) sets `aiAvailable: !!this.deps.aiClient`. Without a real AI client, the `FallbackTutorAIClient` is used (via `createFallbackClient()` at `engine-impl.ts:258-264`), which always returns `unavailable`.

### Study Plan Engine Fallback

`NormalizedProfile` has two flags:
- `offlineOnlyMode` — set when AI is explicitly disabled
- `aiProviderAvailable` — set when AI key + provider present

`AiPlanOrchestrator.enrichPlan` (`AiPlanOrchestrator.ts:187`) checks:

```typescript
const aiAvailable = profile.aiProviderAvailable && !profile.offlineOnlyMode
if (!generationPlan.useAI || !aiAvailable) {
  return this.emptyResult(0, true)
}
```

Without AI, the orchestrator returns an empty result with `fallbackUsed: true`. The `DailyPlanEngine.generatePlan` continues with deterministic scheduling regardless.

### Context System Fallback

The `LearnerContextBuilder` always builds a context snapshot, even without AI. The `constraints` field reports `aiAvailable: false` or `offlineOnly: true`:

```typescript
// engineBootstrap.ts:462
constraints: { offlineOnly: false, aiAvailable }
```

Components can check `learnerContext.constraints.aiAvailable` and `constraints.offlineOnly` to conditionally show or hide AI-dependent features.

## Summary Table

```
                  ┌───────────────────────┬──────────────────────┐
                  │    AI Available        │    AI Unavailable    │
├──────────────────┼───────────────────────┼──────────────────────┤
│ Study Plan Gen  │ Deterministic + AI     │ Deterministic only   │
│ Exercise Gen    │ AI from passages       │ Template-based       │
│ MC/TFNG Grading │ Deterministic          │ Deterministic        │
│ Writing Eval    │ AI rubric scoring      │ Unavailable          │
│ Speaking Eval   │ AI analysis            │ Unavailable          │
│ AI Tutor Chat   │ Full conversation      │ Unavailable          │
│ Proactive Msgs  │ Rule-based + AI        │ Rule-based only      │
│ Vocabulary      │ Spaced rep + AI enrich │ Spaced rep only      │
│ Progress Review │ AI-powered analysis    │ Basic stats only     │
└──────────────────┴───────────────────────┴──────────────────────┘
```
