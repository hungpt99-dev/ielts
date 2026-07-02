# FlowTask Context Pack

## Original User Prompt

I want to update my IELTS Learning Journey website into a production-ready, fully featured static web app with no backend.

The app must help me learn English and prepare for IELTS every day. It should run completely in the browser, store data locally, and support user-provided AI API keys. Do not build a backend server.

Core requirements:

Build a beautiful, modern, responsive IELTS learning web app with excellent UX/UI. The design should be simple, motivating, easy to use, and suitable for daily learning. Use clean layout, good spacing, readable typography, smooth interactions, and mobile-first responsive design.

The website must include:

1. Daily IELTS Learning Dashboard

* Today’s study plan
* Daily checklist
* Study streak
* Total study time
* IELTS skill progress: Listening, Reading, Writing, Speaking, Vocabulary, Grammar
* Quick actions to start practice
* Motivation section

2. Study Planner

* Create daily, weekly, and monthly study plans
* Custom IELTS target band
* Custom exam date
* Auto-generate study schedule based on target band and available time
* Calendar-style view
* Progress tracking
* Missed-task handling

3. Vocabulary Learning

* Vocabulary by IELTS topics
* Add custom words
* Meaning, example sentence, pronunciation note, collocation, synonym, antonym
* Spaced repetition system
* Review mode
* Favorite words
* Difficult words list
* Import/export vocabulary data
* AI-generated examples using user API key

4. Reading Practice

* IELTS-style reading passages
* Topic-based reading
* Question types: multiple choice, true/false/not given, matching headings, gap fill
* Timer
* Answer checking
* Explanation
* Save mistakes
* Reading history
* AI-generated reading passage from selected topic

5. Listening Practice

* Listening practice page
* Transcript-based exercises
* Gap-fill listening style
* Audio URL support
* YouTube/audio link note support
* Save listening notes
* Track listening practice time

6. Writing Practice

* IELTS Writing Task 1 and Task 2 practice
* Prompt library
* Essay editor
* Word count
* Timer
* Save drafts
* AI feedback using user API key
* Feedback categories: task response, coherence, vocabulary, grammar
* Estimated band score
* Improved version suggestion
* Mistake list

7. Speaking Practice

* IELTS Speaking Part 1, Part 2, Part 3 question bank
* Cue card practice
* Timer
* Record answer using browser microphone if possible
* Save speaking notes
* Self-evaluation checklist
* AI feedback from transcript or typed answer
* Common speaking phrases

8. Grammar Learning

* Grammar topic list
* Simple explanations
* Examples
* Practice exercises
* Mistake tracking
* Personal grammar weakness list
* AI-generated grammar exercises

9. Mistake Notebook

* Save all mistakes from reading, writing, grammar, vocabulary, and speaking
* Categorize mistakes
* Add correction and explanation
* Review mistakes daily
* Filter by skill and topic
* Mark as fixed

10. AI Tutor Integration

* No backend.
* Let the user enter their own AI API key in Settings.
* Store API key only in the browser using local storage or IndexedDB.
* Support configurable AI provider settings:

  * Provider name
  * Base URL
  * API key
  * Model name
* Default should support OpenAI-compatible API format.
* User can test API connection.
* User can choose AI features on/off.
* Never hard-code API keys.
* Show clear warning that API key is stored locally in the browser.
* AI features:

  * Generate study plan
  * Generate vocabulary examples
  * Generate IELTS reading passages
  * Check writing
  * Generate speaking questions
  * Explain grammar
  * Explain mistakes
  * Create daily learning content

11. Browser Local Database

* No backend.
* Use IndexedDB for persistent data.
* Use localStorage only for small settings.
* Data should persist after refresh.
* Add import/export full backup as JSON.
* Add reset data option.
* Use clean data models and versioned storage migration.

12. Progress Analytics

* Daily study time chart
* Skill progress chart
* Streak calendar
* Completed tasks
* Weakest skills
* Most common mistakes
* Vocabulary review progress
* Writing score history

13. Settings

* Target IELTS band
* Exam date
* Daily study time
* Theme mode: light/dark/system
* Accent color
* AI provider configuration
* Data backup/import/export
* Reset app data
* Notification preference if browser supports it

14. UX/UI Requirements

* Beautiful landing/dashboard experience
* Easy navigation
* Sidebar or top navigation
* Clear empty states
* Loading states
* Error states
* Toast notifications
* Confirmation modals for dangerous actions
* Keyboard-friendly forms
* Accessible colors and contrast
* Mobile responsive
* Smooth but not excessive animations

15. Theme and CSS Requirements

