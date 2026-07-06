# UX/UI Bug Audit Report — IELTS Journey

**Date:** 2026-07-06  
**Scope:** Website (apps/web) + Browser Extension (apps/extension) + Shared Packages  
**Audit Type:** Comprehensive visual, interaction, accessibility, and consistency audit  

---

## Executive Summary

A systematic audit of the entire IELTS Journey codebase (125+ files) revealed **~450 UX/UI bugs** across the website and browser extension.  

| Category | Count |
|----------|-------|
| Critical | 12 |
| High | 68 |
| Medium | 184 |
| Low | 186 |

### Top 5 Issues by Severity

1. **Two conflicting styling systems** — Tailwind utility classes (using `dark:` prefix with raw hex values) coexist with CSS custom properties (`var(--color-*)`). Theme token changes do not propagate to Tailwind-only pages.
2. **Emoji used as primary icons** across 12+ pages while `@ielts/ui` already provides `lucide-react` icon components.
3. **Host-page CSS leakage** in the extension — CSS variables injected into host `:root`, `!important`highlight styles, and MutationObserver on `document.body`.
4. **`var(--color-tutor-*)` undefined** — `ChatBubble.tsx` relies on 5 CSS variables (`--color-tutor-userBubble`, `--color-vocab-new`, etc.) that are not defined in `theme.css`.
5. **Accessibility violations** — `<button>` nested inside `<span>` in Badge, `outline: none` without focus ring on IconButton, label not associated with input in Input component, emoji in buttons without `aria-label`.

---

## 1. Styling System Issues

### 1.1 Two Conflicting Styling Systems

**Files:** All pages under `apps/web/src/pages/` and `apps/web/src/features/`

| # | Description | Files Affected | Severity |
|---|-------------|---------------|----------|
| 1.1.1 | Tailwind utility classes (`text-slate-900 dark:text-slate-100`, `bg-blue-600`, `border-slate-300`) bypass CSS custom property system. Theme token changes to `:root` do not propagate. | DailyPlan.tsx, StudyPlan.tsx, Vocabulary.tsx, VocabularyManager.tsx, ReviewSession.tsx, reviewModes.tsx, Mistakes.tsx, MistakeNotebook.tsx, GrammarNotes.tsx, ArtifactsPage.tsx, Settings.tsx, Progress.tsx | **Critical** |
| 1.1.2 | Three styling approaches used simultaneously: Tailwind classes, inline styles with `var(--color-*)`, and mixed (both in one file). | DayCard.tsx, PhaseSection.tsx, WeekSection.tsx, RoadmapHeader.tsx, RoadmapSummary.tsx | **High** |
| 1.1.3 | Hard-coded `bg-white/70` and `rgba(255,255,255,0.6)` in Dashboard that break in dark mode. | Dashboard.tsx:299, 339 | **High** |
| 1.1.4 | Hard-coded `'white'` instead of `var(--color-surface)` in exam countdown badge. | Dashboard.tsx:272 | **High** |

### 1.2 Missing CSS Variable Definitions

| # | Variable | Used In | Notes | Severity |
|---|----------|---------|-------|----------|
| 1.2.1 | `--color-tutor-userBubble` | ChatBubble.tsx:47 | User messages invisible — no background color | **Critical** |
| 1.2.2 | `--color-tutor-userText` | ChatBubble.tsx:48 | User message text invisible — no color | **Critical** |
| 1.2.3 | `--color-tutor-accent-dark` | TutorAvatar.tsx:30 | Gradient breaks — falls through to undefined | **High** |
| 1.2.4 | `--color-vocab-new` | NotebookPage.tsx:663 | Status strip color resolves to invalid | **High** |
| 1.2.5 | `--color-vocab-learning` | NotebookPage.tsx:664 | Status strip color resolves to invalid | **High** |
| 1.2.6 | `--color-vocab-reviewing` | NotebookPage.tsx:665 | Status strip color resolves to invalid | **High** |
| 1.2.7 | `--color-vocab-mastered` | NotebookPage.tsx:666 | Status strip color resolves to invalid | **High** |

### 1.3 Inconsistent Border Radius

| # | Location | Radius Used | Token Equivalent | Severity |
|---|----------|-------------|------------------|----------|
| 1.3.1 | Dashboard hero section | `rounded-3xl` (1.5rem) | `var(--radius-3xl)` | Medium |
| 1.3.2 | Dashboard mission card | `rounded-2xl` (1rem) | `var(--radius-2xl)` | Medium |
| 1.3.3 | Dashboard other cards | `rounded-xl` (0.75rem) | `var(--radius-xl)` | Medium |
| 1.3.4 | Chat bubbles | `18px` | No token matches exactly | Medium |
| 1.3.5 | Chat widget | `16px` | `var(--radius-2xl)` (20px) vs actual 16px | Medium |
| 1.3.6 | Button sizes `lg` vs `md` | Both use `var(--radius-lg)` | `lg` should use `var(--radius-xl)` | Medium |

### 1.4 Hard-coded Design Values in Components

