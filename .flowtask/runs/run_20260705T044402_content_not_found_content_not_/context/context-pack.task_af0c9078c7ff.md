# FlowTask Context Pack

## Original User Prompt

Content Not Found

Content not found: Create

## Current Task

### Create ContentNotFound.tsx React component

Create src/components/ContentNotFound.tsx as a React functional component that displays a user-friendly message 'Content Not Found' with a brief explanation and a link to return to the homepage. The component should be styled consistently with the app's design system, using existing CSS modules or styled-components conventions. Include accessibility features such as proper heading levels and aria attributes.

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

- Component renders a clear 'Content Not Found' message
- Includes a clickable link to the homepage
- Follows existing styling conventions
- Accessible markup is used

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Create** `src/components/ContentNotFound.tsx`
  - React component for displaying content not found message
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
