# IELTS Journey — Responsive Mobile Design Specification

## Overview

This document specifies the mobile and responsive design patterns for the redesigned IELTS Journey website. The mobile experience is not a compressed version of the desktop layout — it is a **mobile-first** design where every page, component, and interaction is intentionally crafted for small screens first and progressively enhanced for larger viewports.

The current codebase has mobile support via responsive Tailwind classes and a bottom navigation, but pages largely follow desktop layouts that stack awkwardly on mobile. This spec defines a dedicated mobile UX that feels native, fluid, and learning-focused.

---

## Design Principles

| Principle | Description |
|-----------|-------------|
| **Mobile-first** | Design for the smallest screen first; add complexity for larger screens. Core functionality works on a 375px viewport. |
| **Thumb zone** | Primary actions are placed in the lower half of the screen within easy thumb reach (bottom nav, primary CTA at bottom, FAB). |
| **One thing per screen** | Each mobile screen focuses on one primary task or piece of information. Avoid information density from desktop layouts. |
| **Touch-native** | All interactive elements meet minimum 44px touch targets. Gestures supplement taps (swipe to dismiss, pull to refresh). |
| **Safe areas everywhere** | Notched devices, dynamic island, rounded corners, and home indicators are respected on all edges — not just bottom nav. |
| **Native feel** | Transitions, scrolling, and feedback mimic native iOS/Android patterns. No hover-dependent interactions. |
| **Offline resilience** | Content is displayed even when offline. Empty states and skeletons never show broken layouts. |
| **Reduced motion respected** | All animations respect `prefers-reduced-motion` OS setting. |

---

## Breakpoint System

### Current Breakpoints

The project uses Tailwind v4 default breakpoints already defined in the theme tokens:

| Breakpoint | Min Width | Device | Layout Mode |
|------------|-----------|--------|-------------|
| `xs` (custom) | 0px | Small phones (375px–414px) | Single column, compact |
| `sm` | 640px | Large phones / small tablets | Single column, standard |
| `md` | 768px | Tablets portrait | 2-column grid possible |
| `lg` | 1024px | Tablets landscape / small desktop | Sidebar visible, 2-3 column |
| `xl` | 1280px | Desktop | Full layout, 3-4 column |
| `2xl` | 1536px | Large desktop | Max-width container |

### Mobile-Specific Behavior

```
                  xs          sm          md          lg          xl
               0px         640px       768px       1024px      1280px
               ────────────┬───────────┬───────────┬───────────┬───────────
Bottom nav     │  visible  │  visible  │  optional  │  hidden   │  hidden
Sidebar        │  overlay  │  overlay  │  overlay   │  visible  │  visible
Header height  │   56px    │   56px    │   56px     │   64px    │   64px
Cards per row  │   1       │   1-2     │   2        │   2-3     │   3-4
Content pad    │   16px    │   16px    │   24px     │   32px    │   32px
```

### Container Max-Width

| Viewport | Max Content Width | Behavior |
|----------|-------------------|----------|
| < 640px | 100% | Full width with 16px padding |
| 640px–1023px | 640px | Centered single column |
| 1024px+ | 960px (sidebar) / 1200px (landing) | Centered with sidebar |

---

## Layout Architecture

### Mobile Screen Structure

```
┌────────────────────────────────────────────┐
│  Header (56px)                             │
│  ├─ Back/Hamburger ─ Page Title ─ Icons ─  │
├────────────────────────────────────────────┤
│                                            │
│  Content Area (flexible, scrolls)          │
│  ┌────────────────────────────────────┐    │
│  │  Cards / Lists / Forms / Chat      │    │
│  │                                     │    │
│  │  Each section uses full width       │    │
│  │  with 16px horizontal padding       │    │
│  │                                     │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Sticky Primary CTA (optional)             │
│  "Continue Learning" / "Start Practice"    │
├────────────────────────────────────────────┤
│  Bottom Navigation (72px + safe area)       │
│  Home │ Plan │ AI │ Vocab │ Progress       │
└────────────────────────────────────────────┘
```

### Layout Principles

| Aspect | Behavior |
|--------|----------|
| Full height | `min-height: 100dvh` (`dvh` not `vh` to handle dynamic browser chrome) |
| Header | Fixed or static depending on page context. Not fixed on scrollable content pages to maximize reading space. |
| Bottom nav | Always fixed at bottom. Elevates above keyboard on input focus (iOS/Android native behavior). |
| Content scroll | Vertical only. No horizontal scroll except horizontally scrollable tab bars. |
| Safe area top | `padding-top: env(safe-area-inset-top)` for notched devices and dynamic island |
| Safe area bottom | `padding-bottom: env(safe-area-inset-bottom)` handled by bottom nav |
| Keyboard avoidance | Content adjusts when keyboard appears (iOS `viewport-fit=cover`, Android `windowSoftInputMode`) |

---

## Touch Targets

### Minimum Sizes

| Element Type | Minimum Size | Preferred Size | Notes |
|-------------|--------------|----------------|-------|
| Bottom nav items | 48px × 56px | 56px × 72px | Current codebase meets this |
| Icon buttons | 44px × 44px | 48px × 48px | Close, back, menu |
| Buttons | 44px height | 48px height | Primary, secondary, ghost |
| Links in cards | 44px × 44px | — | Tap area, not visual size |
| Form inputs | 44px height | 48px height | Text, select, search |
| Toggle switches | 44px × 44px | — | Entire row tappable |
| Checkbox/radio | 44px × 44px | — | Enlarged tap zone |
| Cards (clickable) | 100% width | — | Entire card is tappable |
| Modal close area | 44px × 44px | — | × button in modal header |
| Slider handles | 44px × 44px | — | Progress ring, volume |

### Touch Feedback

| Interaction | Visual Feedback | Timing |
|-------------|----------------|--------|
| Tap | `scale(0.96)` with subtle opacity change | 100ms |
| Long press | Background color change, haptic simulation | 500ms |
| Swipe | Content follows finger with rubber-band effect | 300ms animation |
| Drag | Content follows finger, snap on release | 200ms snap |
| Double tap | Brief scale bounce | 200ms |

### Gesture Support

| Gesture | Action | Page/Context |
|---------|--------|-------------|
| Swipe left | Delete/dismiss item | Vocabulary word card, saved article |
| Swipe right | Mark as complete | Study task card, review item |
| Swipe down (from top) | Pull to refresh | Dashboard, vocabulary list, study plan |
| Swipe down (on drawer) | Close bottom drawer | Settings sub-panel, vocabulary detail |
| Swipe left/right (on tabs) | Switch tabs | Practice hub, settings categories |
| Tap (on empty area) | Close keyboard | All pages with inputs |
| Long press | Context menu / multi-select | Vocabulary list, practice history |
| Pinch (future) | Zoom content | Reading practice passage |

---

## Bottom Navigation

