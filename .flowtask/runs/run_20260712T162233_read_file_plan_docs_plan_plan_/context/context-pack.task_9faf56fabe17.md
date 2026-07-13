# FlowTask Context Pack

## Original User Prompt

read file plan docs/plan/plan-engine.md then implement Consistent with the documentation.

## Current Task

### Create comprehensive unit and integration tests for Study Plan Engine

Develop comprehensive unit and integration tests covering all modules of the Study Plan Engine including deterministic scheduling, AI orchestration, persistence, regeneration, integration, and explainability. Ensure coverage of edge cases such as missing AI key, missed tasks, profile changes, and no AI fallback.

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
- Implement core Study Plan Engine class with deterministic scheduling logic (done)
- Implement AI orchestration layer for plan enhancement (done)
- Implement plan persistence and validation with IndexedDB/Dexie (done)
- Implement plan regeneration and adaptation logic (done)
- Integrate Study Plan Engine with user profile and learning data (done)
- Implement explainability and user feedback mechanisms (done)

## Acceptance Criteria

- Unit tests cover all core modules and edge cases
- Integration tests validate end-to-end plan generation and adaptation
- Tests verify fallback behavior when AI is unavailable

## Validation Commands

```bash
pnpm test packages/learning-engine/src/daily-plan
```

## Expected Outputs

- **Modify** `packages/learning-engine/src/daily-plan/DailyPlanEngine.test.ts`
  - Add additional unit tests for edge cases
  - Validation: file_diff

- **Modify** `packages/learning-engine/src/daily-plan/AiPlanOrchestrator.test.ts`
  - Add tests for AI fallback and batching
  - Validation: file_diff

- **Modify** `packages/learning-engine/src/daily-plan/PlanPersistenceService.test.ts`
  - Add tests for validation and repair
  - Validation: file_diff

- **Modify** `packages/learning-engine/src/daily-plan/PlanRegenerator.test.ts`
  - Add tests for regeneration scenarios
  - Validation: file_diff

- **Modify** `packages/learning-engine/src/daily-plan/PlanEngineIntegration.test.ts`
  - Add integration tests for user data consumption
  - Validation: file_diff

- **Modify** `packages/learning-engine/src/daily-plan/ExplainabilityService.test.ts`
  - Add tests for explanation generation
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
