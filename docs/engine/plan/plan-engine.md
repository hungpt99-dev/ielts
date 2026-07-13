````text
Redesign, refactor, and fully implement the IELTS Journey Study Plan Engine so it generates a complete, realistic, personalized, and date-accurate IELTS study roadmap based on the user’s profile, current ability, target score, study preferences, available time, progress, and exam date.

This is not only a UI redesign. Rebuild the underlying planning logic, AI orchestration, scheduling, validation, persistence, regeneration, progress adaptation, and setup experience.

Use the project’s existing stack, architecture, components, routing, state management, AI provider abstraction, IndexedDB/Dexie storage, and coding conventions.

IELTS Journey is local-first. The new engine must work without a backend and must still generate a useful plan when the user has no AI API key.

Do not create a static prototype.

Do not use hardcoded profile values, dates, tasks, progress, phases, score allocations, or study durations.

Do not replace existing working functionality with mock data.

The final implementation must be production-ready, type-safe, testable, maintainable, and compatible with existing user data.

# Primary objective

The engine must generate a plan that accurately answers:

- What should this specific user study?
- Why should they study it?
- On which exact date should they study it?
- How long should each task take?
- Does every task fit within the user’s available study time?
- Does the plan finish before the exam date?
- Does the plan prioritize the user’s weakest IELTS skills?
- Does the plan include review, practice, mock tests, and final preparation?
- Can the plan adapt when the user misses tasks?
- Can the plan adapt when the user changes their profile, schedule, target, or exam date?
- Can the plan work without AI?
- Can the user understand why the plan was generated this way?

The engine must generate the complete roadmap from the selected start date until the exam date, not only a few sample days.

# Core design principles

Follow these principles throughout the implementation:

1. Deterministic calculations must not depend on AI.
2. AI must not control dates, capacity, task placement, or progress.
3. The engine must never schedule more study time than the user has available.
4. The engine must never schedule normal study tasks after the exam date.
5. Completed learning history must be preserved during regeneration.
6. The plan must remain useful when AI is unavailable.
7. All AI output must use strict structured schemas.
8. The engine must validate and repair plans before persistence.
9. Plan generation must be explainable to the user.
10. A failed AI request must not cause the entire plan generation to fail.
11. Long study plans must use controlled batched AI calls rather than one giant request.
12. The engine must not call AI once per task.

# 1. Required user profile data

The plan must use real profile and learning data.

Required inputs:

- Current IELTS overall band
- Target IELTS overall band
- Current Listening band
- Current Reading band
- Current Writing band
- Current Speaking band
- Target score for each skill when available
- IELTS test type: Academic or General Training
- Exam date
- Plan start date
- User timezone
- Study days
- Available study minutes for each day of the week
- Maximum study minutes per session
- Maximum sessions per day
- Preferred study time
- Rest days
- Study intensity
- Weak skills
- Strong skills
- Preferred learning methods
- Preferred task types

Additional personalization inputs when available:

- Recent mistakes
- Exercise accuracy
- Completed exercises
- Incomplete exercises
- Saved vocabulary
- Saved content
- Saved articles
- YouTube transcript learning data
- Writing feedback
- Speaking feedback
- Previous mock test results
- Practice history
- Task completion history
- Actual study duration
- Current learning streak
- Existing roadmap progress
- User confidence for each skill
- Previous IELTS results
- Manually selected priority skills
- Temporary unavailable dates
- Date-specific additional availability
- Offline-only mode
- AI provider availability

Do not silently generate a generic plan when critical information is missing.

Critical fields include:

- Current level
- Target level
- Exam date
- Available study schedule

Return a structured result when these fields are missing:

```ts
type MissingProfileResult = {
  status: "needs-profile-completion";
  missingFields: UserProfileField[];
  message: string;
};
````

The UI must clearly show which information is missing and route the user to the correct setup step.

# 2. Replace generic study time with weekly availability

Do not use one generic value such as `studyTimePerDay`.

Create a proper weekly availability model.

Example:

```ts
type DayAvailability = {
  enabled: boolean;
  availableMinutes: number;
  preferredTime?: "morning" | "afternoon" | "evening" | "flexible";
  maximumSessionMinutes?: number;
  maximumSessions?: number;
};

type WeeklyAvailability = {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
};
```

Also support date-specific exceptions:

```ts
type AvailabilityException = {
  date: LocalDate;
  type: "unavailable" | "custom-capacity";
  availableMinutes?: number;
  preferredTime?: StudyTimePreference;
  reason?: string;
};
```

The engine must support:

* Different available time for each weekday
* Rest days
* Temporary unavailable dates
* Extra study time on specific dates
* Multiple sessions per day
* Maximum session duration
* Maximum daily duration
* User timezone
* Local date handling
* Exam-day exclusion
* Optional light preparation on the exam date
* Automatic rescheduling rules

Never assign a normal task to a disabled day unless the user explicitly enables automatic use of rest days.

Never exceed the capacity configured for a specific date.

# 3. Timezone-safe local dates

Introduce a clear local-date abstraction.

Do not use raw JavaScript `Date` objects throughout the domain logic when this can cause UTC date shifts.

Use a type such as:

```ts
type LocalDate = string;
```

Store values in `YYYY-MM-DD` format and use centralized utilities for:

* Adding days
* Comparing dates
* Calculating date differences
* Getting the local weekday
* Creating date ranges
* Converting local dates for display
* Mapping timestamps to the user’s timezone

All planning calculations must use the user’s selected timezone.

Add tests for timezones where local dates may differ from UTC.

# 4. Exact planning window

Calculate the complete planning window before creating tasks.

The engine must calculate:

```ts
type PlanningWindow = {
  startDate: LocalDate;
  examDate: LocalDate;
  finalStudyDate: LocalDate;
  totalCalendarDays: number;
  totalAvailableStudyDays: number;
  totalAvailableMinutes: number;
  reservedBufferMinutes: number;
  schedulableMinutes: number;
};
```

Rules:

1. No task may be scheduled before the start date.
2. No normal study task may be scheduled after the exam date.
3. The exam date must not contain a normal learning task.
4. The last one or two days should normally contain only light preparation.
5. Reserve capacity for missed tasks and future adaptation.
6. Detect when the user’s target is unrealistic for the available time.
7. Never guarantee a score improvement.
8. Do not silently change the user’s settings to make the plan fit.

# 5. Plan feasibility analysis

Create a dedicated feasibility analyzer.

Example:

```ts
type PlanFeasibilityStatus =
  | "comfortable"
  | "challenging"
  | "high-risk"
  | "insufficient-time";

