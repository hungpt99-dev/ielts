# FlowTask Context Pack

## Original User Prompt

i want imported word will appear in word tab

## Current Task

### Add integration test for vocabulary import and Word tab update

Create or extend an integration test that imports vocabulary words and verifies that the Word tab UI displays the imported words. This test should simulate the import process and check the rendered output of the Word tab component for the presence of the new words.

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
- Modify Word tab component to listen for vocabulary updates (done)

## Acceptance Criteria

- Integration test covers vocabulary import and Word tab update
- Test passes reliably

## Validation Commands

```bash
pnpm test -- tests/integration/vocabulary-import-wordtab.test.tsx
```

## Expected Outputs

- **Create** `tests/integration/vocabulary-import-wordtab.test.tsx`
  - Integration test for vocabulary import and Word tab UI update
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
