# IELTS Journey — UI/UX Audit Report

**Date:** 2026-07-06
**Scope:** Website (`apps/web`) and Extension (`apps/extension`)
**Type:** Comprehensive audit of routes, pages, headers, navigation, layout, color, consistency, and extension UI

---

## 1. Routes & Navigation Issues

### 1.1 Duplicate / Conflicting Routes

| Route | File | Issue |
|---|---|---|
| `/mistakes` | `features/mistakes/MistakeNotebook.tsx` (features layer) | **Duplicate**: also `/mistakes` rendered from `pages/Mistakes.tsx` but that page is NOT actually used in Layout.tsx — only MistakeNotebook is imported |
| `/plan` | `features/study-plan/StudyPlan` | Used but also `/today-plan` exists — user confusion |
| `/progress-review` | `features/progressReview/ProgressReviewPage.tsx` | Separate page duplicating progress functionality — should merge into `/progress` |
| `/review` | `pages/vocabulary/ReviewPage.tsx` | Vocabulary review |
| `/review-center` | `pages/ReviewCenter.tsx` | Separate review hub — adds confusion |

### 1.2 Missing Routes

- No `/grammar` route for dedicated grammar practice card (only `/grammar` mapped to `GrammarExercisePage`)
- No dedicated `/writing` practice entry in some menus
- `/artifacts` route exists but may not be linked from navigation

### 1.3 Navigation Active Menu — Leading Border

Found at `apps/web/src/components/Layout.tsx:261–263`:

```tsx
borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
paddingLeft: isActive ? '9px' : '12px',
```

This applies an ugly leading border to active nav items. The same pattern is duplicated for AI Tutor nav at lines 444-445.

### 1.4 Hamburger Menu Always Visible

In `apps/web/src/components/layout/Headbar.tsx:94`:
```tsx
className="lg:hidden"  // correct hiding on lg+
```

The hamburger button has `lg:hidden` which is correct. However, the sidebar open/close logic depends on this button, and there's no desktop sidebar toggle. The `layout.tsx` sidebar uses `-translate-x-full` for mobile, `lg:static lg:translate-x-0` for desktop — this is correct, so the hamburger only shows on mobile.

### 1.5 Missing Navigation Icons

- `/progress-review` uses `IconCheckCircle` — inconsistent with Progress page's `IconProgress`
- `/mock-tests` uses `IconProgress` — same icon as progress; should use something like `IconTarget` or `IconAward`
- `/topics` uses `IconStudyPlan` (Map icon) — incorrect semantic
- No dedicated icon for `Grammar` practice in navigation accordion

---

## 2. Page Headers — Missing Page Title with Icon

### 2.1 Missing Page Title Icon: Mistake Review (`/mistakes`)

**File:** `apps/web/src/features/mistakes/MistakeNotebook.tsx:428–433`

```tsx
<h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
  Mistake Review
</h1>
```

No icon. The header uses a plain `<h1>` without any icon component. Compare to Listening Practice which has an SVG icon wrapped in a colored circle.

### 2.2 Missing Page Title Icon: Progress (`/progress`)

**File:** `apps/web/src/pages/Progress.tsx` — delegates to `ProgressTracker` component. Need to check the `ProgressTracker` component for header. Likely no consistent page header.

### 2.3 Missing Page Title Icon: Today Plan (`/today-plan`)

**File:** `apps/web/src/pages/TodayPlanPage.tsx:350`

```tsx
<h1 className="text-xl font-bold leading-tight sm:text-2xl">
  {planDay?.mainGoal || 'Today\'s Study Session'}
</h1>
```

No icon in the header. The page has a gradient hero section but no title icon.

### 2.4 Missing Page Title Icon: Settings

**File:** `apps/web/src/pages/Settings.tsx` — no consistent page title with icon at the top.

### 2.5 No Shared PageHeader Component

There is NO reusable `PageHeader` or `PageTitleWithIcon` component anywhere in the codebase. Each page creates its own header style.

### 2.6 Inconsistent Page Title Styles Across Pages

