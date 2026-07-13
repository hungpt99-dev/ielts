The current codebase has multiple proactive engines, duplicated tutor types, and separate storage/context implementations. The prompt below consolidates them into one authoritative AI Tutor Engine without turning it into one giant class. 

````text
Redesign, refactor, and fully implement the IELTS Journey AI Tutor Engine as the single authoritative intelligence layer for every feature related to AI tutoring.

The AI Tutor must behave like a real personal IELTS teacher, not only a chatbot.

It must:

- Understand the learner’s profile
- Understand the learner’s current IELTS level
- Understand the learner’s target score
- Understand the exam date
- Understand the study roadmap
- Understand current and historical progress
- Understand weak and strong skills
- Understand mistakes and recurring patterns
- Understand saved vocabulary and saved content
- Understand recent learning activity
- Remember relevant previous interactions
- Know what the learner should study next
- Proactively help without waiting for the user to open chat
- Explain why a recommendation is useful
- Adapt its behavior when the learner progresses, misses tasks, or changes goals
- Work consistently across the web application and browser extension
- Continue providing useful deterministic tutoring when AI is unavailable

This task is not only a UI update.

Refactor the complete AI Tutor architecture, domain models, context system, memory system, proactive behavior, chat orchestration, skill tutors, progress review, reminders, suggestions, persistence contracts, event system, AI integration, web integration, extension integration, migration, and tests.

Use the existing project stack, monorepo structure, TypeScript, React, IndexedDB/Dexie, local-first architecture, existing AI provider abstraction, and current design system.

Do not create a new backend.

Do not use hardcoded user data.

Do not replace working features with mock implementations.

Do not preserve duplicate engines or duplicate domain models only for convenience.

Do not implement one giant class called `AITutorEngine`.

Build one cohesive engine composed of focused modules with clear responsibilities.

# 1. Product vision

The AI Tutor should feel like a real teacher who continuously understands the learner.

It should be able to say things such as:

- “Writing is still your weakest skill, so today’s plan focuses on Task 2 structure.”
- “You missed two study sessions this week. I adjusted today’s recommendation to a shorter 20-minute task.”
- “You frequently make article and verb-tense mistakes. Let’s review those before your next writing exercise.”
- “Your exam is in 18 days. It is time to increase timed practice and reduce new material.”
- “You saved 12 environment-related vocabulary items. Let’s use them in a Speaking Part 2 exercise.”
- “You have completed your roadmap task for today. Your next best activity is reviewing yesterday’s mistakes.”
- “You have been inactive for four days. I prepared a light restart activity instead of a difficult mock test.”
- “Your Reading performance is stable, but Writing remains below target. I recommend moving more study time to Writing.”

The AI Tutor must not be limited to reactive chat.

It must support:

- Reactive conversation
- Proactive recommendations
- Context-aware teaching
- Skill-specific tutoring
- Progress reviews
- Study reminders
- Roadmap assistance
- Mistake analysis
- Vocabulary coaching
- Saved-content learning
- Daily and weekly guidance
- Exam countdown support
- Motivation based on real progress
- Learning-memory continuity

# 2. Single source of truth

The `@ielts/ai-tutor` package must become the single source of truth for all reusable AI Tutor domain logic and contracts.

All AI Tutor-related features in:

- `apps/web`
- `apps/extension`
- Future IELTS Journey clients

must use the shared AI Tutor Engine contracts and application APIs.

The following concepts must not have duplicate definitions across applications:

- Tutor message
- Chat message
- Chat session
- Learner context
- Learner profile
- Tutor memory
- Tutor preferences
- Proactive message
- Proactive trigger
- Proactive action
- Proactive category
- Proactive settings
- Reminder
- Context suggestion
- Progress review
- Exercise result
- Writing feedback
- Speaking feedback
- Learning event
- Tutor decision
- Tutor mode
- Skill type
- Task recommendation
- Tutor notification
- AI Tutor error
- AI Tutor result

Remove or migrate duplicate local definitions after compatibility is verified.

All application consumers must import authoritative contracts from `@ielts/ai-tutor`.

Do not force persistence records, UI view models, domain entities, and AI DTOs to use one identical shape.

Use explicit layers:

```text
Persistence record
    ↓ mapper
Domain entity
    ↓ presenter
UI view model
````

The domain model is authoritative, while infrastructure and presentation models may contain platform-specific fields.

# 3. Scope of the AI Tutor Engine

The AI Tutor Engine must own the reusable business behavior for:

* Chat orchestration
* Context collection contracts
* Context normalization
* Context relevance selection
* Learner-state analysis
* Tutor memory
* Tutor decision-making
* Proactive triggers
* Proactive-message generation
* Context suggestions
* Daily recommendations
* Weekly recommendations
* Progress reviews
* Skill-priority analysis
* Mistake-pattern detection
* Learning-streak analysis
* Inactivity detection
* Exam-countdown guidance
* Roadmap guidance
* Missed-task support
* Due-review support
* Vocabulary review recommendations
* Saved-content recommendations
* Study-session recommendations
* Reminder decisions
* Cooldowns
* Quiet hours
* Duplicate suppression
* Message prioritization
* AI request orchestration
* AI response validation
* Offline fallback
* Tutor personalization
* User-facing explanations

The engine must not own platform-specific UI and infrastructure details such as:

* React page rendering
* Browser notification APIs
* Chrome notification APIs
* Web routing
* Extension routing
* Dexie implementation details
* Chrome storage implementation details
* Toast rendering
* Modal state
* CSS
* Platform-specific navigation

The engine should define ports and contracts for these concerns, while applications provide adapters.

# 4. Target architecture

Use a modular architecture inside the shared package.

Suggested structure:

```text
packages/ai-tutor/src/
  domain/
    entities/
      tutor-message.ts
      chat-session.ts
      learner-profile.ts
      learner-context.ts
      tutor-memory.ts
      proactive-message.ts
      tutor-recommendation.ts
      progress-review.ts

    value-objects/
      local-date.ts
      band-score.ts
      study-duration.ts
      confidence-score.ts

    events/
      learning-event.ts
      tutor-event.ts

    policies/
      proactive-trigger-policy.ts
      cooldown-policy.ts
      quiet-hours-policy.ts
      duplicate-message-policy.ts
      recommendation-priority-policy.ts
      context-relevance-policy.ts
      memory-retention-policy.ts

    services/
      learner-state-analyzer.ts
      skill-priority-analyzer.ts
      mistake-pattern-analyzer.ts
      progress-analyzer.ts

    errors/
    results/
    schemas/

  application/
    chat/
      send-tutor-message.ts
      continue-tutor-session.ts
      summarize-chat-session.ts

    proactive/
      evaluate-proactive-opportunity.ts
      generate-proactive-messages.ts
      dismiss-proactive-message.ts

    recommendations/
      get-next-best-action.ts
      get-daily-recommendation.ts
      get-weekly-recommendation.ts
      generate-context-suggestions.ts

    progress/
      generate-progress-review.ts
      explain-learning-progress.ts

    memory/
      update-tutor-memory.ts
      retrieve-relevant-memory.ts
      compact-tutor-memory.ts

    reminders/
      evaluate-reminders.ts
      schedule-tutor-reminder.ts

    roadmap/
      explain-roadmap-task.ts
      recommend-roadmap-adjustment.ts
      analyze-missed-task.ts

  context/
    learner-context-builder.ts
    context-source-registry.ts
    context-selector.ts
    context-summarizer.ts
    context-budget-manager.ts
    context-freshness-evaluator.ts

  memory/
    tutor-memory-manager.ts
    memory-extractor.ts
    memory-retriever.ts
    memory-deduplicator.ts
    memory-compactor.ts

  proactive/
    trigger-registry.ts
    message-generator-registry.ts
    proactive-tutor-orchestrator.ts

  ai/
    tutor-ai-client.ts
    tutor-prompt-builder.ts
    structured-output-parser.ts
    response-repairer.ts
    token-budget-manager.ts
    fallback-policy.ts

  skill-modules/
    writing/
    speaking/
    reading/
    listening/
    vocabulary/
    grammar/

  ports/
    learner-profile-repository.ts
    learner-progress-repository.ts
    tutor-message-repository.ts
    tutor-memory-repository.ts
    tutor-settings-repository.ts
    roadmap-repository.ts
    mistake-repository.ts
    vocabulary-repository.ts
    saved-content-repository.ts
    reminder-repository.ts
    tutor-event-publisher.ts
    notification-port.ts
    clock-port.ts

  presentation/
    components/
    hooks/

  index.ts
