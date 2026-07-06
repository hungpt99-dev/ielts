# FlowTask Context Pack

## Original User Prompt

Implement the IELTS Journey full website redesign using the design documentation already created under:



The design documentation is the source of truth. Read all redesign docs before editing code.

Important: Do not redesign randomly. Do not ignore the design specs. Do not only make small cosmetic changes.

## Main Goal

Implement the new IELTS Journey website UI/UX based on the redesign documentation.

The website should feel like a modern, soft, friendly, mobile-first IELTS learning app inspired by:

**Personalized Learning App – UI Concept for Modern Education by Anastasia Golovko on Dribbble**
https://dribbble.com/shots/25300213-Personalized-Learning-App-UI-Concept-for-Modern-Education

Use this reference only as inspiration. Do not copy it directly.

## Docs to Read First

Before implementing, read these files:



Also read all page specs under:



Including:



## Implementation Scope

Implement the full website redesign for:

* Landing page
* Onboarding
* Dashboard
* Today’s Study Plan
* AI Study Plan Generator
* Full Study Roadmap
* AI Tutor Chat
* Vocabulary Notebook
* Vocabulary Review
* Saved Articles / Saved Text
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
* Empty states
* Loading states
* Error states
* Mobile layouts

## Important Rules

Do not break existing functionality.

Do not remove important features.

Do not hard-code design values.

Do not use random colors, spacing, shadows, font sizes, or border radius directly inside page components.

Use a centralized theme/design token system based on:



If the project already has a theme system, improve and reuse it.

If the project does not have a proper theme system, create one before redesigning pages.

All UI should use semantic tokens such as:

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

## Implementation Order

Work in this order.

### Phase 1: Inspect Existing Code

Before changing code:

1. Inspect the project structure.
2. Identify all routes/pages.
3. Identify existing layouts.
4. Identify existing theme/styling approach.
5. Identify reusable components.
6. Identify current dashboard, study plan, vocabulary, AI tutor, progress, and settings code.
7. Identify hard-coded UI values.
8. Identify stale or duplicated UI components.

Return a short implementation plan before making large changes.

### Phase 2: Theme and Design Tokens

Implement or improve the shared theme/design token system.

Include:

* Color tokens
* Surface tokens
* Text tokens
* Border tokens
* Skill color tokens
* AI Tutor color tokens
* Status tokens
* Spacing scale
* Border radius scale
* Shadow tokens
* Typography scale
* Breakpoints
* Animation tokens
* Light mode support
* Dark mode support if the project already supports it or can support it safely

Do not scatter design values across components.

### Phase 3: Reusable Component System

Implement or improve reusable UI components based on:



Components should include where relevant:

* Button
* IconButton
* Card
* Badge
* Input
* SearchInput
* Select
* Modal
* Drawer
* Toast
* Tabs
* ProgressBar
* ProgressRing
* EmptyState
* LoadingSkeleton
* ErrorState
* SkillCard
* StudyTaskCard
* AITutorMessageCard
* AITutorRecommendationCard
* VocabularyWordCard
* VocabularyDetailPanel
* PracticeCard
* MistakeCard
* ProgressSummaryCard
* DashboardSection
* MobileBottomNavigation
* SettingsSectionCard

Keep components reusable, typed, accessible, and consistent.

### Phase 4: Global Layout and Navigation

Implement the new global layout based on:



Improve:

* Desktop navigation
* Mobile navigation
* Bottom navigation on mobile
* Header behavior
* AI Tutor shortcut
* Active page states
* Profile/settings access
* Responsive layout

The user should always know:

* Where they are
* What they should do next
* How to access AI Tutor
* How to continue today’s study

### Phase 5: Page Redesign

Implement each page based on its page spec.

Start with the most important learning flow:

1. Dashboard
2. Today’s Study Plan
3. Full Study Roadmap
4. AI Tutor Chat
5. Vocabulary Notebook
6. Vocabulary Review
7. Learning Progress
8. AI Progress Review
9. Practice pages
10. Saved Content
11. Mistake Review
12. Settings
13. Onboarding
14. Landing Page
15. Extension Connection page

For each page:

* Preserve existing data and logic.
* Replace weak UI with the new design.
* Use reusable components.
* Use theme tokens.
* Add proper empty/loading/error states.
* Improve mobile layout.
* Keep accessibility in mind.

## Dashboard Requirement

The dashboard must become the main learning command center.

It should answer immediately:



Include:

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

The dashboard should feel like a personalized learning homepage, not an admin dashboard.

