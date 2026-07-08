# FlowTask Context Pack

## Original User Prompt

Audit, fix, and improve IELTS Journey so it can run well as a mobile app experience and be fully responsive on mobile devices.

The goal is to make IELTS Journey work smoothly on mobile browsers and be ready to run as an installable mobile web app using PWA best practices.

Important: Do not add backend just for this task. Focus on frontend code, layout, responsive design, PWA configuration, mobile compatibility, local-first storage, and production-ready UX.

Main goal

Make IELTS Journey compatible with mobile and responsive at all common mobile sizes.

The app should feel good on:

Mobile browser
Installed PWA on Android
Installed PWA on iOS Safari where supported
Tablet
Desktop
Browser extension UI if applicable

The final result should feel like a real mobile learning app, not a desktop website squeezed into a phone screen.

Main tasks

Check all code and configuration related to:

Responsive layout
Mobile navigation
PWA manifest
Viewport meta tag
Safe area handling
App icons
Theme color
Service worker if already used
Offline behavior if supported
Local storage and IndexedDB
Touch interactions
Mobile form inputs
Mobile chat UI
Mobile onboarding
Mobile dashboard
Mobile study plan
Mobile AI Tutor
Mobile vocabulary notebook
Mobile practice pages
Mobile progress page
Mobile settings page
Extension popup size if extension exists

Do not only patch one page. Audit the whole app.

Mobile app style requirement

The mobile UI should feel:

Modern
Clean
Fast
Touch friendly
Readable
Native app like
Consistent
Not cramped
Not broken
Not desktop squeezed
Comfortable for daily IELTS study

Use:

Mobile first layout
Large readable text
Good spacing
Clear buttons
Touch friendly cards
Simple navigation
Sticky bottom actions where useful
Responsive page containers
Safe area padding
Consistent mobile page headers
Smooth scrolling
Clean empty states
Clean loading states
Clean error states

Avoid:

Horizontal scroll
Tiny buttons
Tiny text
Crowded cards
Desktop sidebar forced onto mobile
Broken grids
Overflowing chat messages
Fixed width containers
Large tables that break mobile
Modals wider than viewport
Inputs hidden behind keyboard
Floating buttons blocking content
Too many columns on mobile
Hard coded desktop widths

PWA requirement

Check and fix PWA configuration.

Make sure the app has:

Valid web app manifest
Correct app name
Correct short name
Correct start_url
Correct scope
Correct display mode
Correct theme_color
Correct background_color
Correct icons
Maskable icon if possible
Apple mobile web app meta tags if applicable
Viewport meta tag
Mobile status bar color if supported

Recommended manifest values:

name: IELTS Journey
short_name: IELTS Journey
display: standalone
start_url: /
scope: /
theme_color: use app primary color
background_color: use app background color
orientation: portrait or any depending on current design

Do not use random placeholder icons.

Use proper app icons from existing assets if available.

If icons are missing, create clear TODO or generate proper icon assets only if the project already supports it.

iOS support

Check iOS Safari compatibility.

Add or verify:

apple-mobile-web-app-capable
apple-mobile-web-app-title
apple-mobile-web-app-status-bar-style
apple-touch-icon
safe area support
viewport-fit cover if needed

Handle iPhone safe areas:

Top notch
Bottom home indicator
Keyboard area
Sticky bottom navigation
Floating AI Tutor button

Use CSS safe area variables where needed:

env safe area inset top
env safe area inset bottom
env safe area inset left
env safe area inset right

Do not let bottom buttons or navigation overlap the iPhone home indicator.

Viewport and layout rules

Check the root HTML and app shell.

Make sure:

Viewport meta is correct
App root uses full width
No fixed desktop width on body
No unwanted horizontal overflow
Main layout uses responsive containers
Page content uses mobile safe padding
Images and media are responsive
Cards and grids collapse correctly
Text wraps correctly
Long words and URLs do not break layout

Fix CSS issues related to:

width 100vw causing horizontal scroll
fixed pixel widths
min-width too large
grid columns not responsive
flex children not shrinking
missing min-width zero
overflow hidden used incorrectly
position fixed elements blocking mobile content

Global responsive design

Audit all major pages and components.

Pages to check:

Onboarding
Dashboard
Today Plan
Study Roadmap
Study Plan
AI Tutor
Vocabulary Notebook
Vocabulary Review
Saved Content
Reading Practice
Listening Practice
Writing Practice
Speaking Practice
Mistake Review
Progress
Settings
AI Provider Settings
Extension Connection
Landing page if available
Auth or profile pages if available

