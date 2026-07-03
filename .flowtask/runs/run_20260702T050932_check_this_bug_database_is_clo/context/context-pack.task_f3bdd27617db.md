# FlowTask Context Pack

## Original User Prompt

check this bug Database is closed. Call getDb() to open a connection first., check again css bug related to color, theme

## Current Task

### Fix CSS Color and Theme Bugs Based on Audit Findings

Apply fixes to CSS files and component styles to resolve the color and theme bugs identified in the audit. Replace any hard-coded colors with design token CSS variables. Ensure dark and light themes switch colors correctly. Test UI visually and with automated tests if available.

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

- Investigate and Fix 'Database is closed' Error in IndexedDB Access (done)
- Audit CSS Theme Colors and Variables for Consistency (done)

## Acceptance Criteria

- No hard-coded colors remain in styles
- Theme colors update correctly on theme toggle
- UI color bugs reported previously are resolved

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/styles/theme.css`
  - Fix color variables and theme styles
  - Validation: file_diff

- **Modify** `src/components/**/*.tsx`
  - Replace hard-coded colors with CSS variables in components
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
