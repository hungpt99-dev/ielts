# FlowTask Context Pack

## Original User Prompt

You are a senior product engineer, product manager, UX designer, and AI learning system architect.

I already have an existing product called IELTS Journey. Do not create a landing page. Update the actual product features and user experience.

Product goal:
IELTS Journey helps users study IELTS when they do not know where to start, what learning path to follow, how to study, or what to study each day.

The product should give users a clear IELTS learning roadmap, daily study tasks, and ready-to-use learning content so they do not need to search across many websites, YouTube videos, PDFs, or random resources.

The main user experience should be:
When the user opens IELTS Journey, they immediately know what they need to do today. They can click a task and instantly access the lesson, exercise, vocabulary, grammar, reading, listening, writing, or speaking practice they need.

Important:
This is not a landing page task.
This is a product update task.
Work with the existing codebase and improve the real app.

Main product requirements:

1. User Onboarding

Add or improve onboarding so the user can set:
- Current IELTS level
- Target IELTS band
- Exam date
- Daily available study time
- Weak skills
- Preferred study schedule
- Study goal, such as IELTS Academic or IELTS General

After onboarding, generate or update the user's learning roadmap.

The onboarding should be simple, friendly, and easy to complete.

2. IELTS Roadmap System

Create or improve a structured IELTS roadmap system.

The roadmap should show:
- Learning phases
- Weekly goals
- Daily study tasks
- Skill focus for each day
- Progress status
- Completed and incomplete tasks
- Recommended next tasks

The roadmap should help users understand:
- Where they are now
- What they need to study next
- Why they are studying that task
- How it helps their IELTS target

The roadmap should not feel generic. It should be based on the user's target band, exam date, current level, weak skills, and study progress.

3. Daily Study Dashboard

Update the main dashboard so users can clearly see what they need to do today.

The dashboard should include:
- Today's study tasks
- Study progress
- Current IELTS goal
- Study streak
- Weak skill reminder
- Saved vocabulary
- Recent mistakes
- AI Tutor suggestion
- Continue learning button

The most important part:
Users should not feel lost after opening the app. The dashboard must clearly answer: What should I study today?

4. Daily Task System

Create or improve the daily task system.

Each task should include:
- Task title
- Skill type: Listening, Reading, Writing, Speaking, Grammar, Vocabulary
- Estimated time
- Difficulty level
- Learning objective
- Study content
- Practice activity
- Completion status
- Review option

When the user clicks a task, they should immediately see the content or activity they need to study.

Example tasks:
- Learn 10 useful IELTS environment vocabulary words
- Practice skimming with a short reading passage
- Review complex sentences for Writing Task 2
- Listen to a short audio and answer IELTS-style questions
- Write one opinion paragraph
- Practice speaking about hobbies for 3 minutes

5. Ready-Made Learning Content

Add or improve built-in learning content so users do not need to search many sources.

Content should include:
- Vocabulary lessons
- Grammar lessons
- Reading practice
- Listening practice
- Writing practice
- Speaking prompts
- IELTS tips
- Mini exercises
- Review tasks

The content should be organized by:
- Skill
- Level
- Topic
- Difficulty
- IELTS band target

The user should be able to click and start learning immediately.

6. Personalized Learning Logic

Improve the product so it feels personalized.

The app should use user data such as:
- Target band
- Exam date
- Current level
- Weak skills
- Completed tasks
- Saved words
- Mistakes
- Study streak
- Recent activity

Use this data to recommend:
- What to study today
- What to review
- Which weak skill to improve
- Which vocabulary to revise
- Which exercise to do next

Avoid generic random exercises. The learning experience should be connected to the user's real IELTS journey.

7. AI Tutor Assistant

Add or improve the AI Tutor feature.

The AI Tutor should act like a personal IELTS learning companion.

It should be able to:
- Explain what the user should study today
- Suggest tasks based on user progress
- Explain vocabulary and grammar
- Review user mistakes
- Create exercises from saved words or notes
- Give writing and speaking practice prompts
- Encourage the user to stay consistent
- Remind users about weak skills
- Answer IELTS-related questions

Important:
The AI Tutor should use the user's learning journey data. It should not only generate generic answers.

The AI Tutor should understand:
- User target band
- Exam date
- Weak skills
- Saved vocabulary
- Completed tasks
- Recent mistakes
- Daily progress
- Study plan

8. AI Tutor UI

The AI Tutor should be easy to access.

Add or improve:
- Chat icon in the header
- Messenger-style popup chat UI
- Contextual greeting
- Suggested quick actions
- Daily learning recommendation
- Proactive message based on user progress