type PlanFeasibility = {
  status: PlanFeasibilityStatus;
  availableMinutes: number;
  recommendedMinutes: number;
  schedulableMinutes: number;
  deficitMinutes: number;
  availableStudyDays: number;
  warnings: PlanWarning[];
  suggestions: PlanAdjustmentSuggestion[];
};
```

Feasibility should consider:

* Current overall band
* Current skill bands
* Target score
* Skill gaps
* Days remaining
* Weekly availability
* Previous progress
* Study consistency
* Exam type
* Maximum session duration
* Number of available study days

When the available time is insufficient, provide actionable suggestions:

* Increase minutes on selected days
* Add another study day
* Reduce the number of rest days
* Move the exam date
* Adjust the target
* Prioritize the weakest skills
* Select an intensive high-risk plan
* Reduce optional tasks
* Replace full mock tests with section tests

Do not block all plan generation when the user chooses to continue with a high-risk plan.

Require explicit confirmation and clearly label the risk.

# 6. Deterministic engine and AI separation

The engine must have two clearly separated parts.

## Deterministic planning core

The deterministic engine is responsible for:

* Profile normalization
* Required-field validation
* Date calculations
* Timezone handling
* Study availability
* Daily capacity
* Skill-gap scoring
* Skill-time allocation
* Feasibility analysis
* Phase boundaries
* Weekly time budgets
* Daily task placement
* Task duration rules
* Session limits
* Task dependencies
* Review scheduling
* Mock-test scheduling
* Buffer allocation
* Missed-task rescheduling
* Progress calculation
* Plan validation
* Plan repair
* Persistence decisions

## AI content system

AI is responsible only for:

* Personalized pedagogical recommendations
* Weekly learning objectives
* Task ideas
* Contextual task instructions
* Personalized examples
* Exercise themes
* Explanations of why a task is useful
* Suggestions based on mistakes
* Suggestions based on saved vocabulary and content
* Optional task content generation
* Optional progress-review summaries

AI must not be responsible for:

* Final dates
* Available minutes
* Daily capacity
* Phase date boundaries
* Task placement
* Progress percentages
* Completion calculations
* Plan feasibility
* Whether a task fits on a date
* Whether the plan ends before the exam
* Final persistence decisions

The deterministic engine must validate, normalize, split, replace, reject, and schedule AI-generated task candidates.

# 7. AI call strategy

Do not generate the whole plan using one giant AI call.

Do not call AI separately for each task, each day, or each date.

Use multiple controlled and batched AI calls.

The recommended strategy is approximately 2 to 5 AI calls for initial generation, depending on:

* Plan duration
* Number of weeks
* Token limits
* Provider limits
* AI model capability
* Available cached results
* Number of task candidates required
* Validation failures

Do not hardcode a fixed call count.

The engine must decide the call strategy through an `AIGenerationPlan`.

Example:

```ts
type AIGenerationPlan = {
  useAI: boolean;
  profileAnalysisRequired: boolean;
  weeklyObjectiveBatches: AIWeekBatch[];
  taskCandidateBatches: AITaskBatch[];
  allowRepairCall: boolean;
  maximumCalls: number;
  tokenBudget: number;
};
```

## AI call 1: profile learning analysis

Use one optional AI call to analyze the normalized profile.

The input should include:

* IELTS test type
* Current and target bands
* Skill gaps
* User-declared weaknesses
* Performance evidence
* Mistake categories
* Study preferences
* Days remaining
* Total available study time

The output should contain:

* Main weaknesses
* Secondary weaknesses
* Recommended learning focus
* Recommended learning sequence
* Pedagogical risks
* Suggested task types
* A concise user-facing explanation

The AI must not return dates or final time allocation.

This call may be skipped when:

* AI is disabled
* An equivalent valid analysis is cached
* There is insufficient personalized data
* The deterministic skill-gap analysis is enough

## AI call 2: phase and weekly objective generation

Use one AI call, or batched calls for long plans, to generate pedagogical objectives for the phases and weeks already created by the deterministic engine.

The deterministic engine must provide:

* Phase IDs
* Week IDs
* Week date ranges
* Available minutes per week
* Skill allocation
* Required objective count
* Previous week focus
* User level
* Relevant weaknesses

The AI returns objectives and suggested task categories only.

It must not change:

* Week dates
* Phase dates
* Weekly capacity
* Skill allocation percentages
* Exam date
* Number of available study days

For long plans, divide weeks into batches such as 4 to 6 weeks per AI call.

Preserve continuity by including a concise summary of the previous batch.

## AI calls 3 to N: batched task candidates

Generate task candidates in batches.

A task batch should normally represent:

* One phase
* Several related weeks
* A bounded number of task candidates
* A bounded token budget

Do not generate one task per call.

Do not request the entire multi-month plan in one response.

Each batch input should include only the necessary context:

* Current phase
* Included week IDs
* Weekly objectives
* Skill allocation
* Allowed task types
* Allowed duration values
* Maximum session duration
* Relevant mistakes
* Relevant saved vocabulary
* Relevant saved content
* Existing task summaries
* Required number of candidates
* IELTS test type

The AI returns unscheduled task candidates.

The deterministic scheduler assigns the final dates and session order.

## Optional AI repair call

Allow at most one AI repair call for content-related problems such as:

* Insufficient task variety
* Invalid pedagogical sequence
* Duplicate task descriptions
* Missing task candidates for a specific objective
* Unsupported task type
* Task content that cannot be normalized

Do not use AI repair for scheduling errors.

Date, capacity, and placement errors must be fixed by deterministic repair logic.

The AI repair call must receive only the invalid candidates and structured validation issues.

## Maximum-call safety

Define configurable limits:

```ts
type AICallLimits = {
  maximumCallsPerGeneration: number;
  maximumRepairCalls: number;
  maximumTokensPerGeneration: number;
  maximumCandidatesPerBatch: number;
  maximumWeeksPerBatch: number;
  requestTimeoutMs: number;
};
```

Requirements:

* Never use an unbounded loop.
* Never retry indefinitely.
* Respect provider rate limits.
* Cancel remaining calls when the operation is aborted.
* Continue with offline templates when AI calls fail.
* Track estimated token usage.
* Track actual token usage when the provider returns it.
* Avoid sending the full user database in every call.

# 8. AI caching

Cache stable AI results to avoid unnecessary repeated calls.

Create cache keys from normalized inputs.

Possible cached results:

* Profile learning analysis
* Phase recommendations
* Weekly objectives
* Task candidate batches
* AI progress reviews

Example:

```ts
type AICacheRecord = {
  key: string;
  type:
    | "profile-analysis"
    | "weekly-objectives"
    | "task-candidates"
    | "progress-review";
  inputHash: string;
  value: unknown;
  createdAt: string;
  expiresAt?: string;
  provider?: string;
  model?: string;
  schemaVersion: string;
};
```

Cache invalidation must consider:

* Current band changes
* Target changes
* Exam-date changes
* Availability changes
* Skill-priority changes
* New performance evidence
* Schema changes
* Engine version changes
* AI model changes when output compatibility is affected

Do not invalidate all cached data when only one unrelated UI preference changes.

# 9. AI output schemas

All AI responses must use strict Zod schemas.

Do not parse unstructured prose as the primary contract.

Example profile analysis:

```ts
type AIProfileAnalysis = {
  primaryWeaknesses: Array<{
    skill: IELTSSection;
    reason: string;
    confidence: number;
  }>;
  secondaryWeaknesses: IELTSSection[];
  recommendedSequence: IELTSSection[];
  recommendedTaskTypes: StudyTaskType[];
  risks: string[];
  learnerSummary: string;
};
```

Example weekly objective:

```ts
type AIWeeklyObjective = {
  weekId: string;
  title: string;
  focus: string;
  objectives: string[];
  recommendedTaskTypes: StudyTaskType[];
  pedagogicalReason: string;
};
```

Example task candidate:

```ts
type AITaskCandidate = {
  candidateId: string;
  targetWeekId: string;
  skill: IELTSSection;
  taskType: StudyTaskType;
  title: string;
  description: string;
  objective: string;
  reason: string;
  recommendedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  priority: "low" | "normal" | "high";
  prerequisites?: string[];
  suggestedSourceTypes?: StudyTaskSourceType[];
  relevantSourceIds?: string[];
};
```

AI must not return:

* Final dates
* Progress percentages
* Phase boundaries
* Week boundaries
* Unsupported URLs
* Invalid skill values
* Invalid task types
* Durations outside allowed values
* Guaranteed band-score claims
* Duplicate candidates
* References to user data that was not provided

When AI output is invalid:

1. Parse with the strict schema.
2. Attempt safe normalization.
3. Retry schema repair once when appropriate.
4. Reject unusable candidates.
5. Use offline task templates as fallback.
6. Continue plan generation without crashing.

# 10. Prompt privacy and context minimization

Only send relevant data to AI.

Do not send the complete user profile, full activity history, or entire local database in every request.

Create context selectors for:

* Relevant recent mistakes
* Relevant saved vocabulary
* Relevant saved content
* Relevant performance metrics
* Current phase data
* Current batch of weeks
* Recent task summaries

Limit and summarize long content.

Remove irrelevant personal information.

Do not include raw private data that is not required for generating the plan.

# 11. Complete generation pipeline

Implement a clear multi-stage pipeline.

```text
Raw user profile
    ↓
