# FlowTask Context Pack

## Original User Prompt

Hey when i click Start Next Task it always return this message: Content Not Found

Content not found: Create

## Current Task

### Fix missing or incorrect content key causing 'Content Not Found: Create' error

Based on the investigation, correct the missing or incorrect content key or route parameter that causes the 'Content Not Found: Create' error when starting the next task. This may involve fixing route definitions, content lookup keys, or default values in task creation logic.

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

## Acceptance Criteria

- The 'Content Not Found: Create' error no longer occurs when clicking Start Next Task
- The next task starts correctly with valid content

## Validation Commands

```bash
pnpm test --filter taskExerciseGeneration.test.ts
```

## Expected Outputs

- **Modify** `apps/web/src/components/TaskStartButton.tsx`
  - Fix content key or route parameter usage in Start Next Task button component
  - Validation: file_diff

- **Modify** `apps/web/src/services/taskService.ts`
  - Correct task retrieval or creation logic to use valid content keys
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