```

These names are suggestions.

Follow the existing repository conventions when equivalent boundaries already exist.

# 5. Central engine facade

Expose one stable public facade for applications.

Example:

```ts
interface AITutorEngine {
  initialize(): Promise<AITutorInitializationResult>;

  chat(
    request: TutorChatRequest,
    options?: TutorRequestOptions,
  ): Promise<TutorChatResult>;

  getNextBestAction(
    request: NextBestActionRequest,
  ): Promise<NextBestActionResult>;

  evaluateProactiveSupport(
    request: ProactiveEvaluationRequest,
  ): Promise<ProactiveEvaluationResult>;

  generateProgressReview(
    request: ProgressReviewRequest,
  ): Promise<ProgressReviewResult>;

  generateContextSuggestions(
    request: ContextSuggestionRequest,
  ): Promise<ContextSuggestionResult>;

  handleLearningEvent(
    event: LearningEvent,
  ): Promise<HandleLearningEventResult>;

  updateMemory(
    request: UpdateTutorMemoryRequest,
  ): Promise<UpdateTutorMemoryResult>;

  getTutorState(): Promise<TutorStateSnapshot>;
}
```

The facade coordinates focused use cases.

It must not contain all logic directly.

Do not expose every internal generator or helper from the package root.

Keep the public API small, stable, documented, and versionable.

# 6. Learner context system

Create a unified `LearnerContextBuilder`.

Every AI Tutor feature must use the same normalized learner-context pipeline.

The context system should collect data from registered context sources.

Supported context sources should include:

## User profile

* Current overall IELTS band
* Current Listening band
* Current Reading band
* Current Writing band
* Current Speaking band
* Target overall band
* Target skill bands
* IELTS test type
* Exam date
* Timezone
* Preferred language
* Study intensity
* Learning preferences
* Preferred task types
* Preferred study times

## Study roadmap

* Active roadmap
* Current phase
* Current week
* Today’s tasks
* Next tasks
* Completed tasks
* Missed tasks
* Rescheduled tasks
* Weekly objectives
* Phase objectives
* Study-time capacity
* Exam countdown
* Roadmap feasibility
* Recent plan changes

## Progress

* Overall completion
* Skill-level progress
* Weekly completion
* Planned versus actual study time
* Exercise accuracy
* Mock-test results
* Writing scores
* Speaking scores
* Reading performance
* Listening performance
* Progress trend
* Consistency
* Learning streak
* Inactivity duration

## Mistakes

* Recent mistakes
* Recurring mistake patterns
* Mistakes by skill
* Mistakes by category
* Mistake frequency
* Mistakes not yet reviewed
* Mistakes that reappeared after review
* Writing grammar patterns
* Speaking pronunciation or fluency weaknesses
* Reading question-type weaknesses
* Listening question-type weaknesses

## Vocabulary

* Saved words
* Due vocabulary
* Mastered words
* Difficult words
* Vocabulary grouped by topic
* Vocabulary recently encountered
* Vocabulary used incorrectly
* Vocabulary not reviewed recently

## Saved content

* Saved articles
* Saved text
* Notes
* YouTube transcripts
* Selected passages
* Recently viewed learning content
* Content topics
* Content difficulty
* Content that has already produced exercises

## Tutor history

* Recent tutor conversations
* Current chat topic
* Open questions
* Previous recommendations
* Recommendations accepted
* Recommendations ignored
* Recent explanations
* Tutor mode
* Active learning objective

## Environment and timing

* Current local date and time
* Day of week
* User quiet hours
* Available study time today
* Time until next scheduled task
* Exam countdown
* Whether the user is online
* Whether AI is available
* Whether the user is in offline mode
* Current page or application location
* Current selected content when relevant

# 7. Context scopes

Do not send the complete learner context to every operation.

Support context scopes.

```ts
type TutorContextScope =
  | "chat"
  | "proactive"
  | "progress-review"
  | "roadmap"
  | "writing"
  | "speaking"
  | "reading"
  | "listening"
  | "vocabulary"
  | "saved-content"
  | "reminder";
