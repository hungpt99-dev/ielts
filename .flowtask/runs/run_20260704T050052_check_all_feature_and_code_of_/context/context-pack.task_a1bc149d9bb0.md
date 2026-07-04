# FlowTask Context Pack

## Original User Prompt

check all feature and code of extension, ensure it work correctly, if not please fix with high code quality, deisgn pattern, best practice, production ready

## Current Task

### Verify and Fix Context Menu Integration and Content Script Injection

Test and fix the context menu items 'Save to IELTS Journey' and 'Explain with AI' for correct behavior and permissions. Ensure content scripts inject properly on supported pages and floating toolbar appears on text selection. Fix any injection or permission issues.

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

- Analyze Browser Extension Architecture and Feature Modules (done)
- Run Static Code Analysis and Complexity Checks on Extension Source (done)
- Identify and Document Functional Bugs in Extension Features (done)
- Refactor Highlighting Logic in apps/extension/src/content-script/highlighter/ (done)
- Fix Background Service Worker Messaging and Storage Bridge Logic (done)
- Improve Popup UI Components and Hooks for Performance and Code Quality (done)
- Fix and Enhance Options Page Components and AI Settings Form (done)

## Acceptance Criteria

- Context menu items appear and function correctly
- Content scripts inject and run on target pages
- Floating toolbar displays on text selection
- No permission errors in console

## Validation Commands

```bash
Manual testing in Chrome extension environment
```

## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
