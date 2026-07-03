# FlowTask Context Pack

## Original User Prompt

Database is closed. Call getDb() to open a connection first. check root cause then fix all

## Current Task

### Run full test suite to validate no regressions after DB connection fixes

Execute the full project test suite to ensure that the fixes for the 'Database is closed' error did not introduce regressions or break other functionality. Confirm all tests pass cleanly.

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

- Analyze Database connection lifecycle in apps/web/src/services/storage/Database.ts (done)
- Identify all usages of database access in the project to find improper getDb() calls (done)
- Fix improper database usage by enforcing getDb() call before any DB access (done)
- Add defensive checks in Database.ts to prevent DB usage when closed (done)
- Add unit tests to verify getDb() opens DB and prevents closed DB usage (done)

## Acceptance Criteria

- All tests pass without errors or failures

## Validation Commands

```bash
pnpm test
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
