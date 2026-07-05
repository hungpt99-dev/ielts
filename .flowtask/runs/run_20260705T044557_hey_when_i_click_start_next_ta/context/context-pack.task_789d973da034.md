# FlowTask Context Pack

## Original User Prompt

Hey when i click Start Next Task it always return this message: Content Not Found

Content not found: Create

## Current Task

### Investigate error source for 'Content Not Found: Create' in task start flow

Analyze the code handling the 'Start Next Task' button click event to identify where the 'Content Not Found: Create' error is generated. Review related components, services, and routing logic that manage task creation or retrieval. Check for missing content keys or incorrect references to 'Create'.

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

- Root cause of the 'Content Not Found: Create' error is identified
- Relevant code locations responsible for the error are documented

## Validation Commands

```bash
ls docs/diagnostics/content-not-found-create-error.md
```

## Expected Outputs

- **Create** `docs/diagnostics/content-not-found-create-error.md`
  - Diagnostic report detailing the source of the 'Content Not Found: Create' error
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
