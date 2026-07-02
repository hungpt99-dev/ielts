# FlowTask Context Pack

## Original User Prompt

complete topics and progress

## Current Task

### Complete Topic Progress Data Model and Storage Integration

Enhance the data model for topics progress in src/models and ensure DatabaseService supports CRUD operations for topicsProgress. Modify src/services/storage/Database.ts to add methods for topicsProgress retrieval and updates. Ensure data consistency and proper typing.

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

- DatabaseService supports getAll, put, add, and delete for topicsProgress
- Topics progress data model is defined with necessary fields like topicId, progressPercent, lastReviewedAt

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/models/index.ts`
  - Add or update topicsProgress data model definitions
  - Validation: file_diff

- **Modify** `src/services/storage/Database.ts`
  - Add CRUD methods for topicsProgress data
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