Profile normalization
    ↓
Critical input validation
    ↓
Planning-window calculation
    ↓
Availability calculation
    ↓
Skill-gap analysis
    ↓
Feasibility analysis
    ↓
User confirmation when required
    ↓
Phase generation
    ↓
Weekly time-budget allocation
    ↓
AI generation strategy creation
    ↓
Optional AI profile analysis
    ↓
Weekly objective generation
    ↓
Built-in and AI task candidate generation
    ↓
Candidate normalization and deduplication
    ↓
Deterministic task scheduling
    ↓
Spaced-review scheduling
    ↓
Mock-test scheduling
    ↓
Final-week preparation
    ↓
Plan validation
    ↓
Deterministic repair
    ↓
Optional AI content repair
    ↓
Final validation
    ↓
Transactional persistence
```

Every stage must have a clear input and output contract.

Do not implement the entire pipeline in:

* One React component
* One React hook
* One large service
* One AI prompt
* One deeply nested function

# 12. Skill-gap analysis

Create a deterministic `SkillGapAnalyzer`.

Use inputs such as:

* Difference between current and target score
* Recent accuracy
* Mistake frequency
* User-selected weaknesses
* User confidence
* Time since last practice
* Previous task completion
* Mock test results
* Required skill dependencies
* Days remaining

Example concept:

```ts
priorityScore =
  normalizedBandGap * bandGapWeight +
  normalizedErrorRate * errorWeight +
  userPriority * preferenceWeight +
  inactivityScore * inactivityWeight +
  lowConfidenceScore * confidenceWeight;
```

Make weights configurable and documented.

Do not allocate equal time to all skills by default.

Example:

```text
Current:
Listening 6.5
Reading 6.5
Writing 5.0
Speaking 5.5

