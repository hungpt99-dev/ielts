# FlowTask Context Pack

## Original User Prompt

generate excercise should base on Tasks content and user data, dont generate random excercise and should save excercise for review, and if task topic is speaking should generate speaking then should save excercise speaking, The same applies to the other type.

## Current Task

### Create Unit Tests for Exercise Generation and Saving Functions

Create test file src/services/__tests__/ExerciseGenerator.test.ts with unit tests covering generateExercise and saveExercise functions. Tests should verify that exercises generated match the task topic and type, no random exercises are generated, and that saving functions persist exercises correctly in the appropriate IndexedDB stores. Use mock data for tasks and user data. Include tests for speaking exercise generation and saving specifically.

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

- Implement Exercise Generation Logic Based on Task Content and User Data (done)
- Add Exercise Saving Functionality for Different Exercise Types (done)

## Acceptance Criteria

- Tests cover all supported exercise types
- Tests verify correct saving to IndexedDB stores
- Tests confirm no unrelated exercises are generated

## Validation Commands

```bash
pnpm test src/services/__tests__/ExerciseGenerator.test.ts
```

## Expected Outputs

- **Create** `src/services/__tests__/ExerciseGenerator.test.ts`
  - Unit tests for exercise generation and saving logic
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
