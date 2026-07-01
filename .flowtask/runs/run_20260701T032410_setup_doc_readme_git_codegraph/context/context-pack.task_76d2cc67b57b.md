# FlowTask Context Pack

## Original User Prompt

setup doc readme git, codegraph, ... alligne with software industry standard

## Current Task

### Create and align README.md with software industry standards

Create or modify README.md at the project root to include sections: Project Title, Description, Installation, Usage, Development, Testing, Contributing, License, and Contact. Follow common markdown conventions and best practices for clarity and completeness.

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

- README.md contains all standard sections with clear instructions
- README.md uses markdown formatting correctly

## Validation Commands

```bash
cat README.md
```

## Expected Outputs

- **Modify** `README.md`
  - Standardized project README with essential sections and formatting
  - Validation: file_content


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
