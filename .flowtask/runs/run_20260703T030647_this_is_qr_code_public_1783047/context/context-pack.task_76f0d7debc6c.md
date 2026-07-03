# FlowTask Context Pack

## Original User Prompt

this is qr code public/1783047807283_360225198377512995_3352638618091119450_b1e24afbc8810215cf87240c092f4bb8.jpg, and Website Info
About Me
Recruit
Donate
Feedback just 1 tab and make it beatiful

## Current Task

### Add responsive styling and polish UI for PublicTabPage

Enhance src/components/PublicTabPage.tsx with responsive design using Tailwind CSS utilities. Ensure the layout looks good on mobile, tablet, and desktop screen sizes. Add spacing, typography, and color adjustments to make the page visually appealing and consistent with the app theme. Add hover and focus states for interactive elements if any. Confirm the QR code image scales appropriately and remains clear. Test accessibility with keyboard navigation and screen readers.

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

## Acceptance Criteria

- Page layout adapts well to different screen sizes
- Typography and spacing follow app design system
- QR code image is clear and scales properly
- No accessibility violations detected

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/components/PublicTabPage.tsx`
  - Add responsive and polished styling to PublicTabPage
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
