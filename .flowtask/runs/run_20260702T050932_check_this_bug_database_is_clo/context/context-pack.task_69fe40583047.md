# FlowTask Context Pack

## Original User Prompt

check this bug Database is closed. Call getDb() to open a connection first., check again css bug related to color, theme

## Current Task

### Audit CSS Theme Colors and Variables for Consistency

Review the CSS theme system files, especially apps/web/src/styles/theme.css and packages/theme/src/tokens.ts, to identify any inconsistencies or bugs related to color variables and theme switching. Check for hard-coded colors in components that violate the design token system. Document any issues found for fixing.

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

## Acceptance Criteria

- All colors use CSS variables from the design token system
- No hard-coded color values remain in component styles
- Theme switching (light/dark) works correctly with color changes

## Validation Commands

```bash
ls docs/css-theme-color-audit.md
```

## Expected Outputs

- **Create** `docs/css-theme-color-audit.md`
  - Audit report listing CSS color and theme variable inconsistencies and bugs
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