```

Each scope defines:

* Required context
* Optional context
* Maximum record counts
* Freshness requirements
* Token budget
* Allowed sensitive fields
* Summarization rules

Examples:

* A vocabulary explanation should not receive the full roadmap history.
* A progress review may require several weeks of summarized progress.
* A proactive inactivity message does not need full chat transcripts.
* A writing review needs the writing response, rubric, relevant mistake history, and target band.
* A roadmap question needs the current phase, tasks, availability, and exam date.

# 8. Context relevance and freshness

Every context item must contain metadata.

```ts
type TutorContextItem<T> = {
  source: TutorContextSource;
  data: T;
  collectedAt: string;
  relevantFrom?: string;
  expiresAt?: string;
  priority: "low" | "normal" | "high" | "critical";
  confidence: number;
};
```

Implement:

* Freshness evaluation
* Relevance scoring
* Deduplication
* Conflict resolution
* Context limits
* Missing-data handling
* Stale-context warnings

When profile and recent test evidence conflict, preserve both and mark the conflict.

Do not silently assume old data is current.

# 9. Learner state snapshot

Create a normalized snapshot that represents what the tutor currently knows.

```ts
type LearnerStateSnapshot = {
  generatedAt: string;
  profile: NormalizedLearnerProfile;
  exam: ExamContext;
  roadmap?: RoadmapContext;
  progress: ProgressContext;
  skillStates: Record<IELTSSection, SkillState>;
  mistakeSummary: MistakeSummary;
  vocabularySummary: VocabularySummary;
  activitySummary: ActivitySummary;
  preferences: TutorPreferences;
  recentTutorHistory: TutorHistorySummary;
  currentConstraints: LearnerConstraint[];
  contextQuality: ContextQuality;
};
```

Example skill state:

```ts
type SkillState = {
  skill: IELTSSection;
  currentBand?: number;
  targetBand?: number;
  gap?: number;
  recentPerformance?: number;
  trend: "improving" | "stable" | "declining" | "unknown";
  confidence: number;
  priorityScore: number;
  frequentWeaknesses: string[];
  recentStrengths: string[];
  lastPracticedAt?: string;
};
```

This snapshot should be reused across chat, recommendations, proactive messages, and progress reviews when inputs have not changed.

# 10. Context quality

The tutor must know when context is incomplete.

```ts
type ContextQuality = {
  status: "complete" | "partial" | "insufficient" | "stale";
  missingSources: TutorContextSource[];
  staleSources: TutorContextSource[];
  warnings: string[];
};
```

When important context is missing:

* Ask a targeted question
* Recommend completing the profile
* Provide a limited recommendation
* Clearly state what information was unavailable

Do not invent user scores, progress, availability, or exam dates.

# 11. Tutor memory

Create one authoritative Tutor Memory system.

Tutor memory is not the same as raw chat history.

Separate:

## Conversation history

Stores actual messages and sessions.

## Working memory

Stores temporary context for the current session or teaching activity.

## Long-term learning memory

Stores durable learning information such as:

* Persistent weaknesses
* Repeated mistake patterns
* Stable learning preferences
* Ongoing goals
* Tutor commitments
* Useful prior explanations
* Topics the learner has practiced
* Recommendations already given
* Techniques that worked well
* Techniques that the learner disliked

Example:

```ts
type TutorMemory = {
  learnerId: string;
  goals: TutorGoalMemory[];
  preferences: TutorPreferenceMemory[];
  weakPoints: TutorWeakPointMemory[];
  mistakePatterns: TutorMistakeMemory[];
  successfulStrategies: TutorStrategyMemory[];
  openLearningLoops: TutorOpenLoopMemory[];
  recommendationHistory: TutorRecommendationMemory[];
  updatedAt: string;
  version: number;
};
```

Memory requirements:

* Do not store every chat sentence as long-term memory.
* Extract only durable and useful learning information.
* Deduplicate repeated memory.
* Track source and confidence.
* Track when memory was last confirmed.
* Allow stale memory to expire.
* Allow user correction.
* Preserve privacy.
* Avoid storing irrelevant personal information.
* Provide a clear method to clear tutor memory.
* Keep raw chat and long-term memory in separate repositories.

# 12. Proactive Tutor behavior

The tutor must proactively support the learner without becoming annoying.

Proactive behavior should be based on real events and learner context.

Supported proactive trigger categories should include:

## Study planning

* Daily plan is ready
* Today’s roadmap task is available
* User has no task but has available study time
* Plan changed
* Study availability changed
* Task was rescheduled
* Roadmap is high risk
* Exam date is approaching

## Progress

* New progress milestone
* Skill improvement detected
* Skill decline detected
* Weekly goal completed
* Weekly goal at risk
* Learning streak achieved
* Streak at risk
* Consistency improvement
* Progress plateau

## Missed activity

* Missed scheduled task
* Multiple missed tasks
* Long inactivity
* Unfinished exercise
* Abandoned tutor session
* Due review not completed

## Weaknesses and mistakes

* Recurring mistake pattern detected
* Same mistake repeated
* Weak skill needs attention
* Writing issue detected
* Speaking issue detected
* Reading question-type issue detected
* Listening issue detected

## Vocabulary and content

* Vocabulary review is due
* Saved content has not been used
* Relevant saved vocabulary can support today’s task
* New saved article can become an exercise
* YouTube transcript can support listening practice

## Exam preparation

* Exam countdown milestone
* Time to begin timed practice
* Time to begin mock tests
* Final-week mode started
* Final-day preparation
* Exam logistics reminder

## Motivation

* User completed a difficult task
* User returned after inactivity
* User improved a weak skill
* User is overloaded
* User may need a lighter task
* User has completed all tasks for today

# 13. Proactive decision pipeline

Use one proactive pipeline.

```text
Learning event or scheduled evaluation
    ↓
Build relevant learner context
    ↓
Evaluate trigger policies
    ↓
Generate candidate interventions
    ↓
Calculate usefulness and urgency
    ↓
Apply user settings
    ↓
Apply quiet hours
    ↓
Apply cooldowns
    ↓
Apply duplicate suppression
    ↓
Apply daily message limits
    ↓
Select best intervention
    ↓
Persist decision
    ↓
Publish tutor event
    ↓
Platform adapter displays it
```

Do not maintain separate web and extension decision logic.

The shared engine decides whether and what to communicate.

The platform decides how to display it.

# 14. Proactive intervention scoring

Each candidate intervention should have a score.

Example factors:

```ts
interventionScore =
  urgencyScore +
  learningValueScore +
  relevanceScore +
  timingScore +
  personalizationScore -
  repetitionPenalty -
  interruptionPenalty -
  recentMessagePenalty;