### Current Implementation

The existing bottom nav is an inline `<nav>` in `Layout.tsx` with 5 items. It uses hardcoded icons, manual active state handling, glass effect via `backdropFilter`, and safe area padding. An unused `MobileBottomNavigation` component also exists in `packages/ui`.

### Redesigned Bottom Navigation

```
┌────────────────────────────────────────────────────┐
│                                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│  │  Home  │  │  Plan  │  │  AI    │  │  Vocab │  │Progress│
│  │   ◆    │  │   ☐    │  │  ✦     │  │   ☐    │  │   ☐    │
│  │        │  │        │  │  ◆     │  │        │  │        │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘
│  /dashboard   /plan      /tutor     /vocabulary  /progress  │
│                                                     │
│  ─────────────────────────────────────────────────── │
│                        (2px active indicator line)    │
└────────────────────────────────────────────────────┘
  ↑ 72px + env(safe-area-inset-bottom)
  ↑ glass effect: backdrop-filter: blur(12px)
  ↑ border-top: 0.5px
```

### Specifications

| Property | Value |
|----------|-------|
| Height | 72px + `env(safe-area-inset-bottom)` |
| Background | `--color-surface` with `backdrop-filter: blur(12px)` |
| Top border | `0.5px solid var(--color-border-light)` |
| Shadow | `0 -2px 16px rgba(0,0,0,0.05)` |
| Z-index | `--z-fixed` (300) |
| Items | 5 |
| Active indicator | 2px colored line above icon (same width as icon, centered) |
| Press feedback | `scale(0.92)` on `touchstart`, restore on `touchend` |
| Tap highlight | `WebkitTapHighlightColor: transparent` |

### Item Behavior

| State | Icon | Label | Indicator |
|-------|------|-------|-----------|
| Active | Filled/solid style | `--color-primary`, semibold | 2px line visible |
| Inactive | Outline/regular style | `--color-text-secondary`, medium | Hidden |
| Badge | Red dot/count on icon top-right | — | — |
| Pressed | Scale 0.92 | Scale 0.92 | — |

### Badge System

| Badge Type | Location | Data Source |
|-----------|----------|-------------|
| Red dot (unread) | AI Tutor icon | Proactive message unread count |
| Number count | Plan icon | Today's incomplete tasks |
| Number count | Vocab icon | Words due for review |
| Number limit | All badges | Max "99+" |

### Overflow Access

Items not in bottom nav are accessed through:

| Destination | Access Method |
|------------|---------------|
| Study Roadmap | Link from Plan page header |
| Practice hub | Link from Dashboard "Practice" card, or Plan page task |
| Settings | User avatar/menu icon in header, or gear icon next to Progress |

A "+" overflow menu is **not recommended** at launch — analytics should confirm users need frequent access to overflow items before adding this complexity. If adopted, it follows the pattern:

```
[Home] [Plan] [AI] [Vocab] [+]

  [+] opens:
  ┌──────────────┐
  │ • Practice   │
  │ • Roadmap    │
  │ • Settings   │
  │ • Saved      │
  └──────────────┘
```

---

## Header Behavior

### Mobile Header Layout

```
┌────────────────────────────────────────────┐
│  ← (Back or Hamburger)                     │
│                             🔍  ◆     ☰   │
│       Page Title            AI    More    │
│                             Tutor         │
└────────────────────────────────────────────┘
  56px height
  background: color-surface with backdrop-blur(12px)
  border-bottom: 0.5px solid color-border-light
```

### Header Variants

| Page Type | Left Element | Center | Right Elements |
|-----------|-------------|--------|----------------|
| Dashboard | Hamburger (toggle sidebar) | "IELTS Journey" or "Dashboard" | AI Tutor, Dark Mode |
| Sub-page (hub) | Back arrow | Page title | AI Tutor, Dark Mode |
| Sub-page (deep) | Back arrow | Breadcrumb (truncated) | AI Tutor, More (⋮) |
| Chat page | Back arrow | "AI Tutor" | Clear, Notifications, Close |
| Modal/drawer | Close (×) | "Title" | Save/Done |

### Header Auto-Hide

On scrollable pages with long content:

- **Enabled for**: Dashboard news feed, vocabulary list, progress history, practice history
- **Disabled for**: Study plan, AI Tutor chat, settings, forms, review screens
- **Behavior**: Header slides up (translateY -56px) when scrolling down, reappears on scroll up
- **Threshold**: 100px scroll distance before triggering hide
- **Animation**: 250ms ease transform

### Back Button Behavior

| Context | Destination | Animation |
|---------|-------------|-----------|
| Practice → Reading | Back to Practice hub | Slide right (previous page enters from left) |
| Settings → AI Provider | Back to Settings main | Slide right |
| Vocabulary word detail | Back to vocabulary list | Slide right |
| Any sub-page from bottom nav | Back to bottom nav parent | Slide right |

---

## Responsive Cards

### Card Behavior Across Breakpoints

| Card Type | < 640px | 640px–1023px | 1024px+ |
|-----------|---------|---------------|---------|
| Skill card | Full width, stacked | 2 columns | 3-4 columns |
| Study task card | Full width, compact | Full width, standard | Full width, standard |
| Vocabulary word card | Full width, compact | 2 columns | 3 columns |
| Practice card | Full width | 2 columns | 3 columns |
| Progress summary card | 2 per row (50%) | 3 per row | 4 per row |
| Settings section card | Full width | Full width | 2 columns |
| AI recommendation card | Full width | Full width | Sidebar or inline |

### Mobile Card Compact Mode

Cards in the redesign use a `compact` prop that activates on mobile:

| Element | Normal Mode | Compact Mode |
|---------|-------------|--------------|
| Padding | 16px–20px | 12px–16px |
| Title font | 15px–16px | 14px–15px |
| Description | 14px | 13px |
| Icon size | 24px | 20px |
| Action button | Full label | Icon-only or short label |
| Metadata badges | All visible | Key badges only |
| Extra info | Visible | Hidden behind "..." or collapse |

### Card Spacing

| Container | Gap (mobile) | Gap (tablet) | Gap (desktop) |
|-----------|-------------|-------------|---------------|
| Card grid | 12px | 16px | 20px |
| Card list (vertical) | 8px | 12px | 12px |
| Dashboard sections | 16px | 20px | 24px |

---

## AI Tutor Chat — Mobile Behavior

### Current Implementation

The ChatWidget already has a mobile fullscreen mode detected via `window.innerWidth < 640`:

```tsx
const mobileFullscreenStyle = {
  width: '100vw',
  height: '100dvh',
  bottom: '0',
  right: '0',
  borderRadius: '0',
  border: 'none',
}
```

### Redesigned Mobile Chat

#### Popup Mode (Floating Button)

