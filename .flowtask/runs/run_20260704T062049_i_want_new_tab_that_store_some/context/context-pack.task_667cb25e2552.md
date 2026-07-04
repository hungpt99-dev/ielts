# FlowTask Context Pack

## Original User Prompt

i want new tab that store something such as link, ... that user save for study

## Current Task

### Design UI component for Study Links tab in extension popup

Design the React component for the new Study Links tab in the extension popup. Include UI elements for listing saved links with title, URL, notes, tags, and timestamps. Include controls for adding, editing, deleting entries. Document component structure, props, and state management approach.

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

- Analyze existing saved items storage and retrieval in extension (done)
- Research UI patterns for adding a new tab in the extension popup (done)
- Investigate existing user data models and storage for user-generated content (done)
- Define data model and storage schema for study links tab (done)

## Acceptance Criteria

- Component design document with UI mockup or wireframe
- Defined props and state management plan

## Validation Commands

```bash
ls docs/study-links-tab-ui-design.md
```

## Expected Outputs

- **Create** `docs/study-links-tab-ui-design.md`
  - UI component design for Study Links tab
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
