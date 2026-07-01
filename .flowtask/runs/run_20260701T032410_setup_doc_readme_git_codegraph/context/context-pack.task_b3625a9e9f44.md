# FlowTask Context Pack

## Original User Prompt

setup doc readme git, codegraph, ... alligne with software industry standard

## Current Task

### Configure Git repository with standard .gitignore and initial commit

Create or update .gitignore file at project root to exclude node_modules, build artifacts, environment files, and IDE configs. Initialize Git repository if not already initialized. Make initial commit with README.md and .gitignore files.

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

## Acceptance Criteria

- .gitignore file exists with standard ignore patterns
- Git repository is initialized
- Initial commit includes README.md and .gitignore

## Validation Commands

```bash
git status
```
```bash
cat .gitignore
```
```bash
git log -1 --oneline
```

## Expected Outputs

- **Create** `.gitignore`
  - Standard .gitignore file for Node.js projects
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
