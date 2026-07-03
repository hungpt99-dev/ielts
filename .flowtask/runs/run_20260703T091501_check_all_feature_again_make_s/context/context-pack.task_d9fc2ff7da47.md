# FlowTask Context Pack

## Original User Prompt

check all feature again, make sure all feature work correctly, feature call AI should call real AI

## Current Task

### Run Full Test Suite to Validate All Features Work Correctly with Real AI Calls

Execute the full test suite including unit, integration, and end-to-end tests to verify that all features, especially those involving AI calls, work correctly with the real AI services. Confirm no regressions or failures occur due to the AI call changes.

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
- Implement Corrections to Replace Mock AI Calls with Real AI Calls (done)

## Acceptance Criteria

- All tests pass without errors
- No AI-related test failures
- No runtime errors or warnings related to AI calls

## Validation Commands

```bash
pnpm test
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
