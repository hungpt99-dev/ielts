# FlowTask Context Pack

## Original User Prompt

Build a full-featured IELTS learning journey website that runs completely in the browser.

This is NOT a backend SaaS app. Do not build a server, backend API, admin panel, login system, cloud database, or multi-user system.

The app should be a powerful personal IELTS study website for one user, using only frontend technology and browser storage.

Tech stack:

* React
* TypeScript
* Vite
* Tailwind CSS
* IndexedDB for main browser database
* localStorage only for small settings
* PWA support if possible
* No backend
* No authentication
* No server API
* No cloud database
* Must work offline after loading
* Must be deployable to Cloudflare Pages, Vercel, Netlify, or GitHub Pages

Main goal:
Create a complete personal IELTS learning system that helps me study every day, track progress, review weak points, learn vocabulary in context, and prepare for IELTS Listening, Reading, Writing, Speaking, Grammar, and Vocabulary.

Core features:

1. Dashboard

* Show today’s IELTS plan
* Show study streak
* Show weekly study progress
* Show total study hours
* Show target band
* Show current estimated level
* Show weak skills
* Show upcoming review tasks
* Show today’s recommended focus
* Show motivational progress summary

2. Daily Study Planner

* Create daily study tasks manually
* Generate suggested daily plan based on settings
* Task categories:

  * Vocabulary
  * Reading
  * Listening
  * Writing Task 1
  * Writing Task 2
  * Speaking Part 1
  * Speaking Part 2
  * Speaking Part 3
  * Grammar
  * Mock Test
* Mark task as done
* Add notes to each task
* Track completion history
* Support recurring tasks
* Support weekly study schedule

3. IELTS Goal Settings

* Set target band
* Set current estimated band
* Set exam date
* Set daily available study time
* Set weak skills
* Set preferred topics
* Set study reminder text
* Store all settings locally

4. Vocabulary Notebook

* Add vocabulary manually
* Fields:

  * word
  * meaning
  * Vietnamese meaning
  * pronunciation
  * part of speech
  * IELTS topic
  * example sentence
  * collocations
  * synonyms
  * antonyms
  * word family
  * personal note
  * difficulty level
  * status: new / learning / reviewing / mastered
* Search vocabulary
* Filter by topic, status, difficulty
* Mark difficult words
* Mark mastered words
* Add tags
* Show vocabulary statistics

5. Vocabulary Review System

* Simple spaced repetition system using IndexedDB
* Daily review queue
* Review modes:

  * word to meaning
  * meaning to word
  * example sentence gap-fill
  * collocation recall
* Buttons:

  * Again
  * Hard
  * Good
  * Easy
* Automatically update next review date
* Track review history

6. Vocabulary in Context

* User can create short passages using saved words
* User can paste IELTS passages and highlight new words
* Save words from reading/listening notes into vocabulary notebook
* Link vocabulary to Reading, Listening, Writing, and Speaking practice
* Help the user learn words through example sentences, collocations, and repeated context, not only isolated word memorization

7. Reading Practice Journal

* Save IELTS reading practice sessions
* Fields:

  * title
  * IELTS topic
  * source URL
  * passage text
  * question type
  * total questions
  * correct answers
  * accuracy
  * time spent
  * new vocabulary
  * summary
  * mistakes
  * notes
* Support question types:

  * True / False / Not Given
  * Matching Headings
  * Multiple Choice
  * Sentence Completion
  * Summary Completion
  * Matching Information
* Track reading speed and accuracy
* Show reading progress over time

8. Listening Practice Journal

* Save listening practice sessions
* Fields:

  * title
  * source URL
  * IELTS topic
  * duration
  * listening section
  * score
  * transcript notes
  * new vocabulary
  * difficult sentences
  * mistakes
  * shadowing notes
  * self-rating
* Track listening time
* Track listening accuracy
* Save transcript snippets
* Review difficult words from listening

9. Writing Practice Log

* Support IELTS Writing Task 1 and Task 2
* Save writing practice entries
* Fields:

  * task type
  * question
  * essay
  * topic
  * word count
  * time spent
  * estimated band
  * feedback
  * grammar mistakes
  * vocabulary mistakes
  * coherence notes
  * improved sentences
  * better essay version
  * personal reflection
* Show writing history
* Compare old and improved versions
* Track common mistakes
* Track estimated band over time

10. Speaking Practice Log

* Support IELTS Speaking Part 1, Part 2, and Part 3
* Save speaking practice entries
* Fields:

  * part
  * question
  * answer notes
  * topic
  * duration
  * self-rating
  * fluency notes
  * vocabulary notes
  * grammar mistakes
  * pronunciation notes
  * better expressions
  * improved answer
* Add cue card timer for Part 2
* Track speaking practice history
* Track common speaking mistakes

11. Grammar Notebook

* Create grammar notes
* Fields:

  * grammar topic
  * explanation
  * example sentences
  * common mistakes
  * corrected examples
  * personal note
  * related IELTS skill
* Add grammar quiz notes manually
* Track grammar topics learned
* Mark grammar topics as weak / reviewing / mastered

12. Mistake Notebook

* Central place to save all mistakes
* Mistake types:

  * vocabulary
  * grammar
  * reading
  * listening
  * writing
  * speaking
* Fields:

  * mistake
  * correction
  * explanation
  * source
  * date
  * skill
  * status
* Review mistakes regularly
* Show most repeated mistakes

13. IELTS Topics Library

* Built-in IELTS topic list:

  * Education
  * Technology
  * Environment
  * Health
  * Work
  * Business
  * Travel
  * Culture
  * Society
  * Crime
  * Government
  * Media
  * Globalization
  * Family
  * Housing
  * Transport
  * Art
  * Sports
  * Science
