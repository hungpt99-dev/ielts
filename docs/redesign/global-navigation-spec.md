# IELTS Journey — Global Navigation Specification

## Overview

This document specifies the global navigation system for the redesigned IELTS Journey website. The navigation is designed around the principle of **progressive disclosure**: the user's most frequent daily actions are one tap away, while secondary pages are logically grouped behind hub pages. The goal is to eliminate the current overloaded sidebar (17 items at the same level) and replace it with a clear, prioritized navigation that guides users toward their next learning action.

---

## Design Principles

1. **Dashboard-first**: The Dashboard is the default landing and primary home. Every navigation path starts or returns here.
2. **8 primary destinations only**: The main navigation contains exactly 8 items — any more creates cognitive overload. Secondary pages are nested under their parent hub.
3. **AI Tutor is a first-class citizen**: AI Tutor has its own navigation slot in both desktop sidebar and mobile bottom nav, plus a persistent floating quick-access button.
4. **Practice is a hub, not a list**: Individual skills (reading, listening, writing, speaking, grammar) are nested under the Practice hub, not exposed as top-level items.
5. **Progress is a hub, not a page**: Progress analytics, AI review, mock tests, and topics are nested under the Progress hub.
6. **Mobile parity**: Mobile navigation is not a compressed version of desktop — it prioritizes the 5 most frequent actions with overflow accessible via a secondary menu.
7. **Contextual presence**: The header adapts to show page-specific actions, breadcrumbs, and the always-available AI Tutor shortcut.

---

## Navigation Architecture

### Three Navigation Layers

| Layer | Surface | Purpose |
|-------|---------|---------|
| **Primary Navigation** | Desktop sidebar / Mobile bottom nav | Main destinations — visible at all times |
| **Secondary Navigation** | Header bar | Page context, actions, search, AI shortcut, theme toggle, user menu |
| **Tertiary Navigation** | In-page tabs / sub-nav | Sub-pages within a hub (Practice, Progress, Settings) |

All three layers work together: primary gets the user to the right section, secondary provides tools and context, tertiary allows navigation within a section.

---

## Primary Navigation — Desktop Sidebar

### Layout

```
┌──────────────────────────────┐
│  ┌───┐                      │
│  │Logo│ IELTS Journey        │
│  └───┘                      │
│                              │
│  ◆ Dashboard                  │  ← active page
│  ☐ Today's Plan              │
│  ☐ Study Roadmap             │
│                              │
│  ── AI Tutor ──               │  ← visually distinct section
│  ◆ AI Tutor                  │  ← highlighted accent
│                              │
│  ── Learning ──               │
│  ☐ Vocabulary                │
│  ☐ Practice  ▾               │  ← expandable sub-items
│    ☐ Reading                 │
│    ☐ Listening               │
│    ☐ Writing                 │
│    ☐ Speaking                │
│    ☐ Grammar                 │
│    ☐ Mistakes                │
│  ☐ Progress  ▾               │  ← expandable sub-items
│    ☐ AI Review               │
│    ☐ Mock Tests              │
│    ☐ Topics                  │
│                              │
│  ── Account ──                │
│  ⚙ Settings                  │
│                              │
│  ┌──────────────────────┐    │
│  │ [Avatar]  Name        │    │
│  │          email@...    │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Width | 280px (collapsed: 64px icon-only mode optional) |
| Background | `--color-surface` |
| Border | `1px solid var(--color-border)` on right edge |
| Logo area height | 64px (matches header height) |
| Scroll | Internal scroll if content overflows viewport |
| Z-index | `--z-sidebar` (below header on desktop, above overlay on mobile) |
| Transition | `width 200ms ease`, `transform 200ms ease` |

### Section Grouping

The sidebar is divided into 4 visual sections with small section labels or subtle dividers:

| Section | Items | Behavior |
|---------|-------|----------|
| **Main** | Dashboard, Today's Plan, Study Roadmap | Always visible, no expansion |
| **AI Tutor** | AI Tutor | Visually distinct with tutor accent color (e.g. purple/teal) and subtle background tint |
| **Learning** | Vocabulary, Practice (expandable), Progress (expandable) | Expandable groups with chevron indicator |
| **Account** | Settings | Bottom section, separated by divider |

### Expandable Groups (Practice & Progress)

**Practice group** — Click toggles expansion showing:
- Reading, Listening, Writing, Speaking, Grammar, Mistakes

**Progress group** — Click toggles expansion showing:
- AI Review, Mock Tests, Topics

**Behavior:**
- Click the parent label to toggle expansion
- Clicking a sub-item navigates directly and keeps the group expanded
- Only one group can be expanded at a time (accordion behavior)
- Active sub-item is highlighted
- Badge counts (e.g., mistakes count) shown on parent and sub-items

### Active State

| Element | Style |
|---------|-------|
| Active nav item | `--color-primary` text, `--color-primary-light` background, `3px` left border accent |
| Active parent (when sub active) | `--color-primary` text, chevron points down |
| Active sub-item | Same as active nav item |
| Hover | `--color-surface-alt` background, slight scale |

### Icons

Each nav item uses a 20x20 outline SVG icon (Heroicons style), with 1.5px stroke width. Active icons use filled variant.

| Item | Icon Suggestion |
|------|----------------|
| Dashboard | Home / grid |
| Today's Plan | Calendar check |
| Study Roadmap | Map / route |
| AI Tutor | Sparkles / chat |
| Vocabulary | Book open |
| Practice | Play / lightbulb |
| Progress | Chart bar |
| Settings | Cog |

---

## Primary Navigation — Mobile Bottom Navigation

### Layout

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│          │          │          │          │          │
│   Home   │  Plan    │  AI      │  Vocab   │ Progress │
│    ◇     │   ☐     │  ◆       │   ☐      │   ☐      │
│          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
   /dashboard  /plan    /tutor   /vocab    /progress
```

