# FlowTask Context Pack

## Original User Prompt

read file plan docs/plan/plan-engine.md then implement Consistent with the documentation.

## Current Task

### Analyze docs/plan/plan-engine.md for core requirements and architecture

Read and analyze the entire docs/plan/plan-engine.md file to extract core requirements, design principles, user profile data needs, and architectural guidelines for the IELTS Journey Study Plan Engine. Document key points including primary objectives, core design principles, required user profile data, and constraints.

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

- Extracted core requirements and design principles documented
- User profile data inputs identified
- Constraints and non-functional requirements noted

## Validation Commands

```bash
ls docs/plan/plan-engine-summary.md
```

## Expected Outputs

- **Create** `docs/plan/plan-engine-summary.md`
  - Summary of core requirements and architecture extracted from plan-engine.md
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
