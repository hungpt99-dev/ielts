Your current architecture has a complete planning engine, but exercise generation is fragmented across several services and components. Most generators do not use the learner’s profile, approximately 30 of 34 generation paths are not profile-aware, exercise results do not feed back into progress, and six shared skill-module interfaces have no implementation. 

Use this prompt:

````text
Redesign, refactor, and fully implement the IELTS Journey Learning Engine as the single authoritative engine for every exercise, lesson, practice activity, learning session, assessment, review, and learning-content feature in the application.

The Learning Engine must interact bidirectionally with the AI Tutor Engine.

Every learning feature must understand and use, when relevant:

- User profile
- Current IELTS level
- Target IELTS level
- Current score for each skill
- Target score for each skill
- IELTS exam type
- Exam date
- Study roadmap
- Current phase
- Current week
- Today’s scheduled task
- Available study time
- User progress
- Skill progress
- Recent performance
- Weak skills
- Strong skills
- Mistake history
- Repeated mistake patterns
- Saved vocabulary
- Saved articles and content
- YouTube transcripts
- Exercise history
- Previous feedback
- Tutor memory
- Learning preferences
- Preferred task types
- Study intensity
- Current learning streak
- Missed and incomplete activities

This task is not only about creating a new service or changing imports.

Refactor the complete learning architecture, exercise generation, exercise execution, grading, feedback, result persistence, progress updates, mistake extraction, vocabulary integration, plan integration, AI orchestration, tutor context, offline behavior, web consumers, extension consumers, data migration, and tests.

Use the existing project stack, monorepo, TypeScript, React, IndexedDB/Dexie, local-first architecture, AI provider abstraction, Study Plan Engine, AI Tutor Engine, and existing UI design system.

Do not create a new backend.

Do not implement a static UI prototype.

Do not preserve duplicate learning and AI infrastructure only for convenience.

Do not build one giant `LearningEngine` class containing every responsibility.

Build one cohesive engine composed of focused domain modules, application use cases, policies, registries, repositories, and platform adapters.

# 1. Product objective

Every exercise and learning feature must become part of one connected learning system.

The system must support this complete loop:

```text
User profile and goals
    ↓
Study Plan Engine schedules a learning objective
    ↓
Learning Engine converts it into a suitable learning session
    ↓
AI Tutor Engine contributes relevant learner context and teaching strategy
    ↓
Learning Engine generates or selects exercises
    ↓
User completes the activity
    ↓
Learning Engine evaluates and stores the result
    ↓
Mistakes, progress, skill evidence, and vocabulary are updated
    ↓
AI Tutor Engine updates learner understanding and memory
    ↓
Study Plan Engine can adapt future tasks
    ↓
AI Tutor proactively recommends the next best action
````

The final experience should feel like one intelligent learning system, not separate pages with unrelated AI buttons.

# 2. Single authoritative Learning Engine

The `@ielts/learning-engine` package must become the single source of truth for all reusable learning and exercise behavior.

Every exercise or learning feature in:

* `apps/web`
* `apps/extension`
* AI Tutor interfaces
* Study Roadmap
* Vocabulary Notebook
* Imported Content
* Saved Articles
* YouTube learning
* Writing Practice
* Speaking Practice
* Reading Practice
* Listening Practice
* Grammar Learning
* Teaching Mode
* Review and Mistake features
* Future mobile applications

must call the Learning Engine application API.

No React component, page, feature service, or extension script should independently generate, evaluate, or persist exercises.

The following must not have separate competing implementations:

* Exercise generation
* Lesson generation
* Exercise schemas
* Question schemas
* Exercise result models
* Answer evaluation
* Feedback generation
* Difficulty selection
* Learning-session creation
* Skill-level calculation
* Mistake extraction
* Progress updates
* Exercise caching
* AI retries
* AI output parsing
* Offline fallback
* Exercise source selection
* Task-to-exercise conversion

# 3. Clear responsibility boundaries

Use three major systems with explicit ownership.

## Study Plan Engine

The Study Plan Engine owns:

* Exam timeline
* Study phases
* Weekly plans
* Study dates
* Available study time
* Daily capacity
* Task scheduling
* Skill-time allocation
* Review scheduling
* Mock-test scheduling
* Missed-task rescheduling
* Plan feasibility
* Plan regeneration

It decides:

* What learning objective should happen
* On which date
* For which skill
* For how many minutes
* With what priority

It does not generate detailed lesson or exercise content.

## Learning Engine

The Learning Engine owns:

* Learning objectives
* Learning sessions
* Lesson selection
* Exercise generation
* Exercise selection
* Exercise lifecycle
* Question lifecycle
* Answer submission
* Deterministic grading
* AI-assisted evaluation
* Feedback normalization
* Difficulty adaptation
* Attempt persistence
* Exercise result persistence
* Mistake extraction
* Vocabulary evidence
* Skill evidence
* Progress evidence
* Review activity creation
* Content-source integration
* Offline exercise templates
* Exercise caching and deduplication

It decides:

* Which learning activity fulfills a scheduled objective
* Which exercise format is suitable
* How difficult it should be
* How many questions fit the available time
* Which learner evidence is relevant
* How answers are evaluated
* Which progress and mistake events are produced

## AI Tutor Engine

The AI Tutor Engine owns:

* Learner context
* Learner-state snapshots
* Tutor memory
* Teaching strategy
* Context relevance
* Profile interpretation
* Progress interpretation
* Skill-priority interpretation
* Mistake-pattern interpretation
* Natural-language explanations
* AI-generated educational content
* AI-generated feedback
* Next-best-action recommendations
* Proactive support
* Progress reviews
* Tutor conversation
* Context-aware motivation

It contributes intelligence and personalization to the Learning Engine but does not own exercise persistence or attempt state.

# 4. Required dependency direction

Use this dependency direction:

```text
Applications
    ↓
Learning Engine application facade
    ↓
Learning Engine domain
    ↓
Ports
    ↓
Platform infrastructure adapters
```

For AI-assisted operations:

```text
Learning Engine use case
    ↓
AI Tutor Engine port
    ↓
AI Tutor context and teaching strategy
    ↓
Provider-neutral AI client
```

For roadmap learning:

```text
Study Plan Engine
    ↓
Learning task contract
    ↓
Learning Engine
```

For completed learning:

```text
Learning Engine
    ↓
Learning events and progress evidence
    ├──→ AI Tutor Engine
    └──→ Study Plan Engine adaptation
```

Rules:

* The Learning Engine may depend on stable AI Tutor Engine contracts.
* The AI Tutor Engine must not directly mutate learning attempts.
* The AI Tutor Engine must not directly mutate the study roadmap.
* The Study Plan Engine must not directly generate exercises.
* React components must not coordinate these systems manually.
* Application use cases and orchestrators must manage cross-engine workflows.
* Avoid circular package dependencies.

If a circular dependency currently exists or would be introduced, move shared contracts into a small neutral package such as:

```text
@ielts/learning-contracts
```

Only create this package when necessary. Do not create unnecessary packages.

# 5. Public Learning Engine facade

Expose one small, stable public facade.

Example:

```ts
interface LearningEngine {
  createSession(
    request: CreateLearningSessionRequest,
    options?: LearningOperationOptions,
  ): Promise<CreateLearningSessionResult>;

