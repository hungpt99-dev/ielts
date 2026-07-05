# FlowTask Context Pack

## Original User Prompt

implement cache for AI generate result if needed, implement with best practice, highest code quality, production ready, design pattern

## Current Task

### Integrate AiGenerateResultCache into AI generate result service

Modify the AI generate result service module(s) to use AiGenerateResultCache for caching results. Implement cache key generation based on input parameters. Add cache lookup before AI call and cache set after successful AI response. Handle cache misses and TTL expiration gracefully. Ensure integration follows best practices and does not break existing functionality.

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
- Add unit tests for AiGenerateResultCache in packages/ai/src/utils/generateResultCache.test.ts (done)

## Acceptance Criteria

- AI generate result service uses cache correctly
- Cache keys are unique and consistent
- No regressions in AI generate result functionality

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `packages/ai/src/services/aiGenerateService.ts`
  - AI generate result service modified to use AiGenerateResultCache
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