| Page | Has Icon | Has Description | Has Actions | Uses Shared Component |
|---|---|---|---|---|
| Reading Practice | ✅ (inline SVG) | ✅ | ❌ | ❌ |
| Listening Practice | ✅ (inline SVG) | ✅ | ❌ | ❌ |
| Writing Practice | ✅ (inline SVG) | ✅ | ❌ | ❌ |
| Speaking Practice | ✅ (inline SVG) | ✅ | ❌ | ❌ |
| Grammar Exercise | ✅ (inline SVG) | ✅ | ❌ | ❌ |
| Mistake Review (MistakeNotebook) | ❌ | ✅ | ✅ | ❌ |
| Mistake Notebook (pages/Mistakes.tsx) | ❌ | ✅ | ✅ | ❌ |
| Today Plan | ❌ | ❌ | ✅ | ❌ |
| Vocabulary | ❌ (uses unexported header) | ❌ | ✅ | ❌ |
| Progress | ❌ | ❌ | ❌ | ❌ |
| Settings | ❌ | ❌ | ❌ | ❌ |
| Dashboard | ❌ (greeting, no icon) | ❌ | ❌ | ❌ |
| AI Tutor | ❌ | ✅ (subtitle) | ✅ | ❌ |

---

## 3. Layout & Container Issues

### 3.1 Inconsistent Page Containers

Each page uses its own container sizing:

| Page | Container Style |
|---|---|
| Layout.tsx wrapper | `maxWidth: '1280px', padding: 'var(--spacing-md) var(--spacing-md) var(--spacing-lg)'` |
| Today Plan | `max-width: 4xl` (Tailwind: `max-w-4xl`) |
| MistakeNotebook | `max-w-6xl` |
| pages/Mistakes.tsx | `maxWidth: '1200px'` (hardcoded) |
| Progress | `maxWidth: '1200px'` (hardcoded) |
| Practice pages | `maxWidth: '1280px'` |
| Dashboard | Unknown (delegated) |

No shared `PageContainer` component. Mixed use of Tailwind classes and inline styles.

### 3.2 Today Plan Width Issue

Today Plan uses `max-w-4xl` (max-width: 56rem/896px) while other pages use 1200px or max-w-6xl (72rem/1152px). This is inconsistent and makes Today Plan feel narrower.

### 3.3 AI Tutor Chat Container

Chat is rendered inside a `ChatPopup` component from `@ielts/ai-tutor` package. The container for chat messages likely has width/overflow issues based on the task description.

### 3.4 No Shared AppShell or PageShell

There is no reusable `PageContainer`, `PageSection`, or `ContentGrid` component. Each page creates its own layout structure.

---

## 4. Color Usage Issues

### 4.1 Overly Colorful Cards and Badges

- **Extension PopupDashboard** (`apps/extension/src/popup/components/PopupDashboard.tsx:27-32`): Each stat card has a different bright background color per variant (reading purple, warning amber, listening cyan, primary blue) — creates noisy visual layout.

- **MistakeNotebook** (`apps/web/src/features/mistakes/MistakeNotebook.tsx:12-19`): Each skill has its own bright badge color (violet, blue, cyan, emerald, amber, rose) — 6 different colors on one page.

- **Mistake Notebook (pages/Mistakes.tsx)**: Uses `SKILL_BADGE_VARIANTS` with per-skill colors for bars and badges.

- **Vocabulary Notebook**: Uses status colors (primary, warning, info, success) and difficulty colors (success, warning, danger) — reasonable but overused.

### 4.2 Inconsistent Color Token Usage

- Some pages use inline hex or Tailwind colors instead of CSS custom properties (e.g., `text-slate-400`, `bg-emerald-500`)
- `pages/Mistakes.tsx:320` uses `text-[var(--color-text)]` inline style approach inconsistently with Tailwind classes
- Extension `index.css` duplicates all theme tokens separately from the shared theme package

### 4.3 Mixed Icon Color Usage

- Practice pages use solid colored icon backgrounds per skill
- Some icons are inline SVGs, some use lucide-react icons
- No shared icon color strategy

---

## 5. Duplicate / Conflicting Pages

### 5.1 Duplicate Listening Practice

There is only ONE `ListeningPracticePage` at `apps/web/src/pages/practice/ListeningPracticePage.tsx` and `apps/web/src/features/listening/ListeningPractice`. However, `ListeningJournal.tsx` at `apps/web/src/pages/ListeningJournal.tsx` (886 lines) appears to be a separate, older listening session tracker/log — this is a **duplicate/listening-adjacent feature** that should be merged or removed.

Similarly, `ReadingJournal.tsx` (853 lines) is a separate reading session tracker.

### 5.2 Duplicate Mistake Pages

Two mistake pages exist:
1. `pages/Mistakes.tsx` — "Mistake Notebook" (859 lines, uses local Card/Button/Badge components)
2. `features/mistakes/MistakeNotebook.tsx` — "Mistake Review" (1338 lines, uses local components + some `@ielts/ui`)