  generateActivity(
    request: GenerateLearningActivityRequest,
    options?: LearningOperationOptions,
  ): Promise<GenerateLearningActivityResult>;

  submitAnswer(
    request: SubmitLearningAnswerRequest,
    options?: LearningOperationOptions,
  ): Promise<SubmitLearningAnswerResult>;

  completeSession(
    request: CompleteLearningSessionRequest,
    options?: LearningOperationOptions,
  ): Promise<CompleteLearningSessionResult>;

  resumeSession(
    sessionId: string,
  ): Promise<ResumeLearningSessionResult>;

  generateReview(
    request: GenerateLearningReviewRequest,
    options?: LearningOperationOptions,
  ): Promise<GenerateLearningReviewResult>;

  getRecommendedActivity(
    request: LearningRecommendationRequest,
  ): Promise<LearningRecommendationResult>;

  createSessionFromRoadmapTask(
    request: RoadmapTaskLearningRequest,
  ): Promise<CreateLearningSessionResult>;

  createSessionFromContent(
    request: ContentLearningRequest,
  ): Promise<CreateLearningSessionResult>;

  adaptDifficulty(
    request: AdaptDifficultyRequest,
  ): Promise<AdaptDifficultyResult>;

  getSessionSummary(
    sessionId: string,
  ): Promise<LearningSessionSummaryResult>;
}
```

The facade coordinates focused application use cases.

It must not contain all domain logic directly.

Do not export every internal helper, registry, prompt builder, or repository implementation from the package root.

# 6. Target package architecture

Refactor `@ielts/learning-engine` into clear internal boundaries.

Suggested structure:

```text
packages/learning-engine/src/
  domain/
    entities/
      learning-session.ts
      learning-activity.ts
      exercise.ts
      exercise-question.ts
      learning-attempt.ts
      answer-submission.ts
      evaluation.ts
      feedback.ts
      mistake-evidence.ts
      skill-evidence.ts
      progress-evidence.ts

    value-objects/
      band-score.ts
      local-date.ts
      duration-minutes.ts
      difficulty-level.ts
      confidence-score.ts
      exercise-score.ts

    policies/
      difficulty-policy.ts
      activity-selection-policy.ts
      question-count-policy.ts
      session-duration-policy.ts
      evaluation-policy.ts
      mastery-policy.ts
      review-policy.ts
      content-relevance-policy.ts
      exercise-deduplication-policy.ts

    services/
      learning-objective-analyzer.ts
      exercise-selector.ts
      deterministic-grader.ts
      progress-evidence-builder.ts
      mistake-evidence-builder.ts
      skill-evidence-builder.ts

    events/
      learning-event.ts

    errors/
    results/
    schemas/

  application/
    sessions/
      create-learning-session.ts
      resume-learning-session.ts
      complete-learning-session.ts

    activities/
      generate-learning-activity.ts
      get-recommended-activity.ts
      create-roadmap-task-session.ts
      create-content-session.ts

    attempts/
      start-attempt.ts
      submit-answer.ts
      complete-attempt.ts

    evaluation/
      evaluate-answer.ts
      evaluate-writing.ts
      evaluate-speaking.ts
      evaluate-session.ts

    review/
      generate-mistake-review.ts
      generate-vocabulary-review.ts
      generate-spaced-review.ts

    adaptation/
      adapt-difficulty.ts
      adapt-next-activity.ts
      resolve-incomplete-session.ts

  skills/
    writing/
    speaking/
    reading/
    listening/
    vocabulary/
    grammar/

  content/
    task-template-registry.ts
    exercise-template-registry.ts
    content-source-registry.ts
    content-normalizer.ts
    imported-content-adapter.ts
    article-content-adapter.ts
    youtube-content-adapter.ts
    saved-vocabulary-adapter.ts
    mistake-content-adapter.ts

  orchestration/
    learning-engine-facade.ts
    learning-context-orchestrator.ts
    learning-result-orchestrator.ts
    roadmap-learning-orchestrator.ts

  ports/
    learner-context-port.ts
    tutor-intelligence-port.ts
    study-plan-port.ts
    learning-session-repository.ts
    exercise-repository.ts
    attempt-repository.ts
    progress-repository.ts
    mistake-repository.ts
    vocabulary-repository.ts
    learning-event-publisher.ts
    clock-port.ts

  infrastructure/
    persistence/
    ai/
    cache/
    migrations/
    adapters/

  index.ts
```

These names are suggestions.

Follow existing project conventions where equivalent boundaries already exist.

# 7. Learning context

Every learning operation must use a normalized learning context.

Do not pass arbitrary unstructured `userContext` strings.

Create:

```ts
type LearningContext = {
  generatedAt: string;

  learner: {
    currentOverallBand?: number;
    targetOverallBand?: number;
    currentSkillBands: Partial<Record<IELTSSection, number>>;
    targetSkillBands: Partial<Record<IELTSSection, number>>;
    examType: IELTSExamType;
    examDate?: LocalDate;
    timezone: string;
  };

  studyPlan?: {
    roadmapId: string;
    phaseId?: string;
    weekId?: string;
    taskId?: string;
    taskObjective?: string;
    taskReason?: string;
    scheduledDate?: LocalDate;
    allocatedMinutes?: number;
    taskPriority?: TaskPriority;
  };

  progress: {
    overallProgress?: number;
    skillProgress: Partial<Record<IELTSSection, SkillProgress>>;
    recentAccuracy: Partial<Record<IELTSSection, number>>;
    recentStudyMinutes?: number;
    learningStreak?: number;
    trendBySkill: Partial<Record<IELTSSection, ProgressTrend>>;
  };

  weaknesses: LearningWeakness[];
  strengths: LearningStrength[];
  recentMistakes: LearningMistakeSummary[];
  savedVocabulary: LearningVocabularySummary[];
  relevantContent: LearningContentSummary[];
  recentAttempts: LearningAttemptSummary[];
  previousFeedback: LearningFeedbackSummary[];

  preferences: {
    preferredLearningMethods: string[];
    preferredTaskTypes: string[];
    preferredLanguage: string;
    maximumSessionMinutes?: number;
    preferredDifficulty?: ExerciseDifficulty;
  };

  constraints: {
    availableMinutes?: number;
    offlineOnly: boolean;
    aiAvailable: boolean;
  };

  contextQuality: LearningContextQuality;
};
```

The Learning Engine should obtain this context through a port backed by the AI Tutor Engine:

```ts
interface LearnerContextPort {
  buildLearningContext(
    request: BuildLearningContextRequest,
  ): Promise<LearningContext>;
}
```

# 8. Context scopes

Do not load all learner information for every exercise.

Support context scopes:

```ts
type LearningContextScope =
  | "roadmap-task"
  | "writing"
  | "speaking"
  | "reading"
  | "listening"
  | "vocabulary"
  | "grammar"
  | "mistake-review"
  | "saved-content"
  | "article"
  | "youtube"
  | "mock-test"
  | "general-practice";
