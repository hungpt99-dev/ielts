# FlowTask Context Pack

## Original User Prompt

I want to build a website that helps me learn IELTS every day.

Create a production-ready IELTS learning web app with a clean, simple, and motivating UI. The goal is to help users study consistently every day and improve Listening, Reading, Writing, Speaking, Vocabulary, and Grammar.

Main features:

1. Daily IELTS Study Plan

* Generate a daily study plan based on the user’s target band, current level, available time, and exam date.
* Show today’s tasks clearly.
* Include progress tracking, streaks, completed lessons, and weak areas.

2. Vocabulary Learning by Topic

* IELTS topics: Education, Environment, Technology, Health, Work, Travel, Society, Crime, Media, Globalization, etc.
* Each word should include meaning, pronunciation, example sentence, collocations, synonyms, antonyms, and IELTS-style usage.
* Support spaced repetition.
* Allow users to save difficult words.
* Generate short reading passages using selected vocabulary.

3. Reading Practice

* IELTS-style reading passages by topic and difficulty.
* Include question types: True/False/Not Given, Matching Headings, Multiple Choice, Sentence Completion, Summary Completion.
* Show answers with explanations.
* Track accuracy and reading speed.

4. Listening Practice

* Daily listening exercises.
* Support transcript, gap-fill questions, multiple choice, and shadowing practice.
* Allow replay by sentence.
* Track difficult words from listening transcripts.

5. Writing Practice

* IELTS Writing Task 1 and Task 2 practice.
* Provide prompts by topic.
* User can submit an essay.
* AI gives band score estimate, grammar correction, vocabulary suggestions, coherence feedback, and improved version.
* Store writing history and progress.

6. Speaking Practice

* IELTS Speaking Part 1, Part 2, and Part 3 questions.
* Daily speaking prompts.
* Allow user to record answers or type answers.
* AI gives feedback on fluency, vocabulary, grammar, pronunciation notes, and better sample answers.
* Include shadowing and repeat-after-me practice.

7. Grammar Practice

* Focus on grammar useful for IELTS.
* Include explanations, examples, quizzes, and mistakes review.
* Topics: tenses, articles, countable/uncountable nouns, relative clauses, conditionals, passive voice, complex sentences, conjunctions, and sentence structures.

8. AI Tutor

* Add an AI chat tutor that can explain mistakes in simple English or Vietnamese.
* The tutor should help the user understand why an answer is wrong.
* The tutor should suggest what to study next based on weak areas.

9. Dashboard

* Show daily progress, weekly progress, streak, vocabulary learned, essays submitted, reading/listening accuracy, and weak skills.
* Show recommended next actions.

10. User System

* Login/register.
* User profile includes target IELTS band, current band, exam date, daily available study time, and preferred learning style.
* Save all progress.

11. Admin Panel

* Admin can manage IELTS topics, lessons, vocabulary, reading passages, listening scripts, writing prompts, speaking prompts, grammar lessons, and AI prompt templates.
* Admin can view user progress and app usage statistics.

12. AI Content Generation

* Generate IELTS-style content using AI, but allow admin review/edit before publishing.
* Use structured prompts and store generated content in the database.
* Avoid generating low-quality or repetitive content.

Technical requirements:

* Build with modern, maintainable architecture.
* Frontend: React + TypeScript + Vite + Tailwind CSS.
* Backend: Node.js + TypeScript + NestJS.
* Database: PostgreSQL with Prisma.
* Authentication: email/password and OAuth if possible.
* Use clean folder structure, validation, error handling, logging, and environment config.
* Add API documentation.
* Add unit tests and E2E tests.
* Add seed data for IELTS topics, vocabulary, and sample lessons.
* Add Docker support for local development.
* Make the app responsive for desktop and mobile.
* Make it easy to deploy to VPS or cloud.

Important UX requirements:

* The app must be easy to use every day.
* The homepage should immediately show “Today’s IELTS Plan”.
* The user should not feel overwhelmed.
* Use simple navigation: Dashboard, Daily Plan, Vocabulary, Reading, Listening, Writing, Speaking, Grammar, AI Tutor.
* Every exercise should have clear feedback and explanation.
* The app should encourage consistency, not just provide random lessons.

Please design the full system, database schema, API endpoints, frontend pages, backend modules, and implementation plan. Then implement the app step by step with clean code, tests, and documentation.


## Current Task

### Design REST API Endpoints and Backend Module Structure

Define REST API endpoints for all app features including authentication, daily study plan, vocabulary, reading, listening, writing, speaking, grammar, AI tutor, dashboard, user profile, and admin panel. Design backend module structure in NestJS with clear separation of concerns, validation, error handling, and logging. Document API routes, request/response schemas, and authentication requirements.

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

- Design System and UI/UX Wireframes for IELTS Learning App (done)
- Define Database Schema for IELTS Learning App (done)

## Acceptance Criteria

- API endpoint list with methods and paths documented
- Request and response schemas defined
- Backend module structure diagram and description created

## Validation Commands

```bash
ls docs/api-endpoints.md docs/backend-architecture.md
```

## Expected Outputs

- **Create** `docs/api-endpoints.md`
  - API endpoints documentation with request/response schemas
  - Validation: file_exists

- **Create** `docs/backend-architecture.md`
  - Backend module structure and design document
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
