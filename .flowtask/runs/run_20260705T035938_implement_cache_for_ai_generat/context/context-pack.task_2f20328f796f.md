# FlowTask Context Pack

## Original User Prompt

implement cache for AI generate result if needed, implement with best practice, highest code quality, production ready, design pattern

## Current Task

### Add unit tests for AiGenerateResultCache in packages/ai/src/utils/generateResultCache.test.ts

Create comprehensive unit tests for AiGenerateResultCache covering cache set/get, TTL expiration, concurrency scenarios, and error handling. Use the project test framework and conventions. Ensure tests are deterministic and cover edge cases.

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
- Design AI generate result cache interface and integration plan (done)
- Implement AiGenerateResultCache class in packages/ai/src/utils/generateResultCache.ts (done)

## Acceptance Criteria

- Unit tests cover all public methods and edge cases
- Tests pass reliably in CI environment

## Validation Commands

```bash
pnpm test packages/ai/src/utils/generateResultCache.test.ts
```

## Expected Outputs

- **Create** `packages/ai/src/utils/generateResultCache.test.ts`
  - Unit test file for AiGenerateResultCache
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