```

Each scope must define:

* Required context sources
* Optional context sources
* Maximum records
* Freshness limits
* Privacy rules
* AI token budget
* Fallback behavior

Examples:

* A vocabulary quiz needs saved vocabulary, vocabulary mastery, target band, and recent mistakes.
* A Writing exercise needs Writing level, Writing target, recent Writing weaknesses, past feedback, available time, and current roadmap objective.
* A YouTube listening exercise needs the selected transcript segment, Listening level, recurring Listening mistakes, and available duration.
* A grammar review needs repeated grammar errors and related examples, not the entire roadmap.

# 9. Learning objectives

Every learning session must have a clear objective.

```ts
type LearningObjective = {
  id: string;
  skill: IELTSSection;
  subskill?: string;
  type:
    | "learn"
    | "practice"
    | "review"
    | "assess"
    | "apply"
    | "reflect";

  description: string;
  targetLevel?: number;
  source:
    | "roadmap"
    | "tutor-recommendation"
    | "user-selected"
    | "mistake-review"
    | "vocabulary-review"
    | "saved-content"
    | "imported-content"
    | "system";

  sourceId?: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  successCriteria: LearningSuccessCriterion[];
};
```

Do not generate exercises without knowing the objective they serve.

# 10. Learning-session model

Create one authoritative session model.

```ts
type LearningSessionStatus =
  | "prepared"
  | "in-progress"
  | "paused"
  | "completed"
  | "abandoned"
  | "expired";

type LearningSession = {
  id: string;
  learnerId?: string;

  objective: LearningObjective;
  skill: IELTSSection;
  mode: LearningMode;

  source: LearningSessionSource;
  sourceIds: string[];

  plannedDurationMinutes: number;
  actualDurationMinutes?: number;

  difficulty: ExerciseDifficulty;
  status: LearningSessionStatus;

  activities: LearningActivity[];
  currentActivityIndex: number;

  contextSnapshotId: string;
  roadmapTaskId?: string;

  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;

  generationMetadata: LearningGenerationMetadata;
  version: number;
};
```

A session may contain:

* Short explanation
* Worked example
* Guided exercise
* Independent exercise
* Answer review
* Reflection
* Next-step recommendation

Do not force every session to contain all stages.

# 11. Exercise model

Replace duplicate exercise models with one domain model.

```ts
type Exercise = {
  id: string;
  sessionId: string;

  skill: IELTSSection;
  exerciseType: ExerciseType;
  objectiveId: string;

  title: string;
  instructions: string;
  content?: LearningContentPayload;

  questions: ExerciseQuestion[];

  difficulty: ExerciseDifficulty;
  estimatedMinutes: number;

  sourceType:
    | "built-in"
    | "ai-generated"
    | "saved-content"
    | "saved-vocabulary"
    | "user-mistakes"
    | "youtube-transcript"
    | "article"
    | "manual";

  sourceIds: string[];

  explanationPolicy: ExplanationPolicy;
  evaluationPolicy: EvaluationPolicy;

  metadata: {
    targetBand?: number;
    focusAreas: string[];
    templateId?: string;
    aiGenerationId?: string;
    contextSnapshotHash: string;
    schemaVersion: string;
  };
};
```

Support question types such as:

```ts
type ExerciseQuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "true-false-not-given"
  | "yes-no-not-given"
  | "gap-fill"
  | "short-answer"
  | "matching"
  | "matching-headings"
  | "sentence-completion"
  | "error-correction"
  | "ordering"
  | "free-response"
  | "essay"
  | "speaking-response"
  | "shadowing"
  | "reflection";
```

Use discriminated unions for question-specific fields.

Do not create one broad question interface containing many unrelated optional properties.

# 12. Exercise generation request

All exercise generators must accept a normalized request.

```ts
type GenerateExerciseRequest = {
  objective: LearningObjective;
  skill: IELTSSection;
  requestedType?: ExerciseType;

  contextScope: LearningContextScope;
  sourceContent?: LearningSourceContent;

  constraints: {
    availableMinutes: number;
    targetQuestionCount?: number;
    allowedQuestionTypes?: ExerciseQuestionType[];
    maximumContentLength?: number;
    offlineOnly: boolean;
  };

  preferences?: {
    difficulty?: ExerciseDifficulty;
    language?: string;
    useSavedVocabulary?: boolean;
    includeExplanations?: boolean;
  };

  correlationId: string;
};
```

The engine must enrich this request with the learner context.

Consumers must not manually build AI prompts.

# 13. Activity selection

Create a deterministic `ActivitySelectionPolicy`.

It should select activities based on:

* Learning objective
* Available minutes
* Current skill level
* Target skill level
* Recent performance
* Weaknesses
* Mistake patterns
* Previous attempts
* Roadmap phase
* Exam proximity
* Preferred learning methods
* Repetition history
* Content availability
* AI availability

Example:

```text
User has 20 minutes.
Writing is the weakest skill.
Roadmap objective: develop Task 2 thesis statements.
Recent weakness: unclear position.

Selected session:
- 3-minute explanation
- 5-minute worked example
- 8-minute thesis exercise
- 4-minute feedback and reflection
```

Do not generate a full essay exercise that cannot fit the available time.

# 14. Difficulty adaptation

Create a centralized `DifficultyPolicy`.

Difficulty should consider:

* Current band
* Target band
* Recent accuracy
* Recent attempt count
* Consecutive correct answers
* Consecutive mistakes
* Time spent
* Hint usage
* User confidence
* Roadmap phase
* Exam proximity

Do not use page-specific difficulty formulas.

Example:

```ts
type DifficultyDecision = {
  level: ExerciseDifficulty;
  reasons: string[];
  confidence: number;
  alternatives?: ExerciseDifficulty[];
};
```

Adapt future activities gradually.

Do not change difficulty drastically based on one answer.

# 15. Question-count and duration rules

Question count must fit the available time.

Create deterministic rules using:

* Question type
* Reading length
* Required writing length
* Speaking response duration
* Evaluation complexity
* Current learner level
* Available session duration

Example:

```text
10-minute vocabulary review:
- 4 to 6 short questions

20-minute reading session:
- Short passage
- 4 to 5 questions
- Answer review

60-minute Writing Task 2:
- Planning
- Writing
- Self-review
- Feedback
```

Do not ask AI to decide final session capacity.

# 16. Skill modules

Implement the currently empty shared skill-module interfaces.

Each skill module must be a real production implementation.

Use a strategy interface:

```ts
interface LearningSkillModule {
  readonly skill: IELTSSection;

  supports(
    request: GenerateExerciseRequest,
  ): boolean;

  generateActivity(
    request: SkillActivityGenerationRequest,
  ): Promise<SkillActivityGenerationResult>;

  evaluate(
    request: SkillEvaluationRequest,
  ): Promise<SkillEvaluationResult>;

