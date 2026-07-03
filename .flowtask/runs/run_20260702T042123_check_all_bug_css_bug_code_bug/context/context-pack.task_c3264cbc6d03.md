# FlowTask Context Pack

## Original User Prompt

check all bug css, bug code, bug logic then fix all then selftest

## Current Task

### Analyze CSS for Visual Bugs in src/styles and Component Styles

Perform a thorough review of all CSS files and inline styles in src/styles and component directories to identify visual bugs such as layout issues, incorrect colors, spacing, and responsiveness problems. Document all found CSS bugs with file names and line numbers.

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

- All CSS files and inline styles have been reviewed
- A comprehensive list of CSS bugs with locations is documented

## Validation Commands

```bash
ls .flowtask/reports/css-bug-report.md
```

## Expected Outputs

- **Create** `.flowtask/reports/css-bug-report.md`
  - Report listing all identified CSS bugs with file and line references
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