```
                        ┌─────────────┐
                        │  ◆          │  Floating button
                        │  AI Tutor   │  48px diameter
                        └─────────────┘  Fixed bottom-right
                                         Offset: 16px from edges
                                         96px from bottom (above nav)
```

Tap opens full-screen chat overlay:

```
┌────────────────────────────────────────────┐
│  ← AI Tutor              ◆   ☰   ✕         │  Header
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  💬  Welcome! I'm your IELTS         │  │
│  │       Tutor. Ready to practice?      │  │  Messages
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  User message here...               │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Try asking:                        │  │  Suggestions
│  │  [Check my writing] [Explain this]  │  │
│  └──────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  📎 │  Input bar
│  │  Type a message...               │  → │  (fixed bottom,
│  └──────────────────────────────────┘    │  above keyboard)
└────────────────────────────────────────────┘
```

#### Full Page Mode (/tutor route)

When AI Tutor is accessed from bottom nav or sidebar:

- Same full-screen layout as popup
- Back button returns to previous page
- Header shows "AI Tutor" title
- History preserved across sessions
- No floating button overlay (hidden to avoid duplication)

#### Keyboard Behavior

| Event | Behavior |
|-------|----------|
| Input focused | Chat messages scroll to show latest, input bar moves above keyboard |
| Keyboard visible | Bottom of chat visible, auto-scroll to latest message |
| Send message | Input clears, scroll to bottom shows new message + typing indicator |
| Keyboard dismiss | Tap outside input or swipe down on messages |

#### Swipe to Dismiss (Popup Mode)

- Swipe down on chat header closes the popup
- Gesture follows finger with opacity fade
- Release at >30% threshold closes with animation
- Release below threshold snaps back open

---

## Study Plan — Mobile Layout

### Current Approach

The study plan uses a full-width list layout. On mobile, tasks stack vertically with full-width cards.

### Redesigned Mobile Study Plan

```
┌────────────────────────────────────────────┐
│  ← Plan                           [Filter] │  Header
├────────────────────────────────────────────┤
│  Today's Goals                              │
│  ┌──────────────────────────────────────┐  │
│  │  📅  March 15, 2026                  │  │  Date header
│  │  🎯  Target: Band 7.0               │  │
│  │  ⏱  45 min today                    │  │
│  │  ████████░░  80% complete            │  │  Progress bar
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │  Task 1
│  │  ○  Listening Practice              │  │  (pending)
│  │     Section 1-4  •  20 min          │  │
│  │                       [Start]       │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │  Task 2
│  │  ✓  Reading Passage                 │  │  (completed)
│  │     "Climate Change"  •  20 min     │  │
│  │     Score: 6/10                      │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │  Task 3
│  │  ◷  Vocabulary Review               │  │  (in progress)
│  │     15 words due  •  5 min          │  │
│  │     [Continue]                       │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🤖  AI Tutor Note:                  │  │  AI note card
│  │  "Focus on Listening — your        │  │
│  │   weakest skill this week."         │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  📊  Week 3 of 12                    │  │  Week context
│  │  ███████░░░░░░  8/20 tasks done     │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│  [View Full Roadmap →]                      │  Bottom CTA
└────────────────────────────────────────────┘
```

### Task Interaction

| Action | Behavior |
|--------|----------|
| Tap task card | Expand for details (duration, description, related skills) |
| Swipe right | Mark as completed (with haptic feedback) |
| Tap checkbox | Toggle completion state |
| Tap "Start" | Navigate to practice page for that skill |
| Long press | Show context menu: Skip, Reschedule, Ask AI Tutor |

### Task Status Visual

```
Pending:     ○  Gray circle, normal text
In Progress: ◷  Primary color, bold text
Completed:   ✓  Green, muted text, subtle strikethrough
Skipped:     –  Gray, dimmed text
```

### Empty Study Plan (No Tasks)

```
┌────────────────────────────────────────────┐
│                                            │
│         📋                                 │
│    No tasks for today                      │
│                                            │
│  Your study plan is ready but no tasks     │
│  are scheduled for today. Generate a       │
│  new plan or review past tasks.            │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Generate Study Plan                 │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Review Past Tasks                   │  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

---

## Vocabulary Review — Mobile Layout

### Review Start Screen

```
┌────────────────────────────────────────────┐
│  ← Review                                   │
├────────────────────────────────────────────┤
│                                            │
│         📖  Vocabulary Review              │
│                                            │
│    ┌──────────────────────────────────┐    │
│    │           🔤                      │    │
│    │       ┌──────────────┐           │    │
│    │       │   80%        │           │    │  Progress ring
│    │       │  retention   │           │    │
│    │       └──────────────┘           │    │
│    │                                  │    │
│    │  15 words to review today        │    │
│    │  3 new • 8 learning • 4 mastered │    │
│    │                                  │    │
│    │  ┌──────────────────────────┐    │    │
│    │  │  Start Review            │    │    │  Primary CTA
│    │  └──────────────────────────┘    │    │
│    └──────────────────────────────────┘    │
│                                            │
│  Words Due Soon                            │
│  ┌──────────────────────────────────────┐  │
│  │  "analyze"            Hard  • 2d    │  │
│  │  "significant"        Easy  • 4d    │  │
│  │  "approach"           Med   • 5d    │  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Flashcard Mode (During Review)

```
┌────────────────────────────────────────────┐
│  Review                    3 of 15    [✕]  │  Progress header
│  ██░░░░░░░░░░░░░                           │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │         ┌──────────────────┐         │  │
│  │         │                  │         │  │
│  │         │    analyze       │         │  │  Word card
│  │         │                  │         │  │  (tap to flip)
│  │         │    /ˈæn.əl.aɪz/ │         │  │
│  │         │                  │         │  │
│  │         │    verb          │         │  │
│  │         └──────────────────┘         │  │
│  │                                      │  │
│  │  Tap card to see definition          │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │    Still Learning│  │    I Know This  │  │  Two buttons
│  │    (Forgot)      │  │    (Remembered) │  │  Thumb-friendly
│  └─────────────────┘  └─────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Card Flip Animation

| State | Animation | Duration |
|-------|-----------|----------|
| Front → Back | 3D rotateY (180°) | 400ms ease |
| Back → Front | 3D rotateY (-180°) | 400ms ease |
| Correct answer | Green glow, scale up briefly | 200ms |
| Wrong answer | Red shake, subtle | 300ms |

### Review Complete Screen

```
┌────────────────────────────────────────────┐
│  Review Complete!  ✅                       │
├────────────────────────────────────────────┤
│                                            │
│         🎉                                 │
│    Review complete!                        │
│                                            │
│    Score: 12/15 (80%)                      │
│                                            │
│    Strengths:                              │
│    • Academic vocabulary: 6/6 correct     │
│    • Synonyms: 4/4 correct                │
│                                            │
│    Needs Review:                           │
│    • "analyze" — saw it 3 times           │
│    • "significant" — saw it 2 times       │
│                                            │
│    ┌────────────────────────────────────┐  │
│    │  Review Again (3 words)            │  │
│    └────────────────────────────────────┘  │
│                                            │
│    ┌────────────────────────────────────┐  │
│    │  Back to Vocabulary                │  │
│    └────────────────────────────────────┘  │
│                                            │
│  💡  AI Tutor: "Your academic vocab is     │
│      strong. Let's work on synonyms."     │
│                                            │
└────────────────────────────────────────────┘
```

---

## Practice Screen — Mobile Layout

### Practice Hub (Mobile)

```
┌────────────────────────────────────────────┐
│  ← Practice                                 │
├────────────────────────────────────────────┤
│                                            │
│  [Listening] [Reading] [Writing] [Speaking] │  Horizontal scroll
│  [Grammar]                                  │  Active tab underlined
│                                            │
│  ── Content for selected skill ──           │
│                                            │
│  Quick Practice                            │
│  ┌──────────────────────────────────────┐  │
│  │  🎧  Listening Section 1            │  │
│  │  Answer 10 questions  •  15 min     │  │
│  │                      [Start →]      │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  🎧  Listening Section 2            │  │
│  │  Answer 10 questions  •  15 min     │  │
│  │                      [Start →]      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Recent Results                            │
│  ┌──────────────────────────────────────┐  │
│  │  🎧  Section 1 Practice             │  │
│  │  Score: 7/10  •  Yesterday          │  │
│  │  [Review]                            │  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Practice Session Screen