  createReview(
    request: SkillReviewRequest,
  ): Promise<SkillReviewResult>;
}
```

Register modules in a skill registry.

Do not use large switch statements across the application to select skill behavior.

## Writing module

Support:

* Academic Task 1
* General Training Task 1
* Task 2
* Brainstorming
* Thesis statements
* Outlining
* Paragraph structure
* Coherence
* Lexical resource
* Grammar accuracy
* Full writing practice
* Rubric-based evaluation
* Band estimation
* Mistake extraction
* Improved examples
* Progress comparison

## Speaking module

Support:

* Part 1
* Part 2 cue cards
* Part 3
* Follow-up questions
* Timed responses
* Fluency evidence
* Grammar evidence
* Vocabulary evidence
* Pronunciation evidence when supported by input
* Band estimation
* Topic repetition control
* Progress comparison

## Reading module

Support:

* Passage selection
* Passage generation
* Question-type strategies
* Multiple choice
* True/False/Not Given
* Matching headings
* Sentence completion
* Short answers
* Timing
* Error categorization
* Vocabulary extraction

## Listening module

Support:

* Transcript-based exercises
* YouTube transcripts
* Gap fill
* Multiple choice
* Short answer
* True/False
* Distractor analysis
* Timestamp references
* Shadowing
* Vocabulary extraction
* Error categorization

## Vocabulary module

Support:

* Meaning
* Pronunciation
* Part of speech
* Lemma
* Word family
* Collocations
* Synonyms
* Antonyms
* CEFR
* IELTS relevance
* Context use
* Spaced repetition
* Saved-word exercises
* Writing and Speaking application

## Grammar module

Support:

* Explanation
* Error correction
* Gap fill
* Multiple choice
* Sentence transformation
* Personalized mistake review
* Writing integration
* Speaking integration
* Recurring error detection

# 17. AI Tutor Engine integration

Define a stable port from the Learning Engine to the AI Tutor Engine.

```ts
interface TutorIntelligencePort {
  getLearnerContext(
    request: TutorLearningContextRequest,
  ): Promise<LearningContext>;

  selectTeachingStrategy(
    request: TeachingStrategyRequest,
  ): Promise<TeachingStrategyDecision>;

  generateEducationalContent<T>(
    request: EducationalContentRequest<T>,
    options?: TutorRequestOptions,
  ): Promise<EducationalContentResult<T>>;

  evaluateOpenResponse<T>(
    request: OpenResponseEvaluationRequest<T>,
    options?: TutorRequestOptions,
  ): Promise<OpenResponseEvaluationResult<T>>;

  explainFeedback(
    request: FeedbackExplanationRequest,
  ): Promise<FeedbackExplanationResult>;

  recordLearningOutcome(
    outcome: TutorLearningOutcome,
  ): Promise<RecordLearningOutcomeResult>;
}
```

The AI Tutor Engine should provide:

* Relevant profile context
* Relevant progress context
* Relevant mistakes
* Relevant tutor memory
* Teaching-strategy recommendation
* Personalized AI content
* Personalized open-answer feedback
* User-friendly feedback explanation

The Learning Engine remains responsible for:

* Exercise structure
* Exercise identity
* Session state
* Attempt state
* Deterministic validation
* Result normalization
* Persistence
* Progress events

# 18. AI usage strategy

Do not call AI for every operation.

Use deterministic logic when possible.

## Deterministic operations

Use deterministic code for:

* Session duration
* Question count
* Exercise selection
* Template selection
* Multiple-choice grading
* True/false grading
* Gap-fill grading when valid answers are known
* Answer normalization
* Score calculation
* Pass thresholds
* Progress calculation
* Skill evidence aggregation
* Spaced-review scheduling
* Duplicate detection
* Cache-key generation
* Offline fallback selection

## AI-assisted operations

Use AI for:

* Generating new contextual passages
* Generating contextual questions
* Evaluating essays
* Evaluating speaking responses
* Explaining complex answers
* Producing personalized examples
* Generating practice from user mistakes
* Generating practice from saved vocabulary
* Transforming articles into IELTS exercises
* Transforming transcripts into listening activities
* Natural-language feedback
* Pedagogical content requiring interpretation

Do not call AI once per question when one bounded batch can evaluate or generate the complete exercise.

# 19. AI request orchestration

All Learning Engine AI operations must go through the AI Tutor Engine or the agreed shared AI application port.

Remove independent AI clients from:

* `aiTutorHelper.ts`
* `AIService.ts`
* Imported-content classifiers
* React components
* Feature-level services
* Extension components

A typical exercise-generation operation should use:

* Zero AI calls when an offline template fits
* One AI call for a bounded exercise
* At most one structured repair call if output is invalid

A typical answer-evaluation operation should use:

* Zero AI calls for deterministically gradeable questions
* One batched AI call for related open answers
* At most one repair call

Requirements:

* AbortSignal support
* Request timeout
* Bounded retry
* Token budget
* Structured output
* Zod validation
* Provider abstraction
* Cache support
* Usage tracking
* Fallback behavior
* No infinite retries
* No AI call per question
* No AI calls directly from React

# 20. Structured AI schemas

Every AI response must be validated using Zod.

Do not use raw `JSON.parse` without schema validation.

Create separate schemas for:

* Reading exercises
* Listening exercises
* Writing prompts
* Writing feedback
* Speaking questions
* Speaking feedback
* Vocabulary exercises
* Grammar exercises
* Mistake reviews
* Lessons
* Feedback explanations

Example:

```ts
const generatedExerciseSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(1),
  focusAreas: z.array(z.string()),
  difficulty: exerciseDifficultySchema,
  estimatedMinutes: z.number().int().positive(),
});
```

When AI output is invalid:

1. Validate with Zod.
2. Normalize safe values.
3. Attempt one schema-repair request when appropriate.
4. Reject unsupported questions.
5. Fill missing optional values safely.
6. Fall back to a built-in template when needed.
7. Do not crash or lose the session.

# 21. Exercise caching and deduplication

Create one cache strategy.

Cache key inputs should include:

* Objective
* Skill
* Difficulty
* Source-content hash
* Relevant context hash
* Target band
* Exercise type
* Schema version
* Prompt version
* AI model compatibility version

Do not include irrelevant context in the cache key.

Support:

* Cache hit
* Cache miss
* Cache expiry
* Manual regeneration
* “Generate a different exercise”
* Content deduplication
* Question deduplication
* Topic repetition penalty

Do not return exactly the same exercise repeatedly unless it is intentionally scheduled for review.

# 22. Offline task and exercise library

Move hardcoded exercises out of React components.

Create structured offline libraries for:

* Grammar lessons
* Grammar exercises
* Vocabulary exercises
* Reading passages
* Reading questions
* Listening transcript exercises
* Speaking prompts
* Writing prompts
* Mistake-review activities
* IELTS strategies
* Exam-readiness activities

Example:

```ts
type ExerciseTemplate = {
  id: string;
  skill: IELTSSection;
  type: ExerciseType;
  supportedBands: {
    minimum: number;
    maximum: number;
  };
  supportedExamTypes: IELTSExamType[];
  supportedObjectives: string[];
  supportedDurations: number[];
  difficulty: ExerciseDifficulty;
  tags: string[];
  build(
    input: ExerciseTemplateInput,
  ): Exercise;
};
```

The offline library must be capable of creating complete valid sessions without AI.

Do not keep deterministic exercise content inside:

* `TeachingMode.tsx`
* `ReadingListeningTutor.tsx`
* `GrammarLearning.tsx`
* Other React components

# 23. Exercise attempt lifecycle

Create a clear attempt lifecycle.

```text
Session created
    ↓
