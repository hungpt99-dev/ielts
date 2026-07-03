# FlowTask Context Pack

## Original User Prompt

when i click button chat, chat popup is not open, and fix chat popup css bug

## Current Task

### Fix CSS bugs in chat popup styles

Apply fixes to the CSS or style files affecting the chat popup component to resolve layout, positioning, visibility, or styling bugs identified. Adjust selectors, properties, or add missing styles to ensure correct popup appearance.

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

- Investigate chat button click handler and popup open logic (done)
- Identify and document CSS bugs affecting chat popup appearance (done)
- Fix chat popup open logic in chat button click handler (done)

## Acceptance Criteria

- Chat popup displays correctly without visual glitches
- Popup is properly positioned and styled per design
- No new CSS regressions introduced

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `src/components/ChatPopup.css`
  - Fix CSS rules causing chat popup visual bugs
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
