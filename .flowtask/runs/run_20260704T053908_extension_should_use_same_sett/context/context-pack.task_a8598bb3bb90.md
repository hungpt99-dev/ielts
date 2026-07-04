# FlowTask Context Pack

## Original User Prompt

extension should use same setting with website

## Current Task

### Implement unified settings loading in extension background script

Modify apps/extension/src/background/settingsStorage.ts to load settings from the unified source as per the synchronization strategy. Adjust loadSettings and saveSettings functions to reflect the shared storage or bridge communication with the website. Ensure defaults and schema validation remain intact.

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
- Analyze website settings loading and saving in apps/web/src/services/SettingsStorage.ts (done)
- Design synchronization strategy for extension and website settings (done)

## Acceptance Criteria

- Extension loads settings from unified source
- Settings schema validation preserved
- No regressions in extension settings usage

## Validation Commands

```bash
pnpm lint && pnpm typecheck
```

## Expected Outputs

- **Modify** `apps/extension/src/background/settingsStorage.ts`
  - Unified settings loading and saving logic
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
