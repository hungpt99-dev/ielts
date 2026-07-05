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

### Add User Guide Section for AI Learning Progress Review Feature

Create a new documentation section in docs/features.md and docs/user-guide.md describing the AI Learning Progress Review feature. Include how to access the feature, select date ranges, interpret the report sections, and use the tutor-style feedback. Provide screenshots or UI mockups if available.

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
- Create AI Prompt Builder for Learning Progress Review Report (done)
- Implement AIProgressReviewController to Call AI Tutor and Parse Report (done)
- Design AI Learning Progress Review UI Components (done)
- Implement ProgressReviewFeature Module and Integrate AI Controller (done)
- Add Unit and Integration Tests for Progress Review Feature (done)
- Perform Accessibility and UX Review of Progress Review UI (done)

## Acceptance Criteria

- Documentation clearly explains feature usage
- Includes all report sections and their meanings
- Documentation is consistent with project style

## Validation Commands

```bash
pnpm lint
```

## Expected Outputs

- **Modify** `docs/features.md`
  - Add AI Learning Progress Review feature description
  - Validation: file_diff

- **Modify** `docs/user-guide.md`
  - Add user instructions for AI Learning Progress Review
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