Only `MistakeNotebook.tsx` from `features/mistakes/` is actually used in `Layout.tsx`. The `pages/Mistakes.tsx` is NOT connected to any route — it's dead code.

### 5.3 Duplicate Progress Pages

1. `pages/Progress.tsx` — main progress page using `ProgressTracker` component
2. `features/progressReview/ProgressReviewPage.tsx` — AI progress review (separate route `/progress-review`)

Both are active routes. ProgressReview adds AI-generated review content that should be merged into the main Progress page.

### 5.4 Duplicate Review Pages

1. `/review` — `pages/vocabulary/ReviewPage.tsx` — vocabulary review
2. `/review-center` — `pages/ReviewCenter.tsx` — general review hub

---

## 6. Missing / Incomplete Features

### 6.1 AI Tutor Page Incomplete

- `AITutorChat.tsx` delegates entirely to `ChatPopup` from `@ielts/ai-tutor` package
- The page-level wrapper `TutorPage()` in `Layout.tsx:43-192` is minimal — just a header with back/minimize buttons and a chat area
- No suggested prompts, context cards, proper empty states for missing API key, or loading states at the page level

### 6.2 AI Chat Button Issues

Two components exist:
1. `ChatIcon()` at `apps/web/src/components/aiTutor/ChatIcon.tsx` — wraps AITutorChat, no UI button itself
2. `FloatingTutorButton` at `apps/web/src/components/aiTutor/FloatingTutorButton.tsx` — the FAB button
3. Headbar also has an "AI Tutor" chat toggle button

BUT all components are rendered simultaneously in Layout.tsx:
```tsx
<FloatingTutorButton />
<ChatIcon />
```

This means **both** the floating button AND the Headbar's AI Tutor button AND the ChatIcon component render at the same time — which explains the "ai chat button is ugly, transparent, hard to see" complaint. The `FloatingTutorButton` has a proper gradient background, so "transparent" may refer to the Headbar button with `background: 'var(--color-tutor-accent-light)'` which could be very light.

### 6.3 "Ask AI" Button Fake

In `TodayPlanPage.tsx:180-183`:
```tsx
function handleAskAiTutor(taskKey: string) {
  setAiExplanationKey(taskKey)
  setTimeout(() => setAiExplanationKey(null), 2000)
}
```
This sets a temporary state then clears it after 2 seconds — it does NOTHING functional. It's a fake/dead button.

### 6.4 Vocabulary Word Family Missing

`NotebookPage.tsx` imports `WordFamilyDisplay` from `features/vocabulary/components/WordFamilyDisplay` but the expand/dropdown UI for showing word family (noun/verb/adjective/adverb forms) is either missing or not working based on task description.

---

## 7. Extension UI Issues

### 7.1 Duplicate CSS Variables

Extension `popup/index.css` hardcodes all theme tokens (colors, spacing, radius, shadows, z-index, fonts, transitions, breakpoints) — this is a **duplicate of the shared theme package** (`packages/theme/src/`). When theme tokens change, the extension CSS must be manually updated.

### 7.2 No Dark Mode in Extension Popup

The extension's `index.css` includes `.dark` class styles, but there's no mechanism to toggle this from the popup — it likely doesn't honor the website's theme setting.

### 7.3 Colorful Stat Cards in Extension

Extension `PopupDashboard.tsx` uses per-variant colored stat cards (reading purple, warning amber, listening cyan, primary blue) — creates noisy visual at small popup size.

### 7.4 Extension Popup Uses Inconsistent Imports

Some components import from `../../../../../packages/ui/src/components/X` directly (long relative path) while others use `@ielts/ui` — mixed import styles.

### 7.5 Selected Text Action Menu Uses Per-Action Colors

`SelectedTextActionMenu.tsx:24-30` defines per-action colors (explain=blue, simplify=green, save=purple, ask=cyan) — noisy at small popup sizes.

---

## 8. Code Quality Issues

### 8.1 Mixed Styling Approaches

Pages mix:
- Tailwind utility classes (`className="..."`)
- Inline `style={}` objects with CSS variables
- CSS modules/external classes

Examples from single page `MistakeNotebook.tsx` uses all: Tailwind classes, inline styles with CSS variables, and raw component classes.

### 8.2 Dead Code

- `pages/Mistakes.tsx` (859 lines) — **unused**, not imported in any route
- `pages/ListeningJournal.tsx` (886 lines) — likely deprecated, not in main routes
- `pages/ReadingJournal.tsx` (853 lines) — likely deprecated, not in main routes
- `pages/WritingPractice.tsx` — may be unused (separate from `pages/practice/WritingPracticePage.tsx`)