## AI Tutor Requirement

Make AI Tutor more visible and useful.

AI Tutor should appear through:

* Header shortcut
* Floating assistant button if appropriate
* AI recommendation card
* Contextual suggestions
* Chat page
* Study plan support
* Vocabulary support
* Progress support

AI Tutor UI should feel friendly, helpful, and integrated into the learning journey.

## Mobile Requirement

The website must feel excellent on mobile.

Do not make mobile feel like a squeezed desktop website.

Implement:

* Mobile-first responsive cards
* Bottom navigation
* Large touch targets
* Good page spacing
* Good modal/drawer behavior
* Readable study plan
* Usable vocabulary review
* Usable AI Tutor chat
* Usable progress charts
* Clean settings layout

## Empty, Loading, and Error States

Implement consistent states based on:



Every major page should have:

* Loading skeleton
* Empty state
* Error state
* Retry action where needed
* Helpful message
* Clear next action

Do not leave blank screens.

## Global Product Requirement

IELTS Journey should not feel Vietnamese-only.

Use global-friendly English as the default UI unless the current app language setting says otherwise.

Do not randomly mix Vietnamese and English.

Do not hard-code Vietnamese assumptions into:

* UI labels
* Empty states
* AI Tutor messages
* Examples
* Onboarding
* Settings

Keep the design ready for localization.

## Code Quality Requirements

Follow best practices:

* Keep code type-safe
* Keep components reusable
* Avoid duplicated UI logic
* Avoid large messy components
* Keep business logic separate from UI
* Keep theme tokens separate from components
* Avoid hard-coded styles
* Avoid random inline styles
* Avoid breaking existing local-first storage
* Avoid fake production data
* Avoid unnecessary rewrites
* Remove stale UI code only when safe
* Do not remove useful functionality
* Keep existing features working

## Testing Checklist

After implementation, test:

* Landing page renders correctly
* Onboarding works
* Dashboard loads and is responsive
* Today’s plan displays correctly
* Study roadmap displays correctly
* AI Tutor page works
* Vocabulary Notebook works
* Vocabulary Review works
* Saved content pages work
* Practice pages work
* Mistake Review works
* Learning Progress works
* AI Progress Review works
* Settings works
* Mobile layout works
* Empty states work
* Loading states work
* Error states work
* Theme tokens are used consistently
* No obvious hard-coded colors/spacings remain in changed files
* Existing user data still displays correctly
* No main route is broken

## Final Report

After finishing, return a report with:

* Files changed
* Components created
* Theme tokens added or updated
* Pages redesigned
* UX improvements made
* Mobile improvements made
* Accessibility improvements made
* Tests performed
* Any remaining issues
* Recommended next step

## Final Strict Instruction

Use the redesign documentation under  as the source of truth.

Do not implement a random design.

Do not only update the dashboard.

Implement the full website redesign step by step.

Do not hard-code design values.

Use theme/design tokens.

Keep all existing IELTS Journey features working correctly.


## Current Task

### Redesign Vocabulary Notebook and Vocabulary Review Pages

Redesign the Vocabulary Notebook and Vocabulary Review pages using the new design documentation. Preserve existing data and logic. Use reusable components and theme tokens. Implement empty, loading, and error states with retry actions and helpful messages. Ensure mobile-first responsive layout and accessibility.

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

- Inspect Existing Project Structure and UI Code (done)
- Implement or Improve Theme and Design Token System (done)
- Refine Existing Reusable UI Components per Redesign Specs (done)
- Create New Reusable UI Components per Redesign Requirements (done)
- Redesign Global Layout and Navigation Components (done)
- Redesign Dashboard Page as Main Learning Command Center (done)
- Redesign Today's Study Plan Page with New UI and States (done)
- Redesign Full Study Roadmap Page with Visual Journey and AI Tutor Integration (done)
- Redesign AI Tutor Chat and Integration UI (done)

## Acceptance Criteria

- Vocabulary Notebook and Review UIs match design specs
- Data and logic are preserved
- Empty, loading, and error states are implemented
- Mobile layout is responsive and accessible

## Validation Commands

```bash
pnpm test
```
```bash
pnpm lint
```

## Expected Outputs

- **Modify** `apps/web/src/pages/vocabulary/NotebookPage.tsx`
  - Implement redesigned Vocabulary Notebook UI and states
  - Validation: file_diff

- **Modify** `apps/web/src/pages/vocabulary/ReviewPage.tsx`
  - Implement redesigned Vocabulary Review UI and states
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
