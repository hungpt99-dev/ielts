# FlowTask Context Pack

## Original User Prompt

implement cache for AI generate result if needed, implement with best practice, highest code quality, production ready, design pattern

## Current Task

### Document AI generate result caching usage and best practices

Create or update documentation to explain the AI generate result caching mechanism, usage instructions, configuration options (e.g., TTL), and best practices for developers. Include code examples and troubleshooting tips. Place documentation in docs/ai-generate-cache.md.

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
- Integrate AiGenerateResultCache into AI generate result service (done)
- Add integration tests for AI generate result caching behavior (done)

## Acceptance Criteria

- Documentation clearly explains caching design and usage
- Includes examples and configuration guidance
- Reviewed for clarity and accuracy

## Validation Commands

```bash
ls docs/ai-generate-cache.md
```

## Expected Outputs

- **Create** `docs/ai-generate-cache.md`
  - Documentation for AI generate result caching mechanism and usage
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
