# FlowTask Context Pack

## Original User Prompt

I want the generated exercises to be much longer and include more questions.


## Current Task

### Add automated tests for new listening question types and expanded exercises

Create or update unit and integration tests to cover the new question types and the expanded listening exercises. Include tests for question rendering, user interaction, and validation logic.

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

- Analyze current listening exercises structure in apps/web/src/features/listening/data/exercises.ts (done)
- Design additional question templates for listening exercises (done)
- Expand existing listening exercises with additional questions in apps/web/src/features/listening/data/exercises.ts (done)
- Update listening exercise rendering components to support new question types (done)

## Acceptance Criteria

- Tests cover all new question types
- Tests verify correct rendering and interaction
- Test coverage for listening exercises increased
- All tests pass

## Validation Commands

```bash
pnpm test --coverage
```
```bash
pnpm test --filter listening
```

## Expected Outputs

- **Modify** `apps/web/src/features/listening/__tests__/ListeningExercise.test.tsx`
  - Added tests for new question types and expanded exercises
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
