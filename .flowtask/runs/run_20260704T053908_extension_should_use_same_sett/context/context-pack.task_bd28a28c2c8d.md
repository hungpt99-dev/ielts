# FlowTask Context Pack

## Original User Prompt

extension should use same setting with website

## Current Task

### Perform manual testing of extension and website settings synchronization

Manually test the extension and website to verify that settings changes in one are reflected in the other. Test themeMode, AI provider, toolbar visibility, and other key settings. Verify persistence across reloads and browser restarts.

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
- Implement unified settings loading in extension background script (done)
- Implement unified settings loading in website settings service (done)
- Implement communication bridge for settings synchronization between extension and website (done)
- Add unit tests for extension settings loading and saving with unified source (done)
- Add unit tests for website settings loading and saving with unified source (done)

## Acceptance Criteria

- Settings changes in extension reflect in website immediately or on reload
- Settings changes in website reflect in extension immediately or on reload
- No errors or warnings in console
- Settings persist after browser restart

## Validation Commands

```bash
test -f docs/manual-testing-settings-sync.md
```

## Expected Outputs

- **Create** `docs/manual-testing-settings-sync.md`
  - Manual testing report for settings synchronization
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
