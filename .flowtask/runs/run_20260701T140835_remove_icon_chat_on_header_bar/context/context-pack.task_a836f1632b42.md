# FlowTask Context Pack

## Original User Prompt

remove icon chat on header bar

## Current Task

### Validate UI renders correctly without chat icon

Run UI tests and perform visual verification to ensure the header bar renders correctly without the chat icon and no layout or functionality regressions occur. This includes running unit tests, integration tests, and optionally manual UI inspection.

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

- Identify header bar component containing chat icon (done)
- Remove chat icon element from header bar component (done)

## Acceptance Criteria

- All relevant UI tests pass
- Header bar displays correctly without chat icon
- No console errors or warnings related to header bar

## Validation Commands

```bash
pnpm test --filter HeaderBar
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
