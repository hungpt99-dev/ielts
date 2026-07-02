# FlowTask Context Pack

## Original User Prompt

Additional requirement: User Data Collection and Local Browser Database

The website must allow users to manually collect, input, manage, import, and export their own learning data. All user data must be saved locally in the browser database. Do not use any backend.

User can add and manage data such as:

* IELTS topics
* Vocabulary words
* Example sentences
* Grammar notes
* Reading passages
* Listening transcripts
* Writing prompts
* Speaking questions
* Mistakes
* Study notes
* Daily learning tasks
* Custom study plans
* Useful phrases
* AI-generated content
* Personal progress records

Each feature page should allow the user to:

* Add new data
* Edit existing data
* Delete data
* Search data
* Filter data
* Tag data by topic, skill, difficulty, or status
* Mark data as favorite, difficult, learned, or needs review

Local database requirements:

* Use IndexedDB as the main browser database.
* Use Dexie.js or another clean IndexedDB wrapper.
* Use localStorage only for small settings.
* Data must persist after page refresh and browser restart.
* Design clean database tables/models.
* Add database versioning and migration support.
* Validate imported data before saving.
* Prevent app crash from corrupted local data.
* Show clear error messages when import/export fails.

Import/export requirements:

* Export all user data as a JSON backup file.
* Import data from a JSON backup file.
* Allow partial import by feature if possible.
* Support merge mode and replace mode:

  * Merge mode keeps existing data and adds imported data.
  * Replace mode clears existing data and restores imported data.
* Show confirmation before replacing data.
* Show import summary: added, updated, skipped, failed.
* Add reset all data option with confirmation.
* Make the backup format versioned for future compatibility.

UX requirements:

* Provide a Data Management page in Settings.
* Add buttons for Export Backup, Import Backup, Reset Data.
* Add friendly empty states encouraging users to add their own learning material.
* Make forms simple, fast, and mobile-friendly.
* Add autosave where useful, especially for writing drafts and notes.
* Add toast notifications after save, update, delete, import, and export actions.

Important:

* No backend.
* No cloud sync.
* No account system.
* All learning data belongs to the user and stays in their browser unless they export it manually.


## Current Task

### Design IndexedDB schema and Dexie.js models for all user data types

Create a new database schema using Dexie.js in src/services/storage/Database.ts that includes tables for IELTS topics, vocabulary words, example sentences, grammar notes, reading passages, listening transcripts, writing prompts, speaking questions, mistakes, study notes, daily learning tasks, custom study plans, useful phrases, AI-generated content, and personal progress records. Define appropriate fields, indexes, and relationships. Add versioning and migration support for future schema changes.

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


## Acceptance Criteria

- Database schema covers all required user data types
- Versioning and migration logic is implemented
- Dexie.js models are defined with indexes for search and filtering

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/services/storage/Database.ts`
  - Dexie.js database schema and models for user data
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