Target:
Overall 7.0
```

The engine should allocate substantially more time to Writing and Speaking while preserving maintenance practice for Listening and Reading.

Expose normalized allocation:

```ts
type SkillAllocation = {
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  vocabulary: number;
  grammar: number;
};
```

All percentages must total 100 after normalization.

Vocabulary and grammar may support the four main IELTS skills and should not incorrectly dominate the plan.

# 13. Dynamic phase planning

Do not use fixed phases for every user.

Select phases based on:

* Current level
* Target level
* Skill gaps
* Remaining time
* Available capacity
* Exam type
* Existing progress
* Previous mock performance

Supported phase types may include:

* Diagnostic and Setup
* Foundation
* Skill Building
* Strategy Development
* Guided Practice
* Timed Practice
* Mock Examination
* Error Correction
* Final Review
* Exam Readiness

Not every plan needs every phase.

Examples:

* A learner with four months may need a longer Foundation phase.
* A Band 6.5 learner with three weeks should focus on timed practice and correction.
* A learner with five days should receive an intensive high-risk revision plan.
* A returning learner with completed foundation tasks should not repeat the entire Foundation phase.

Example model:

```ts
type StudyPhase = {
  id: string;
  type: StudyPhaseType;
  title: string;
  description: string;
  startDate: LocalDate;
  endDate: LocalDate;
  targetSkills: IELTSSection[];
  objectives: string[];
  allocatedMinutes: number;
  scheduledMinutes: number;
  order: number;
  status: "upcoming" | "active" | "completed";
};
```

Phase lengths must be based on actual available study capacity, not only calendar percentages.

# 14. Study-time budgeting

Create a formal study-time budget.

```ts
type StudyTimeBudget = {
  totalAvailableMinutes: number;
  reservedBufferMinutes: number;
  schedulableMinutes: number;
  newLearningMinutes: number;
  guidedPracticeMinutes: number;
  independentPracticeMinutes: number;
  reviewMinutes: number;
  vocabularyMinutes: number;
  mistakeReviewMinutes: number;
  timedPracticeMinutes: number;
  mockTestMinutes: number;
  mockAnalysisMinutes: number;
  finalPreparationMinutes: number;
};
```

The sum of scheduled categories must never exceed schedulable capacity.

Allocate time based on:

* Plan duration
* Current band
* Target band
* Skill gaps
* Study intensity
* Maximum session duration
* Number of study days
* Proximity to the exam
* Existing progress

Do not schedule a full mock exam when the user does not have sufficient continuous study time.

Split mock tests into valid sections when necessary.

# 15. Weekly plan model

Every week must include:

* Week ID
* Week number
* Start date
* End date
* Title
* Main focus
* Description
* Learning objectives
* Target skills
* Available minutes
* Scheduled minutes
* Reserved buffer
* Skill allocation
* Tasks
* Completion target
* Optional checkpoint
* Optional AI review

Example:

```ts
type StudyWeek = {
  id: string;
  phaseId: string;
  weekNumber: number;
  startDate: LocalDate;
  endDate: LocalDate;
  title: string;
  focus: string;
  description: string;
  objectives: string[];
  targetSkills: IELTSSection[];
  availableMinutes: number;
  scheduledMinutes: number;
  bufferMinutes: number;
  skillAllocation: Partial<Record<IELTSSection, number>>;
  taskIds: string[];
};
```

Avoid identical weekly structures.

The plan should show meaningful progression.

Example:

```text
Week 1: Diagnosis and foundation
Week 2: Writing structure and core vocabulary
Week 3: Speaking fluency and idea development
Week 4: Accuracy and guided practice
Week 5: Timed performance
Week 6: Mock tests and error correction
Week 7: Final review and exam readiness
```

This is only an example. The actual progression must be generated from the user’s data.

# 16. Task model

Use a normalized task model.

```ts
type StudyTaskStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "skipped"
  | "rescheduled";

