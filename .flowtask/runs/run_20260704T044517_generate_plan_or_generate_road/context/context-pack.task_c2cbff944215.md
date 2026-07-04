# FlowTask Context Pack

## Original User Prompt

generate plan or generate roadmap should use AI and user profile user data config, dont hard code, implement best practice, highest qualiticode

## Current Task

### Analyze user profile and configuration data usage in content and roadmap modules

Examine packages/content/src/userContent.ts and related modules to understand how user profile data and user content edits are managed and accessed. Identify how this data can be leveraged dynamically for plan and roadmap generation without hardcoding.

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

- Analyze existing roadmapService.ts for roadmap generation logic (done)

## Acceptance Criteria

- Documented data structures and APIs for user profile and content data
- List of user data fields relevant for personalized plan generation
- Identification of integration points for AI-driven plan generation

## Validation Commands

```bash
ls docs/userProfileData-analysis.md
```

## Expected Outputs

- **Create** `docs/userProfileData-analysis.md`
  - Analysis document of user profile and content data usage
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
