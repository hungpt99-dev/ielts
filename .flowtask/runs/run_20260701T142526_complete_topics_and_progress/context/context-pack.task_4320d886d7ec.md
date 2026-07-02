# FlowTask Context Pack

## Original User Prompt

complete topics and progress

## Current Task

### Implement Topics Progress UI Component in src/pages/TopicsProgress.tsx

Create a new React component src/pages/TopicsProgress.tsx that displays the user's progress on various topics. Use charts (e.g., progress bars or pie charts) to visualize completion percentages. Fetch topicsProgress data from DatabaseService and update UI reactively. Include filtering and sorting by progress or topic name.

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

- Complete Topic Progress Data Model and Storage Integration (done)

## Acceptance Criteria

- TopicsProgress component fetches and displays topics progress data
- UI includes visual progress indicators and supports sorting/filtering
- Component integrates with existing app routing and styling conventions

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/pages/TopicsProgress.tsx`
  - React component for displaying topics progress with charts and filters
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
