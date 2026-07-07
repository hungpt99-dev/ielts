# FlowTask Context Pack

## Original User Prompt

Implement a frontend-only event-driven Proactive AI Tutor system for IELTS Journey.

Important: IELTS Journey does not need a backend for this feature. Implement everything on the frontend using local-first architecture. Do not create backend APIs. Do not create fake backend logic. Do not assume server-side scheduler, server-side event tracking, server-side notification, or server-side sync exists.

The goal is to make AI Tutor behave like a real IELTS tutor who observes the student learning journey and sends helpful messages at the right time.

Every important user action should send an internal learning event. However, not every event should show an AI Tutor message. The system must decide whether AI Tutor should respond based on context, priority, timing, cooldown, user settings, and learning value.

The user must be able to turn this feature on or off.

Main goal

Build a frontend-only Proactive AI Tutor event system.

The system should:

Track important learning actions as local events.
Store events locally.
Analyze events using local user learning context.
Decide whether AI Tutor should show a message.
Avoid spamming the user.
Trigger AI Tutor messages only when useful.
Support time-based events while the app is open.
Support time-based checks when the user returns to the app.
Support browser extension events if the extension exists.
Allow the user to enable or disable proactive AI Tutor.
Keep normal AI Tutor chat working even when proactive mode is disabled.
Prepare clean interfaces for possible future backend sync, but do not implement backend logic now.

Core concept

Every important action should emit an event.

But not every event should create a tutor message.

Flow:

User action happens.
The app emits a learning event.
The event is saved locally.
The Proactive Tutor Engine receives the event.
The engine loads local learning context.
The engine checks rules, priority, cooldown, quiet hours, and user settings.
The engine decides whether to show a tutor message.
If useful, AI Tutor shows or generates a contextual message.
If not useful, the event is stored silently.

Example behavior:

User saves one vocabulary word.
The event is stored silently.

User saves 10 vocabulary words in one session.
AI Tutor may show a message:
You saved 10 new words. Let’s review the most useful ones before you forget them.

User misses study for 2 days.
When the user opens the app again, a time-based event is generated.
AI Tutor may show a message:
You missed 2 study days. No problem. Let’s do a lighter 20-minute review today.

Frontend-only requirement

Do not add backend APIs.

Do not assume server-side event tracking.

Do not assume server-side scheduler.

Do not assume server-side notifications.

Do not assume server-side sync.

Use local-first storage only.

Use IndexedDB for structured data such as learning events, proactive tutor messages, cooldown state, dismissed message history, and chat history if needed.

Use LocalStorage only for simple settings.

If the app already has local storage, repository logic, or IndexedDB abstraction, reuse it.

Do not duplicate storage systems.

The system must work fully in the browser without a backend.

Important limitation:

When the website is fully closed, normal website timers cannot run. Do not pretend they can.

Instead:

On app open, check last active time.
On app focus, check missed time-based events.
While the app is open, run periodic local checks.
If the extension exists and Chrome alarms are already safe to use, use extension alarms only for extension-side reminders.
Otherwise, keep extension behavior event-based only.

User enable and disable setting

Add settings so the user can control this feature.

Settings should include:

Enable proactive AI Tutor
Disable proactive AI Tutor
Allow study reminders
Allow vocabulary reminders
Allow mistake reminders
Allow progress review reminders
Allow motivational messages
Allow extension proactive messages
Reminder frequency
Maximum proactive messages per day
Quiet hours
Preferred study time
Tutor tone
Preferred language

When proactive AI Tutor is turned off:

Normal AI Tutor chat must still work.
User actions must still work normally.
Do not show proactive tutor messages.
Do not show proactive popups.
Do not show proactive badges.
Do not show proactive assistant bubbles.
Do not display scheduled proactive reminders.
Do not interrupt the user.
Optionally store learning events locally only if needed for learning history and only if this matches the privacy design.

The setting must persist locally.

The settings UI should clearly explain:

When enabled, AI Tutor can send helpful study suggestions based on your learning activity.
When disabled, AI Tutor will only respond when you ask.

Default behavior:

If product decision is unclear, default proactive AI Tutor to off.
Allow the user to turn it on in Settings or onboarding.
User must be able to turn it off anytime.

