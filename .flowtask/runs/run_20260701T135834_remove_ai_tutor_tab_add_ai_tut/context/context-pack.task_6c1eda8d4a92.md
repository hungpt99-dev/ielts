# FlowTask Context Pack

## Original User Prompt

remove AI tutor tab, add ai tutor chat popup input

## Current Task

### Remove AI Tutor tab references from UI components and routes

Search and remove any UI components, route definitions, or menu items that reference the AI Tutor tab or page, including any links or buttons that navigate to the AI Tutor tab. This includes removing or commenting out any route entries in routing configuration files and menu components that show the AI Tutor tab.

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

## Acceptance Criteria

- No UI elements or routes link to the AI Tutor tab
- No broken links or navigation errors related to AI Tutor tab
- App navigation reflects removal of AI Tutor tab

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/routes.tsx`
  - Remove AI Tutor tab route entry
  - Validation: file_diff

- **Modify** `src/components/navigation/Menu.tsx`
  - Remove AI Tutor tab menu item
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
