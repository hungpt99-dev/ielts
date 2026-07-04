# FlowTask Context Pack

## Original User Prompt

generate excercise should base on Tasks content and user data, dont generate random excercise and should save excercise for review, and if task topic is speaking should generate speaking then should save excercise speaking, The same applies to the other type.

## Current Task

### Add Exercise Saving Functionality for Different Exercise Types

Extend src/services/ExerciseGenerator.ts to include functions saveExercise(exercise) that saves generated exercises into the appropriate IndexedDB tables based on exercise type. For speaking exercises, save to 'speakingExercises' store; for writing, save to 'writingExercises'; for reading, save to 'readingExercises'; for listening, save to 'listeningExercises'. Implement logic to create or update existing exercises for review. Use existing database repositories or create new ones if needed.

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

## Acceptance Criteria

- saveExercise correctly saves exercises to the correct IndexedDB store by type
- Supports create and update operations for exercises
- Speaking exercises are saved to speakingExercises store

## Validation Commands

```bash
pnpm test src/services/ExerciseGenerator.test.ts
```

## Expected Outputs

- **Modify** `src/services/ExerciseGenerator.ts`
  - Add saveExercise function to save exercises by type into IndexedDB
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
