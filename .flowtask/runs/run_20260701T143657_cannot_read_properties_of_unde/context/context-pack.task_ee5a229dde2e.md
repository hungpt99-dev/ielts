# FlowTask Context Pack

## Original User Prompt

Cannot read properties of undefined (reading 'slice') in http://localhost:5173/progress

## Current Task

### Analyze /progress page source code for undefined 'slice' usage

Inspect the source code of the /progress page and related components to locate any usage of the 'slice' method on potentially undefined variables. Identify the exact variable and code location causing the error. Document all 'slice' usages and determine which variable can be undefined.

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

- The exact variable and code line causing the 'slice' error is identified
- A list of all 'slice' usages on the /progress page is documented

## Validation Commands

```bash
ls docs/debug/progress-slice-error-analysis.md
```

## Expected Outputs

- **Create** `docs/debug/progress-slice-error-analysis.md`
  - Analysis report of 'slice' usage and error cause on /progress page
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
