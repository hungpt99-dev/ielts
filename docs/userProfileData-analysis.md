# User Profile & Content Data Analysis for AI-Driven Plan/Roadmap Generation

## 1. Data Structures Overview

### 1.1 User Profile (AppSettings)
**File:** `apps/web/src/models/index.ts:57-73`

| Field | Type | Description | Relevance to Plan/Roadmap |
|---|---|---|---|
| `targetBand` | `number` | Desired IELTS band score | Determines difficulty/pace of plan |
| `currentBand` | `number` | Current estimated band | Baseline for progress calculation |
| `examDate` | `string` | Target exam date (ISO) | Timeline/scoping of roadmap |
| `dailyStudyMinutes` | `number` | Minutes available per day | Task time allocation |
| `weakSkills` | `string[]` | User-identified weak skills | Skill focus prioritization |
| `preferredTopics` | `string[]` | Topic preferences | Content selection |
| `studyGoal` | `'academic' \| 'general'` | IELTS type | Content/strategy variation |
| `preferredSchedule` | `string[]` | Preferred study days | Day-of-week task scheduling |
| `aiEnabled` | `boolean` | AI feature toggle | Flag to enable AI generation |

### 1.2 Computed Profile (ProfileData)
**File:** `packages/learning-engine/src/types.ts:21-30`

| Field | Type | Description | Relevance |
|---|---|---|---|
| `bandProgress` | `number` | % progress from current to target | Motivation/urgency signal |
| `examCountdownDays` | `number \| null` | Days until exam | Urgency/scaling |
| `studyStreak` | `number` | Consecutive study days | Engagement/momentum |
| `lastStudyDate` | `ISOString \| null` | Most recent activity | Re-engagement timing |
| `dailyStudyMinutes` | `number` | (from settings) | Time budget |

### 1.3 Skill Progress & Weaknesses
**File:** `packages/learning-engine/src/types.ts:47-87`

- `SkillProgress[]` — per-skill sessions, minutes, accuracy %, trend (improving/declining/stable)
- `WeaknessReport` — `weakSkills[]` (with accuracy, session count, severity), `repeatedMistakes[]`, `frequentMistakeCategories[]`

### 1.4 Study Analytics
**File:** `packages/learning-engine/src/types.ts:134-175`

- `StudyConsistency` — current streak, longest streak, total study days, consistency %, weekly history
- `BandProgress[]` — historical band estimates from mock tests
- `SkillBalance[]` — time distribution across skills
- `WeeklyReflection` — weekly summary with improvements and suggestions

### 1.5 User Content Edits
**File:** `packages/content/src/userContent.ts:7-163`

- `UserContentService` manages user edits to built-in content
- `getEffectiveItems()` returns merged view (built-in + user-edited)
- Content types: `reading-passage`, `writing-prompt`, `speaking-question`, `listening-transcript`, `vocabulary-list`, `grammar-note`, `useful-phrase`, `ielts-topic`, `example-sentence`
- ContentFilter supports query, contentType, skill, topic, difficulty, tags, isBuiltIn, isFavorite

---

## 2. Current Roadmap Generation — Problems

**File:** `apps/web/src/features/roadmap/roadmapService.ts:272-379`

Currently `generateRoadmap()` uses only:
- `settings.weakSkills` — to rotate skill focus
- `settings.targetBand` — only via `getPhaseName`/`getPhaseDescription` (still hardcoded)
- `existingTasks` — to determine completion status

**Hardcoded values that ignore user profile:**
- **Phase names/descriptions** — same for all users regardless of band (L75-89)
- **Target band ranges** — static (L91-97)
- **Week focus/goals** — deterministic rotation, no personalization (L99-119)
- **Day objectives** — hardcoded 7-day cycle per skill (L121-190)
- **Task time estimates** — fixed per skill type, ignores `dailyStudyMinutes` (L260-270)
- **Course length** — always 4 phases × 4 weeks, no exam-date awareness
- **Skill rotation order** — ignores actual proficiency data

---

## 3. User Data Fields Relevant for Personalized Plan Generation

### Must-use for dynamic generation:

