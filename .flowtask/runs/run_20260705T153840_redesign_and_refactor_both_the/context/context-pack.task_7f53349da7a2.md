# FlowTask Context Pack

## Original User Prompt

Redesign and refactor both the **IELTS Journey Website** and **IELTS Journey Browser Extension** because the current UX/UI feels too basic, boring, and not polished enough for real users.

Use this design as the main visual reference:

**Reference Design:** Personalized Learning App – UI Concept for Modern Education by Anastasia Golovko on Dribbble
**Reference Link:** https://dribbble.com/shots/25300213-Personalized-Learning-App-UI-Concept-for-Modern-Education

Important: Do not copy the reference design exactly. Use it only as inspiration for soft modern style, rounded cards, friendly learning dashboard, visual hierarchy, progress visualization, spacing, mobile-first feeling, and personalized education experience.

## Main Goal

Make IELTS Journey feel like a beautiful, modern, personalized IELTS learning companion across both:

* Website
* Browser extension

The website and extension should feel like one connected product, not two separate random tools.

The user should feel that IELTS Journey is:

* A personal IELTS learning coach
* A modern education app
* A daily study planner
* A friendly AI tutor
* A vocabulary learning tool
* A reading and web-learning assistant
* A roadmap from current IELTS level to target band
* A global product, not only for Vietnamese users

## Scope

Redesign and improve UX/UI for both the website and extension.

Website areas:

* Landing page
* Onboarding
* Dashboard
* Today’s Study Plan
* AI Tutor Chat
* AI Study Plan Generator
* Full Study Roadmap
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
* Extension connection page
* Empty states
* Loading states
* Error states
* Mobile views

Extension areas:

* Extension popup
* Vocabulary list in popup
* Vocabulary detail view
* Read/pronunciation button
* AI Tutor entry point
* Selected text action menu
* Save vocabulary flow
* Save selected text flow
* Explain selected text flow
* Simplify selected text flow
* Save article flow
* YouTube/video helper UI if available
* Auto-highlight saved words on web pages
* Vocabulary review entry point
* Pending review count
* Logged-out state
* Loading state
* Empty state
* Error state
* Settings shortcut
* Sync status between extension and website

## Product Experience

When the user opens the website, they should immediately understand:

* What to study today
* What their IELTS goal is
* How close they are to the exam date
* What skills are weak
* What vocabulary needs review
* What AI Tutor recommends next

When the user opens the extension, they should immediately understand:

* What they can do with the current webpage
* Which selected text can be saved or explained
* Which words are already saved
* What vocabulary needs review
* How to ask AI Tutor about the current page or selected text

The website should be the main learning dashboard.

The extension should be the lightweight learning assistant that helps users learn from any webpage.

## Design Direction

Follow the feeling of the reference design:

* Soft background
* Clean rounded cards
* Friendly colors
* Beautiful spacing
* Calm gradients
* Modern typography
* Mobile-first layout
* Progress-focused learning cards
* Clear visual hierarchy
* Friendly icons
* Personal learning dashboard feeling

Avoid:

* Boring admin dashboard style
* Plain gray cards everywhere
* Too much dense text
* Random colors
* Overly corporate design
* Overly childish design
* Hard-coded styles
* Inconsistent spacing
* Inconsistent card design
* Extension popup that feels disconnected from the website

## Website Dashboard Requirement

The website dashboard should become the main learning command center.

It should include:

* Friendly greeting
* Target IELTS band
* Current estimated level
* Exam countdown
* Today’s learning mission
* AI Tutor recommendation
* Study streak
* Skill progress cards
* Vocabulary review reminder
* Weak skill warning
* Weekly progress summary
* Continue learning button
* Quick actions

The dashboard should feel like a personalized learning homepage, not an admin panel.

## Website Today’s Mission

Create a strong **Today’s Mission** section.

It should show:

* Main goal for today
* Estimated study time
* Listening task
* Reading task
* Writing task
* Speaking task
* Vocabulary task
* Grammar task
* Review task
* Completion progress
* Start or Continue button
* AI Tutor note

The user should instantly know what to do next.

## Website AI Tutor UX

