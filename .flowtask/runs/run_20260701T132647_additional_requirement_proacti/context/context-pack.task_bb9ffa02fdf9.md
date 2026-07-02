# FlowTask Context Pack

## Original User Prompt

Additional requirement: Proactive AI Tutor Chat Widget

The AI Tutor Assistant should be available as a chat icon in the website headbar, similar to Facebook Messenger chat UI.

It should not feel like a separate complex page only. It should feel like a friendly tutor always available while the user is learning.

1. Headbar Chat Icon

Add an AI Tutor icon on the main top/headbar.

Requirements:

* Show chat bubble icon
* Show unread message badge
* Show small status indicator
* Click opens chat popup
* Works on desktop and mobile
* Does not block the main learning UI
* Can be minimized and reopened
* Keep chat state when navigating pages

2. Messenger-Style Chat Popup

The chat should look like a normal modern chat app popup.

UI requirements:

* Floating popup panel from bottom-right or headbar
* Conversation bubbles
* User message bubble
* AI tutor message bubble
* Typing indicator
* Message timestamp
* Scrollable message history
* Quick reply buttons
* Suggested action buttons
* Minimize button
* Expand to full chat page button
* Clear chat option
* Mobile full-screen chat mode

Example quick actions:

* Teach me this
* Quiz me
* Remind me later
* Practice now
* Explain my mistake
* Generate exercise
* Review vocabulary
* Continue today’s plan

3. Proactive Tutor Messages

The AI Tutor should proactively send helpful messages based on the user’s local learning data, without requiring the user to start the conversation.

Examples:

* “You have 12 vocabulary words due for review today. Want to practice them now?”
* “You saved 5 words about Environment yesterday. I can create a quick quiz.”
* “You often make mistakes with articles: a, an, the. Let’s fix that with 5 questions.”
* “Your exam is 45 days away. Today we should focus on Writing Task 2.”
* “You have not practiced Speaking for 3 days. Want to do a short Part 1 practice?”
* “You just saved an article about technology. I can turn it into IELTS Reading questions.”
* “You missed yesterday’s plan. I can adjust today’s study plan.”
* “Good job. You completed your vocabulary review streak today.”

4. Proactive Message Engine

Create a local proactive message engine.

It should analyze:

* Target IELTS band
* Exam date
* Daily study plan
* Study streak
* Missed tasks
* Due vocabulary reviews
* Mistake notebook
* Weak skills
* Recent wrong answers
* Saved articles
* Saved YouTube transcripts
* Saved website text
* Current page or current learning topic
* User activity today

The engine should generate message triggers such as:

* due_review
* missed_task
* weak_skill_warning
* exam_countdown
* new_content_saved
* study_streak
* low_activity
* daily_plan_ready
* mistake_pattern_detected
* topic_practice_suggestion

5. Local-First Proactive Behavior

Because the app has no backend, proactive messages must be local-first.

Support:

* In-app proactive messages when website is open
* Extension popup reminders
* Browser notifications if user allows permission
* Chrome extension alarms if available
* Local scheduled reminders
* Dashboard notification center

Important limitation:

* Without backend push notifications, the app cannot reliably send cloud messages when the website and extension are both closed.
* Document this clearly.
* Do not fake cloud push behavior.

6. AI and Privacy Rules for Proactive Messages

Proactive messages can be generated in two ways:

A. Rule-based local messages

* Generated fully in browser from local data
* No AI API call needed
* Safe default behavior
* Example: “You have 10 words due today.”

B. AI-enhanced proactive messages

* Optional setting
* Uses user’s own AI API key
* Must be enabled by the user
* Uses compact learning context
* Has daily/monthly usage limits
* Shows what data may be used
* Never sends private data silently unless user explicitly enables proactive AI mode

Default should be rule-based proactive messages. AI-enhanced proactive coaching should be optional.

7. Proactive Message Settings

Add settings for:

* Enable/disable proactive tutor messages
* Enable/disable browser notifications
* Enable/disable AI-enhanced proactive messages
* Quiet hours
* Reminder time
* Maximum messages per day
* Message categories on/off:

  * Vocabulary review
  * Mistake review
  * Study plan
  * Speaking practice
  * Writing practice
  * Exam countdown
  * Motivation
  * Saved content suggestions

8. Notification Center

Add a notification center inside the app.

User can:

* See all proactive tutor messages
* Mark as read
* Dismiss message
* Snooze message
* Start recommended action
* Delete old messages
* Filter by category

9. Message-to-Action Flow

Every proactive message should have a useful action.

Examples:

* Review now
* Generate exercise
* Open mistake notebook
* Start speaking practice
* Open today’s plan
* Turn article into exercise
* Ask tutor
* Snooze
* Dismiss

Do not send messages that only say generic motivation. Each message should help the user take the next learning action.

10. Extension Proactive Assistant

The browser extension should also support proactive tutor messages.

Examples:

* When user selects English text: “Want me to explain this and save useful vocabulary?”
* When user opens YouTube: “Paste the transcript and I can create a listening exercise.”
* When user saves a word: “I can create a mini quiz from this word.”
* When user visits an English article: “This looks useful for IELTS Reading. Save it?”

Extension rules:

* Do not interrupt too often.
* Do not read full page silently.
* User can disable proactive extension suggestions.
* Use minimal permissions.

11. Chat Context Awareness

The chat popup should know where the user is in the app.

Examples:

* On Vocabulary page: suggest vocabulary review
* On Writing page: offer essay feedback
* On Speaking page: offer speaking partner mode
* On Reading page: explain passage or generate questions
* On Mistake Notebook page: explain and create drills
* On Dashboard: recommend next best action

12. Chat Memory

Store chat memory locally.

Store:

* Chat conversations
* Proactive messages
* User replies
* Dismissed messages
* Snoozed messages
* Accepted recommendations
* Tutor preferences
* Current learning topic
* Last interaction time

User can clear chat memory anytime.

13. UX Requirements

The AI Tutor chat widget should feel friendly and alive.

Requirements:

* Messenger-style popup
* Smooth open/close animation
* Unread badge
* Friendly avatar
* Quick action buttons
* Small proactive message preview
* Typing indicator
* Empty state introduction
* Error state when AI key missing
* Works in light/dark mode
* Uses theme variables, not hard-coded colors

14. Important Product Principle

The AI Tutor should feel like a learning friend who notices the user’s journey.

It should:

* Teach when user asks
* Proactively remind when needed
* Suggest next best action
* Turn saved content into practice
* Help fix weak points
* Encourage the user
* Keep conversation related to the topic the user is learning

The tutor should not wait passively like a normal chatbot. It should actively support the user’s IELTS learning journey using local data and privacy-safe proactive messages.


## Current Task

### Implement Chat Context Awareness in src/services/ChatContext.ts

Create a module to detect and provide current user app context (current page, learning topic) to the chat popup and proactive message engine. It should expose APIs to get current context and update context on navigation or user actions. Integrate with chat popup to suggest context-aware messages and quick actions based on current page (Vocabulary, Writing, Speaking, Reading, Mistake Notebook, Dashboard).

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

- Add AI Tutor Chat Icon Component in src/components/aiTutor/ChatIcon.tsx (done)
- Implement Messenger-Style Chat Popup in src/components/aiTutor/ChatPopup.tsx (done)
- Design and Implement Local Proactive Message Engine in src/services/ProactiveMessageEngine.ts (done)
- Add Proactive Message Settings UI in src/components/aiTutor/ProactiveSettings.tsx (done)
- Implement Notification Center in src/components/aiTutor/NotificationCenter.tsx (done)

## Acceptance Criteria

- Chat context module provides accurate current page and topic info
- Chat popup uses context to suggest relevant messages and actions
- Context updates on navigation and user activity

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/services/ChatContext.ts`
  - Module providing current app context for chat and proactive messages
  - Validation: file_exists

- **Modify** `src/components/aiTutor/ChatPopup.tsx`
  - Use ChatContext to show context-aware suggestions
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
