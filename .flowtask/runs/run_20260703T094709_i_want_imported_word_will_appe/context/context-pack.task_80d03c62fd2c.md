# FlowTask Context Pack

## Original User Prompt

i want imported word will appear in word tab

## Current Task

### Modify Word tab component to listen for vocabulary updates

Update the Word tab React component to listen for vocabulary import events or state changes. Implement necessary hooks or subscriptions to the vocabulary store or context so that the component re-renders and displays the updated list of words when new words are imported.

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

- Modify vocabulary import logic to update Word tab state (done)

## Acceptance Criteria

- Word tab updates its displayed word list when vocabulary changes
- No UI regressions in Word tab

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/features/vocabulary/WordTab.tsx`
  - Add state subscription or event listener to update word list on vocabulary import
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
