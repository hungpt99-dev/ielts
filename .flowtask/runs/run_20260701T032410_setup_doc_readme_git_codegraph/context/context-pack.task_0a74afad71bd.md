# FlowTask Context Pack

## Original User Prompt

setup doc readme git, codegraph, ... alligne with software industry standard

## Current Task

### Validate project setup with lint and test commands

Run project linting and testing commands to verify that the project setup including README, Git, and codegraph configuration does not break existing code or tests. Use configured commands such as 'pnpm lint' and 'pnpm test' or equivalent.

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

- Create and align README.md with software industry standards (done)
- Configure Git repository with standard .gitignore and initial commit (done)
- Add CodeGraph configuration for code analysis (done)

## Acceptance Criteria

- Lint command exits with code 0 and no errors
- Test command exits with code 0 and all tests pass

## Validation Commands

```bash
pnpm lint
```
```bash
pnpm test
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
