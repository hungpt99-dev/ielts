# FlowTask Context Pack

## Original User Prompt

After the IELTS Journey redesign, some UI is inconsistent, some CSS bugs remain, some pages have unreasonable layout, some features are missing or only static UI, and the overall style still does not feel modern enough.

Please audit, fix, and complete the website and extension with best practice, highest code quality, clean architecture, strong TypeScript, modern UI UX, and production ready implementation.

The goal is not to redesign randomly again. The goal is to make the current redesign modern, consistent, functional, responsive, polished, balanced, and fully usable.

Main problems to fix

1. Design between pages is inconsistent.
2. The overall UI does not feel modern enough.
3. Some pages still have CSS bugs.
4. Some pages have container width issues.
5. Today Plan page has page width and container layout issues.
6. Some pages have unreasonable UI structure.
7. Duplicate Listening Practice UI exists.
8. Remove or merge duplicate Listening Practice UI, cards, and routes.
9. Replace the separate progress review page with the main progress page.
10. Fix line break and text wrapping issues.
11. Active menu style has an ugly leading border. Remove the leading border.
12. Hamburger menu button always displays incorrectly.
13. Complete the full AI Tutor page.
14. AI chat button is ugly, transparent, hard to see, and has CSS issues.
15. Chat message container has width and container size issues.
16. Vocabulary Notebook list items are too colorful and ugly.
17. Vocabulary Notebook is missing dropdown or expand UI to show word family.
18. Mistake Review page title is missing an icon.
19. Page titles are inconsistent across pages.
20. Some features look like UI only but do not work.
21. Some features from before redesign are missing.
22. Color usage is too noisy in some pages.
23. The UI overuses colorful cards, badges, icons, or backgrounds.

Main goal

Make IELTS Journey feel like one consistent, modern, polished product.

The final result should have consistent page title with icon on every page, consistent design between all pages, consistent layout containers, consistent page width, consistent spacing, consistent cards, consistent buttons, consistent menu styles, consistent typography, consistent icons, consistent empty states, consistent loading states, consistent error states, clean and balanced color palette, working features, responsive layout, no duplicated pages, no fake buttons, no broken navigation, and no ugly leftover redesign artifacts.

Modern style requirement

The UI should feel modern, polished, clean, and premium.

Use a modern learning app style inspired by modern mobile education apps, clean SaaS dashboards, iOS inspired soft UI, AI assistant products, and personalized learning apps.

The style should feel modern, clean, soft, premium, minimal but not empty, friendly but not childish, colorful but not noisy, professional but not boring, mobile first, and easy to use every day.

Use soft rounded cards, clean neutral background, subtle shadows, strong visual hierarchy, clear section spacing, beautiful page headers, modern icons, consistent badges, smooth hover states, smooth focus states, helpful empty states, polished loading skeletons, floating AI Tutor action when appropriate, and mobile friendly navigation.

Avoid old admin dashboard look, boring gray UI, harsh borders everywhere, too many random colors, heavy gradients everywhere, childish UI, corporate UI, default browser looking buttons, inconsistent card styles, inconsistent page layouts, and fake modern UI that only changes colors without improving UX.

Important rule

Do not only make visual patches.

Before fixing, audit the project structure and understand existing routes, existing layouts, existing page wrappers, existing containers, existing theme tokens, existing navigation logic, existing page headers, existing icon system, existing color system, existing AI Tutor implementation, existing progress page and progress review page, existing practice pages, existing vocabulary components, existing extension components, and existing responsive behavior.

Then fix the root cause.

Do not create more duplicated UI.

Page title with icon requirement

Add a consistent Page Title with Icon pattern across the whole app.

Every main page should have a page title header with a meaningful icon, page title, short description if needed, optional primary action, optional secondary action, responsive layout, consistent spacing, consistent icon size, consistent icon color, and consistent alignment.

Do not let each page create its own random title style.

Create or improve a reusable component named PageHeader, PageTitle, or PageTitleWithIcon.

The component should support icon, title, description, actions, breadcrumbs if available, badge if needed, and responsive behavior.

Create or improve a shared semantic icon mapping.

Use one consistent modern icon library across the app, such as lucide react, phosphor react, or heroicons.

Recommended choice is lucide react for clean, modern, lightweight icons, or phosphor react for softer education app icons.

Do not mix many icon libraries.