Event types

Create a clear local event system for learning actions.

Events should include:

App opened
Dashboard opened
AI Tutor opened
Today plan opened
Study task started
Study task completed
Study task skipped
Study day completed
Study day missed
Study plan generated
Study roadmap viewed
Vocabulary saved
Vocabulary reviewed
Vocabulary forgotten
Vocabulary mastered
Selected text saved
Article saved
Selected text explained
Selected text simplified
Reading practice completed
Listening practice completed
Writing submitted
Speaking practiced
Mistake saved
Repeated mistake detected
Progress viewed
AI progress review generated
Settings changed
AI provider configured
User became inactive
User returned after inactivity
Streak milestone reached
Exam date is close
Vocabulary review is due
Weekly progress review is due
Daily study reminder is due

Event source can be:

website
extension_popup
extension_content_script
local_scheduler
ai_tutor
study_plan
vocabulary
practice
progress
settings

Event model

Create a typed frontend event model.

Each event should have:

eventId
eventType
source
timestamp
page or route
entityType
entityId
payload
metadata
sessionId
correlationId
createdAt
syncStatus

For now, syncStatus should be local_only.

Possible syncStatus values:

local_only
pending_sync
synced
sync_failed

Use local_only now. Keep the other values only if they help future readiness.

Use strong TypeScript types.

Use discriminated union types for event payloads.

Avoid any.

Architecture requirement

Use clean architecture.

Separate:

UI components
event emitters
event bus
event repository
proactive tutor engine
rule engine
context builder
AI prompt builder
AI provider adapter
message repository
local scheduler
notification display
settings repository

Recommended modules:

LearningEventBus
LearningEventRepository
ProactiveTutorEngine
ProactiveTutorRuleEngine
ProactiveTutorContextBuilder
ProactiveTutorPromptBuilder
ProactiveTutorMessageRepository
TutorLocalSchedulerService
TutorNotificationService
ProactiveTutorSettingsRepository
useLearningEvent
useProactiveTutor
useProactiveTutorSettings
learningEventTypes
proactiveTutorRules

Do not put event decision logic directly inside UI components.

UI components should only emit events and render tutor messages.

Event bus requirement

Create a central event bus or event dispatcher.

All important actions should call the same event emitting system.

Use a simple API such as:

emitLearningEvent
trackLearningAction
publishLearningEvent

The event bus should:

Validate event payload.
Add timestamp.
Add session id.
Save event locally.
Notify proactive tutor engine.
Handle errors safely.
Not break the original user action if event tracking fails.

Important:

If event tracking fails, the main user action must still work.

Example:

Saving vocabulary should not fail just because event saving fails.

Proactive tutor decision logic

Not every event should show a message.

Create a ProactiveTutorRuleEngine that decides whether AI Tutor should respond.

The decision should consider:

Whether proactive AI Tutor is enabled
Event type
Event frequency
User progress
Target IELTS band
Exam date
Today plan status
Weak skills
Mistake history
Vocabulary review status
Last tutor message time
Cooldown rules
User reminder settings
Quiet hours
Current page
User activity state
Whether the message would be useful
Whether the user recently dismissed a similar message
Whether the user is already chatting with AI Tutor

Decision result should be one of:

show_message
store_silent
delay_message
merge_with_existing
ignore_event

The result should include:

shouldShow
reason
priority
messageType
suggestedAction
cooldownKey
delayUntil if needed

Message priority

Support priority levels:

low
normal
high
urgent

Examples:

Low priority:
User opens dashboard.

Normal priority:
Vocabulary review is due.

High priority:
User missed study plan for 3 days.

Urgent priority:
Exam is very close and study plan is incomplete.

Cooldown and anti-spam rules

Avoid annoying the user.

Add cooldown rules:

Do not show too many tutor messages in one session.
Do not show the same message repeatedly.
Do not interrupt the user too often.
Do not show proactive messages immediately after every small action.
Do not show more than the configured number of proactive messages per day.
Do not show reminders during quiet hours.
Do not show messages if the user disabled proactive AI Tutor.

Recommended default limits:

