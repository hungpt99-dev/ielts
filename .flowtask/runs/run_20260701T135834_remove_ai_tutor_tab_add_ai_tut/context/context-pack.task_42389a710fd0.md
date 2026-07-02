# FlowTask Context Pack

## Original User Prompt

remove AI tutor tab, add ai tutor chat popup input

## Current Task

### Remove AI Tutor tab from navigation in src/services/ChatContext.ts

Modify src/services/ChatContext.ts to remove the 'tutor' page from the PAGE_LABELS constant and any references to 'tutor' in the pathToPage function and related navigation logic, effectively removing the AI Tutor tab from the app navigation.

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

- The 'tutor' page label is removed from PAGE_LABELS
- The pathToPage function no longer returns 'tutor' for any path
- No references to 'tutor' page remain in navigation logic

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/services/ChatContext.ts`
  - Remove 'tutor' page from PAGE_LABELS and pathToPage function
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