```
┌────────────────────────────────────────────┐
│  ← Reading Practice          ⏱ 12:34       │  Timer in header
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │  Reading passage
│  │  Climate change is one of the        │  │  (scrollable)
│  │  most pressing issues facing         │  │
│  │  humanity today. Scientists have     │  │
│  │  observed significant changes in     │  │
│  │  global temperatures over the past   │  │
│  │  century...                           │  │
│  │                                      │  │
│  │  (scroll for more...)                │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Question 3 of 10                          │
│  ┌──────────────────────────────────────┐  │
│  │  3. What is the main cause of        │  │
│  │     rising sea levels?               │  │
│  │                                      │  │
│  │  ○  A. Industrial pollution          │  │  Options
│  │  ○  B. Melting ice caps              │  │  Touch-friendly
│  │  ○  C. Urban development             │  │  44px min height
│  │  ○  D. Deforestation                 │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  [Submit Answer]  [Skip]  [Ask AI]         │  Action bar
└────────────────────────────────────────────┘
```

### Practice Session Layout Rules

| Element | Mobile Behavior |
|---------|----------------|
| Passage text | Full width, 16px padding, 16px font size for readability |
| Question area | Below passage. If passage is long, it scrolls with questions visible |
| Options | 44px min height, full-width, rounded selection |
| Timer | Fixed in header, auto-pauses if app goes to background |
| Submit button | Sticky at bottom above action bar |
| Audio (listening) | Floating play/pause button, waveform visualization |
| Writing input | Full-screen textarea when focused, keyboard toolbar |
| Speaking input | Bottom sheet with record button, waveform, timer |

### Writing Practice (Mobile-Specific)

```
┌────────────────────────────────────────────┐
│  ← Writing Practice          ⏱ 35:00       │
├────────────────────────────────────────────┤
│                                            │
│  Task 1: Describe the chart below          │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  [Chart/Graph Image]                │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Write your response...              │  │  Full-width
│  │                                      │  │  textarea
│  │                                      │  │  Min 150px
│  │                                      │  │  Expands as
│  │                                      │  │  user types
│  └──────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  0/150 words       [Submit]  [Save Draft]  │  Bottom bar
└────────────────────────────────────────────┘
```

---

## Progress Charts — Mobile Layout

### Current Approach

Progress page uses a full-width stacked layout with cards for each chart.

### Redesigned Mobile Progress

```
┌────────────────────────────────────────────┐
│  ← Progress                                 │
├────────────────────────────────────────────┤
│                                            │
│  Overview                                  │
│  ┌──────────────────────────────────────┐  │
│  │  📅  Exam in 45 days                │  │  Countdown card
│  │  🎯  Target: Band 7.0               │  │
│  │                                      │  │
│  │  Current Band:  6.5  ▲ +0.5         │  │  Big number
│  │  ████████████░░░░░░░░░  6.5/9.0    │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Skills                                    │
│  ┌────────────┐  ┌────────────┐           │
│  │  🎧       │  │  📖       │            │  2×2 grid
│  │  Listening│  │  Reading  │            │
│  │  7.0   ▲  │  │  6.5   —  │            │
│  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐           │
│  │  ✍️       │  │  🗣️       │            │
│  │  Writing  │  │  Speaking │            │
│  │  6.0   ▼  │  │  6.5   ▲  │            │
│  └────────────┘  └────────────┘           │
│                                            │
│  Weekly Activity                           │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │  📊  Hours Studied This Week         │  │  Bar chart
│  │                                      │  │  (horizontal scroll
│  │  Mon  ████  2h                       │  │   if many days)
│  │  Tue  ██████  3h                    │  │
│  │  Wed  ██  1h                        │  │
│  │  Thu  ███████  3.5h                │  │
│  │  Fri  █  0.5h                       │  │
│  │  Sat  —                              │  │
│  │  Sun  —                              │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Study Streak                              │
│  ┌──────────────────────────────────────┐  │
│  │  🔥  12-day streak!                  │  │  Streak card
│  │  ░░▓▓▓▓▓▓▓▓▓▓░░░░░                  │  │
│  │  Best: 15 days                       │  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Chart Visualization Rules

| Chart Type | Mobile Rendering | Interaction |
|-----------|------------------|-------------|
| Bar chart | Horizontal bars (better for mobile), full width | Tap bar for exact value |
| Line chart | SVG with touch-friendly data points | Touch/drag along line for values |
| Progress ring | 48px–64px diameter, readable size | Static display |
| Streak calendar | Compact grid, colored dots per day | Scroll horizontally for past months |
| Donut chart | 80px–100px diameter, legend below | Static display |

### Chart Touch Guidelines

| Element | Size | Interaction |
|---------|------|-------------|
| Data point (line chart) | 28px touch radius | Tap shows tooltip |
| Bar (bar chart) | Min 24px height | Tap shows value label |
| Legend item | 44px height | Tap to toggle visibility |
| Date selector | Arrow buttons (44px) left/right | Single day step |

---

## Settings — Mobile Layout

### Settings Main Screen

```
┌────────────────────────────────────────────┐
│  ← Settings                                 │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  👤  Profile                        │  │
│  │  Name, email, avatar                →  │  Section card
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🤖  AI Provider                    │  │
│  │  OpenAI • Connected                 →  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🌐  Language                        │  │
│  │  English (current)                  →  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🎨  Theme                           │  │
│  │  Dark mode • System                 →  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🔔  Notifications                  │  │
│  │  Daily reminders • On               │  │  Toggle row
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  📊  Study Plan                      │  │
│  │  Target: Band 7.0 • Dec 2026       →  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  💾  Data Management                │  │
│  │  Export, Import, Clear              →  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🔗  Extension Connection           │  │
│  │  Connected • Safari                 →  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  ❓  About                           │  │
│  │  Version 1.0.0                      →  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Settings Sub-Page (e.g., AI Provider Settings)

