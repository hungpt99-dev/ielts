# Complete IELTS Journey Extension-First Migration Prompt

Continue the IELTS Journey migration so the Chrome extension becomes the only runtime for the main learning application.

The full IELTS Journey application already runs inside the extension. Do not rebuild the existing architecture from scratch. Finish the migration by consolidating storage, removing obsolete synchronization, cleaning up the popup data layer, reducing the public website to a landing page, and improving TypeScript correctness.

## Branch

Use the existing branch:

```text
feat/integrate-web-app-into-extension
```

## Product decision

IELTS Journey is now an extension-first product.

The Chrome extension is the main application.

The independent public website must no longer host the IELTS learning application. It may remain only as a lightweight landing page for product information, installation, privacy information, documentation, recruitment, and donations.

There must be no continuous synchronization between a separate website application and the extension because they are no longer two independent learning applications.

## Current implementation

The extension currently includes a full-page application accessible through:

```text
chrome-extension://<extension-id>/app/index.html#/dashboard
```

The same React application, routes, components, engines, and learning features used by the previous web application are now rendered inside the extension using `HashRouter`.

Current conceptual architecture:

```text
Chrome Extension
├── Popup
│   ├── Quick statistics
│   ├── Open IELTS Journey
│   ├── Quick actions
│   ├── YouTube learning shortcut
│   ├── Settings
│   └── Backup-related actions
│
├── Full-page application
│   ├── Dashboard
│   ├── Study Roadmap
│   ├── AI Tutor
│   ├── Vocabulary
│   ├── Saved Content
│   ├── Books
│   ├── Reading
│   ├── Listening
│   ├── Writing
│   ├── Speaking
│   ├── Grammar
│   ├── Mistakes
│   ├── Mock Tests
│   ├── Settings
│   ├── Import and Export
│   └── Privacy
│
├── Content scripts
│   ├── Save selected text
│   ├── Article extraction
│   ├── Vocabulary highlighting
│   ├── AI explanations
│   └── YouTube learning features
│
└── Background service worker
    ├── Runtime messaging
    ├── Tab management
    ├── Context menus
    ├── AI services
    ├── Pending-save processing
    └── Data-change notifications
```

The extension production build currently succeeds.

## Existing implementation files

The following architecture already exists and should be preserved unless changes are needed to complete this migration:

```text
apps/extension/app/index.html
apps/extension/src/app/main.tsx
apps/extension/src/app/ExtensionApp.tsx
apps/extension/src/app/useExtensionDataRefresh.ts
apps/extension/src/extension-adapters/messages.ts
apps/extension/src/extension-adapters/tabManager.ts
apps/extension/src/extension-adapters/assetResolver.ts
apps/extension/src/extension-adapters/index.ts
```

The existing extension app uses `HashRouter`.

Expected route format:

```text
chrome-extension://<extension-id>/app/index.html#/dashboard
chrome-extension://<extension-id>/app/index.html#/ai-tutor
chrome-extension://<extension-id>/app/index.html#/vocabulary
chrome-extension://<extension-id>/app/index.html#/reading
chrome-extension://<extension-id>/app/index.html#/settings
```

Preserve the existing route constants from `@ielts/config`.

## Known remaining problems

The migration is not complete because the following issues remain:

1. The background service worker still writes to both:

   * Legacy raw IndexedDB database: `ielts-journey-extension`
   * Shared Dexie database: `ielts-journey`
2. The popup still contains data services that read vocabulary or saved entries directly from raw IndexedDB.
3. Old bidirectional synchronization logic still exists.
4. The public website under `apps/web` still contains the complete independent application runtime.
5. Cloudflare Pages, Capacitor, and PWA configuration may still support the old independent application.
6. The onboarding guard still stores its completed state directly in `localStorage`.
7. The extension currently has approximately 272 pre-existing TypeScript errors.
8. Documentation may still describe the web application and extension as two learning applications that synchronize.

## Final target architecture

```text
Public Website
└── Landing page only
    ├── Product introduction
    ├── Feature overview
    ├── Extension installation
    ├── Browser-store links
    ├── Documentation
    ├── Privacy policy
    ├── Recruitment
    └── Donation information

Chrome Extension
├── Popup
│   └── Communicates with background through typed messages
│
├── Full-page application
│   └── Uses shared application packages and Dexie repositories
│
├── Background service worker
│   ├── Coordinates runtime messaging
│   ├── Owns extension-level commands
│   ├── Persists content-script data
│   └── Uses shared Dexie repositories
│
├── Content scripts
│   └── Send typed commands to the background worker
│
└── Shared Dexie database
    └── Single source of truth for learning data
```

