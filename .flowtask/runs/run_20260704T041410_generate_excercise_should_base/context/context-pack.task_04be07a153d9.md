# FlowTask Context Pack

## Original User Prompt

generate excercise should base on Tasks content and user data, dont generate random excercise and should save excercise for review, and if task topic is speaking should generate speaking then should save excercise speaking, The same applies to the other type.

## Current Task

### Add End-to-End Tests for Exercise Generation and Saving on Task Completion

Create or extend e2e test suite (e.g., tests/e2e/taskExerciseGeneration.test.ts) to simulate completing tasks with different topics (speaking, writing, reading, listening). Verify that after task completion, the correct exercise type is generated and saved in the database. Use test utilities to query IndexedDB and confirm saved exercises. Include tests for speaking topic generating speaking exercises saved correctly.

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
- Create Unit Tests for Exercise Generation and Saving Functions (done)
- Integrate Exercise Generation and Saving into Task Completion Workflow (done)

## Acceptance Criteria

- E2E tests cover all supported task topics
- Exercises are generated and saved correctly after task completion
- Speaking topic tasks generate and save speaking exercises

## Validation Commands

```bash
pnpm test tests/e2e/taskExerciseGeneration.test.ts
```

## Expected Outputs

- **Create** `tests/e2e/taskExerciseGeneration.test.ts`
  - End-to-end tests for exercise generation and saving triggered by task completion
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
