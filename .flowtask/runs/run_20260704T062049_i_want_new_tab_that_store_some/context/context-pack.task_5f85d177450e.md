# FlowTask Context Pack

## Original User Prompt

i want new tab that store something such as link, ... that user save for study

## Current Task

### Analyze existing saved items storage and retrieval in extension

Investigate how saved items such as vocabulary and phrases are stored and retrieved in the extension, focusing on apps/extension/src/content-script/saveSelectedText.ts and related storage keys like 'savedItems'. Document data structure, storage mechanism, and APIs used.

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

- Clear understanding of savedItems data structure and storage method
- Documented APIs and storage keys used for saved items

## Validation Commands

```bash
ls docs/extension-saved-items-storage.md
```

## Expected Outputs

- **Create** `docs/extension-saved-items-storage.md`
  - Documentation of saved items storage and retrieval in extension
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
