# FlowTask Context Pack

## Original User Prompt

add, update, remove doc and readme to align with software industry standdard and AI coding agent and introduce this product and guid new mem to join project

## Current Task

### Update README.md to Introduce Product and Guide New Members

Modify README.md to provide a concise, clear introduction to the product, its key features, and AI coding agent integration. Add a new section with quick start instructions for new members to join the project, including setup and contribution guidelines. Remove any outdated or redundant content.

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
- Revise docs/user-guide.md to Include Onboarding and AI Feature Usage Guidance (done)

## Acceptance Criteria

- README includes a clear product introduction and AI coding agent overview
- New member onboarding section is concise and actionable
- Outdated or redundant content is removed
- README follows software industry best practices for open source projects

## Validation Commands

```bash
git diff README.md
```

## Expected Outputs

- **Modify** `README.md`
  - Updated README with product introduction and new member onboarding guidance
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
