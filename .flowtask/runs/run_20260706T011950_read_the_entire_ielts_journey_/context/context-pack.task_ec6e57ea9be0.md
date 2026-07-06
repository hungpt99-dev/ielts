# FlowTask Context Pack

## Original User Prompt

Read the entire IELTS Journey codebase and create **full website design documentation files only**.

Do not update application source code.
Do not edit React components.
Do not edit extension code.
Do not edit CSS, Tailwind, theme, routing, storage, or logic files.
Do not implement the redesign yet.

The goal is to analyze the current IELTS Journey website and create a complete design package for redesigning the **full website**, not only the dashboard.

## Design Reference

Use this reference as inspiration:

**Personalized Learning App – UI Concept for Modern Education by Anastasia Golovko on Dribbble**
https://dribbble.com/shots/25300213-Personalized-Learning-App-UI-Concept-for-Modern-Education

Important: Do not copy the reference exactly. Use it only for inspiration: soft modern style, rounded cards, friendly learning dashboard, beautiful spacing, progress cards, mobile-first feeling, and personalized education experience.

## Main Goal

Create a complete design specification for the full IELTS Journey website.

IELTS Journey should feel like:

* A personal IELTS learning companion
* A modern education app
* A friendly AI tutor
* A daily study planner
* A vocabulary learning tool
* A progress tracking system
* A global IELTS learning product
* A mobile-first learning app

The design should make users feel:

* Clear about what to study
* Motivated to continue
* Guided by AI Tutor
* Confident about progress
* Comfortable using the app every day

## Scope

Create design documentation for the full website, including:

* Landing page
* Onboarding
* Auth pages if available
* Dashboard
* Today’s Study Plan
* AI Study Plan Generator
* Full Study Roadmap
* AI Tutor Chat
* Vocabulary Notebook
* Vocabulary Detail
* Vocabulary Review
* Saved Articles
* Saved Text
* Reading Practice
* Listening Practice
* Writing Practice
* Speaking Practice
* Grammar Practice
* Exercise Generator
* Mistake Review
* Learning Progress
* AI Progress Review
* Settings
* Profile Settings
* AI Provider Settings
* Language Settings
* Data Export / Import if available
* Extension Connection page
* Empty states
* Loading states
* Error states
* Mobile layouts
* Dark mode direction if supported

## Required Output Files

Create these design documentation files only:



Do not modify existing production code.

## File 1: Redesign Overview

Create:



Include:

* Current UX/UI problems
* New design direction
* Product feeling
* Design inspiration explanation
* Before/after UX goal
* Main design principles
* Target users
* Global product direction
* Why the current website feels basic
* What the new website should feel like

The design direction should be:

* Soft
* Clean
* Modern
* Friendly
* Motivating
* Premium
* Mobile-first
* Personal
* Global
* IELTS-focused

## File 2: Information Architecture

Create:



Include:

* Current route/page structure
* Recommended new page structure
* Main user flows
* Feature grouping
* Page hierarchy
* Dashboard-first learning flow
* AI Tutor entry points
* Study plan flow
* Vocabulary flow
* Practice flow
* Progress review flow
* Settings flow

The website should be organized so users always understand:

* Where they are
* What they should do next
* How today’s study connects to their exam goal

## File 3: Global Navigation Spec

Create:



Include:

* Desktop navigation
* Mobile navigation
* Bottom navigation for mobile
* Header behavior
* AI Tutor shortcut
* User profile menu
* Settings access
* Active page states
* Responsive behavior
* Navigation labels
* Navigation priority

Recommended main navigation:

* Dashboard
* Today
* Study Plan
* AI Tutor
* Vocabulary
* Practice
* Progress
* Settings

## File 4: Shared Theme Design Tokens

Create:



Define the shared theme direction.

Include token suggestions for:

* Colors
* Background colors
* Surface colors
* Text colors
* Border colors
* AI Tutor colors
* IELTS skill colors
* Vocabulary colors
* Grammar colors
* Status colors
* Font sizes
* Font weights
* Spacing
* Border radius
* Shadows
* Z-index
* Breakpoints
* Animation durations

Use semantic token names such as:

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

Important: This file should describe the token system only. Do not implement it yet.

## File 5: Component System Spec

Create:



Describe reusable UI components needed for the full website.

Include specs for:

* Button
* Icon button
* Card
* Badge
* Input
* Search input
* Select
* Date picker
* Modal
* Drawer
* Toast
* Tabs
* Progress bar
* Progress ring
* Empty state
* Loading skeleton
* Error state
* Skill card
* Study task card
* AI Tutor message card
* AI Tutor recommendation card
* Vocabulary word card
* Vocabulary detail panel
* Practice card
* Mistake card
* Progress summary card
* Dashboard section
* Mobile bottom navigation
* Settings section card

For each component, describe:

