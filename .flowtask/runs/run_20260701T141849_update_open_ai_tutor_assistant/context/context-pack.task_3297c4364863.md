# FlowTask Context Pack

## Original User Prompt

update Open AI Tutor Assistant button to use icon chat, i cannot open this button i cannot open chat popup

## Current Task

### Locate Open AI Tutor Assistant button component and event handler

Identify the React component or UI module that renders the Open AI Tutor Assistant button. Locate the current icon used and the event handler responsible for opening the chat popup.

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

- The source file(s) containing the button component and icon usage are identified
- The event handler or method that triggers the chat popup is located

## Validation Commands

```bash
grep -r 'AssistantButton' src/components
```

## Expected Outputs

- **Modify** `src/components/aiTutor/AssistantButton.tsx`
  - File containing the Open AI Tutor Assistant button component and event handler
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
