# FlowTask Context Pack

## Original User Prompt

use pagination if needed, remove fake data, production ready

## Current Task

### Remove all fake data seeding from the application

Locate and remove all code responsible for seeding or injecting fake data into the application, including any mock data files, test fixtures, or hardcoded sample data in the source code. Ensure that the application only loads real data from the production data sources such as IndexedDB or APIs. Verify that no fake data remains in the data initialization or repository layers.

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

- No fake data files or mock data remain in the source code
- Data loading modules only fetch real data from production sources

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/data/*`
  - Remove fake data seeding code from data source modules
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