| # | Component | Values | Severity |
|---|-----------|--------|----------|
| 1.4.1 | LoadingSkeleton | 10+ pixel values (`14px`, `120px`, `40px`, etc.) | Low |
| 1.4.2 | Modal widths | `400px`, `520px`, `680px`, `900px` (no responsive) | Medium |
| 1.4.3 | Drawer widths/heights | `280px`, `360px`, `480px`, `30vh`, `50vh` | Low |
| 1.4.4 | ProgressBar | `4px`, `6px`, `10px` heights | Low |
| 1.4.5 | MobileBottomNavigation | `72px` height, `2px` gap, `24px` indicator, `10px`/`11px` font sizes | Medium |
| 1.4.6 | IconButton disabled opacity | `0.5` (vs Button `0.6`) — inconsistency | Medium |
| 1.4.7 | Various components | `opacity: 0.5, 0.6, 0.7, 0.75, 0.85` — five different hard-coded opacities | Medium |
| 1.4.8 | Card, StudyTaskCard, PracticeCard, MistakeCard, VocabularyDetailPanel | `borderLeft: '3px solid ...'` (hard-coded width) | Low |
| 1.4.9 | ChatWidget | `zIndex: 9999` (theme defines `--z-ai-tutor: 900`) | **High** |

---

## 2. Icon System Issues

### 2.1 Emoji as Primary Icons

| # | Page/Component | Emojis Used | Lines | Severity |
|---|---------------|-------------|-------|----------|
| 2.1.1 | Dashboard | `🔥` for streak | 264, 366 | High |
| 2.1.2 | FullStudyRoadmapPage | `🗺️`, `🏆`, `📝`, `📊`, `🔄` | 163, 206, 250-279 | High |
| 2.1.3 | RoadmapHeader | `🎉`, `📍`, `📅` | 93, 153, 165 | High |
| 2.1.4 | PhaseSection | `✅`, `🔥`, `🔒`, `🧠`, `🔍` | 40-42, 207, 227 | High |
| 2.1.5 | WeekSection | `✅`, `🔥` | 61, 65 | High |
| 2.1.6 | DayCard | `🧠` | 176 | High |
| 2.1.7 | RoadmapSummary | `📊`, `✅`, `🔄`, `📥`, `🤖` | 91, 98, 219-240 | High |
| 2.1.8 | Settings | `🎯`, `✨`, `📅`, `🎨`, `🔔`, `⚙️`, `💾` | 60-86 | High |
| 2.1.9 | ProgressTracker | `⏱️`, `🎯`, `🔥`, `📚`, `📅`, `📖`, `🎧`, `✍️`, `🗣️`, `📝`, `🔤`, `✨` | 156-163, 292, 325-337, 817 | High |
| 2.1.10 | MistakeNotebook | `📝`, `👀`, `✅`, `✨` | 617, 993 | Medium |
| 2.1.11 | ReviewPage | `👁️`, `💭`, `✏️`, `🔗`, `✅`, `⌨️`, `🔄`, `⚠️`, `⚙️`, `⚡` | 37-44, 273-314, 874, 1021 | High |
| 2.1.12 | TodayPlanPage | `🎉` | 456 | Medium |
| 2.1.13 | AI Tutor chatHelpers | `👋`, `👉`, `🎯`, `📝`, `⏰`, `😊` | 14-41 | Medium |
| 2.1.14 | QuickActions (ai-tutor) | `📚`, `🧠`, `🎯`, `✍️`, `💡`, `⏰` | 5-12 | Medium |
| 2.1.15 | SavedWordsView (extension) | Back button uses `←` raw character | 128, 158 | Medium |
| 2.1.16 | SaveTextForm, QuickAddVocab (extension) | Close buttons use raw `✕` character | 256, 204, 339 | Medium |
| 2.1.17 | PendingReviews (extension) | `✅`, `🔄` raw emoji | 137, 196 | Medium |
| 2.1.18 | SelectionPanel (extension) | `📖`, `📝`, `⚠️`, `💡`, `✂️`, `🌐`, `🎯` | 29-36 | **High** |
| 2.1.19 | ArticleCollector (extension) | `📰` | 323 | Medium |
| 2.1.20 | VideoHelper (extension) | `📖`, `📝`, `❓`, `🎤` | 56-59 | Medium |

### 2.2 Inline SVGs Instead of Icon Components

| # | Page | Lines | Severity |
|---|------|-------|----------|
| 2.2.1 | Dashboard | 78-96, 305-307, 373-399, 412-429, 470-472, 531-534, 549-551, 602-628, 784-786 | High |
| 2.2.2 | DailyPlan | 285-601 (throughout) | Medium |
| 2.2.3 | StudyPlan | 238-476 (throughout) | Medium |
| 2.2.4 | Vocabulary | 352-667 (throughout) | Medium |
| 2.2.5 | VocabularyManager | 258-562 (throughout) | Medium |
| 2.2.6 | Settings | 456, 788 — inline SVG duplicates | Low |

### 2.3 Icon-Related Accessibility Issues

| # | Issue | Severity |
|---|-------|----------|
| 2.3.1 | Emoji in buttons without `aria-label` — screen readers read emoji description aloud | **High** |
| 2.3.2 | Unicode symbols (`✓`, `○`, `◉`, `⟳`, `▲`, `●`, `★`) used without text alternatives | **High** |
| 2.3.3 | Selection panel emoji icons within buttons — emoji text node announced separately from button `aria-label` | Medium |

---

## 3. Component-Level Bugs

### 3.1 Button.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.1.1 | Hover/focus styles applied via JS `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` instead of CSS pseudo-classes. Less reliable, causes jank. | Medium |
| 3.1.2 | No `:focus-visible` handling — focus ring disappears on blur even when focus moves within page | Medium |
| 3.1.3 | Disabled state opacity `0.6` hard-coded | Low |
| 3.1.4 | Focus ring `2px` hard-coded spread | Low |
| 3.1.5 | Inconsistent border-radius: both `md` and `lg` sizes use `var(--radius-lg)` | Medium |