Activity opened
    ↓
Attempt started
    ↓
Answers saved incrementally
    ↓
Attempt submitted
    ↓
Evaluation performed
    ↓
Feedback stored
    ↓
Mistakes extracted
    ↓
Progress evidence created
    ↓
Learning events published
    ↓
Session continued or completed
```

Use:

```ts
type LearningAttemptStatus =
  | "not-started"
  | "in-progress"
  | "submitted"
  | "evaluated"
  | "completed"
  | "abandoned";
```

Support:

* Resume after page refresh
* Partial answer persistence
* Multiple attempts when allowed
* Attempt limits when required
* Hint usage
* Time spent
* Answer changes
* Submission confirmation
* Offline completion

# 24. Answer evaluation

Create one evaluation pipeline.

```text
Submitted answer
    ↓
Input normalization
    ↓
Evaluation-policy selection
    ↓
Deterministic grading when supported
    ↓
AI evaluation when required
    ↓
Result normalization
    ↓
Feedback generation
    ↓
Mistake extraction
    ↓
Evidence creation
```

Return:

```ts
type AnswerEvaluation = {
  questionId: string;
  status:
    | "correct"
    | "partially-correct"
    | "incorrect"
    | "not-evaluable";

  score: number;
  maximumScore: number;

  feedback: string;
  explanation?: string;
  suggestedImprovement?: string;

  mistakes: MistakeEvidence[];
  skillEvidence: SkillEvidence[];

  evaluatedBy:
    | "deterministic"
    | "ai"
    | "hybrid";

  confidence: number;
};
```

Do not represent every evaluation as a simple Boolean.

# 25. Writing and Speaking evaluation

Writing and Speaking require rubric-based evaluation.

Use IELTS rubric dimensions.

## Writing

* Task achievement or task response
* Coherence and cohesion
* Lexical resource
* Grammatical range and accuracy

## Speaking

* Fluency and coherence
* Lexical resource
* Grammatical range and accuracy
* Pronunciation when sufficient input exists

Return:

* Overall estimated band
* Dimension scores
* Evidence
* Strengths
* Weaknesses
* Specific corrections
* Improvement priorities
* Practice recommendation
* Confidence
* Evaluation limitations

Do not claim official IELTS scoring.

Label scores as estimates.

Do not evaluate pronunciation from plain text.

# 26. Feedback loop

Every completed exercise must feed back into the learning system.

Create structured evidence.

```ts
type LearningOutcome = {
  sessionId: string;
  exerciseId: string;
  attemptId: string;

  skill: IELTSSection;
  objectiveId: string;

  score: number;
  maximumScore: number;
  accuracy?: number;

  estimatedBand?: number;
  difficulty: ExerciseDifficulty;

  actualMinutes: number;
  hintsUsed: number;

  strengths: SkillEvidence[];
  weaknesses: SkillEvidence[];
  mistakes: MistakeEvidence[];
  vocabularyEvidence: VocabularyEvidence[];

  completedAt: string;
};
```

After completion:

1. Save the attempt.
2. Save the normalized outcome.
3. Update progress evidence.
4. Update mistake records.
5. Update vocabulary mastery when applicable.
6. Publish learning events.
7. Send relevant outcome to the AI Tutor Engine.
8. Mark the related roadmap task complete when success criteria are met.
9. Request plan adaptation only when meaningful.
10. Recommend the next appropriate activity.

This feedback loop must work offline.

# 27. Mistake system integration

Create one authoritative mistake contract.

Mistakes must include:

* Skill
* Category
* Subcategory
* Original response
* Corrected response
* Explanation
* Source exercise
* Source question
* Occurrence time
* Recurrence count
* Severity
* Confidence
* Review status
* Related grammar or vocabulary item

The Learning Engine produces mistake evidence.

The mistake repository stores and aggregates it.

The AI Tutor Engine interprets recurring patterns.

The Study Plan Engine may prioritize future review tasks based on aggregated patterns.

Do not let each skill feature store mistakes in a different shape.

# 28. Vocabulary integration

Vocabulary learning must be connected to all relevant skills.

The engine should:

* Generate quizzes from saved words
* Track mastery
* Track review due dates
* Track incorrect usage
* Use words in Speaking exercises
* Use words in Writing exercises
* Extract useful words from articles
* Extract useful words from transcripts
* Avoid repeatedly selecting mastered words
* Prioritize difficult or overdue words
* Update vocabulary evidence after exercise completion

Use real saved vocabulary entries, not only word strings.

# 29. Study Plan Engine integration

Define a stable contract.

```ts
type RoadmapLearningTask = {
  roadmapId: string;
  phaseId: string;
  weekId: string;
  taskId: string;

  skill: IELTSSection;
  taskType: string;
  objective: string;
  reason: string;

  scheduledDate: LocalDate;
  estimatedMinutes: number;
  difficulty?: ExerciseDifficulty;
  priority: TaskPriority;

  sourceType?: string;
  sourceIds?: string[];
  successCriteria?: LearningSuccessCriterion[];
};
```

The Learning Engine converts this task into a session.

It must preserve:

* Task objective
* Time limit
* Skill
* Priority
* Source references
* Success criteria

When the session completes:

* The Learning Engine publishes a task-outcome event.
* The Study Plan application layer decides whether to mark the task complete.
* The AI Tutor Engine receives the learning outcome.
* Future plan adaptation may be requested.

The Learning Engine must not directly rewrite phase dates or roadmap capacity.

# 30. AI Tutor proactive integration

Learning events should allow the tutor to become proactive.

Publish events such as:

```ts
type LearningEvent =
  | LearningSessionCreatedEvent
  | LearningSessionStartedEvent
  | LearningSessionPausedEvent
  | LearningSessionCompletedEvent
  | LearningSessionAbandonedEvent
  | ExerciseGeneratedEvent
  | ExerciseCompletedEvent
  | AnswerEvaluatedEvent
  | MistakeDetectedEvent
  | MistakeRepeatedEvent
  | VocabularyMasteredEvent
  | VocabularyReviewDueEvent
  | SkillImprovedEvent
  | DifficultyChangedEvent
  | RoadmapTaskFulfilledEvent;
