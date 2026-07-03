# FlowTask Context Pack

## Original User Prompt

check all bug css, bug code, bug logic then fix all then selftest

## Current Task

### Run Full Self-Test Suite to Verify Bug Fixes

Execute the full test suite using pnpm test to verify that all bug fixes for CSS, code, and logic are effective and no regressions exist. Confirm all tests pass successfully.

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
- Fix All Identified Code and Logic Bugs (done)

## Acceptance Criteria

- All tests pass with exit code 0
- No new test failures or errors occur

## Validation Commands

```bash
pnpm test
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
