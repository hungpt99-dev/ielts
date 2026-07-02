# FlowTask Context Pack

## Original User Prompt

Refactor my IELTS Learning Journey project source code and documentation using software industry best practices, clean architecture, design patterns, and production-ready engineering standards.

This project is a local-first IELTS learning website and browser extension. It has no backend. It uses browser local database, user-provided AI API key, AI tutor, learning journey engine, content library, exercise generator, import/export, and browser extension for collecting web content.

Before changing code:

* Inspect the whole codebase first.
* Understand the current architecture, features, dependencies, and data flow.
* Do not rewrite everything blindly.
* Keep working features.
* Refactor incrementally.
* After every major change, run typecheck/build/tests if available.
* Do not create a backend.
* Do not hard-code API keys.
* Do not hard-code colors in components.
* Do not remove important features.

Main goal:

Refactor the source code and documentation so the project becomes:

* Production-ready
* Easy to maintain
* Easy to extend
* Easy for new developers to understand
* Well documented
* Strongly typed
* Cleanly structured
* Testable
* Local-first
* Privacy-safe
* Suitable for a real software product

Use industry-standard software design principles:

* Clean Architecture
* SOLID principles
* DRY
* KISS
* Separation of Concerns
* Dependency Inversion
* Repository Pattern
* Service Layer Pattern
* Feature-based modular architecture
* Adapter Pattern for AI providers
* Strategy Pattern for exercise generation/review scheduling
* Factory Pattern for creating exercises, prompts, and AI requests
* Observer/Event pattern for proactive tutor messages and learning events
* Schema validation at boundaries using Zod

Target architecture:

apps/
web/
extension/

packages/
ui/
theme/
types/
storage/
ai/
learning-engine/
content/
exercises/
import-export/
config/
utils/
testing/

Feature structure:

features/
dashboard/
onboarding/
planner/
vocabulary/
reading/
listening/
writing/
speaking/
grammar/
mistakes/
exercises/
content-library/
ai-tutor/
analytics/
settings/
import-export/

Each feature should have:

* components/
* hooks/
* services/
* schemas/
* types/
* utils/
* tests/

Refactor requirements:

1. Clean Architecture

Separate the app into clear layers:

Presentation layer:

* React components
* UI states
* Forms
* Pages
* Layouts

Application layer:

* Use cases
* Feature services
* Commands/actions
* Learning workflows

Domain layer:

* Learning journey models
* Exercise models
* Vocabulary models
* Mistake models
* Study plan models
* AI tutor models
* Business rules

Infrastructure layer:

* IndexedDB repositories
* AI provider adapters
* Browser extension APIs
* Import/export file handling
* Browser notification APIs

Do not put business logic directly inside React components.

2. Source Code Refactor

Refactor the codebase to:

* Use strict TypeScript
* Remove unused code
* Remove duplicated logic
* Remove unnecessary any
* Centralize shared types
* Centralize constants
* Centralize theme tokens
* Centralize AI prompts
* Centralize storage access
* Improve naming
* Improve folder structure
* Improve error handling
* Improve loading and empty states
* Improve component reusability
* Improve feature boundaries

3. AI Layer Refactor

Create a clean AI architecture.

Use an adapter pattern for AI providers.

Support:

* OpenAI-compatible APIs
* Custom base URL
* Custom model
* Custom API key
* Temperature
* Max tokens
* Test connection
* Clear error handling

Create modules:

packages/ai/
client/
adapters/
prompts/
schemas/
services/
errors/
utils/

AI rules:

* Do not call AI directly from UI components.
* Use prompt builders.
* Keep prompts versioned.
* Validate structured AI responses with Zod.
* Gracefully handle invalid JSON.
* Never send local user data to AI without user action or explicit setting.
* Store AI settings locally only.
* Never hard-code API keys.

4. Learning Journey Engine

Create/refactor the Learning Journey Engine.

It should calculate:

