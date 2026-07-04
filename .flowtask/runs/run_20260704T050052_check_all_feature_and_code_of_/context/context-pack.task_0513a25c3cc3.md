# FlowTask Context Pack

## Original User Prompt

check all feature and code of extension, ensure it work correctly, if not please fix with high code quality, deisgn pattern, best practice, production ready

## Current Task

### Improve Popup UI Components and Hooks for Performance and Code Quality

Refactor popup components under apps/extension/src/popup/components/ and hooks/usePopupData.ts to improve performance, code clarity, and maintainability. Apply React best practices, memoization, and proper state management.

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

- Analyze Browser Extension Architecture and Feature Modules (done)
- Run Static Code Analysis and Complexity Checks on Extension Source (done)
- Identify and Document Functional Bugs in Extension Features (done)
- Refactor Highlighting Logic in apps/extension/src/content-script/highlighter/ (done)
- Fix Background Service Worker Messaging and Storage Bridge Logic (done)

## Acceptance Criteria

- Popup UI components refactored with improved code quality
- No regressions in popup functionality
- Code passes lint and type checks

## Validation Commands

```bash
pnpm lint
```
```bash
pnpm typecheck
```
```bash
pnpm lint && pnpm typecheck
```

## Expected Outputs

- **Modify** `apps/extension/src/popup/components/DashboardCard.tsx`
  - Improved DashboardCard component
  - Validation: file_diff

- **Modify** `apps/extension/src/popup/components/QuickAddVocab.tsx`
  - Refactored QuickAddVocab component
  - Validation: file_diff

- **Modify** `apps/extension/src/popup/hooks/usePopupData.ts`
  - Optimized usePopupData hook
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
