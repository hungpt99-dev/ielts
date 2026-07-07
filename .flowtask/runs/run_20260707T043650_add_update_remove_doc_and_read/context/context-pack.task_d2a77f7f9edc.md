# FlowTask Context Pack

## Original User Prompt

add, update, remove doc and readme to align with software industry standdard and AI coding agent and introduce this product and guid new mem to join project

## Current Task

### Revise docs/contribution-guide.md to Include Clear New Member Onboarding Instructions

Enhance docs/contribution-guide.md by adding a new section specifically guiding new members on how to join the project, including prerequisites, setup steps, coding conventions, and AI coding agent usage guidelines. Remove any outdated or redundant information to streamline onboarding.

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

- Review and Analyze Existing Documentation and README (done)
- Update docs/product-overview.md to Align with Industry Standards and Introduce AI Coding Agent (done)

## Acceptance Criteria

- Contribution guide contains a clear, step-by-step onboarding section for new members
- Coding conventions and AI agent guidelines are up-to-date and easy to understand
- Outdated or redundant content is removed

## Validation Commands

```bash
git diff docs/contribution-guide.md
```

## Expected Outputs

- **Modify** `docs/contribution-guide.md`
  - Updated contribution guide with new member onboarding and AI agent usage instructions
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