## Architectural rules

Follow these rules throughout the migration:

1. The extension is the IELTS Journey application.
2. The public website is only a landing page.
3. The Dexie database named `ielts-journey` is the single source of truth for learning data.
4. The legacy raw IndexedDB database named `ielts-journey-extension` must not be used by production code.
5. The popup must not access IndexedDB or Dexie directly.
6. Content scripts must not own permanent learning-data storage.
7. Core packages must not import Chrome APIs.
8. Internal extension data-change messages are allowed and are not considered web–extension synchronization.
9. Import and export must remain available.
10. Existing website users should migrate through export and import, not continuous synchronization.
11. Do not introduce a backend requirement.
12. Preserve local-first operation.
13. Do not rewrite stable business logic unnecessarily.
14. Do not weaken TypeScript settings simply to hide existing errors.

---

# Phase 1: Establish the baseline

Before modifying code, record the current state.

Run the existing equivalents of:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build:extension
pnpm build:web
```

Record:

* Extension test count
* Web test count
* Existing failing tests
* Extension TypeScript error count
* Web TypeScript error count
* Extension build result
* Web build result
* Existing lint failures

Do not treat existing failures as new regressions, but clearly distinguish:

* Pre-existing failures
* Failures introduced by this migration
* Failures fixed during this migration

Search for relevant legacy code:

```bash
rg "ielts-journey-extension"
rg "indexedDB\.open"
rg "IDBDatabase|IDBTransaction|IDBObjectStore"
rg "bidirectional.?sync|syncNow|SYNC_"
rg "chrome\.storage"
rg "localStorage"
rg "Capacitor"
rg "vite-plugin-pwa|workbox|registerSW"
rg "cloudflare|wrangler|pages"
```

Create a short internal dependency map showing:

* Legacy raw IndexedDB callers
* Dexie repository callers
* Popup data sources
* Background write paths
* Sync services
* Onboarding state readers and writers
* Web-only runtime entry points
* PWA and Capacitor entry points

Do not remove a legacy module until all active callers have been identified.

---

# Phase 2: Consolidate storage to Dexie only

## Goal

Remove all production use of:

```text
ielts-journey-extension
```

Use only:

```text
ielts-journey
```

through `@ielts/storage` or the repository’s equivalent shared storage abstraction.

## Required changes

Find all code that directly uses:

```ts
indexedDB.open(...)
IDBDatabase
IDBTransaction
IDBObjectStore
```

Classify each match as:

* Production legacy storage
* Migration-only code
* Test code
* Dexie internals
* Unrelated browser storage

Replace production legacy storage with shared repositories.

All learning data must be persisted through shared storage services or repositories, including:

* Vocabulary
* Saved words
* Saved text
* Saved articles
* Passage entries
* Books
* Mistakes
* Learning history
* Exercise attempts
* Exercise results
* Review scheduling
* Study progress
* Study roadmap data
* AI Tutor persisted history
* Learning preferences
* Import and export data

## Remove dual writes

Find code similar to:

```ts
await legacyDatabase.saveVocabulary(item);
await vocabularyRepo.save(item);
```

Replace it with one repository operation:

```ts
await vocabularyRepo.save(item);
```

There must be one logical write per command.

Do not retain legacy writes as a fallback.

Do not catch a Dexie error and silently write to the legacy database.

Handle persistence failures explicitly and return a controlled error to the sender.

## Remove obsolete legacy code

Delete unused legacy modules such as:

* Raw IndexedDB initializers
* Upgrade handlers
* Object-store definitions
* Raw query helpers
* Raw insert helpers
* Raw update helpers
* Raw delete helpers
* Duplicate database schemas
* Legacy database-specific tests

Do not delete migration code that is still required for one-time import unless it is confirmed unused.

## Database ownership

Use this ownership model:

```text
Full-page app
  → application services or @ielts/storage repositories
  → Dexie

Popup
  → background messaging
  → background application service
  → Dexie

Content scripts
  → background messaging
  → background application service
  → Dexie

Background worker
  → application services or repositories
  → Dexie
