# FlowTask Context Pack

## Original User Prompt

Hey when i click Start Next Task it always return this message: Content Not Found

Content not found: Create

## Current Task

### Add automated test for Start Next Task button to prevent 'Content Not Found' errors

Create or extend an end-to-end test in apps/web/tests/e2e/taskExerciseGeneration.test.ts to simulate clicking the Start Next Task button and verify that no 'Content Not Found' errors occur and the next task content loads correctly.

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

- Investigate error source for 'Content Not Found: Create' in task start flow (done)
- Fix missing or incorrect content key causing 'Content Not Found: Create' error (done)

## Acceptance Criteria

- Test simulates Start Next Task button click
- Test asserts no 'Content Not Found' error is thrown
- Test verifies next task content is loaded

## Validation Commands

```bash
pnpm test --filter taskExerciseGeneration.test.ts
```

## Expected Outputs

- **Modify** `apps/web/tests/e2e/taskExerciseGeneration.test.ts`
  - Add e2e test case for Start Next Task button functionality
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