Do not use emoji as main page title icons.

Create semantic icons such as DashboardIcon, TodayIcon, StudyPlanIcon, RoadmapIcon, AITutorIcon, VocabularyIcon, VocabularyReviewIcon, SavedContentIcon, ReadingIcon, ListeningIcon, WritingIcon, SpeakingIcon, GrammarIcon, MistakeReviewIcon, ProgressIcon, AIProgressReviewIcon, SettingsIcon, AIProviderIcon, LanguageIcon, ThemeIcon, and ExtensionIcon.

Mistake Review missing icon fix

Fix the Mistake Review page title because the icon is missing.

Add a proper icon beside the Mistake Review page title.

Use the same icon library used across the app.

Do not use emoji as the main icon.

Use the shared semantic icon mapping if available.

Suggested semantic icon name is MistakeReviewIcon.

The Mistake Review page header should be consistent with other page headers, including same icon size, same icon color style, same title alignment, same spacing between icon and text, same responsive behavior, and same accessibility rules.

Also check navigation and sidebar. If Mistake Review appears in the menu, make sure it also has a consistent icon there.

Do not leave missing icon placeholders.

Before finishing, audit all page titles and navigation items to ensure no other page is missing an icon.

Avoid overusing colors

The UI should not become too colorful or visually noisy.

Even though IELTS Journey should use a modern friendly style, avoid overusing colors across cards, buttons, icons, backgrounds, and badges.

The color palette must be clean, balanced, consistent, calm, professional, easy to read, suitable for daily study, not childish, and not visually overwhelming.

Use colors with purpose, not decoration only.

Colors should communicate meaning such as primary action, AI Tutor, skill category, success, warning, error, progress, and review status.

Avoid every card having a strong different background color, too many bright colors on one page, random gradients everywhere, too many colorful badges, icons using many unrelated colors, overly saturated skill cards, childish colorful UI, different color logic between pages, and rainbow dashboard feeling.

Use a clean base UI with neutral background, soft surface cards, strong readable text, subtle borders, one clear primary brand color, few controlled accent colors, skill colors used carefully, and AI Tutor color used consistently.

Most cards should use neutral or soft backgrounds.

Use accent colors only for small icons, badges, progress indicators, important highlights, skill labels, and primary actions.

Skill colors should be consistent but subtle.

Do not turn every card into a large colorful block.

Prefer small colored icon background, thin accent line, soft badge, and subtle progress color.

Avoid full card saturated backgrounds, too many competing accent colors, random bright color blocks, and every feature card looking like a different product.

Global layout and container fix

Audit all page containers and layout wrappers.

Fix issues related to page width, max width, full width, horizontal overflow, wrong container nesting, inconsistent padding, inconsistent margin, mobile width bugs, desktop content too narrow or too wide, chat message container width bug, Today Plan page width bug, and extension popup width or height overflow.

Create or standardize shared layout components if needed, such as AppShell, PageShell, PageContainer, PageHeader, PageSection, ContentGrid, DashboardGrid, and MobilePageShell.

Use these consistently across pages.

Every page should use the same layout rules instead of custom random containers.

Standardize layout width.

Main pages should use a shared PageContainer.

Dashboard style pages can use a wider layout.

Text heavy pages should have readable width.

Chat pages should have a proper split or centered layout.

Mobile pages should use full width with safe padding.

No page should create horizontal scrolling.

No content should overflow the viewport.

Fix the Today Plan page container issue specifically.

Design consistency audit

Audit all main pages and make them visually consistent.

Check Dashboard, Today Plan, Study Roadmap, AI Tutor, Vocabulary Notebook, Vocabulary Review, Saved Content, Reading Practice, Listening Practice, Writing Practice, Speaking Practice, Mistake Review, Progress, Settings, AI Provider Settings, Extension Connection, and Extension popup.

Make sure they use the same page title with icon pattern, page header style, section spacing, card radius, card padding, button style, badge style, icon style, text hierarchy, empty state style, loading state style, error state style, color usage rules, and modern visual language.

Do not let every page look like a different product.

Navigation and active menu fix

Fix the active menu design.

Current issue is active menu has a leading border that looks bad.

Remove the leading border from active menu items.

Use a cleaner modern active state such as soft background, stronger text color, icon color change, rounded pill or card background, and subtle shadow only if consistent with theme.

