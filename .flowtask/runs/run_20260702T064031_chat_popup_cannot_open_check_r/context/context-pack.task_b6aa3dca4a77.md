# FlowTask Context Pack

## Original User Prompt

chat popup cannot open, check rootcause then fix all

## Current Task

### Check extension manifest and permissions related to popup in apps/extension/manifest.json

Review the extension manifest file apps/extension/manifest.json to verify that the popup is correctly declared and that necessary permissions are granted. Identify any misconfigurations that could prevent the popup from opening.

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

- Analyze chat popup entry point in apps/extension/popup.html and /src/popup/main.tsx (done)
- Investigate chat popup React component and state management in src/popup/main.tsx and related files (done)

## Acceptance Criteria

- Manifest declares popup correctly
- Required permissions for popup operation are present

## Validation Commands

```bash
ls apps/extension/manifest.json
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