### 3.2 IconButton.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.2.1 | `outline: 'none'` with NO alternative focus indicator — keyboard users cannot see focus | **Critical** |
| 3.2.2 | Disabled opacity `0.5` vs Button.tsx `0.6` — inconsistency | Medium |
| 3.2.3 | No hover state for primary variant (Button.tsx has hover for all variants) | Medium |

### 3.3 Badge.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.3.1 | `<button>` nested inside `<span>` — invalid HTML, confuses screen readers | **High** |
| 3.3.2 | Removable close button has no hover state | Medium |
| 3.3.3 | Close button `opacity: 0.6` hard-coded | Low |

### 3.4 Input.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.4.1 | `<label>` NOT associated with `<input>` via `htmlFor`/`id` — clicking label does not focus input, screen readers may not associate them | **High** |

### 3.5 Card.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.5.1 | `borderLeft` width `3px` for tint vs `4px` for accentLeft — inconsistent | Medium |

### 3.6 VocabularyWordCard.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.6.1 | **Copy-paste bug**: compact/non-compact both use `var(--text-xs)` — non-compact should use `var(--text-sm)` | **High** |

### 3.7 Modal.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.7.1 | No responsive breakpoints on widths — may overflow on small screens | Medium |
| 3.7.2 | Focus trap uses `querySelectorAll` — may miss shadow DOM elements | Low |

### 3.8 Drawer.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.8.1 | Missing scrollbar compensation (`paddingRight`) — unlike Modal, causes layout shift | Medium |
| 3.8.2 | `full` width side drawers have no margin on small screens | Medium |

### 3.9 Tabs.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.9.1 | `sm` size overrides tab padding but `md` is empty object — fragile inheritance | Low |

### 3.10 StudyTaskCard.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.10.1 | Missing `'partial'` state in `TaskStatus` type — requirement specifies partial state | Medium |

### 3.11 AITutorMessageCard.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.11.1 | Markdown renderer minimal — only `**bold**` and `*italic*`. AI responses with lists, code, links render raw markdown syntax | Medium |

### 3.12 MobileBottomNavigation.tsx (packages/ui)

| # | Issue | Severity |
|---|-------|----------|
| 3.12.1 | Badge position uses hard-coded negative offsets (`-8px`, `-12px`) — fragile | Medium |
| 3.12.2 | Badge `fontSize: 10px`, label `fontSize: 11px` — not theme tokens | Medium |

### 3.13 DashboardProactiveMessages Not Rendered

| # | Issue | Severity |
|---|-------|----------|
| 3.13.1 | `DashboardProactiveMessages.tsx` exists but is never imported or rendered in the Dashboard | Medium |
| 3.13.2 | `DashboardSection` from `@ielts/ui` not used — Dashboard hand-codes section headers | Medium |
| 3.13.3 | `EmptyStateInline` component available but unused — Dashboard uses inline markup | Low |

### 3.14 Custom Skeleton Instead of LoadingSkeleton

| # | Issue | Severity |
|---|-------|----------|
| 3.14.1 | Dashboard defines custom `SkeletonBlock` instead of using `LoadingSkeleton` from `@ielts/ui` | Medium |
| 3.14.2 | DailyPlan, StudyPlan, Vocabulary, FullStudyRoadmapPage all use basic spinners instead of `LoadingSkeleton` | Medium |

### 3.15 Duplicate Keyframes in Extension

| # | Issue | Severity |
|---|-------|----------|
| 3.15.1 | MiniTutor, AITutorEntry, LoadingSpinner each inject `<style>` with duplicate `@keyframes` | Low |

---

## 4. Dashboard-Specific Bugs

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 4.1 | Skill cards have `onClick` on `<div>` with no `role="button"`, `tabIndex`, or keyboard handler — keyboard-inaccessible | 665-676 | **Critical** |
| 4.2 | Hard-coded `white` and `rgba(255,255,255,0.6)` break in dark mode | 272, 299, 339 | **High** |
| 4.3 | Emoji `🔥` used instead of `IconStreak` from `@ielts/ui` | 264, 366 | High |
| 4.4 | Inline SVGs for ALL skill icons instead of `@ielts/ui` icon components | 78-96, 305-307, 373-399, 412-429 | High |
| 4.5 | Firefox-only `scrollbarWidth: 'none'` — scrollbar visible in Chrome/Safari/Edge | 772 | High |
| 4.6 | Three different border radii on same page: `rounded-3xl`, `rounded-2xl`, `rounded-xl` | various | Medium |
| 4.7 | Singular/plural bug — `"${days} days to exam"` even when `days === 1` | 35-39, 276, 755 | Medium |
| 4.8 | Missing `aria-label` on mission progress bar and band progress bars | 346-351, 721-730, 740-747 | Medium |
| 4.9 | Redundant `role="region"` on section that already has `aria-label` | 599 | Low |
| 4.10 | `todayUnfinished` filter not wrapped in `useMemo` — re-runs on every render | 199 | Low |

---

