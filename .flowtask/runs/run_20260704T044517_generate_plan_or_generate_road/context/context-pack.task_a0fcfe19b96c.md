# FlowTask Context Pack

## Original User Prompt

generate plan or generate roadmap should use AI and user profile user data config, dont hard code, implement best practice, highest qualiticode

## Current Task

### Implement AI-driven plan and roadmap generator service

Develop a new service module src/features/roadmap/aiRoadmapGenerator.ts that calls the AI engine with user profile data and prompt templates to generate personalized plans and roadmaps. Ensure the service handles asynchronous AI calls, error handling, and returns structured roadmap data.

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

## Acceptance Criteria

- Service module implemented with functions to generate plans via AI
- Integration with AI prompt templates and user data extraction
- Proper error handling and fallback mechanisms included

## Validation Commands

```bash
pnpm test --filter=aiRoadmapGenerator
```

## Expected Outputs

- **Create** `src/features/roadmap/aiRoadmapGenerator.ts`
  - AI-driven plan and roadmap generator service implementation
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
