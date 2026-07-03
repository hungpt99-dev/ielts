# FlowTask Context Pack

## Original User Prompt

use pagination if needed, remove fake data, production ready

## Current Task

### Validate production readiness by running full test suite and manual data checks

Run the full test suite to ensure no regressions after removing fake data and adding pagination. Manually verify that the application loads real data correctly and paginates data in the UI without errors. Check performance and memory usage to confirm improvements. Document any issues found for further fixes.

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

- Remove all fake data seeding from the application (done)
- Implement pagination support in data fetching modules (done)

## Acceptance Criteria

- All tests pass without errors
- Application loads real data correctly
- Pagination works smoothly in UI
- No performance regressions observed

## Validation Commands

```bash
pnpm test
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
