# FlowTask Context Pack

## Original User Prompt

generate plan or generate roadmap should use AI and user profile user data config, dont hard code, implement best practice, highest qualiticode

## Current Task

### Analyze existing roadmapService.ts for roadmap generation logic

Perform a detailed code analysis of apps/web/src/features/roadmap/roadmapService.ts to understand current roadmap generation logic, data structures, and how static or dynamic the current implementation is. Identify extension points for integrating AI and user profile data.

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

- Documented summary of current roadmap generation logic
- List of data inputs currently used for roadmap generation
- Identification of hardcoded elements and potential dynamic data sources

## Validation Commands

```bash
ls docs/roadmapService-analysis.md
```

## Expected Outputs

- **Create** `docs/roadmapService-analysis.md`
  - Analysis document summarizing roadmapService.ts logic and extension points
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
