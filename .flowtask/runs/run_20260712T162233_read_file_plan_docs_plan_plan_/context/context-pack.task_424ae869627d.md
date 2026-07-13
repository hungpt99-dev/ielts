# FlowTask Context Pack

## Original User Prompt

read file plan docs/plan/plan-engine.md then implement Consistent with the documentation.

## Current Task

### Implement core Study Plan Engine class with deterministic scheduling logic

Implement the core StudyPlanEngine class in packages/learning-engine/src/daily-plan/DailyPlanEngine.ts. This class must implement deterministic scheduling logic that respects user profile data, study time availability, exam date, and prioritizes weak skills. It must never schedule more study time than available or after the exam date. Include methods for plan generation, validation, and adaptation to missed tasks or profile changes.

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

- Analyze docs/plan/plan-engine.md for core requirements and architecture (done)
- Design module structure and interfaces for Study Plan Engine (done)

## Acceptance Criteria

- StudyPlanEngine class implemented with deterministic scheduling
- Methods for generating, validating, and adapting plans exist
- No scheduling beyond user available time or exam date

## Validation Commands

```bash
pnpm test packages/learning-engine/src/daily-plan/DailyPlanEngine.test.ts
```

## Expected Outputs

- **Create** `packages/learning-engine/src/daily-plan/DailyPlanEngine.ts`
  - Core Study Plan Engine implementation with deterministic scheduling
  - Validation: file_exists

- **Create** `packages/learning-engine/src/daily-plan/DailyPlanEngine.test.ts`
  - Unit tests for StudyPlanEngine class
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
