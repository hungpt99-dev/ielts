Refactor the IELTS Journey Exercise Engine into a production-ready, extensible, blueprint-driven system that supports every current and future exercise type across Reading, Listening, Writing, Speaking, Grammar, Vocabulary, Mistake Review, AI Tutor practice, and full IELTS mock tests.

Do not patch individual exercise screens or add module-specific conditional logic inside UI components.

The result must provide one consistent exercise lifecycle while preserving the distinct domain rules of each exercise type.

## Primary objective

Audit and update all code involved in:

* Exercise definition
* Exercise generation
* Exercise selection
* Exercise validation
* Exercise rendering
* Attempt creation
* Progress persistence
* Answer submission
* Scoring
* Feedback
* Explanation
* Retry and review
* AI Tutor integration
* Learning Engine integration
* Study-plan integration
* Storage and migration
* Seed data
* Testing
* Documentation

The Exercise Engine must support:

* Full IELTS mock tests
* Complete IELTS sections and parts
* Focused IELTS practice
* Adaptive practice
* Grammar exercises
* Vocabulary exercises
* Saved-content exercises
* Mistake-review exercises
* AI-generated exercises
* Built-in exercises
* Imported exercises
* Future exercise types without requiring large engine rewrites

## Architectural requirement

Use a blueprint-driven architecture.

The engine must first create or resolve a validated exercise blueprint, then generate or load content that satisfies that blueprint.

Use this flow:

1. Receive an exercise request.
2. Resolve learner profile and learning objective.
3. Resolve IELTS variant when relevant.
4. Resolve module and exercise type.
5. Resolve exercise mode.
6. Build a validated blueprint.
7. Generate, load, or adapt exercise content.
8. Validate content against the blueprint.
9. Repair bounded AI-generation failures when possible.
10. Reject invalid exercises when repair is unsuccessful.
11. Create an attempt.
12. Run the exercise through a shared lifecycle.
13. Score and evaluate the attempt.
14. Update learner progress.
15. Send structured results to the AI Tutor Engine.
16. Recommend the next learning activity.

Do not allow AI output, UI components, repositories, or legacy services to define domain rules independently.

## Supported modules

Introduce or standardize the following modules:

```ts
type ExerciseModule =
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'grammar'
  | 'vocabulary'
  | 'saved_content'
  | 'mistake_review';
```

Use explicit domain types instead of arbitrary strings where possible.

## Exercise modes

Support these modes:

```ts
type ExerciseMode =
  | 'full_test'
  | 'full_section'
  | 'full_part'
  | 'focused_practice'
  | 'adaptive_practice'
  | 'review'
  | 'diagnostic';
```

### `full_test`

Represents a complete official IELTS module simulation.

Examples:

* Full Listening test
* Full Academic Reading test
* Full General Training Reading test
* Full Writing test
* Full Speaking simulation

It must satisfy the complete official blueprint.

### `full_section`

Represents one complete Reading passage or General Training Reading section.

### `full_part`

Represents one complete IELTS part or task.

Examples:

* Listening Part 2
* Speaking Part 2
* Writing Task 1
* Writing Task 2

### `focused_practice`

Targets a specific skill, question type, or learning objective.

Examples:

* Matching Headings practice
* Map Labelling practice
* Writing introductions
* Speaking fluency practice
* Grammar conditionals
* Vocabulary collocations

### `adaptive_practice`

Adjusts content, length, support, and difficulty based on learner evidence.

### `review`

Replays mistakes, weak vocabulary, saved questions, or previously failed concepts.

### `diagnostic`

Measures current ability before creating or updating the study plan.

Exercise mode must be visible in metadata and UI.

Do not infer it from question count.

## Exercise families

Model exercises by behavioural family rather than forcing all activities into a single flat question model.

Support at least these families:

```ts
type ExerciseFamily =
  | 'objective_questions'
  | 'completion_questions'
  | 'matching_questions'
  | 'classification_questions'
  | 'ordering_questions'
  | 'writing_task'
  | 'speaking_session'
  | 'interactive_listening'
  | 'vocabulary_activity'
  | 'grammar_activity'
  | 'content_comprehension'
  | 'review_activity';
```

The names may be adjusted to match existing conventions, but the engine must preserve the behavioural differences between these families.

## Exercise domain model

Use a discriminated union.

Example:

```ts
type Exercise =
  | ReadingExercise
  | ListeningExercise
  | WritingExercise
  | SpeakingExercise
  | GrammarExercise
  | VocabularyExercise
  | SavedContentExercise
  | MistakeReviewExercise;
```

Create shared metadata:

```ts
interface BaseExercise {
  id: string;
  schemaVersion: number;
  blueprintVersion: string;

  module: ExerciseModule;
  mode: ExerciseMode;
  family: ExerciseFamily;

  title: string;
  description?: string;
  instructions: string[];

  source: ExerciseSource;
  status: ExerciseStatus;

  estimatedDurationSeconds: number;
  difficulty: ExerciseDifficultyProfile;

  learningObjectives: LearningObjective[];
  tags: string[];

  createdAt: string;
  updatedAt: string;
}
```

Do not require every module to expose meaningless fields such as `questionCount`.

Examples:

* Writing should expose tasks.
* Speaking should expose parts and turns.
* Listening should expose audio segments and questions.
* Vocabulary may expose terms and activities.
* Grammar may expose items or transformation tasks.
* Reading should expose passages and grouped questions.

## Blueprint model

Create a reusable blueprint abstraction.

```ts
interface ExerciseBlueprint {
  id: string;
  version: string;

  module: ExerciseModule;
  mode: ExerciseMode;
  family: ExerciseFamily;

  structure: ExerciseStructureRule;
  timing: ExerciseTimingRule;
  scoring: ExerciseScoringRule;
  difficulty: ExerciseDifficultyProfile;

  allowedQuestionTypes: string[];
  requiredQuestionTypes?: string[];

  learningObjectives: LearningObjective[];

  validationRules: ExerciseValidationRule[];
}
```

Module-specific blueprint types may extend the base blueprint.

Examples:

```ts
type ModuleExerciseBlueprint =
  | ReadingBlueprint
  | ListeningBlueprint
  | WritingBlueprint
  | SpeakingBlueprint
  | GrammarBlueprint
  | VocabularyBlueprint
  | ReviewBlueprint;
```

The blueprint must be immutable after an attempt starts.

Adaptive logic may create a new blueprint for another exercise, but it must not mutate an active exercise or an official full-test blueprint.

## Official IELTS modules

Full IELTS exercises must follow the official format.

### Listening

A full Listening exercise must contain:

* Four parts
* Ten questions per part
* Forty questions total
* Realistic part progression
* Approximately 30 minutes of audio
* Audio played once in strict exam mode

A complete Listening part must contain ten questions.

Focused exercises may be shorter but must not be labelled as a complete part or full test.

Support:

* Multiple choice
* Matching
* Form completion
* Note completion
* Table completion
* Flow-chart completion
* Summary completion
* Sentence completion
* Map labelling
* Plan labelling
* Diagram labelling
* Short-answer questions

### Reading

A full Reading exercise must contain:

* Three passages or sections
* Forty questions total
* Sixty minutes
* Correct Academic or General Training content style

Do not assume equal question allocation across passages.

A complete passage should use a realistic controlled allocation.

Focused exercises may be shorter but must be labelled correctly.

Support:

* Multiple choice
* True, False, Not Given
* Yes, No, Not Given
* Matching headings
* Matching information
* Matching features
* Matching sentence endings
* Sentence completion
* Summary completion
* Note completion
* Table completion
* Flow-chart completion
* Diagram-label completion
* Short-answer questions

### Writing

A full Writing exercise must contain:

* Two tasks
* Sixty minutes
* Correct Academic or General Training Task 1
* Task 2 essay
* Task 2 weighted twice as heavily as Task 1

Writing must be modelled as tasks, not ordinary questions.

### Speaking

A full Speaking simulation must contain:

* Three parts
* Approximately 11–14 minutes
* Correct timing per part
* One-minute preparation for Part 2
* One-to-two-minute Part 2 long turn
* Appropriate examiner behaviour

During strict simulation, the AI Tutor must not provide:

* Hints
* Corrections
* Praise
* Model answers
* Mid-test evaluation

Feedback is provided after the simulation.

## Grammar exercise types

Support structured Grammar exercises such as:

```ts
type GrammarExerciseType =
  | 'multiple_choice'
  | 'gap_completion'
  | 'sentence_correction'
  | 'error_identification'
  | 'sentence_transformation'
  | 'word_order'
  | 'matching'
  | 'guided_production'
  | 'free_production'
  | 'contextual_grammar';
```

