# FlowTask Context Pack

## Original User Prompt

setup doc readme git, codegraph, ... alligne with software industry standard

## Current Task

### Initialize and configure git repository with standard .gitignore and commit guidelines

Initialize git repo if not already done. Create or update .gitignore with standard Node.js ignores and IDE/editor files. Add commit message guidelines in CONTRIBUTING.md or docs/commit-guidelines.md.

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

- Create standardized README.md with project overview and setup instructions (done)

## Acceptance Criteria

- Git repository is initialized
- .gitignore file exists with standard Node.js and editor ignores
- Commit guidelines document exists with clear instructions

## Validation Commands

```bash
git status
```
```bash
cat .gitignore
```

## Expected Outputs

- **Create** `.gitignore`
  - Standard .gitignore file for Node.js and common editors
  - Validation: file_exists

- **Create** `CONTRIBUTING.md`
  - Commit message guidelines document
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