type StudyTask = {
  id: string;
  roadmapId: string;
  phaseId: string;
  weekId: string;

  date: LocalDate;
  sessionOrder: number;

  skill:
    | "listening"
    | "reading"
    | "writing"
    | "speaking"
    | "vocabulary"
    | "grammar"
    | "review"
    | "mock-test"
    | "exam-preparation";

  taskType: StudyTaskType;

  title: string;
  description: string;
  objective: string;
  reason: string;

  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  priority: "low" | "normal" | "high" | "critical";

  sourceType:
    | "built-in"
    | "saved-content"
    | "saved-vocabulary"
    | "user-mistakes"
    | "ai-generated"
    | "manual";

  sourceIds?: string[];

  status: StudyTaskStatus;

  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  actualMinutes?: number;

  dependencies?: string[];
  reviewOfTaskId?: string;
  rescheduledFromDate?: LocalDate;

  metadata: {
    targetBand?: number;
    focusArea?: string;
    exerciseCount?: number;
    generationReason?: string;
    templateId?: string;
    aiCandidateId?: string;
  };
};
```

Use sensible duration options:

* 10 minutes
* 15 minutes
* 20 minutes
* 30 minutes
* 45 minutes
* 60 minutes
* 90 minutes

Do not create a 60-minute task when the user has only 30 minutes available.

Do not silently reduce a task’s estimated duration to make it fit.

Split long tasks into meaningful subtasks when appropriate.

A small amount of unused capacity is acceptable.

Do not create meaningless filler tasks simply to use every minute.

# 17. Deterministic task scheduler

Create a constraint-based deterministic scheduler.

For each available study date:

1. Read the date-specific capacity.
2. Apply availability exceptions.
3. Respect maximum session duration.
4. Respect maximum sessions per day.
5. Select candidates according to phase.
6. Respect skill-priority allocation.
7. Respect task dependencies.
8. Prioritize required reviews.
9. Prioritize high-value unfinished work.
10. Avoid excessive repetition of the same demanding skill.
11. Balance intensive and lighter tasks.
12. Keep the total duration within daily capacity.
13. Preserve buffer capacity when required.
14. Avoid placing multiple highly demanding tasks on a short day.
15. Avoid placing a full mock test immediately before the exam.

Valid example for a 45-minute day:

```text
Vocabulary review: 15 minutes
Writing idea generation: 30 minutes
```

Invalid example:

```text
Writing Task 2: 60 minutes
Listening exercise: 30 minutes
```

Use deterministic scoring for candidate selection.

Example factors:

* Phase relevance
* Skill priority
* Task priority
* Deadline
* Dependency readiness
* Review urgency
* Weekly allocation deficit
* Difficulty balance
* Recent repetition
* Duration fit

Make scheduling scores testable.

# 18. Built-in offline task library

Create or improve an offline task-template library.

The system must be capable of generating a complete usable roadmap without AI.

Include task templates for:

* Listening
* Reading
* Academic Writing Task 1
* General Training Writing Task 1
* Writing Task 2
* Speaking Part 1
* Speaking Part 2
* Speaking Part 3
* Vocabulary
* Grammar
* Pronunciation
* Timed practice
* Mock tests
* Error analysis
* Weekly review
* Final exam preparation
* Exam checklist

Example:

```ts
type TaskTemplate = {
  id: string;
  skill: IELTSSection;
  taskType: StudyTaskType;
  testTypes: IELTSExamType[];
  minimumBand: number;
  maximumBand: number;
  compatiblePhases: StudyPhaseType[];
  allowedDurations: number[];
  difficulty: TaskDifficulty;
  titleTemplate: string;
  descriptionTemplate: string;
  objectiveTemplate: string;
  reasonTemplate: string;
  tags: string[];
  requiredCapabilities?: string[];
};
```

Do not place large template definitions directly in the scheduler.

Create a repository or catalog abstraction.

Allow AI-generated candidates and built-in candidates to use the same normalized scheduling contract.

# 19. Task candidate deduplication

Before scheduling, deduplicate task candidates.

Detect duplicates using:

* Task type
* Skill
* Objective similarity
* Title normalization
* Source IDs
* Target week
* Template ID
* AI candidate ID

Avoid generating the same task repeatedly across adjacent days.

Some repetition is valid for spaced practice, but it must have a clear review relationship.

# 20. Spaced repetition

The plan must schedule review tasks, not only new learning.

Use configurable intervals such as:

* Same day
* 1 day
* 3 days
* 7 days
* 14 days

Use spaced review for:

* Saved vocabulary
* Grammar mistakes
* Writing feedback
* Speaking weaknesses
* Incorrect answers
* Difficult reading questions
* Listening mistakes
* Previously completed difficult tasks

Review tasks must reference the original task or content.

Example:

```ts
type ReviewSchedule = {
  sourceTaskId: string;
  preferredIntervals: number[];
  scheduledReviewTaskIds: string[];
};
```

Rules:

* Never schedule a review after the exam.
* Compress intervals logically when time is limited.
* Do not remove all review activity because the plan is short.
* Avoid excessive review that prevents progress on major weaknesses.

# 21. Mock-test scheduling

Mock tests must be scheduled intentionally.

Rules:

* Diagnostic mock tests may appear near the beginning.
* Full mock tests should not appear too early without a clear reason.
* Every mock test must have a related analysis activity.
* Mock-test analysis must not be omitted.
* Do not schedule an exhausting full mock immediately before the exam.
* Use section-level timed practice when the user lacks continuous time.
* Increase timed practice closer to the exam.
* Respect maximum session length.
* Respect the IELTS test type.

A mock test should normally create:

1. Complete the test or test section.
2. Analyze errors.
3. Update weakness evidence.
4. Rebalance future tasks when necessary.

# 22. Final-week planning

The final week must use special planning rules.

Include an appropriate combination of:

* Weak-skill review
* Error-log review
* Vocabulary review
* Speaking confidence practice
* Writing structure review
* Test strategy
* Time-management practice
* Exam format review
* Light timed practice
* Sleep and routine reminders
* Exam-day checklist
* Travel and document preparation

Avoid:

* Introducing large amounts of new material
* An exhausting full mock one day before the exam
* Overloading the final evening
* Scheduling work after the exam
* Creating fear-based or unrealistic messaging

# 23. Missed-task adaptation

When the user misses a task, the roadmap must adapt.

Do not simply move every missed task to the following day.

Evaluate:

* Task priority
* Task relevance
* Task dependencies
* Skill importance
* Remaining time
* Future capacity
* Reserved buffer
* Whether the task can be shortened
* Whether the task can be replaced
* Whether the task can be merged with review
* Whether the task should be dropped

Possible outcomes:

* Reschedule
* Split
* Replace
* Merge
* Convert to a shorter version
* Move to a buffer slot
* Drop low-priority work
* Ask the user to increase availability

Create a structured adaptation result:

```ts
type MissedTaskResolution = {
  taskId: string;
  action:
    | "rescheduled"
    | "split"
    | "replaced"
    | "merged"
    | "dropped"
    | "requires-user-action";
  reason: string;
  affectedTaskIds: string[];
};
```

# 24. Regeneration modes

Support explicit regeneration modes.

```ts
type RegenerationMode =
  | "full"
  | "future-only"
  | "rebalance"
  | "settings-change"
  | "exam-date-change"
  | "availability-change"
  | "target-change";
```

## Full regeneration

Use when:

* The user explicitly requests it
* The plan has not started
* Fundamental settings changed substantially

## Future-only regeneration

Preserve:

* Completed tasks
* Historical tasks
* Progress history
* Previous AI reviews
* Mistakes
* Saved learning evidence

Regenerate incomplete tasks from today onward.

## Rebalance

Preserve future tasks when possible but redistribute them based on:

* Missed tasks
* New performance evidence
* Updated weaknesses
* Remaining capacity
* Remaining exam window

Do not erase completed learning history when the user edits a single setting.

# 25. Settings-change impact preview

When the user changes important settings, calculate the impact before applying it.

Important changes include:

* Exam date
* Current band
* Target band
* Skill scores
* Available days
* Available minutes
* Maximum session length
* Study intensity
* Weak-skill priority
* Test type
* Rest days

Show a preview such as:

```text
Your exam date moved 14 days earlier.

