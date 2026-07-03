# FlowTask Context Pack

## Original User Prompt

Database is closed. Call getDb() to open a connection first. check root cause then fix all

## Current Task

### Identify all usages of database access in the project to find improper getDb() calls

Search the entire project source code for all usages of the database instance or getDb() function. Identify any places where the DB is accessed without calling getDb() first or where the DB might be closed prematurely. Document these locations for targeted fixes.

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

- Analyze Database connection lifecycle in apps/web/src/services/storage/Database.ts (done)

## Acceptance Criteria

- Complete list of all source files and code locations accessing the DB
- Identification of improper DB usage patterns

## Validation Commands

```bash
ls docs/analysis/database-access-locations.md
```

## Expected Outputs

- **Create** `docs/analysis/database-access-locations.md`
  - Document listing all database access points and improper usage
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