```

The AI Tutor Engine can use these events to:

* Recommend a review
* Congratulate meaningful progress
* Detect repeated mistakes
* Suggest a lighter session
* Suggest the next roadmap task
* Generate a progress review
* Update tutor memory
* Adjust teaching strategy

Do not let UI components manually trigger all tutor behavior.

# 31. Imported content

All imported-content exercise generation must use the Learning Engine.

Support:

* Articles
* Selected text
* Notes
* Public API content
* YouTube transcripts
* Saved web content

Use a normalized content model:

```ts
type LearningSourceContent = {
  id: string;
  type:
    | "article"
    | "selected-text"
    | "youtube-transcript"
    | "note"
    | "saved-content"
    | "manual-text";

  title?: string;
  text: string;
  language?: string;
  topic?: string;
  sourceUrl?: string;

  metadata?: {
    videoId?: string;
    timestampStart?: number;
    timestampEnd?: number;
    author?: string;
  };
};
```

Content adapters should:

* Validate content
* Normalize formatting
* Enforce length limits
* Preserve timestamp references
* Detect duplicate content
* Select relevant segments
* Avoid sending unnecessary full documents to AI

Remove independent exercise generation from `classify.ts` after migration.

Classification may remain a content-analysis operation, but it must feed the Learning Engine.

# 32. YouTube learning

The Learning Engine must support:

* Transcript-segment selection
* Listening questions
* Vocabulary extraction
* Summary activities
* Shadowing
* Dictation
* Comprehension
* Speaking discussion
* Writing follow-up
* Timestamp-linked feedback

Use:

* User Listening level
* Weak question types
* Saved vocabulary
* Current roadmap objective
* Available study time
* Transcript difficulty

Do not generate the same generic questions for every user.

# 33. Lesson generation

Lessons and exercises are related but different.

Create:

```ts
type LearningLesson = {
  id: string;
  objective: LearningObjective;
  title: string;
  explanation: string;
  keyPoints: string[];
  examples: LearningExample[];
  checkingQuestions: ExerciseQuestion[];
  followUpExerciseIds: string[];
  estimatedMinutes: number;
  difficulty: ExerciseDifficulty;
};
```

The Learning Engine should choose whether the user needs:

* Explanation first
* Practice first
* Review
* Assessment
* Worked example
* Guided correction

A strong user should not always receive a beginner lesson before practice.

A user repeatedly making the same mistake may need explanation before another exercise.

# 34. Learning recommendations

The Learning Engine should expose learning-specific recommendations to the AI Tutor Engine.

```ts
type LearningRecommendation = {
  action:
    | "start-roadmap-task"
    | "continue-session"
    | "review-mistakes"
    | "review-vocabulary"
    | "practice-skill"
    | "complete-assessment"
    | "use-saved-content"
    | "rest";

  skill?: IELTSSection;
  objective?: LearningObjective;
  estimatedMinutes: number;
  difficulty?: ExerciseDifficulty;
  reason: string;
  sourceIds: string[];
  priority: number;
};
```

The AI Tutor Engine may combine these with broader learner context to choose the overall next best action.

# 35. Persistence architecture

Define repository ports.

```ts
interface LearningSessionRepository {
  getById(id: string): Promise<LearningSession | null>;
  save(session: LearningSession): Promise<void>;
  findActive(): Promise<LearningSession[]>;
}

interface ExerciseRepository {
  getById(id: string): Promise<Exercise | null>;
  save(exercise: Exercise): Promise<void>;
}

interface LearningAttemptRepository {
  getById(id: string): Promise<LearningAttempt | null>;
  save(attempt: LearningAttempt): Promise<void>;
  findBySession(sessionId: string): Promise<LearningAttempt[]>;
}

interface LearningOutcomeRepository {
  save(outcome: LearningOutcome): Promise<void>;
  findRecent(
    query: LearningOutcomeQuery,
  ): Promise<LearningOutcome[]>;
}
```

Provide:

* Web Dexie implementations
* Extension storage implementations where needed
* In-memory implementations for tests

Domain and application modules must not directly import Dexie.

Use transactions when completing an attempt affects:

* Attempt
* Outcome
* Mistakes
* Vocabulary
* Progress
* Roadmap linkage
* Event outbox

# 36. Transactional event publishing

Use an outbox-style local transaction where practical.

The completion operation should not save the result but fail to publish the related event.

Store pending events transactionally with the learning outcome.

Process pending events idempotently.

This is especially important for:

* Progress updates
* Roadmap completion
* Tutor memory updates
* Proactive messages

# 37. Data versioning

Add schema versions to:

* Learning sessions
* Exercises
* Questions
* Attempts
* Evaluations
* Outcomes
* Mistakes
* AI cache records
* Generated content metadata

Use migration functions.

Do not silently discard legacy fields.

# 38. Existing data migration

Migrate current data from:

* `ExerciseQuestion`
* `ExerciseResult`
* Existing writing results
* Existing speaking results
* Grammar exercises
* Reading attempts
* Listening attempts
* AI Tutor exercise results
* Imported-content exercises
* Existing mistake records

Requirements:

* Preserve IDs when possible
* Preserve timestamps
* Preserve scores
* Preserve user answers
* Preserve correct answers
* Preserve explanations
* Preserve session associations
* Preserve source-content associations
* Add safe defaults
* Record migration version
* Make migration idempotent
* Test realistic legacy fixtures

Do not delete old stores until migration succeeds.

# 39. Web application refactor

Refactor all consumers into thin presentation layers.

The following must call the Learning Engine:

* `WritingTutor`
* `SpeakingPartner`
* `ReadingListeningTutor`
* `TeachingMode`
* `GrammarLearning`
* `ReadingPractice`
* `ListeningPractice`
* `SpeakingPractice`
* `WritingPractice`
* `VocabularyManager`
* `ImportedContentManager`
* `ArtifactsPage`
* AI Tutor Popup learning actions
* Roadmap task actions
* Vocabulary review actions
* Mistake review actions

Components should:

* Request a session
* Render activities
* Save draft answers
* Submit answers
* Render normalized feedback
* Display progress
* Trigger user actions

Components must not:

* Build AI prompts
* Parse AI JSON
* Calculate skill priorities
* Select learner context
* Store exercise results independently
* Maintain separate exercise schemas
* Contain large hardcoded exercise libraries
* Call low-level AI clients

# 40. Extension refactor

Extension learning features must also use shared contracts.

The extension may provide:

* Page content
* Selected text
* Video context
* Transcript context
* Current URL
* Timestamp
* User action

The Learning Engine must own:

* Exercise generation request
* Exercise model
* Evaluation
* Outcome
* Learning events

When running the full engine in the extension is impractical, use an adapter with the same contracts and shared domain rules.

Do not create a second independent extension learning engine.

# 41. Remove duplicated AI infrastructure

After migration, remove or reduce:

## `aiTutorHelper.ts`

Migrate its unique behavior into:

* Skill modules
* Application use cases
* AI Tutor prompt strategies

Delete redundant:

* AI request wrapper
* Manual JSON parsing
* Independent prompt construction
* Duplicate exercise generation

Keep only genuinely UI-specific mapping if still required.

## `AIService.ts`

Replace exercise methods with Learning Engine calls.

Remove:

* Independent generation
* Independent JSON parsing
* Independent fallback behavior
* Duplicate study-plan generation

The Study Plan Engine remains authoritative for planning.

## `@ielts/ai`

Keep it as low-level provider-neutral AI infrastructure when appropriate.

It should not own learner-aware orchestration.

Its existing validated provider functions may become adapters used by AI Tutor Engine skill strategies.

## Imported-content classification

Keep content classification where valuable.

Migrate exercise generation into the Learning Engine.

## Hardcoded component exercises

Move to the offline template repository.

Remove the component-level generators after all consumers migrate.

# 42. Design patterns

Use design patterns only where they solve real problems.

## Strategy pattern

Use for:

* Skill modules
* Evaluation policies
* Activity selection
* Difficulty policies
* AI and offline generation
* Content-source handling

## Registry pattern

Use for:

* Skill modules
* Exercise templates
* Content adapters
* Evaluation strategies

## Repository pattern

Use for:

* Sessions
* Exercises
* Attempts
* Outcomes
* Mistakes
* Progress

## Adapter pattern

Use for:

* AI providers
* AI Tutor Engine
* Study Plan Engine
* Dexie
* Chrome storage
* Imported content
* Legacy data

## Application use-case pattern

Use for:

* Create session
* Submit answer
* Complete session
* Generate review
* Create roadmap session
* Create content session

## Result pattern

Use discriminated unions for expected failures.

Do not introduce:

* Deep inheritance
* Generic manager classes
* Excessive factories
* Unnecessary base classes
* Abstract layers with no real alternative implementation

# 43. Result contracts

Use structured result types.

Example:

```ts
type LearningOperationResult<T> =
  | {
      status: "success";
      data: T;
      metadata: LearningOperationMetadata;
    }
  | {
      status: "partial";
      data: T;
      warnings: LearningWarning[];
      metadata: LearningOperationMetadata;
    }
  | {
      status: "needs-context";
      missingContext: LearningContextSource[];
      suggestedAction?: LearningAction;
    }
  | {
      status: "unavailable";
      reason: LearningUnavailableReason;
      fallback?: T;
    }
  | {
      status: "cancelled";
    }
  | {
      status: "failure";
      error: LearningError;
    };