Active menu should look modern and clean.

Also fix wrong active route state, inconsistent navigation item spacing, inconsistent navigation icon sizes, missing navigation icons, hamburger menu always showing, and mobile or desktop menu behavior.

Hamburger menu fix

Current issue is hamburger menu button always displays.

Hamburger menu should only show on mobile or small screens.

Desktop should show normal sidebar or top navigation depending on current layout.

Mobile should show hamburger or bottom navigation depending on the design.

Do not show hamburger unnecessarily on desktop.

Make sure menu open and close state works correctly.

Make sure menu overlay or drawer does not break page scroll.

Practice page cleanup

Audit all practice pages.

Fix duplicate Listening Practice issue.

Current duplicate examples are Listening Practice with audio exercises, transcripts, and comprehension questions, and Listening Practice with transcript based exercises.

Remove or merge duplicated Listening Practice cards, pages, and routes.

Keep only one clear Listening Practice entry.

Make all practice cards consistent, including Reading Practice, Listening Practice, Writing Practice, Speaking Practice, Grammar Practice if available, and Vocabulary Practice if available.

Each practice card should have unique title, clear description, beautiful icon, skill color, working action, no duplicate content, no fake buttons, balanced color usage, and modern card style.

Progress page fix

There is a separate progress review page, but the desired structure is to use the main progress page.

Replace progress review page with the main progress page.

Merge useful AI Progress Review content into the Progress page.

Remove duplicate navigation entry if needed.

Redirect old progress review route to progress if necessary.

Make Progress page include learning progress overview, skill progress, study time, vocabulary progress, mistake trends, study plan completion, AI progress review section, period selector, generate AI review action if available, and review history if available.

Do not keep two confusing progress related pages.

AI Tutor page completion

Complete the full AI Tutor page.

Current issues are AI Tutor page feels incomplete, AI chat button is ugly, AI chat button is transparent, AI chat button is hard to see, AI chat button has CSS issues, and chat message container has width and container size issues.

Required AI Tutor page should include full page chat layout, clear page header with AI Tutor icon, AI Tutor identity, avatar or icon, chat history area, user message style, AI message style, suggested prompt chips, context cards, input composer, send button, loading state, empty state, error state, retry action, missing AI config state, chat history persistence if available, mobile friendly chat layout, and modern chat UI with good spacing and readable bubbles.

Fix chat container.

Chat messages should not overflow horizontally.

Message bubbles should have max width.

Long text should wrap correctly.

Code and text blocks should not break layout.

Chat input should stay usable on mobile.

Container should align correctly within page layout.

There should be no transparent unreadable chat button.

AI chat button fix

Make AI chat button visible, modern, and beautiful.

Use solid or semi solid theme color.

Use good contrast.

Use a beautiful icon.

Use proper hover, focus, and active states.

Use correct z index.

Use proper positioning.

Avoid overlap with other UI.

On mobile, place it where it does not block important actions.

Add accessible label.

The AI chat button should feel like a polished product feature, not a temporary debug button.

Vocabulary Notebook fix

Current issues are Vocabulary Notebook list items are too colorful and ugly, and Vocabulary Notebook is missing dropdown or expand UI to show word family.

Make vocabulary list items cleaner and less noisy.

Use color meaningfully, not randomly.

Use subtle accent colors instead of large colorful blocks.

Keep word cards readable and calm.

Show word, meaning, part of speech, review status, and actions clearly.

Add dropdown or expand section for word family.

Use modern card layout with good spacing and clear hierarchy.

Word family dropdown should show noun forms, verb forms, adjective forms, adverb forms, related forms, and example usage if available.

Example word family for analyze should include noun forms analysis and analyst, adjective form analytical, and adverb form analytically.

Dropdown behavior should be collapsed by default, expand on click, use smooth transition if already supported, have accessible button state, work on mobile, and not break list layout.

If word family data is missing, show No word family data yet, or provide Generate with AI action if AI enrichment exists.

Do not display fake word family data.

Line break and text wrapping fix

Fix all text wrapping and line break issues.

Audit page titles, page descriptions, card titles, descriptions, AI messages, vocabulary meanings, practice descriptions, buttons, badges, navigation labels, empty states, and error messages.

Fix broken line breaks, text overflowing outside cards, long words or URLs breaking layout, bad wrapping in chat messages, buttons wrapping badly, cards becoming too tall unnecessarily, and mobile text layout issues.

