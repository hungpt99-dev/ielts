# FlowTask Context Pack

## Original User Prompt

generate plan or generate roadmap should use AI and user profile user data config, dont hard code, implement best practice, highest qualiticode

## Current Task

### Create AI prompt templates and data extraction logic for plan generation

Develop AI prompt templates that dynamically incorporate user profile and configuration data for generating personalized plans and roadmaps. Implement data extraction functions to prepare user data inputs for AI consumption, ensuring no hardcoded values are used.

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
- Analyze user profile and configuration data usage in content and roadmap modules (done)
- Design AI integration architecture for dynamic plan and roadmap generation (done)

## Acceptance Criteria

- AI prompt templates created with placeholders for dynamic user data
- Functions implemented to extract and format user profile data for AI input
- No hardcoded user data or plan parameters in templates or extraction logic

## Validation Commands

```bash
ls src/features/roadmap/aiPlanPrompts.ts
```

## Expected Outputs

- **Create** `src/features/roadmap/aiPlanPrompts.ts`
  - AI prompt templates and user data extraction logic for plan generation
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
