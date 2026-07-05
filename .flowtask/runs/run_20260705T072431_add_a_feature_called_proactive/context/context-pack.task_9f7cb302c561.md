# FlowTask Context Pack

## Original User Prompt

Add a feature called **Proactive AI Tutor** to IELTS Journey.

The goal is to make AI Tutor feel like a real personal IELTS tutor, not a passive chatbot that only answers when the user asks.

AI Tutor should proactively guide, remind, encourage, and support the user based on their learning journey, progress, mistakes, saved vocabulary, study plan, and daily behavior.

The AI Tutor should be able to send contextual messages such as:

* Remind the user what to study today
* Suggest the next lesson based on the study plan
* Remind the user to review saved vocabulary
* Warn the user when they are falling behind the plan
* Encourage the user after completing lessons
* Suggest practice based on repeated mistakes
* Recommend Writing, Speaking, Reading, or Listening practice based on weak skills
* Remind the user about missed study days
* Suggest a lighter study session when the user is tired or inactive
* Celebrate streaks and progress
* Review progress after 7 days or 30 days
* Ask the user to continue an unfinished lesson
* Recommend exercises from saved words, articles, or selected text
* Give small daily IELTS tips
* Suggest mock tests when the user is ready
* Remind the user about exam date and target band

AI Tutor should use real user data, including:

* Target IELTS band
* Current level
* Exam date
* Study plan
* Completed lessons
* Saved vocabulary
* Vocabulary review history
* Mistake history
* Writing feedback
* Speaking practice
* Reading and Listening results
* Daily study activity
* Streaks
* Inactive days
* Saved articles and selected text

The tutor should send proactive messages in a natural and helpful way, like a real tutor.

Example messages:

“Good morning! Today you should review 12 saved vocabulary words and practice one Writing Task 2 outline because your recent essays need better idea development.”

“You missed two study days this week. No problem — let’s do a lighter 30-minute review today to get back on track.”

“You often make mistakes with articles like ‘a’, ‘an’, and ‘the’. I created a short practice exercise for you.”

“You saved 15 new words from an article yesterday. Let’s review the most important ones before you forget them.”

“Your exam is getting closer. Since your target is band 6.5, I recommend focusing more on Writing and Speaking this week.”

The AI Tutor should have proactive behavior in different places:

* In the dashboard
* In the header chat icon
* In a Messenger-style popup
* In the extension popup
* When the user selects text on a webpage
* When the user saves vocabulary
* After the user finishes a lesson
* After the user makes repeated mistakes
* After the user is inactive for a few days
* Before and after weekly progress review

The system should avoid annoying the user. Proactive messages should be smart, useful, and not too frequent.

Users should be able to configure:

* Enable or disable proactive tutor
* Reminder frequency
* Tutor tone: friendly, strict, motivational, simple, Vietnamese explanation
* Preferred study time
* Daily reminder time
* Weak skill priority
* Notification channels
* Automation level
* Whether AI can suggest exercises automatically
* Whether AI can generate weekly progress reviews automatically

The AI Tutor should not send random generic messages. Every proactive message should have a reason based on the user’s real learning data.

The purpose of this feature is to make IELTS Journey feel like a real IELTS tutor who watches the learner’s progress, understands their weaknesses, reminds them at the right time, and helps them know exactly what to do next.


## Current Task

### Implement Automated Weekly and Monthly Progress Review Messages

Implement scheduled tasks or background jobs that generate and send proactive messages reviewing user progress after 7 days and 30 days. Use user data to summarize achievements, weaknesses, and recommendations. Integrate with proactive message engine and event bus.

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

- Analyze existing AI Tutor and learning data modules (done)
- Design Proactive Message Generation Engine (done)
- Design User Settings and Configuration UI for Proactive AI Tutor (done)
- Design UI Integration Points for Proactive AI Tutor Messages (done)
- Create Proactive Message Data Model and Storage Schema (done)
- Implement Proactive Message Generation Engine Module (done)
- Implement Proactive Message Event Bus and Notification System (done)
- Implement Proactive AI Tutor Settings UI Components (done)
- Implement Proactive Message Display Components in Dashboard and Chat UI (done)
- Implement Proactive Message Triggers on User Actions and Events (done)
- Integrate Proactive AI Tutor in Browser Extension UI (done)
- Implement Proactive AI Tutor Message Frequency and Quiet Hours Enforcement (done)

## Acceptance Criteria

- Scheduled progress review messages generated at correct intervals
- Messages include relevant progress summaries and recommendations
- Unit tests verify scheduling and message content

## Validation Commands

```bash
pnpm test --filter=progressReviewMessages
```
```bash
pnpm test --filter=proactiveProgressReview
```

## Expected Outputs

- **Create** `packages/ai-tutor/src/services/proactiveProgressReview.ts`
  - Service for scheduled weekly and monthly progress review messages
  - Validation: file_diff

- **Modify** `packages/ai-tutor/src/tests/proactiveProgressReview.test.ts`
  - Unit tests for progress review message service
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
