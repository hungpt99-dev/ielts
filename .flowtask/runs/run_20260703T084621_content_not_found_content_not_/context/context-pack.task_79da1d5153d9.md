# FlowTask Context Pack

## Original User Prompt

Content Not Found

Content not found: Full

## Current Task

### Define Full Backup Data Schema in packages/import-export/src/schemas/fullBackupSchema.ts

Create a Zod schema for the full backup JSON format (AppExportData) in packages/import-export/src/schemas/fullBackupSchema.ts. The schema must validate all user data categories including vocabulary, sessions, mistakes, mock tests, content meta, user edits, and progress records. Use existing partial schemas for sub-entities and compose them into a comprehensive full backup schema. Export the schema for use in import validation.

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

- Full backup schema covers all user data categories
- Schema exports a Zod object named fullBackupSchema
- Schema passes type checks and can parse sample full backup JSON

## Validation Commands

```bash
pnpm tsc --noEmit
```

## Expected Outputs

- **Create** `packages/import-export/src/schemas/fullBackupSchema.ts`
  - Zod schema for full backup JSON validation
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
