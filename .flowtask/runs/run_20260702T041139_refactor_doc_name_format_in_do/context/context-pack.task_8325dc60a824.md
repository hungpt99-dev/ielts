# FlowTask Context Pack

## Original User Prompt

refactor doc name format in doc folder consistent

## Current Task

### Define consistent naming format for docs files

Establish a clear naming convention for documentation files in docs/ folder, including casing (e.g., kebab-case), separator characters, and file extensions, aligned with project conventions

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

- Analyze current documentation file names in docs folder (done)

## Acceptance Criteria

- Naming convention document is created and approved
- Convention aligns with existing project naming rules

## Validation Commands

```bash
ls docs/docs-naming-convention.md
```

## Expected Outputs

- **Create** `docs/docs-naming-convention.md`
  - Markdown file specifying the naming format rules for docs files
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
