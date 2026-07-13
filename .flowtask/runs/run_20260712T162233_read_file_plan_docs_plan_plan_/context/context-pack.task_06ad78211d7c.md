# FlowTask Context Pack

## Original User Prompt

read file plan docs/plan/plan-engine.md then implement Consistent with the documentation.

## Current Task

### Design module structure and interfaces for Study Plan Engine

Based on the analysis of plan-engine.md, design the module structure, core interfaces, and data models for the Study Plan Engine. Define TypeScript interfaces for user profile input, study tasks, roadmap data, and AI integration points. Create a design document describing module boundaries, responsibilities, and interaction patterns.

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

## Acceptance Criteria

- Module structure diagram or description created
- TypeScript interfaces for core data models defined
- Design document created describing module responsibilities and interactions

## Validation Commands

```bash
ls packages/learning-engine/src/daily-plan/
```

## Expected Outputs

- **Create** `packages/learning-engine/src/daily-plan/DailyPlanEngineDesign.md`
  - Design document for Study Plan Engine module structure and interfaces
  - Validation: file_exists

- **Create** `packages/learning-engine/src/daily-plan/types.ts`
  - TypeScript interfaces and types for Study Plan Engine inputs and outputs
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
