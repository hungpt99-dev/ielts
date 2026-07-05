# FlowTask Context Pack

## Original User Prompt

Refactor and clean up **IELTS Journey** so it becomes a global IELTS learning product, not an app only for Vietnamese users.

The goal is to make IELTS Journey suitable for international users while keeping Vietnamese support as one language option, not the default assumption everywhere.

Please inspect the whole codebase first before making changes.

## Main Goals

Update IELTS Journey to support:

* Global IELTS learners
* Multiple languages
* Different countries and regions
* Different exam goals
* Different study styles
* Mobile-first usage
* Future backend sync
* Future monetization
* Future AI provider configuration

IELTS Journey should not feel like it is only built for Vietnamese users.

## Internationalization Requirements

Audit and remove hard-coded Vietnamese assumptions from:

* UI text
* AI prompts
* Default tutor messages
* Error messages
* Empty states
* Onboarding text
* Study plan text
* AI Tutor responses
* Vocabulary explanations
* Exercise instructions
* Progress review messages
* Notification messages
* Extension popup text
* Local storage keys if they contain Vietnamese-specific meaning
* Default settings

Add or prepare a clean localization system.

The app should support at least:

* English as the default global language
* Vietnamese as an optional language
* Future languages later

Use clear language settings such as:

* App display language
* AI explanation language
* Exercise language
* Tutor response language

Do not mix Vietnamese and English randomly in the UI.

## Remove Inappropriate Features

Audit all existing features and remove or disable features that are not suitable for IELTS Journey.

Remove features that are:

* Not related to IELTS learning
* Too experimental
* Confusing for users
* Half-finished
* Broken
* Duplicated
* Only useful for Vietnamese users
* Not aligned with the product direction
* Not safe for production
* Hard-coded demo features
* Fake data features
* Unused admin/debug screens
* Old test pages
* Dead navigation links
* Unused AI tools
* Placeholder features that do not work

Before removing anything, check whether it is used by the app. If it is still useful, refactor it instead of deleting it.

## Remove Stale Code

Clean up stale code across the project.

Find and remove:

* Unused components
* Unused hooks
* Unused services
* Unused utilities
* Unused constants
* Unused types
* Unused routes
* Unused pages
* Unused assets
* Unused CSS
* Unused translation strings
* Old mock data
* Old demo data
* Duplicate logic
* Duplicate AI prompts
* Duplicate storage logic
* Commented-out old code
* Console logs used for debugging
* Temporary TODO code that is no longer needed

Do not remove code blindly. Confirm that it is truly unused or unsafe.

## Product Direction

After cleanup, IELTS Journey should focus on these core product areas:

* Personalized IELTS study plan
* AI Tutor
* Vocabulary Notebook
* Vocabulary Review
* Reading practice
* Listening practice
* Writing practice
* Speaking practice
* Mistake tracking
* Learning progress review
* Daily study plan
* AI-generated exercises
* Saved articles and selected text
* Chrome extension integration
* Mobile-first / PWA support
* Local-first data storage
* Future backend sync
* AI provider configuration

Anything outside this direction should be reviewed carefully and removed if it does not add clear value.

## AI Tutor Globalization

Update AI Tutor so it does not assume the user is Vietnamese.

AI Tutor should adapt based on user settings:

* User language
* Target IELTS band
* Current IELTS level
* Country or region if available
* Study goal
* Preferred explanation style
* Preferred tutor tone

Default AI Tutor behavior should be English-first for global users.

Vietnamese explanations should only be used when the user chooses Vietnamese or asks for Vietnamese support.

## User Profile Updates

Update user profile/settings to support global users.

Useful settings:

* Native language
* App language
* AI explanation language
* Target IELTS band
* Current IELTS level
* Exam date
* Study time per day
* Preferred study style
* Tutor tone
* Weak skills
* Strong skills
* Time zone
* Country or region, optional

Do not force Vietnam-specific defaults.

## Content and Exercise Cleanup

Review all learning content and exercises.

Remove or update content that is:

* Vietnamese-only without language setting
* Culturally too specific
* Not useful for IELTS
* Poor quality
* Duplicated
* Outdated
* Hard-coded
* Fake/demo content
* Not connected to the user’s study journey

Content should be IELTS-focused, clear, and suitable for international learners.

## Extension Cleanup

Audit the IELTS Journey extension too.

Make sure extension features are useful for global IELTS learners:

* Save vocabulary
* Explain selected text
* Simplify selected text
* Save articles
* Auto-highlight saved vocabulary
* AI Tutor popup
* Vocabulary review
* Sync with web app later

Remove extension features that are broken, confusing, duplicated, or not aligned with IELTS learning.

## Code Quality Requirements

Follow best practices:

* Keep the architecture clean
* Keep components reusable
* Keep logic type-safe
* Keep storage logic separated from UI
* Keep AI prompt logic centralized
* Keep language strings centralized
* Avoid duplicated logic
* Avoid hard-coded user assumptions
* Avoid hard-coded Vietnamese text
* Avoid fake production data
* Avoid unnecessary complexity
* Improve naming where needed
* Remove dead code safely
* Add tests for important logic
* Make the app easier to maintain

## Cleanup Process

Please work in this order:

1. Inspect the project structure.
2. Identify all user-facing features.
3. Identify Vietnamese-only assumptions.
4. Identify inappropriate, broken, duplicated, stale, or unused features.
5. Create a cleanup plan.
6. Refactor localization and language settings.
7. Remove stale code safely.
8. Remove or disable inappropriate features.
9. Update AI Tutor prompts to support global users.
10. Update UI text to use a clean language system.
11. Test the main user flows.
12. Provide a final cleanup report.

## Main User Flows to Test

After the cleanup, test these flows:

* New user onboarding
* Language selection
* Target band setup
* Exam date setup
* Generate study plan
* Use AI Tutor
* Save vocabulary
* Review vocabulary
* Save selected text
* Generate AI exercises
* View learning progress
* Use mobile layout
* Use extension popup
* Change language setting

## Expected Result

IELTS Journey should become a clean, global, IELTS-focused product.

It should no longer feel Vietnamese-only.

Vietnamese should still be supported, but only as one language option.

The codebase should be cleaner, easier to maintain, free from stale code, and focused on the real IELTS learning journey.

Remove anything that is inappropriate, unused, broken, fake, duplicated, or not aligned with the long-term product vision.


## Current Task

### Remove Stale and Unused Code Across the Project

Identify and safely remove unused components, hooks, services, utilities, constants, types, routes, pages, assets, CSS, translation strings, mock/demo data, duplicate logic, commented-out code, console logs, and temporary TODO code. Confirm usage before removal to avoid breaking functionality.

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

- Inspect Project Structure and User-Facing Features (done)
- Create Localization System and Language Settings Architecture (done)
- Audit and Remove or Refactor Inappropriate Features (done)

## Acceptance Criteria

- All confirmed unused or stale code removed
- No broken references or imports remain
- Codebase size reduced and cleaner
- App builds and tests pass without errors

## Validation Commands

```bash
pnpm build
```
```bash
pnpm test
```

## Expected Outputs

- **Delete** `src/components/UnusedComponent.tsx`
  - Example of removed unused component
  - Validation: file_exists

- **Modify** `src/hooks/useOldHook.ts`
  - Removed unused hook and cleaned imports
  - Validation: file_diff

- **Modify** `src/utils/oldUtils.ts`
  - Removed duplicate and unused utility functions
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
