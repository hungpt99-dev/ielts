# FlowTask Context Pack

## Original User Prompt

Explain, simplify, and learn from any text | Collect Vocabulary: Save new words with AI enrichment | Save Selected Text: Categorize and save text from the web | Save Article: Save pages as reading materials | Video Helper: Save YouTube and video content | Start Review: 0 pending reviews | Public API: Search and import open content | I want these features to work more automatically and require less manual effort from users, without requiring too much copying and pasting.

## Current Task

### Design automation enhancements for review starting and pending review management

Develop a design plan to automate review session initiation and pending review tracking, including proactive notifications, automatic review scheduling, and UI improvements to reduce manual user effort.

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

- Analyze current explain and simplify text feature implementations in packages/ai (done)
- Analyze current vocabulary collection and enrichment feature (done)
- Analyze current selected text saving and categorization feature (done)
- Analyze current article saving as reading material feature (done)
- Analyze current video helper feature for saving YouTube and video content (done)
- Analyze current review starting and pending review management (done)
- Design automation enhancements for explain and simplify text features (done)
- Design automation enhancements for vocabulary collection and enrichment (done)
- Design automation enhancements for selected text saving and categorization (done)
- Design automation enhancements for article saving as reading materials (done)
- Design automation enhancements for video helper feature (done)

## Acceptance Criteria

- Comprehensive design document for automating review management
- Specification of UI and backend changes

## Validation Commands

```bash
ls docs/design/automation-review-management.md
```

## Expected Outputs

- **Create** `docs/design/automation-review-management.md`
  - Design document for automating review management
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
