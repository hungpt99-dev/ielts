# FlowTask Context Pack

## Original User Prompt

generate excercise should base on Tasks content and user data, dont generate random excercise and should save excercise for review, and if task topic is speaking should generate speaking then should save excercise speaking, The same applies to the other type.

## Current Task

### Integrate Exercise Generation and Saving into Task Completion Workflow

Modify the task completion handler module (e.g., src/components/TaskCompletionHandler.ts or relevant service) to invoke generateExercise with the completed task and current user data, then call saveExercise to persist the generated exercise. Ensure that if the task topic is 'speaking', the generated exercise is a speaking exercise and saved accordingly. Add error handling and logging for generation and saving failures.

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

## Acceptance Criteria

- Exercise generation and saving triggered on task completion
- Exercise type matches task topic
- Errors in generation or saving are handled gracefully

## Validation Commands

```bash
pnpm test src/components/__tests__/TaskCompletionHandler.test.ts
```

## Expected Outputs

- **Modify** `src/components/TaskCompletionHandler.ts`
  - Invoke exercise generation and saving on task completion
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