Use proper CSS utilities or classes for word break, overflow wrap, min width zero, max width, line clamp where appropriate, and responsive text sizes.

Do not hide important content incorrectly.

Feature functionality recovery

After redesign, some features are missing or only UI.

Audit all visible buttons, cards, links, and actions.

Fix buttons with no handler, links pointing to hash, UI cards not connected to real data, mock or demo data used in production, AI buttons not connected to AI service, forms not saving, settings not persisting, study plan actions not working, vocabulary actions not working, extension actions not working, navigation going to missing routes, and disabled states missing explanation.

Every visible feature must either work correctly, be disabled with clear explanation, or be removed if it is out of scope.

Do not leave fake UI.

Website feature checklist

Verify and fix onboarding flow, dashboard quick actions, Today Plan display, Today Plan completion actions, Study Roadmap display, Study Plan generation, AI Tutor chat, Vocabulary Notebook, Vocabulary detail, Vocabulary word family dropdown, Vocabulary Review, Saved Articles, Saved Text, Reading Practice, Listening Practice, Writing Practice, Speaking Practice, Mistake Review, Progress page, AI Progress Review inside Progress page, Settings, AI Provider Settings, and Language or Theme settings if available.

Extension feature checklist

Verify and fix extension popup opens correctly, popup layout is compact modern and polished, popup does not overflow, logged out state works, vocabulary list works, vocabulary detail works, pronunciation button works, AI Tutor shortcut works, selected text menu works, save vocabulary works, save selected text works, explain selected text works, simplify selected text works, save article works, auto highlight saved words works safely, no duplicate injected UI, no host website layout break, no CSS leakage, hamburger or menu behavior does not affect extension incorrectly, and extension colors are clean and not visually noisy.

CSS and theme rules

Do not add random one off CSS hacks.

Fix CSS using the shared theme and design token system.

Use tokens for colors, spacing, border radius, shadows, font sizes, breakpoints, z index, and skill colors.

Avoid random hex colors, random pixel values, inline styles, one off class chaos, duplicate component styles, global CSS that breaks extension or pages, and too many colorful utility classes scattered across pages.

If needed, refactor shared components instead of patching every page.

Architecture and design pattern requirements

Use clean architecture.

Separate UI components, page containers, business logic, hooks, services, repositories, local storage logic, AI provider logic, extension message logic, and validation schemas.

Use proper patterns such as repository pattern for local first data access, service layer for business logic, adapter pattern for AI providers, strategy pattern for AI provider switching, typed message pattern for extension communication, reusable layout components for page consistency, and schema validation for AI responses and forms.

Do not put complex logic directly inside UI components.

TypeScript and quality requirements

Use strong TypeScript.

Avoid any unless truly necessary.

Add or improve types for user profile, study plan, daily tasks, vocabulary item, word family, practice card, progress data, AI chat message, AI provider config, extension message, navigation item, page header item, page title icon, async state, and component variant props.

Use clear naming and small functions.

Do not create large messy components.

Responsive testing

Test at these sizes.

Mobile small.

Mobile large.

Tablet.

Laptop.

Desktop.

Extension popup size.

Check no horizontal scroll, no card overflow, no text overflow, no broken chat layout, no clipped dropdowns, no broken modal or drawer, hamburger only appears at correct breakpoint, bottom navigation works if available, desktop navigation is clean, Today Plan width is fixed, AI Tutor chat container is fixed, page titles with icons look correct on all screens, color usage remains balanced on all screen sizes, and modern style remains consistent across pages.

Accessibility requirements

Fix accessibility issues.

Buttons must have labels.

Icon only buttons need aria label.

Page title icons should be decorative or have correct accessible labels.

Dropdown must be keyboard accessible.

Chat input must be accessible.

Focus states must be visible.

Active navigation must not rely only on border or color.

Color contrast must be readable.

Text must not be too small.

Touch targets must be comfortable.

Do not rely only on color to communicate meaning.

Implementation order

