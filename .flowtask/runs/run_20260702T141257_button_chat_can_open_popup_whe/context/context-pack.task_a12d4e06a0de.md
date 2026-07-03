# FlowTask Context Pack

## Original User Prompt

button chat can open popup when the first time i click into it, but the second it dont open

## Current Task

### Modify chat button click handler to toggle popup visibility correctly

Update the chat button click handler logic to properly toggle the popup open state on every click. Ensure that the popup opens on the first click and also opens again if closed and clicked again. Use React state or equivalent UI state management to track popup visibility and toggle it accordingly.

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

- Investigate chat button click handler in popup component (done)

## Acceptance Criteria

- Popup opens on first click
- Popup closes when clicking outside or close button
- Popup opens again on subsequent clicks after closing

## Validation Commands

```bash
pnpm test
```
```bash
pnpm test --filter ChatButton
```

## Expected Outputs

- **Modify** `apps/extension/src/popup/components/ChatButton.tsx`
  - Update click handler to toggle popup visibility state properly
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
