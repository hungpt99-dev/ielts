# FlowTask Context Pack

## Original User Prompt

Audit, fix, and complete all features of the **IELTS Journey Chrome Extension** so every feature works correctly, reliably, and production-ready.

The goal is not to redesign the whole project. First, inspect the existing codebase, understand the current architecture, reuse existing components/services/styles, and fix unfinished or broken features with the highest code quality.

Main requirement:

All extension features must work correctly between the Chrome extension, content script, popup UI, background/service worker, local storage, web app sync, and AI features.

Features that must be checked and completed:

* Extension popup opens correctly
* Popup can read and display user data
* Popup can show saved vocabulary
* Vocabulary Notebook works correctly
* Each vocabulary item can be clicked to show word details
* Word details should include meaning, pronunciation, part of speech, adjective/adverb/noun/verb forms if available, synonyms, examples, and IELTS usage
* Each word should have a read/pronunciation button
* Text-to-speech should work correctly
* User can highlight/select text on any webpage
* Extension can explain selected text using AI
* Extension can simplify selected text using AI
* Extension can save selected text
* Extension can save new vocabulary
* Extension can enrich saved vocabulary using AI
* Extension can save article/page content as reading material
* Extension can work with YouTube/video pages when possible
* Extension can save video title, URL, transcript/notes if available
* Extension can auto-highlight words already saved by the user
* Auto-highlight must not break website layout
* Auto-highlight must work safely on dynamic pages
* Auto-highlight should avoid duplicate highlights
* User can start vocabulary review from the extension
* Pending review count should display correctly
* AI Tutor entry point from extension works correctly
* AI Tutor can use selected text/page context when available
* Public API/search/import open content feature works if it already exists
* Settings/configuration from web app and extension stay consistent
* Data sync between extension and web app works correctly
* Authentication state works correctly
* Logged-out state is handled clearly
* Loading, empty, error, and success states are handled properly
* Extension works after browser refresh
* Extension works after closing and reopening popup
* Extension works across different websites
* Extension does not crash on restricted pages
* Extension does not spam API calls
* Extension does not duplicate saved data
* Extension does not lose data when offline
* Extension handles permission issues properly

Important quality rules:

* Do not hard-code fake data in production logic
* Do not create duplicate systems if existing ones already exist
* Do not rewrite the full app unnecessarily
* Do not break existing web app features
* Do not break existing extension architecture
* Keep the extension Manifest V3 compatible
* Keep content scripts isolated and safe
* Avoid memory leaks and duplicated event listeners
* Avoid injecting UI multiple times into the same page
* Avoid breaking host website CSS or DOM
* Use clean TypeScript types
* Use reusable services and utilities
* Add proper error handling
* Add proper logging for debugging
* Add tests where important
* Remove dead code only when safe
* Improve naming and structure where needed
* Make the code production-ready

Please perform the work in this order:

1. Inspect the current extension architecture.
2. List all existing extension features and their current status.
3. Identify broken, incomplete, duplicated, or risky parts.
4. Fix the most important user-facing issues first.
5. Make sure popup, content script, background/service worker, storage, API sync, and AI features communicate correctly.
6. Add missing loading, empty, error, and success states.
7. Test core flows manually and with automated tests where possible.
8. Ensure all features work correctly in real Chrome extension environment.
9. Provide a clear final report of what was fixed, what was improved, and what still needs future work.

Expected result:

The IELTS Journey extension should feel stable, polished, and useful for real users. Users should be able to read websites, save vocabulary, review words, use AI Tutor, auto-highlight saved words, save articles/videos, and sync learning data with the web app without bugs or confusing behavior.


## Current Task

### Fix Text Selection Handling and AI Explanation/Simplification Features in Content Script

Fix content script logic to detect user text selection on any webpage reliably. Ensure the floating toolbar appears on selection with options to explain or simplify the selected text using AI. Fix communication between content script and background/service worker for AI API calls. Add error handling and loading states for AI responses.

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

- Inspect and Document Current Extension Architecture (done)
- List and Assess All Existing Extension Features and Their Status (done)
- Identify Broken, Incomplete, Duplicated, or Risky Extension Parts (done)
- Fix Extension Popup Opening and User Data Display Issues (done)
- Fix Vocabulary Notebook and Word Details Display in Popup (done)

## Acceptance Criteria

- Text selection detection works on various webpages
- Floating toolbar appears correctly without breaking page layout
- Explain and simplify AI features return valid responses
- Errors and loading states handled gracefully

## Validation Commands

```bash
pnpm test --filter content
```

## Expected Outputs

- **Modify** `apps/extension/src/content/selection-handler.ts`
  - Fix text selection detection and event handling
  - Validation: file_diff

- **Modify** `apps/extension/src/content/floating-toolbar.ts`
  - Fix floating toolbar UI injection and positioning
  - Validation: file_diff

- **Modify** `apps/extension/src/background/ai-service.ts`
  - Fix AI API call handling and messaging
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