Grammar exercises must define:

* Grammar concept
* Target level
* Learning objective
* Expected answer model
* Accepted variants
* Explanation
* Error category
* Whether automatic scoring is reliable

Do not use exact-string comparison when multiple grammatically correct responses are possible.

Support normalized and semantic evaluation where appropriate.

Grammar exercises should preferably use meaningful contexts instead of isolated artificial sentences.

## Vocabulary exercise types

Support:

```ts
type VocabularyExerciseType =
  | 'meaning_selection'
  | 'word_to_definition'
  | 'definition_to_word'
  | 'context_completion'
  | 'collocation_matching'
  | 'word_family'
  | 'synonym_antonym'
  | 'spelling'
  | 'pronunciation'
  | 'productive_sentence'
  | 'contextual_recall';
```

Vocabulary exercises must support:

* Lemma
* Part of speech
* Meaning
* Context
* Collocations
* Word family
* Pronunciation
* Accepted forms
* Source content
* Review history
* Spaced-repetition metadata

Do not treat vocabulary knowledge as a single binary known or unknown value.

Track recognition, recall, spelling, usage, and retention separately where practical.

## Saved-content exercises

Allow exercises to be generated from:

* Saved articles
* Saved text
* Books
* Browser selections
* Video transcripts
* User notes

A saved-content exercise must retain a reference to its source content.

Questions must remain grounded in the source.

Do not generate answers that cannot be supported by the saved content.

Supported activities may include:

* Comprehension
* Vocabulary extraction
* Grammar analysis
* Summarization
* Paraphrasing
* Critical-response writing
* Speaking discussion
* Cloze exercises

## Mistake-review exercises

Mistake Review must be a first-class exercise mode, not a UI-only list.

A review exercise may include mistakes from:

* Reading
* Listening
* Writing
* Speaking
* Grammar
* Vocabulary

Store structured mistake evidence:

```ts
interface MistakeEvidence {
  sourceExerciseId: string;
  sourceAttemptId: string;
  itemId?: string;

  module: ExerciseModule;
  errorType: string;
  learnerAnswer?: unknown;
  expectedAnswer?: unknown;

  explanation?: string;
  occurredAt: string;
}
```

Review generation must:

* Avoid repeating already mastered mistakes excessively
* Prioritize recurring error patterns
* Mix retrieval and application
* Track whether the mistake was corrected later
* Distinguish a lucky correct answer from demonstrated mastery

## Question model

Use discriminated question types.

Example:

```ts
type ExerciseQuestion =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseNotGivenQuestion
  | YesNoNotGivenQuestion
  | CompletionQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ShortAnswerQuestion
  | ClassificationQuestion;
```

Each question must have:

```ts
interface BaseQuestion {
  id: string;
  number?: number;
  type: string;

  prompt: string;
  instructions?: string[];

  points: number;
  difficulty: QuestionDifficultyProfile;

  learningObjectiveIds: string[];

  explanation?: string;
  evidence?: AnswerEvidence;
}
```

Every question must have a stable unique ID.

Do not merge, update, or persist questions using only:

* Array index
* Display number
* Question text
* Question type

## Question groups

Support grouped questions.

Examples:

* Questions 1–5: Matching Headings
* Questions 6–9: True, False, Not Given
* Questions 10–13: Summary Completion

Use:

```ts
interface QuestionGroup {
  id: string;
  type: string;

  startNumber?: number;
  endNumber?: number;

  instructions: string[];
  sharedContent?: unknown;

  questions: ExerciseQuestion[];
}
```

The UI should render group-level instructions once.

Do not repeat identical instructions above every question.

## Answer model

Do not store every answer as a plain string.

Use typed learner responses:

```ts
type LearnerResponse =
  | ChoiceResponse
  | MultiChoiceResponse
  | TextResponse
  | MatchingResponse
  | OrderingResponse
  | WritingResponse
  | SpeakingResponse;
```

Support:

* Accepted answer variants
* Case normalization
* Whitespace normalization
* Punctuation policy
* Word limits
* Number limits
* Singular and plural variants
* British and American spelling where appropriate
* Semantic evaluation when exact matching is insufficient

The scoring policy must be defined by the question or exercise blueprint.

