# FlowTask Context Pack

## Original User Prompt

use pagination if needed, remove fake data, production ready

## Current Task

### Implement pagination support in data fetching modules

Modify data fetching functions in repositories and services to support pagination parameters such as page number and page size. Update IndexedDB queries or API calls to fetch data in paginated chunks rather than loading all data at once. Ensure that pagination metadata (total count, current page, page size) is returned alongside data. Refactor UI components if necessary to consume paginated data.

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

## Acceptance Criteria

- Data fetching functions accept pagination parameters
- Data is returned in paginated form with metadata
- UI components correctly display paginated data

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/repositories/*`
  - Add pagination parameters and logic to data fetching methods
  - Validation: file_diff

- **Modify** `src/components/*`
  - Update UI components to handle paginated data
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