Impact:
- Available study time decreases by 720 minutes.
- The Foundation phase will be shortened.
- One full mock test will be replaced by two section tests.
- Writing remains the highest-priority skill.
- Completed tasks will be preserved.
```

Required process:

1. Normalize the updated settings.
2. Calculate the impact.
3. Create a preview.
4. Explain what will be preserved.
5. Explain what will change.
6. Ask for confirmation when the change is substantial.
7. Regenerate affected future content.
8. Validate the new plan.
9. Persist transactionally.

# 26. Plan validation

Create a dedicated `PlanValidator`.

Do not persist a plan until validation succeeds.

Validate:

* Start date is before the exam date.
* Every task is inside the planning window.
* No normal task exists after the exam.
* No normal task is placed on the exam date.
* No task exists on a disabled date.
* Daily scheduled minutes do not exceed capacity.
* Session duration does not exceed the maximum.
* Number of sessions does not exceed the daily limit.
* Total scheduled minutes do not exceed schedulable minutes.
* Every task belongs to a valid week and phase.
* Week date ranges are valid.
* Phase date ranges are valid.
* Task dependencies are ordered correctly.
* Reviews occur after their source task.
* Skill allocation percentages are valid.
* Progress is derived from actual tasks.
* All IDs are unique.
* Duplicate tasks are controlled.
* Required fields are present.
* Dates are timezone-safe.
* The plan contains actionable tasks when capacity exists.
* Mock tests include analysis.
* Final-week rules are respected.
* AI-generated data matches schemas.
* The plan contains no guaranteed score claims.

Use structured validation issues:

```ts
type PlanValidationIssue = {
  code: PlanValidationCode;
  severity: "warning" | "error";
  path?: string;
  message: string;
  repairable: boolean;
};
```

# 27. Deterministic plan repair

Create a bounded deterministic repair stage.

Supported repairs may include:

* Move a task to the next suitable available date
* Move a task to an earlier available date
* Split a long task
* Replace a task with a shorter template
* Remove a low-priority duplicate
* Compress a review interval
* Convert a full mock to section practice
* Reduce optional tasks
* Recalculate phase boundaries
* Rebalance skill allocations
* Use reserved buffer time
* Reorder task dependencies

Requirements:

* Maximum repair attempt count
* No infinite loops
* Track performed repairs
* Validate after every repair cycle
* Do not use AI for date and capacity repair

If the plan cannot be repaired, return a structured failure with suggestions.

# 28. Generation result contract

Return structured results instead of generic exceptions.

```ts
type GenerateStudyPlanResult =
  | {
      status: "success";
      plan: StudyPlan;
      feasibility: PlanFeasibility;
      warnings: PlanWarning[];
      generationSummary: PlanGenerationSummary;
    }
  | {
      status: "needs-profile-completion";
      missingFields: UserProfileField[];
    }
  | {
      status: "requires-confirmation";
      preview: StudyPlanPreview;
      feasibility: PlanFeasibility;
    }
  | {
      status: "cancelled";
    }
  | {
      status: "failure";
      reason: PlanGenerationFailureReason;
      validationIssues: PlanValidationIssue[];
      suggestions: PlanAdjustmentSuggestion[];
    };
```

Do not detect result types through string matching.

# 29. Progress calculations

All progress must come from actual task data.

Calculate:

* Overall task progress
* Weighted overall progress
* Phase progress
* Weekly progress
* Skill progress
* Completed planned minutes
* Planned versus actual study time
* Completion consistency
* Missed-task count
* Rescheduled-task count

Example formulas:

```ts
taskProgress =
  completedTaskCount / totalTaskCount;

minuteProgress =
  completedEstimatedMinutes / totalScheduledMinutes;

weightedProgress =
  completedTaskWeight / totalTaskWeight;
```

Handle zero-task cases safely.

Do not hardcode values such as:

* 5%
* 1 of 21 tasks
* Week 1
* Band 7
* Three weeks remaining

# 30. Plan explanation

The user must be able to understand the plan.

Expose a plan summary containing:

* Current band
* Target band
* Exam date
* Days remaining
* Available study days
* Total available hours
* Total scheduled hours
* Reserved buffer
* Feasibility
* Weakest skills
* Skill allocation
* Phase structure
* Number of tasks
* Number of review tasks
* Number of mock tests
* AI usage
* Offline fallback usage

Each task should include a concise reason.

Example:

```text
This Writing task is prioritized because Writing is currently your
lowest-scoring skill and has the largest gap from your target.
```

Do not expose hidden chain-of-thought or raw AI reasoning.

Generate user-facing explanations from stored factors and structured results.

# 31. Plan setup UX redesign

Redesign the setup flow so the engine receives complete and valid information.

Use a multi-step flow.

## Step 1: IELTS goal

Fields:

* IELTS test type
* Current overall band
* Current Listening band
* Current Reading band
* Current Writing band
* Current Speaking band
* Target overall band
* Optional target band for each skill

Show validation and explain why skill-level scores improve personalization.

## Step 2: Exam timeline

Fields:

* Exam date
* Plan start date
* Timezone

Show:

* Days remaining
* Weeks remaining
* Final recommended study date
* Warning when the exam is too close

## Step 3: Weekly availability

For every weekday:

* Enable or disable the day
* Available minutes
* Preferred study time
* Maximum session length
* Maximum number of sessions

Also include:

* Study intensity
* Rest-day preference
* Automatic rescheduling preference
* Total weekly study time

## Step 4: Learning priorities

Display:

* Automatically detected weaknesses
* User-selected priority skills
* Strong skills
* Preferred task types
* Preferred learning methods
* Existing evidence used for personalization

## Step 5: Plan preview

Show a deterministic preview before generating detailed tasks:

* Date range
* Number of weeks
* Available study days
* Average weekly minutes
* Total available hours
* Recommended hours
* Feasibility
* Skill allocation
* Proposed phases
* Estimated number of tasks
* Estimated mock-test count
* Buffer time
* Warnings
* Suggestions

This preview should not require detailed AI task generation.

## Step 6: Generate plan

Clearly show generation stages:

```text
Analyzing your profile
Calculating available study time
Building your learning phases
Creating weekly objectives
Preparing personalized tasks
Validating your schedule
Saving your roadmap
```

Do not display a fake progress percentage.

Use actual stage status.

Allow cancellation using `AbortController`.

If AI fails, show that offline task templates are being used instead of failing the whole operation.

# 32. Generation progress state

Create a structured generation state.

```ts
type PlanGenerationStage =
  | "normalizing-profile"
  | "validating-profile"
  | "calculating-availability"
  | "analyzing-skills"
  | "checking-feasibility"
  | "planning-phases"
  | "generating-objectives"
  | "generating-task-candidates"
  | "scheduling-tasks"
  | "adding-reviews"
  | "adding-mock-tests"
  | "validating-plan"
  | "repairing-plan"
  | "persisting-plan"
  | "completed";