```

Use configurable weights.

Candidates should include:

```ts
type ProactiveInterventionCandidate = {
  triggerType: ProactiveTriggerType;
  category: ProactiveCategory;
  title: string;
  message: string;
  reason: string;
  suggestedAction?: TutorAction;
  urgency: number;
  learningValue: number;
  relevance: number;
  expiresAt?: string;
  deduplicationKey: string;
};
```

Only show an intervention when its final score meets the configured threshold.

# 15. Proactive settings and user control

Support settings such as:

* Proactive tutor enabled
* Browser notifications enabled
* Extension notifications enabled
* Quiet hours
* Maximum proactive messages per day
* Minimum time between messages
* Allowed message categories
* Exam reminder preferences
* Inactivity reminder preferences
* Vocabulary reminder preferences
* Roadmap reminder preferences
* Motivation message preferences
* AI-enhanced proactive messages enabled
* Preferred tutor tone
* Preferred message length

User settings must be authoritative.

Do not bypass quiet hours for normal messages.

Only clearly defined critical exam-related reminders may have special handling, and this must be configurable.

# 16. Smart next-best-action engine

Create `getNextBestAction()` as a central AI Tutor capability.

It should consider:

* Current date and time
* Today’s roadmap tasks
* Available study minutes
* Current phase
* Current week
* Weakest skills
* Due vocabulary
* Unreviewed mistakes
* Recently missed tasks
* Learning streak
* Exam countdown
* Recently completed tasks
* User preferences
* Current energy or requested difficulty when available

Possible results:

```ts
type NextBestAction =
  | StudyRoadmapTaskAction
  | ReviewMistakesAction
  | ReviewVocabularyAction
  | ContinueExerciseAction
  | PracticeSkillAction
  | TakeMockSectionAction
  | ReadSavedContentAction
  | RestAction
  | CompleteProfileAction;
```

Return:

* Recommended action
* Estimated duration
* Skill
* Priority
* Reason
* Related data IDs
* Alternative actions
* Whether AI was used

The engine must be capable of selecting the next action deterministically.

AI may improve the explanation or exercise content but must not be required to choose a valid action.

# 17. Chat architecture

All AI Tutor chat interfaces must use the shared chat use case.

This includes:

* Floating Chat Popup
* AI Tutor page
* Extension Mini Tutor
* Roadmap “Ask AI Tutor”
* Vocabulary “Ask AI Tutor”
* Saved-content tutor
* Skill-specific tutor conversations

Every chat request must include:

```ts
type TutorChatRequest = {
  sessionId?: string;
  message: string;
  mode: TutorMode;
  contextScope: TutorContextScope;
  source: TutorInteractionSource;
  sourceEntityIds?: string[];
  pageContext?: TutorPageContext;
};
```

The chat orchestrator should:

1. Validate the request.
2. Load the active session.
3. Build relevant learner context.
4. Retrieve relevant memory.
5. Determine the teaching intent.
6. Select the correct tutor strategy.
7. Build the AI request.
8. Validate structured output.
9. Fall back safely when AI fails.
10. Save messages.
11. Update tutor memory when appropriate.
12. Publish learning and tutor events.
13. Return suggested follow-up actions.

# 18. Tutor modes

Support explicit tutor modes.

```ts
type TutorMode =
  | "general-teacher"
  | "study-coach"
  | "roadmap-guide"
  | "writing-tutor"
  | "speaking-partner"
  | "reading-tutor"
  | "listening-tutor"
  | "vocabulary-coach"
  | "grammar-tutor"
  | "mistake-review"
  | "progress-review"
  | "exam-preparation";
