# FlowTask Context Pack

## Original User Prompt

update Open AI Tutor Assistant button to use icon chat, i cannot open this button i cannot open chat popup

## Current Task

### Replace Open AI Tutor Assistant button icon with chat icon in AssistantButton.tsx

Modify the AssistantButton component in src/components/aiTutor/AssistantButton.tsx to replace the current icon with a chat icon. Ensure the icon is imported correctly and used in the button JSX.

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

- Locate Open AI Tutor Assistant button component and event handler (done)

## Acceptance Criteria

- The button icon is replaced with a chat icon
- The icon renders correctly in the UI

## Validation Commands

```bash
git diff src/components/aiTutor/AssistantButton.tsx
```

## Expected Outputs

- **Modify** `src/components/aiTutor/AssistantButton.tsx`
  - Update icon import and usage to chat icon
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