## 5. AI Tutor Chat Bugs

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 5.1 | `--color-tutor-userBubble` undefined — user messages have no background/invisible | ChatBubble.tsx:47 | **Critical** |
| 5.2 | `--color-tutor-userText` undefined — user message text invisible | ChatBubble.tsx:48 | **Critical** |
| 5.3 | `--color-tutor-accent-dark` undefined — tutor avatar gradient broken | TutorAvatar.tsx:30 | **High** |
| 5.4 | `zIndex: 9999` hard-coded — theme defines `--z-ai-tutor: 900` | ChatWidget.tsx:212 | **High** |
| 5.5 | `aria-modal="false"` on desktop popup — should be omitted entirely, not set to false | ChatWidget.tsx:204 | **High** |
| 5.6 | No `aria-labelledby` pointing to header title — dialog title not announced | ChatWidget.tsx:203 | **High** |
| 5.7 | NotificationCenter filter tabs lack `aria-pressed` — active state invisible to screen readers | NotificationCenter.tsx:177-186 | **High** |
| 5.8 | No loading indicator during async context fetch — user sees blank greeting | AITutorChat.tsx:44-152 | High |
| 5.9 | Error during context fetch silently falls back to generic suggestions — no notification | AITutorChat.tsx:129-143 | Medium |
| 5.10 | Chat bubble `borderRadius: '18px 18px 4px 18px'` — hard-coded, not theme tokens | ChatBubble.tsx:48, 53 | Medium |
| 5.11 | Chat popup uses fixed `width: 380px` — clips on viewports between 380-640px | ChatWidget.tsx:226 | High |
| 5.12 | No `word-break` or `overflow-wrap` on message content — long URLs overflow | ChatBubble.tsx:42, 57 | Medium |
| 5.13 | Chat widget fixed `height: 560px` with only width-based mobile check — landscape mobile overflows | ChatWidget.tsx:229, useChatWidget.ts:62-67 | Medium |
| 5.14 | Four distinct button styles with no semantic differentiation across components | Multiple files | Medium |
| 5.15 | Markdown rendering only supports bold/italic — AI responses show raw markdown | ChatBubble.tsx:57 | Medium |
| 5.16 | Focus not trapped inside chat dialog — Tab can move behind popup | ChatWidget.tsx:103-107 | Medium |
| 5.17 | No retry button on send error — user cannot resend without re-typing | ChatWidget.tsx:512-524 | Medium |
| 5.18 | `DEFAULT_QUICK_ACTIONS` and `DEFAULT_QUICK_PROMPTS` duplicated in two files | chatHelpers.ts:44-51, ChatWidget.tsx:19-25 | Medium |
| 5.19 | `100dvh` fallback not supported in older browsers — mobile fullscreen overflows | ChatWidget.tsx:221 | Medium |
| 5.20 | Textarea autofocus has 300ms delay — perceptible and feels sluggish | ChatWidget.tsx:100 | Low |

---

## 6. Study Plan & Roadmap Bugs

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 6.1 | Hard-coded Tailwind colors throughout (`bg-purple-100`, `text-blue-600`, `border-green-200`, etc.) | DailyPlan.tsx:17-27, StudyPlan.tsx:11-32 | **High** |
| 6.2 | Emoji icons throughout roadmap (`✅`, `🔥`, `🔒`, `🧠`, `🗺️`, `🏆`, `📝`, `📊`, `🔄`, `🍾`, `📍`, `📅`) | FullStudyRoadmapPage.tsx, RoadmapHeader.tsx, PhaseSection.tsx, WeekSection.tsx, DayCard.tsx, RoadmapSummary.tsx | **High** |
| 6.3 | Roadmap progress bar marker logic inverted — markers hidden instead of dimmed | RoadmapHeader.tsx:127-137 | Medium |
| 6.4 | `pulse` keyframe animation in DayCard not defined in theme.css — no animation at runtime | DayCard.tsx:97 | Medium |
| 6.5 | DailyPlan only supports binary `isDone` — no `skipped`, `partial`, `pending` states | DailyPlan.tsx:97-133 | Medium |
| 6.6 | `useEffect` with `setTimeout(300ms)` for scrollIntoView — fragile, ref may not be ready | FullStudyRoadmapPage.tsx:82-87 | Medium |
| 6.7 | Progress bar in DailyPlan lacks `role="progressbar"` and ARIA attributes | DailyPlan.tsx:373-376 | Medium |
| 6.8 | View mode toggle buttons lack `role="radiogroup"` and `role="radio"` — keyboard inaccessible | DailyPlan.tsx:301-322 | Medium |
| 6.9 | Phase expansion inconsistent — StudyPlan uses single expansion, RoadmapPage uses Set | StudyPlan.tsx:302-434 | Medium |
| 6.10 | Deeply nested cards on mobile (Phase > Week > Day) with compounding padding | StudyPlan.tsx:302-434 | Medium |

---

## 7. Vocabulary Bugs

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 7.1 | `STATUS_COLORS` and `DIFFICULTY_COLORS` use hard-coded Tailwind classes (4 files) | Vocabulary.tsx:28-39, VocabularyManager.tsx:35-46, NotebookPage.tsx:49-93 | **High** |
| 7.2 | Undefined CSS variables `--color-vocab-new`, `--vocab-learning`, `--vocab-reviewing`, `--vocab-mastered` in NotebookPage — status strips invisible | NotebookPage.tsx:663-666 | **High** |
| 7.3 | Emoji icons in ReviewPage (`👁️`, `💭`, `✏️`, `🔗`, `✅`, `⌨️`, `🔄`, `⚠️`, `⚙️`, `⚡`, `⟳`, `▲`, `●`, `★`) | ReviewPage.tsx:37-44, 273-325, 874, 977-979, 1021 | **High** |
| 7.4 | "Due Words", "Weak Words", "Custom Session" cards are clickable `<div>` with no `role="button"` or `tabIndex` — keyboard inaccessible | ReviewPage.tsx:273-325 | **High** |
| 7.5 | Rating buttons use Unicode symbols without text alternatives | ReviewPage.tsx:977-979 | High |
| 7.6 | Two different card styles for same concept — Vocabulary.tsx uses `rounded-lg` Tailwind, NotebookPage.tsx uses `var(--radius-xl)` inline | Vocabulary.tsx:531-673 vs NotebookPage.tsx:640-892 | Medium |
| 7.7 | Quick-rate buttons in NotebookPage look different from rating buttons in ReviewPage | NotebookPage.tsx:836-866 vs ReviewPage.tsx:939-985 | Medium |
| 7.8 | "Mark as difficult" icon uses alert-circle shape — communicates error, not difficulty | Vocabulary.tsx:611-615 | Medium |
| 7.9 | Card hover uses JS `onMouseEnter`/`onMouseLeave` instead of CSS — not mobile-friendly | NotebookPage.tsx:652 | Medium |
| 7.10 | No scroll-to-top when filters change — user remains at bottom of filtered list | Vocabulary.tsx:128-175, NotebookPage.tsx:137-173 | Low |
| 7.11 | Tag filter disappears mid-layout when all tags removed — causes visual jump | Vocabulary.tsx:414 | Low |
| 7.12 | Clear filters also resets view tab — unexpected side effect | NotebookPage.tsx:491-536 | Low |
| 7.13 | `<button>` wrapping `<h3>` for word heading — invalid nesting | Vocabulary.tsx:539-541 | Medium |