### Specifications

| Property | Value |
|----------|-------|
| Height | `72px` + `env(safe-area-inset-bottom)` |
| Background | `--color-surface` with `backdrop-filter: blur(12px)` |
| Border-top | `1px solid var(--color-border-light)` |
| Z-index | `--z-fixed` |
| Shadow | `0 -2px 16px rgba(0,0,0,0.06)` |
| Item min-width | `56px` (meets accessibility touch target) |
| Item min-height | `48px` (meets accessibility touch target) |

### Items (5 maximum)

| # | Item | Route | Badge |
|---|------|-------|-------|
| 1 | **Home** | `/dashboard` | — |
| 2 | **Plan** | `/plan` | Today's task count |
| 3 | **AI Tutor** | `/tutor` | Unread messages |
| 4 | **Vocab** | `/vocabulary` | Words due for review |
| 5 | **Progress** | `/progress` | — |

### Behavior

| Interaction | Action |
|-------------|--------|
| Tap active item | No-op (already on page) |
| Tap inactive item | Navigate with no animation |
| Long-press (future) | Show sub-menu for hub items (e.g., Progress → AI Review, Mock Tests) |
| Badge update | Real-time count from reactive store |
| Press feedback | `scale(0.92)` transform on mousedown/touchstart |
| Active indicator | Filled icon + `--color-primary` text, subtle top border accent |

### Overflow Menu

Items 6–8 (Study Roadmap, Practice, Settings) are accessible via:

1. **Practice hub**: Accessible from Today's Plan task cards and Dashboard quick actions
2. **Study Roadmap**: Accessible from Today's Plan page header
3. **Settings**: Accessible from header user avatar/menu icon on mobile

A "+" overflow button may be added to the bottom nav if analytics show frequent use of these pages from mobile.

---

## Header Bar Specification

### Desktop Header

```
┌────────────────────────────────────────────────────────┐
│ ← (mobile hamburger)                                   │
│                        [Page Title]       🔍  ◆  🌙  👤│
│                                            AI  Dark   │
│                                            Toggle User │
│                                        Tutor          │
└────────────────────────────────────────────────────────┘
```

### Mobile Header

