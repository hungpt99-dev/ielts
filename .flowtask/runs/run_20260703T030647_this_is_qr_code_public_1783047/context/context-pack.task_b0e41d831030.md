# FlowTask Context Pack

## Original User Prompt

this is qr code public/1783047807283_360225198377512995_3352638618091119450_b1e24afbc8810215cf87240c092f4bb8.jpg, and Website Info
About Me
Recruit
Donate
Feedback just 1 tab and make it beatiful

## Current Task

### Validate PublicTabPage integration and run tests

Run the full test suite to validate that the new PublicTabPage component and routing integration do not break existing functionality. Perform manual testing by navigating to the new tab page in the running app to confirm the four sections and QR code display correctly. Check console for errors or warnings. Confirm responsiveness and accessibility manually.

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
- Add route and navigation link for PublicTabPage in web app (done)
- Add responsive styling and polish UI for PublicTabPage (done)

## Acceptance Criteria

- All tests pass without errors
- Manual navigation to the new tab page works and displays content correctly
- No console errors or warnings during manual testing

## Validation Commands

```bash
pnpm test
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
