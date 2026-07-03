# FlowTask Context Pack

## Original User Prompt

i want imported word will appear in word tab

## Current Task

### Modify vocabulary import logic to update Word tab state

Update the vocabulary import function to trigger an update or refresh of the Word tab's displayed word list. This involves modifying the import handler to dispatch an event or update the relevant React state/store that the Word tab listens to, ensuring the newly imported words appear immediately.

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

- Imported words trigger a UI update in the Word tab
- No regression in vocabulary import functionality

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/features/vocabulary/VocabularyImport.tsx`
  - Update import handler to notify Word tab of new words
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
