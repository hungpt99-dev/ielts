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
