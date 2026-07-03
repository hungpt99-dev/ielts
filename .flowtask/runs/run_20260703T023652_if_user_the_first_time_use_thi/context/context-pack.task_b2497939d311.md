# FlowTask Context Pack

## Original User Prompt

if user the first time use this website please open landing page, and i want new tab about website info and info about me for recruit and donate or send feedback

## Current Task

### Add first-time user detection and landing page display logic in app entry

Modify the main app entry component (e.g., src/App.tsx or equivalent) to detect if the user is visiting for the first time by checking a flag in localStorage (e.g., 'hasVisited'). If not set, show the landing page component instead of the main app content. After the first visit, set the flag to prevent showing the landing page again. The landing page should be a new React component that welcomes the user and briefly introduces the website.

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

- Landing page is shown only on first visit
- After first visit, main app content is shown on subsequent visits

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/App.tsx`
  - Add first-time user detection and conditional rendering of landing page
  - Validation: file_diff

- **Create** `src/features/landing/LandingPage.tsx`
  - Landing page React component for first-time users
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