Maximum 1 proactive message every 20 minutes during active use.
Maximum 3 proactive messages per day.
Same message type cooldown 24 hours.
Vocabulary review reminder cooldown 12 to 24 hours.
Missed study reminder cooldown 24 hours.
Progress review reminder cooldown 7 days.

Allow these defaults to be adjusted through settings where appropriate.

Time-based events

Implement frontend-only time-based event checks.

Do not pretend the website can run timers when fully closed.

For website:

When app opens, check:

Last active time
Last study date
Today plan status
Vocabulary due
Weekly progress review due
Exam countdown

When app gains focus, check again.

While app is open, run periodic checks with a safe interval.

Example local scheduled events:

daily_study_reminder_due
vocabulary_review_due
weekly_progress_review_due
inactive_user_returned
exam_countdown_warning
today_plan_incomplete
missed_study_days_detected

For extension:

If the browser extension exists and it is safe with Manifest V3, use Chrome alarms only for extension-side reminders.

If not available, keep extension behavior event-based only.

Create a scheduler abstraction:

TutorLocalSchedulerService
TimeBasedEventService
ScheduledEventRepository

Event aggregation

Some events should be aggregated before showing a message.

Do not show a message for every saved word.

Instead:

If user saves 5 or more words in one session, show one summary message.
If user makes the same grammar mistake 3 times, show one targeted message.
If user skips several study tasks, show one recovery plan message.
If user completes many tasks, show one celebration message.

Aggregation windows:

Current session
Last 30 minutes
Today
Last 7 days

Tutor message types

Support proactive message types:

Study reminder
Vocabulary review reminder
Mistake insight
Progress insight
Encouragement
Warning
Next action suggestion
AI generated exercise suggestion
Writing improvement suggestion
Speaking practice suggestion
Exam countdown message
Recovery plan suggestion
Completion celebration

Message display

AI Tutor message can appear in:

Dashboard AI Tutor card
Floating AI Tutor button notification
AI Tutor chat page
Small assistant toast
Tutor inbox
Extension popup if extension exists

Do not always interrupt the user with a popup.

Use the least intrusive display based on priority.

Low priority:
Show in AI Tutor card or inbox.

Normal priority:
Show small assistant bubble or dashboard card.

High priority:
Show visible AI Tutor message with action.

Urgent:
Show stronger reminder but still respectful.

Message behavior

A proactive message should include:

Short tutor message
Reason if useful
Suggested action
Optional button
Dismiss button
Ask AI Tutor button

Examples:

Message:
You saved 12 new words today. Review the most important ones now so you do not forget them.

Action:
Start vocabulary review

Message:
You missed yesterday’s study plan. I can adjust today’s plan to make it lighter.

Action:
Adjust today’s plan

Message:
You made the same article mistake several times. Let’s practice a short exercise.

Action:
Practice articles

AI generation requirement

Some proactive messages should be rule-based.

Some can be AI-generated.

Use rule-based messages for simple reminders.

Use AI-generated messages only when personalization is valuable.

Do not call AI for every event.

AI-generated messages should use compact context:

User profile
Target band
Exam date
Today plan
Recent events
Recent mistakes
Vocabulary due
Progress summary
Preferred language
Tutor tone

If AI provider is missing or API key is not configured:

Do not fail silently.
Use rule-based fallback messages.
Show setup prompt only when the user tries to use an AI-generated tutor response.

AI prompt builder

Create a proactive tutor prompt builder.

The prompt should ask AI to generate a short helpful IELTS tutor message.

Requirements:

Keep message short.
Use friendly tutor tone.
Be specific to the event.
Do not be generic.
Give one clear next action.
Do not shame the user.
Respect preferred language.
Do not mention internal event names.

AI response validation

Validate AI response.

Expected result should include:

message
reason
actionLabel
actionType
priority
shouldShow

If response is invalid, use a safe fallback message.

Do not let invalid AI response break UI.

Website event integration

Add event emission to important website actions:

Dashboard opened
Today plan opened
Study task started
Study task completed
Study task skipped
Study plan generated
Vocabulary saved
Vocabulary reviewed
Word forgotten
Word mastered
Article saved
Selected text saved
Practice completed
Mistake saved
Progress viewed
AI progress review generated
Settings updated
AI provider configured

