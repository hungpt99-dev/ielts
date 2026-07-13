# FlowTask Context Pack

## Original User Prompt

read file plan docs/plan/plan-engine.md then implement Consistent with the documentation.

## Current Task

### Implement AI orchestration layer for plan enhancement

Implement AI orchestration in packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts that integrates with the core StudyPlanEngine. This layer must handle batched AI calls for plan enrichment, ensure strict structured schema usage, handle failures gracefully with fallback to deterministic plan, and support explainability. It must not control dates or scheduling but provide content suggestions and explanations.

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

## Acceptance Criteria

- AI orchestration implemented with batched calls
- Strict schema validation of AI output
- Graceful fallback to deterministic plan on AI failure
- Explainability support included

## Validation Commands

```bash
pnpm test packages/learning-engine/src/daily-plan/AiPlanOrchestrator.test.ts
```

## Expected Outputs

- **Create** `packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts`
  - AI orchestration layer for plan enrichment
  - Validation: file_exists

- **Create** `packages/learning-engine/src/daily-plan/AiPlanOrchestrator.test.ts`
  - Unit tests for AI orchestration layer
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
