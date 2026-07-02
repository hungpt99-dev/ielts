# FlowTask Context Pack

## Original User Prompt

complete topics and progress

## Current Task

### Enhance Progress Page Data Aggregation and Visualization

In src/pages/Progress.tsx, complete the data aggregation logic to compute progress metrics for topics and overall study progress. Integrate topicsProgress data into the progress charts and summaries. Add new charts or tables to visualize topic completion rates and progress trends over time. Ensure data is fetched efficiently and UI updates reactively.

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
- Implement Topics Progress UI Component in src/pages/TopicsProgress.tsx (done)

## Acceptance Criteria

- Progress page includes topics progress metrics and visualizations
- Charts update correctly based on aggregated data
- Performance is acceptable with large data sets

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/pages/Progress.tsx`
  - Add topics progress data aggregation and visualization to progress page
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
