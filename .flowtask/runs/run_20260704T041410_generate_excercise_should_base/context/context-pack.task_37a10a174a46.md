# FlowTask Context Pack

## Original User Prompt

generate excercise should base on Tasks content and user data, dont generate random excercise and should save excercise for review, and if task topic is speaking should generate speaking then should save excercise speaking, The same applies to the other type.

## Current Task

### Implement Exercise Generation Logic Based on Task Content and User Data

Create a service module src/services/ExerciseGenerator.ts that exports a function generateExercise(task, userData). This function analyzes the task content and user data to generate an exercise matching the task topic and type. It must not generate random exercises unrelated to the task. For example, if the task topic is 'speaking', generate a speaking exercise with relevant prompts and questions. The function should support at least speaking, writing, reading, and listening exercise types, generating content accordingly.

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


## Acceptance Criteria

- generateExercise returns an exercise object matching the task topic and type
- No random unrelated exercises are generated
- Supports speaking, writing, reading, and listening exercise types

## Validation Commands

```bash
pnpm test src/services/ExerciseGenerator.test.ts
```

## Expected Outputs

- **Create** `src/services/ExerciseGenerator.ts`
  - Service module with generateExercise function implementing exercise generation logic based on task content and user data
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
