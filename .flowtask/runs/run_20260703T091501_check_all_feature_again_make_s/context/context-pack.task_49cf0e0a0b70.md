# FlowTask Context Pack

## Original User Prompt

check all feature again, make sure all feature work correctly, feature call AI should call real AI

## Current Task

### Audit AI Call Implementations in AI Tutor Feature

Review and verify the AI call implementations in the AI Tutor feature located in apps/web/src/features/ai-tutor/. Ensure that all calls to AI services use the real AI client from @ielts/ai or @ielts/ai-tutor packages, not mocks or placeholders. Identify any usage of mock AI or stub implementations and document them for correction.

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

- All AI calls in AI Tutor feature use real AI client imports
- No mock or stub AI calls remain in the AI Tutor feature

## Validation Commands

```bash
pnpm test --filter=ai-tutor
```

## Expected Outputs

- **Modify** `apps/web/src/features/ai-tutor/`
  - Code files updated to ensure real AI client usage
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