| Data Source | Fields | What It Enables |
|---|---|---|
| **AppSettings** | `targetBand`, `currentBand` | Difficulty scaling, phase adaptation |
| **AppSettings** | `examDate` | Dynamic timeline (weeks until exam) |
| **AppSettings** | `dailyStudyMinutes` | Per-task time budget |
| **AppSettings** | `studyGoal` (academic/general) | Content type selection |
| **AppSettings** | `weakSkills` | Weighted skill focus distribution |
| **AppSettings** | `preferredTopics` | Content topic alignment |
| **AppSettings** | `preferredSchedule` | Which days to schedule tasks |
| **ProfileService** | `studyStreak` | Adjust challenge/review load |
| **ProfileService** | `examCountdownDays` | Urgency-based phase intensity |
| **WeaknessDetection** | `weakSkills[].severity` | Prioritize weakest skills |
| **WeaknessDetection** | `repeatedMistakes` | Targeted correction tasks |
| **WeaknessDetection** | `frequentMistakeCategories` | Category-level focus |
| **ProgressService** | `skillProgress[].trend` | Adapt plan based on improvement rate |
| **ProgressService** | `skillProgress[].accuracy` | Precise skill-level targeting |
| **ProgressService** | `exerciseAccuracy[]` | Question-type-level targeting |
| **ReviewScheduler** | `dueReviews.totalDue` | Dedicate time for reviews |
| **ReviewScheduler** | `vocabularyDue` | Vocabulary maintenance |
| **ReviewScheduler** | `mistakesDue` | Mistake review time |
| **UserContentService** | `getEffectiveItems()` | User's preferred/edited content |
| **ContentFilter** | topics, tags, difficulty | Personalized material selection |

---

## 4. Integration Points for AI-Driven Plan Generation

### 4.1 Existing Aggregation Layer — `PersonalizationContext`

**File:** `apps/web/src/features/personalization/personalizationService.ts:83-190`

`buildPersonalizationContext()` already aggregates the majority of relevant data into a single structure:
- `profile` (goals, settings)
- `progress` (streak, roadmap, weekly tasks, study hours)
- `vocabulary` (counts, due reviews, mastery levels)
- `mistakes` (counts, by skill, due for review)
- `exam` (countdown, urgency flags)
- `tasks` (today's, pending, completed)
- `roadmap` (current phase, focus, next task)

**Usage pattern for AI:**
```typescript
const ctx = await buildPersonalizationContext()
const prompt = buildAIPrompt(ctx) // feed to LLM
const aiPlan = await callLLM(prompt) // get structured plan
```

### 4.2 Full State — `LearningEngineState`

**File:** `packages/learning-engine/src/LearningEngine.ts:61-145`

For deeper personalization (beyond surface context), `computeFullState()` provides:
- `profile` — computed profile metrics
- `progress.skills` — per-skill trend analysis
- `progress.exerciseAccuracy` — accuracy breakdowns
- `weaknessReport` — structured weakness analysis
- `dueReviews` — spaced repetition load
- `dailyPlan` — priority-aware daily plan
- `nextBestActions` — prioritized action list
- `studyConsistency` — long-term engagement metrics
- `skillBalance` — study time distribution
- `bandProgressHistory` — mock test trajectory

### 4.3 AI Provider Config Already in Settings

**File:** `apps/web/src/models/index.ts:67-72`

```typescript
aiApiKey: string
aiProvider: 'openai' | 'custom'
aiEndpoint: string
aiModel: string
aiEnabled: boolean
```

The app is already configured for AI — plan generation can reuse this infrastructure.

### 4.4 Integration Architecture

```
PersonalizationContext / LearningEngineState
         │
         ▼
  AI Prompt Builder (e.g., getAITutorContext pattern)
         │
         ▼
  AI Provider (OpenAI / custom via AppSettings)
         │
         ▼
  Structured Plan Output (JSON → RoadmapData)
         │
         ▼
  saveRoadmap() — stores result
```

### 4.5 Key Components to Modify

| Component | Change | File |
|---|---|---|
| `generateRoadmap()` | Accept `PersonalizationContext` or `LearningEngineState` instead of bare `AppSettings` | `apps/web/src/features/roadmap/roadmapService.ts` |
| `ensureRoadmap()` | Call `buildPersonalizationContext()` and feed to new generator | `apps/web/src/features/roadmap/roadmapService.ts` |
| New: `buildPlanPrompt()` | Construct LLM prompt from aggregated data | New file or in `roadmapService.ts` |
| New: `callAIForPlan()` | Invoke AI provider with prompt, parse structured output | New file or use existing AI service |
| New: `mapAIResponseToRoadmap()` | Convert AI JSON to `RoadmapData` | `apps/web/src/features/roadmap/roadmapService.ts` |

---

## 5. Summary

The codebase already collects rich user data through multiple services (ProfileService, ProgressService, WeaknessDetection, ReviewScheduler, UserContentService, PersonalizationService). The main gap is that `roadmapService.generateRoadmap()` does **not consume this data** — it relies on hardcoded strategies.

The integration path is:
1. Feed `PersonalizationContext` (or `LearningEngineState`) into an AI prompt builder
2. Use the existing AI infrastructure (`AppSettings.aiProvider`/`aiApiKey`)
3. Parse AI output into `RoadmapData`
4. Fall back to current rule-based logic when AI is unavailable/disabled