Make AI Tutor more visible and useful.

AI Tutor should appear as:

* Header chat icon
* Floating assistant button
* Messenger-style popup
* AI recommendation card on dashboard
* Contextual help inside lessons
* Proactive tutor messages
* Follow-up suggestions after completed tasks

AI Tutor should feel like a real tutor, not a hidden chatbot.

The AI Tutor UI should use friendly cards, avatar/icon, soft background, and clear action buttons.

Example AI Tutor message:

“Good job yesterday. Today I recommend reviewing 12 vocabulary words and doing one Writing Task 2 outline because your recent essays need stronger idea development.”

## Extension UX Requirement

Redesign the extension so it feels polished, useful, and connected to IELTS Journey.

The extension popup should be clean, compact, and beautiful.

It should include:

* User greeting or logged-out state
* Today’s quick learning status
* Saved vocabulary shortcut
* Pending vocabulary review count
* AI Tutor shortcut
* Current page actions
* Selected text actions
* Save article button
* Recent saved words
* Sync status
* Settings shortcut

The popup should not feel like a basic developer tool.

It should feel like a mini learning companion.

## Extension Selected Text UX

When the user selects text on a webpage, show a small, polished action menu.

Actions can include:

* Explain
* Simplify
* Save vocabulary
* Save selected text
* Ask AI Tutor
* Generate exercise if supported

The selected text menu should be:

* Small
* Fast
* Non-intrusive
* Beautiful
* Easy to close
* Safe across websites
* Not breaking webpage layout

## Extension Auto-Highlight UX

Auto-highlight saved vocabulary on web pages, but safely.

Requirements:

* Highlight only saved words
* Avoid duplicate highlights
* Avoid breaking website layout
* Avoid highlighting inside inputs, textareas, code blocks, or editable content
* Work on dynamic pages when possible
* Use subtle highlight style
* Let user enable or disable auto-highlight
* Let user control highlight intensity if possible

The highlight style should use extension theme tokens, not random hard-coded colors.

## Extension AI Tutor UX

AI Tutor in the extension should be able to use context from:

* Selected text
* Current page title
* Current page URL
* Saved words
* Saved article content if available
* User IELTS profile
* Current study plan
* Weak skills
* Recent mistakes

AI Tutor should help users understand and save learning material from real webpages.

Example extension AI Tutor messages:

“This paragraph is useful for IELTS Reading. I can explain the difficult vocabulary or turn it into a short practice exercise.”

“You saved 6 new words from this page. Review them later in your Vocabulary Notebook.”

“This sentence has a useful Writing Task 2 phrase. Do you want to save it?”

## Extension Vocabulary UX

Redesign vocabulary inside the extension.

Vocabulary list should include:

* Word
* Short meaning
* Review status
* Difficulty badge
* Pronunciation/read button
* Quick detail view

Vocabulary detail should include:

* Meaning
* Pronunciation
* Part of speech
* Word forms if available
* Synonyms
* Example sentence
* IELTS usage
* Save/review status
* Ask AI Tutor button

The extension vocabulary UI should be simple but useful.

## Shared Design System

The website and extension should share the same product identity.

Create or improve a shared design system for both.

Use shared theme/design tokens for:

* Colors
* Background colors
* Text colors
* Border colors
* Skill colors
* AI Tutor colors
* Status colors
* Font sizes
* Font weights
* Spacing
* Border radius
* Shadows
* Z-index values
* Breakpoints
* Animation durations

The design system should support:

* Light mode
* Dark mode
* Future custom themes
* Global brand consistency
* Website and extension consistency
* Easy design updates without editing every component

## No Hard-Code Requirement

Do not hard-code colors, spacing, fonts, border radius, shadows, or repeated UI values directly inside components.

Avoid:

* Random hex colors inside components
* Repeated inline styles
* Magic numbers for spacing
* Different card styles on every page
* Different extension popup styles from website styles
* Hard-coded text sizes without a typography system
* Hard-coded IELTS skill colors in many files
* Hard-coded button/card/badge styles everywhere

Use semantic theme tokens such as:

* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 
* 

If the project already has a theme system, reuse and improve it.