```
┌────────────────────────────────────────────┐
│  ←  AI Provider Settings                    │  Header with back
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Provider                            │  │
│  │  ┌────────────────────────────────┐  │  │  Select input
│  │  │  OpenAI                         │  │  │  Full width
│  │  └────────────────────────────────┘  │  │  48px height
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  API Key                             │  │
│  │  ┌────────────────────────────────┐  │  │  Input
│  │  │  sk-...****************       │  │  │  Secured
│  │  └────────────────────────────────┘  │  │
│  │  [Show] [Paste] [Test Connection]    │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Model                               │  │
│  │  ┌────────────────────────────────┐  │  │
│  │  │  GPT-4o                         │  │  │
│  │  └────────────────────────────────┘  │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Temperature                         │  │
│  │  0.7  ───●───────────────            │  │  Slider
│  │  Less creative ─── More creative     │  │  44px track
│  └──────────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│  [Save Changes]  [Test Connection]          │  Sticky bottom
└────────────────────────────────────────────┘
```

### Settings Mobile Patterns

| Pattern | Behavior |
|---------|----------|
| Section card | Tappable entire card navigates to sub-page |
| Toggle row | Toggle on right, label on left, entire row tappable |
| Input forms | Full-width inputs, 48px height, clear labels above |
| Sticky save button | Fixed at bottom when form content is tall |
| Danger zone | Red-styled section card at bottom, requires confirmation |
| Long pages | Internal scroll within page, back button always visible |

---

## Modal/Drawer — Mobile Behavior

### Current Implementation

The web app has a local Modal component (centered dialog with sizes sm/md/lg) and an unused Drawer component in `packages/ui`. The AI Chat uses a full-screen overlay on mobile.

### Redesigned Mobile Modal Rules

| Screen Width | Modal Behavior | Style |
|-------------|---------------|-------|
| < 640px | Bottom sheet drawer | Slides up from bottom, 70–90% height |
| 640px–1023px | Centered modal or bottom sheet | Centered with max-width |
| 1024px+ | Centered modal | Centered, max-width 520px default |

### Bottom Sheet Pattern (Mobile Default)

```
┌────────────────────────────────────┐
│  ═══  (drag handle, 32px wide)    │  Handle bar
├────────────────────────────────────┤
│  Title                             │
│  ─────────────────────────────    │
│                                    │
│  Content                           │
│  (scrollable, max 90vh)           │
│                                    │
│  ┌────────────────────────────┐   │
│  │  Primary Action            │   │  Bottom CTA
│  └────────────────────────────┘   │
│  ┌────────────────────────────┐   │
│  │  Secondary Action          │   │
│  └────────────────────────────┘   │
└────────────────────────────────────┘
```

### Drawer Behavior

| Drawer Type | Trigger | Mobile Implementation |
|------------|---------|----------------------|
| Left drawer | Hamburger | Full-width overlay, slides from left, 75% width |
| Right drawer | Info/Detail | Bottom sheet, slides from bottom |
| Bottom drawer | Quick actions | Bottom sheet with drag handle |

### Bottom Sheet Specifications

| Property | Value |
|----------|-------|
| Border radius top | `--radius-2xl` (20px) |
| Drag handle | 32px wide, 4px height, centered |
| Background | `--color-surface` |
| Overlay | `--color-overlay` (rgba 0.4), tap to dismiss |
| Max height | 90vh (scrollable if content exceeds) |
| Animation | Slide up from bottom, 300ms ease |
| Drag to dismiss | Pull down, threshold 30% of height |
| Snap points | Bottom sheet can snap to 30%, 50%, 90% |

### When to Use Which

| Use Case | Component | Mobile Mode |
|----------|-----------|-------------|
| Quick action choice | Bottom sheet | System action sheet style |
| Confirm dialog | Bottom sheet | Compact, two buttons |
| Form edit | Bottom sheet | 70% height, scrollable |
| Vocabulary detail | Bottom sheet | 85% height, rich content |
| Settings sub-form | Bottom sheet or full page | Full page for complex forms |
| AI Tutor chat | Full screen overlay | 100vh × 100vw |
| Image viewer | Full screen overlay | Dark background, centered |
| Date picker | Bottom sheet | 50% height, calendar grid |

### Backdrop Overlay

| Property | Value |
|----------|-------|
| Color | `--color-overlay` (rgba 0,0,0, 0.4 light / 0.6 dark) |
| Animation | Fade in 200ms, fade out 200ms |
| Backdrop blur | `backdrop-filter: blur(2px)` optional, disabled on mobile for performance |
| Tap to close | Yes (configurable via `closeOnOverlay` prop) |
| Body scroll lock | Yes, with scrollbar width compensation |

---

## Form Input Behavior — Mobile

### Input Layout

```
┌────────────────────────────────────────────┐
│  Label (14px, semibold)                    │
│  ┌──────────────────────────────────────┐  │
│  │  Input value here...                │  │  48px height
│  └──────────────────────────────────────┘  │  Round corners
│  Helper text or error message (12px)       │
└────────────────────────────────────────────┘
```

### Mobile Form Guidelines

| Element | Spec |
|---------|------|
| Input height | 48px minimum (44px minimum, 48px preferred) |
| Input padding | 14px horizontal, 12px vertical |
| Font size | 16px (prevents iOS zoom on focus) |
| Border radius | `--radius-md` (8px) |
| Label position | Above input (never placeholder-only) |
| Error text | Below input, 12px, `--color-danger` |
| Helper text | Below input, 12px, `--color-muted` |
| Clear button | Inside input on right (when value exists) |
| Show/hide password | Eye icon inside input on right |
| Character count | Below-right input, 12px, when applicable |

### Keyboard Types for Mobile

| Field Type | `inputMode` | `type` | Enter Key |
|-----------|-------------|--------|-----------|
| Email | `email` | `email` | "Next" or "Done" |
| URL | `url` | `url` | "Go" |
| Number | `numeric` | `number` | "Done" |
| Phone | `tel` | `tel` | "Next" |
| Search | `search` | `search` | "Search" |
| Text (short) | `text` | `text` | "Next" |
| Text (long) | `text` | `text` | "Return" (newline) |
| Date | — | `date` | Native date picker |
| Time | — | `time` | Native time picker |

### Form Layout Rules

