# FlowTask Context Pack

## Original User Prompt

generate plan or generate roadmap should use AI and user profile user data config, dont hard code, implement best practice, highest qualiticode

## Current Task

### Document AI-driven plan and roadmap generation implementation

Write detailed documentation in docs/ai-plan-roadmap.md describing the AI-driven plan and roadmap generation approach, including architecture, usage instructions, configuration options, and best practices for maintenance and extension.

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
- Create AI prompt templates and data extraction logic for plan generation (done)
- Implement AI-driven plan and roadmap generator service (done)
- Refactor roadmapService.ts to use AI-driven roadmap generator (done)
- Create unit and integration tests for AI-driven plan generation modules (done)

## Acceptance Criteria

- Comprehensive documentation covering design and usage
- Examples of configuration and user data integration
- Guidelines for future enhancements and troubleshooting

## Validation Commands

```bash
ls docs/ai-plan-roadmap.md
```

## Expected Outputs

- **Create** `docs/ai-plan-roadmap.md`
  - Documentation for AI-driven plan and roadmap generation system
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