```

The engine selects a default mode based on context, but the user may select a mode manually.

A mode must define:

* Teaching objective
* Context requirements
* Prompt strategy
* Supported actions
* Output schema
* Memory behavior
* Allowed tools
* Error fallback

# 19. Skill-specific tutor modules

Writing, Speaking, Reading, Listening, Vocabulary, Grammar, and Teaching Mode must remain distinct learning experiences, but their reusable intelligence should be part of the AI Tutor Engine.

## Writing Tutor

The engine should support:

* Task 1 and Task 2
* Academic and General Training
* Band estimation
* Rubric-based feedback
* Task response
* Coherence and cohesion
* Lexical resource
* Grammar range and accuracy
* Error extraction
* Improvement plan
* Rewrite examples
* Idea development
* Structure guidance
* Progress comparison
* Saving mistakes to learner memory
* Updating Writing skill state

## Speaking Partner

The engine should support:

* Speaking Parts 1, 2, and 3
* Topic selection
* Follow-up questions
* Fluency feedback
* Vocabulary feedback
* Grammar feedback
* Pronunciation-related feedback when input data supports it
* Estimated band
* Repeated weakness detection
* Conversation continuity
* Speaking-topic memory
* Progress tracking

## Reading Tutor

The engine should support:

* Passage explanation
* Question-type strategy
* Answer explanation
* Error categorization
* Timing analysis
* Vocabulary extraction
* Repeated question-type weakness detection
* Progress updates

## Listening Tutor

The engine should support:

* Transcript-based exercises
* Timestamp-linked explanations
* Question generation
* Listening mistake analysis
* Distractor explanation
* Vocabulary extraction
* Repeated listening weakness detection
* Progress updates

## Vocabulary Coach

The engine should support:

* Meaning
* Pronunciation
* Part of speech
* Lemma
* Word family
* Collocations
* CEFR level
* IELTS usage
* Contextual examples
* Topic grouping
* Spaced review
* Personalized exercises
* Use of saved words in Writing and Speaking tasks

## Grammar Tutor

The engine should support:

* Error explanation
* Error categorization
* Corrected examples
* Personalized exercises
* Repeated pattern detection
* Integration with Writing and Speaking feedback

UI components may remain application-specific, but they must call shared engine use cases instead of implementing separate AI behavior.

# 20. Teaching strategy

The tutor should not answer every message in the same style.

Create teaching strategies such as:

* Explain
* Ask guiding questions
* Give an example
* Provide a short exercise
* Review an answer
* Compare current and previous performance
* Recommend a task
* Encourage reflection
* Correct a misconception
* Simplify an explanation
* Challenge the learner
* Suggest rest or lighter work

The engine should choose a strategy based on:

* User request
* Tutor mode
* Current level
* Recent performance
* Learning objective
* User preference
* Available time
* Previous unsuccessful explanations

# 21. Tutor response contract

AI responses must use structured schemas.

Example:

```ts
type TutorResponse = {
  message: string;
  teachingStrategy: TutorTeachingStrategy;
  contextUsed: TutorContextReference[];
  recommendations: TutorRecommendation[];
  suggestedActions: TutorAction[];
  memoryCandidates: TutorMemoryCandidate[];
  learningEvents: LearningEvent[];
  safetyWarnings?: string[];
};
```

Do not require the model to expose hidden reasoning.

`contextUsed` should contain concise references such as:

* Current roadmap task
* Writing progress trend
* Recent vocabulary
* Repeated grammar mistake

It must not expose raw private context unnecessarily.

# 22. AI usage strategy

Use AI only for tasks that genuinely benefit from generative intelligence.

Use deterministic logic for:

* Date calculations
* Progress calculations
* Availability calculations
* Cooldowns
* Quiet hours
* Trigger selection
* Message limits
* Exam countdown
* Task completion
* Skill priority formulas
* Context freshness
* Duplicate suppression
* Storage
* Routing
* Permissions
* Basic next-action selection

Use AI for:

* Natural personalized explanations
* Contextual teaching
* Exercise generation
* Writing feedback
* Speaking feedback
* Progress-review summaries
* Personalized proactive-message wording
* Complex mistake interpretation
* Context-aware coaching

Do not call AI once per context item.

Do not call AI separately for every proactive trigger.

Do not call AI merely to calculate values that are already available deterministically.

# 23. AI call orchestration

For one tutor operation, use the minimum practical number of calls.

Typical chat flow:

* One primary AI call
* At most one structured repair call when output is invalid

Typical progress review:

* One context summary step performed locally
* One AI review call
* At most one repair call

Typical proactive evaluation:

* Deterministic trigger evaluation
* Zero AI calls when template wording is sufficient
* One batched AI call only for selected high-value candidates when AI enhancement is enabled

Typical skill review:

* One AI call with bounded relevant context
* Optional secondary call only for a clearly separate task such as exercise generation

Requirements:

* Configurable timeout
* Abort support
* Bounded retry
* Token limits
* Structured-output validation
* Provider abstraction
* Cache support
* Partial fallback
* Usage tracking
* No infinite loops
* No AI call per task or message candidate

# 24. Prompt construction

Create dedicated prompt builders.

Do not build prompts inside React components or general service classes.

Prompt builders should receive normalized context.

Example:

```ts
interface TutorPromptBuilder<TRequest> {
  build(request: TRequest): TutorPrompt;
}
```

Separate prompt builders for:

* General tutor chat
* Writing review
* Speaking feedback
* Reading explanation
* Listening explanation
* Vocabulary coaching
* Progress review
* Proactive-message enhancement
* Roadmap explanation
* Mistake analysis

Prompts must include:

* Tutor role
* Current learner level
* Target level
* Relevant context
* Teaching objective
* Output schema
* Tone preference
* Constraints
* Prohibited behavior

Prompts must prohibit:

* Guaranteed IELTS score claims
* Invented user information
* Unsupported conclusions
* Fake progress values
* Unrequested long lectures
* Revealing internal chain-of-thought
* Ignoring the learner’s available time
* Conflicting with deterministic roadmap data

# 25. AI provider abstraction

All AI access must use a shared provider-neutral port.

```ts
interface TutorAIClient {
  generateStructured<TSchema>(
    request: TutorAIRequest<TSchema>,
    options?: TutorAIRequestOptions,
  ): Promise<TutorAIResult<TSchema>>;
}
```

The engine must not depend directly on:

* OpenAI response types
* Qwen response types
* BytePlus response types
* DeepSeek response types
* Provider-specific streaming formats

Use provider adapters.

Support:

* AI unavailable
* Missing API key
* Quota exceeded
* Timeout
* Invalid response
* Partial stream failure
* User cancellation
* Offline mode

# 26. Offline behavior

The AI Tutor must remain useful without an AI provider.

Offline capabilities should include:

* Context-aware next action
* Proactive reminders
* Study streak messages
* Exam countdown
* Roadmap task recommendations
* Due-review recommendations
* Vocabulary review selection
* Mistake reminders
* Built-in teaching tips
* Built-in IELTS strategies
* Built-in exercise templates
* Progress statistics
* Deterministic progress summaries
* Template-based proactive messages

Display a clear state such as:

```text
Your tutor is using IELTS Journey’s built-in learning engine.
Connect an AI provider for more personalized explanations and generated exercises.
```

Do not present offline template output as AI-generated.

# 27. Progress understanding

Create a shared Progress Analyzer.

It should calculate:

* Overall roadmap progress
* Weekly progress
* Phase progress
* Skill progress
* Completion consistency
* Planned versus actual study time
* Accuracy trends
* Writing score trends
* Speaking score trends
* Mock-test trends
* Vocabulary retention
* Mistake recurrence
* Streak
* Inactivity
* Workload balance
* Target risk

Use real activity data.

Do not hardcode progress values.

Example:

```ts
type LearnerProgressAnalysis = {
  overallTrend: ProgressTrend;
  skillTrends: Record<IELTSSection, SkillProgressTrend>;
  strengths: ProgressInsight[];
  weaknesses: ProgressInsight[];
  risks: ProgressRisk[];
  milestones: ProgressMilestone[];
  recommendedPriorities: TutorPriority[];
  confidence: number;
};
```

# 28. Teacher Progress Review

Progress Review must use the same context and analysis system as the rest of the tutor.

It should include:

* Summary of recent progress
* What improved
* What remains weak
* Repeated mistakes
* Study consistency
* Roadmap completion
* Planned versus actual study time
* Skill priority changes
* Recommended focus
* Realistic next actions
* Exam risk when applicable

The review should reference evidence.

Example:

```text
Writing remains your highest priority because you completed only
one of three Writing tasks and repeated article errors in two exercises.
```

Do not produce generic motivational text disconnected from data.

Cache progress reviews using a hash of relevant progress inputs.

Regenerate only when meaningful evidence changes or the user requests it.

# 29. Roadmap integration

The AI Tutor must deeply understand the Study Plan Engine.

Integrate through clear contracts.

The tutor should know:

* Active roadmap
* Selected phase
* Selected week
* Today’s task
* Next task
* Task objectives
* Task reason
* Available study time
* Missed tasks
* Rescheduled tasks
* Roadmap warnings
* Feasibility
* Exam date

Roadmap-related actions should include:

* Explain this task
* Help me start
* Simplify this task
* Generate practice material
* Review my answer
* Reschedule recommendation
* Explain this week
* Review weekly progress
* Recommend next action
* Explain why this skill is prioritized

The AI Tutor must not directly mutate the roadmap.

It should return a structured recommendation or command request.

The Study Plan application use case must validate and apply any change.

# 30. Learning event system

Create one shared learning-event contract.

Example events:

```ts
type LearningEvent =
  | TaskStartedEvent
  | TaskCompletedEvent
  | TaskMissedEvent
  | TaskRescheduledEvent
  | ExerciseCompletedEvent
  | WritingReviewedEvent
  | SpeakingSessionCompletedEvent
  | MistakeRecordedEvent
  | VocabularySavedEvent
  | VocabularyReviewedEvent
  | ContentSavedEvent
  | RoadmapGeneratedEvent
  | RoadmapUpdatedEvent
  | ProgressMilestoneEvent
  | TutorMessageSentEvent
  | TutorRecommendationAcceptedEvent
  | TutorRecommendationDismissedEvent
  | UserReturnedEvent;
