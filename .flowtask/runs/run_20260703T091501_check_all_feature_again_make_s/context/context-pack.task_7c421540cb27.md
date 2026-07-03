# FlowTask Context Pack

## Original User Prompt

check all feature again, make sure all feature work correctly, feature call AI should call real AI

## Current Task

### Implement Corrections to Replace Mock AI Calls with Real AI Calls

Based on audit findings from previous tasks, modify all identified mock or placeholder AI calls in all AI-related features to use the real AI client implementations from the appropriate packages (@ielts/ai, @ielts/ai-tutor, etc.). Ensure proper imports, API usage, and error handling consistent with project conventions.

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

- Audit AI Call Implementations in AI Tutor Feature (done)
- Audit AI Call Implementations in Exercise Generator Feature (done)
- Verify AI Call Implementations in Vocabulary Feature (done)

## Acceptance Criteria

- All mock AI calls replaced with real AI client calls
- Code compiles without errors
- Unit and integration tests pass for AI features

## Validation Commands

```bash
pnpm test --filter=ai-tutor
```
```bash
pnpm test --filter=exercises
```
```bash
pnpm test --filter=vocabulary
```
```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/features/ai-tutor/`
  - AI Tutor feature code updated to use real AI client
  - Validation: file_diff

- **Modify** `apps/web/src/features/exercises/`
  - Exercise Generator feature code updated to use real AI client
  - Validation: file_diff

- **Modify** `apps/web/src/features/vocabulary/`
  - Vocabulary feature code updated to use real AI client if applicable
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
