# FlowTask Context Pack

## Original User Prompt

Additional requirement: AI Tutor Assistant / Learning Friend

Build an AI Tutor Assistant that feels like a personal IELTS coach and friendly learning companion.

The assistant should not be only a chatbot. It should understand the user’s learning journey, current topic, weak points, saved content, mistakes, and daily study plan.

Core idea:

The AI Tutor Assistant can teach me, remind me, chat with me like a friend, and keep the conversation connected to what I am learning.

Main features:

1. AI Tutor Chat

* Add a Tutor Assistant chat page.
* User can ask anything about IELTS, English, grammar, vocabulary, writing, speaking, reading, listening, study planning, or learning problems.
* Assistant should answer in a friendly, supportive way.
* Assistant can explain in simple English, Vietnamese, or both.
* Assistant can adapt explanations to the user’s current level.
* Chat history is saved locally.

2. Topic-Aware Conversation
   The assistant should know the topic the user is currently learning.

Examples:

* If user is learning Environment vocabulary, the assistant can chat about climate change, pollution, recycling, and sustainability.
* If user is learning Education topic, the assistant can discuss schools, online learning, exams, and students.
* If user is practicing Speaking Part 2, the assistant can ask follow-up questions naturally.
* If user is reading an article, the assistant can discuss that article with the user.

3. Friend Mode
   Add a friendly chat mode where the assistant can talk naturally with the user, but still connect the conversation to learning.

Examples:

* Casual conversation using today’s vocabulary
* Daily check-in
* “How was your study today?”
* “Let’s talk about the topic you learned today.”
* “Tell me your opinion about this topic.”
* “I’ll correct your English gently while we chat.”

4. Teaching Mode
   The assistant can teach the user step by step.

Teaching features:

* Explain grammar
* Explain vocabulary
* Give examples
* Ask checking questions
* Correct user answers
* Give mini exercises
* Give feedback
* Review old mistakes
* Suggest what to learn next

5. Socratic Tutor Mode
   The assistant should not always give answers immediately.

It can guide the user by asking:

* What do you think this word means?
* Can you make a sentence with this word?
* Why do you think this answer is correct?
* Can you improve this sentence?
* Can you explain your opinion more clearly?

6. IELTS Speaking Partner
   The assistant can act as an IELTS speaking partner.

Features:

* Ask Part 1 questions
* Give Part 2 cue card
* Ask Part 3 follow-up questions
* Keep a natural conversation
* Correct mistakes after the answer
* Suggest better phrases
* Estimate speaking band from transcript or typed answer
* Save mistakes to Mistake Notebook

7. Writing Tutor
   The assistant can help with IELTS writing.

Features:

* Brainstorm ideas
* Create outline
* Improve thesis statement
* Improve paragraph structure
* Check grammar and vocabulary
* Suggest better linking words
* Give band score estimate
* Rewrite at target band level
* Save feedback and mistakes locally

8. Reading / Listening Discussion Tutor
   The assistant can discuss saved articles, website text, or YouTube transcripts.

Features:

* Summarize content
* Explain difficult sentences
* Extract useful vocabulary
* Ask comprehension questions
* Turn content into exercises
* Ask opinion questions
* Connect content to IELTS topics

9. Smart Reminder Assistant
   The assistant should remind the user about learning tasks.

Because there is no backend, reminders must be local-first.

Support:

* Browser notifications if allowed
* Extension reminders using Chrome alarms if available
* In-app reminders on dashboard
* Daily study reminders
* Vocabulary review reminders
* Mistake review reminders
* Writing draft reminder
* Exam countdown reminder
* Missed task reminder

Important reminder limitation:

* Without backend or push server, reminders may depend on the browser, extension, or app being installed/open.
* Clearly document this limitation.
* Do not pretend cloud reminders exist.

10. Proactive Learning Suggestions
    The assistant can suggest useful actions based on the user’s learning journey.

Examples:

* “You often make article mistakes. Let’s do 5 quick article questions.”
* “You saved 12 words about Environment. Let’s practice them in a short paragraph.”
* “Your exam is getting closer. Today we should focus on Writing Task 2.”
* “You have not reviewed speaking mistakes for 3 days.”
* “This article you saved can become a Reading practice.”

11. Context-Aware AI
    The assistant should use selected local context only with user permission.

Possible context:

* Target IELTS band
* Exam date
* Current topic
* Today’s plan
* Saved vocabulary
* Recent mistakes
* Saved article
* YouTube transcript
* Writing draft
* Speaking transcript
* Recent exercise results

Before using large private learning data, show what will be sent to AI.

12. Assistant Modes
    Add mode selector:

* Friendly Chat
* IELTS Tutor
* Speaking Partner
* Writing Coach
* Grammar Teacher
* Vocabulary Coach
* Reading Explainer
* Listening Coach
* Study Planner
* Motivation Coach

Each mode should have its own prompt and behavior.

13. Assistant Memory
    Since there is no backend, assistant memory must be stored locally.

Store:

* Chat history
* User preferences
* Current learning topic
* Accepted recommendations
* Repeated mistakes
* AI feedback summaries
* Reminder settings
* Learning goals

User can delete assistant memory anytime.

14. Extension Assistant
    The browser extension should include a mini tutor assistant.

When user selects text on a webpage, the assistant can:

* Explain it
* Simplify it
* Translate it
* Turn it into exercise
* Ask follow-up questions
* Save vocabulary
* Discuss the topic with the user
* Connect the content to IELTS learning

15. Tutor Personality
    The assistant should be:

* Friendly
* Encouraging
* Clear
* Honest
* Patient
* Not too formal
* Good at explaining simply
* Able to correct mistakes gently
* Able to motivate the user to continue

16. UX Requirements

* Add floating AI tutor button in the website.
* Add AI tutor page.
* Add mini tutor in extension popup.
* Add quick actions:

  * Teach me this
  * Quiz me
  * Correct my English
  * Explain simply
  * Give me examples
  * Turn this into exercise
  * Remind me later
  * Practice with me
* Show loading state, error state, and retry.
* Allow user to save useful AI answers as notes.
* Allow user to turn AI answers into vocabulary, grammar notes, exercises, or mistakes.

17. Important Principle
    The AI Tutor Assistant should feel like a personal English-learning friend.

It should not only answer questions. It should:

* Teach
* Ask
* Correct
* Remind
* Encourage
* Chat
* Generate exercises
* Review mistakes
* Connect everything to the user’s IELTS learning journey

The assistant should help the user learn English every day from their own data, real web content, saved notes, mistakes, and current learning topic.


## Current Task

### Implement AI Tutor Assistant Mode Selector Component

Create a React component in src/components/aiTutor/ModeSelector.tsx that allows users to select among assistant modes: Friendly Chat, IELTS Tutor, Speaking Partner, Writing Coach, Grammar Teacher, Vocabulary Coach, Reading Explainer, Listening Coach, Study Planner, Motivation Coach. The component should manage mode state and notify parent components of mode changes.

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

- Define AI Tutor Assistant Core Data Models and Local Storage Schema (done)

## Acceptance Criteria

- Mode selector UI displays all modes clearly
- User can switch modes and mode state updates accordingly
- Mode changes trigger callbacks for parent components

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/components/aiTutor/ModeSelector.tsx`
  - React component for selecting AI Tutor Assistant modes
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