## Attempt lifecycle

Introduce or standardize a clear lifecycle:

```ts
type ExerciseAttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'submitted'
  | 'evaluating'
  | 'completed'
  | 'abandoned'
  | 'failed';
```

Support:

* Start
* Save progress
* Pause when permitted
* Resume
* Submit individual answers where permitted
* Submit the complete exercise
* Automatic evaluation
* AI evaluation
* Finalization
* Review

Attempt state must not be duplicated independently in multiple UI components.

The Learning Engine must be the source of truth.

## Attempt snapshots

An attempt must reference an immutable snapshot of the exercise.

Do not allow later exercise edits or regenerated AI content to change an existing attempt.

Store:

```ts
interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  exerciseSnapshotVersion: string;

  status: ExerciseAttemptStatus;

  responses: Record<string, LearnerResponse>;

  startedAt?: string;
  submittedAt?: string;
  completedAt?: string;

  elapsedSeconds: number;
  remainingSeconds?: number;

  result?: ExerciseResult;
}
```

## Timing engine

Replace simplistic word-count-only timing.

Timing must depend on the exercise family.

Examples:

### Reading

Consider:

* Passage length
* Question count
* Question types
* Passage complexity
* Exercise mode

### Listening

Consider:

* Audio duration
* Instructions
* Pauses
* Answer-review policy
* Exam or practice mode

### Writing

Use:

* Task-level time recommendations
* Full-test total
* User-selected practice constraints

### Speaking

Use:

* Preparation time
* Response time
* Examiner-turn time
* Part duration

### Grammar and Vocabulary

Consider:

* Item count
* Response complexity
* Productive versus receptive tasks
* Expected feedback time

Do not display reading-time estimates as total exercise time.

Differentiate:

* `Official duration`
* `Estimated duration`
* `Elapsed time`
* `Remaining time`

## Difficulty model

Use a structured difficulty model.

```ts
interface ExerciseDifficultyProfile {
  targetBand?: IeltsBand;
  cefrLevel?: CefrLevel;

  linguisticComplexity: number;
  lexicalComplexity: number;
  grammaticalComplexity: number;

  inferenceDepth: number;
  distractorStrength: number;
  informationDensity: number;
  paraphraseDistance: number;

  responseComplexity: number;
  timePressure: number;
}
```

Not every property must apply to every module.

Use module-specific extensions where needed.

Do not determine difficulty only from:

* Word count
* Question count
* Rare vocabulary
* Generic `easy`, `medium`, or `hard` labels

The difficulty model should influence:

* Content generation
* Question selection
* Distractor quality
* Feedback
* Time estimates
* Adaptive practice
* Next-exercise recommendations

AI-generated difficulty metadata must be validated.

Do not trust it blindly.

## Adaptive exercise policy

The adaptive system may consider:

* Current estimated IELTS band
* Target band
* Exam date
* Recent attempts
* Repeated mistakes
* Question-type accuracy
* Time performance
* Hint usage
* Vocabulary retention
* Grammar weakness
* Writing rubric results
* Speaking rubric results

Adaptive logic may change:

* Target concept
* Exercise type
* Number of items
* Time allowance
* Difficulty
* Feedback level
* Support tools
* Question-type distribution

Adaptive logic must not:

* Mutate official IELTS rules
* Mislabel practice as a full test
* Reduce a full test below required length
* Generate unsupported question types
* Infer high-confidence ability from insufficient evidence

## AI generation contracts

All AI-generated exercises must use typed structured output.

The AI request must contain:

* Module
* Exercise mode
* Exercise family
* Blueprint
* Required structure
* Required number of items
* Allowed question types
* Target difficulty
* Learning objectives
* Content constraints
* Scoring requirements
* Output schema

The application must decide the blueprint.

The AI must fill the blueprint.

Do not ask the AI to decide:

* How many parts a full test contains
* How many questions a full test contains
* Writing task weights
* Speaking part order
* Official IELTS timing

## Generation validation and repair

Use this generation flow:

1. Generate structured content.
2. Parse the schema.
3. Validate against the blueprint.
4. Detect missing, duplicate, or invalid items.
5. Repair only invalid portions where possible.
6. Revalidate.
7. Reject the exercise if required invariants remain invalid.
8. Persist only validated content.

Repair must be bounded.

Log:

