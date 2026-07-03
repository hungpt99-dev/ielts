# FlowTask Context Pack

## Original User Prompt

chat popup cannot open, check rootcause then fix all

## Current Task

### Analyze chat popup entry point in apps/extension/popup.html and /src/popup/main.tsx

Inspect apps/extension/popup.html and the referenced /src/popup/main.tsx entry script to understand how the chat popup is initialized and rendered. Identify any missing or misconfigured elements that could prevent the popup from opening.

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

- Clear understanding of popup initialization flow
- Identification of any missing or misconfigured elements in popup.html or main.tsx

## Validation Commands

```bash
ls apps/extension/popup.html src/popup/main.tsx
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
