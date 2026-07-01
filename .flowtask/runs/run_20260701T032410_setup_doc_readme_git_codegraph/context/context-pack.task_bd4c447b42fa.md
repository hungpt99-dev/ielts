# FlowTask Context Pack

## Original User Prompt

setup doc readme git, codegraph, ... alligne with software industry standard

## Current Task

### Add CodeGraph configuration for code analysis

Create codegraph configuration file (e.g., codegraph.config.json or codegraph.yaml) at project root with settings to analyze source code in src/ directory. Configure output directory and analysis rules aligned with industry best practices for code quality and maintainability.

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

## Acceptance Criteria

- CodeGraph config file exists with correct source and output paths
- Config includes standard analysis rules for JavaScript/TypeScript projects

## Validation Commands

```bash
cat codegraph.config.json || cat codegraph.config.yaml
```
```bash
cat codegraph.config.json
```

## Expected Outputs

- **Create** `codegraph.config.json`
  - CodeGraph configuration file for source code analysis
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
