# FlowTask Context Pack

## Original User Prompt

update doc and readme to allign with software industry standard, feature, code, ai coding agent

## Current Task

### Update Additional Project Documentation to Reflect Features and AI Coding Agent

Modify or create supplementary documentation files (e.g., docs/FEATURES.md, docs/AI_AGENT.md) to provide detailed technical descriptions of project features, code architecture, and AI coding agent usage. Ensure consistency with README and industry documentation standards.

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
- Outline Updated README Structure Including Features, Code, and AI Coding Agent (done)
- Draft Updated README Content with Industry Standard Sections (done)

## Acceptance Criteria

- Supplementary docs updated or created with clear, detailed content
- Documentation aligns with README and project codebase
- Files use markdown formatting and are placed in appropriate docs/ directory

## Validation Commands

```bash
git diff docs/FEATURES.md docs/AI_AGENT.md
```

## Expected Outputs

- **Modify** `docs/FEATURES.md`
  - Detailed features documentation aligned with README
  - Validation: file_diff

- **Modify** `docs/AI_AGENT.md`
  - Documentation describing AI coding agent capabilities and usage
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