* Validation error
* Original generated structure
* Repair attempt count
* Repaired sections
* Final validation result
* Rejection or fallback reason

Do not silently accept partial content.

## Scoring engine

Use scoring strategies.

```ts
interface ExerciseScoringStrategy<
  TExercise extends Exercise,
  TResponse,
  TResult
> {
  score(
    exercise: TExercise,
    responses: TResponse
  ): Promise<TResult>;
}
```

Support:

* Deterministic answer scoring
* Partial credit
* Weighted tasks
* Rubric evaluation
* AI-assisted evaluation
* Manual-review-required status
* Confidence indicators

### Objective questions

Return:

* Raw score
* Maximum score
* Accuracy
* Per-question result
* Per-question-type result

### IELTS Listening and Reading

For full tests:

* Calculate raw score out of 40
* Use module-specific estimated band conversion

Do not use the same conversion policy for:

* Listening
* Academic Reading
* General Training Reading

For partial practice:

* Show raw score
* Show percentage
* Show question-type performance
* Avoid authoritative band conversion from a tiny sample

### Writing

Support:

* Task Achievement
* Task Response
* Coherence and Cohesion
* Lexical Resource
* Grammatical Range and Accuracy

Weight Task 2 twice as much as Task 1 in a full test.

### Speaking

Support:

* Fluency and Coherence
* Lexical Resource
* Grammatical Range and Accuracy
* Pronunciation

When audio evidence is unavailable, do not pretend pronunciation was fully assessed.

### Grammar and Vocabulary

Return concept-level performance, not only total accuracy.

Examples:

* Article errors
* Tense errors
* Preposition errors
* Collocation weakness
* Spelling weakness
* Recognition versus recall

## Feedback model

Create structured feedback:

```ts
interface ExerciseFeedback {
  summary: string;

  strengths: FeedbackItem[];
  weaknesses: FeedbackItem[];
  mistakes: MistakeRecord[];

  questionTypePerformance?: Record<string, PerformanceMetric>;
  learningObjectivePerformance?: Record<string, PerformanceMetric>;

  recommendedNextActions: LearningRecommendation[];
}
```

Separate:

* Immediate answer feedback
* End-of-exercise feedback
* AI Tutor explanation
* Long-term learning recommendations

Strict exam mode must not reveal feedback before final submission.

## Learning Engine responsibilities

The Learning Engine must own or coordinate:

* Blueprint resolution
* Exercise acquisition
* Exercise validation
* Attempt lifecycle
* Timing
* Response persistence
* Submission
* Scoring
* Progress events
* Completion
* Recommendation events

The UI must not call repositories, AI providers, IndexedDB, or legacy services directly.

## AI Tutor Engine responsibilities

The AI Tutor Engine may:

* Generate content through approved ports
* Explain mistakes
* Evaluate productive responses
* Conduct Speaking practice
* Recommend follow-up exercises
* Adapt feedback to the learner
* Create repair requests
* Analyze learning patterns

The AI Tutor Engine must not:

* Directly persist attempts
* Define official test structures
* Modify immutable blueprints
* Bypass the Learning Engine
* Reveal answers in exam mode
* Produce unsupported band claims

## Repository ports

Introduce focused ports where appropriate:

```ts
interface ExerciseRepository {
  getById(id: string): Promise<Exercise | null>;
  save(exercise: Exercise): Promise<void>;
}

interface ExerciseAttemptRepository {
  getById(id: string): Promise<ExerciseAttempt | null>;
  save(attempt: ExerciseAttempt): Promise<void>;
}

interface ExerciseGeneratorPort {
  generate(
    blueprint: ExerciseBlueprint,
    context: ExerciseGenerationContext
  ): Promise<Exercise>;
}

interface ExerciseEvaluatorPort {
  evaluate(
    exercise: Exercise,
    attempt: ExerciseAttempt
  ): Promise<ExerciseResult>;
}
```

Do not create one repository or service that handles every unrelated responsibility.

## Application use cases

Use explicit application use cases, such as:

* `CreateExercise`
* `GenerateExercise`
* `ValidateExercise`
* `StartExerciseAttempt`
* `SaveExerciseResponse`
* `PauseExerciseAttempt`
* `ResumeExerciseAttempt`
* `SubmitExerciseAttempt`
* `EvaluateExerciseAttempt`
* `CompleteExerciseAttempt`
* `ReviewExerciseAttempt`
* `GenerateMistakeReview`
* `RecommendNextExercise`