```

---

# Phase 3: Replace popup database access with typed background messaging

## Goal

The popup must not open or query raw IndexedDB or Dexie directly.

The popup should act as a lightweight extension UI and communicate with the background service worker.

## Target flow

```text
Popup component
  → popup data client
  → chrome.runtime.sendMessage
  → background message handler
  → dashboard query service
  → @ielts/storage repositories
  → Dexie
  → typed response
  → popup state
```

## Aggregate dashboard request

Prefer a single request for popup dashboard data instead of several independent requests.

Add or adapt a typed request:

```ts
interface GetPopupDashboardMessage {
  type: 'GET_POPUP_DASHBOARD';
}
```

Example response:

```ts
interface PopupDashboardData {
  vocabularyCount: number;
  dueReviewCount: number;
  currentStreak: number;
  recentEntries: PassageEntrySummary[];
}
```

The exact fields should match the current popup UI.

Only include data the popup actually displays.

## Message contracts

Define request and response contracts centrally.

Example:

```ts
type ExtensionRequest =
  | { type: 'OPEN_MAIN_APP'; route?: string }
  | { type: 'GET_POPUP_DASHBOARD' }
  | { type: 'SAVE_SELECTED_TEXT'; payload: SaveSelectedTextPayload }
  | { type: 'SAVE_ARTICLE'; payload: SaveArticlePayload }
  | { type: 'START_VOCABULARY_REVIEW' }
  | { type: 'GET_ACTIVE_TAB_CONTEXT' };

type ExtensionResponseMap = {
  OPEN_MAIN_APP: { success: true };
  GET_POPUP_DASHBOARD: PopupDashboardData;
  SAVE_SELECTED_TEXT: SaveContentResult;
  SAVE_ARTICLE: SaveContentResult;
  START_VOCABULARY_REVIEW: { success: true };
  GET_ACTIVE_TAB_CONTEXT: ActiveTabContext;
};
```

Adapt this design to the current project’s typed-message conventions.

Use Zod validation where the current repository already uses Zod for runtime boundaries.

Validate:

* Incoming message shape
* Required payload fields
* Response shape where practical
* Unknown message types
* Error responses

## Popup error handling

The popup must handle:

* Background service worker unavailable
* Extension context invalidated
* Storage initialization failure
* Repository query failure
* Invalid response
* Timeout or message transport failure

Show a clear compact error state.

Do not crash or render undefined counters.

Do not use a misleading zero value when loading failed unless it is visibly marked as unavailable.

## Remove direct popup data storage

Delete popup code that:

* Opens raw IndexedDB
* Imports raw database helpers
* Queries Dexie repositories directly
* Reads core learning records from `chrome.storage.local`

Small cached counters may remain only when clearly treated as temporary UI metadata, not as the source of truth.

---

# Phase 4: Clarify `chrome.storage.local` responsibilities

Use `chrome.storage.local` only for extension-specific or temporary data.

Appropriate examples:

* Per-site highlighting preferences
* Feature toggles
* Temporary content-script payloads
* Pending commands
* Migration flags
* Extension UI state
* Last active route
* Small extension-level settings
* Temporary background processing queue

Do not use it as a second permanent learning database.

Core records must live in Dexie.

## Content-script persistence flow

Preferred flow:

```text
Content script
  → SAVE_SELECTED_TEXT message
  → background handler
  → application service
  → Dexie repository
  → DATA_CHANGED event
```

Avoid using this as the primary flow:

```text
Content script
  → chrome.storage.local
  → background polling
  → legacy IndexedDB
  → Dexie
