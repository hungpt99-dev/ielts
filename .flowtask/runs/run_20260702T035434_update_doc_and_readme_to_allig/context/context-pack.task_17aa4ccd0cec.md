# FlowTask Context Pack

## Original User Prompt

update doc and readme to allign with software industry standard, feature, code, ai coding agent

## Current Task

### Outline Updated README Structure Including Features, Code, and AI Coding Agent

Create a detailed outline for the updated README.md that includes sections on project overview, features, code architecture, AI coding agent capabilities, installation, usage, and contribution guidelines. Ensure the outline aligns with software industry best practices for open source project documentation.

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

- Analyze Current README and Documentation for Improvement Areas (done)

## Acceptance Criteria

- A comprehensive README outline covering all key aspects of the project
- Outline includes clear headings and subheadings for features, codebase, and AI coding agent

## Validation Commands

```bash
ls .flowtask/README_update_outline.md
```

## Expected Outputs

- **Create** `.flowtask/README_update_outline.md`
  - Structured outline for the updated README.md
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