```

Do not infer result types from error strings.

# 44. Error handling

Create structured errors.

Support:

* Missing learner profile
* Missing roadmap task
* Invalid source content
* Unsupported skill
* Unsupported question type
* AI unavailable
* AI timeout
* AI invalid output
* Storage failure
* Evaluation failure
* Migration failure
* Operation cancelled
* Context unavailable
* Content too large
* Session expired
* Attempt already submitted

Requirements:

* No empty catch blocks
* No silent failures
* No raw provider errors shown to users
* No API keys in logs
* Preserve technical causes
* Expose safe recovery actions
* Use offline fallback when valid

# 45. Concurrency and cancellation

Support:

* `AbortController`
* Request IDs
* Correlation IDs
* Session IDs
* Late-response protection
* Duplicate-generation suppression
* Idempotent answer submission
* Idempotent event processing
* Transactional persistence
* AI timeout
* Cancellation during generation

A cancelled or stale generation result must not overwrite a newer session.

Submitting the same attempt twice must not duplicate:

* Outcomes
* Mistakes
* Progress
* Roadmap completion
* Tutor events

# 46. Privacy and context minimization

Only send relevant learner context to AI.

Do not send:

* Entire user history
* All saved content
* Full roadmap history
* Every vocabulary item
* Every mistake
* Unrelated chat sessions
* Internal storage records
* API keys

Use:

* Relevant recent mistakes
* Relevant skill progress
* Current objective
* Current roadmap task
* Selected source content
* Relevant saved vocabulary
* Concise tutor memory

Track context categories used, not raw private prompts.

# 47. Explainability

Every generated activity should explain why it was selected.

Example:

```text
This exercise focuses on Writing thesis statements because:
- Writing has the largest gap from your target band.
- Your recent feedback shows an unclear position.
- Today’s roadmap objective is Task 2 structure.
- The activity fits your available 20 minutes.
```

Generate explanations from structured factors.

Do not expose hidden chain-of-thought.

# 48. Performance

Improve:

* Lazy loading of skill modules
* IndexedDB query count
* Context snapshot reuse
* AI cache reuse
* Exercise deduplication
* Large transcript segmentation
* React rendering
* Event processing

Do not over-cache inexpensive calculations.

Do not load complete histories when summaries are enough.

# 49. React hooks

Create focused hooks such as:

```text
useLearningSession
useLearningActivity
useExerciseAttempt
useLearningFeedback
useRoadmapLearningTask
useMistakeReview
useVocabularyReview
```

Hooks must call application APIs.

Do not reproduce domain behavior inside hooks.

# 50. Migration phases

Perform the refactor incrementally.

## Phase 1: inventory and characterization

* Map every learning and exercise entry point.
* Map all AI calls.
* Map all exercise models.
* Map all persistence locations.
* Add characterization tests.
* Record existing behavior and storage keys.

## Phase 2: domain contracts

* Create authoritative models.
* Create Zod schemas.
* Create result contracts.
* Create legacy mappers.
* Preserve compatibility.

## Phase 3: engine facade and repositories

* Implement the public facade.
* Implement application use cases.
* Implement repository ports.
* Connect Dexie adapters.

## Phase 4: context and tutor integration

* Implement learner-context port.
* Connect AI Tutor Engine.
* Add context scopes.
* Add teaching-strategy selection.

## Phase 5: skill modules

* Implement Writing
* Implement Speaking
* Implement Reading
* Implement Listening
* Implement Vocabulary
* Implement Grammar

## Phase 6: exercise lifecycle

* Implement sessions.
* Implement attempts.
* Implement answer submission.
* Implement evaluation.
* Implement outcomes.
* Implement progress evidence.

## Phase 7: planning integration

* Convert roadmap tasks into sessions.
* Complete roadmap tasks from outcomes.
* Publish adaptation evidence.

## Phase 8: consumer migration

* Migrate all web consumers.
* Migrate imported content.
* Migrate extension consumers.
* Remove direct AI calls.

## Phase 9: data migration

* Migrate exercise results.
* Migrate mistakes.
* Migrate feedback.
* Preserve history.

## Phase 10: cleanup

* Remove duplicate services.
* Remove old exercise types.
* Remove old AI wrappers.
* Remove hardcoded component generators.
* Remove dead prompts.
* Remove obsolete exports.
* Remove unused dependencies.

# 51. Testing

Add comprehensive tests.

## Domain tests

Test:

* Objective selection
* Activity selection
* Duration limits
* Question-count limits
* Difficulty selection
* Difficulty adaptation
* Exercise deduplication
* Deterministic grading
* Partial correctness
* Mastery rules
* Review selection
* Evidence creation

## Context tests

Test:

* Full profile
* Missing profile
* Partial progress
* Stale progress
* Relevant mistakes
* Relevant vocabulary
* Roadmap context
* Context scopes
* Privacy filtering
* Token limits

## Skill-module tests

Test every module:

* Generation
* Offline fallback
* AI fallback
* Evaluation
* Feedback
* Mistake extraction
* Progress evidence

## AI tests

Test:

* Valid structured output
* Invalid JSON
* Invalid schema
* Repair success
* Repair failure
* Timeout
* Cancellation
* Quota exceeded
* Cache hit
* Cache miss
* Deduplication
* No AI call per question
* Offline generation

## Persistence tests

Test:

* Session save and resume
* Partial answers
* Attempt submission
* Transaction failure
* Event outbox
* Idempotency
* Legacy migration
* Import and export

## Integration tests

Test:

* Roadmap task creates a suitable session
* Session completion marks the task fulfilled
* Writing result updates Writing progress
* Repeated grammar errors update mistake patterns
* Saved vocabulary appears in later exercises
* YouTube transcript creates a contextual Listening exercise
* Imported article creates a Reading activity
* AI Tutor receives learning outcomes
* AI Tutor recommends a relevant next action
* Study Plan can react to meaningful progress
* Offline mode completes the full loop
* Web and extension use compatible contracts

## UI tests

Test:

* Session loading
* Exercise rendering
* Draft-answer persistence
* Answer submission
* Feedback rendering
* Resume behavior
* Error recovery
* AI fallback message
* Offline state
* Keyboard navigation
* Screen-reader labels
* Mobile responsiveness

# 52. Acceptance scenarios

## Scenario A: roadmap Writing task

Profile:

```text
Current Writing: 5.0
Target Writing: 7.0
Exam: 30 days away
Available time: 30 minutes
Roadmap task: Practice Task 2 thesis statements
Recent weakness: unclear position
```

Expected:

* Learning Engine creates a 30-minute Writing session.
* It focuses on thesis statements.
* AI Tutor context includes the recent weakness.
* It does not generate a full 60-minute essay.
* Completion creates Writing skill evidence.
* Mistakes update the learner state.
* The roadmap task is fulfilled when criteria are met.

## Scenario B: vocabulary review

The learner has 20 saved words, with six due for review.

Expected:

* Engine selects due and difficult words.
* Exercise fits available time.
* Mastered words are not overused.
* Results update vocabulary mastery.
* Incorrectly used words appear in future review.
* AI Tutor may recommend applying them in Speaking or Writing.

## Scenario C: repeated grammar mistakes

Article mistakes occurred in three Writing attempts.

Expected:

* Mistake evidence is aggregated.
* Learning Engine creates a focused review session.
* Grammar module uses relevant examples.
* AI Tutor explains why the review is recommended.
* Later Writing context includes the pattern.

## Scenario D: YouTube learning

The user selects five minutes of a transcript.

Expected:

* Content adapter selects the relevant segment.
* Listening difficulty matches the user’s level.
* Questions reference timestamps.
* Exercise fits available study time.
* Results update Listening progress.
* Useful words may be saved.

## Scenario E: no AI provider

Expected:

* Complete sessions are produced from offline templates.
* Deterministic questions are graded.
* Progress and mistakes are updated.
* Roadmap integration works.
* AI Tutor clearly identifies built-in mode.
* No feature shows a blank screen.

## Scenario F: partial AI failure

Expected:

* Valid cached content is reused.
* Invalid generated content is rejected.
* One repair is attempted.
* Offline template fills the missing activity.
* Session remains valid.
* Existing data is not lost.

## Scenario G: Speaking feedback

Expected:

* Speaking module uses current and target bands.
* It uses relevant prior weaknesses.
* Text-only input does not claim pronunciation evaluation.
* Feedback is stored.
* Speaking skill evidence is updated.
* Tutor memory receives durable patterns only.

# 53. Required code-quality standards

Use:

* TypeScript strict mode
* No `any`
* Zod at all external boundaries
* Discriminated unions
* Exhaustive switch handling
* Pure deterministic policies
* Explicit repository ports
* Explicit engine adapters
* Immutable transformations where practical
* Transactional persistence
* Idempotent event handling
* Small stable package APIs
* Clear feature ownership

Avoid:

* God classes
* Direct AI calls from components
* Direct Dexie calls from shared domain logic
* Manual JSON parsing without validation
* Duplicate exercise models
* Duplicate AI wrappers
* Large generic helper files
* Business rules in JSX
* Circular dependencies
* Silent fallback
* Unlimited retries
* Hardcoded user profile values
* Hardcoded progress
* Mock-only implementations
* Unnecessary design-pattern complexity

# 54. Required final verification

Before finishing:

1. Inspect all learning and exercise entry points.
2. Inspect every direct AI call.
3. Add characterization tests.
4. Implement authoritative learning contracts.
5. Implement the Learning Engine facade.
6. Implement all six skill modules.
7. Integrate the AI Tutor Engine.
8. Integrate the Study Plan Engine.
9. Implement exercise lifecycle.
10. Implement the result feedback loop.
11. Implement offline templates.
12. Migrate all consumers.
13. Migrate existing data.
14. Remove duplicate infrastructure.
15. Run TypeScript type checking.
16. Run linting.
17. Run Learning Engine tests.
18. Run AI Tutor Engine tests.
19. Run Study Plan Engine tests.
20. Run web tests.
21. Run extension tests.
22. Run integration tests.
23. Run production web build.
24. Run production extension build.
25. Verify offline mode.
26. Verify AI-assisted mode.
27. Verify cancellation.
28. Verify idempotency.
29. Verify legacy migration.
30. Verify that no exercise feature bypasses the Learning Engine.
31. Verify that no React component calls AI directly.
32. Verify that every completed exercise updates learner evidence.
33. Verify that the AI Tutor receives relevant outcomes.
34. Verify that roadmap tasks create time-appropriate sessions.

# 55. Required final report

Provide a concise technical report.

## Architecture implemented

* Learning Engine facade
* Domain model
* Application use cases
* Skill modules
* Context integration
* Tutor integration
* Plan integration
* Repository ports
* Event system
* Offline library

## Migrated features

List every migrated:

* Learning page
* Exercise page
* AI Tutor feature
* Roadmap action
* Vocabulary action
* Imported-content action
* Extension action

## Removed

* Duplicate AI clients
* Duplicate exercise models
* Duplicate generators
* Component-level hardcoded generation
* Stale prompts
* Obsolete services
* Dead code
* Unused dependencies

## Preserved

* Existing user data
* Exercise history
* Progress
* Mistakes
* Vocabulary
* Roadmap status
* Routes
* Offline behavior
* Web and extension compatibility

## Verification

Report actual results for:

* Type checking
* Linting
* Unit tests
* Integration tests
* Migration tests
* Web build
* Extension build

Do not claim success for checks that were not executed.

# Expected final result

The final architecture must ensure:

* Every exercise uses the Learning Engine.
* Every lesson uses the Learning Engine.
* Every practice feature uses the Learning Engine.
* Every assessment uses the Learning Engine.
* Every review feature uses the Learning Engine.
* Every learning result feeds back into progress.
* Every relevant mistake feeds into learner context.
* Every relevant vocabulary result updates mastery.
* Roadmap tasks become real personalized learning sessions.
* The Learning Engine knows the learner’s profile and progress.
* The Learning Engine interacts with the AI Tutor Engine.
* The AI Tutor Engine understands learning outcomes.
* The AI Tutor can proactively recommend the next action.
* Web and extension use the same contracts.
* AI usage is centralized, validated, cached, and bounded.
* Offline learning remains fully functional.
* Existing data is preserved.
* Duplicate code and stale infrastructure are removed.
* The implementation is modular, maintainable, testable, and production-ready.

Do not stop after creating interfaces or moving files.

Implement and connect the complete end-to-end learning lifecycle from roadmap objective or user action to personalized session, exercise generation, answer evaluation, feedback, persistence, progress update, mistake update, tutor update, roadmap update, proactive recommendation, migration, testing, and cleanup.

```
```