* Each topic should show:

  * saved vocabulary
  * reading sessions
  * listening sessions
  * writing essays
  * speaking answers
  * weak points

14. Mock Test Tracker

* Save IELTS mock test results
* Fields:

  * date
  * listening score
  * reading score
  * writing band
  * speaking band
  * overall band
  * notes
  * weak areas
  * next improvement plan
* Show band progress over time

15. Progress Analytics

* Charts for:

  * study days per week
  * study hours per week
  * vocabulary learned
  * vocabulary reviewed
  * reading accuracy
  * listening score
  * writing band trend
  * speaking self-rating trend
  * mock test band trend
* Show skill balance
* Show weak skill ranking
* Show monthly summary

16. Review Center

* Show what needs review today:

  * vocabulary due today
  * difficult words
  * grammar weak points
  * repeated mistakes
  * old essays to review
  * old speaking answers to improve
* Help user avoid forgetting

17. Search

* Global search across:

  * vocabulary
  * reading notes
  * listening notes
  * writing essays
  * speaking answers
  * grammar notes
  * mistakes
* Support filters by skill, topic, date, difficulty, and status

18. Import / Export Backup

* Export all app data to JSON
* Import data from JSON
* Warn before overwriting data
* Support automatic local backup download if possible
* This is required because there is no backend account

19. Local Data Management

* Use IndexedDB with a clean data layer
* Create schema versioning / migration system
* Support clearing all data
* Support sample data reset
* Handle database errors gracefully
* Keep data safe and easy to back up

20. Optional AI Helper Without Backend

* No backend should be built
* If AI is included, make it optional
* User can paste their own API key in Settings and store it locally in browser storage
* AI features should work only from the browser
* AI helper can:

  * explain vocabulary
  * generate example sentences
  * give writing feedback
  * suggest better speaking answers
  * explain grammar mistakes
  * generate daily study suggestions
* The app must still work fully without AI

21. UI / UX Requirements

* Clean, simple, modern interface
* Mobile responsive
* Fast and lightweight
* Easy to use every day
* Not overwhelming
* Main navigation:

  * Dashboard
  * Daily Plan
  * Vocabulary
  * Review
  * Reading
  * Listening
  * Writing
  * Speaking
  * Grammar
  * Mistakes
  * Mock Tests
  * Progress
  * Settings
* Homepage should immediately show “Today’s IELTS Plan”
* Use cards, charts, filters, and simple forms
* Support dark mode
* Add empty states and helpful examples

22. Code Quality

* Clean TypeScript types
* Reusable components
* Clean folder structure
* Separate UI, data access, utilities, hooks, and types
* Use proper form validation
* Use error boundaries
* Add loading and empty states
* Avoid over-engineering
* No unnecessary dependencies
* Add unit tests for important logic
* Add simple E2E tests for main flows

23. Suggested Pages

* Dashboard page
* Daily Plan page
* Vocabulary page
* Vocabulary Review page
* Reading Journal page
* Listening Journal page
* Writing Practice page
* Speaking Practice page
* Grammar Notes page
* Mistake Notebook page
* Mock Test Tracker page
* IELTS Topics page
* Progress Analytics page
* Settings page
* Import / Export page

24. Seed Data
    Add useful starter data:

* IELTS topics
* sample daily tasks
* sample vocabulary words
* sample grammar topics
* sample writing prompts
* sample speaking questions
* sample mock test entry

Important:
This app should feel like my personal IELTS learning operating system. It should be full-featured but still frontend-only. Do not create a backend. Do not create login. Do not create cloud database. Everything should run in the browser and store data locally using IndexedDB.

Please design the complete app architecture, folder structure, IndexedDB schema, TypeScript models, UI pages, components, data flow, and implementation plan. Then implement it step by step with clean code.


## Current Task

### Add seed data for IELTS topics, sample tasks, vocabulary, grammar, writing, speaking, and mock tests

Create a seed data module in src/data/seed.ts exporting sample data for IELTS topics, daily tasks, vocabulary words, grammar topics, writing prompts, speaking questions, and mock test entries. Integrate seed data loading into IndexedDB on first app launch or reset. Provide scripts or UI option to reset sample data. Ensure seed data covers all core app features for initial user experience.

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

- Design app architecture, folder structure, and data schema (done)
- Initialize Vite React TypeScript project with Tailwind CSS and PWA support (done)
- Implement IndexedDB data layer with schema versioning and migration (done)
- Create reusable UI components and layout system with Tailwind CSS (done)
- Implement Dashboard page with study summary cards and charts (done)
- Implement Daily Study Planner page with task CRUD and recurring support (done)
- Implement IELTS Goal Settings page with localStorage persistence (done)
- Implement Vocabulary Notebook page with full CRUD and filtering (done)
- Implement Vocabulary Review System with spaced repetition (done)
- Implement Reading Practice Journal page with session tracking (done)
- Implement Listening Practice Journal page with session tracking (done)
- Implement Writing Practice Log page with version comparison and feedback (done)
- Implement Speaking Practice Log page with cue card timer and feedback (done)
- Implement Grammar Notebook page with notes and quiz support (done)
- Implement Mistake Notebook page with mistake tracking and review (done)
- Implement Mock Test Tracker page with band progress visualization (done)
- Implement Progress Analytics page with charts and summaries (done)
- Implement Review Center page showing all due review items (done)
- Implement Global Search page with filters across all data types (done)
- Implement Import/Export Backup page with JSON data handling (done)

## Acceptance Criteria

- Seed data covers all specified entities
- Seed data loads correctly into IndexedDB on first launch
- Reset sample data option works
- Seed data enables meaningful initial app usage

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/data/seed.ts`
  - Seed data for IELTS topics and sample entries
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
