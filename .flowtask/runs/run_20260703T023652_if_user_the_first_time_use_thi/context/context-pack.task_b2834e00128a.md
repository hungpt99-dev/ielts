# FlowTask Context Pack

## Original User Prompt

if user the first time use this website please open landing page, and i want new tab about website info and info about me for recruit and donate or send feedback

## Current Task

### Create new tabs for website info, about me, recruit, donate, and feedback

Add new tabs/pages in the app navigation for 'Website Info', 'About Me', 'Recruit', 'Donate', and 'Send Feedback'. Each tab should be a separate React component under src/features/info/ with appropriate content placeholders. Update the main navigation component to include these tabs. The 'Send Feedback' tab should include a simple form with fields for user message and contact info, with a submit handler that currently logs the input (no backend integration).

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

- Add first-time user detection and landing page display logic in app entry (done)

## Acceptance Criteria

- New tabs appear in the main navigation
- Each tab renders its respective component
- Send Feedback tab has a functional form with submit handler

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/features/info/WebsiteInfo.tsx`
  - Website Info tab component with info about the website
  - Validation: file_exists

- **Create** `src/features/info/AboutMe.tsx`
  - About Me tab component with info about the developer for recruitment
  - Validation: file_exists

- **Create** `src/features/info/Recruit.tsx`
  - Recruit tab component with recruitment info
  - Validation: file_exists

- **Create** `src/features/info/Donate.tsx`
  - Donate tab component with donation info and links
  - Validation: file_exists

- **Create** `src/features/info/SendFeedback.tsx`
  - Send Feedback tab component with a feedback form and submit handler
  - Validation: file_exists

- **Modify** `src/components/Navigation.tsx`
  - Add new tabs to main navigation menu
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
