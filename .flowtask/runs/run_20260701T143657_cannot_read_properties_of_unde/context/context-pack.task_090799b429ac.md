# FlowTask Context Pack

## Original User Prompt

Cannot read properties of undefined (reading 'slice') in http://localhost:5173/progress

## Current Task

### Add unit test to cover slice usage in /progress page component

Create or update unit tests for the /progress page component to cover cases where the variable used with 'slice' might be undefined or empty. Ensure tests verify that the component renders without errors in these edge cases.

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

- Analyze /progress page source code for undefined 'slice' usage (done)
- Fix undefined variable causing 'slice' error in /progress page component (done)

## Acceptance Criteria

- Unit tests cover edge cases for slice usage
- Tests pass without errors
- Test coverage for /progress page component is improved or maintained

## Validation Commands

```bash
npm run test -- --coverage
```

## Expected Outputs

- **Modify** `src/pages/__tests__/ProgressPage.test.tsx`
  - Add tests for safe slice usage and undefined variable handling
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