type PlanGenerationProgress = {
  stage: PlanGenerationStage;
  completedBatches: number;
  totalBatches: number;
  message: string;
};
```

Do not hardcode fake timers to simulate progress.

# 33. Study Roadmap UI integration

Update the roadmap UI to accurately reflect the new engine.

The page should show:

* Current band to target band
* Exam date
* Days remaining
* Overall progress
* Current phase
* Current week
* Today’s task
* Weekly focus
* Weekly available minutes
* Weekly scheduled minutes
* Skill allocation
* Plan feasibility
* Warnings
* AI personalization status
* Offline fallback status when relevant

Add an accessible “Why this plan?” panel containing:

* Primary weaknesses
* Time allocation
* Phase rationale
* Feasibility
* Important constraints
* Data used to personalize the plan

Do not expose technical implementation details.

# 34. AI availability states

Support these states:

* AI configured and available
* AI configured but temporarily unavailable
* AI not configured
* AI disabled by the user
* Offline mode
* AI quota exceeded
* AI output invalid
* AI partially completed
* Offline fallback used

The user must always receive a valid plan when deterministic generation is possible.

Use clear messages such as:

```text
Your roadmap was generated using the built-in IELTS learning library.
Connect an AI provider to receive more personalized task descriptions.
```

Do not block plan generation only because AI is unavailable.

# 35. Persistence and plan versioning

Persist plans transactionally.

Never replace a valid plan with a partially generated plan.

Store generation metadata:

```ts
type PlanGenerationMetadata = {
  engineVersion: string;
  schemaVersion: string;
  generatedAt: string;
  generationReason: string;
  regenerationMode?: RegenerationMode;
  profileSnapshotHash: string;
  settingsSnapshotHash: string;
  aiUsed: boolean;
  aiProvider?: string;
  aiModel?: string;
  aiCallCount: number;
  aiTokenUsage?: number;
  offlineFallbackUsed: boolean;
  previousPlanId?: string;
  previousPlanVersion?: number;
  validationWarnings: PlanValidationIssue[];
};
```

Support:

* Plan version
* Previous plan reference
* Profile snapshot
* Settings snapshot
* Engine version
* Schema version
* Generation reason
* AI provider and model
* AI usage
* Validation result
* Repair history

# 36. Existing data migration

Create safe Dexie/IndexedDB migrations.

When migrating existing roadmap data:

* Preserve completed tasks
* Preserve progress
* Preserve user profile settings
* Preserve saved content references
* Preserve mistakes
* Preserve AI reviews
* Normalize legacy dates
* Add safe defaults for new fields
* Mark migrated records
* Avoid silently deleting old plans

Provide rollback-safe migration behavior where practical.

Test migration using realistic legacy records.

# 37. Suggested architecture

Use modular architecture.

Suggested structure:

```text
features/study-plan/
  domain/
    entities/
    value-objects/
    types/
    rules/

  application/
    generate-study-plan/
    preview-study-plan/
    regenerate-study-plan/
    rebalance-study-plan/
    resolve-missed-task/
    validate-study-plan/
    repair-study-plan/

  engine/
    profile-normalizer.ts
    profile-validator.ts
    planning-window-calculator.ts
    availability-calculator.ts
    skill-gap-analyzer.ts
    feasibility-analyzer.ts
    phase-planner.ts
    time-budget-allocator.ts
    ai-generation-strategy.ts
    task-candidate-provider.ts
    task-candidate-deduplicator.ts
    task-scheduler.ts
    review-scheduler.ts
    mock-test-scheduler.ts
    final-week-planner.ts
    progress-calculator.ts
    plan-validator.ts
    plan-repairer.ts

  infrastructure/
    ai/
      plan-ai-client.ts
      prompt-builders/
      schemas/
      cache/
    persistence/
    repositories/
    migrations/
    task-library/

  presentation/
    pages/
    components/
    hooks/
    state/
