# FlowTask Context Pack

## Original User Prompt

check all feature again, make sure all feature work correctly, feature call AI should call real AI

## Current Task

### Verify AI Call Implementations in Vocabulary Feature

Check the Vocabulary feature in apps/web/src/features/vocabulary/ for any AI calls. Confirm that if AI is used, it calls the real AI client from @ielts/ai or related packages. Identify and document any mock or placeholder AI calls for correction.

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

## Acceptance Criteria

- All AI calls in Vocabulary feature use real AI client
- No mock or stub AI calls remain in Vocabulary feature

## Validation Commands

```bash
pnpm test --filter=vocabulary
```

## Expected Outputs

- **Modify** `apps/web/src/features/vocabulary/`
  - Code files updated to ensure real AI client usage
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