```

Every event should include:

```ts
type LearningEventBase = {
  id: string;
  type: string;
  occurredAt: string;
  source: LearningEventSource;
  entityId?: string;
  correlationId?: string;
  schemaVersion: string;
};
```

The engine uses events to:

* Update memory
* Update progress evidence
* Evaluate proactive support
* Invalidate context caches
* Create recommendations
* Track recommendation effectiveness

# 31. Event processing

Event handling must be:

* Idempotent
* Ordered where required
* Safe against duplicates
* Bounded
* Testable
* Cancel-safe
* Versioned

Do not let React components directly coordinate multiple AI Tutor services after a learning event.

Components publish an event or call an application use case.

The engine performs the required coordination.

# 32. Recommendation effectiveness

Track whether recommendations were useful.

Possible outcomes:

* Shown
* Opened
* Accepted
* Started
* Completed
* Dismissed
* Ignored
* Expired

Use these outcomes to improve deterministic recommendation ranking.

Do not use hidden manipulative behavior.

Allow the user to disable categories they find unhelpful.

# 33. Persistence ports

Define shared repository contracts.

Example:

```ts
interface TutorMessageRepository {
  findSession(sessionId: string): Promise<ChatSession | null>;
  saveSession(session: ChatSession): Promise<void>;
  appendMessages(
    sessionId: string,
    messages: ChatMessage[],
  ): Promise<void>;
}

interface TutorMemoryRepository {
  get(learnerId: string): Promise<TutorMemory | null>;
  save(memory: TutorMemory): Promise<void>;
}

interface ProactiveMessageRepository {
  findActive(): Promise<ProactiveMessage[]>;
  save(messages: ProactiveMessage[]): Promise<void>;
  updateStatus(
    id: string,
    status: ProactiveMessageStatus,
  ): Promise<void>;
}

interface LearnerContextRepository {
  getProfile(): Promise<LearnerProfile | null>;
  getProgress(): Promise<LearnerProgressData>;
}
```

Provide app-specific adapters:

```text
WebDexieTutorMessageRepository
WebDexieTutorMemoryRepository
ExtensionStorageTutorMessageRepository
ExtensionStorageTutorMemoryRepository
InMemoryTutorRepository for tests
```

Do not place direct Dexie calls inside domain or application modules.

# 34. Web integration

Refactor the web application so its AI Tutor features are thin consumers of the shared engine.

The web app should keep:

* Page components
* Skill-tutor UI
* Dashboard cards
* Navigation
* Browser notifications
* Dexie adapters
* Web-specific analytics
* Web-specific route context
* Web-specific audio and media integration

The web app should remove or migrate:

* Duplicate tutor domain types
* Duplicate proactive-message generators
* Duplicate context-suggestion logic
* Duplicate cooldown logic
* Duplicate AI request orchestration
* Duplicate chat memory implementation
* Duplicate progress-review logic
* Local business rules already owned by the engine

Replace the current large web proactive engine with a thin platform adapter or bootstrap module.

# 35. Extension integration

The extension must consume the same engine contracts and reusable behavior.

The extension should keep:

* Popup UI
* Content-script UI
* Current-page context collection
* Text selection
* YouTube transcript integration
* Chrome storage adapters
* Chrome notifications
* Extension navigation
* Page-overlay rendering

The extension should not define separate versions of:

* Proactive message
* Trigger type
* Tutor settings
* Tutor category
* Tutor action
* Cooldown behavior
* Context suggestion logic

Provide extension context sources such as:

* Current URL
* Page title
* Selected text
* Visible article text
* YouTube video metadata
* Current transcript segment
* Current timestamp
* Detected IELTS relevance

Only include page context when the user interaction or tutor operation requires it.

# 36. Public exports

Export only stable public contracts and use cases.

Recommended package-root exports:

```ts
export {
  createAITutorEngine,
};

export type {
  AITutorEngine,
  AITutorEngineDependencies,
  TutorChatRequest,
  TutorChatResult,
  LearnerStateSnapshot,
  ProactiveEvaluationRequest,
  ProactiveEvaluationResult,
  ProgressReviewRequest,
  ProgressReviewResult,
  NextBestActionRequest,
  NextBestActionResult,
  LearningEvent,
};
```

Use secondary entry points when necessary:

```text
@ielts/ai-tutor/react
@ielts/ai-tutor/testing
@ielts/ai-tutor/schemas
```

Do not export internal registries, storage implementation details, or every helper from the package root.

# 37. Result contracts

Use discriminated unions for expected outcomes.

Example:

```ts
type TutorOperationResult<T> =
  | {
      status: "success";
      data: T;
      metadata: TutorOperationMetadata;
    }
  | {
      status: "partial";
      data: T;
      warnings: TutorWarning[];
      metadata: TutorOperationMetadata;
    }
  | {
      status: "needs-context";
      missingContext: TutorContextSource[];
      suggestedAction?: TutorAction;
    }
  | {
      status: "unavailable";
      reason: TutorUnavailableReason;
      fallback?: T;
    }
  | {
      status: "cancelled";
    }
  | {
      status: "failure";
      error: TutorError;
    };
