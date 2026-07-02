# FlowTask Context Pack

## Original User Prompt

refactor doc name format in doc folder consistent

## Current Task

### Update internal references to renamed docs files

Search and update all internal references in the codebase and documentation that point to the renamed docs files to use the new consistent file names

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
- Define consistent naming format for docs files (done)
- Rename docs files to conform to naming convention (done)

## Acceptance Criteria

- All references to docs files updated to new names
- No broken links or import errors related to docs files

## Validation Commands

```bash
pnpm lint
```

## Expected Outputs

- **Modify** `docs/`
  - Updated references inside documentation files
  - Validation: file_diff

- **Modify** `README.md`
  - Updated references inside README.md if any
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
