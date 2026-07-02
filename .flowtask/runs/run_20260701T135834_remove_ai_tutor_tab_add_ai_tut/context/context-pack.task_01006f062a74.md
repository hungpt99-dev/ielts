# FlowTask Context Pack

## Original User Prompt

remove AI tutor tab, add ai tutor chat popup input

## Current Task

### Add AI Tutor chat popup input component in src/components/aiTutor/ChatPopup.tsx

Modify src/components/aiTutor/ChatPopup.tsx to add a chat input field at the bottom of the popup that allows users to type messages and submit them. Implement state management for the input, handle submit events to send messages, and update the chat message list accordingly. Ensure the chat popup UI includes the input box with placeholder text and a submit button or enter key submission.

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

- Remove AI Tutor tab from navigation in src/services/ChatContext.ts (done)

## Acceptance Criteria

- Chat popup includes a visible input field for user messages
- User can type and submit messages via enter key or submit button
- Submitted messages appear in the chat message list
- No regressions in existing chat popup functionality

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/components/aiTutor/ChatPopup.tsx`
  - Add chat input field and submit handler to ChatPopup component
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
