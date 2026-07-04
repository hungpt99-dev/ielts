# FlowTask Context Pack

## Original User Prompt

I want the generated exercises to be much longer and include more questions.


## Current Task

### Analyze current listening exercises structure in apps/web/src/features/listening/data/exercises.ts

Read and analyze the existing listening exercises in apps/web/src/features/listening/data/exercises.ts to understand the current structure, question types, and content length. Identify how questions are defined and linked to transcripts.

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

- Clear understanding of the data structure for listening exercises and questions
- Documented notes on question types and how questions relate to transcripts

## Validation Commands

```bash
ls apps/web/src/features/listening/data/exercises.ts
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