```

## Pending-save queue

A temporary pending queue may remain only when required for background-service-worker lifecycle reliability.

When retained, it must:

* Use deterministic operation IDs
* Be idempotent
* Prevent duplicate records
* Be deleted after successful processing
* Retain failed operations for controlled retry
* Have a maximum retry strategy
* Record the last error
* Avoid infinite retry loops
* Avoid acting as permanent storage
* Be documented as a transport queue

The final persistence destination must still be Dexie only.

---

# Phase 5: Remove obsolete web–extension synchronization

## Goal

Remove the old architecture where the independent website and extension synchronized their separate databases.

There is now only one learning application: the extension.

## Remove

Find and remove:

* Bidirectional sync services
* Website-to-extension sync adapters
* Extension-to-website sync adapters
* Automatic sync loops
* Manual `Sync now` actions
* Sync-status indicators
* Sync timestamps
* Conflict resolution specific to two local databases
* Sync message types
* Sync-specific storage keys
* Sync scheduling
* Sync retry queues
* Sync logs
* Sync documentation
* Tests that only validate the removed website-extension sync

Search for concepts such as:

```text
SYNC_NOW
SYNC_START
SYNC_COMPLETE
SYNC_FAILED
PUSH_TO_WEB
PULL_FROM_WEB
WEB_TO_EXTENSION
EXTENSION_TO_WEB
BIDIRECTIONAL_SYNC
lastSyncAt
syncStatus
syncEnabled
```

Explain every remaining match.

## Preserve

Do not remove:

* Import and export
* Backup and restore
* Internal runtime messages
* `DATA_CHANGED` notifications
* Chrome native synchronization for intentionally small preferences
* Temporary background processing queues
* Cross-context cache invalidation
* One-time website data migration

## UI cleanup

Remove or rename misleading popup actions.

For example, replace:

```text
Sync
```

with:

```text
Backup & Restore
```

or:

```text
Export Data
Import Data
```

Use labels that accurately describe the action.

Do not use the word “sync” for export and import.

---

# Phase 6: Preserve one-time migration from the old website

The normal website origin and Chrome extension origin cannot directly access each other’s IndexedDB data.

Do not attempt to bypass browser origin isolation.

Use this migration flow:

```text
Old IELTS Journey website
  → Export data
  → Install or update extension
  → Open extension full-page app
  → Import data
```

## Migration requirements

Preserve or improve the existing export and import format.

The export format should include:

```ts
interface ExportedIeltsJourneyData {
  format: 'ielts-journey-export';
  version: number;
  exportedAt: string;
  data: {
    vocabulary?: unknown[];
    passageEntries?: unknown[];
    mistakes?: unknown[];
    progress?: unknown[];
    settings?: Record<string, unknown>;
  };
}
```

Adapt the schema to the real domain model.

Requirements:

* Validate file structure
* Validate supported format versions
* Run schema migrations
* Report invalid records
* Report skipped records
* Report imported counts
* Avoid duplicate records when safely possible
* Preserve stable IDs
* Avoid silently discarding data
* Handle partial imports
* Show a meaningful summary

Do not implement continuous migration or background synchronization with the old website.

---

# Phase 7: Convert `apps/web` into a landing-page-only application

## Goal

The public website must no longer run the complete IELTS learning application.

It should only provide public product content.

## Landing-page responsibilities

The public website may include:

* IELTS Journey product introduction
* Feature overview
* Screenshots
* Extension installation instructions
* Chrome Web Store link
* Other supported browser-store links
* Documentation links
* Privacy policy
* Terms where applicable
* Recruitment information
* Contribution information
* Donation information
* FAQ
* Contact information

## Remove from the public website runtime

Remove public website access to:

* Dashboard
* Study Roadmap
* AI Tutor
* Vocabulary manager
* Saved Content
* Books
* Reading practice
* Listening practice
* Writing practice
* Speaking practice
* Grammar practice
* Mistakes
* Mock Tests
* Learning settings
* AI provider settings
* Learning database initialization
* Study progress repositories
* Exercise engines
* Full main-app route tree
* Web extension synchronization
* Web learning IndexedDB
* Main learning PWA runtime

Main learning routes should not be reachable from the public website.

For example, public URLs such as these should no longer render the main learning app:

```text
/dashboard
/ai-tutor
/vocabulary
/reading
/listening
/settings
```

They may redirect to:

* The landing page
* An extension installation section
* A dedicated “Open the extension” information page

## Reuse without duplication

Do not duplicate the full extension app inside the website.

Reusable visual components may remain in shared packages, but the landing page should not initialize:

* Learning engine
* AI Tutor engine
* Dexie learning database
* Extension adapters
* Full application state
* Learning repositories

---

# Phase 8: Clean up PWA, Capacitor, Cloudflare, and deployment configuration

Inspect all website-related infrastructure.

## PWA

Remove PWA runtime configuration if the landing page no longer needs application-style offline behavior.

Review:

* `vite-plugin-pwa`
* Workbox
* Service-worker registration
* Web app manifest
* Offline route caching
* Background update behavior
* Install prompts
* Application shell caching

A simple static landing page may retain ordinary browser caching but should not present itself as the IELTS learning application.

## Capacitor

Remove Capacitor configuration and native wrapper scripts if the project no longer ships the web learning app as a mobile application.

Review:

* `capacitor.config.*`
* Android configuration
* iOS configuration
* Native build scripts
* Native synchronization commands
* Mobile-only environment files
* Capacitor plugins
* Native application assets

Do not remove Capacitor when another active product requirement still depends on it. Clearly document the decision.

## Cloudflare Pages

Cloudflare Pages may remain for deploying the public landing page.

Remove configuration that exists only to support the former SPA learning application, such as:

* Main-app SPA rewrites
* Learning route fallbacks
* Application-specific edge functions
* Learning runtime environment variables
* Main-app deployment commands
* Database-related web runtime configuration

Retain only what is needed for the landing page.

## Deployment scripts

Update package scripts so intent is clear.

Example:

```json
{
  "dev:extension": "...",
  "build:extension": "...",
  "test:extension": "...",
  "dev:landing": "...",
  "build:landing": "...",
  "deploy:landing": "..."
}
```

Adapt names to existing repository conventions.

Avoid calling the landing page build `build:web-app` when it no longer contains the main app.

---

# Phase 9: Move onboarding state into shared storage

## Goal

Remove direct onboarding business logic from `localStorage`.

Current behavior may resemble:

```ts
const completed =
  localStorage.getItem('onboarding-completed') === 'true';