* Purpose
* Visual style
* States
* Variants
* Responsive behavior
* Accessibility notes
* Where it should be used

Do not create component code yet.

## Page Spec Requirements

For each page spec file, include:

* Page purpose
* User goal
* Current UX/UI problems
* Proposed layout
* Main sections
* Primary actions
* Secondary actions
* Empty state
* Loading state
* Error state
* Mobile layout
* Responsive behavior
* AI Tutor integration
* Accessibility notes
* Components needed
* Data displayed
* Design notes inspired by the reference

## Landing Page Spec

Create:



Include sections for:

* Hero
* Problem
* Solution
* AI Tutor
* Daily study roadmap
* Vocabulary learning
* Progress tracking
* Browser extension support
* Mobile/PWA support
* Call to action

The landing page should feel modern, trustworthy, global, and conversion-focused.

## Onboarding Spec

Create:



Include flow for:

* Language selection
* Current IELTS level
* Target band
* Exam date
* Study time per day
* Weak skills
* Strong skills
* Preferred tutor style
* Generate first study plan

The onboarding should feel simple and motivating, not like a long boring form.

## Dashboard Spec

Create:



The dashboard should immediately answer:

“What should I study today?”

Include:

* Friendly greeting
* Target band
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

## Today Study Plan Spec

Create:



Include:

* Today’s goal
* Estimated study time
* Task checklist
* Listening task
* Reading task
* Writing task
* Speaking task
* Vocabulary task
* Grammar task
* Review task
* Completion progress
* Start / continue action
* Mark completed
* Skip or adjust task
* AI Tutor note

## AI Study Plan Generator Spec

Create:



Include:

* Input configuration UX
* Current level
* Target band
* Exam date
* Study time
* Weak skills
* Study intensity
* Generation progress state
* Chunk generation progress UI
* Error/retry state
* Generated plan preview
* Save plan action

The UX should clearly show when AI is generating a long plan from today to exam day.

## Full Study Roadmap Spec

Create:



Include:

* Roadmap overview
* Phase sections
* Weekly sections
* Daily plan cards
* Today highlight
* Completed/skipped/partial states
* Missed day handling
* Adjust remaining plan action
* AI Tutor explanation
* Progress through plan

The roadmap should feel like a guided IELTS journey.

## AI Tutor Chat Spec

Create:



Include:

* Full AI Tutor page
* Floating AI Tutor popup behavior
* Chat messages
* Suggested prompts
* Contextual learning suggestions
* Proactive tutor messages
* Writing correction entry
* Speaking practice entry
* Vocabulary explanation entry
* Study plan support
* Progress review support

AI Tutor should feel like a real tutor, not a generic chatbot.

## Vocabulary Notebook Spec

Create:



Include:

* Word list
* Word cards
* Search/filter
* Topic grouping
* Difficulty badge
* Review status
* Word detail panel
* Pronunciation button
* Part of speech
* Word forms
* Synonyms
* Examples
* IELTS usage
* Ask AI Tutor action

Vocabulary should feel like a real learning system, not a simple list.

## Vocabulary Review Spec

Create:



Include:

* Review start screen
* Flashcard UI
* Quiz UI
* Remember/forgot actions
* Spaced repetition state
* Session progress
* Completion summary
* Words to review again
* AI Tutor recommendation

## Saved Content Spec

Create:



Include:

* Saved articles
* Saved selected text
* Saved notes
* Content detail view
* Generate exercise action
* Explain with AI action
* Save vocabulary from content
* Reading practice from saved article
* Empty state

## Practice Pages Spec

Create:



Include design for:

* Reading Practice
* Listening Practice
* Writing Practice
* Speaking Practice
* Grammar Practice
* Vocabulary Practice

Each practice page should include:

* Objective
* Estimated time
* Instructions
* Start/continue action
* AI Tutor help
* Result state
* Feedback state
* Save mistake action
* Save vocabulary action if relevant

## Mistake Review Spec

Create:



Include:

* Mistake list
* Mistake categories
* Repeated mistakes
* Skill filter
* Explanation card
* Fix recommendation
* Practice similar questions
* AI Tutor insight

## Learning Progress Spec

Create:



Include:

* IELTS band progress
* Skill breakdown
* Weekly study time
* Completed tasks
* Vocabulary retention
* Mistake trends
* Study streak
* Study plan completion
* Exam countdown
* Progress charts

Progress should be visual and easy to understand.

## AI Progress Review Spec

Create:



Include:

* Period selector
* Generate review action
* AI review summary
* Strengths
* Weaknesses
* Repeated mistakes
* Vocabulary review
* Skill-by-skill progress
* Study plan comparison
* Next recommendations
* Save report action
* Follow-up questions

## Settings Spec

Create:



Include:

* Profile settings
* Language settings
* AI Tutor settings
* AI Provider settings
* Study plan settings
* Notification settings
* Theme settings
* Data export/import
* Privacy settings
* Future sync settings