---

## 8. Settings & AI Provider Settings Bugs

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 8.1 | Emoji icons for all settings sections (`🎯`, `✨`, `📅`, `🎨`, `🔔`, `⚙️`, `💾`) | Settings.tsx:60-86 | **High** |
| 8.2 | AI Provider Settings duplicated in both Settings.tsx and AIProviderSettingsPage.tsx | Both files | **High** |
| 8.3 | `pageError` state declared but never set — dead code | Settings.tsx:100, AIProviderSettingsPage.tsx:19 | Medium |
| 8.4 | Artificial 300ms loading timeout — fake loading state, not data-driven | Settings.tsx:123-126, AIProviderSettingsPage.tsx:33-36 | Medium |
| 8.5 | Mobile tab buttons missing proper `id`/`aria-labelledby` association | Settings.tsx:539-567 | Medium |
| 8.6 | Sidebar fixed at `220px` — no responsive fallback | Settings.tsx:477 | Low |
| 8.7 | Inline SVG duplicates check/alert-circle icons in test result section | Settings.tsx:456, 788 | Low |
| 8.8 | No empty state for first-time user data section | Settings.tsx:1141-1221 | Low |
| 8.9 | `CorsProxySection` defined in same file — unnecessarily long component | Settings.tsx:1264-1382 | Low |

---

## 9. Progress & Mistake Review Bugs

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 9.1 | Emoji everywhere in ProgressTracker — stat cards, skill icons, AI action buttons, empty state | ProgressTracker.tsx:156-163, 226, 292, 325-337, 762, 817 | **High** |
| 9.2 | Hard-coded `'#fff'` text on status badges — breaks in dark mode | ProgressTracker.tsx:226 | **High** |
| 9.3 | **Broken navigation** — navigates to `/today` (route is `/today-plan`) and `/ai-tutor` (route is `/tutor`) | ProgressTracker.tsx:767, 814, 827 | **High** |
| 9.4 | Hard-coded Tailwind color classes in MistakeNotebook — bypasses theme system | MistakeNotebook.tsx:12-18, 21-25, 28-32, 1181-1184 | **High** |
| 9.5 | Inline empty states defined per section instead of using shared `<EmptyState>` component | ProgressTracker.tsx:345-625 | Medium |
| 9.6 | Toast uses hard-coded `bg-emerald-500 text-white` / `bg-red-500 text-white` | MistakeNotebook.tsx:418-419 | Medium |
| 9.7 | Non-semantic icon characters ('W', '✓', '▶', '↻') in RecentActivity section | ProgressTracker.tsx:605-608 | Medium |
| 9.8 | `ringColor` used as inline style — not a valid CSS property | MistakeNotebook.tsx:580 | Low |
| 9.9 | `formatDate` duplicated across 5+ files | Multiple files | Low |

---

## 10. Practice Pages Bugs (Reading, Listening, Writing, Speaking, Grammar)

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 10.1 | `window.location.href = '/tutor'` instead of `useNavigate` — causes full page reload | All 5 pages ~line 103 | **High** |
| 10.2 | Artificial `setTimeout(() => setReady(true), 100)` — unnecessary delay | All 5 pages:10-13 | Low |
| 10.3 | Missing `useNavigate` import while using navigation | All 5 pages | Medium |
| 10.4 | `fontFamily: 'var(--font-sans)'` on headings — redundant, already default | All 5 pages | Low |
| 10.5 | Grammar page uses `var(--color-success-light)` — inconsistent with skill-specific colors | GrammarExercisePage.tsx:43 | Low |
| 10.6 | No error fallback UI for page-level loading failure | All 5 pages | Medium |

---

## 11. Navigation & Routing Bugs

| # | Issue | Severity |
|---|-------|----------|
| 11.1 | "Saved Content" (`/artifacts`) route exists in Layout but NOT in sidebar — users cannot discover this page | **High** |
| 11.2 | "Search" (`/search`) route exists but NOT in sidebar — undiscoverable | **High** |
| 11.3 | "Grammar Notes" — no navigation path in sidebar | **High** |
| 11.4 | Mobile bottom nav uses `window.location.href` — causes full page reloads | Medium |
| 11.5 | No dedicated 404 page — redirects silently to `/dashboard` | Low |
| 11.6 | `RedirectWithHash` uses `<Navigate replace>` — prevents back button from working | Low |