```

Replace it with a typed repository through `@ielts/storage`.

Example:

```ts
interface UserPreferencesRepository {
  getOnboardingStatus(): Promise<OnboardingStatus>;
  completeOnboarding(): Promise<void>;
  resetOnboarding(): Promise<void>;
}
```

Example status:

```ts
type OnboardingStatus =
  | { completed: false }
  | {
      completed: true;
      completedAt: string;
      version: number;
    };
```

Adapt this to existing storage conventions.

## One-time migration

Migrate the old `localStorage` value.

Required behavior:

1. Check whether the new preference value exists.
2. If it exists, use it.
3. Otherwise, inspect the legacy `localStorage` key.
4. Validate the legacy value.
5. Write the converted value to the preferences repository.
6. Mark migration completion.
7. Remove the old key only after a successful write.
8. Do not repeat migration on every startup.

Handle:

* Missing value
* `"true"`
* `"false"`
* Invalid strings
* Storage access exceptions
* Database initialization failure

Preserve current routing behavior.

Users who completed onboarding must not be sent through onboarding again.

## Theme storage

Theme state may remain in `localStorage` if changing it would expand scope unnecessarily.

When retained:

* Document it as UI-only state.
* Do not mix it with core learning data.
* Do not claim all `localStorage` usage has been removed.

---

# Phase 10: Improve typed data-change notifications

Internal extension context notifications must remain.

They are not website-extension synchronization.

Use a typed message such as:

```ts
interface DataChangedMessage {
  type: 'DATA_CHANGED';
  entities: Array<
    | 'vocabulary'
    | 'passageEntries'
    | 'savedContent'
    | 'mistakes'
    | 'progress'
    | 'settings'
    | 'onboarding'
  >;
  source:
    | 'background'
    | 'popup'
    | 'content-script'
    | 'full-page-app';
}
```

Adapt the entity names to real repositories.

## Requirements

* Broadcast after a successful transaction.
* Do not broadcast before persistence succeeds.
* Include only affected entities.
* Coalesce multiple related updates where practical.
* Avoid forcing a full application reload.
* Refresh only relevant queries or stores.
* Avoid infinite update loops.
* Ignore events originating from the current context when appropriate.
* Handle extension-context invalidation.

The full-page application should reactively refresh relevant repository data.

---

# Phase 11: Preserve platform boundaries

Core and shared packages must remain independent from Chrome APIs.

Do not import these APIs into shared domain or engine packages:

```ts
chrome.runtime
chrome.tabs
chrome.storage
chrome.contextMenus
chrome.scripting
```

Chrome-specific code belongs in:

```text
apps/extension/src/extension-adapters
apps/extension/src/background
apps/extension/src/popup
apps/extension/src/content-scripts
```

Platform-independent code belongs in:

```text
packages/storage
packages/learning-engine
packages/ai-tutor-engine
packages/domain
packages/config
packages/ui
```

Use interfaces and adapters.

Example:

```ts
interface DashboardQueryService {
  getPopupDashboard(): Promise<PopupDashboardData>;
}
```

The popup transport can call a background adapter, while the background implementation can call repositories.

Avoid circular dependencies.

Avoid importing popup or background implementation code into shared packages.

---

# Phase 12: TypeScript strictness strategy

The extension currently has approximately 272 pre-existing TypeScript errors.

Do not solve this by disabling type safety.

Do not broadly change configuration to:

```json
{
  "strict": false,
  "noImplicitAny": false
}
```

Do not add `@ts-ignore` without a specific documented reason.

Do not replace domain types with `any`.

## Required strategy

1. Capture the exact initial error count.
2. Fix every new error introduced by this task.
3. Fix errors in every file modified by this task.
4. Prioritize errors related to:

   * Vocabulary schema mismatch
   * Passage-entry schema mismatch
   * Difficulty literal types
   * Message request types
   * Message response types
   * Repository return types
   * Popup dashboard data
   * Onboarding preferences
   * Import and export schemas
5. Lower the total error count below the baseline.
6. Categorize the remaining errors.
7. Do not claim the extension fully type-checks unless it actually does.

## Literal types

Fix broad string values when a union is expected.

Avoid:

```ts
difficulty: string;
```

Prefer:

```ts
type Difficulty = 'beginner' | 'intermediate' | 'advanced';
```

Use the actual domain literals already defined in the repository.

Avoid duplicating competing difficulty types.

## Schema consistency

Identify canonical types for:

* Vocabulary item
* Vocabulary status
* Part of speech
* Difficulty
* Passage entry
* Saved content
* Mistake
* Exercise result
* Review state

Update adapters to map external or legacy shapes into canonical domain types.

Do not force incompatible types using casts such as:

```ts
value as VocabularyItem
```

without validation or conversion.

## Scoped type checking

A scoped type-check command may be introduced for migrated code, but it must include all modified architecture layers.

Example:

```json
{
  "typecheck:extension:migration": "tsc -p apps/extension/tsconfig.migration.json --noEmit"
}
```

Do not create a misleading configuration that excludes background, popup, storage adapters, or shared message types.

---

# Phase 13: Testing requirements

Use the project’s existing testing framework.

Do not introduce a new testing framework unless absolutely necessary.

## Storage tests

Add tests proving:

* Background vocabulary saves write only to Dexie.
* Passage-entry saves write only to Dexie.
* Saved article commands write only once.
* Legacy raw IndexedDB is not opened.
* Duplicate messages do not create duplicate records.
* Pending operations are idempotent.
* Successful pending operations are removed.
* Failed pending operations remain available for controlled retry.
* The same deterministic ID does not create multiple records.
* Storage failures return controlled errors.

## Popup tests

Add tests proving:

* Popup requests dashboard data through runtime messaging.
* Popup does not import legacy database helpers.
* Popup does not call `indexedDB.open`.
* Popup displays vocabulary count.
* Popup displays due-review count.
* Popup displays current streak.
* Popup displays recent entries where applicable.
* Popup shows loading state.
* Popup handles an invalid response.
* Popup handles background-service-worker failure.
* Popup handles extension-context invalidation.
* Open IELTS Journey still opens or focuses the existing app tab.

## Messaging tests

Add tests proving:

* `GET_POPUP_DASHBOARD` requests validate.
* Dashboard responses validate.
* Unknown messages return a controlled error.
* `DATA_CHANGED` messages include affected entities.
* `SAVE_SELECTED_TEXT` validates.
* `SAVE_ARTICLE` validates.
* Invalid payloads are rejected.
* Route-specific `OPEN_MAIN_APP` messages still work.

## Onboarding tests

Add tests proving:

* Existing completed onboarding state migrates from `localStorage`.
* Existing incomplete onboarding state migrates safely.
* Invalid legacy values fall back safely.
* Migration runs only once.
* The legacy key is removed only after successful migration.
* New onboarding state is stored through the shared repository.
* Completed users are not redirected to onboarding.
* New users are still shown onboarding.

## Landing-page tests

Add tests proving:

* The landing page renders.
* Product information renders.
* Extension installation action renders.
* Main learning routes do not load the learning application.
* The learning Dexie database is not initialized.
* AI Tutor engine is not initialized.
* Learning engine is not initialized.
* Removed PWA registration is not referenced.
* Removed Capacitor runtime is not referenced.
* Landing-page production build succeeds.

## Regression tests

Verify:

* Full-page dashboard works.
* Study Roadmap works.
* AI Tutor works.
* Vocabulary works.
* Saved Content works.
* Books work.
* Reading works.
* Listening works.
* Writing works.
* Speaking works.
* Grammar works.
* Mistakes work.
* Mock Tests work.
* Settings work.
* Import and export work.
* Content-script saves appear in the full-page app.
* Vocabulary highlighting still works.
* YouTube learning features still work.
* Provider configuration still works.
* Extension production build succeeds.

---

# Phase 14: Manual verification

Perform the following manual checks in Chrome.

## Extension

1. Build the extension.
2. Open:

```text
chrome://extensions
```

3. Enable Developer mode.
4. Load the unpacked extension from:

```text
apps/extension/dist/
```

5. Open the popup.
6. Confirm popup statistics load through background messaging.
7. Confirm no popup errors appear.
8. Click `Open IELTS Journey`.
9. Confirm this page opens:

```text
chrome-extension://<extension-id>/app/index.html#/dashboard
```

10. Click `Open IELTS Journey` again.
11. Confirm the existing tab is focused rather than duplicated.
12. Navigate through every major route.
13. Close and reopen the extension application.
14. Confirm learning data persists.
15. Save selected text from a normal webpage.
16. Confirm one vocabulary or saved-content record is created.
17. Confirm the item appears in the full-page app.
18. Save an article.
19. Confirm one article record is created.
20. Enable vocabulary highlighting.
21. Confirm highlighting works.
22. Test YouTube learning features.
23. Configure an AI provider.
24. Test provider connectivity.
25. Generate an AI Tutor response.
26. Export data.
27. Clear extension learning data.
28. Import the export.
29. Confirm data is restored.
30. Reload the extension.
31. Confirm no duplicate legacy database is created.

## Database inspection

Use browser developer tools to verify:

```text
ielts-journey
```

exists.

Verify production usage does not recreate:

```text
ielts-journey-extension
```

## Landing page

1. Run the landing page.
2. Confirm the landing page loads.
3. Confirm no full learning dashboard is available.
4. Confirm no learning database is initialized.
5. Confirm no application service worker is registered.
6. Confirm extension installation links work.
7. Confirm privacy and documentation routes work.
8. Build the landing page for production.

---

# Phase 15: Documentation

Update the architecture documentation with this explicit statement:

```text
The Chrome extension is the IELTS Journey application.
The public website is only a landing page.
There is no continuous synchronization between them.
```

Document:

* Extension-first product architecture
* Popup responsibilities
* Full-page application responsibilities
* Background service-worker responsibilities
* Content-script responsibilities
* Single Dexie database
* Popup-to-background message flow
* Content-script-to-background message flow
* Internal `DATA_CHANGED` events
* Pending queue behavior
* Backup and restore
* Export and import
* Migration from the old website
* Onboarding preference migration
* Landing-page responsibilities
* Removed synchronization system
* Removed legacy IndexedDB
* Remaining TypeScript debt
* Development commands
* Build commands
* Unpacked extension path
* Landing-page deployment flow

Remove obsolete documentation describing:

* Two active learning applications
* Website-to-extension sync
* Extension-to-website sync
* Bidirectional sync
* Manual sync buttons
* Automatic sync schedules
* Two active learning databases
* Main app PWA installation
* Main app Capacitor deployment

---

# Required implementation order

Perform the work in this order:

1. Capture tests, builds, lint, and TypeScript baseline.
2. Trace all legacy raw IndexedDB callers.
3. Replace background dual writes with Dexie-only writes.
4. Remove unused legacy raw IndexedDB code.
5. Replace popup database access with typed background messaging.
6. Clarify and reduce `chrome.storage.local` usage.
7. Remove obsolete web–extension synchronization.
8. Preserve export/import migration.
9. Move onboarding state into shared preferences storage.
10. Convert `apps/web` into a landing-page-only application.
11. Remove obsolete PWA and Capacitor runtime.
12. Clean up Cloudflare and deployment configuration.
13. Fix TypeScript errors in modified files.
14. Add and update tests.
15. Update documentation.
16. Run full validation.
17. Perform manual verification.

After each major phase:

* Run relevant tests.
* Run type checking for changed code.
* Run linting for changed code.
* Build the extension when extension configuration changes.
* Build the landing page when website configuration changes.
* Fix regressions before continuing.

---

# Acceptance criteria

The migration is complete only when all the following conditions are satisfied.

## Storage

* No production code opens `ielts-journey-extension`.
* No production code directly uses the legacy raw IndexedDB implementation.
* Background writes learning data only to Dexie.
* Each command performs one logical write.
* Pending operations are idempotent.
* Core learning data is not stored permanently in `chrome.storage.local`.
* `ielts-journey` is the single source of truth.

## Popup

* Popup does not access IndexedDB directly.
* Popup does not access Dexie directly.
* Popup dashboard data comes through typed background messages.
* Popup errors are handled gracefully.
* Open IELTS Journey still focuses an existing app tab when available.

## Synchronization

* No continuous website-extension synchronization remains.
* No bidirectional sync service remains.
* No misleading manual sync action remains.
* No obsolete sync status indicator remains.
* Internal `DATA_CHANGED` notifications still work.
* Export and import still work.

## Public website

* The public website contains only the landing-page experience.
* The main learning application is unavailable from the public website.
* The landing page does not initialize the learning database.
* The landing page does not initialize learning engines.
* PWA application runtime is removed unless explicitly justified.
* Capacitor runtime is removed unless explicitly justified.
* Cloudflare configuration supports only the landing page.

## Onboarding

* Onboarding state uses a shared typed preferences repository.
* Old onboarding state migrates safely from `localStorage`.
* Migration runs once.
* Existing completed users retain their status.
* New users still receive onboarding.

## TypeScript

* No new TypeScript errors are introduced.
* Modified files do not contain unresolved type errors.
* The final total error count is below the initial baseline.
* Remaining errors are categorized.
* TypeScript strictness is not broadly weakened.
* No unnecessary `any` or unsafe casts are added.

## Quality

* Core packages do not depend on Chrome APIs.
* All new and modified tests pass.
* Extension production build succeeds.
* Landing-page production build succeeds.
* Existing main extension features continue working.
* Documentation reflects the final architecture.

---

# Final validation commands

Use the repository’s existing package manager and actual script names.

Run the equivalent of:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build:extension
pnpm build:web
```