For every page, check:

Mobile layout
Tablet layout
Desktop layout
Page width
Card width
Text wrapping
Button placement
Navigation behavior
Loading state
Empty state
Error state
Modal behavior
Dropdown behavior
Form behavior

Mobile navigation

Implement or fix mobile navigation.

On desktop:

Use normal sidebar or top navigation depending on existing design.

On mobile:

Use hamburger drawer, bottom navigation, or compact mobile navigation.
Do not show desktop sidebar as a squeezed column.
Do not show hamburger button on desktop if not needed.
Do not show hamburger button all the time if it is wrong.
Make active navigation clear without ugly leading border.
Ensure menu open and close works.
Ensure drawer overlay does not break scrolling.
Ensure navigation does not cover content.
Ensure current route is highlighted correctly.

Preferred mobile navigation options:

Bottom navigation for main pages
Hamburger drawer for full menu
Floating AI Tutor button only if it does not block content

Touch target requirement

All interactive elements must be touch friendly.

Minimum recommended touch target:

44px height and width

Check:

Buttons
Icon buttons
Menu items
Tabs
Dropdown triggers
Card actions
Vocabulary actions
Chat send button
Onboarding choices
Settings toggles
Practice controls

Do not make users tap tiny icons.

Mobile AI Tutor requirement

AI Tutor must work well on mobile.

Fix:

Chat message container width
Message bubble max width
Long text wrapping
Long URL wrapping
Composer width
Keyboard behavior
Send button visibility
Floating AI button position
Suggested prompt chips wrapping or horizontal scroll
Chat page height
Input not hidden behind mobile keyboard
No horizontal scroll

AI Tutor mobile page should have:

Clean page header
Scrollable chat history
Sticky or accessible composer
Readable message bubbles
Good spacing
Accessible send button
Loading state
Error state
Missing AI config state

If floating AI chat button exists:

Make it visible.
Make it high contrast.
Do not make it transparent and hard to see.
Place it above bottom navigation or safe area.
Do not cover primary actions.
Add accessible label.
Use correct z-index.

Mobile onboarding requirement

Onboarding must work like a mobile app setup flow.

Check:

Step layout
Progress indicator
Option cards
Date input
Band score controls
Weak skill selection
AI Tutor setup toggle
Proactive Tutor toggle
Review step
Finish button

On mobile:

Use single column.
Use large touch targets.
Use sticky bottom navigation if useful.
Avoid too many fields at once.
No horizontal scroll.
Progress indicator should fit.

Mobile dashboard requirement

Dashboard must be mobile friendly.

Check:

Today mission card
Progress cards
Quick actions
AI Tutor card
Study plan summary
Vocabulary review card
Practice shortcuts

On mobile:

Use one column.
Cards should be readable.
Important action should appear near top.
No cramped grid.
No rainbow color overload.
No overflowing cards.

Mobile Today Plan requirement

Fix Today Plan page width and mobile layout.

Check:

Task cards
Completion buttons
Skip buttons
Progress indicators
Daily summary
AI suggestions

On mobile:

Task cards should be full width.
Actions should wrap cleanly.
Progress should be readable.
No fixed desktop container.
No horizontal overflow.

Mobile Vocabulary Notebook requirement

Vocabulary Notebook must be clean on mobile.

Check:

Vocabulary list item layout
Meaning text wrapping
Part of speech badges
Review status
Action buttons
Word family dropdown
Search and filters

On mobile:

Cards should not be too colorful.
Actions should not overflow.
Dropdown should expand inside card.
Long meanings should wrap.
Filter controls should stack or scroll cleanly.
No fake data.

Mobile practice pages requirement

Reading, Listening, Writing, Speaking, Grammar, and Vocabulary practice pages must be responsive.

Check:

Practice cards
Exercise content
Question lists
Audio controls
Transcript area
Writing input
Speaking controls
Result feedback
AI feedback

On mobile:

Use readable content width.
Avoid two-column layouts.
Audio controls must fit.
Textarea must be usable.
Feedback cards must wrap.
Buttons should be easy to tap.

Mobile settings requirement

Settings pages must work on mobile.

Check:

AI Provider Settings
Theme settings
Language settings
Proactive AI Tutor settings
Profile settings
Extension settings

On mobile:

Forms should be single column.
Inputs full width.
Selects full width.
Toggles easy to tap.
API key field should not overflow.
Advanced settings can collapse.

Responsive component system

Create or improve reusable responsive components.

Possible components:

AppShell
MobileAppShell
PageContainer
MobilePageContainer
ResponsiveGrid
ResponsiveCard
MobileNav
BottomNav
AppDrawer
StickyMobileActions
SafeAreaContainer
PageHeader
SectionHeader

Use these consistently.

Do not write random mobile fixes in every page.

CSS and design token rules

Use existing theme tokens.

Avoid:

Random hex colors
Random hard coded pixel values
Inline styles
One-off responsive hacks
Duplicated mobile CSS
Global overflow hacks that hide real bugs

Use:

Responsive Tailwind utilities
CSS variables if already used
Design tokens
Consistent spacing scale
Consistent breakpoints
Consistent radius
Consistent shadows
Safe area utilities
Reusable components

Storage and offline requirement

Check local-first behavior on mobile.

Verify:

IndexedDB works on mobile browsers.
LocalStorage usage is safe and minimal.
User profile persists.
Onboarding data persists.
Study plan persists.
Vocabulary persists.
AI Tutor chat history persists if implemented.
Proactive AI Tutor settings persist.
No data is lost after refresh.
No code assumes desktop-only browser APIs.

If PWA offline support exists:

Make sure service worker does not break updates.
Make sure app shell can load offline if intended.
Make sure offline state is handled clearly.
Do not cache API secrets.
Do not create broken stale cache behavior.

If offline support does not exist:

Do not fake it.
Add clear structure for future offline support only if safe.

Browser compatibility

Check compatibility with:

Chrome mobile
Safari iOS
Android WebView if applicable
Desktop Chrome
Desktop Safari
Desktop Edge

Avoid unsupported APIs without fallback.

Check:

Clipboard API fallback
Speech recognition availability
Text to speech availability
IndexedDB availability
Notification permission
Service worker support
PWA install support

If a feature is unsupported, show clear fallback state.

Extension compatibility

If IELTS Journey has a browser extension, check mobile related impact but do not force extension to work on mobile browsers unless supported.

Extension popup should still be responsive at its own popup size.

Check:

Popup width
Popup height
No overflow
Vocabulary list
AI Tutor shortcut
Settings
Selected text menu
Auto highlight UI
No CSS leakage
No duplicate injected UI

Do not break extension behavior while improving mobile website.

Accessibility requirement

Make mobile UI accessible.

Check:

Readable font sizes
Good color contrast
Visible focus states
Keyboard navigation
Screen reader labels
Icon only button aria labels
Form labels
Error messages linked to fields
Touch targets large enough
Do not rely only on color
Reduced motion preference if animations exist

Performance requirement

Mobile performance should be good.

Check:

Large components
Unnecessary re-renders
Heavy animations
Large images
Blocking scripts
Unoptimized icons
Too many effects on mobile
Chat rendering performance
Vocabulary list performance

Improve:

Code splitting if already supported
Lazy loading heavy pages if useful
Image optimization
Virtualization for long lists if needed
Memoization where appropriate
Avoid unnecessary local storage reads on every render

Do not over-engineer.

Mobile testing checklist

Test these viewport sizes:

320px width
360px width
375px width
390px width
414px width
430px width
768px tablet
1024px tablet or laptop
Desktop width

Test these flows:

Open app on mobile
Install PWA if supported
Open installed PWA
Complete onboarding
Open dashboard
Open Today Plan
Complete a study task
Open AI Tutor
Send AI Tutor message
Open Vocabulary Notebook
Expand word family dropdown
Open practice pages
Open Progress page
Open Settings
Toggle Proactive AI Tutor
Configure AI provider if available
Use mobile navigation
Open and close drawer
Use bottom navigation if implemented
Rotate screen if supported
Refresh page and confirm data persists

Check:

No horizontal scroll
No clipped content
No broken cards
No tiny buttons
No unreadable text
No input hidden behind keyboard
No broken modal
No broken dropdown
No floating button blocking content
No desktop layout on mobile
No broken PWA manifest
No console errors
No TypeScript errors
No build errors

Implementation order

