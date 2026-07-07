# FlowTask Context Pack

## Original User Prompt

add, update, remove doc and readme to align with software industry standdard and AI coding agent and introduce this product and guid new mem to join project

## Current Task

### Review and Analyze Existing Documentation and README

Read and analyze current docs/ai-agent.md, docs/product-overview.md, docs/contribution-guide.md, docs/user-guide.md, and README.md to identify outdated, missing, or inconsistent information related to product introduction, AI coding agent usage, and new member onboarding.

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

- A list of documentation sections and README parts that require addition, update, or removal is created
- Identified gaps in onboarding guidance and product introduction are documented

## Validation Commands

```bash
ls docs/documentation-update-plan.md
```

## Expected Outputs

- **Create** `docs/documentation-update-plan.md`
  - Plan document listing required documentation and README updates
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