* Do not hard-code colors everywhere.
* Use design tokens and CSS variables.
* Create a maintainable theme system.
* Support light and dark mode.
* Use semantic variables like:

  * --color-background
  * --color-surface
  * --color-primary
  * --color-text
  * --color-muted
  * --color-border
  * --radius-md
  * --spacing-md
* Components must use theme variables, not raw repeated colors.
* Keep CSS clean and scalable.

16. Code Quality Requirements

* Production-ready code quality.
* Clean architecture.
* Easy to maintain and extend.
* Strong TypeScript typing.
* Reusable components.
* Clear folder structure.
* Avoid duplicated logic.
* Separate UI, state, storage, AI service, and domain logic.
* Add error handling.
* Add validation for forms.
* Add comments only where useful.
* Use meaningful names.
* Keep components small and focused.

17. Suggested Tech Stack
    Use a modern static frontend stack:

* React + TypeScript + Vite
* Tailwind CSS or CSS Modules with CSS variables
* IndexedDB using Dexie.js
* Zustand or React Context for app state
* React Hook Form + Zod for forms and validation
* Recharts for analytics
* Framer Motion only if needed for small animations
* No backend server

18. Project Structure
    Create a clean structure like:

src/
app/
components/
features/
dashboard/
planner/
vocabulary/
reading/
listening/
writing/
speaking/
grammar/
mistakes/
analytics/
settings/
services/
ai/
storage/
stores/
types/
utils/
styles/
data/

19. Static Sample Data
    Include sample IELTS topics, vocabulary, grammar lessons, writing prompts, speaking questions, and reading examples so the app works immediately without AI.

20. Production Readiness

* App must build successfully.
* No TypeScript errors.
* No unused broken code.
* Good performance.
* Lazy-load heavy pages if needed.
* Works offline for non-AI features.
* Friendly error when AI API fails.
* Safe handling of missing API key.
* Ready to deploy to Cloudflare Pages, Vercel, Netlify, or any static hosting.

21. Testing
    Add useful tests where reasonable:

* Unit tests for storage utilities
* Unit tests for AI request builder
* Unit tests for progress calculation
* Component tests for important UI
* E2E test for main user flow if possible

22. Final Delivery
    After implementation, provide:

* Summary of completed features
* How to run locally
* How to build
* How to deploy as static website
* How to configure AI API key
* Explanation of local data storage
* Any remaining limitations

Important constraints:

* Do not create a backend.
* Do not hard-code API keys.
* Do not hard-code theme colors inside components.
* Do not make a simple demo only.
* Implement the full product experience.
* Prioritize maintainability, beautiful UX/UI, and real daily IELTS learning value.


## Current Task

### Implement AI Tutor Integration in src/services/ai/AIService.ts and src/features/settings/AISettings.tsx

Create AI service module supporting user-provided API keys stored securely in browser localStorage or IndexedDB. Support configurable AI provider settings: provider name, base URL, API key, model name. Provide functions for generating study plans, vocabulary examples, reading passages, writing checks, speaking questions, grammar explanations, mistake explanations, and daily learning content. Implement Settings UI for user to enter and test API key, toggle AI features on/off, and show clear warnings about local storage of keys.

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

- Design and implement core UI layout and navigation in src/app/App.tsx and src/components/Layout.tsx (done)
- Implement Daily IELTS Learning Dashboard in src/features/dashboard/Dashboard.tsx (done)
- Create Study Planner feature in src/features/planner/Planner.tsx with calendar and schedule generation (done)
- Develop Vocabulary Learning module in src/features/vocabulary with spaced repetition and AI example generation (done)
- Implement Reading Practice feature in src/features/reading with IELTS-style passages and AI passage generation (done)
- Build Listening Practice feature in src/features/listening with transcript exercises and audio support (done)
- Create Writing Practice feature in src/features/writing with prompt library, editor, and AI feedback (done)
- Implement Speaking Practice feature in src/features/speaking with question bank, recording, and AI feedback (done)
- Develop Grammar Learning feature in src/features/grammar with topics, explanations, exercises, and AI generation (done)
- Implement Mistake Notebook feature in src/features/mistakes/MistakeNotebook.tsx (done)

## Acceptance Criteria

- User can enter and save AI API key and provider settings
- API key is stored only locally and never hard-coded
- User can test API connection with feedback
- AI features can be toggled on/off
- AI service functions handle missing or invalid keys gracefully

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/services/ai/AIService.ts`
  - AI service module with API key management and request functions
  - Validation: file_exists

- **Create** `src/features/settings/AISettings.tsx`
  - Settings UI for AI provider configuration and API key input
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
