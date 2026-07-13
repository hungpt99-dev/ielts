# FlowTask Context Pack

## Original User Prompt

read file plan docs/plan/plan-engine.md then implement Consistent with the documentation.

## Current Task

### Integrate Study Plan Engine with user profile and learning data

Implement integration code in packages/learning-engine/src/daily-plan/PlanEngineIntegration.ts that consumes user profile data, learning progress, and preferences from existing services (e.g., learningProfileRepository.ts). Ensure the Study Plan Engine uses real user data for plan generation and adaptation.

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

## Acceptance Criteria

- Integration module implemented to fetch and supply user profile and learning data
- Study Plan Engine consumes real user data for plan generation
- No hardcoded profile values or dates used

## Validation Commands

```bash
pnpm test packages/learning-engine/src/daily-plan/PlanEngineIntegration.test.ts
```

## Expected Outputs

- **Create** `packages/learning-engine/src/daily-plan/PlanEngineIntegration.ts`
  - Integration layer for Study Plan Engine with user profile and learning data
  - Validation: file_exists

- **Create** `packages/learning-engine/src/daily-plan/PlanEngineIntegration.test.ts`
  - Unit tests for integration module
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