### 8.3 Component Import Inconsistencies

Two sets of components co-exist:
- `@ielts/ui` package components (Card, Button, Badge, Modal, etc.)
- Local `../../components/ui/` components with same names

Example in `MistakeNotebook.tsx`:
```tsx
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
```
But `NotebookPage.tsx` uses:
```tsx
import { Card } from '@ielts/ui/components/Card'
import { Button } from '@ielts/ui/components/Button'
import { Badge } from '@ielts/ui/components/Badge'
```

### 8.4 No Shared Semantic Icon Map for Page Headers

The `IconMap.ts` provides many icon exports but there is no centralized mapping of page routes to semantic icons. Each page must manually pick its own icon.

---

## 9. Line Break & Text Wrapping Issues

### 9.1 Potential Overflow Issues

- Chat messages: No `overflow-wrap: break-word` or `word-break: break-word` visible in AITutorChat
- Mistake descriptions: Some use `truncate`/`textOverflow: 'ellipsis'` which may clip important content
- Card titles: No consistent `overflow-wrap` strategy
- Long words/URLs in practice descriptions may overflow

### 9.2 Missing `word-break` or `overflow-wrap` in Chat

The chat component uses `ChatPopup` from `@ielts/ai-tutor` package — source not inspected but likely missing proper word wrapping for long messages.

---

## 10. Responsive & Mobile Issues

### 10.1 Mobile Bottom Navigation

Two identical components exist:
1. `packages/ui/src/components/MobileBottomNavigation.tsx` (exported from `@ielts/ui`)
2. `apps/web/src/components/ui/BottomNavigation.tsx` (local copy)

Layout.tsx imports from `@ielts/ui` — the local copy is dead code.

### 10.2 Page Padding Inconsistency on Mobile

- Layout wrapper: `padding: 'var(--spacing-md) var(--spacing-md) var(--spacing-lg)'` — consistent padding
- Today Plan: No padding on outer container, uses `space-y-5` for spacing
- MistakeNotebook: `p-6` padding on loading/error, no padding on main container (uses `space-y-6`)

### 10.3 No Shared Responsive Breakpoints Strategy

Each page handles responsive behavior independently with Tailwind breakpoint classes or custom media queries.

---

## 11. Missing Functionality

### 11.1 UI-Only / Fake Buttons

| Location | Button | Issue |
|---|---|---|
| TodayPlanPage `handleAskAiTutor` | "Ask AI" per task | Shows "Thinking..." for 2 seconds, then reverts — does nothing |
| MistakeNotebook empty state | "View Progress" | `onClick: () => {}` — empty handler |
| Various | Various links | May navigate to `#` or missing routes |

### 11.2 Settings Not Persisting

AI Provider settings, language preferences, theme selection — need verification that they properly persist.

---

## 12. Summary Metrics

| Category | Count |
|---|---|
| Dead/unused page files | 4+ |
| Duplicate components | 3+ |
| Missing page title icons | 10+ |
| Inconsistent containers | 8+ |
| Color overuse locations | 6+ |
| Fake/non-functional buttons | 3+ |
| Missing shared layout components | 4+ (PageContainer, PageHeader, ContentGrid, AppShell) |
| Mixed import sources | 5+ |

---

## 13. Priority Fix List

1. **High:** Create shared `PageHeader` component with icon, title, description, actions
2. **High:** Create shared `PageContainer` component for consistent page widths
3. **High:** Add icons to all page headers (especially Mistake Review)
4. **High:** Merge `ProgressReviewPage` into `Progress` page
5. **High:** Remove duplicate Listening Journal / Reading Journal if unused
6. **High:** Remove unused `pages/Mistakes.tsx` (keep `features/mistakes/MistakeNotebook.tsx`)
7. **High:** Fix active nav item leading border (replace with background highlight)
8. **High:** Fix "Ask AI" fake button in TodayPlanPage
9. **Medium:** Create semantic icon mapping for page headers
10. **Medium:** Clean up color overuse in cards, badges, stat cards
11. **Medium:** Complete AI Tutor page with proper states
12. **Medium:** Add word family dropdown to Vocabulary notebook
13. **Medium:** Standardize component imports (use `@ielts/ui` everywhere)
14. **Medium:** Fix chat container width and message wrapping
15. **Low:** Remove duplicate CSS variables from extension
16. **Low:** Remove duplicate BottomNavigation components
17. **Low:** Audit all empty onClick handlers
18. **Low:** Ensure dark mode in extension popup
19. **Low:** Audit text wrapping across all pages
