# FlowTask Context Pack

## Original User Prompt

check this bug Database is closed. Call getDb() to open a connection first., check again css bug related to color, theme

## Current Task

### Investigate and Fix 'Database is closed' Error in IndexedDB Access

Analyze the database connection handling in the storage layer (likely in packages/storage/src/) to identify why 'Database is closed. Call getDb() to open a connection first.' error occurs. Modify the code to ensure getDb() is called before any database operations, and that the connection is properly opened and reused. Add error handling to prevent operations on a closed database.

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

- No 'Database is closed' error occurs during normal app usage
- Database connection is opened before any DB operation
- Code handles closed DB gracefully without crashing

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `packages/storage/src/index.ts`
  - Fix database connection initialization and usage to prevent closed DB errors
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
