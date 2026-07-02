# FlowTask Context Pack

## Original User Prompt

remove icon chat on header bar

## Current Task

### Remove chat icon element from header bar component

Modify the identified header bar component file to remove the chat icon element. This includes deleting the JSX element or component that renders the chat icon, and removing any related imports or styles specific to the chat icon. Ensure no other header bar functionality is affected.

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

- Identify header bar component containing chat icon (done)

## Acceptance Criteria

- Chat icon element is removed from the header bar component JSX
- No references to chat icon remain in the header bar component file
- Header bar renders correctly without the chat icon

## Validation Commands

```bash
pnpm test
```
```bash
pnpm test --filter HeaderBar
```

## Expected Outputs

- **Modify** `src/components/HeaderBar.tsx`
  - Header bar component with chat icon element removed
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
