# FlowTask Context Pack

## Original User Prompt

check all bug css, bug code, bug logic then fix all then selftest

## Current Task

### Fix All Identified Code and Logic Bugs

Apply targeted fixes to all code and logic bugs documented in .flowtask/reports/code-logic-bug-report.md. Modify TypeScript and JavaScript source files to correct function behavior, state management, and runtime errors. Follow existing project coding style and conventions.

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

- Analyze CSS for Visual Bugs in src/styles and Component Styles (done)
- Analyze Code and Logic Bugs in src Directory (done)
- Fix All Identified CSS Bugs (done)

## Acceptance Criteria

- All code and logic bugs from the report are fixed
- Code passes linting and all tests pass without errors

## Validation Commands

```bash
pnpm lint
```
```bash
pnpm test
```
```bash
pnpm lint && pnpm test
```

## Expected Outputs

- **Modify** `src/**/*.ts`
  - Fixed TypeScript source files with corrected logic
  - Validation: file_diff

- **Modify** `src/**/*.tsx`
  - Fixed TSX source files with corrected logic
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
