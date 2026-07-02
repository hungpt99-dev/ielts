# FlowTask Context Pack

## Original User Prompt

remove AI tutor tab, add ai tutor chat popup input

## Current Task

### Update apps/extension/popup.html to ensure chat popup input is rendered

Verify and modify apps/extension/popup.html and its entry point src/popup/main.tsx if needed to ensure the AI Tutor chat popup with input field is rendered correctly in the extension popup UI. Add any necessary container divs or root elements for the chat popup input component.

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
- Add AI Tutor chat popup input component in src/components/aiTutor/ChatPopup.tsx (done)
- Remove AI Tutor tab references from UI components and routes (done)
- Integrate AI Tutor chat popup input with chat message state and submission logic (done)

## Acceptance Criteria

- Popup HTML includes root div for chat popup input
- Chat popup input renders correctly in extension popup
- No UI rendering errors in popup

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/extension/popup.html`
  - Ensure root div and script entry for chat popup input
  - Validation: file_diff

- **Modify** `src/popup/main.tsx`
  - Render ChatPopup component with input in popup
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
