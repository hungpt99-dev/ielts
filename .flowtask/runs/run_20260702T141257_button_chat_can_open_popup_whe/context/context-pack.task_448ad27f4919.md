# FlowTask Context Pack

## Original User Prompt

button chat can open popup when the first time i click into it, but the second it dont open

## Current Task

### Add unit test for chat button popup toggle behavior

Create or update unit tests for the chat button component to verify that clicking the button toggles the popup open and closed correctly. Test that the popup opens on first click, closes on second click, and reopens on subsequent clicks.

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
- Modify chat button click handler to toggle popup visibility correctly (done)

## Acceptance Criteria

- Unit test covers popup toggle on button clicks
- Test passes successfully

## Validation Commands

```bash
pnpm test --filter ChatButton
```

## Expected Outputs

- **Modify** `apps/extension/src/popup/components/__tests__/ChatButton.test.tsx`
  - Add tests for popup toggle on chat button clicks
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
