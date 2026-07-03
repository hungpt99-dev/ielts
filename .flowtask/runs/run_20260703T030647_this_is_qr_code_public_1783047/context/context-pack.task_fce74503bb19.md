# FlowTask Context Pack

## Original User Prompt

this is qr code public/1783047807283_360225198377512995_3352638618091119450_b1e24afbc8810215cf87240c092f4bb8.jpg, and Website Info
About Me
Recruit
Donate
Feedback just 1 tab and make it beatiful

## Current Task

### Add route and navigation link for PublicTabPage in web app

Modify src/App.tsx or the main routing file to add a route path for the new PublicTabPage component. Add a navigation link or menu item labeled 'Info' or 'Public' that opens this single tab page. Ensure the navigation integrates with existing app layout and routing conventions. Use React Router or the routing library in use. The route should be accessible and the navigation link visible in the main menu or header.

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

- Create PublicTabPage.tsx with About Me, Recruit, Donate, Feedback sections (done)

## Acceptance Criteria

- New route path renders PublicTabPage component
- Navigation link to the new route is present and labeled clearly
- Navigation and routing work without errors
- Page loads and displays the four sections with QR code

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/App.tsx`
  - Add route and navigation link for PublicTabPage
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
