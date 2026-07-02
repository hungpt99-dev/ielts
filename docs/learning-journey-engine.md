# Learning Journey Engine

> The core business logic engine that drives progress tracking, weakness detection, review scheduling, and personalized recommendations.

---

## 1. Overview

The Learning Journey Engine is the brain of the application. It processes raw study data and produces actionable insights for the user. It lives in `packages/learning-engine/` and is pure domain logic — no framework dependencies, no side effects.

### 1.1 What It Calculates

| Metric | Source | Consumed By |
|--------|--------|-------------|
| Target band progress | Mock test scores, skill sessions | Dashboard, AI Tutor |
| Exam countdown | User-set exam date | Dashboard, proactive messages |
| Daily study priority | Task completion, skill gaps | Daily plan, dashboard |
| Weak skills | Accuracy rates by skill | Dashboard, AI Tutor, planner |
| Repeated mistakes | Mistake entries by skill | Dashboard, Mistake Notebook |
| Due vocabulary reviews | SM-2 spaced repetition | Dashboard, review widget |
| Due mistake reviews | Mistake frequency | Dashboard |
| Study streak | Consecutive study days | Dashboard, AI Tutor |
| Study consistency | Study hours variance | Dashboard, analytics |
| Exercise accuracy | Exercise attempt results | Dashboard, weakness detection |
| Next best action | All of the above | Dashboard, AI Tutor, proactive messages |
| Weekly reflection | Week-over-week comparison | Analytics |

---

## 2. Package Structure

```
packages/learning-engine/src/
├── index.ts                   # Public API — LearningEngine class
├── types.ts                   # Core types and interfaces
├── LearningEngine.ts          # Main engine — orchestrates all services
│
├── profile/
│   ├── index.ts
│   └── ProfileService.ts      # User profile, target band, preferences
│
├── progress/
│   ├── index.ts
│   └── ProgressService.ts     # Band progress calculation, trends
│
├── weakness-detection/
│   ├── index.ts
│   └── WeaknessDetectionService.ts  # Weak skill identification
│
├── review-scheduler/
│   ├── index.ts
│   └── ReviewSchedulerService.ts    # Due item calculation
│
├── next-best-action/
│   ├── index.ts
│   └── NextBestActionService.ts     # Recommended next action
│
├── daily-plan/
│   ├── index.ts
│   └── DailyPlanService.ts          # Daily study plan generation
│
├── analytics/
│   ├── index.ts
│   └── AnalyticsService.ts          # Stats, trends, consistency
│
└── errors/
    └── LearningEngineError.ts
```

---

## 3. Core Services

### 3.1 ProfileService

Manages user profile data and target settings.

```typescript
class ProfileService {
  getTargetBand(userId: string): Promise<BandScore>
  getCurrentBand(userId: string): Promise<BandScore>
  getExamDate(userId: string): Promise<string | null>
  getDailyTarget(userId: string): Promise<DailyTarget>
  getStudyPreferences(userId: string): Promise<StudyPreferences>
}
```

### 3.2 ProgressService

Calculates band progress and trends across all skills.

```typescript
class ProgressService {
  getBandProgress(userId: string): Promise<BandProgress>
  getSkillProgress(userId: string, skill: Skill): Promise<SkillProgress>
  getBandTrend(userId: string, days: number): Promise<BandTrendDataPoint[]>
  getImprovementRate(userId: string, skill: Skill): Promise<number>
}
```

**Band calculation logic:**

```
Overall Band = (Listening + Reading + Writing + Speaking) / 4
Rounded to nearest 0.5
```

### 3.3 WeaknessDetectionService

Identifies the user's weakest skills based on performance data.

```typescript
class WeaknessDetectionService {
  detectWeakSkills(userId: string): Promise<WeakSkill[]>
  getSkillAccuracy(userId: string, skill: Skill): Promise<SkillAccuracy>
  getRepeatedMistakes(userId: string, limit?: number): Promise<MistakePattern[]>
}
```

**Weakness criteria:**

- Skill with lowest accuracy rate
- Skill with most repeated mistakes
- Skill with least practice time
- Skill with declining trend

### 3.4 ReviewSchedulerService

Calculates due items for vocabulary and mistake reviews.

```typescript
class ReviewSchedulerService {
  getDueVocabulary(userId: string): Promise<DueVocabularyItem[]>
  getDueMistakes(userId: string): Promise<DueMistakeItem[]>
  getDueCount(userId: string): Promise<{ vocabulary: number; mistakes: number }>
}
```

Uses SM-2 spaced repetition algorithm for vocabulary:

```
Rating 0 (Again) → interval=1, easeFactor=max(1.3, ef-0.2), reps=0
Rating 1 (Hard)  → interval=1, easeFactor=max(1.3, ef-0.15), reps+=1
Rating 2 (Good)  → interval=next(reps), easeFactor unchanged, reps+=1
Rating 3 (Easy)  → interval=next(reps)*1.3, easeFactor=ef+0.15, reps+=1

Next interval:
  reps==1 → 1 day
  reps==2 → 6 days
  reps≥3  → round(interval * easeFactor)
```

### 3.5 NextBestActionService

Recommends the single most important action for the user right now.

```typescript
class NextBestActionService {
  getNextBestAction(userId: string): Promise<RecommendedAction>
  getPriorityActions(userId: string, limit?: number): Promise<RecommendedAction[]>
}
```

**Priority rules:**

1. Due vocabulary reviews (if any) → "Review vocabulary"
2. Due mistake reviews (if any) → "Review mistakes"
3. Weak skill detected → "Practice [weak skill]"
4. No study today → "Start today's study session"
5. Exam approaching → "Take a mock test"
6. Low consistency → "Study for at least 30 minutes"
7. No recent writing practice → "Practice Writing Task 2"
8. Default → "Continue your current study plan"

### 3.6 DailyPlanService

Generates a personalized daily study plan.

```typescript
class DailyPlanService {
  generatePlan(userId: string, date: string): Promise<DailyPlan>
  getPlanProgress(userId: string, date: string): Promise<PlanProgress>
  adjustPlan(userId: string, planId: string, adjustments: PlanAdjustment): Promise<DailyPlan>
}
```

**Plan generation:**

1. Calculate available study time from user preferences
2. Allocate time across skills based on weaknesses
3. Include due reviews (vocabulary + mistakes)
4. Add one priority task from NextBestAction
5. Balance with user's preferred topics
6. Ensure no single skill dominates unless targeting weakness

### 3.7 AnalyticsService

Provides statistical analysis of study patterns.

```typescript
class AnalyticsService {
  getStudyStreak(userId: string): Promise<StudyStreak>
  getStudyConsistency(userId: string, days: number): Promise<ConsistencyScore>
  getWeeklyReflection(userId: string): Promise<WeeklyReflection>
  getSkillBalance(userId: string): Promise<SkillBalance>
  getStudyHours(userId: string, range: DateRange): Promise<StudyHoursData>
}
```

---

## 4. Main Engine

The `LearningEngine` class orchestrates all sub-services:

```typescript
class LearningEngine {
  constructor(
    private profile: ProfileService,
    private progress: ProgressService,
    private weaknessDetection: WeaknessDetectionService,
    private reviewScheduler: ReviewSchedulerService,
    private nextBestAction: NextBestActionService,
    private dailyPlan: DailyPlanService,
    private analytics: AnalyticsService
  ) {}

  async getDashboardData(userId: string): Promise<DashboardData> {
    const [profile, progress, weaknesses, dueItems, streak, nextAction] =
      await Promise.all([
        this.profile.getProfile(userId),
        this.progress.getBandProgress(userId),
        this.weaknessDetection.detectWeakSkills(userId),
        this.reviewScheduler.getDueCount(userId),
        this.analytics.getStudyStreak(userId),
        this.nextBestAction.getNextBestAction(userId),
      ])

    return {
      profile,
      progress,
      weaknesses,
      dueItems,
      streak,
      nextAction,
    }
  }
}
```

---

## 5. Data Flow

```
┌──────────────────┐
│  Feature Service │  (e.g., DashboardService)
│  requests data   │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  LearningEngine              │
│  Orchestrates sub-services   │
└───────┬──────┬──────┬────────┘
        │      │      │
        ▼      ▼      ▼
┌──────┐ ┌────┐ ┌────────┐
│Profile│ │Prog│ │Weakness│ ... (6 services)
│Service│ │ress│ │Detect  │
└──────┘ └────┘ └────────┘
        │      │      │
        ▼      ▼      ▼
┌──────────────────────────────┐
│  Repository Layer            │
│  (packages/storage)          │
└──────────────────────────────┘
```

---

## 6. Adding a New Capability

1. Create a new service in `packages/learning-engine/src/<name>/`
2. Define types in `packages/learning-engine/src/types.ts`
3. Add the service to the `LearningEngine` class constructor
4. Implement business logic (pure functions, no side effects)
5. Add unit tests in `packages/learning-engine/src/__tests__/`
6. Wire the engine into consuming features (dashboard, AI tutor, etc.)
