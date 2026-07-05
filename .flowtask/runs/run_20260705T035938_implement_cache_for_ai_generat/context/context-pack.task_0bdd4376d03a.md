# FlowTask Context Pack

## Original User Prompt

implement cache for AI generate result if needed, implement with best practice, highest code quality, production ready, design pattern

## Current Task

### Design AI generate result cache interface and integration plan

Design a cache interface and integration approach for AI generate results that supports TTL, concurrency safety, and extensibility. Define how the cache will be used in AI service modules, including key generation strategy and cache invalidation. Document the design with class/interface diagrams and usage examples.

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

- Analyze existing AI cache utility in packages/ai/src/utils/cache.ts (done)

## Acceptance Criteria

- Cache interface design document created with clear API and integration points
- Design includes key generation, TTL, concurrency, and invalidation strategies

## Validation Commands

```bash
ls docs/ai-generate-cache-design.md
```

## Expected Outputs

- **Create** `docs/ai-generate-cache-design.md`
  - Design document for AI generate result cache interface and integration
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