Example proactive messages:
- Today you should focus on Reading because you missed yesterday's task.
- You saved 8 new words this week. Want to review them now?
- Your Writing Task 2 practice is behind schedule. Let's write one paragraph today.
- Your exam date is getting closer. Let's focus on your weakest skill.

9. Browser Extension Support

If the project includes a browser extension, improve the extension so users can learn from real web content.

The extension should support:
- Highlighting words on web pages
- Saving selected text
- Saving vocabulary
- Adding notes
- Sending saved content to IELTS Journey
- Turning real content into IELTS-style exercises
- Showing quick AI explanations for selected words or sentences

The extension should help users transform real reading content into useful IELTS practice.

10. Saved Words and Notes

Improve saved vocabulary and notes.

Users should be able to:
- Save words
- Add meaning
- Add example sentences
- Add pronunciation notes
- Add topic tags
- Mark words as learned
- Review words later
- Use saved words in AI-generated exercises

The vocabulary review should support spaced repetition or simple review scheduling if possible.

11. Progress Tracking

Add or improve progress tracking.

Track:
- Completed tasks
- Daily streak
- Weekly progress
- Skill progress
- Vocabulary learned
- Weak skills
- Study time
- Roadmap completion percentage
- Recent activity

Progress should be visible and easy to understand.

12. Study Content Page

Create or improve the study content page.

When a user opens a task, the page should show:
- What this task is about
- Why it matters for IELTS
- Lesson content
- Practice questions
- User answer area if needed
- AI help button
- Complete task button
- Save notes button
- Review later button

The user should not need to leave the app to understand or complete the task.

13. Local-First Data Storage

If there is no backend, use browser storage or local-first storage.

Store:
- User profile
- IELTS goal
- Roadmap
- Daily tasks
- Progress
- Saved words
- Notes
- Completed tasks
- AI Tutor chat history if appropriate

Make the storage structure clean, versioned, and easy to migrate later.

Design the data model so online sync can be added in the future.

14. Simple UX Requirement

The product must be simple to use.

Avoid making the app feel complicated.

The main user flow should be:
- Open app
- See today's IELTS tasks
- Click task
- Study content
- Complete task
- Track progress
- Get next recommendation

The user should not need to think too much or search manually.

15. Product Quality Requirements

Make the update production-ready.

Requirements:
- Clean code
- Reusable components
- Clear folder structure
- Type-safe data models
- Good error handling
- Loading states
- Empty states
- Responsive UI
- Accessible UI
- No broken buttons
- No dead UI
- No placeholder features that look finished but do not work
- No random mock data unless clearly marked as sample data
- Do not break existing features

16. Testing Requirements

Add or update tests for important flows:
- Onboarding
- Roadmap generation
- Daily task rendering
- Task completion
- Progress update
- Saved vocabulary
- AI Tutor context creation
- Local storage persistence

Also add basic E2E tests if the project already supports E2E testing.

17. Codebase Instructions

Before coding:
- Inspect the existing project structure
- Reuse existing components when possible
- Do not rewrite the whole app unnecessarily
- Do not create a landing page
- Do not remove existing working features
- Improve the product incrementally but completely
- Keep the architecture maintainable

18. Final Expected Result

After the update, IELTS Journey should feel like a real IELTS learning product.

The user should be able to:
- Set their IELTS goal
- See a clear learning roadmap
- Know what to study every day
- Click daily tasks and start learning immediately
- Save vocabulary and notes
- Track progress
- Get useful AI Tutor guidance
- Learn without searching many different resources

The final product should clearly solve this problem:
IELTS learners feel lost because they do not know what to study, where to start, or how to follow a clear plan. IELTS Journey gives them a simple daily roadmap, ready-made content, and personalized guidance so they can study IELTS consistently every day.

## Current Task

### Update Daily Study Dashboard in src/features/dashboard/

Modify dashboard components to clearly show today's study tasks, study progress, current IELTS goal, study streak, weak skill reminders, saved vocabulary, recent mistakes, AI Tutor suggestions, and a prominent continue learning button. Ensure dashboard answers 'What should I study today?' immediately on app open.

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

- Enhance User Onboarding UI and Logic in src/features/onboarding/ (done)
- Implement Personalized IELTS Roadmap System in src/features/roadmap/ (done)

## Acceptance Criteria

- Dashboard displays today's tasks and progress clearly
- Weak skill reminders and AI Tutor suggestions are visible
- Continue learning button navigates to current task

## Validation Commands

```bash
pnpm test --filter dashboard
```

## Expected Outputs

- **Modify** `src/features/dashboard/DashboardPage.tsx`
  - Enhance dashboard UI with daily tasks and progress widgets
  - Validation: file_diff

- **Modify** `src/features/dashboard/dashboardService.ts`
  - Update dashboard service to aggregate data for display
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
