# FlowTask Context Pack

## Original User Prompt

this is qr code public/1783047807283_360225198377512995_3352638618091119450_b1e24afbc8810215cf87240c092f4bb8.jpg, and Website Info
About Me
Recruit
Donate
Feedback just 1 tab and make it beatiful

## Current Task

### Create PublicTabPage.tsx with About Me, Recruit, Donate, Feedback sections

Create src/components/PublicTabPage.tsx as a React functional component. It should render a single tab page containing four sections: About Me, Recruit, Donate, and Feedback. Each section should have a heading and placeholder content. The layout should be visually appealing using existing Tailwind CSS styles and theme variables. The QR code image located at public/1783047807283_360225198377512995_3352638618091119450_b1e24afbc8810215cf87240c092f4bb8.jpg should be displayed prominently in the Donate section with appropriate alt text and styling. Use semantic HTML and accessible attributes.

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

- PublicTabPage.tsx renders four distinct sections with correct headings
- QR code image is displayed in the Donate section with correct source and alt text
- Layout uses Tailwind CSS for spacing, typography, and responsiveness
- Component compiles without errors

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/components/PublicTabPage.tsx`
  - React component rendering About Me, Recruit, Donate (with QR code), and Feedback sections in a single tab page
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