* User target band progress
* Exam countdown
* Daily study priority
* Weak skills
* Repeated mistakes
* Due vocabulary reviews
* Due mistake reviews
* Study streak
* Study consistency
* Exercise accuracy
* Next best action
* Weekly reflection data

Create modules:

packages/learning-engine/
profile/
progress/
weakness-detection/
review-scheduler/
next-best-action/
daily-plan/
analytics/

The dashboard, AI tutor, proactive messages, and exercise generator must use this engine.

5. Storage Layer Refactor

Use IndexedDB as the main local database.

Create a repository layer:

packages/storage/
db.ts
schema.ts
migrations.ts
repositories/
errors/
seed/
backup/

Rules:

* No random direct IndexedDB calls inside UI components.
* Use repositories for database access.
* Use versioned migrations.
* Validate stored/imported data.
* Prevent corrupted data from crashing the app.
* Support export/import backup.
* Support merge mode and replace mode.
* Support duplicate detection.

6. Exercise System Refactor

Create a unified exercise system.

Support:

* Built-in exercises
* User-created exercises
* AI-generated exercises
* Exercises from website text
* Exercises from saved vocabulary
* Exercises from notes
* Exercises from YouTube transcripts
* Exercises from mistakes

Use common models:

* Exercise
* ExerciseQuestion
* ExerciseAttempt
* ExerciseResult
* AnswerExplanation

Use strategy pattern for:

* Exercise scoring
* Exercise generation
* Review scheduling
* Difficulty adjustment

7. Content Library Refactor

Create/refactor the built-in content library.

Requirements:

* Static original content
* Seed to IndexedDB on first run
* Content versioning
* Content packs
* Built-in vs user-created distinction
* User edits create a user copy
* Do not overwrite user data during updates
* Support search/filter/import/export

8. AI Tutor Chat Widget Refactor

Refactor the AI Tutor as a reusable widget.

Requirements:

* Headbar chat icon
* Messenger-style popup
* Unread badge
* Conversation bubbles
* Quick actions
* Proactive local messages
* Notification center
* Chat history stored locally
* Context-aware suggestions
* Optional AI-enhanced messages

Use local rule-based proactive messages by default.
AI-powered proactive messages must be optional.

9. Browser Extension Refactor

Refactor the extension using Manifest V3 best practices.

Structure:

apps/extension/
src/
popup/
content-script/
background/
options/
services/
components/

Requirements:

* Minimal permissions
* Isolated content script UI
* No page layout breaking
* Save selected text
* Save word/sentence/article
* Turn web content into exercises
* YouTube transcript helper
* Mini AI tutor
* Shared types/storage/AI/theme with web app
* Local-first privacy

10. Theme and UI Refactor

Create a maintainable design system.

Use:

* CSS variables
* Design tokens
* Light/dark/system mode
* Accent color support
* Shared theme package
* Reusable UI components

Do not hard-code repeated colors.

Use semantic tokens:

* --color-background
* --color-surface
* --color-primary
* --color-text
* --color-muted
* --color-border
* --color-success
* --color-warning
* --color-danger
* --radius-sm
* --radius-md
* --radius-lg
* --spacing-sm
* --spacing-md
* --spacing-lg

11. Error Handling Standard

Create a consistent error handling system.

Error types:

* AppError
* StorageError
* AIError
* ValidationError
* ImportExportError
* ExtensionError
* PermissionError

UI must show:

* Friendly error message
* Retry action
* Fallback state
* Toast notification when useful
* No app crash

12. Testing Refactor

Add or improve tests.

Test:

* Learning Journey Engine
* Review scheduler
* AI prompt builders
* AI response validation
* Storage repositories
* Import/export logic
* Content seeding
* Exercise scoring
* Proactive message rules
* Main user flows

Add E2E tests for:

* Onboarding
* Add vocabulary
* Generate exercise
* Save mistake
* Export/import backup
* Open AI tutor chat
* Extension save selected text

13. Documentation Refactor

Refactor documentation using industry-standard structure.

Create or update:

docs/
architecture.md
product-overview.md
local-first-design.md
ai-architecture.md
learning-journey-engine.md
storage-design.md
database-schema.md
import-export.md
exercise-system.md
content-library.md
extension-architecture.md
theme-system.md
security-privacy.md
testing-strategy.md
deployment.md
contribution-guide.md
troubleshooting.md
adr/
0001-local-first-no-backend.md
0002-indexeddb-storage.md
0003-openai-compatible-ai-provider.md
0004-browser-extension-manifest-v3.md
0005-design-token-theme-system.md

Documentation requirements:

* Explain the architecture clearly.
* Include diagrams where helpful using Mermaid.
* Explain data flow.
* Explain AI flow.
* Explain storage flow.
* Explain extension flow.
* Explain import/export flow.
* Explain how to add new features.
* Explain how to add a new AI provider.
* Explain how to add a new exercise type.
* Explain how to add new built-in content.
* Explain how to run, test, build, and deploy.
* Keep docs accurate with the actual code.

14. README Refactor

Update README.md with:

* Project overview
* Key features
* Tech stack
* Architecture summary
* Folder structure
* Local setup
* Run web app
* Run extension
* Build commands
* Test commands
* AI key setup
* Local data explanation
* Import/export explanation
* Privacy notes
* Deployment guide
* Troubleshooting

15. Code Comments and Naming

Improve code readability.

Rules:

* Use meaningful names.
* Avoid clever code.
* Add comments only for complex logic.
* Do not over-comment obvious code.
* Use consistent naming conventions.
* Keep files small and focused.

16. Developer Experience

Improve development workflow.

Add or verify:

* typecheck script
* lint script
* test script
* build:web script
* build:extension script
* format script
* clean script
* README setup instructions
* example config without secrets
* clear package scripts

17. Final Verification

Before finishing:

* Run typecheck.
* Run lint if available.
* Run tests if available.
* Run build.
* Verify no TypeScript errors.
* Verify no obvious runtime errors.
* Verify web app still works.
* Verify extension builds.
* Verify docs match the actual implementation.

18. Final Report

After refactoring, provide a clear summary:

* What architecture was changed
* What design patterns were applied
* What files/folders were moved
* What code was removed
* What features were preserved
* What documentation was created/updated
* How to run the app
* How to build the app
* How to load the extension
* How AI integration works
* How local storage works
* How to add new features
* Remaining technical debt

Important constraints:

* No backend.
* Local-first only.
* User data stays in browser.
* User provides their own AI API key.
* Do not hard-code API keys.
* Do not hard-code theme colors.
* Do not break existing features.
* Do not make a simple demo.
* Refactor to real software industry standard.


## Current Task

### Refactor AI Layer to Use Adapter Pattern and Modular Structure

Refactor the AI integration code in packages/ai/ to implement the Adapter pattern supporting OpenAI-compatible APIs with configurable base URL, model, API key, temperature, and max tokens. Create modular subfolders: client/, adapters/, prompts/, schemas/, services/, errors/, utils/. Move existing AI code into these modules, implement prompt builders with versioning, and add Zod schema validation for AI responses. Ensure no direct AI calls from UI components and no hard-coded API keys.

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

- Analyze Current Codebase Architecture and Feature Set (done)
- Define and Document Target Clean Architecture Layers and Folder Structure (done)

## Acceptance Criteria

- AI provider adapter implemented with configuration support
- Prompt builders and schema validation added
- AI code modularized under packages/ai/
- No direct AI calls from UI components
- No hard-coded API keys

## Validation Commands

```bash
pnpm test --filter=ai
```

## Expected Outputs

- **Modify** `packages/ai/client/`
  - AI client module implementing adapter pattern
  - Validation: file_exists

- **Modify** `packages/ai/adapters/`
  - AI provider adapters
  - Validation: file_exists

- **Modify** `packages/ai/prompts/`
  - Prompt builders with versioning
  - Validation: file_exists

- **Modify** `packages/ai/schemas/`
  - Zod schemas for AI response validation
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