```
┌────────────────────────────────────────────┐
│ ← Back (or hamburger if nav open)          │
│                              🔍  ◆  🌙     │
│         [Page Title]         AI            │
│                              Tutor         │
└────────────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Height | `64px` (desktop), `56px` (mobile) |
| Background | `--color-surface` with `backdrop-filter: blur(12px)` |
| Border-bottom | `1px solid var(--color-border)` |
| Z-index | `--z-header` (above sidebar on mobile) |
| Padding | `0 16px` (mobile), `0 24px` (desktop) |

### Header Elements

| Element | Position | Behavior |
|---------|----------|----------|
| Hamburger menu | Left (mobile only) | Toggles sidebar overlay. Hidden on desktop where sidebar is always visible. |
| Back button | Left (mobile sub-pages) | Shown when navigating to a sub-page (e.g., `/practice/reading` from `/practice`). Returns to parent hub. |
| Page title | Center | Dynamic title matching current route. Hidden on mobile when space is tight (breadcrumb shown instead). |
| Search icon | Right group | Opens `/search` overlay or search modal. `aria-label="Search"` |
| AI Tutor button | Right group | Toggles floating chat popup. Shows unread badge. `aria-label="AI Tutor assistant (N unread)"` |
| Dark mode toggle | Right group | Instant theme switch between light/dark. `aria-label="Toggle dark mode"` |
| User avatar | Right group | Dropdown menu (see User Profile Menu section). Hidden on mobile (accessible from bottom nav overflow). |

### Page Title Behavior

The page title updates dynamically based on the active route:

| Route | Title |
|-------|-------|
| `/dashboard` | "Dashboard" |
| `/plan` | "Today's Plan" |
| `/roadmap` | "Study Roadmap" |
| `/tutor` | "AI Tutor" |
| `/vocabulary` | "Vocabulary" |
| `/vocabulary/review` | "Review" |
| `/practice` | "Practice" |
| `/practice/reading` | "Reading Practice" |
| `/practice/listening` | "Listening Practice" |
| `/practice/writing` | "Writing Practice" |
| `/practice/speaking` | "Speaking Practice" |
| `/practice/grammar` | "Grammar Practice" |
| `/practice/mistakes` | "Mistake Review" |
| `/progress` | "Progress" |
| `/progress/review` | "AI Progress Review" |
| `/progress/tests` | "Mock Tests" |
| `/progress/topics` | "Topics" |
| `/settings` | "Settings" |
| `/settings/*` | "Settings — [sub-page name]" |
| `/saved` | "Saved Content" |
| `/search` | "Search" |

---

## AI Tutor — Entry Points & Behavior

### Multiple Entry Points (Single Destination)

| Entry Point | Location | Surface | Opens |
|-------------|----------|---------|-------|
| Navigation link | Desktop sidebar, item #4 | Primary nav | Full `/tutor` page |
| Navigation link | Mobile bottom nav, item #3 | Primary nav | Full `/tutor` page |
| Floating button | Bottom-right, all pages | Overlay | Chat popup (resizable, draggable) |
| Header button | Header bar, right group | Secondary | Chat popup |
| Contextual CTA | Dashboard AI recommendation card | In-page | Chat popup with context |
| Contextual CTA | Vocabulary word detail panel | In-page | Chat popup with word context |
| Contextual CTA | Writing/Speaking practice result | In-page | Chat popup with submission context |
| Contextual CTA | Mistake explanation card | In-page | Chat popup with mistake context |

### Floating AI Tutor Button

```
    ┌─────┐
    │  ◆  │  42px diameter, circular
    │ AI  │  --color-tutor-accent background
    └─────┘  White icon, subtle shadow
             Position: fixed, bottom-right
             Offset: 24px from edges (96px on mobile to clear bottom nav)
```

**Behavior:**
- Always visible on all authenticated pages
- Pulsing animation when proactive message is available
- Badge count for unread messages
- Click toggles chat popup (not full page)
- Chat popup is dismissable (× button) and returns to button
- Popup remembers position (drag handle) and size within session

### Full AI Tutor Page (`/tutor`)

Opens when user clicks AI Tutor in sidebar or bottom nav. Provides the full chat experience with larger viewport, history, and all features. The floating button is hidden when on `/tutor` to avoid duplication.

---

## User Profile Menu

### Trigger
User avatar button in the header (desktop) or header menu (mobile).

### Menu Items

```
┌──────────────────────┐
│ [Avatar]              │
│ Name                  │
│ email@example.com     │
│──────────────────────│
│ 👤  Profile           │ → /settings/profile
│ ⚙  Settings           │ → /settings
│ 📊  My Progress        │ → /progress
│ 📖  Vocabulary Stats   │ → /vocabulary (stats section)
│──────────────────────│
│ 🌐  Language: English  │ → quick toggle or /settings/language
│──────────────────────│
│ 🚪  Sign Out           │ → confirm dialog → landing page
└──────────────────────┘
```

### Behavior

| Interaction | Action |
|-------------|--------|
| Click avatar | Toggle dropdown |
| Click outside | Close dropdown |
| Escape key | Close dropdown |
| Active item | Navigation to target page |
| Sign Out | Show confirmation modal before logging out |

### Mobile

On mobile, the avatar may be hidden in the header when space is tight. A "more" icon (⋮) or the user's initial avatar appears in the header or is accessible from the bottom nav overflow.

---

## Settings Access

Settings is accessible through multiple paths:

| Path | Surface | Notes |
|------|---------|-------|
| Desktop sidebar | Primary nav — Account section | Last item before user profile |
| User menu | Header avatar dropdown | "Settings" link |
| Mobile overflow | Bottom nav → overflow menu → Settings | — |
| Direct link | Footer links (all pages) | "Settings" text link |

Settings is intentionally placed as the last primary nav item. It is not a daily destination but must be findable.

---

## Tertiary In-Page Navigation

### Practice Hub Sub-Navigation

```
┌─────────────────────────────────────────────────┐
│  Practice                                        │
│                                                  │
│  [Reading] [Listening] [Writing] [Speaking] [Grammar] [Mistakes]
│   ◉ active    ○         ○         ○          ○        ○
│                                                  │
│  ── Content for selected skill ──                │
└─────────────────────────────────────────────────┘
```

Horizontal tab-style navigation inside the Practice hub page. Tabs scroll horizontally on mobile. Active tab underlined with skill accent color.

### Progress Hub Sub-Navigation

```
┌─────────────────────────────────────────────────┐
│  Progress                                        │
│                                                  │
│  [Overview] [AI Review] [Mock Tests] [Topics]    │
│   ◉ active    ○            ○            ○        │
│                                                  │
│  ── Content for selected tab ──                  │
└─────────────────────────────────────────────────┘
```

Horizontal tab-style navigation inside the Progress hub page.

### Settings Sub-Navigation

Settings uses a vertical sub-navigation (left sidebar on desktop, top tabs on mobile):

| Desktop | Mobile |
|---------|--------|
| Left sidebar with setting categories | Horizontal scrollable tabs or accordion |
| Profile | Profile |
| AI Provider | AI Provider |
| Language | Language |
| Theme | Theme |
| Data Management | Data Management |
| Extension Connection | Extension Connection |
| About | About |

---

## Navigation Priority & Hierarchy

### Global Priority Matrix

| Priority | Item | Why |
|----------|------|-----|
| 1 | Dashboard | Daily entry point, mission, overview |
| 2 | Today's Plan | Primary action: "what to study today" |
| 3 | Study Roadmap | Journey visualization, motivation |
| 4 | AI Tutor | Personalized guidance, fastest-growing feature |
| 5 | Vocabulary | Daily review habit, spaced repetition |
| 6 | Practice Hub | Skill development, exam preparation |
| 7 | Progress Hub | Tracking, motivation through visible growth |
| 8 | Settings | Configuration, accessed infrequently |

### Frequency-Based Ranking (expected)

| Item | Daily | Weekly | Monthly |
|------|-------|--------|---------|
| Dashboard | ✅ | — | — |
| Today's Plan | ✅ | — | — |
| Study Roadmap | — | ✅ | — |
| AI Tutor | ✅ | — | — |
| Vocabulary | ✅ | — | — |
| Practice | — | ✅ | — |
| Progress | — | ✅ | — |
| Settings | — | — | ✅ |

---

## Responsive Behavior

### Breakpoint Behavior

| Breakpoint | Sidebar | Bottom Nav | Header |
|------------|---------|------------|--------|
| ≥ 1024px (desktop) | Visible, static | Hidden | Full header |
| 768–1023px (tablet) | Collapsible, overlay | Optional (hidden if sidebar pinned) | Condensed |
| < 768px (mobile) | Hidden, overlay on hamburger | Visible, fixed | Compact |

### Desktop (≥ 1024px)

- Sidebar is always visible on the left
- Bottom navigation is hidden
- Header shows page title + right group (search, AI, dark mode, avatar)
- Main content area fills remaining width
- Sidebar width: 280px

### Tablet (768–1023px)

- Sidebar is collapsed by default, opens as overlay on hamburger click
- Backdrop overlay when sidebar is open
- Bottom navigation may be visible (user preference or auto-detect)
- Header is similar to desktop but may stack breadcrumb below title

### Mobile (< 768px)

- Sidebar hidden, opens as full-width overlay from left
- Backdrop overlay with `z-index: 30`
- Bottom navigation fixed at bottom with 5 items
- Header shows back/hamburger on left, page title, and right group (minimal: search + AI Tutor only)
- Dark mode toggle moved to user menu
- User avatar hidden from header (accessible from bottom nav overflow)

### Safe Areas

- Bottom navigation respects `env(safe-area-inset-bottom)` for notched devices
- Top header respects `env(safe-area-inset-top)` for dynamic island / notch

---

## Navigation Labels

### Desktop Sidebar Labels

| Route | Label | Notes |
|-------|-------|-------|
| `/dashboard` | **Dashboard** | Full word |
| `/plan` | **Today's Plan** | Full phrase |
| `/roadmap` | **Study Roadmap** | Full phrase |
| `/tutor` | **AI Tutor** | With sparkle icon |
| `/vocabulary` | **Vocabulary** | Full word |
| `/practice` | **Practice** | Hub label |
| `/practice/reading` | Reading | Short, under Practice |
| `/practice/listening` | Listening | Short, under Practice |
| `/practice/writing` | Writing | Short, under Practice |
| `/practice/speaking` | Speaking | Short, under Practice |
| `/practice/grammar` | Grammar | Short, under Practice |
| `/practice/mistakes` | Mistakes | Short, under Practice |
| `/progress` | **Progress** | Hub label |
| `/progress/review` | AI Review | Short, under Progress |
| `/progress/tests` | Mock Tests | Short, under Progress |
| `/progress/topics` | Topics | Short, under Progress |
| `/settings` | **Settings** | Full word |
| `/settings/*` | Settings → * | Breadcrumb pattern |

### Mobile Bottom Nav Labels

Items are shortened to fit limited space:

| Route | Label | Max chars |
|-------|-------|-----------|
| `/dashboard` | Home | 4 |
| `/plan` | Plan | 4 |
| `/tutor` | AI | 2 |
| `/vocabulary` | Vocab | 5 |
| `/progress` | Progress | 8 |

### Truncation

When the user's language is set to a verbose locale, labels auto-truncate:
- Desktop sidebar: no truncation (enough width)
- Mobile bottom nav: labels truncate with ellipsis at 8 characters

---

## Active Page States

### Active Indicator

| State | Desktop Sidebar | Mobile Bottom Nav | Header Title |
|-------|----------------|-------------------|--------------|
| **Active (current page)** | `--color-primary` text, `--color-primary-light` bg, 3px left border accent | `--color-primary` text, filled icon, subtle top border | Bold weight |
| **Parent active (sub-page active)** | `--color-primary` text, chevron down | N/A | N/A |
| **Inactive** | `--color-text-secondary` text, transparent bg | `--color-text-secondary` text, outline icon | Normal weight |
| **Hover** | `--color-surface-alt` bg | `scale(1.05)` | N/A |
| **Pressed** | `scale(0.98)` | `scale(0.92)` | N/A |
| **Focus-visible** | 2px `--color-primary` ring | 2px `--color-primary` ring | N/A |

### Breadcrumb Support

For sub-pages, a breadcrumb trail appears below the page title in the header:

```
Settings  >  AI Provider
Vocabulary  >  Review
Practice  >  Reading
```

On mobile, breadcrumbs replace the page title to save space.

---

## Scroll Behavior

| Surface | Behavior |
|---------|----------|
| Sidebar | Inner scroll. Logo and user profile stay fixed at top/bottom. Nav items scroll independently. |
| Header | Fixed at top, does not scroll with content. On very long pages, auto-hides while scrolling down, reappears on scroll up (mobile only). |
| Bottom nav | Fixed at bottom, always visible on mobile. |
| Main content | Scrolls naturally. No custom scroll containers unless required (e.g., long tables). |

---

## Accessibility

| Concern | Implementation |
|---------|----------------|
| Semantic HTML | `<nav>` with `aria-label` for each navigation region (primary, mobile, header) |
| Landmarks | `role="navigation"` on sidebar, bottom nav, header nav |
| Current page | `aria-current="page"` on active nav items |
| Keyboard navigation | Tab order: header → sidebar → main content → bottom nav (mobile) |
| Skip link | "Skip to main content" link as first focusable element |
| Focus ring | 2px `--color-primary` outline on `:focus-visible` for all nav items and buttons |
| Screen reader labels | `aria-label` on icon-only buttons (hamburger, search, AI Tutor, dark mode) |
| Touch targets | Minimum 48x48px touch area on all mobile nav items |
| Reduced motion | Respect `prefers-reduced-motion`: disable sidebar slide animation, bottom nav press transform |
| Color-only indicators | Active state uses text color + background color + left border — not color alone |

---

## Animation & Transition

| Element | Transition | Duration | Easing |
|---------|-----------|----------|--------|
| Sidebar open/close | `transform translateX` | 200ms | `ease-in-out` |
| Sidebar items hover | `background-color` | 150ms | `ease` |
| Bottom nav press | `transform scale` | 100ms | `ease-out` |
| Header auto-hide (mobile) | `transform translateY` | 250ms | `ease` |
| Nav item active state | `color`, `background-color` | 150ms | `ease` |
| Mobile overlay fade | `opacity` | 200ms | `ease` |

---

## Offline / Error States

| State | Navigation Behavior |
|-------|---------------------|
| Offline | Sidebar and bottom nav remain functional. Icons stay visible. Labels do not depend on network. |
| Loading | Skeleton placeholders shown for nav user data (avatar, name) |
| Error | Navigation still rendered, main content shows error state |
| Logged out | Redirect to landing page, all authenticated routes protected |

---

## Future Considerations

| Feature | Navigation Impact |
|---------|-------------------|
| Community / Forum | New section between Progress and Settings |
| Gamification (leaderboard, achievements) | Badge on Dashboard icon, new "Achievements" item in Progress hub |
| Study groups | New item in sidebar or accessible from AI Tutor |
| Extension status indicator | Dot indicator on Settings icon when extension is disconnected |
| Collapsed sidebar (icon-only) | User preference to collapse sidebar to 64px icon-only mode for desktop |
| PWA install prompt | Does not change navigation; adds install banner below header |

---

## Current vs. Proposed Navigation Comparison

| Aspect | Current | Proposed |
|--------|---------|----------|
| Sidebar items | 17 flat items | 8 items with 2 expandable groups |
| Mobile bottom nav items | 5 (Home, Plan, Vocab, Review, Progress) | 5 (Home, Plan, AI, Vocab, Progress) |
| AI Tutor in nav | Not present in sidebar or bottom nav | First-class item in both |
| Practice organization | 5 separate sidebar items | 1 hub with 6 sub-items |
| Progress organization | 4 separate items (Progress, Topics, Mock Tests, Progress Review) | 1 hub with 3 sub-items |
| Settings location | Middle of sidebar | Bottom of sidebar, Account section |
| Utility pages (Public API, Info, etc.) | Sidebar items | Footer or overflow |
| Search | Sidebar item | Header search icon |
| Active state | Text color change only | Text + background + left border accent |
| Mobile label | "Home" on bottom, "Dashboard" in sidebar | "Home" on mobile, "Dashboard" desktop — consistent |
