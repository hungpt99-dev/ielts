# FlowTask Context Pack

## Original User Prompt

remove redundant doc file md file

## Current Task

### Delete identified redundant markdown files

Delete all markdown files listed in redundant_md_candidates.txt to remove redundant documentation files from the project.

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

- Identify redundant .md documentation files in the project (done)

## Acceptance Criteria

- All files listed in redundant_md_candidates.txt are deleted
- No errors occur during deletion

## Validation Commands

```bash
test ! -s redundant_md_candidates.txt || ! xargs -a redundant_md_candidates.txt ls
```
```bash
xargs -a redundant_md_candidates.txt ls
```

## Expected Outputs

- **Delete** `files listed in redundant_md_candidates.txt`
  - Remove redundant markdown documentation files
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