| Context | Layout |
|---------|--------|
| Single field | Full width, centered |
| Two fields side-by-side | Stacked vertically on mobile (full width each) |
| Multiple fields | Vertical stack, 16px gap between fields |
| Form with submit | Submit button sticky at bottom (above keyboard) |
| Long form | Internal scroll, sticky header with title |
| Search bar | Fixed at top of list, below header |

### Form Interaction

| Event | Behavior |
|-------|----------|
| Input focus | Scroll to make input visible, show keyboard |
| Input blur | Hide keyboard, validate if needed |
| Submit button | Bottom of form, disabled until valid |
| Error on submit | Scroll to first error, show error message |
| Autofill suggestion | Browser native, `autocomplete` attributes set |
| Paste action | Support paste for API keys, URLs |

---

## Empty, Loading, and Error States — Mobile

### Empty State (Mobile)

```
┌────────────────────────────────────────────┐
│                                            │
│         📖  (icon, 64px)                   │
│                                            │
│    No vocabulary words yet                 │  Title (18px)
│                                            │
│  Save words while reading or practicing    │  Description (14px)
│  to build your IELTS vocabulary.           │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  📚  Start with common IELTS words   │  │  Action button
│  └──────────────────────────────────────┘  │  Full width
│                                            │
└────────────────────────────────────────────┘
```

### Loading Skeleton (Mobile)

```
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐  │
│  │  ████████████████████████████████    │  │  Header shimmer
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │  Card skeleton
│  │  ██████████████████████████████░░░   │  │  (repeated 3×)
│  │  ████████░░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  │  ████████████░░░░░░░░░░░░░░░░░░░░░  │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  (repeated pattern)                  │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  (repeated pattern)                  │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

### Error State (Mobile)

```
┌────────────────────────────────────────────┐
│                                            │
│         ⚠️  (icon, 48px)                   │
│                                            │
│    Something went wrong                    │  Title (18px)
│                                            │
│  We couldn't load your study data.        │  Message (14px)
│  Please check your connection.            │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🔄  Try Again                       │  │  Retry button
│  └──────────────────────────────────────┘  │  Full width
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  Go to Dashboard                     │  │  Secondary
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

### Offline State Banner

```
┌────────────────────────────────────────────┐
│  You're offline. Showing saved data. [Dismiss]  │
├────────────────────────────────────────────┤
│  ... page content ...                       │
└────────────────────────────────────────────┘
```

- Banner appears at top of screen below header
- `--color-warning` background, 44px height
- Tappable dismiss button
- Auto-hides when connection restores
- Content below remains interactive with cached data

### AI Generation Progress

```
┌────────────────────────────────────────────┐
│  Generating your study plan...             │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🔄  Analyzing your goals           │  │  Stage 1 ✓
│  │  🔄  Creating daily tasks...        │  │  Stage 2 ◷
│  │  ○  Organizing timeline             │  │  Stage 3 ○
│  │  ○  Adding AI recommendations       │  │  Stage 4 ○
│  │                                      │  │
│  │  ████████░░░░░░░░  45%              │  │  Overall progress
│  └──────────────────────────────────────┘  │
│                                            │
│  This may take 30–60 seconds.              │
│                                            │
└────────────────────────────────────────────┘
```

---

## Accessibility — Mobile

### Touch Accessibility

| Requirement | Specification |
|-------------|---------------|
| Minimum touch target | 44px × 44px (WCAG 2.2, all interactive elements) |
| Preferred touch target | 48px × 48px (bottom nav items) |
| Touch target spacing | 8px minimum gap between interactive elements |
| Error prevention | Confirm before destructive actions (delete, clear) |
| Touch feedback | Visual feedback within 100ms of touch |
| No hover dependency | All interactions work on touch-only devices |

### Screen Reader Support

| Element | ARIA Requirement |
|---------|------------------|
| Bottom nav | `role="navigation"`, `aria-label="Main navigation"`, `aria-current="page"` on active |
| Header buttons | `aria-label` on all icon-only buttons |
| Progress bars | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Toast notifications | `role="alert"`, `aria-live="polite"` |
| Modal/Drawer | `role="dialog"`, `aria-modal="true"`, focus trap |
| Tabs | `role="tablist"`, `aria-selected`, `aria-controls` |
| Swipe actions | Programmatic alternative (long press for context menu) |

### Color and Contrast

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Text on background | 4.5:1 minimum | 4.5:1 minimum |
| Large text (18px+ bold) | 3:1 minimum | 3:1 minimum |
| UI components (borders) | 3:1 minimum | 3:1 minimum |
| Active state indicator | Color + shape (not color alone) | Same |

### Motion and Animation

- All animations respect `prefers-reduced-motion: reduce`
- Replace with fade transitions (0ms preferred)
- No parallax, no auto-scrolling, no continuous animations
- Page transitions use simple cross-fade instead of slide

### Keyboard and Assistive Technology

- All interactive elements focusable via sequential keyboard navigation
- Visible focus ring (`:focus-visible`) with 2px primary color outline
- Form inputs have associated `<label>` elements
- Error messages linked via `aria-describedby`
- Skip to main content link as first focusable element

---

## Page-Specific Mobile Layouts

### Dashboard (Mobile)

```
┌────────────────────────────────────────────┐
│  👋  Good morning, Alex!                   │  Greeting
│  🎯  Target Band 7.0  •  📅 45 days left  │
├────────────────────────────────────────────┤
│                                            │
│  🔥 12-day streak                          │  Compact stat bar
│                                            │
│  AI Recommendation                         │
│  ┌──────────────────────────────────────┐  │
│  │  🤖  Practice Listening today        │  │  Full width
│  │  Your listening score dropped 0.5    │  │
│  │  this week. Try Section 2.          │  │
│  │                     [Start Practice] │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Today's Mission                           │
│  ┌──────────────────────────────────────┐  │
│  │  Complete 3 tasks                     │  │
│  │  ○ Listening • Reading • Writing     │  │
│  │  ██░░░░░  25%  •  [Continue]         │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  Skills                          [Details]  │
│  ┌────────────┐  ┌────────────┐           │
│  │ 🎧 6.5    │  │ 📖 7.0    │            │  2×2 grid
│  │ Listening  │  │ Reading   │            │
│  └────────────┘  └────────────┘           │
│  ┌────────────┐  ┌────────────┐           │
│  │ ✍️ 5.5    │  │ 🗣️ 6.0    │            │
│  │ Writing ▲  │  │ Speaking  │            │
│  └────────────┘  └────────────┘           │
│                                            │
│  Quick Stats                               │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │ 24 hrs  │ │ 12     │ │ 89%    │         │  3 per row
│  │ Studied │ │ Tasks  │ │ Vocab  │         │
│  └────────┘ └────────┘ └────────┘         │
│                                            │
├────────────────────────────────────────────┤
│  [Continue Learning]                        │  Sticky CTA
└────────────────────────────────────────────┘
```

