# FlowTask Context Pack

## Original User Prompt

hey, i see that we have so much doc, i think we need delete or remove or merge these of doc, please check all doc to decision what doc should remove merge or delete

## Current Task

### Inventory all documentation files in docs directory

Scan the entire docs directory and subdirectories to list all documentation files with their paths, sizes, and last modified dates. Generate a comprehensive inventory report in JSON format listing each doc file and basic metadata.

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


## Acceptance Criteria

- Complete list of all documentation files with metadata is generated
- Inventory report is saved as docs/documentation-inventory.json

## Validation Commands

```bash
test -s docs/documentation-inventory.json
```

## Expected Outputs

- **Create** `docs/documentation-inventory.json`
  - Inventory report of all documentation files with metadata
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
