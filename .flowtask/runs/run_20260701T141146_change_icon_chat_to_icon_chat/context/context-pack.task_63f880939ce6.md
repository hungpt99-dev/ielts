# FlowTask Context Pack

## Original User Prompt

change icon chat to icon chat

## Current Task

### Replace old chat icon with new chat icon in src/components/aiTutor/ModeSelector.tsx

Modify src/components/aiTutor/ModeSelector.tsx to replace the existing chat icon (e.g., emoji or SVG) with the new chat icon as specified. Update the icon property in the relevant ModeOption object(s) that represent chat functionality. Ensure the icon is consistent with the new design.

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

- Identify all usages of the chat icon in the codebase (done)

## Acceptance Criteria

- The chat icon in ModeSelector.tsx is replaced with the new icon
- The component compiles without errors
- Visual verification of the new icon in the UI

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/components/aiTutor/ModeSelector.tsx`
  - Updated chat icon in ModeSelector component
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
