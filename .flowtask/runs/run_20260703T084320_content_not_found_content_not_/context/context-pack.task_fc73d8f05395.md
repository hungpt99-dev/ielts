# FlowTask Context Pack

## Original User Prompt

Content Not Found

Content not found: Full

## Current Task

### Define Full Backup JSON Schema in packages/import-export/src/schemas/full-backup-schema.ts

Create a Zod schema definition for the full backup JSON format representing all user data including vocabulary, sessions, mistakes, content edits, and settings. This schema will be used for validation during import/export operations.

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

- Full backup schema covers all relevant data types
- Schema validates example full backup JSON data

## Validation Commands

```bash
pnpm test packages/import-export/src/schemas/full-backup-schema.test.ts
```

## Expected Outputs

- **Create** `packages/import-export/src/schemas/full-backup-schema.ts`
  - Zod schema for full backup JSON format
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
