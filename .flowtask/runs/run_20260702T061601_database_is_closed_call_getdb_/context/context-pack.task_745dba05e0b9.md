# FlowTask Context Pack

## Original User Prompt

Database is closed. Call getDb() to open a connection first. check root cause then fix all

## Current Task

### Analyze Database connection lifecycle in apps/web/src/services/storage/Database.ts

Review the Database.ts file to understand how the database connection is opened, closed, and accessed. Identify where getDb() is called and how the DB instance is managed. Look for any code paths that might use the DB without opening it first or after closing it.

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

- Clear understanding of DB connection lifecycle in Database.ts
- List of code locations where DB is accessed without guaranteed open connection

## Validation Commands

```bash
ls docs/analysis/database-connection-lifecycle.md
```

## Expected Outputs

- **Create** `docs/analysis/database-connection-lifecycle.md`
  - Analysis document describing DB connection lifecycle and misuse points
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