```

Do not detect result type through error-message strings.

# 38. Error handling

Create structured tutor errors.

```ts
type TutorError = {
  code: TutorErrorCode;
  message: string;
  recoverable: boolean;
  cause?: unknown;
  context?: Record<string, string | number | boolean>;
};
```

Support errors such as:

* Profile unavailable
* Progress unavailable
* Invalid context
* AI not configured
* AI quota exceeded
* AI timeout
* AI output invalid
* Storage failure
* Context build failure
* Memory failure
* Event processing failure
* Generation cancelled
* Unsupported tutor mode

Requirements:

* No silent catches
* No empty catch blocks
* No leaking API keys
* No logging full private prompts
* Preserve technical causes
* Provide user-safe messages
* Use fallback when safe

# 39. Concurrency and cancellation

Support:

* `AbortController`
* Request IDs
* Session IDs
* Correlation IDs
* Late-response protection
* Duplicate-request suppression
* AI request timeout
* Cancellation
* Idempotent event processing
* Transactional persistence

A cancelled or outdated AI response must not overwrite a newer conversation, context state, or progress review.

# 40. Context and AI caching

Cache stable computed data.

Potential caches:

* Learner state snapshot
* Progress analysis
* Skill priorities
* Context summaries
* Progress reviews
* AI exercise content
* Profile analysis

Cache keys must include relevant input hashes and schema versions.

Invalidate only affected data.

Examples:

* Completing a vocabulary review should not invalidate unrelated Writing feedback.
* Changing the exam date should invalidate exam-sensitive recommendations and roadmap summaries.
* A new writing result should invalidate Writing progress and related tutor recommendations.

# 41. Privacy and data minimization

Only send relevant context to AI.

Do not send:

* Entire chat history when a summary is sufficient
* Entire saved-content database
* Unrelated profile information
* All vocabulary items
* All mistakes from all time
* API keys
* Internal storage records
* Irrelevant browser history

Use bounded selectors such as:

* Most relevant recent mistakes
* Due vocabulary
* Recent performance evidence
* Current roadmap context
* Relevant prior tutor memory
* Selected page content

Store metadata showing which context categories were used, not full raw prompt content.

# 42. Explainability

Every important tutor recommendation should have a concise reason.

Examples:

* “Recommended because Writing has the largest gap from your target.”
* “Recommended because this vocabulary review is due today.”
* “Recommended because you have 20 minutes available before your next scheduled task.”
* “Recommended because this mistake appeared in your last three Writing exercises.”
* “Recommended because your exam is 10 days away and timed practice is now a priority.”

Do not expose hidden model reasoning.

Generate explanations from structured factors.

# 43. Migration strategy

Perform the migration incrementally.

## Phase 1: inventory and characterization

* Map all AI Tutor code paths.
* Identify all duplicate types.
* Identify all duplicate engines.
* Identify all persistence stores.
* Add characterization tests for active behavior.
* Record existing routes and storage keys.

## Phase 2: shared contracts

* Create authoritative domain types.
* Create schemas.
* Add legacy mappers.
* Update package exports.
* Preserve backward compatibility.

## Phase 3: context and state

* Implement context-source contracts.
* Implement LearnerContextBuilder.
* Implement LearnerStateSnapshot.
* Connect web repositories.
* Connect extension repositories.

## Phase 4: proactive consolidation

* Move trigger policies to the shared engine.
* Move message generators to the shared engine.
* Consolidate cooldowns.
* Consolidate quiet hours.
* Consolidate duplicate suppression.
* Replace the web engine with a thin adapter.
* Migrate extension proactive behavior.

## Phase 5: chat and memory

* Consolidate chat message contracts.
* Consolidate session behavior.
* Replace duplicate memory implementations.
* Migrate existing chat data safely.
* Introduce relevant-memory retrieval.

## Phase 6: progress and recommendations

* Consolidate Progress Review.
* Add Next Best Action.
* Add daily and weekly recommendations.
* Connect roadmap data.
* Connect mistakes and vocabulary.

## Phase 7: skill modules

* Move reusable AI logic from skill-specific components into engine modules.
* Keep UI and media behavior in applications.
* Split large components into presentation and orchestration layers.

## Phase 8: cleanup

* Remove duplicate types.
* Remove old engines.
* Remove stale prompts.
* Remove unused services.
* Remove obsolete exports.
* Remove duplicate storage.
* Remove dead tests and imports only after replacements are verified.

# 44. Data migration

Preserve existing local data.

Migrate:

* Chat messages
* Chat sessions
* Tutor memory
* Proactive messages
* Tutor settings
* Reminders
* Writing feedback
* Exercise results
* Progress reviews

Requirements:

* Preserve IDs when possible.
* Preserve timestamps.
* Normalize legacy enums.
* Add schema versions.
* Use safe defaults.
* Preserve unknown legacy fields when necessary for rollback.
* Do not delete old stores before successful migration.
* Make migrations idempotent.
* Test real legacy fixtures.
* Preserve import/export compatibility.

# 45. Code-quality requirements

Use:

* TypeScript strict mode
* No `any`
* Zod validation at external and persistence boundaries
* Pure functions for deterministic policies
* Dependency injection through explicit engine dependencies
* Discriminated unions
* Exhaustive switches
* Focused use cases
* Explicit repository ports
* Explicit platform adapters
* Immutable transformations where practical
* Small public API
* Clear module ownership

Avoid:

* God classes
* Giant service objects
* Business logic inside React components
* AI calls inside UI components
* Dexie calls inside shared domain logic
* Duplicate types
* Duplicate engines
* Generic `Manager` and `Helper` modules without clear purpose
* Circular dependencies
* Deep feature-to-feature imports
* Silent failures
* Unbounded retries
* Unnecessary design-pattern complexity

# 46. React requirements

Refactor React features so components primarily:

* Render data
* Capture user input
* Call engine use cases
* Display result states
* Publish user actions

Do not let React components:

* Build full AI prompts
* Calculate skill priorities
* Evaluate proactive triggers
* Manage tutor memory
* Duplicate progress calculations
* Read several repositories directly
* Coordinate multiple AI Tutor services manually

Create focused hooks such as:

```text
useTutorChat
useTutorContext
useNextBestAction
useProactiveTutor
useTutorProgressReview
useTutorMemory
```

Hooks must call application APIs rather than duplicate domain behavior.

# 47. Testing

Add comprehensive tests.

## Domain tests

Test:

* Skill-priority analysis
* Progress analysis
* Mistake-pattern detection
* Context relevance
* Context freshness
* Memory extraction
* Memory deduplication
* Memory expiry
* Trigger policies
* Cooldown policy
* Quiet hours
* Duplicate suppression
* Intervention scoring
* Next-best-action selection
* Recommendation explanations

## Context tests

Test:

* Full context
* Partial context
* Missing profile
* Missing roadmap
* Stale progress
* Conflicting data
* Scope-specific context
* Context token limits
* Context privacy filtering

## Proactive tests

Test:

* Inactivity
* Missed task
* Exam countdown
* Due vocabulary
* Recurring mistake
* Skill decline
* Progress milestone
* Daily message limit
* Disabled category
* Quiet hours
* Duplicate trigger
* Web and extension consistency

## Chat tests

Test:

* General tutor chat
* Roadmap context
* Vocabulary context
* Writing context
* Session continuation
* Relevant memory retrieval
* AI unavailable
* Invalid AI response
* Cancellation
* Late-response protection

## Skill-module tests

Test:

* Writing feedback
* Speaking feedback
* Reading explanation
* Listening explanation
* Vocabulary enrichment
* Grammar correction
* Progress events produced by each module

## Persistence tests

Test:

* Web Dexie adapters
* Extension storage adapters
* Transaction behavior
* Legacy migrations
* Import/export
* Repository contract compliance

## Integration tests

Test:

* Task completion updates progress and proactive recommendations
* Writing review updates mistakes and Writing skill state
* Saved vocabulary affects future tutor recommendations
* Roadmap changes affect next-best action
* Exam-date changes affect proactive guidance
* Web and extension use the same message contracts
* AI failure falls back without losing data
* Completed events do not process twice

## UI tests

Test:

* Chat loading and error states
* Proactive-message display
* Dismiss and action behavior
* Progress review
* Next-best-action card
* Offline state
* Missing-context state
* Settings
* Accessibility
* Mobile layout

# 48. Acceptance scenarios

## Scenario A: proactive roadmap guidance

User profile:

```text
Current band: 5.5
Target band: 7.0
Writing: 5.0
Speaking: 5.5
Exam date: 30 days away
Available time today: 30 minutes
Today’s Writing task: incomplete
```

Expected:

* The tutor identifies Writing as a priority.
* It recommends the scheduled Writing task.
* The recommendation fits 30 minutes.
* It explains why.
* It does not recommend an unrelated full mock test.
* It respects cooldown and notification settings.

## Scenario B: repeated mistakes

The learner makes article errors in three recent Writing exercises.

Expected:

* The Mistake Pattern Analyzer identifies recurrence.
* Tutor memory records the pattern.
* The tutor proactively recommends a short article review.
* The next Writing chat receives this relevant context.
* The progress review mentions the pattern with evidence.

## Scenario C: missed study sessions

The learner misses two roadmap tasks.

Expected:

* The tutor does not shame the learner.
* It evaluates current capacity.
* It recommends a realistic recovery action.
* It does not automatically overload the next day.
* It can open the roadmap adjustment flow.
* It explains what changed.

## Scenario D: saved vocabulary

The learner saves environment vocabulary from an article.

Expected:

* Vocabulary is added to learner context.
* The tutor recommends a relevant review when due.
* Speaking and Writing modules may use those words in future exercises.
* The same content is not repeatedly recommended without reason.

## Scenario E: no AI provider

Expected:

* The tutor still evaluates proactive triggers.
* It still recommends the next best action.
* It still shows progress statistics.
* It still uses built-in IELTS guidance.
* It clearly identifies offline mode.
* It does not fail or show an empty tutor.

## Scenario F: extension context

The learner selects a sentence on a web page and opens Mini Tutor.

Expected:

* The extension passes only the selected content and relevant page metadata.
* The shared engine uses the learner’s level and goals.
* The response is contextual.
* The resulting vocabulary or mistake can be saved.
* The related learning event becomes available to the web application.

## Scenario G: exam approaching

Exam is seven days away.

Expected:

* The tutor switches to final-preparation guidance.
* It prioritizes error review, timed practice, and confidence.
* It reduces large new-learning recommendations.
* It avoids an exhausting full mock immediately before the exam.
* It respects the Study Plan Engine’s final-week rules.

# 49. Required verification

Before finishing:

1. Inspect all existing AI Tutor files.
2. Map every current entry point.
3. Add characterization tests.
4. Implement authoritative shared contracts.
5. Implement the context system.
6. Implement the learner-state snapshot.
7. Consolidate proactive behavior.
8. Consolidate chat and memory.
9. Consolidate progress review.
10. Integrate the Study Plan Engine.
11. Migrate web consumers.
12. Migrate extension consumers.
13. Migrate existing local data.
14. Remove duplicate implementations.
15. Remove stale prompts and types.
16. Run TypeScript type checking.
17. Run linting.
18. Run shared-package tests.
19. Run web tests.
20. Run extension tests.
21. Run integration tests.
22. Run production builds.
23. Verify offline behavior.
24. Verify AI-assisted behavior.
25. Verify cancellation and failures.
26. Verify legacy data migration.
27. Verify web and extension consistency.
28. Verify no proactive duplicate messages.
29. Verify user settings and quiet hours.
30. Verify the tutor uses real profile and progress data.

# 50. Required final report

Provide a technical report containing:

## Architecture created

* Public engine facade
* Domain modules
* Application use cases
* Context sources
* Memory system
* Proactive pipeline
* AI provider adapters
* Repository ports

## Migrated

* Web AI Tutor
* Extension AI Tutor
* Proactive messages
* Chat
* Progress review
* Suggestions
* Reminders
* Skill tutors
* Tutor memory

## Removed

* Duplicate engines
* Duplicate types
* Duplicate storage
* Stale prompts
* Obsolete services
* Dead exports
* Dead code

## Preserved

* Existing user data
* Existing routes
* Existing UI behavior
* Existing study progress
* Offline operation
* Web and extension compatibility

## Verification

* Type-check result
* Lint result
* Unit-test result
* Integration-test result
* Web build result
* Extension build result
* Migration-test result

Do not claim a check passed unless it was actually executed successfully.

# Expected final result

The final AI Tutor Engine must be:

* The single source of truth for all AI Tutor intelligence
* Proactive
* Context-aware
* Profile-aware
* Progress-aware
* Roadmap-aware
* Exam-aware
* Mistake-aware
* Vocabulary-aware
* Memory-enabled
* Skill-specific
* Consistent across web and extension
* Useful with or without AI
* Privacy-conscious
* Local-first
* Type-safe
* Testable
* Modular
* Maintainable
* Production-ready

The AI Tutor should behave like a real teacher who understands the learner over time, knows what the learner has done, knows what they are struggling with, knows what they should do next, and proactively provides useful support at the correct moment.

Do not stop after centralizing types or changing imports.

Complete the full flow from learner data collection to context analysis, tutor decisions, AI generation, memory updates, proactive delivery, persistence, web and extension presentation, progress updates, migration, testing, and cleanup.

```
```