If the website package is renamed to landing page, use the updated command.

Run legacy searches:

```bash
rg "ielts-journey-extension"
rg "indexedDB\.open"
rg "IDBDatabase|IDBTransaction|IDBObjectStore"
rg "bidirectional.?sync|syncNow|SYNC_"
rg "WEB_TO_EXTENSION|EXTENSION_TO_WEB"
rg "lastSyncAt|syncStatus|syncEnabled"
rg "Capacitor"
rg "vite-plugin-pwa|workbox|registerSW"
rg "localStorage.*onboarding|onboarding.*localStorage"
```

For each remaining match:

* Show the file.
* Explain why it remains.
* Confirm whether it is production code, test code, documentation, migration code, or dependency internals.

Do not claim cleanup is complete when unexplained production matches remain.

---

# Expected final report

When implementation is complete, return a structured report containing:

## 1. Architecture summary

Explain the final extension-first architecture.

## 2. Storage consolidation

Report:

* Legacy database files removed
* Dual writes removed
* Dexie repositories used
* Pending queue decisions
* Database names confirmed

## 3. Popup data migration

Report:

* Direct database access removed
* Messages added
* Dashboard query service added
* Error handling added

## 4. Synchronization removal

Report:

* Services removed
* Message types removed
* UI actions removed or renamed
* Storage keys removed
* Tests removed or replaced

