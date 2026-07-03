Continue from the existing IELTS Journey codebase. Do not rebuild from scratch unless absolutely necessary.

Your goal is to complete all existing and planned features with production-ready quality.

First, audit the current codebase:
Review the existing architecture, apps, packages, routes, components, storage layer, extension scripts, AI integration, tests, and unfinished features.
Identify incomplete features, broken flows, fake UI, TODOs, dead code, missing error handling, missing persistence, and missing tests.
Then create a clear implementation plan before coding.

Main requirement:
Every feature must work correctly end to end.
Do not leave placeholder UI.
Do not leave mock data unless it is clearly used only for tests or demo fixtures.
Every button, form, action, page, popup, and extension feature must connect to real logic.
Every saved item must persist correctly.
Every AI feature must handle missing API key, loading state, error state, invalid response, and success state.

Product quality target:
Make the app production-ready, stable, maintainable, and easy to extend.
Use strict TypeScript.
Avoid any unless truly necessary.
Use proper validation.
Use clear error handling.
Use clean architecture.
Keep business logic out of React components.
Remove duplicated logic.
Remove unused files and dead code.
Improve naming and folder organization where needed.
Do not introduce unnecessary complexity.

Important:
The project already exists, so preserve the current structure and improve it.
Do not rewrite working parts without reason.
Refactor only when it improves correctness, maintainability, or production quality.
Keep changes incremental and safe.
After each major change, ensure the app still builds and tests pass.

Complete all core website features:
Onboarding
Dashboard
Vocabulary notebook
Article library
Exercise center
Writing idea bank
Speaking practice bank
Daily study plan
AI settings
Import and export data
Progress tracking
Privacy page
Settings page

Complete all Chrome extension features:
Webpage IELTS word highlighting
Word tooltip
Save word
Save article
Selected text action menu
Sentence explanation
Article-to-IELTS generation
Floating IELTS assistant
Extension popup
Extension settings
YouTube transcript support if already started
Sync with local storage or IndexedDB depending on the current architecture

Production behavior requirements:
All pages must have loading states.
All pages must have empty states.
All pages must have error states.
All forms must validate input.
All destructive actions must ask for confirmation.
All async actions must handle failure.
All AI responses must be parsed safely.
All local database operations must handle errors.
All extension content scripts must avoid breaking website layout.
The extension must not modify the host page more than necessary.
The extension UI must be isolated from webpage CSS.
The app must work without login.
The app must work without AI key for non-AI features.
AI features must clearly explain that the user needs their own API key.
The API key must be stored locally only.
Do not log API keys or private user content.

Testing requirements:
Add or fix unit tests for core logic.
Add or fix integration tests for storage, AI prompt builders, vocabulary detection, article extraction, exercise parsing, and daily task generation.
Add or fix E2E tests for the most important user flows:
onboarding
saving a word
saving an article
highlighting words on a webpage
using selected text actions
generating an IELTS exercise
reviewing vocabulary
exporting data
importing data
opening extension popup
using extension settings

Build requirements:
The web app must build successfully.
The extension must build successfully.
Manifest V3 must be valid.
TypeScript must pass.
Lint must pass.
Tests must pass.
Remove console logs unless they are intentional development logs behind a debug flag.
Make sure the final project can be run locally with clear commands.

Final deliverables:
A completed production-ready implementation.
A summary of completed features.
A list of fixed bugs.
A list of remaining limitations if any.
Clear run commands.
Clear test commands.
Clear build commands.
Do not mark the task complete until all important flows are working end to end.