Names may follow existing project conventions.

Avoid one large `ExerciseService` with many unrelated responsibilities.

## UI rendering

Create a renderer registry or strategy pattern.

Example:

```ts
interface ExerciseRendererProps<T extends Exercise> {
  exercise: T;
  attempt: ExerciseAttempt;
  onResponseChange: (
    itemId: string,
    response: LearnerResponse
  ) => void;
}
```

Register renderers by module or family.

Do not implement one massive component containing conditionals for every exercise type.

Possible renderers:

* Reading exercise renderer
* Listening exercise renderer
* Writing task renderer
* Speaking session renderer
* Grammar exercise renderer
* Vocabulary exercise renderer
* Review exercise renderer

Create reusable question renderers for:

* Multiple choice
* Completion
* Matching
* Ordering
* Short answer
* Classification

## Exercise summary UI

Exercise cards and detail pages must display:

* Module
* Exercise mode
* Exercise family
* IELTS variant where relevant
* Number of questions, tasks, parts, or terms
* Estimated or official duration
* Difficulty
* Learning objective
* Whether AI evaluation is required
* Whether it is exam simulation
* Available practice aids

Use context-appropriate units.

Examples:

```text
Academic Reading Full Test
3 passages · 40 questions · 60 minutes
```

```text
Listening Part 3 Practice
10 questions · approximately 8 minutes of audio
```

```text
Grammar: Conditionals
12 items · focused practice · estimated 10 minutes
```

```text
Vocabulary Collocation Review
15 terms · adaptive review
```

```text
Academic Writing Full Test
2 tasks · 60 minutes
```

Do not show `Questions: 0` for Writing or Speaking.

## Navigation and entry points

All exercise entry points must create compatible requests.

Audit:

* Reading page
* Listening page
* Writing page
* Speaking page
* Grammar page
* Vocabulary page
* Mistakes page
* Mock Tests page
* Study Roadmap
* Dashboard recommendations
* AI Tutor recommendations
* Saved Content
* Books
* Browser extension
* Notifications and reminders

They must all use the same Exercise Engine contracts.

Do not maintain separate incompatible exercise flows for different pages.

## Study Roadmap integration

Study-plan tasks must contain structured exercise requirements.

```ts
interface ExerciseTaskRequirement {
  module: ExerciseModule;
  mode: ExerciseMode;
  family?: ExerciseFamily;

  targetBand?: IeltsBand;
  learningObjectiveIds: string[];

  questionTypes?: string[];
  targetItemCount?: number;
  targetDurationMinutes?: number;

  examSimulation: boolean;
}
```

The roadmap must not rely only on vague titles such as:

* Reading Practice
* Listening Practice
* Grammar Practice

The task title may remain human-readable, but the engine must receive structured requirements.

## Storage schema and versioning

Version all persisted exercise and attempt records.

Support migration for legacy data that may contain:

* Generic question arrays
* Missing modes
* Missing exercise families
* Generic difficulty strings
* Missing question IDs
* Invalid timing
* Arbitrary question counts
* Incomplete IELTS structures
* Unversioned attempts

Migration options may include:

* Convert compatible exercises
* Mark records as `legacy_practice`
* Preserve completed attempts as read-only history
* Regenerate invalid generated exercises
* Exclude invalid records from full-test workflows

Do not reinterpret incomplete exercises as valid full tests.

Migration must be:

* Idempotent
* Tested
* Observable
* Safe for existing history

## Backward compatibility

Preserve useful historical data, but do not preserve invalid architecture indefinitely.

Create an explicit compatibility boundary for legacy records.

Do not spread legacy checks throughout the new domain.

Do not keep duplicate old and new execution paths permanently.

Document the removal strategy.

## Seed data

Update seed data to cover every major exercise family.

Include:

* Full Listening test
* Listening part practice
* Listening focused drill
* Full Academic Reading test
* Reading passage practice
* Reading focused drill
* Academic Writing full test
* Writing Task 1 practice
* Writing Task 2 practice
* Full Speaking simulation
* Speaking Part 2 practice
* Grammar multiple-choice exercise
* Grammar transformation exercise
* Vocabulary recognition exercise
* Vocabulary productive exercise
* Saved-content comprehension
* Mistake-review exercise
* Adaptive exercise
* Diagnostic exercise

