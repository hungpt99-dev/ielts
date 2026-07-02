# FlowTask Context Pack

## Original User Prompt

Additional requirement: Browser Extension Companion

Remember that this IELTS Learning Journey product must include a browser extension. The extension should be genuinely useful, not just a simple shortcut to the website.

The extension must work together with the static website and the local browser database. It should help users collect English learning material while browsing the web and save that material into the local app database.

Extension goals:

* Help users learn English from real web content.
* Let users collect vocabulary, phrases, sentences, articles, grammar examples, and mistakes from any website.
* Save collected learning data locally in the browser.
* Connect smoothly with the main IELTS Learning Journey website.
* Support AI features using the user’s own configured AI API key.
* No backend.

Core extension features:

1. Save Selected Text

* User can highlight text on any webpage.
* Right-click or click extension popup to save selected text.
* User can save it as:

  * Vocabulary
  * Useful phrase
  * Example sentence
  * Grammar note
  * Reading material
  * Writing idea
  * Speaking idea
  * Mistake note
* Allow user to add topic, skill, difficulty, tags, and personal note before saving.

2. Vocabulary Collector

* Save unknown words from webpages.
* Store word, source sentence, page title, page URL, topic, and note.
* Allow AI to generate meaning, IELTS-style example, synonyms, collocations, and pronunciation notes.
* Add saved words directly to spaced repetition review.

3. Article Collector

* Save webpage title, URL, selected paragraph, or full readable article content if possible.
* User can categorize article by IELTS topic.
* User can mark article as Reading practice material.
* AI can generate IELTS-style questions from saved article.

4. Floating Learning Toolbar

* Small optional floating button on webpages.
* Appears when user selects text.
* Actions:

  * Save word
  * Save sentence
  * Explain meaning
  * Simplify text
  * Translate to Vietnamese
  * Generate IELTS vocabulary
  * Add to mistake notebook
* Toolbar can be enabled or disabled in settings.

5. Extension Popup

* Beautiful popup UI.
* Shows today’s learning progress.
* Quick add vocabulary.
* Quick add note.
* Quick save current page.
* Quick open dashboard.
* Quick start vocabulary review.
* Shows daily streak and pending reviews.

6. AI Explain on Webpage

* User can select text and ask AI to:

  * Explain in simple English
  * Explain in Vietnamese
  * Give IELTS vocabulary
  * Give grammar explanation
  * Rewrite more naturally
  * Create example sentences
  * Create quiz questions
* Must use user’s own AI API key.
* Must show friendly error if API key is missing.

7. YouTube / Video Learning Helper

* If user is on YouTube, allow saving video title, URL, and notes.
* User can paste transcript manually if automatic transcript extraction is not reliable.
* AI can create vocabulary list, summary, listening questions, and shadowing practice from transcript.
* Save result to Listening practice or Vocabulary.

8. Dictionary Mini Panel

* When user selects a word, show quick dictionary-style panel.
* Include meaning, example, synonym, collocation, and IELTS topic if AI is enabled.
* Allow saving with one click.
* Cache results locally to reduce AI cost.

9. Mistake Capture

* User can save confusing sentences, grammar mistakes, or writing mistakes from anywhere.
* Save to Mistake Notebook.
* Fields:

  * Original text
  * Correction
  * Explanation
  * Skill
  * Topic
  * Status: new, reviewing, fixed

10. Sync with Local Website

* Since there is no backend, extension and website must share data locally.
* Use a clean browser-local solution:

  * IndexedDB for extension data
  * Export/import backup compatibility with website
  * If direct shared IndexedDB between extension and website is limited by browser security, create a bridge using:

    * extension storage
    * downloadable JSON backup
    * import/export
    * optional page-injected bridge only when the website is open
* Clearly document the chosen approach and browser limitations.

11. Extension Settings

* AI provider settings:

  * Provider name
  * Base URL
  * API key
  * Model name
* Theme mode
* Floating toolbar on/off
* Auto-save selected text on/off
* Default save category
* Default IELTS topic
* Data export/import
* Clear extension data

12. Privacy and Security

* No backend.
* Do not send webpage content anywhere unless user explicitly uses AI.
* Do not collect browsing history silently.
* Do not hard-code API keys.
* Store API key locally only.
* Show clear privacy message.
* Request only necessary extension permissions.
* Use secure Chrome Extension Manifest V3 practices.

13. Extension UX/UI

* Beautiful modern popup.
* Fast and lightweight.
* Clear empty states.
* Toast notifications after saving.
* Smooth selected-text workflow.
* Keyboard shortcuts if possible.
* Works well in dark mode and light mode.
* Use the same design tokens and theme system as the website.
* Do not hard-code colors.

14. Suggested Extension Tech Stack

* Chrome Extension Manifest V3
* React + TypeScript + Vite
* Shared UI components if using monorepo
* Shared types between website and extension
* CSS variables or Tailwind theme tokens
* IndexedDB or chrome.storage depending on data needs
* Zod for validation
* Clean service layer for AI, storage, webpage extraction, and messaging

15. Monorepo Structure
    Use a clean structure like:

apps/
web/
extension/

packages/
ui/
types/
storage/
ai/
config/
utils/

The website and extension should share:

* Design tokens
* TypeScript types
* AI client
* Data validation schemas
* Import/export backup format
* Common IELTS data models

16. Extension Production Readiness

* Manifest V3 compatible.
* No broken permissions.
* No console errors.
* Good performance on normal webpages.
* Does not break website layouts.
* Content script must be isolated and safe.
* Clear error handling.
* Build command for extension.
* Documentation for loading unpacked extension in Chrome.
* Ready for Chrome Web Store preparation later.

Important:

* The extension must make the IELTS learning app much more useful by helping the user collect real English content from the web.
* The extension is part of the product, not an afterthought.
* Keep everything local-first.
* No backend.
* User controls their own data and AI API key.


## Current Task

### Build Extension Popup UI with Learning Progress and Quick Actions

Design and implement the extension popup UI showing today's learning progress, daily streak, pending reviews, and quick action buttons for adding vocabulary, notes, saving current page, opening dashboard, and starting vocabulary review. Use shared UI components and design tokens from the website. Ensure dark mode support and responsive layout. Include toast notifications after saving actions.

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

- Design Browser Extension Architecture and Data Flow (done)
- Create Browser Extension Manifest and Basic Scaffold (done)
- Implement Save Selected Text Feature with Categorization UI (done)
- Develop Vocabulary Collector with AI Integration (done)
- Implement Article Collector with AI Question Generation (done)
- Develop Floating Learning Toolbar with Text Actions (done)

## Acceptance Criteria

- Popup UI displays learning progress and statistics correctly
- Quick action buttons trigger corresponding extension features
- UI matches website design tokens and supports dark mode
- Toast notifications appear after save actions

## Validation Commands

```bash
pnpm test --filter extension
```

## Expected Outputs

- **Modify** `apps/extension/src/popup/components/PopupDashboard.tsx`
  - Popup UI component showing learning progress and quick actions
  - Validation: file_diff

- **Modify** `packages/ui/src/components/Toast.tsx`
  - Toast notification component used in extension popup
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