### Vocabulary List (Mobile)

```
┌────────────────────────────────────────────┐
│  ← Vocabulary                    [+ Add]   │  Header
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │  Search bar
│  │  🔍  Search words...                │  │  Fixed
│  └──────────────────────────────────────┘  │
│                                            │
│  [All] [Learning] [Review] [Mastered]      │  Filter pills
│                                            │  Scrollable
│  15 words                                  │
│                                            │
│  ┌──────────────────────────────────────┐  │  Word card
│  │  ●  analyze    [▶]     Hard  verb   │  │  Compact mode
│  │     /ˈæn.əl.aɪz/                     │  │
│  │     to examine something carefully   │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  ◐  significant  [▶]   Easy  adj   │  │
│  │     /sɪɡˈnɪf.ɪ.kənt/                │  │
│  │     important or noticeable          │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  ★  approach    [▶]   Med   verb    │  │
│  │     /əˈproʊtʃ/                       │  │
│  │     a way of dealing with something  │  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

---

## Touch Gesture Reference

| Gesture | Pattern | Page/Component |
|---------|---------|----------------|
| **Tap** | Single finger touch + release | All interactive elements |
| **Double tap** | Two quick taps | Zoom in reading passage |
| **Swipe left** | Finger moves left, item follows | Delete vocabulary word, dismiss notification |
| **Swipe right** | Finger moves right | Complete task, archive item |
| **Swipe down (content)** | Finger moves down from top | Pull to refresh |
| **Swipe down (modal)** | Finger moves down on header | Close bottom sheet |
| **Swipe down (chat)** | Finger moves down on header | Close AI Tutor popup |
| **Long press** | Touch + hold 500ms | Context menu, multi-select mode |
| **Pinch** | Two fingers move apart/together | Zoom reading passage text |
| **Scroll** | Single finger vertical movement | All scrollable content |
| **Tap status bar** | Tap top of screen | Scroll to top |

### Gesture Feedback

| Gesture | Visual Feedback | Haptic (future) |
|---------|----------------|-----------------|
| Tap | Scale 0.96, opacity change | Light impact |
| Swipe dismiss | Item follows finger, opacity fade | Medium impact |
| Pull to refresh | Spinner appears at top, content bounces | Light impact |
| Long press | Background darkens, haptic tick | Selection impact |

---

## Mobile-First Content Strategy

### Content Priority

Each page follows a priority order on mobile:

| Priority | Dashboard | Study Plan | Vocabulary | Progress |
|----------|-----------|------------|------------|----------|
| 1 (top) | AI Recommendation | Date + Progress | Search bar | Countdown + Band |
| 2 | Today's Mission | Task list | Filter pills | Skill grid |
| 3 | Skill scores | AI Tutor note | Word cards | Weekly activity |
| 4 | Quick stats | Week context | — | Streak |
| 5 (bottom) | Continue CTA | Full Roadmap link | Add button | AI Review link |

### What to Hide on Mobile

| Element | Desktop | Mobile | Mobile Alternative |
|---------|---------|--------|-------------------|
| Sidebar | Always visible | Hidden (overlay) | Bottom nav + hamburger |
| Full breadcrumb | Visible | Truncated | Back button |
| Extended stats | 4+ cards | 2-3 cards | "See all" link |
| Secondary charts | Side-by-side | Tabbed or stacked | Horizontal scroll |
| Long descriptions | Full text | Truncated (2 lines) | Expandable card |
| Detail tables | Full table | Key columns only | "View details" link |
| Multiple CTAs | 3-4 buttons | 1-2 primary buttons | Overflow menu |

---

## Responsive Transition Rules

### Adding Complexity by Breakpoint

As viewport width increases, elements are added (not rearranged):

```
xs (< 640px):       [single column, compact cards, bottom nav]
     ↓
sm (640px+):        [2-column grid possible, full labels]
     ↓
md (768px+):        [larger cards, more metadata shown]
     ↓
lg (1024px+):       [sidebar visible, 3-column grids, full header]
     ↓