All seed data must pass the same validation used for runtime-generated exercises.

## Validation

Create central validators:

```ts
validateExercise(exercise)
validateExerciseBlueprint(blueprint)
validateExerciseAgainstBlueprint(exercise, blueprint)
validateAttempt(attempt, exercise)
validateResponse(question, response)
validateExerciseResult(result, exercise)
```

Add module-specific validators where necessary.

Validation must check:

* Required structure
* Correct mode
* Correct family
* Supported types
* Unique IDs
* Correct item counts
* Timing
* Scoring configuration
* Answer-key completeness
* Instruction consistency
* Content grounding
* IELTS invariants
* Writing weighting
* Speaking ordering
* Audio requirements
* Word-limit rules
* Schema version

Use typed domain errors.

Examples:

* `InvalidExerciseBlueprintError`
* `UnsupportedExerciseTypeError`
* `IncompleteExerciseError`
* `InvalidQuestionCountError`
* `DuplicateExerciseItemIdError`
* `InvalidAnswerRuleError`
* `InvalidScoringPolicyError`
* `InvalidAttemptStateTransitionError`

## Events

Publish domain events where appropriate:

* `ExerciseCreated`
* `ExerciseGenerated`
* `ExerciseStarted`
* `ExercisePaused`
* `ExerciseResumed`
* `ExerciseSubmitted`
* `ExerciseEvaluated`
* `ExerciseCompleted`
* `ExerciseAbandoned`
* `MistakeRecorded`
* `LearningProgressUpdated`

Use events to integrate progress tracking and AI Tutor recommendations without tightly coupling modules.

## Logging and observability

Add structured logging for:

* Blueprint resolution
* Exercise generation
* Validation failures
* Repair attempts
* Attempt transitions
* Scoring
* AI evaluation
* Persistence failures
* Migration
* Recommendation generation

Do not log:

* API keys
* Sensitive user content unnecessarily
* Full audio
* Private saved documents
* Large generated payloads without truncation

Include stable IDs for correlation:

* Exercise ID
* Attempt ID
* Blueprint version
* Generation request ID

## Testing requirements

Add unit, integration, contract, migration, and end-to-end tests.

### Domain tests

Test:

* Exercise discriminated unions
* Blueprint construction
* Blueprint immutability
* Validation
* Attempt transitions
* Timing policies
* Scoring strategies
* Difficulty policies

### IELTS tests

Test:

* Listening full-test structure
* Listening part structure
* Reading full-test structure
* Reading allocation
* Writing task weighting
* Speaking part order and timing
* Academic versus General Training separation

### Grammar and vocabulary tests

Test:

* Accepted variants
* Normalization
* Productive answers
* Multiple valid responses
* Vocabulary review scheduling
* Concept-level scoring

### Generation tests

Test:

* Valid AI output
* Malformed output
* Missing items
* Duplicate IDs
* Invalid question types
* Bounded repair
* Rejection after failed repair
* No persistence of invalid output

### Attempt tests

Test:

* Start
* Save response
* Pause
* Resume
* Submit
* Duplicate submission
* Automatic evaluation
* AI evaluation
* Completion
* Abandonment
* Recovery after reload

### Migration tests

Test:

* Legacy exercise migration
* Legacy attempt preservation
* Idempotency
* Incompatible record handling
* Schema-version upgrades

### End-to-end tests

Cover at least:

1. Start and complete a Reading exercise.
2. Start and complete a Listening exercise.
3. Complete a Writing task requiring AI evaluation.
4. Complete a Speaking simulation.
5. Complete a Grammar exercise.
6. Complete a Vocabulary exercise.
7. Resume an interrupted attempt.
8. Complete a Mistake Review session.
9. Start an exercise from Study Roadmap.
10. Start an exercise recommended by AI Tutor.
11. Migrate and display a legacy attempt.
12. Complete a full IELTS mock test.

## Code quality rules

Do not introduce:

* Magic numbers
* Magic strings
* One massive exercise service
* One massive exercise renderer
* Direct storage access from UI
* Direct AI-provider calls from UI
* Duplicate scoring implementations
* Duplicate attempt state
* New architecture bypasses
* Module-specific hacks inside shared components
* Silent fallbacks to invalid exercises
* Unbounded AI retries
* `any` without strong justification
* Large additions to an existing God object such as `engineBootstrap.ts`

