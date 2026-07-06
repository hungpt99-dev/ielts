# FlowTask Context Pack

## Original User Prompt

Update the IELTS Journey website and browser extension UI/UX to use a beautiful **flat, colorful, rounded, modern education app style**, improve all icons using a consistent modern icon library, and fix all UX/UI bugs.

The goal is to make IELTS Journey feel more beautiful, friendly, clean, colorful, polished, mobile-first, and production-ready.

Do not only make cosmetic changes. Improve the visual system, component consistency, responsive behavior, extension UI, icon system, layout quality, and all UX/UI issues that make the product feel unfinished.

## Main Design Direction

Use a **flat modern learning app style**:

* Flat design
* Bright but controlled colors
* Soft colorful cards
* Large border radius
* Clean layout
* Beautiful icons
* Simple shapes
* Friendly spacing
* Clear visual hierarchy
* Mobile-first feeling
* Modern education app look

The UI should feel like:

* Modern learning app
* Friendly IELTS study companion
* Colorful but professional
* Simple but not boring
* Beautiful but not childish
* Easy to use every day
* Global IELTS product, not Vietnamese-only

## Scope

Apply this redesign and UX/UI bug fix to both:

### Website

* Landing page
* Onboarding
* Dashboard
* Today’s Study Plan
* Study Roadmap
* AI Study Plan Generator
* AI Tutor Chat
* Vocabulary Notebook
* Vocabulary Review
* Saved Articles
* Saved Text
* Reading Practice
* Listening Practice
* Writing Practice
* Speaking Practice
* Grammar / Exercise pages if available
* Mistake Review
* Learning Progress
* AI Progress Review
* Settings
* AI Provider Settings
* Extension Connection page
* Mobile layout
* Empty states
* Loading states
* Error states

### Browser Extension

* Extension popup
* Popup header
* Vocabulary list
* Vocabulary detail view
* AI Tutor shortcut
* Selected text action menu
* Save vocabulary flow
* Save selected text flow
* Explain selected text flow
* Simplify selected text flow
* Save article flow
* Auto-highlight saved words
* Sync status
* Logged-out state
* Loading state
* Empty state
* Error state
* Settings shortcut

## Visual Style Requirements

Update the UI with:

* Colorful feature cards
* Rounded cards
* Rounded buttons
* Rounded badges
* Soft flat backgrounds
* Skill-based colors
* Beautiful empty states
* Modern icons
* Better spacing
* Better typography
* Better dashboard layout
* Better extension popup UI
* Better mobile layout
* Better selected-text action menu

Use border radius strongly and consistently:

* Cards should feel soft and rounded
* Buttons should feel touch-friendly
* Badges should feel pill-shaped
* Inputs should feel clean and rounded
* Extension popup should feel like a small modern app
* Selected-text menu should feel like a polished floating action menu

Avoid:

* Boring gray admin UI
* Too many borders
* Random colors
* Hard-coded hex colors everywhere
* Default browser-looking buttons
* Dense text blocks
* Mixed icon styles
* Emoji as main icons
* Overly corporate SaaS style
* Overly childish game style
* Inconsistent spacing
* Inconsistent card style
* Inconsistent icon style

## Icon Requirement

Audit the current icon usage first.

If the project already uses a good icon library, reuse it consistently.

If current icons are inconsistent, ugly, duplicated, or basic, replace them with one modern icon library.

Recommended libraries:

* 
* 
* 
* 

Choose **one main icon library** and use it consistently.

Recommended choice:

Use **phosphor-react** if the app needs a softer, more expressive education-app feeling.

Use **lucide-react** if the app needs a cleaner, lighter, iOS-like flat style.

Icons should be used for:

* Dashboard
* Today’s Study Plan
* AI Tutor
* Study Plan
* Vocabulary
* Vocabulary Review
* Reading
* Listening
* Writing
* Speaking
* Grammar
* Saved Articles
* Saved Text
* Mistakes
* Progress
* Settings
* Exam countdown
* Study streak
* Notifications
* Search/filter
* Extension popup actions
* Selected text actions
* Empty states

