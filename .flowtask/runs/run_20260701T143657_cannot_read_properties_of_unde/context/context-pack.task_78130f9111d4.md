# FlowTask Context Pack

## Original User Prompt

Cannot read properties of undefined (reading 'slice') in http://localhost:5173/progress

## Current Task

### Fix undefined variable causing 'slice' error in /progress page component

Based on the analysis report, modify the /progress page component and related code to ensure the variable on which 'slice' is called is always defined or safely accessed. Add default values or conditional checks as needed to prevent runtime errors.

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

- Analyze /progress page source code for undefined 'slice' usage (done)

## Acceptance Criteria

- The 'slice' method is never called on undefined variables in the /progress page code
- Code changes follow existing project style and conventions
- Code passes lint and type checks

## Validation Commands

```bash
npm run lint
```
```bash
npm run typecheck
```
```bash
npm run lint && npm run typecheck
```

## Expected Outputs

- **Modify** `src/pages/ProgressPage.tsx`
  - Fix variable usage to prevent undefined 'slice' error
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