Prefer:

* Discriminated unions
* Value objects
* Strategy pattern
* Registry pattern
* Small application use cases
* Pure domain policies
* Typed ports
* Typed errors
* Immutable snapshots
* Schema versioning
* Reusable test builders
* Dependency injection

## Documentation update is mandatory

After completing the implementation, update all relevant IELTS Journey documentation.

At minimum, document:

* Exercise Engine architecture
* Exercise domain model
* Exercise families
* Exercise modes
* Blueprint system
* Attempt lifecycle
* Timing policies
* Difficulty model
* Scoring strategies
* AI generation flow
* AI repair flow
* Learning Engine integration
* AI Tutor Engine integration
* Renderer registry
* Storage schema
* Migration strategy
* Legacy compatibility boundary
* Study Roadmap integration
* Module-specific rules
* Test coverage

Review and update this file when affected:

```text
docs/refactoring/IELTS_JOURNEY_REFACTOR_PLAN.md
```

Update:

* Root README
* Package READMEs
* Architecture diagrams
* Domain examples
* AI prompt documentation
* Storage documentation
* Testing documentation
* Migration documentation

Remove or correct documentation that describes obsolete runtime behaviour.

Documentation must reflect the actual final implementation, not only the intended design.

## Required implementation workflow

Follow this order:

1. Read existing architecture rules and documentation.
2. Trace every current exercise entry point and runtime flow.
3. Inventory all existing exercise types.
4. Identify duplicated and incompatible models.
5. Define the target Exercise Engine architecture.
6. Create the central domain model.
7. Create blueprint types and builders.
8. Create validators and typed errors.
9. Implement attempt lifecycle.
10. Implement scoring strategies.
11. Implement timing policies.
12. Implement difficulty policies.
13. Update AI generation contracts.
14. Implement bounded generation repair.
15. Refactor Learning Engine integration.
16. Refactor AI Tutor Engine integration.
17. Refactor repositories and adapters.
18. Implement renderer registry.
19. Update all exercise entry points.
20. Update Study Roadmap integration.
21. Add schema migration.
22. Update seed data.
23. Add tests.
24. Run all relevant checks.
25. Update documentation.
26. Compare code, tests, and documentation for consistency.
27. Produce a final implementation report.

Do not stop after producing an analysis or plan.

Implement the refactor.

## Definition of done

The task is complete only when:

1. All exercise modules use the shared Exercise Engine lifecycle.
2. Every exercise has an explicit module, mode, family, blueprint version, and schema version.
3. Full IELTS tests satisfy official structural rules.
4. Focused exercises are never presented as full tests.
5. Writing and Speaking are no longer forced into ordinary question-array models.
6. Grammar and Vocabulary use appropriate typed exercise models.
7. Saved Content and Mistake Review use the same core lifecycle.
8. AI generation is blueprint-driven.
9. Invalid generated exercises are rejected.
10. AI repair is bounded and observable.
11. Attempts use immutable exercise snapshots.
12. Timing reflects the real exercise workload.
13. Scoring uses module-specific strategies.
14. Partial practice does not produce misleading authoritative band scores.
15. Learning Engine owns the exercise lifecycle.
16. AI Tutor Engine uses approved ports and validated context.
17. UI components do not access storage or AI providers directly.
18. Legacy data has a tested migration path.
19. All major entry points use the new engine.
20. Relevant tests pass.
21. Documentation matches the final runtime behaviour.

## Final response requirements

Provide a final implementation report with these sections:

### Architecture implemented

Explain the final Exercise Engine design.

### Exercise types supported

List all supported modules, modes, families, and question types.

### Files changed

Group modified files by:

* Domain
* Learning Engine
* AI Tutor Engine
* Application
* Infrastructure
* Storage
* UI
* Study Roadmap
* Seed data
* Tests
* Documentation

### Migration

Explain how legacy exercises and attempts are handled.

### Verification

List every command actually executed and its result:

* Type checking
* Linting
* Unit tests
* Integration tests
* Migration tests
* End-to-end tests
* Build
* Architecture checks

### Documentation updated

List every documentation file modified and summarize its changes.

### Remaining limitations

State unresolved limitations honestly.

Do not claim success for any command that was not executed successfully.