Do not duplicate event calls.

Use centralized helper or hook.

Extension event integration

If extension exists, add event emission to extension actions:

Popup opened
Selected text detected
Selected text explained
Selected text simplified
Vocabulary saved from webpage
Selected text saved from webpage
Article saved from webpage
Video content saved if available
Saved word highlighted
Auto highlight enabled
Auto highlight disabled
Vocabulary review started from extension
AI Tutor opened from extension

Extension must send events safely.

Use typed extension messages.

Do not break content scripts.

Do not leak CSS.

Do not inject duplicate UI.

Action to event mapping

Create a clear mapping between user actions and event types.

Examples:

saveVocabulary triggers vocabulary_saved
completeTask triggers study_task_completed
skipTask triggers study_task_skipped
openProgress triggers progress_viewed
generateReview triggers ai_progress_review_generated
selectTextExplain triggers selected_text_explained
openApp triggers app_opened
timerCheck triggers scheduled_check_triggered

This mapping should be centralized and easy to maintain.

Proactive tutor inbox

Create or prepare a local tutor message inbox.

The inbox stores proactive messages.

Fields:

messageId
eventId
messageType
message
actionLabel
actionType
priority
status
createdAt
shownAt
dismissedAt
expiresAt

Status:

pending
shown
dismissed
clicked
expired

This allows messages to appear later and prevents repeated messages.

UI requirements

Add proactive AI Tutor message UI.

Possible UI surfaces:

Dashboard AI Tutor card
Floating AI Tutor button with badge
AI Tutor page message thread
Notification panel
Extension popup tutor card

The UI should be:

Modern
Clean
Not too colorful
Not annoying
Easy to dismiss
Actionable
Consistent with design system

Every message should have:

Message text
Optional reason
Primary action
Dismiss action

No fake buttons.

Settings UI requirement

Add or update settings page for Proactive AI Tutor.

The settings UI should include:

Main toggle: Enable Proactive AI Tutor
Reminder frequency
Maximum messages per day
Quiet hours
Daily study reminder toggle
Vocabulary reminder toggle
Progress review reminder toggle
Mistake insight toggle
Motivational message toggle
Extension proactive message toggle if extension exists
Preferred tutor tone
Preferred language

Make the setting clear and easy to understand.

When proactive AI Tutor is off:

No proactive messages should be shown.
No floating proactive badge should appear.
No scheduled proactive checks should display messages.
Normal AI Tutor chat still works.

Privacy and safety

Do not send unnecessary personal data to AI.

Only send compact learning context.

Do not expose API keys in messages.

Respect user settings.

Allow users to disable proactive tutor.

Allow users to dismiss messages.

Do not guilt trip or shame the user.

Do not over-message the user.

Frontend storage

Store locally:

Learning events
Proactive messages
Proactive tutor settings
Cooldown state
Last active time
Last scheduler check time
Dismissed message history
Tutor chat history if already supported

Use existing storage abstraction if available.

Do not store sensitive provider keys in event payloads.

Testing requirements

Add or improve tests for:

Event creation
Event validation
Event repository
Settings toggle
Rule engine decision
Cooldown logic
Time-based event generation
Context builder
AI prompt builder
Message repository
Event aggregation
Website action event emission
Extension message event emission if extension exists

Manual testing checklist:

Turn proactive AI Tutor on.
Turn proactive AI Tutor off.
Open dashboard.
Complete a task.
Save vocabulary.
Review vocabulary.
Skip task.
Open progress.
Simulate scheduled check.
Return after inactivity.
Trigger vocabulary review due.
Trigger missed study day.
Open AI Tutor.
Dismiss proactive message.
Click proactive message action.
Confirm not every event shows a message.
Confirm cooldown works.
Confirm quiet hours work.
Confirm user settings are respected.
Confirm normal AI Tutor chat still works when proactive mode is off.

For extension if available:

Open extension popup.
Save word from extension.
Explain selected text.
Confirm event is emitted.
Confirm proactive setting is respected.
Confirm no duplicate UI.
Confirm extension still works.

Implementation order

