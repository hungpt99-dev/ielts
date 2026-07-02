# FlowTask Context Pack

## Original User Prompt

complete topics and progress

## Current Task

### Add Unit and Integration Tests for Topics Progress Features

Write comprehensive unit tests for the topicsProgress data model, database service methods, and UI components (TopicsProgress.tsx and Progress.tsx enhancements). Include integration tests to verify data flow from storage to UI. Use mocks and fixtures to simulate various progress states and edge cases.

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

- Complete Topic Progress Data Model and Storage Integration (done)
- Implement Topics Progress UI Component in src/pages/TopicsProgress.tsx (done)
- Enhance Progress Page Data Aggregation and Visualization (done)

## Acceptance Criteria

- Unit tests cover all new data model and service methods
- UI component tests cover rendering and user interactions
- Integration tests verify end-to-end data flow
- Test coverage for topics progress features is above 90%

## Validation Commands

```bash
pnpm test
```
```bash
pnpm test -- --coverage
```

## Expected Outputs

- **Modify** `src/pages/TopicsProgress.test.tsx`
  - Add tests for TopicsProgress component
  - Validation: file_exists

- **Modify** `src/pages/Progress.test.tsx`
  - Add tests for Progress page enhancements
  - Validation: file_diff

- **Modify** `src/services/storage/Database.test.ts`
  - Add tests for topicsProgress database methods
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