Settings should be clean and not overwhelming.

## Extension Connection Spec

Create:



Include:

* Extension introduction
* Install extension CTA
* Connection status
* Sync explanation
* How extension helps
* Save vocabulary from web
* Save articles
* Explain selected text
* Auto-highlight saved words

## Empty, Loading, and Error States

Create:



Include:

* Empty state patterns
* Loading skeleton patterns
* Error state patterns
* Retry patterns
* Offline/local-first state
* AI generation failed state
* Not enough data state
* Logged-out state

Each empty state should include:

* Friendly message
* Short explanation
* Clear action button
* Optional icon or illustration

## Responsive Mobile Design Spec

Create:



Include:

* Mobile layout principles
* Bottom navigation
* Touch targets
* Responsive cards
* Chat popup behavior
* Study plan mobile layout
* Vocabulary review mobile layout
* Practice screen mobile layout
* Progress charts mobile layout
* Settings mobile layout
* Modal/drawer behavior
* Form input behavior

The mobile experience should not feel like a squeezed desktop website.

## Accessibility Spec

Create:



Include:

* Semantic HTML guidance
* Keyboard navigation
* Focus states
* Color contrast
* Screen reader labels
* Button/input accessibility
* Mobile touch size
* Error message clarity
* Do not rely only on color

## Implementation Plan

Create:



This file should describe how to implement the redesign later.

Include:

* Recommended implementation order
* Files likely to change later
* Components likely to create later
* Theme system changes needed later
* Page-by-page implementation plan
* Testing checklist
* Risks
* Things not to change yet

Important: This file is a plan only. Do not implement the plan yet.

## Analysis Requirements

Before creating the design files, inspect:

* Project structure
* All website routes
* All website pages
* Existing styles
* Existing theme system
* Existing reusable components
* Tailwind configuration if available
* Current routing/state/storage logic
* Current AI Tutor UI
* Current study plan UI
* Current vocabulary UI
* Current progress UI
* Current settings UI

Use the current codebase to make the design realistic.

Do not invent a design that cannot fit the existing project.

## Global Product Requirement

IELTS Journey should not feel Vietnamese-only.

Default product experience should be suitable for global IELTS learners.

Vietnamese can remain as one supported language option, but the design should not assume every user is Vietnamese.

Prepare the design for localization and future multi-language support.

## Important Restrictions

Do not update source code.

Do not modify existing components.

Do not modify existing styles.

Do not modify routing.

Do not modify storage logic.

Do not modify app behavior.

Do not remove features.

Do not create fake production data.

Do not implement the redesign yet.

Only create design documentation files under:



## Final Output

After creating the design files, return a short summary with:

* Files created
* What each file contains
* Main design direction
* Main UX improvements proposed
* Recommended next step

The final result should be a complete design package for redesigning the full IELTS Journey website before implementation.


## Current Task

### Create Accessibility Specification Documentation

Create docs/design/accessibility-spec.md specifying semantic HTML guidance, keyboard navigation, focus states, color contrast, screen reader labels, button/input accessibility, mobile touch size, error message clarity, and avoiding reliance on color alone. Include best practices and examples relevant to the IELTS Journey redesign.

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

- Analyze IELTS Journey Codebase for Design Documentation (done)
- Create Redesign Overview Documentation (done)
- Create Information Architecture Documentation (done)
- Create Global Navigation Specification Documentation (done)
- Create Shared Theme Design Tokens Documentation (done)
- Create Component System Specification Documentation (done)
- Create Landing Page Specification Documentation (done)
- Create Onboarding Page Specification Documentation (done)
- Create Dashboard Page Specification Documentation (done)
- Create Today Study Plan Page Specification Documentation (done)
- Create AI Study Plan Generator Page Specification Documentation (done)
- Create Full Study Roadmap Page Specification Documentation (done)
- Create AI Tutor Chat Page Specification Documentation (done)
- Create Vocabulary Notebook Page Specification Documentation (done)
- Create Vocabulary Review Page Specification Documentation (done)
- Create Saved Content Page Specification Documentation (done)
- Create Practice Pages Specification Documentation (done)
- Create Mistake Review Page Specification Documentation (done)
- Create Learning Progress Page Specification Documentation (done)
- Create AI Progress Review Page Specification Documentation (done)
- Create Settings Page Specification Documentation (done)
- Create Extension Connection Page Specification Documentation (done)
- Create Empty, Loading, and Error States Specification Documentation (done)
- Create Responsive Mobile Design Specification Documentation (done)

## Acceptance Criteria

- File docs/design/accessibility-spec.md created
- Includes comprehensive accessibility guidelines and examples

## Validation Commands

```bash
ls docs/design/accessibility-spec.md
```

## Expected Outputs

- **Create** `docs/design/accessibility-spec.md`
  - Accessibility specification document
  - Validation: file_exists


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