1. Audit existing AI Tutor, local storage, website actions, extension actions, and settings.
2. Define typed learning event model.
3. Create local event repository.
4. Create event bus or dispatcher.
5. Create proactive tutor settings repository.
6. Add enable and disable setting in Settings UI.
7. Add event emission to key website actions.
8. Add event emission to key extension actions if extension exists.
9. Create proactive tutor rule engine.
10. Create cooldown and anti-spam logic.
11. Create context builder.
12. Create proactive tutor prompt builder.
13. Create optional AI message generation service with rule-based fallback.
14. Create tutor message repository.
15. Create frontend-only time-based event scheduler.
16. Create proactive message UI surfaces.
17. Add tests.
18. Test website and extension flows.
19. Run typecheck, lint, tests, and build.
20. Return final report.

Important rules

Do not add backend.
Do not call AI for every event.
Do not show tutor message for every event.
Do not spam the user.
Do not create fake events.
Do not create buttons that do nothing.
Do not hard-code random demo messages as production logic.
Do not put business logic inside UI components.
Do not break existing AI Tutor chat.
Do not break local data.
Do not break extension behavior.
Do not assume backend exists.
Do not pretend scheduled events work when the app is closed.
Do not ignore the user toggle setting.

Final result

IELTS Journey should have a real frontend-only event-driven Proactive AI Tutor system.

Every important action should emit a local learning event.

The system should intelligently decide whether AI Tutor should respond.

The user can turn the feature on or off.

When enabled, AI Tutor should send helpful contextual messages only when useful.

When disabled, AI Tutor should only respond when the user opens and uses AI Tutor manually.

Time-based checks should work while the app is open and when the user returns to the app.

The final system should feel like a real IELTS tutor helping at the right moment without annoying the student.

Final report

Return a final report with:

Frontend-only architecture implemented
Event types added
Event bus implementation
Local repositories added
Proactive tutor settings added
Enable and disable behavior
Rule engine implementation
Cooldown logic
Time-based event logic
AI Tutor message logic
Website actions integrated
Extension actions integrated if available
UI surfaces added
Tests added
Manual testing performed
Known limitations
Future frontend improvements

## Current Task

### Create central LearningEventBus with event validation, timestamping, session management, and local saving

Implement a singleton LearningEventBus module `src/features/learningEvents/LearningEventBus.ts` that exposes an API `emitLearningEvent(event)` to emit learning events. The bus must validate event payloads against the typed model, add timestamps and sessionId, save events using the LearningEventRepository, notify the ProactiveTutorEngine asynchronously, and handle errors without blocking the main user action. Ensure the bus supports multiple subscribers and safe error handling.

## Project Rules

## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/mode.md

# Development Mode Rules

This project is in **development** mode.

## Behavior
- Inspect the project before editing.
- Make focused, small code changes.
- Follow existing code style and project conventions.
- Do not make unrelated changes.
- Validate with lint/typecheck/test when configured.
- Do not claim success without evidence.
- Risky actions (install dependency, delete files, git push) require approval.

## Validation
- Code validation is enabled by default.
- Run configured quality commands when available.
- Validation runs serially and safely by default.
- Avoid spawning many test workers at once.
- Use narrow, focused test commands when possible.
- Do not run expensive full test suites repeatedly.
- Git diff may be required for changes.


## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/project.md

# Project Rules

FlowTask manages one project at a time.

## Source: /Users/phamthanhhung/Desktop/MyProject/IELTS/.flowtask/rules/workflow.md

# Workflow Rules

Tasks execute sequentially by default.


## Previous Completed Tasks

- Audit existing AI Tutor, local storage, website and extension actions, and settings (done)
- Define typed frontend learning event model with discriminated unions (done)
- Implement local learning event repository using IndexedDB abstraction (done)

## Acceptance Criteria

- Event payloads are validated before processing
- Timestamps and sessionId are added automatically
- Events are saved locally with syncStatus 'local_only'
- ProactiveTutorEngine is notified asynchronously on event emission
- Errors in event processing do not block or break user actions

## Validation Commands

```bash
pnpm test --filter LearningEventBus
```

## Expected Outputs

- **Create** `src/features/learningEvents/LearningEventBus.ts`
  - Central event bus for emitting and processing learning events
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