## Icon Style Rules

Icons should be:

* Clean
* Rounded
* Consistent
* Easy to recognize
* Same stroke style
* Same visual weight
* Properly sized
* Aligned with text
* Colored using theme tokens

Avoid:

* Mixing many icon libraries
* Random emoji icons
* Icons with different stroke widths
* Icons that are too detailed
* Icons that make the app look childish
* Hard-coded icon colors everywhere

Create or update a shared icon mapping file if useful, such as:



Use semantic icon names:



This makes icons easier to replace later.

## Color System Requirement

Use a colorful but controlled theme system.

Do not hard-code random colors directly inside components.

Use semantic color tokens such as:



Each IELTS skill should have its own beautiful color:

* Listening
* Reading
* Writing
* Speaking
* Vocabulary
* Grammar
* Review
* AI Tutor

Use colors for meaning, not decoration only.

## Border Radius Requirement

Create consistent border radius tokens.

Use tokens such as:



Apply them consistently to:

* Cards
* Buttons
* Badges
* Inputs
* Modals
* Drawers
* Popups
* Extension UI
* Selected text menu
* Vocabulary cards
* Study task cards
* Progress cards
* AI Tutor cards

Do not use random border radius values in many files.

## Theme and No Hard-Code Rule

Before updating pages, inspect the current styling system.

If there is already a theme system, improve it.

If there is no good theme system, create a clean theme/design token system first.

Do not hard-code:

* Random hex colors
* Random spacing values
* Random shadows
* Random border radius
* Random font sizes
* Random icon colors
* Random card styles
* Random button styles

All repeated design values should come from the shared theme/design tokens.

## Components to Update

Update or create reusable flat-style components:

* Button
* IconButton
* Card
* FeatureCard
* SkillCard
* StudyTaskCard
* ProgressCard
* VocabularyCard
* AITutorCard
* Badge
* Input
* SearchInput
* Select
* Tabs
* Modal
* Drawer
* Toast
* EmptyState
* LoadingSkeleton
* ErrorState
* BottomNavigation
* ExtensionPopupCard
* SelectedTextActionMenu
* SyncStatusBadge

Each component should use:

* Theme colors
* Theme radius
* Theme spacing
* Theme typography
* Theme icons

Do not style each page randomly.

## Dashboard UI Requirement

Redesign the dashboard with a flat colorful learning app style.

Dashboard should include:

* Friendly greeting
* Today’s mission card
* AI Tutor recommendation card
* IELTS band progress
* Exam countdown
* Study streak
* Skill progress cards
* Vocabulary review card
* Quick actions with beautiful icons

The dashboard should immediately answer:



The dashboard should feel like a personalized learning homepage, not an admin panel.

## AI Tutor UI Requirement

Make AI Tutor feel more beautiful and visible.

Improve:

* AI Tutor card
* AI Tutor chat entry
* AI Tutor popup if available
* AI recommendation messages
* Suggested prompt buttons
* Proactive tutor messages
* Contextual help cards

AI Tutor UI should use:

* Friendly icon/avatar
* Soft colorful card
* Clear message layout
* Rounded action buttons
* Helpful suggested actions

## Study Plan UI Requirement

Improve study plan UI with:

* Colorful daily task cards
* Clear phase labels
* Today highlight
* Completed/skipped/partial states
* Progress bar
* Skill icons
* AI Tutor explanation
* Easy mobile layout

The study plan should feel like a guided journey, not a boring task list.

## Vocabulary UI Requirement

Improve vocabulary UI with:

* Beautiful word cards
* Difficulty badges
* Review status
* Pronunciation/read button
* Part of speech
* Word detail panel
* Search/filter
* Topic grouping
* AI Tutor action
* Empty state with icon

Vocabulary should feel like a real learning tool, not a simple list.

## Extension UI Requirement

Update the browser extension UI with the same flat colorful style.

Extension popup should include:

* Clean header
* AI Tutor shortcut
* Vocabulary shortcut
* Review count
* Save article action
* Selected text actions
* Recent saved words
* Sync status
* Settings shortcut

