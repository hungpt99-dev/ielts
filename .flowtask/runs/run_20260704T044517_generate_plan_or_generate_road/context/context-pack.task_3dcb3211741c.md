# FlowTask Context Pack

## Original User Prompt

generate plan or generate roadmap should use AI and user profile user data config, dont hard code, implement best practice, highest qualiticode

## Current Task

### Design AI integration architecture for dynamic plan and roadmap generation

Create a detailed design document specifying how AI will be integrated to generate plans and roadmaps dynamically using user profile and configuration data. Include data flow diagrams, module responsibilities, and interaction with existing services like roadmapService and userContentService.

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

## Acceptance Criteria

- Architecture design document created with clear AI integration points
- Defined interfaces for AI input and output data
- Consideration of best practices for maintainability and scalability

## Validation Commands

```bash
ls docs/ai-plan-roadmap-integration-design.md
```

## Expected Outputs

- **Create** `docs/ai-plan-roadmap-integration-design.md`
  - Design document for AI-driven plan and roadmap generation integration
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
