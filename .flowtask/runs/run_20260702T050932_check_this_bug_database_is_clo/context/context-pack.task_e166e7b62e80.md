# FlowTask Context Pack

## Original User Prompt

check this bug Database is closed. Call getDb() to open a connection first., check again css bug related to color, theme

## Current Task

### Validate Database and Theme Bug Fixes with Automated Tests

Run the full test suite to validate that the database connection fix and CSS theme color fixes do not introduce regressions. Include any UI snapshot or visual regression tests if configured. Confirm no errors or warnings related to database or CSS appear.

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

- Investigate and Fix 'Database is closed' Error in IndexedDB Access (done)
- Audit CSS Theme Colors and Variables for Consistency (done)
- Fix CSS Color and Theme Bugs Based on Audit Findings (done)

## Acceptance Criteria

- All tests pass without errors
- No database connection errors occur during tests
- No CSS or theme related warnings or errors appear

## Validation Commands

```bash
pnpm test
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