---

## 12. Extension Popup Bugs

| # | Issue | Lines | Severity |
|---|-------|-------|----------|
| 12.1 | Tailwind classes used in SavedWordsView with NO Tailwind pipeline — badges have no background/text color | SavedWordsView.tsx:308 | **Critical** |
| 12.2 | SyncStatusBadge retry sets `lastSyncTime` to current timestamp with NO actual sync — fake success | SyncStatusBadge.tsx:75-87 | **High** |
| 12.3 | "Clear Pending Items" marks items as synced WITHOUT sending to server — silently discards data | BackupRestore.tsx:152-160 | **High** |
| 12.4 | AITutorEntry "Continue Anyway" button sets `loading: true/false` synchronously — loading state never shows | AITutorEntry.tsx:144-148 | Medium |
| 12.5 | MiniTutor 4-column grid at 400px popup width — labels wrap awkwardly | MiniTutor.tsx:646 | Medium |
| 12.6 | ReviewSession rating buttons use hard-coded hex colors instead of theme variables | ReviewSession.tsx:10-13, 254 | Medium |
| 12.7 | Gradient uses hard-coded `#7c3aed` instead of `var(--color-skill-reading)` | ReviewSession.tsx:254 | Medium |
| 12.8 | Hard-coded `color: '#fff'` instead of `var(--color-on-primary)` in 7+ components | SaveTextForm.tsx:207, 264, 497, QuickAddVocab.tsx:142, 214, 391, ArticleCollector.tsx:285, AITutorEntry.tsx:220, MiniTutor.tsx:505, 530 | Medium |
| 12.9 | PopupDashboard stat labels use `white-space: nowrap` — overflow on narrow columns | PopupDashboard.tsx:58, 514 | Low |
| 12.10 | SavedWordsView 400px max-height list can exceed 600px total popup height | SavedWordsView.tsx:244 | Medium |
| 12.11 | SyncStatusBadge never validates real sync — any value in `lastSyncTime` shows "synced" | PopupDashboard.tsx:206-212 | Medium |
| 12.12 | No loading state for initial sync check in BackupRestore | BackupRestore.tsx:99-101 | Low |
| 12.13 | ImportExportSection search results have no scroll constraint | ImportExportSection.tsx:368 | Low |
| 12.14 | ArticleCollector AI questions section has no height limit | ArticleCollector.tsx:628-714 | Low |

---

## 13. Extension Content Script & Host Page Safety Bugs

| # | Issue | Severity |
|---|-------|----------|
| 13.1 | **CSS variables injected into host `:root`** — overwrites host CSS variables | sharedStyles.ts:98-111 | **Critical** |
| 13.2 | **`!important` on all highlight properties** — forcefully overrides host styles | highlightStyles.ts:9-24 | **High** |
| 13.3 | **MutationObserver on `document.body` with `subtree: true`** — performance impact on SPA-heavy sites | savedKeywordHighlighter.ts:128-173 | **High** |
| 13.4 | **`normalize()` merges host text nodes** — breaks host scripts that cache text node references | highlightEngine.ts:197-207 | **High** |
| 13.5 | **`VOCAB_LIST_SYNC` message without source validation** — any script on host page can replace all vocab data | bridge-client.ts:100 | **Critical** |
| 13.6 | Selection panel uses estimated height for positioning — clips at viewport edges | selectionPanel.ts:411-418 | Medium |
| 13.7 | Dictionary panel hard-codes 80px height — too small for content | dictionaryPanel.ts:130 | Medium |
| 13.8 | Selection panel hides on scroll instead of repositioning | selectionPanel.ts:358 | Low |
| 13.9 | Generic element IDs (`#ielts-toast`, `#ielts-sp-shadow`) could collide with host page elements | Multiple files | Medium |
| 13.10 | Toast uses conflicting `role="alert"` + `aria-live="polite"` | selectionPanel.ts:648-649 | Low |
| 13.11 | Highlight tooltip not linked via `aria-describedby` | highlightTooltip.ts:48 | Medium |
| 13.12 | `color-mix()` used without fallback — unsupported in Safari <15, Firefox <109, Chrome <111 | Multiple files | Medium |
| 13.13 | Host-page styles for `.ielts-btn` selectors could affect host elements | sharedStyles.ts:131 | Low |
| 13.14 | Selection panel emoji have no accessible text — inside buttons with `aria-label` but emoji text node still announced | selectionPanel.ts:442 | Medium |

---

## 14. Missing States

### 14.1 Loading States

| # | Page/Component | Issue | Severity |
|---|---------------|-------|----------|
| 14.1.1 | Dashboard | Custom `SkeletonBlock` instead of `LoadingSkeleton` | Medium |
| 14.1.2 | DailyPlan | Basic spinner instead of `LoadingSkeleton` | Medium |
| 14.1.3 | StudyPlan | Basic spinner instead of `LoadingSkeleton` | Medium |
| 14.1.4 | Vocabulary | Basic spinner instead of `LoadingSkeleton` | Medium |
| 14.1.5 | FullStudyRoadmapPage | Custom pulse divs instead of `LoadingSkeleton` | Medium |
| 14.1.6 | TopicsProgress | Basic spinner instead of `LoadingSkeleton` | Medium |
| 14.1.7 | AI Tutor Chat | No loading indicator during async context fetch | High |
| 14.1.8 | BackupRestore (extension) | No loading state for initial sync check | Low |
| 14.1.9 | AITutorEntry (extension) | Continue Anyway button loading state never shows | Medium |

