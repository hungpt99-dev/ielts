# FlowTask Context Pack

## Original User Prompt

Additional requirement: Optional Public Content API Integration

Add optional public content API integration for the IELTS Learning Journey website and browser extension.

The app has no backend, so public API integration must be frontend-only and local-first.

Purpose:

* Help users retrieve useful English learning content.
* Let users import selected content into their local browser database.
* Turn imported content into IELTS vocabulary, notes, exercises, reading practice, listening practice, speaking prompts, and writing ideas.
* Do not depend on public APIs for the core app experience.

Supported public API/source types:

1. Dictionary and Vocabulary APIs
   Use public dictionary or word APIs to retrieve:

* Word meaning
* Synonyms
* Antonyms
* Related words
* Example sentences
* Word family
* Collocations if available

Possible sources:

* Wiktionary / Wikimedia API
* Datamuse API
* Tatoeba API or exports

2. Open Educational Resource APIs
   Use OER APIs to search open educational content.

Possible source:

* OER Commons API

For each imported item, store:

* source name
* source URL
* license
* attribution
* imported date
* content type

3. Open Article / Knowledge Sources
   Use open knowledge sources for reading material and IELTS topic background.

Possible sources:

* Wikipedia / Wikimedia API
* Project Gutenberg / Gutendex

Use these sources to help create:

* Reading materials
* Topic summaries
* Vocabulary lists
* Discussion questions
* Writing ideas

4. Video / Listening Sources
   For YouTube:

* Use YouTube Data API only for video metadata if needed.
* Do not assume transcript extraction always works.
* Allow user to paste transcript manually.
* User can save video URL, title, notes, and transcript.
* AI can turn transcript into listening exercises.

5. API Import Flow

The user flow should be:

User searches public API
→ App shows results
→ User previews content
→ App shows source and license
→ User chooses what to import
→ App saves selected content to IndexedDB
→ App classifies imported content by IELTS topic, skill, difficulty, and tags
→ User can generate exercises from the imported content

6. Local Storage

Imported API content must be stored locally in IndexedDB.

Each imported content item should include:

* id
* title
* content
* contentType
* sourceType: public-api
* sourceName
* sourceUrl
* licenseName
* attribution
* importedAt
* skill
* topic
* difficulty
* tags
* userNotes

7. Licensing and Attribution

The app must respect content licenses.

Requirements:

* Show source and license before import.
* Store attribution metadata.
* Display attribution when showing imported content.
* Do not import content if license is unclear.
* Do not copy copyrighted IELTS/Cambridge/British Council/IDP materials unless explicitly allowed.
* Prefer public domain, Creative Commons, and OER sources.

8. API Key and CORS Handling

Because there is no backend:

* Prefer APIs that do not require secret API keys.
* Do not expose private API keys in frontend code.
* If an API requires a user-owned key, allow the user to enter their own key locally.
* Handle CORS errors gracefully.
* Explain when a source cannot be used directly from browser because of CORS or API restrictions.

9. AI Integration

After content is imported, AI can:

* Classify IELTS topic
* Extract vocabulary
* Simplify content
* Generate reading questions
* Generate listening gap-fill from transcript
* Generate speaking discussion questions
* Generate writing prompts
* Generate grammar exercises
* Generate mistake review tasks

AI must use the user’s own API key and must only run after user action.

10. Important Product Rule

Public APIs are optional content sources.

The app should work from:

* Built-in original content
* User-created content
* User-collected web content
* AI-generated content
* Optional public API imports

Do not make the app depend completely on public APIs.


## Current Task

### Add Content Classification and Tagging AI Integration for Imported Items

Implement AI integration functions in src/features/publicApiIntegration/ai/classify.ts that use user-provided AI API keys to classify imported content by IELTS topic, skill, difficulty, and tags. Provide functions to extract vocabulary, generate reading questions, listening exercises, speaking prompts, and writing ideas from imported content. Ensure AI calls only run after explicit user action and use local API key stored securely. Integrate classification results into imported content metadata in IndexedDB.

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

- Design Public API Integration Architecture and Data Model (done)
- Implement Public API Search and Result Display UI Component (done)
- Implement Import Logic and IndexedDB Storage for Public API Content (done)

## Acceptance Criteria

- AI classification functions accept imported content and user API key
- Classification results update IndexedDB content metadata
- AI generation functions produce vocabulary, questions, and prompts
- AI calls only execute after user triggers them
- No private API keys are exposed in frontend code

## Validation Commands

```bash
pnpm test --filter publicApiIntegration
```

## Expected Outputs

- **Create** `src/features/publicApiIntegration/ai/classify.ts`
  - AI integration functions for classification and content generation
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
