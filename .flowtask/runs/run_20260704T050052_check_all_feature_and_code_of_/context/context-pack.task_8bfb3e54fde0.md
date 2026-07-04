# FlowTask Context Pack

## Original User Prompt

check all feature and code of extension, ensure it work correctly, if not please fix with high code quality, deisgn pattern, best practice, production ready

## Current Task

### Refactor Highlighting Logic in apps/extension/src/content-script/highlighter/

Refactor the highlightEngine.ts, highlightMatcher.ts, highlightTooltip.ts, and highlightStyles.ts files to improve code quality, modularity, and maintainability. Apply design patterns such as separation of concerns and encapsulation. Ensure no performance regressions and maintain existing functionality.

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

## Acceptance Criteria

- Highlighting logic refactored with improved code structure
- No regressions in highlight functionality
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

- **Modify** `apps/extension/src/content-script/highlighter/highlightEngine.ts`
  - Refactored highlight engine logic
  - Validation: file_diff

- **Modify** `apps/extension/src/content-script/highlighter/highlightMatcher.ts`
  - Improved highlight matching logic
  - Validation: file_diff

- **Modify** `apps/extension/src/content-script/highlighter/highlightTooltip.ts`
  - Refactored tooltip display logic
  - Validation: file_diff

- **Modify** `apps/extension/src/content-script/highlighter/highlightStyles.ts`
  - Improved highlight styles management
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