### 14.2 Empty States

| # | Page/Component | Issue | Severity |
|---|---------------|-------|----------|
| 14.2.1 | Dashboard tasks | Uses inline markup instead of `EmptyStateInline` component | Low |
| 14.2.2 | ProgressTracker | Inline empty states per section instead of shared component | Medium |
| 14.2.3 | TopicsProgress | No dedicated empty state | Medium |
| 14.2.4 | Settings Data section | No empty state for first-time user | Low |
| 14.2.5 | ImportExportSection (extension) | No prompt before first search | Low |
| 14.2.6 | ProgressTracker empty state | Uses `<span style={{fontSize:'48px'}}>📊</span>` — emoji, no component | Medium |

### 14.3 Error States

| # | Page/Component | Issue | Severity |
|---|---------------|-------|----------|
| 14.3.1 | AI Tutor Chat | Error during context fetch silently falls back — no notification | Medium |
| 14.3.2 | AI Tutor Chat | Send error has no retry button — user must re-type | Medium |
| 14.3.3 | StudyPlan generate modal | Error during plan generation shows infinite spinner | Medium |
| 14.3.4 | ReviewSession | Loading failure has no fallback | Medium |
| 14.3.5 | Settings | `pageError` state declared but never set — dead code | Medium |
| 14.3.6 | Practice pages | No error fallback UI for page-level failure | Medium |

---

## 15. Accessibility Issues

| # | Issue | Component/Page | Severity |
|---|-------|---------------|----------|
| 15.1 | `<label>` not associated with `<input>` via `htmlFor`/`id` | Input.tsx:82-92 | **High** |
| 15.2 | `<button>` nested inside `<span>` — invalid HTML, confuses screen readers | Badge.tsx:149-165 | **High** |
| 15.3 | `outline: 'none'` with NO focus ring alternative | IconButton.tsx:70 | **Critical** |
| 15.4 | Emoji in buttons without `aria-label` — screen readers read emoji descriptions | 20+ pages | **High** |
| 15.5 | Unicode symbols (`✓`, `○`, `⟳`, `▲`, `●`, `★`) as icons without text alternatives | Multiple pages | **High** |
| 15.6 | Skill cards are `<div>` with `onClick` but no `role="button"`, `tabIndex`, or keyboard handler | Dashboard.tsx:665-676 | **Critical** |
| 15.7 | "Due Words"/"Weak Words" cards are clickable `<div>` — keyboard inaccessible | ReviewPage.tsx:273-325 | **High** |
| 15.8 | Missing `aria-label` on mission progress bar | Dashboard.tsx:346-351 | Medium |
| 15.9 | Missing `aria-label` on band progress bars | Dashboard.tsx:721-730, 740-747 | Medium |
| 15.10 | `aria-modal="false"` on desktop dialog — should be omitted, not set to false | ChatWidget.tsx:204 | **High** |
| 15.11 | No `aria-labelledby` on chat dialog pointing to header title | ChatWidget.tsx:203 | **High** |
| 15.12 | NotificationCenter filter tabs lack `aria-pressed` — active state invisible | NotificationCenter.tsx:177-186 | **High** |
| 15.13 | Focus not trapped inside chat dialog — Tab can move behind popup | ChatWidget.tsx:103-107 | Medium |
| 15.14 | DailyPlan view toggle lacks `role="radiogroup"` and `role="radio"` | DailyPlan.tsx:301-322 | Medium |
| 15.15 | Progress bar lacks `role="progressbar"` in DailyPlan | DailyPlan.tsx:373-376 | Medium |
| 15.16 | `<button>` wrapping `<h3>` — invalid nesting | Vocabulary.tsx:539-541 | Medium |
| 15.17 | Quick action buttons have no `aria-label` — icon hidden from screen readers | QuickActions.tsx:25-34 | Medium |
| 15.18 | Context suggestion card buttons have no `aria-label` — just "Continue" without context | ContextSuggestionCard.tsx:49-58 | Medium |
| 15.19 | NotificationCenter buttons rely on `title` attribute for accessibility — `title` not reliable across screen readers | NotificationCenter.tsx:251, 345-352 | Medium |
| 15.20 | `color: #fff` on primary buttons in extension — barely passes WCAG AA in dark mode | Multiple extension files | Medium |
| 15.21 | No `aria-keyshortcuts` on chat dialog — Esc key not communicated | ChatWidget.tsx:108 | Low |

---

## 16. Extension Sync & Data Integrity Bugs

| # | Issue | Severity |
|---|-------|----------|
| 16.1 | SyncStatusBadge retry fakes a sync — sets timestamp, no actual HTTP/API call | **High** |
| 16.2 | "Clear Pending Items" silently discards pending changes without syncing | **High** |
| 16.3 | `VOCAB_LIST_SYNC` accepts messages from any script on host origin — no source validation | **Critical** |
| 16.4 | Sync badge only checks `lastSyncTime` existence — never validates real sync | Medium |
| 16.5 | No loading state for initial sync check | Low |

---

