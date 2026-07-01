# FlowTask Context Pack

## Original User Prompt

setup doc readme git, codegraph, ... alligne with software industry standard

## Current Task

### Add CodeGraph configuration and integration for codebase visualization

Create codegraph configuration file (e.g., codegraph.config.json or .codegraphrc) with settings to analyze src/ directory. Add npm script 'codegraph' to package.json to run codegraph CLI. Document usage in README.md under a new 'CodeGraph' section.

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
- Initialize and configure git repository with standard .gitignore and commit guidelines (done)

## Acceptance Criteria

- CodeGraph config file exists with correct settings
- package.json contains 'codegraph' script
- README.md updated with CodeGraph usage instructions

## Validation Commands

```bash
cat codegraph.config.json
```
```bash
cat package.json | grep codegraph
```
```bash
grep -i codegraph README.md
```
```bash
npm run codegraph -- --help
```

## Expected Outputs

- **Create** `codegraph.config.json`
  - CodeGraph configuration file for project source analysis
  - Validation: file_exists

- **Modify** `package.json`
  - Add npm script for running CodeGraph
  - Validation: file_diff

- **Modify** `README.md`
  - Add CodeGraph usage instructions section
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