## 5. Landing-page cleanup

Report:

* Main app routes removed
* Runtime initialization removed
* PWA decisions
* Capacitor decisions
* Cloudflare decisions
* Final landing-page responsibilities

## 6. Onboarding migration

Report:

* New repository
* Legacy key
* Migration behavior
* Tests

## 7. TypeScript improvements

Report:

* Initial error count
* Final error count
* Errors fixed
* Remaining categories
* Any intentionally deferred errors

## 8. Tests

Report:

* Tests added
* Tests updated
* Tests removed
* Final passing and failing counts
* Pre-existing failures

## 9. Commands executed

List exact commands and results.

## 10. Build results

Report:

* Extension build
* Landing-page build
* Output directories
* Bundle or manifest warnings

## 11. Legacy search results

Report every remaining relevant search match and justification.

## 12. Manual verification

Report each completed manual test and its result.

## 13. Known limitations

List only genuine remaining limitations.

Do not list completed migration work as future work.

## 14. Final extension directory

Confirm the unpacked extension directory:

```text
apps/extension/dist/
```

Do not claim the migration is complete while any of the following still exists in production code:

* Background dual writes
* Popup raw IndexedDB access
* Active `ielts-journey-extension` database access
* Bidirectional website-extension synchronization
* Full main learning application under the public website