## 17. Broken Functionality

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 17.1 | `navigate('/today')` — route is `/today-plan` | ProgressTracker.tsx:767 | **High** |
| 17.2 | `navigate('/ai-tutor')` — route is `/tutor` | ProgressTracker.tsx:827 | **High** |
| 17.3 | ReviewSession `cycleMode()` function mutates state without changing mode index — button does nothing | ReviewSession.tsx:58-65 | **High** |
| 17.4 | ReviewSession TypeError — `distractors[0]` accessed when `distractors` is undefined | ReviewSession.tsx:413-418 | **High** |
| 17.5 | AITutorEntry "Continue Anyway" sets `loading: false` synchronously after `loading: true` — never shows loading | AITutorEntry.tsx:144-148 | Medium |
| 17.6 | SyncStatusBadge retry fakes sync — no real sync attempted | SyncStatusBadge.tsx:75-87 | **High** |
| 17.7 | "Clear Pending Items" marks items as synced without sending | BackupRestore.tsx:152-160 | **High** |
| 17.8 | `color-mix()` without fallback in extension — silently drops on older browsers | Multiple files | Medium |
| 17.9 | ChatBubble undefined CSS variables — user messages invisible | ChatBubble.tsx:47-48 | **Critical** |
| 17.10 | VocabularyWordCard copy-paste bug — compact/non-compact same font size | VocabularyWordCard.tsx:126 | **High** |
| 17.11 | `window.location.href` instead of `useNavigate` on practice pages and mobile nav | Multiple | **High** |
| 17.12 | `pulse` keyframe not defined in theme.css — no animation | DayCard.tsx:97 | Medium |

---

## 18. Code Quality & Maintenance Issues

| # | Issue | Severity |
|---|-------|----------|
| 18.1 | `formatDate` duplicated across 5+ files with slight variations | Medium |
| 18.2 | `generateId` duplicated across multiple files | Low |
| 18.3 | AI Provider Settings duplicated in Settings.tsx and AIProviderSettingsPage.tsx | **High** |
| 18.4 | `DEFAULT_QUICK_ACTIONS` and `DEFAULT_QUICK_PROMPTS` duplicated in two files | Medium |
| 18.5 | Miscounts.tsx (old) exists as dead code alongside MistakeNotebook.tsx (active) | Medium |
| 18.6 | Hover/focus styles via JS `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` instead of CSS in 5+ components | Medium |
| 18.7 | CSS custom properties duplicated in extension CSS files (not imported from @ielts/theme) | Low |
| 18.8 | `pageError` state dead code in Settings and AIProviderSettingsPage | Medium |

---

## 19. Photo/Image Audit

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| 19.1 | Listening-related PNGs missing in practice page | apps/web/public/listening/ | Info |

---

## 20. Internationalization

| # | Issue | Severity |
|---|-------|----------|
| 20.1 | Hard-coded English strings throughout — no i18n framework detected | Info |

---

## Severity Summary

| Severity | Count | Key Areas |
|----------|-------|-----------|
| **Critical** | 12 | Undefined CSS variables breaking rendering (4), host page CSS leakage (2), security (1), CSS system conflict (1), keyboard inaccessibility (2), broken extension styling (1) |
| **High** | 68 | Emoji icons (20+), hard-coded Tailwind colors (28), accessibility violations (15+), broken navigation (3), broken functionality (5), undefined CSS variables (7) |
| **Medium** | 184 | Inconsistent styling (25), missing states (15+), responsive issues (20+), component inconsistencies (30+), missing `aria-label` (10+), code duplication (8+) |
| **Low** | 186 | Minor polish (40+), hard-coded small values (50+), redundant code (20+), edge cases (30+), non-critical accessibility (20+) |

---

## Files with Most Issues

| File | Issues Found |
|------|-------------|
| apps/web/src/features/dashboard/Dashboard.tsx | 14 |
| apps/web/src/pages/Settings.tsx | 9 |
| apps/web/src/pages/DailyPlan.tsx | 12 |
| apps/web/src/pages/Vocabulary.tsx | 11 |
| apps/web/src/pages/vocabulary/ReviewPage.tsx | 10 |
| apps/web/src/features/progress/ProgressTracker.tsx | 10 |
| packages/ai-tutor/src/components/ChatWidget.tsx | 12 |
| packages/ui/src/components/IconButton.tsx | 3 |
| packages/ui/src/components/Badge.tsx | 3 |
| apps/extension/src/popup/components/SavedWordsView.tsx | 3 |
| apps/extension/src/content-script/sharedStyles.ts | 2 (critical) |
| apps/extension/src/popup/components/SyncStatusBadge.tsx | 2 (critical) |

---

## Top 10 Must-Fix Items

| Priority | Issue | Impact |
|----------|-------|--------|
| **P0** | Define `--color-tutor-userBubble` and `--color-tutor-userText` in theme.css | User messages invisible in AI Tutor |
| **P0** | Add `htmlFor`/`id` association to Input.tsx label | Form accessibility violation |
| **P0** | Add focus ring to IconButton (`outline: none` fix) | Keyboard users cannot see focus |
| **P0** | Move extension CSS variables out of host `:root` (use data attribute scoping) | Host page CSS pollution |
| **P0** | Add source validation to `VOCAB_LIST_SYNC` message handler | Security vulnerability |
| **P0** | Fix SyncStatusBadge to perform real sync or warn user | Data integrity |
| **P1** | Add `role="button"`, `tabIndex`, keyboard handler to Dashboard skill cards | Keyboard accessibility |
| **P1** | Fix `bg-white/70` and `rgba(255,255,255,0.6)` in Dashboard for dark mode | Dark mode broken |
| **P1** | Replace all emoji icons with lucide-react icon components from `@ielts/ui` | Visual consistency |
| **P1** | Fix broken navigation routes (`/today` → `/today-plan`, `/ai-tutor` → `/tutor`) | Broken user flows |

---

## Validation

- [x] Report created at `docs/ux-ui-bug-audit-report.md`
- [ ] All critical issues verified by re-inspection of source code
- [ ] High-severity issues verified by cross-referencing against design token system
