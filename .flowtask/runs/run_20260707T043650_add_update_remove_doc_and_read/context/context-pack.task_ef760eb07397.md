# FlowTask Context Pack

## Original User Prompt

add, update, remove doc and readme to align with software industry standdard and AI coding agent and introduce this product and guid new mem to join project

## Current Task

### Update docs/product-overview.md to Align with Industry Standards and Introduce AI Coding Agent

Modify docs/product-overview.md to improve clarity, completeness, and structure. Add a dedicated section introducing the AI coding agent integration and its benefits. Ensure the product overview aligns with current software industry documentation standards, emphasizing privacy, offline capability, and AI features.

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

## Acceptance Criteria

- Product overview clearly explains the product purpose, key features, and AI coding agent integration
- Content is well-structured and free of outdated or ambiguous information

## Validation Commands

```bash
git diff docs/product-overview.md
```

## Expected Outputs

- **Modify** `docs/product-overview.md`
  - Updated product overview with AI coding agent introduction and improved structure
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