1. Audit all routes, pages, page headers, navigation, layout wrappers, color usage, modern design consistency, and extension UI.
2. List all inconsistent designs, broken CSS, duplicate pages, missing icons, noisy color usage, outdated UI patterns, and UI only features.
3. Fix shared layout and container system first.
4. Create or improve shared PageTitleWithIcon or PageHeader component.
5. Create or improve shared semantic icon mapping.
6. Add icons to all main page titles, especially Mistake Review.
7. Modernize shared UI components.
8. Clean up color usage and reduce visual noise.
9. Fix navigation and remove active menu leading border.
10. Fix hamburger menu responsive behavior.
11. Fix Today Plan container width issue.
12. Merge or remove duplicate Listening Practice UI.
13. Replace progress review with the main progress page.
14. Complete full AI Tutor page.
15. Fix AI chat button visibility and styling.
16. Fix chat message container width and wrapping.
17. Simplify Vocabulary Notebook list item styling.
18. Add word family dropdown to vocabulary items.
19. Fix line break and text wrapping issues.
20. Restore missing functionality and remove fake UI.
21. Fix extension popup and selected text menu UI and functionality.
22. Audit theme tokens and remove random hard coded CSS.
23. Test desktop, mobile, and extension flows.
24. Run typecheck, lint, tests, and build.
25. Return final report.

Final report

Return a clear report with inconsistent design issues found, outdated UI issues found, modern style improvements made, missing page title icons found, page title icon system implemented, Mistake Review icon fix details, color overuse issues found, color palette cleanup details, CSS and container bugs fixed, Today Plan width fix details, duplicate Listening Practice fix details, Progress page merge or replacement details, active menu style fix, hamburger menu fix, AI Tutor page completion details, AI chat button fix details, chat container fix details, Vocabulary Notebook design changes, word family dropdown implementation, missing features restored, fake UI removed or disabled, extension fixes, files changed, components refactored or created, tests performed, and remaining known issues.

Final strict instruction

Do not mark the task complete until the whole UI feels modern, clean, and polished, every main page has a consistent page title with icon, Mistake Review page title icon is fixed, navigation icons are consistent, page designs are consistent, color usage is clean balanced and not noisy, container width bugs are fixed, Today Plan page width is correct, duplicate Listening Practice is removed or merged, progress review is replaced by progress, active menu leading border is removed, hamburger menu only appears when appropriate, full AI Tutor page is complete, AI chat button is visible and polished, chat message container layout is fixed, Vocabulary list is clean and not overly colorful, word family dropdown exists and works, line break issues are fixed, all visible features either work or are clearly disabled, website and extension remain functional, and build typecheck lint pass.


## Current Task

### Restore missing functionality and remove or disable fake UI elements

Audit all visible buttons, cards, links, and actions to identify missing or broken functionality. Fix buttons with no handlers, links pointing to hashes, UI cards not connected to real data, mock or demo data used in production, AI buttons not connected to AI service, forms not saving, settings not persisting, study plan actions not working, vocabulary actions not working, extension actions not working, navigation going to missing routes, and disabled states missing explanation. Remove any fake UI or clearly disable with explanation. Ensure every visible feature either works correctly or is disabled with clear explanation.

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

- Audit all routes, pages, page headers, navigation, layout wrappers, color usage, modern design consistency, and extension UI (done)
- Fix shared layout and container system for consistent page width and no overflow (done)
- Create or improve shared PageTitleWithIcon component and semantic icon mapping (done)
- Clean up color usage and reduce visual noise across all pages and extension UI (done)
- Fix navigation active menu style and hamburger menu responsive behavior (done)
- Merge or remove duplicate Listening Practice UI, cards, and routes (done)
- Replace progress review page with main progress page and merge AI Progress Review content (done)
- Complete full AI Tutor page with polished chat UI and functionality (done)
- Add word family dropdown to Vocabulary Notebook items and simplify list item styling (done)
- Fix line break and text wrapping issues across all UI elements (done)

## Acceptance Criteria

- All visible buttons and actions work or are disabled with explanation
- No fake UI elements remain
- Forms save and settings persist correctly
- Navigation routes are valid and working
- Extension features work correctly or are disabled with explanation

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/components/**/*.tsx`
  - Fix handlers and connect UI to real data
  - Validation: file_diff

- **Modify** `apps/web/src/pages/**/*.tsx`
  - Fix forms and settings persistence
  - Validation: file_diff

- **Modify** `apps/extension/src/components/**/*.tsx`
  - Fix extension UI and actions
  - Validation: file_diff

- **Modify** `apps/web/src/navigation/routes.ts`
  - Fix navigation routes
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
