# FlowTask Context Pack

## Original User Prompt

I want **IELTS Journey** to run on mobile app with best practice, but currently the project is **frontend-only**. There is no backend yet. Backend can be added later.

Please design and update IELTS Journey so it can support mobile usage now, while keeping the architecture ready for a future backend.

The goal is to make IELTS Journey work well as:

* Web app
* Mobile-friendly app
* PWA if suitable
* Future iOS / Android app
* Future synced app with backend
* Future extension integration

Important rule:

Do not assume backend already exists.
Do not build fake backend logic as production logic.
Design the frontend so backend integration can be added later without rewriting the whole app.

Current direction:

For now, IELTS Journey should store user data locally on the device/browser, such as:

* User profile
* Target IELTS band
* Exam date
* Study plan
* Saved vocabulary
* Saved articles
* Selected text
* Exercise results
* Mistake history
* Study progress
* AI Tutor chat history
* Review history
* App settings

Use a clean local-first architecture.

Recommended storage options:

* IndexedDB for structured learning data
* LocalStorage only for simple settings
* Secure storage later for mobile app tokens
* Sync layer abstraction for future backend

The app should have a clear data layer so we can later replace or extend local storage with backend sync.

Create clean interfaces like:

* 
* 
* 
* 
* 
* 
* 
* 

For now, these repositories can use local storage or IndexedDB.

Later, they should be able to support:

* Supabase
* Firebase
* Custom backend API
* REST API
* tRPC
* GraphQL
* Cloud sync
* Multi-device sync

The mobile app should follow best practices:

* Mobile-first responsive UI
* Touch-friendly buttons
* Simple navigation
* Fast loading
* Offline-first behavior
* No layout breaking on small screens
* Clean empty states
* Clear loading states
* Error handling
* Data backup/export option
* Dark mode support if possible
* PWA install support if suitable
* Future push notification support
* Future app store support

Please compare and recommend the best frontend-first approach:

1. Responsive web app first
2. PWA
3. Capacitor wrapper later
4. React Native / Expo later
5. Flutter later

Because there is no backend yet, prioritize the approach that allows fast delivery now and easy migration later.

Preferred recommendation:

Start with a **mobile-first responsive web app + PWA**, then later convert to a real mobile app using **Capacitor** or build a dedicated **React Native / Expo** app when backend and sync are ready.

Core mobile screens should include:

* Onboarding
* User profile setup
* Target band setup
* Exam date setup
* Dashboard
* Today’s study plan
* AI Tutor chat
* Vocabulary Notebook
* Vocabulary Review
* Saved Articles
* Saved Text
* Practice Exercises
* Writing Practice
* Speaking Practice
* Learning Progress
* AI Progress Review
* Settings
* Data export / import
* Future sync settings

AI Tutor should work on mobile with local user data.

AI Tutor should use available local context, such as:

* Target band
* Study plan
* Saved vocabulary
* Mistakes
* Study history
* Current lesson
* Selected text
* Saved articles
* Progress data

If API keys are used on frontend, make the risk clear.
Do not expose sensitive production AI keys directly in frontend.
Support user-provided AI API key only if clearly marked as advanced/personal use.
Prepare architecture so AI calls can later move to backend safely.

Future backend-ready design:

* Add a sync queue
* Track local changes
* Add , , and 
* Use stable IDs for all local records
* Prepare conflict resolution strategy
* Separate local data logic from UI components
* Keep API contracts easy to add later
* Avoid coupling UI directly to browser storage

Offline-first requirements:

* User can study without internet
* User can save vocabulary offline
* User can review vocabulary offline
* User can update study progress offline
* User can view saved content offline
* App should sync later when backend exists
* App should not lose data after refresh or app close

Quality requirements:

* Do not duplicate logic
* Do not hard-code fake user data
* Do not make mobile-specific hacks everywhere
* Keep components reusable
* Keep code clean and type-safe
* Use clear folder structure
* Use best practices for state management
* Use repository/service pattern for data access
* Add tests for important local data logic
* Make the app production-ready for local-first usage

Expected output:

* Recommend the best mobile strategy for current frontend-only IELTS Journey
* Refactor the app to be mobile-first and PWA-ready
* Add clean local-first data architecture
* Prepare the app for future backend sync
* Make all main IELTS Journey features usable on mobile
* Explain what can be done now without backend
* Explain what should wait until backend is added

The final goal is to make IELTS Journey usable as a personal IELTS learning companion on mobile now, while keeping the project ready for future backend, cloud sync, and real iOS / Android app release.


## Current Task

### Analyze current IELTS Journey frontend for mobile and local-first readiness

Perform a detailed analysis of the current frontend-only IELTS Journey codebase to identify mobile usability gaps, local data handling, and architectural coupling to storage. Document current state of UI responsiveness, data storage patterns, and backend assumptions.

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

- Documented list of mobile UI issues and missing mobile features
- Inventory of current data storage methods and coupling
- Identification of backend assumptions or fake backend logic

## Validation Commands

```bash
ls docs/analysis/current-frontend-mobile-localfirst.md
```

## Expected Outputs

- **Create** `docs/analysis/current-frontend-mobile-localfirst.md`
  - Analysis report of current frontend mobile and local-first readiness
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