The extension popup should feel like a compact modern learning widget, not a developer tool.

The extension selected-text menu should be:

* Small
* Rounded
* Colorful but subtle
* Beautiful
* Fast
* Non-intrusive
* Easy to close
* Safe for webpages

Do not let extension styles leak into host websites.

Use isolated styles or Shadow DOM where appropriate.

## Extension Safety Requirement

The extension must remain safe and isolated.

Do not:

* Break host website layout
* Inject duplicate UI
* Leak extension CSS into webpages
* Create duplicate event listeners
* Break Manifest V3 behavior
* Highlight inside inputs, textareas, code blocks, or editable content
* Cause layout shift on websites
* Spam API calls

## Mobile UI Requirement

Make the mobile UI feel like a real modern app.

Improve:

* Bottom navigation
* Large touch targets
* Rounded cards
* Colorful quick actions
* Study plan cards
* Vocabulary review cards
* AI Tutor chat
* Progress cards
* Settings layout
* Modal/drawer behavior
* Form spacing

The mobile layout should not feel like a squeezed desktop website.

## Additional Requirement: Fix All UX/UI Bugs

In addition to updating the UI to a flat, colorful, rounded style with beautiful icons, audit and fix all existing UX/UI bugs across the website and browser extension.

The goal is not only to make the app beautiful, but also to make the user experience smooth, consistent, responsive, and production-ready.

## UX/UI Bug Audit Scope

Audit and fix issues related to:

* Broken layouts
* Overlapping elements
* Text overflow
* Cards with inconsistent height
* Buttons misaligned with text/icons
* Icons not centered
* Bad spacing between sections
* Poor mobile responsiveness
* Horizontal scrolling on mobile
* Modals too large on small screens
* Dropdowns clipped by containers
* Popups positioned incorrectly
* Tooltip/menu placement bugs
* Extension popup overflow issues
* Extension selected-text menu positioning bugs
* Auto-highlight UI breaking webpage layout
* Loading states missing or ugly
* Empty states missing or unclear
* Error states missing or too technical
* Disabled states unclear
* Focus states missing
* Hover states inconsistent
* Active navigation state wrong
* Dark mode visual bugs if supported
* Color contrast issues
* Inconsistent font sizes
* Inconsistent border radius
* Inconsistent card styles
* Inconsistent icon sizes
* Inconsistent button styles
* Inconsistent page padding
* Inconsistent responsive behavior

## Website UX/UI Bugs to Fix

Check and fix UX/UI bugs in:

* Landing page
* Onboarding
* Dashboard
* Today’s Study Plan
* Study Roadmap
* AI Tutor Chat
* Vocabulary Notebook
* Vocabulary Review
* Saved Articles
* Saved Text
* Reading Practice
* Listening Practice
* Writing Practice
* Speaking Practice
* Mistake Review
* Learning Progress
* AI Progress Review
* Settings
* AI Provider Settings
* Mobile layout
* Empty states
* Loading states
* Error states

## Extension UX/UI Bugs to Fix

Check and fix UX/UI bugs in:

* Extension popup
* Popup header
* Vocabulary list
* Vocabulary detail view
* AI Tutor shortcut
* Selected text action menu
* Save vocabulary flow
* Save selected text flow
* Explain/simplify selected text flow
* Save article flow
* Auto-highlight saved words
* Sync status
* Logged-out state
* Loading state
* Empty state
* Error state
* Settings shortcut

## UX Quality Requirements

Every page and extension screen should have:

* Clear primary action
* Clear visual hierarchy
* Consistent spacing
* Consistent card style
* Consistent icon style
* Proper loading state
* Proper empty state
* Proper error state
* Good mobile behavior
* Accessible buttons and inputs
* No broken layout at common screen sizes

Test these screen sizes:

* Mobile small
* Mobile large
* Tablet
* Laptop
* Desktop
* Browser extension popup size

## Accessibility Requirement

Keep accessibility strong:

* Icon-only buttons must have accessible labels
* Do not rely only on color
* Keep text contrast readable
* Keep focus states visible
* Use semantic HTML where possible
* Make touch targets comfortable
* Keep icons understandable with labels where needed
* Error messages should be clear and helpful

## Regression Safety

Do not only fix visuals and accidentally break behavior.

After UI fixes, confirm:

* Navigation still works
* Buttons still trigger correct actions
* Forms still submit correctly
* AI Tutor still opens and works
* Study plan data still displays correctly
* Vocabulary actions still work
* Extension popup still opens correctly
* Selected text menu still appears correctly
* Auto-highlight still works safely
* Settings still save correctly
* Existing local data is not lost

## Implementation Process

Work in this order:

1. Inspect current UI, theme, and icon usage.
2. Check  for existing icon libraries.
3. Choose one main icon library.
4. Create or improve shared icon mapping.
5. Create or improve flat colorful theme tokens.
6. Audit current UX/UI bugs across website and extension.
7. Update reusable components first.
8. Update dashboard and core pages.
9. Update AI Tutor UI.
10. Update study plan UI.
11. Update vocabulary UI.
12. Update progress and review UI.
13. Update settings UI.
14. Update extension popup and selected-text menu.
15. Update mobile layout.
16. Remove inconsistent old icons and unused icon imports.
17. Audit changed files for hard-coded design values.
18. Test all updated UI and core user flows.

## Important Rules

* Do not rewrite the whole app unnecessarily.
* Do not break existing functionality.
* Do not remove important features.
* Do not use random hard-coded styles.
* Do not mix many icon libraries.
* Do not use emoji as main UI icons.
* Do not make the app look childish.
* Keep IELTS Journey global, not Vietnamese-only.
* Keep the UI clean, typed, reusable, and production-ready.
* Keep extension UI isolated from host websites.
* Do not mark the task complete until the UI is both beautiful and usable.

## Final Result

IELTS Journey should look more beautiful with:

* Flat colorful design
* Strong border radius
* Modern icons
* Better cards
* Better dashboard
* Better AI Tutor UI
* Better study plan UI
* Better vocabulary UI
* Better extension popup
* Better selected-text menu
* Better mobile experience
* Consistent theme tokens
* No random hard-coded styles
* Fixed UX/UI bugs

## Final Report

Return a final report with:

* Icon library selected
* Icons replaced
* Theme tokens added or updated
* Components updated
* Pages updated
* Extension UI updated
* UX/UI bugs found
* UX/UI bugs fixed
* Responsive bugs fixed
* Accessibility improvements
* Hard-coded styles removed
* Tests performed
* Remaining issues


## Current Task

### Update progress and review UI components and pages with consistent colorful style

Refactor Learning Progress, AI Progress Review, Mistake Review, and related components/pages to use consistent colorful cards, progress bars, badges, and icons. Ensure clear visual hierarchy and mobile responsiveness using theme tokens and icon mapping.

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

- Audit current icon usage and existing icon libraries in website and extension (done)
- Select and integrate main icon library phosphor-react or lucide-react (done)
- Create or improve flat colorful theme tokens for colors, border radius, spacing, typography (done)
- Audit and document all UX/UI bugs across website and extension (done)
- Update reusable UI components to flat colorful rounded style using theme tokens and icon mapping (done)
- Redesign and update Dashboard page with flat colorful style and improved layout (done)
- Update AI Tutor UI components and pages with friendly colorful style (done)
- Redesign Study Plan UI with colorful daily task cards and clear progress indicators (done)
- Improve Vocabulary UI with beautiful word cards, badges, and AI Tutor actions (done)

## Acceptance Criteria

- Progress and review pages use consistent colorful style
- Mobile responsiveness improved
- No UX/UI bugs remain in progress and review UI

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/pages/progress/LearningProgress.tsx`
  - Updated Learning Progress page
  - Validation: file_diff

- **Modify** `apps/web/src/pages/progress/AIProgressReview.tsx`
  - Updated AI Progress Review page
  - Validation: file_diff

- **Modify** `apps/web/src/pages/mistakes/MistakeReview.tsx`
  - Updated Mistake Review page
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
