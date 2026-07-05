# FlowTask Context Pack

## Original User Prompt

Add a feature called **AI Learning Progress Review** to IELTS Journey.

This feature allows users to review their learning progress after a period of time, such as after 7 days, 30 days, or a custom date range.

AI Tutor should act like a real IELTS tutor and analyze what the user has studied during that period. It should review the user’s completed lessons, practiced skills, saved vocabulary, mistakes, study consistency, weak areas, and improvement.

The AI should then generate a clear progress report that includes:

* Overall learning summary
* What the user improved
* What the user still struggles with
* Repeated mistakes
* Vocabulary review status
* Skill-by-skill progress for Listening, Reading, Writing, and Speaking
* Whether the user is following the study plan well
* Recommended focus for the next period
* Encouraging tutor-style feedback

The goal is to help users understand their real progress, know what to improve next, and feel like they have a personal IELTS tutor reviewing their study journey regularly.


## Current Task

### Create AI Prompt Builder for Learning Progress Review Report

Implement a prompt builder function in packages/ai-tutor/src/prompts/learningProgressReview.ts that formats the aggregated user study data into a structured prompt for the AI Tutor. The prompt should instruct the AI to act as a real IELTS tutor and generate the detailed progress report including all required sections. Include system prompt, user prompt templates, and JSON schema for expected AI response.

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

- Design AI Learning Progress Review Data Model and API (done)
- Implement AIProgressReviewService to Aggregate User Study Data (done)

## Acceptance Criteria

- Prompt builder produces well-structured prompt with all required data and instructions
- Prompt includes clear instructions for AI to generate all report sections
- JSON schema for AI response is defined and exported

## Validation Commands

```bash
pnpm lint
```
```bash
pnpm typecheck
```
```bash
pnpm lint && pnpm typecheck
```

## Expected Outputs

- **Create** `packages/ai-tutor/src/prompts/learningProgressReview.ts`
  - Prompt builder and JSON schema for AI Learning Progress Review report generation
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