xl (1280px+):       [extended stats, side panels, max-width container]
```

### Elements Hidden at Each Breakpoint

| Element | Hidden at | Shown at |
|---------|-----------|----------|
| Bottom navigation | lg+ | default |
| Hamburger menu | lg+ | default |
| Sidebar (static) | default | lg+ |
| Full header actions | < md | md+ |
| Extended card content | < sm | sm+ |
| Secondary metadata badges | < sm | sm+ |
| Card grid columns 3+ | < lg | lg+ |
| AI Tutor floating button (on /tutor) | Always on /tutor | Other pages |

---

## Animation & Transitions — Mobile

### Page Transitions

| Transition | Direction | Duration | Easing | When |
|-----------|-----------|----------|--------|------|
| Push (forward) | New page slides in from right | 250ms | ease-out | Bottom nav navigation |
| Pop (back) | Current page slides right, previous appears | 250ms | ease-out | Back button |
| Modal open | Slides up from bottom | 300ms | ease-out | Bottom sheet, full modal |
| Modal close | Slides down | 250ms | ease-in | Dismiss bottom sheet |
| Fade | Opacity 0 → 1 | 200ms | ease | Tab switches, overlay |
| Cross-fade | Simultaneous opacity | 200ms | ease | Page navigation with shared elements |

### Micro-interactions

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Button press | Scale 0.96 | 100ms | ease-out |
| Card tap | Scale 0.98, subtle shadow | 100ms | ease-out |
| Toggle switch | Knob slides 24px | 200ms | spring |
| Checkmark | Checkmark path draw | 300ms | ease-out |
| Progress fill | Width/stroke grows | 500ms | ease-out |
| Skeleton shimmer | Shimmer moves left→right | 1500ms | linear, infinite |
| Toast enter | Slide in from top | 250ms | ease-out |
| Toast exit | Slide out to top | 200ms | ease-in |
| Badge update | Scale bounce 0→1.3→1 | 300ms | spring |
| List item insert | Slide down, fade in | 200ms | ease-out |

### Reduced Motion Overrides

When `prefers-reduced-motion: reduce` is set:

| Animation | Replacement |
|-----------|-------------|
| Page push/pop | Instant (0ms) |
| Slide up (modal) | Fade in (100ms) |
| Scale on press | Opacity change (50ms) |
| Progress fill animation | Instant (0ms) |
| Skeleton shimmer | Static (no animation) |
| Toast slide | Fade in/out (100ms) |

---

## Implementation Checklist

### Phase 1 — Foundation

- [ ] Create shared `useIsMobile` hook using `window.matchMedia('(max-width: 639px)')`
- [ ] Create shared `useReducedMotion` hook
- [ ] Add mobile-specific CSS variables to theme (safe-area insets, bottom nav height)
- [ ] Update `Layout.tsx` to use `MobileBottomNavigation` from `packages/ui`
- [ ] Add `compact` prop support to Card, SkillCard, VocabularyWordCard, PracticeCard
- [ ] Add `variant="bottom-sheet"` to Modal component for mobile

### Phase 2 — Bottom Navigation

- [ ] Replace inline bottom nav in `Layout.tsx` with `MobileBottomNavigation` from `packages/ui`
- [ ] Add badge support (Plan task count, Vocab due count, AI unread)
- [ ] Add active indicator line animation
- [ ] Add glass effect consistency

### Phase 3 — Pages

- [ ] Dashboard: implement mobile priority layout (AI rec → mission → skills → stats)
- [ ] Study Plan: compact task cards, swipe completion, sticky CTA
- [ ] Vocabulary: full-width compact cards, search fixed, filter pills scrollable
- [ ] AI Tutor: full-screen popup on mobile, swipe to close, keyboard handling
- [ ] Practice: horizontal skill tabs, full-width questions, sticky submit
- [ ] Progress: compact charts, 2×2 skill grid, horizontal scroll charts
- [ ] Settings: section cards with navigation, bottom-sheet sub-pages
- [ ] All pages: loading skeletons matching mobile layout

### Phase 4 — Interactions

- [ ] Pull to refresh on Dashboard, Vocabulary, Study Plan, Progress
- [ ] Swipe to complete on Study Plan tasks
- [ ] Swipe to dismiss vocabulary words
- [ ] Swipe down to close AI Tutor popup and bottom sheets
- [ ] Keyboard avoidance for all form inputs
- [ ] Touch feedback (scale) on all interactive elements

### Phase 5 — Polish

- [ ] Safe area handling on all edges (not just bottom)
- [ ] Responsive typography pass (16px input font prevents iOS zoom)
- [ ] Reduced motion testing
- [ ] Screen reader testing with VoiceOver (iOS) and TalkBack (Android)
- [ ] Touch target audit (all interactive elements ≥ 44px)
- [ ] Color contrast validation in both light and dark modes
- [ ] Offline behavior verification

---

## Accessibility Checklist

| Requirement | Implementation |
|-------------|----------------|
| All touch targets ≥ 44px | Bottom nav, buttons, inputs, cards, links |
| All icon buttons have `aria-label` | Search, close, menu, AI Tutor, back |
| Active nav states use `aria-current="page"` | Bottom nav, sidebar |
| Form labels associated via `htmlFor`/`id` | All inputs, selects, toggles |
| Error messages linked via `aria-describedby` | Form validation |
| Focus visible ring on all focusable elements | 2px `--color-primary` outline |
| No information conveyed by color alone | Status + icon + text |
| Touch feedback not dependent on hover | Scale/opacity on touchstart/touchend |
| Motion can be reduced | `prefers-reduced-motion` respected |
| Pull to refresh has programmatic alternative | Refresh button in header |
| Swipe actions have alternative access | Long press for context menu |
| Keyboard navigation is sequential | Tab order matches visual order |
| Skip link as first focusable element | "Skip to main content" |

---

## Mobile UX Anti-Patterns to Avoid

| Anti-Pattern | Why to Avoid | Mobile Alternative |
|-------------|--------------|-------------------|
| Hover menus | No hover on touch devices | Tap to reveal |
| Tiny touch targets (< 44px) | WCAG 2.2 failure | Min 44px all interactive |
| Horizontal scroll for content | Hard to discover | Stack vertically or use tabs |
| Full-width forms with tiny labels | Hard to read, easy to mis-tap | 48px inputs, labels above |
| Bottom nav with 6+ items | Cognitive overload, tiny targets | Max 5 items |
| Fixed header + fixed bottom nav | Content squeezed to 40% of screen | Auto-hide header on scroll |
| Desktop-first stacking | Feels like squeezed desktop | Mobile-first layout |
| Swipe conflicts | Competing gestures | Clear gesture zones |
| Infinite scroll without saving position | Lost context on return | Save scroll position per page |
| Modal inside modal | Accessibility trap, confusing | Replace inner modal with inline section |
| Input zoom on focus (iOS) | 16px font size prevents auto-zoom | Never use < 16px for `<input>` |

---

## Component Mobile Behavior Summary

| Component | Mobile Mode | Key Differences from Desktop |
|-----------|------------|------------------------------|
| Button | Full width on primary CTAs | Larger touch target, centered text |
| IconButton | 44px minimum | Same size, always adequate touch area |
| Card | Compact padding, no hover effects | 12–16px padding, tap instead of hover |
| Badge | Smaller text, same proportions | — |
| Input | 48px height, 16px font | No auto-zoom on iOS |
| Search Input | Fixed at top of list, full width | Stays visible on scroll |
| Select | Native `<select>` preferred | OS-native picker |
| Modal | Bottom sheet (slides up) | Drag to dismiss, snap points |
| Drawer | Bottom sheet for right drawer | Swipe to close |
| Toast | Full width at bottom (above nav) | Tap to dismiss |
| Tabs | Horizontal scroll, no scrollbar | Swipe between panels |
| Progress Bar | Full width, larger height (8px) | Better visibility |
| Progress Ring | 48–56px diameter | — |
| Empty State | Centered, compact | Full padding on desktop |
| Loading Skeleton | Full width, matches mobile card layout | — |
| Error State | Full width with retry | — |
| Skill Card | 2-column grid, compact scores | Full detail on desktop |
| Study Task Card | Swipe to complete, compact | Full detail with hover |
| AI Tutor Message | Full width (90%), no avatar | 80% width on desktop |
| AI Rec Card | Full width, single column | Side panel or inline |
| Vocabulary Word Card | Compact, right-aligned actions | Full detail with hover |
| Practice Card | Full width, stacked | Grid on desktop |
| Mistake Card | Expandable sections | Always expanded |
| Progress Summary | 2 or 3 per row | 4+ per row |

---

## Summary

The mobile-first redesign transforms IELTS Journey from a desktop application that "works on mobile" to a native-feeling mobile learning app. Key changes:

| Current Problem | Redesigned Solution |
|----------------|---------------------|
| Desktop-first layout stacks awkwardly | Mobile-first layout with progressive enhancement |
| No dedicated mobile navigation strategy | Fixed bottom nav with 5 primary destinations, overflow accessible |
| Tiny touch targets on dense pages | Minimum 44px touch targets everywhere |
| No gesture support | Swipe to complete, pull to refresh, swipe to dismiss |
| Keyboard hides content on forms | Keyboard-aware layout with sticky action areas |
| Fixed header takes limited space | Auto-hide header on scroll for reading-focused pages |
| Same card density on all screens | Compact card mode on mobile, full detail on desktop |
| No touch feedback | Scale/opacity feedback on all interactive elements |
| Safe area only on bottom nav | Safe area handling on all four edges |
| AI Tutor popup squeezes on mobile | Full-screen AI Tutor with swipe-to-dismiss |