```

These names are suggestions.

Follow the project’s existing folder conventions when equivalent abstractions already exist.

# 38. Code-quality requirements

Requirements:

* TypeScript strict mode
* No `any`
* No duplicated business logic
* No date calculations inside JSX
* No AI prompt construction inside components
* No direct Dexie calls inside presentational components
* No large monolithic hooks
* No deeply nested conditional rendering
* No silent catch blocks
* No generic string errors when structured errors are possible
* Use pure functions for calculations
* Use dependency injection or clear interfaces for repositories and AI providers
* Use Zod at external and persisted-data boundaries
* Use derived state instead of duplicating progress values
* Use immutable transformations where practical
* Preserve existing public APIs unless change is necessary
* Remove dead code, obsolete plan logic, stale prompts, unused components, and unused imports
* Do not modify unrelated features

# 39. Concurrency and cancellation

Handle generation safely.

Requirements:

* Prevent multiple simultaneous generations for the same active plan
* Allow cancellation
* Ignore late responses from cancelled generations
* Do not persist partial data
* Avoid race conditions between settings updates and generation
* Use generation IDs
* Verify that the active generation is still current before persistence
* Cancel remaining AI batches when generation is cancelled
* Preserve the existing valid roadmap when generation fails

# 40. Error handling

Use clear domain errors.

Examples:

* Missing profile data
* Invalid date range
* No available study days
* Insufficient time
* AI unavailable
* AI output invalid
* Storage failure
* Migration failure
* Scheduling failure
* Validation failure
* Generation cancelled

Errors must provide:

* Stable error code
* User-facing message
* Technical context for logging
* Whether the error is recoverable
* Suggested next action

Do not expose provider secrets, raw prompts, or sensitive user data in logs.

# 41. Logging and diagnostics

Add structured development diagnostics for:

* Generation duration
* Number of AI calls
* AI batch duration
* AI failures
* Cache hits and misses
* Number of task candidates
* Number of scheduled tasks
* Unused capacity
* Validation issues
* Repairs performed
* Fallback usage

Keep production logs privacy-safe.

Do not log full saved content, API keys, raw user essays, or complete AI prompts.

# 42. Tests

Add comprehensive tests.

## Unit tests

Test:

* Profile normalization
* Missing required fields
* Local-date behavior
* Planning-window calculation
* Weekly availability
* Date-specific exceptions
* Total available minutes
* Buffer calculation
* Skill-gap scores
* Skill-allocation normalization
* Feasibility classification
* Phase creation
* Weekly time budgets
* Candidate deduplication
* Task duration matching
* Daily capacity constraints
* Session limits
* Task dependencies
* Spaced repetition
* Mock-test scheduling
* Final-week rules
* Progress calculation
* Plan validation
* Deterministic repair
* Missed-task adaptation
* Regeneration behavior
* Settings-change impact

## AI orchestration tests

Test:

* AI disabled
* AI unavailable
* Cached profile analysis
* Multiple batched calls
* Maximum call limit
* Invalid AI schema
* Partial AI failure
* AI timeout
* AI cancellation
* Offline fallback
* One repair attempt maximum
* No AI call per task
* No one-call generation for a long plan
* Correct batch continuity
* Token-budget enforcement

## Integration tests

Test:

* Complete setup-to-generation flow
* Complete offline generation
* AI-assisted generation
* Plan preview
* High-risk confirmation
* Transactional persistence
* Existing plan preservation after failure
* Future-only regeneration
* Exam-date change
* Availability change
* Migration from legacy roadmap
* Missed-task rescheduling
* Progress update after completion

## UI tests

Test:

* Missing profile state
* Setup validation
* Availability editor
* Plan preview
* Generation progress
* Generation cancellation
* AI fallback message
* Feasibility warnings
* Impact preview
* Successful roadmap rendering
* Error recovery
* Keyboard navigation
* Accessible labels
* Mobile layout

# 43. Acceptance scenarios

Verify at least these scenarios.

## Scenario A: balanced medium-term plan

```text
Current band: 5.5
Target band: 7.0
Exam date: 12 weeks away
Availability:
- Monday: 60 minutes
- Tuesday: 30 minutes
- Wednesday: rest
- Thursday: 60 minutes
- Friday: 30 minutes
- Saturday: 120 minutes
- Sunday: 60 minutes
```

Expected:

* Complete 12-week roadmap
* No Wednesday tasks
* No daily capacity exceeded
* Longer tasks placed on Saturday when appropriate
* Skill allocation based on actual gaps
* Reviews and mock tests included
* Final-week preparation included

## Scenario B: uneven skill profile

```text
Listening: 6.5
Reading: 6.5
Writing: 5.0
Speaking: 5.5
Target: 7.0
```

Expected:

* Writing receives the highest allocation
* Speaking receives the second-highest allocation
* Listening and Reading receive maintenance work
* Plan explanation clearly shows the reason

## Scenario C: short high-risk plan

```text
Current band: 5.5
Target band: 7.0
Exam date: 7 days away
Availability: 30 minutes per day
```

Expected:

* High-risk or insufficient-time status
* No false guarantee
* Clear adjustment suggestions
* User confirmation required
* Focused revision plan if confirmed
* No unrealistic long Foundation phase

## Scenario D: no AI key

Expected:

* Complete valid roadmap from built-in templates
* No crash
* Clear offline-generation message
* User may regenerate with AI later

## Scenario E: partial AI failure

Expected:

* Successful batches are reused
* Failed batch falls back to templates
* Plan still validates
* AI failure does not delete the existing plan

## Scenario F: availability changes

The user removes Tuesday and adds 60 minutes to Sunday.

Expected:

* Completed tasks preserved
* Future tasks rebalanced
* No Tuesday tasks remain in the future
* Sunday capacity is used appropriately
* Impact preview shown before applying

## Scenario G: exam date moves earlier

Expected:

* Recalculate planning window
* Recalculate feasibility
* Preserve completed tasks
* Reduce optional work
* Adjust mock tests
* Apply final-week rules to the new date
* Show impact before updating

## Scenario H: missed high-priority task

Expected:

* Evaluate future capacity
* Use buffer where possible
* Do not overload the next day
* Preserve task dependencies
* Show the user what changed

# 44. Required final verification

Before finishing:

1. Review the existing study-plan implementation.
2. Identify obsolete and duplicated planning logic.
3. Document the new generation flow.
4. Implement the deterministic engine.
5. Implement controlled batched AI orchestration.
6. Implement offline fallback.
7. Implement plan validation and repair.
8. Implement transactional persistence.
9. Implement data migration.
10. Update the setup and preview experience.
11. Update the roadmap integration.
12. Run all tests.
13. Run TypeScript type checking.
14. Run linting.
15. Run the production build.
16. Fix all issues introduced by the changes.
17. Remove dead and stale code.
18. Verify desktop, tablet, and mobile behavior.
19. Verify generation with and without AI.
20. Verify that no task exceeds user availability.
21. Verify that no task is generated after the exam date.
22. Verify that completed tasks survive regeneration.
23. Verify that long plans use batched AI calls.
24. Verify that the engine never calls AI once per task.
25. Verify that a failed AI request still produces a usable plan.

# Expected final result

The finished Study Plan Engine must:

* Generate a complete roadmap until the exam date
* Use the user’s real profile
* Use current and target skill bands
* Respect every configured study day
* Respect available minutes for every date
* Respect maximum session duration
* Prioritize weak skills
* Include meaningful phase progression
* Include reviews and spaced repetition
* Include appropriate mock tests and analysis
* Include final-week preparation
* Adapt to missed tasks
* Adapt to setting changes
* Preserve completed history
* Work without AI
* Use multiple controlled batched AI calls when AI is enabled
* Avoid one giant AI request for long plans
* Avoid one AI request per task
* Validate and repair plans before saving
* Persist plans safely
* Explain the plan clearly
* Remain local-first
* Be fully tested
* Be production-ready

Do not stop after changing the UI or AI prompt.

Inspect and update the complete flow from user settings to generation, scheduling, validation, persistence, roadmap display, progress updates, regeneration, and adaptation.

```
```
