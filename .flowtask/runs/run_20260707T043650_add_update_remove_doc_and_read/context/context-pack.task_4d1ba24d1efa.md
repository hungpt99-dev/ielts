# FlowTask Context Pack

## Original User Prompt

add, update, remove doc and readme to align with software industry standdard and AI coding agent and introduce this product and guid new mem to join project

## Current Task

### Update docs/ai-agent.md to Reflect Current AI Coding Agent Practices and Standards

Revise docs/ai-agent.md to ensure all guidelines, conventions, and workflows for AI coding agents are current, clear, and aligned with industry best practices. Remove deprecated instructions and add examples or tips for new members working with AI coding agents.

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

## Acceptance Criteria

- AI agent documentation is up-to-date and comprehensive
- Deprecated or unclear instructions are removed or clarified
- Examples or tips for new users are included

## Validation Commands

```bash
git diff docs/ai-agent.md
```

## Expected Outputs

- **Modify** `docs/ai-agent.md`
  - Updated AI coding agent documentation with current practices and onboarding tips
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