1. Audit current responsive design, app shell, routes, pages, components, CSS, Tailwind config, PWA config, and storage usage.
2. List all mobile and PWA issues found.
3. Fix root HTML viewport and app shell layout.
4. Fix PWA manifest and mobile meta tags.
5. Fix global page container and safe area handling.
6. Fix mobile navigation behavior.
7. Fix shared responsive components.
8. Fix onboarding mobile layout.
9. Fix dashboard mobile layout.
10. Fix Today Plan mobile width and layout.
11. Fix AI Tutor mobile chat layout and floating button.
12. Fix Vocabulary Notebook mobile layout and word family dropdown.
13. Fix practice pages mobile layout.
14. Fix Progress and Settings mobile layout.
15. Fix extension popup responsiveness if extension exists.
16. Fix storage persistence issues on mobile.
17. Fix accessibility issues.
18. Fix mobile performance issues.
19. Test all mobile sizes and flows.
20. Run typecheck, lint, tests, and build.
21. Return final report.

Important rules

Do not add backend.
Do not fake PWA support.
Do not fake offline support.
Do not hide overflow globally just to hide layout bugs.
Do not use desktop fixed widths on mobile.
Do not break desktop layout.
Do not break extension.
Do not break local user data.
Do not create buttons that do nothing.
Do not leave mobile navigation broken.
Do not leave horizontal scroll.
Do not hard code random colors or sizes.
Do not mark complete until real mobile testing is done.

Final result

IELTS Journey should work like a polished mobile learning app.

The user should be able to open it on a phone, use onboarding, dashboard, today plan, AI Tutor, vocabulary, practice pages, progress, and settings without layout bugs.

The app should also be ready to install as a mobile PWA where supported.

Final report

Return a clear final report with:

Mobile issues found
PWA config issues found
Responsive layout fixes
App shell fixes
Viewport and safe area fixes
Mobile navigation fixes
Page by page mobile fixes
AI Tutor mobile fixes
Today Plan mobile fixes
Vocabulary mobile fixes
Onboarding mobile fixes
Settings mobile fixes
Extension popup fixes if applicable
Storage and offline notes
Accessibility fixes
Performance fixes
Files changed
Tests performed
Remaining known issues
PWA install readiness status

## Current Task

### Fix accessibility issues on mobile including font sizes, color contrast, focus states, and aria labels

Audit and fix accessibility issues on mobile UI. Ensure font sizes are readable and meet minimum size guidelines. Verify good color contrast for text and interactive elements. Add visible focus states for keyboard navigation. Add screen reader labels and aria attributes for icon-only buttons and form controls. Link error messages to form fields. Ensure touch targets meet minimum 44px size. Avoid relying only on color to convey information. Respect reduced motion preference for animations.

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

- Audit current responsive design, app shell, routes, pages, components, CSS, Tailwind config, PWA config, and storage usage (done)
- Fix root HTML viewport meta tag and app shell layout for mobile responsiveness (done)
- Fix and enhance PWA manifest and mobile meta tags for full mobile and iOS support (done)
- Fix global page container and safe area handling with reusable responsive components (done)
- Fix mobile navigation behavior with bottom navigation, hamburger drawer, and floating AI Tutor button (done)
- Fix onboarding page mobile layout with single column, large touch targets, and sticky bottom navigation (done)
- Fix dashboard mobile layout with single column cards and readable spacing (done)
- Fix Today Plan page mobile width and layout with full width task cards and readable progress (done)
- Fix AI Tutor mobile chat layout and floating button with accessible message bubbles and input (done)
- Fix Vocabulary Notebook mobile layout and word family dropdown with clean wrapping and stacking (done)
- Fix practice pages mobile layout for reading, listening, writing, speaking, grammar, and vocabulary (done)
- Fix Progress and Settings pages mobile layout with single column forms and touch friendly controls (done)
- Fix extension popup responsiveness if browser extension exists (done)
- Fix storage persistence and offline behavior on mobile browsers (done)

## Acceptance Criteria

- Font sizes meet accessibility guidelines
- Color contrast meets WCAG standards
- Focus states visible and keyboard navigation works
- Aria labels present for icon buttons and forms
- Error messages linked to fields
- Touch targets meet minimum size
- Animations respect reduced motion preference

## Validation Commands

```bash
pnpm test
```

## Expected Outputs

- **Modify** `apps/web/src/components/*`
  - Fix accessibility issues in UI components
  - Validation: file_diff

- **Modify** `apps/web/src/pages/*`
  - Fix accessibility issues in pages
  - Validation: file_diff


## Instructions

- Work only on this task.
- Do not rewrite unrelated files.
- Do not mark the task complete unless acceptance criteria are satisfied.
- Return a short completion summary.