If the project does not have a theme system, create a clean centralized theme/design token structure before redesigning pages and extension UI.

The redesign must not be a collection of hard-coded styles. It must be built on a reusable, maintainable, scalable theme and design system.

## Extension Styling Safety

The extension must not break host websites.

For content script UI:

* Use isolated root or Shadow DOM where appropriate
* Scope extension styles carefully
* Avoid global CSS pollution
* Avoid modifying website layout unexpectedly
* Avoid injecting duplicate UI
* Avoid duplicate event listeners
* Keep Manifest V3 compatibility
* Keep content script UI lightweight
* Keep popup UI fast

The extension should look beautiful while remaining safe and isolated.

## Reusable Components

Create or improve reusable UI components for both website and extension where possible:

* Button
* Icon button
* Card
* Badge
* Input
* Search input
* Modal
* Drawer
* Toast
* Progress bar
* Progress ring
* Empty state
* Loading skeleton
* Skill card
* AI Tutor message card
* Study task card
* Vocabulary word card
* Dashboard section
* Mobile bottom navigation
* Extension popup card
* Extension action menu
* Extension selected text menu
* Extension sync status badge

Do not style each page or extension screen randomly.

## Mobile-First Website Requirement

The website must feel excellent on mobile.

Improve:

* Bottom navigation
* Touch targets
* Responsive cards
* Chat popup behavior
* Study plan layout
* Vocabulary review layout
* Practice screen layout
* Progress charts
* Settings layout
* Modal/drawer behavior
* Form inputs
* Page spacing

The mobile experience should not feel like a squeezed desktop website.

## Extension Popup Size Requirement

The extension popup should work well within typical browser extension popup sizes.

It should be:

* Compact
* Scrollable when needed
* Fast to load
* Easy to scan
* Touch-friendly enough for touch devices
* Not visually crowded
* Not dependent on wide desktop layout

## Empty, Loading, and Error States

Improve empty, loading, and error states for both website and extension.

Website examples:

No vocabulary:

“Your vocabulary notebook is empty. Save words from articles, lessons, or the browser extension to start building your IELTS word bank.”

No study plan:

“You do not have a study plan yet. Generate a personalized roadmap from today to your exam day.”

No progress data:

“Complete a few lessons first, then AI Tutor can review your progress and recommend what to improve.”

Extension examples:

No selected text:

“Select text on any webpage to explain, simplify, or save it.”

Logged out:

“Sign in to sync your vocabulary, saved text, and study progress.”

No saved words:

“Save words from webpages to build your IELTS vocabulary notebook.”

Use:

* Friendly message
* Short explanation
* Clear action button
* Optional icon or illustration
* Skeleton loading cards
* Retry buttons for errors
* Clear sync/error status in extension

## Global Product Requirement

IELTS Journey should not feel Vietnamese-only.

Default product experience should be suitable for global IELTS learners.

Vietnamese can remain as one supported language option, but do not hard-code Vietnamese assumptions into the UI, AI prompts, empty states, examples, onboarding, website, or extension.

Prepare both website and extension for localization and future multi-language support.

Do not randomly mix English and Vietnamese unless the user chooses that language behavior.

## Website and Extension Consistency

The website and extension should have consistent:

* Brand feeling
* Colors
* Typography
* Icons
* Button styles
* Card styles
* AI Tutor tone
* Empty states
* Loading states
* Error states
* Vocabulary design
* Progress/review language
* Settings naming

The extension should feel like a small version of IELTS Journey, not a separate product.

## Code Quality Requirement

Follow best practices:

* Reuse components
* Avoid duplicated UI logic
* Keep components clean and readable
* Use responsive design properly
* Use theme tokens instead of hard-coded styles
* Avoid hard-coded layout hacks
* Remove old unused UI components safely
* Do not break existing functionality
* Do not remove important features
* Keep the app production-ready
* Keep TypeScript types clean
* Avoid large messy components
* Extract reusable UI patterns
* Keep business logic separate from UI styling
* Keep extension content script logic separate from UI components
* Keep storage/sync logic separate from presentation components

## Required Process

Before redesigning:

1. Inspect the existing project structure.
2. Inspect website routes, pages, components, styles, and theme system.
3. Inspect extension popup, content scripts, background/service worker, storage, and styles.
4. Identify weak UX/UI areas in both website and extension.
5. Identify hard-coded design values.
6. Identify duplicated UI/components between website and extension.
7. Create or improve the centralized theme/design token system.
8. Redesign website pages using reusable components.
9. Redesign extension popup and content script UI safely.
10. Test desktop, mobile, and extension flows.
11. Confirm existing features still work.

Before finishing:

* Audit website UI code.
* Audit extension UI code.
* Remove random hard-coded colors, spacing, shadows, typography values, and repeated UI values.
* Confirm the design uses shared theme tokens consistently.
* Confirm the website and extension feel connected.
* Confirm the extension does not break host websites.
* Confirm the UI feels close to the reference design direction without copying it exactly.

## Testing Requirement

After redesigning, test website flows:

* Landing page
* Onboarding
* Dashboard
* Generate study plan
* View today’s plan
* Use AI Tutor
* Save vocabulary
* Review vocabulary
* View progress
* Use mobile layout
* Open settings
* Switch theme if supported
* Check dark mode if supported

After redesigning, test extension flows:

* Install extension locally
* Open popup
* View logged-out state
* View logged-in state if supported
* Select text on a webpage
* Open selected text action menu
* Explain selected text
* Simplify selected text
* Save vocabulary
* Save selected text
* Save article
* View vocabulary in popup
* Use pronunciation/read button
* Start vocabulary review
* Open AI Tutor from extension
* Auto-highlight saved words
* Refresh webpage and confirm no duplicate UI
* Test on dynamic pages
* Test on restricted pages
* Confirm extension does not break website layout

## Final Goal

After the redesign, IELTS Journey should feel like a complete modern IELTS learning platform across both website and extension.

Users should feel:

* Clear about what to study
* Motivated to continue
* Guided by AI Tutor
* Confident about their progress
* Comfortable using the website every day
* Comfortable using the extension while reading the web
* Impressed by the product quality

The final website and extension should no longer feel basic or boring.

They should feel polished, personal, mobile-friendly, globally ready, and inspired by the reference learning app design.

## Final Strict Instruction

Do not only make cosmetic changes.

Redesign the full UX flow, visual hierarchy, navigation, dashboard, AI Tutor experience, mobile layout, extension popup, extension selected-text menu, extension highlight UI, empty states, progress visualization, and design system.

Do not hard-code design values.

Use a centralized theme/design token system.

Use the reference link as inspiration only, not as a direct copy.

Keep all existing IELTS Journey website and extension features working correctly.


## Current Task

### Implement mobile-first responsive improvements for website and extension

Improve mobile experience for the website and extension including bottom navigation, touch targets, responsive cards, chat popup behavior, study plan layout, vocabulary review layout, practice screen layout, progress charts, settings layout, modal/drawer behavior, form inputs, and page spacing. Ensure the website does not feel like a squeezed desktop site and the extension popup is touch-friendly and scrollable within typical popup sizes.

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

- Analyze existing IELTS Journey website and extension codebase and UX/UI (done)
- Design and implement a centralized theme and design token system for website and extension (done)
- Refactor and create reusable UI components using the shared design system (done)
- Redesign and implement the IELTS Journey website dashboard and main learning pages (done)
- Redesign and implement the IELTS Journey browser extension popup and content script UI (done)

## Acceptance Criteria

- Website layouts adapt smoothly to mobile screen sizes
- Extension popup is touch-friendly and scrollable on mobile devices
- Touch targets meet accessibility guidelines
- No layout breakage or overflow on small screens
- Mobile navigation and modals behave correctly

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/components/MobileBottomNavigation.tsx`
  - Improved mobile bottom navigation with touch-friendly targets
  - Validation: file_diff

- **Modify** `apps/web/src/pages/StudyPlan.tsx`
  - Responsive study plan layout for mobile
  - Validation: file_diff

- **Modify** `apps/extension/src/popup/App.tsx`
  - Extension popup scroll and touch improvements
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
