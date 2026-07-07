# FlowTask Context Pack

## Original User Prompt

add, update, remove doc and readme to align with software industry standdard and AI coding agent and introduce this product and guid new mem to join project

## Current Task

### Revise docs/user-guide.md to Include Onboarding and AI Feature Usage Guidance

Update docs/user-guide.md to add clear instructions for new users on how to get started with the product, including AI feature setup and usage. Improve structure and clarity to align with industry standards and ensure the guide is welcoming to new members.

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
- Revise docs/contribution-guide.md to Include Clear New Member Onboarding Instructions (done)
- Update docs/ai-agent.md to Reflect Current AI Coding Agent Practices and Standards (done)

## Acceptance Criteria

- User guide includes a clear getting started section for new users
- AI feature usage instructions are easy to follow
- Content is well-structured and free of outdated information

## Validation Commands

```bash
git diff docs/user-guide.md
```

## Expected Outputs

- **Modify** `docs/user-guide.md`
  - Updated user guide with onboarding and AI feature usage guidance
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
