# FlowTask Context Pack

## Original User Prompt

extension should use same setting with website

## Current Task

### Analyze website settings loading and saving in apps/web/src/services/SettingsStorage.ts

Review the website's settings loading and saving logic in apps/web/src/services/SettingsStorage.ts or equivalent. Identify how website settings are stored, loaded, and what keys and defaults are used. Document key functions and storage mechanisms.

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

- Analyze extension settings loading and saving in apps/extension/src/background/settingsStorage.ts (done)

## Acceptance Criteria

- Clear understanding of website settings loading and saving
- List of website settings keys and types
- Identification of storage keys used

## Validation Commands

```bash
ls apps/web/src/services/SettingsStorage.ts && test -f docs/website-settings-analysis.md
```

## Expected Outputs

- **Create** `docs/website-settings-analysis.md`
  - Analysis notes on website settings loading and saving
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
