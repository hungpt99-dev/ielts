# IELTS Journey — Mobile & PWA Audit Report

**Generated:** 2026-07-08  
**Scope:** Frontend code audit for mobile responsiveness, PWA configuration, and storage persistence.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [PWA Configuration Issues](#2-pwa-configuration-issues)
3. [Viewport & Meta Tag Issues](#3-viewport--meta-tag-issues)
4. [Safe Area Handling Issues](#4-safe-area-handling-issues)
5. [Responsive Layout & App Shell Issues](#5-responsive-layout--app-shell-issues)
6. [Mobile Navigation Issues](#6-mobile-navigation-issues)
7. [Touch Target Sizing Issues](#7-touch-target-sizing-issues)
8. [Page-by-Page Mobile Issues](#8-page-by-page-mobile-issues)
9. [AI Tutor Mobile Issues](#9-ai-tutor-mobile-issues)
10. [Storage & Offline Notes](#10-storage--offline-notes)
11. [Accessibility Issues](#11-accessibility-issues)
12. [Extension Popup Issues](#12-extension-popup-issues)
13. [Performance Observations](#13-performance-observations)
14. [Positive Findings](#14-positive-findings)

---

## 1. Executive Summary

IELTS Journey is a React + Vite + Tailwind CSS v4 monorepo with a web app and a browser extension. It has a **solid foundation** for mobile (responsive PageContainer, MobileBottomNavigation, dark mode support, PWA icons), but several **critical gaps** prevent it from being a polished mobile experience:

| Severity | Count | Key Issues |
|----------|-------|------------|
| **Critical** | 3 | Missing iOS PWA meta tags; no `safe-area-inset-*` CSS; no `viewport-fit=cover` |
| **High** | 8 | Touch targets under 44px across many components; inline styles prevent responsive breakpoints; AI Tutor chat max-height on mobile; Settings sidebar forced on desktop only |
| **Medium** | 10 | Horizontal scroll in tabs/pagination; cramped grids on small phones; extension popup fixed width; hash navigation in PWA; localStorage sync reads in render |
| **Low** | 5 | Duplicate CSS variable definitions; `line-clamp-2` truncation on Today Plan cards |

---

## 2. PWA Configuration Issues

### 2.1 Manifest (vite-plugin-pwa)

The PWA manifest is **generated at build time** by `vite-plugin-pwa` in `vite.config.ts`. The config lives in `apps/web/vite.config.ts` (lines 10-46) with a duplicate in `apps/web/src/pwa-config.ts`.

**Issues found:**

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | **Manifest name mismatch**: `name: 'IELTS Journey'` and `short_name: 'IELTS'` — "IELTS" as short_name is too generic and may be confused with the official IELTS brand. Should match the app logo `short_name: 'IELTS Journey'`. | `vite.config.ts:14-15` | Medium |
| 2 | **No `categories` field** in manifest. Not critical but helps app discovery in some contexts. | `vite.config.ts:13-39` | Low |
| 3 | **No `description` alignment**: manifest says `"Personal IELTS study system..."` while `index.html` says `"Learn IELTS with AI Tutor"`. Should be consistent. | `vite.config.ts:16` vs `index.html:8` | Low |
| 4 | **No `screenshots`** for PWA install prompt. Not required but helps on some Android browsers. | `vite.config.ts` | Low |
| 5 | **Maskable icon** uses same `icon-512x512.png` as standard icon — should ideally be a dedicated maskable asset with padding. | `vite.config.ts:37-38` | Medium |

### 2.2 iOS Meta Tags (Missing)

**Critical:** The `index.html` is missing all iOS-specific PWA meta tags:

| # | Missing Tag | Purpose | Severity |
|---|-------------|---------|----------|
| 6 | `<meta name="apple-mobile-web-app-capable" content="yes">` | Enables standalone mode on iOS Safari | **Critical** |
| 7 | `<meta name="apple-mobile-web-app-title" content="IELTS Journey">` | Sets the app title on iOS home screen | **Critical** |
| 8 | `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` | Controls status bar appearance on iOS | **Critical** |

### 2.3 Viewport Meta Tag (Incomplete)

| # | Issue | Severity |
|---|-------|----------|
| 9 | `<meta name="viewport" content="width=device-width, initial-scale=1.0">` — **missing `viewport-fit=cover`** which is required for iPhone X+ safe area rendering. Should be: `width=device-width, initial-scale=1.0, viewport-fit=cover` | **Critical** |
| 10 | No `minimum-scale=1.0` or `maximum-scale=5.0` — not blocking, but recommended to prevent accidental pinch-zoom on some mobile browsers. | Low |

### 2.4 Theme Color

| # | Issue | Severity |
|---|-------|----------|
| 11 | `theme-color` meta is `#1e293b` (slate-800), manifest also `#1e293b`. This is the *dark* background color. For light mode the color should match the light background (`#f8fafc`). Consider using a media query: `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f8fafc">` and `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a">` | Medium |

**Affected file:** `apps/web/index.html:7`

### 2.5 Service Worker

| # | Finding | Severity |
|---|---------|----------|
| 12 | Service worker **is registered** via `registerSW()` from `virtual:pwa-register` in `main.tsx:9-13` with `onOfflineReady` callback. Generated at build time by `vite-plugin-pwa` with Workbox precaching. **Good.** | OK |
| 13 | No runtime caching configured (`runtimeCaching: []` in vite.config.ts). Since all dynamic data comes from IndexedDB, this is **correct** — no stale cache issues. | OK |

**Affected files:** `apps/web/src/main.tsx`, `apps/web/vite.config.ts`

---

## 3. Viewport & Meta Tag Issues

### 3.1 Root HTML (`apps/web/index.html`)

| # | Issue | Severity |
|---|-------|----------|
| 14 | No `lang` attribute on `<html>` tag (line 2). Should be `<html lang="en">` — wait, it **is** `lang="en"`. OK. | - |
| 15 | Body uses `bg-white dark:bg-slate-900` — these are Tailwind v3-style colors, but the project uses Tailwind v4 with CSS custom properties. This should use `var(--color-background)` for consistency. | Low |
| 16 | No loading state for initial app render. The `<div id="root"></div>` is empty until JS loads — no splash/loading screen for PWA. | Low |

**Overall viewport:** Fixed via missing `viewport-fit=cover` (see #9 above).

---

## 4. Safe Area Handling Issues

**Critical finding: No `env(safe-area-inset-*)` usage anywhere in the codebase** (except `MobileBottomNavigation.tsx` which uses `padding-bottom: env(safe-area-inset-bottom, 0px)`).

| # | Location | Missing | Severity |
|---|----------|---------|----------|
| 17 | **AppLayout** (`Layout.tsx:232-468`): Main container uses `h-[100dvh] overflow-hidden` but no top safe area padding. On iPhone X+, content behind notch. | **Critical** |
| 18 | **Headbar** (`Headbar.tsx:22`): `position: sticky; top: 0` — no `padding-top: env(safe-area-inset-top)`. On iPhone X+, header overlaps notch. | **Critical** |
| 19 | **MobileBottomNavigation** (`MobileBottomNavigation.tsx:34`): **HAS** `padding-bottom: env(safe-area-inset-bottom, 0px)` — **this is the only component in the entire app that handles safe areas.** | Already done ✅ |
| 20 | **Settings sidebar** (`Settings.tsx:478`): `position: sticky; top: var(--spacing-md)` — no safe area top padding. | Medium |
| 21 | **OnboardingLayout** (`OnboardingLayout.tsx:28`): Sticky header with no safe area top padding. | **Critical** |
| 22 | **OnboardingLayout** (`OnboardingLayout.tsx:121`): Footer with no safe area bottom padding. | **Critical** |
| 23 | **Modal** (`packages/ui/src/components/Modal.tsx`): Close button at top may overlap notch. | Medium |
| 24 | **Drawer** (`packages/ui/src/components/Drawer.tsx`): Header may overlap notch. | Medium |
| 25 | **ChatIcon (Floating AI button)** (`ChatIcon.tsx:72`): Uses `bottom-20 lg:bottom-6` — this accounts for bottom navigation on mobile but no safe area. | Medium |

**Recommendation:** Add a global safe area utility class or CSS that applies `env(safe-area-inset-*)` to sticky/fixed elements.

---

## 5. Responsive Layout & App Shell Issues

### 5.1 App Shell (`Layout.tsx`)

| # | Issue | Severity |
|---|-------|----------|
| 26 | Desktop sidebar is `w-72` (288px) on all screens, hidden on mobile via `-translate-x-full`/`translate-x-0`. The `lg:static lg:translate-x-0` pattern is correct. | OK |
| 27 | Main content uses `pb-20 lg:pb-0` for bottom nav padding. This is the **only** safe area for bottom nav. On iPhone with home indicator, content may still scroll behind bottom nav area. | Medium |
| 28 | ChatIcon is rendered outside the PageContainer wrapper (line 459-461) — this is correct for a floating element. | OK |

### 5.2 PageContainer Component

| # | Issue | Severity |
|---|-------|----------|
| 29 | `PageContainer` uses `max-w-7xl` (1280px) for `wide`, `max-w-5xl` (1024px) for `standard`, etc. Responsive via `px-4 sm:px-6 lg:px-8`. Good foundation. | OK |
| 30 | **Settings page ignores PageContainer** — uses inline `maxWidth: '1280px'` directly (line 439). Should use `<PageContainer width="wide">` for consistency. | Medium |

### 5.3 Global CSS Issues

| # | Issue | File | Severity |
|---|-------|------|----------|
| 31 | `index.css` re-maps CSS variables via `@theme` block — this is the correct Tailwind v4 approach. Variables are defined in `theme.css` and re-exposed. | OK |
| 32 | No `overflow-x: hidden` on `body` or `html` — which is **good** (hiding overflow would mask real layout bugs). | OK |
| 33 | Duplicate CSS variable definitions: `styles/theme.css` and `@ielts/theme/src/cssVariables.css` contain identical variable sets. This is a maintenance concern — changes must be made in both places. | Low |

### 5.4 Inline Styles Issue

| # | Issue | Severity |
|---|-------|----------|
| 34 | **Extensive inline styles used across most components.** Inline styles cannot use CSS media queries, so responsive breakpoints must be handled via Tailwind classes or CSS modules. Components heavily affected: Settings, AITutorChat, OnboardingFlow steps, NotebookPage, StudyPlan (partially), Dashboard. | **High** |

**Recommendation:** Migrate to Tailwind responsive utilities (`sm:`, `md:`, `lg:`) for layout. Keep inline styles only for dynamic values (colors, widths).

---

## 6. Mobile Navigation Issues

| # | Issue | Severity |
|---|-------|----------|
| 35 | **MobileBottomNavigation uses `window.location.href`** (Layout.tsx:197-226 lines) for navigation instead of `react-router-dom`'s `navigate()`. This causes full page reloads and breaks PWA navigation performance. Should use `useNavigate()` hook. | **High** |
| 36 | **No active route indicator on initial load** — MobileBottomNavigation determines `active` state by checking `location.pathname`, which is correct. However, this happens on every render, not memoized. | Low |
| 37 | **Hamburger menu button** (`Headbar.tsx:27`): shown only on `lg:hidden` — correct. 40x40px touch target — adequate but under 44px recommendation. | Medium |
| 38 | **Sidebar** (`Layout.tsx:245`): Overlay is `z-30`, sidebar is `z-40`. Correct stacking. | OK |
| 39 | **No swipe-to-close** on sidebar drawer. Desktop-like sidebar with close button only — no touch gesture. | Medium |
| 40 | **Bottom nav items use `maxWidth: '96px'`** (MobileBottomNavigation.tsx:68). On phones under 375px width, 5 items at 96px each = 480px. This **will cause horizontal overflow** because the nav uses `justifyContent: 'space-around'` with `flex: 1` on each item but also `maxWidth: 96px`. On a 320px-wide phone, items will be 64px each (320/5) — the `maxWidth` won't be reached. **Actually this should work fine** since flex items shrink below max-width. But `minWidth: '56px'` means each item is at least 56px, so 5 items = minimum 280px. Should fit even on 320px. | Low |

---

## 7. Touch Target Sizing Issues

Minimum recommended touch target: **44px × 44px** (Apple HIG, Material Design).

| # | Component | Element | Actual Size | Severity |
|---|-----------|---------|-------------|----------|
| 41 | Headbar close button | `<button>` (Layout.tsx:264) | `p-2` ≈ 32px | Medium |
| 42 | OnboardingLayout back button | `<button>` (OnboardingLayout.tsx:50) | 36×36px | Medium |
| 43 | Modal close button | `<button>` (Modal.tsx:155) | `var(--spacing-xl)` = 32px | High |
| 44 | Drawer close button | `<button>` (Drawer.tsx:244) | `var(--spacing-xl)` = 32px | High |
| 45 | SearchInput clear button | `<button>` (SearchInput.tsx:107) | `var(--spacing-lg)` = 24px | High |
| 46 | NotebookPage pagination prev/next | `<button>` (NotebookPage.tsx:630) | `minWidth: 32px` | High |
| 47 | StudyPlan task checkbox | `<button>` (StudyPlan.tsx:470) | `h-5 w-5` = 20px | High |
| 48 | StudyPlan calendar checkbox | `<button>` (StudyPlan.tsx:653) | `h-6 w-6` = 24px | High |
| 49 | LearningPreferencesStep language options | `<button>` | `minHeight: 36px` | Medium |
| 50 | TodayPlan task complete button | `<button>` (TodayPlanPage.tsx:627) | `h-5 w-5` = 20px | High |
| 51 | TodayPlan week day circles | `<div>` (TodayPlanPage.tsx:812) | `h-7 w-7` = 28px | Medium |
| 52 | Setting color swatches | `<button>` (Settings.tsx:972) | 36×36px | Medium |
| 53 | AI Tutor action chips (quick actions) | `<button>` (AITutorChat.tsx:2575) | `px-3 py-1.5` — text size 11px | Medium |
| 54 | Sidebar NavLinkItem | `<a>` (Layout.tsx:104) | `min-h-[44px]` — **correct** ✅ | OK |

---

## 8. Page-by-Page Mobile Issues

### 8.1 Onboarding

| # | Issue | Severity |
|---|-------|----------|
| 55 | OnboardingLayout uses `maxWidth: '520px'` — good for mobile. But the content area has no `min-height` adjustment for varying step content. | Low |
| 56 | Progress dots at top: active dot is 32px wide, inactive 10px. 9 steps fit within 520px max = 10 + 8×12 (gap) + 10 + ... + 32 = ~200px. **Fine on all mobile sizes.** | OK |
| 57 | Welcome step uses `maxWidth: 400px` — fine. | OK |
| 58 | **No keyboard-avoiding behavior** — when a text input is focused on mobile, the virtual keyboard may cover the input or the Next/Finish button. | **High** |
| 59 | **No safe area handling** on sticky header and footer (see #21-22). | **Critical** |

### 8.2 Dashboard

| # | Issue | Severity |
|---|-------|----------|
| 60 | Dashboard uses `PageContainer width="wide"` via Layout.tsx — correct. | OK |
| 61 | SkillCard grid uses responsive Tailwind classes? Need to verify the actual component. | Medium (needs verification) |

### 8.3 Today Plan

| # | Issue | Severity |
|---|-------|----------|
| 62 | Task cards use `grid gap-3 sm:grid-cols-2` — 1 column on mobile, 2 on tablet+. **Good.** | OK |
| 63 | Task descriptions use `line-clamp-2 sm:line-clamp-none` — truncates on mobile, full on larger screens. This is acceptable but some users may miss content. | Low |
| 64 | Week strip uses `overflow-x-auto` with `shrink-0` on day circles — allows horizontal scroll. Good for mobile. | OK |
| 65 | Pre-header gradient section uses `p-5 sm:p-6 lg:p-7` — responsive padding. | OK |
| 66 | Task complete button is `h-5 w-5` = 20px (see #50). | High |

### 8.4 AI Tutor Chat (see Section 9)

### 8.5 Vocabulary Notebook

| # | Issue | Severity |
|---|-------|----------|
| 67 | Stat cards grid uses `gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))'` — on 320px phone, you get 3 cramped columns. On 414px+, 4 columns. Labels like "Due for Review" wrap to 2 lines. | Medium |
| 68 | Tabs bar uses `overflow-x-auto` with `flex-nowrap` — horizontal scroll for tabs. Common mobile pattern, but the filter button may be partially hidden. | Medium |
| 69 | Pagination buttons are 32px minimum (see #46). | High |
| 70 | Quick-rate buttons (difficulty) have small touch targets. | High |
| 71 | Word family dropdown — inline style `width: '100%'` pattern in child components? Need to check `WordFamilyDisplay`. | Medium |

### 8.6 Settings

| # | Issue | Severity |
|---|-------|----------|
| 72 | Settings ignores PageContainer — uses `maxWidth: '1280px'` inline (line 439). Should use PageContainer. | Medium |
| 73 | Settings sidebar (`w-220px`) is hidden on mobile via `max-lg:hidden` (line 476). Good. | OK |
| 74 | Mobile tabs use `overflow-x-auto` with `minWidth: 'max-content'` (line 538) — requires horizontal scrolling to see all 8 sections. | Medium |
| 75 | Input fields and selects full width — correct for mobile. | OK |
| 76 | AI Provider API key field uses `type="password"` — good. Full width on mobile. | OK |
| 77 | Study schedule day buttons use `minWidth: 44px` (line 913) — **correct touch target** ✅ | OK |
| 78 | Color swatches are 36×36px (see #52). | Medium |

### 8.7 Progress

| # | Issue | Severity |
|---|-------|----------|
| 79 | Uses `PageContainer width="wide"` with `pt-4 sm:pt-6` — responsive. | OK |
| 80 | ProgressTracker component — need to check internal layouts. | Unknown |

### 8.8 Practice Pages (Reading, Listening, Writing, Speaking)

| # | Issue | Severity |
|---|-------|----------|
| 81 | Practice pages wrapped in `PageContainer` via Layout.tsx. Individual page layout not audited in detail. | Unknown |

### 8.9 Study Plan / Roadmap

| # | Issue | Severity |
|---|-------|----------|
| 82 | StudyPlan tab bar uses `flex: 1` with `hidden sm:inline` for labels (line 289) — responsive. | OK |
| 83 | Stat cards use `grid-cols-2 sm:grid-cols-4` (line 306) — 2 on mobile, 4 on desktop. Good. | OK |
| 84 | Calendar view uses `overflow-x-auto` with negative margins (line 512) — can cause layout shifts. | Medium |
| 85 | Week view cards use `grid-cols-1 sm:grid-cols-3` (line 596) — good. | OK |
| 86 | Phase section expand/collapse — full-width clickable area. Good. | OK |

---

## 9. AI Tutor Mobile Issues

The AI Tutor chat page (`AITutorChat.tsx`, 3032 lines) is the most complex page and has the most mobile concerns.

| # | Issue | Severity |
|---|-------|----------|
| 87 | **Chat container uses `max-h-[60vh]`** (line 2145) — on a mobile phone, 60vh leaves 40vh for header, mode selector, quick actions, and input. With Headbar (~64px) + PageHeader (~80px) + ModeSelector (~48px) + action chips (~60px) + input/composer (~60px + bottom nav ~72px) = ~384px. On an iPhone SE (667vh), 60vh = 400px. This leaves ~283px for all the above elements, which **may push the chat container below the fold**, requiring scrolling to reach messages. | **High** |
| 88 | **Chat container `min-h-[200px]`** (line 2145) — acceptable for loading/empty state. | OK |
| 89 | **Message bubbles have `max-w-[85%] sm:max-w-[75%]`** (line 2338) — 85% is generous on mobile. Good. | OK |
| 90 | **Message text uses `whitespace-pre-wrap break-words`** (line 2349) — good for long words/URLs. | OK |
| 91 | **Composer input area** (lines 2642-2696): 52px height, flexible, uses Enter to send. The Enter hint (`right-3 text-[10px]`) may overlap with long input text on small screens. | Medium |
| 92 | **VoiceButton and TtsToggle** consume space in the composer row. On very small screens (<360px), the composer + 3 buttons may be cramped. | Medium |
| 93 | **Floating ChatIcon** (ChatIcon.tsx:72): `bottom-20 lg:bottom-6` — correctly positioned above bottom nav on mobile. 56×56px. Good touch target. | OK |
| 94 | **ChatIcon has `opacity: isOpen ? 0 : 1` with `pointerEvents: 'none'`** (lines 76-77) — hidden when popup is open. | OK |
| 95 | **AITutorPopup** — no audit of its internal mobile layout. | Unknown |
| 96 | **ModeSelector** — suggested prompt chips may overflow on mobile. | Medium |
| 97 | **Proactive suggestions** card uses `rounded-2xl p-4` — responsive. | OK |
| 98 | **Memory panel modal** uses `w-[480px]` — this is a fixed width! On mobile <480px, it will overflow horizontally. Should use `max-width: 480px; width: calc(100vw - 32px)` or similar. | **High** |
| 99 | **No keyboard-avoiding behavior** — when user focuses the textarea on mobile, the keyboard may cover the send button or part of the chat history. | **High** |
| 100 | **`VoiceResponseSpeaker`** and `RecordingIndicator` render null — no layout impact. | OK |
| 101 | **Quick actions** (`flex-wrap gap-1.5` at line 2569) — 8 action chips will wrap to multiple rows on mobile. At 8×~100px each, that's 4 rows of 2 on a 375px screen. This is a lot of vertical space. | Medium |
| 102 | **Socratic question card** (`SocraticQuestionCard.tsx`) — uses full width `w-full` on textarea (line 549) — good. | OK |
| 103 | **Teaching mode, speaking partner, writing tutor cards** use `px-1 py-2` spacing — should be fine. | OK |

---

## 10. Storage & Offline Notes

### 10.1 IndexedDB (Dexie)

| # | Finding | Severity |
|---|---------|----------|
| 104 | **Primary storage**: IndexedDB via Dexie (`@ielts/storage`). Well-structured with `AppDatabase` class, migrations, and typed schema (`IDatabase` interface). | ✅ Good |
| 105 | **34 tables** defined — covers vocabulary, tasks, sessions, mistakes, mock tests, etc. Comprehensive. | ✅ Good |
| 106 | All data is local-first — no backend dependency. | ✅ Good |
| 107 | `safeDb()` wrapper auto-reopens closed database connection. | ✅ Good |

### 10.2 localStorage

| # | Finding | Severity |
|---|---------|----------|
| 108 | **Settings** stored in `localStorage` via `SettingsStorage.ts` — keys prefixed `ielts-`. Safe and minimal. | ✅ Good |
| 109 | **AI Tutor state** (`ai-tutor-chat-state`) stored in localStorage (ChatIcon.tsx:11). Fine for transient UI state. | ✅ Good |
| 110 | **Onboarding profile** stored in localStorage via `OnboardingRepository`. Should persist across refreshes. | ✅ Good |
| 111 | **Saved items** stored in `localStorage.getItem('savedItems')` (AITutorChat.tsx:1851) — raw JSON parse in an event handler. This is synchronous and could be slow with large datasets. Consider IndexedDB for larger data. | Medium |
| 112 | **Daily check-in** (`tutor-friend-checkin`) stored in localStorage — appropriate for simple flags. | ✅ Good |
| 113 | **Progress snapshot** cached in localStorage (`Progress.tsx`) — appropriate. | ✅ Good |

### 10.3 Offline Behavior

| # | Issue | Severity |
|---|-------|----------|
| 114 | Service worker precaches app shell (HTML, JS, CSS) via Workbox. Offline-ready after first load. | ✅ Good |
| 115 | No runtime caching — correct since all data is from IndexedDB. | ✅ Good |
| 116 | No explicit offline fallback UI or "you're offline" banner. The app should show a subtle indicator when offline. | Low (nice-to-have) |
| 117 | AI API calls will naturally fail when offline. The error state in AI Tutor handles this gracefully (shows error banner with dismiss). | ✅ Good |

---

## 11. Accessibility Issues

| # | Issue | Severity |
|---|-------|----------|
| 118 | Many icon-only buttons have `aria-label` — good. But some may be missing (e.g., dark mode toggle). | Medium |
| 119 | Focus-visible styles defined globally in `theme.css:289-292`. | ✅ Good |
| 120 | Color contrast: The `--color-muted` (#94a3b8) on `--color-background` (#f8fafc) has ~2.4:1 contrast ratio — **fails WCAG AA** for small text. | High |
| 121 | Touch targets under 44px (see Section 7) fail WCAG 2.5.5 Target Size. | High |
| 122 | `prefers-reduced-motion` — not checked. Animations in theme.css may need `@media (prefers-reduced-motion: reduce)` fallback. | Medium |
| 123 | Form inputs have labels in many cases, but some rely on `placeholder` as the only label (Input component). | Medium |

---

## 12. Extension Popup Issues

| # | Issue | Severity |
|---|-------|----------|
| 124 | Extension popup uses `--ext-width: 520px` (extension CSS). This is acceptable for extension popups since Chrome caps popup width. | OK (extension) |
| 125 | Extension manifest v3 — good. | ✅ Good |
| 126 | Extension uses IndexedDB (native API, not Dexie) with separate stores for vocabulary, articles, videos, mistakes. Isolated from web app storage but has sync bridge. | ✅ Good |
| 127 | Extension popup `popup.html` has viewport meta and CSP — good. | ✅ Good |
| 128 | Extension popup is not designed for mobile (Chrome extensions don't run on mobile). No changes needed. | N/A |

---

## 13. Performance Observations

| # | Issue | Severity |
|---|-------|----------|
| 129 | AI Tutor Chat page (3032 lines) is a **single massive component**. This will cause unnecessary re-renders. The `sendMessage` callback (line 1046) has 30+ dependencies in `useCallback`. On every message send, many sub-components re-render. On mobile, this could cause UI jank. | **High** |
| 130 | LocalStorage reads in render (`ChatIcon.tsx:34` initial state from localStorage) — blocks the main thread. Minimal impact for small data. | Low |
| 131 | Vite build has manual chunk splitting (`vite.config.ts:60-64`) — React, charts, UI, and AI libs are split. Good. | ✅ Good |
| 132 | No virtualization for long lists (vocabulary, messages). Vocabulary with 1000+ words may cause slow rendering. | Medium |
| 133 | `recharts` (charts library) bundled separately — good for code splitting. | ✅ Good |

---

## 14. Positive Findings

Despite the issues listed above, IELTS Journey has several **strong foundations** for mobile:

1. **MobileBottomNavigation** — well-built, with safe area padding, touch scaling feedback, and badge support.
2. **PageContainer component** — responsive wrapper with breakpoint-aware padding.
3. **PWA setup** — vite-plugin-pwa with Workbox, auto-update registration, offline-ready callback.
4. **App icons exist** — 192x192, 512x512 (with maskable), apple-touch-icon, favicon.
5. **Dark mode** — fully implemented via CSS custom properties and `.dark` class.
6. **100dvh** used for app shell height — correct for mobile browsers.
7. **Safe `h-[100dvh]`** in Layout.tsx — avoids 100vh issues on mobile Safari.
8. **`-webkit-text-size-adjust: 100%`** in theme.css — prevents auto-zoom on orientation change.
9. **`antialiased`** on body — good for text rendering.
10. **`selection`** styling — consistent branding.
11. **`focus-visible`** outline — good for keyboard navigation.
12. **Toast, Modal, Drawer components** with proper scroll locking, focus trapping.
13. **Drag-to-dismiss** on Drawer — excellent mobile pattern.
14. **Local-first architecture** — no backend dependency, IndexedDB as primary store.
15. **Extension bridge** — web app and extension sync settings via `postMessage`.
16. **Tailwind v4** with CSS custom properties theme — modern, maintainable.

---

## Appendix A: Files Referenced

| File | Role |
|------|------|
| `apps/web/index.html` | Root HTML, meta tags, PWA manifest link |
| `apps/web/vite.config.ts` | Vite config including VitePWA plugin |
| `apps/web/src/pwa-config.ts` | PWA config docs (stale, kept for reference) |
| `apps/web/src/main.tsx` | App entry, SW registration |
| `apps/web/src/app/App.tsx` | Router, providers |
| `apps/web/src/components/Layout.tsx` | App shell, sidebar, bottom nav, routing |
| `apps/web/src/components/layout/Headbar.tsx` | Top navigation bar |
| `apps/web/src/components/layout/PageContainer.tsx` | Responsive page wrapper |
| `apps/web/src/components/layout/PageHeader.tsx` | Page title/header component |
| `apps/web/src/components/layout/PageSection.tsx` | Section wrapper |
| `apps/web/src/components/aiTutor/ChatIcon.tsx` | Floating AI tutor button |
| `apps/web/src/index.css` | Tailwind v4 theme mappings |
| `apps/web/src/styles/theme.css` | CSS custom properties (theme tokens) |
| `packages/theme/src/cssVariables.css` | Duplicate theme tokens |
| `packages/ui/src/components/MobileBottomNavigation.tsx` | Bottom nav bar |
| `packages/ui/src/components/Modal.tsx` | Modal dialog |
| `packages/ui/src/components/Drawer.tsx` | Slide-in drawer panel |
| `packages/ui/src/components/SearchInput.tsx` | Search input |
| `packages/storage/src/db.ts` | IndexedDB database class |
| `apps/web/src/features/onboarding/components/OnboardingLayout.tsx` | Onboarding shell |
| `apps/web/src/features/onboarding/OnboardingFlow.tsx` | Onboarding step controller |
| `apps/web/src/pages/AITutorChat.tsx` | AI Tutor page (3032 lines) |
| `apps/web/src/pages/TodayPlanPage.tsx` | Today Plan page |
| `apps/web/src/pages/Settings.tsx` | Settings page |
| `apps/web/src/pages/Progress.tsx` | Progress page |
| `apps/web/src/pages/vocabulary/NotebookPage.tsx` | Vocabulary notebook |
| `apps/web/src/features/dashboard/Dashboard.tsx` | Dashboard feature |
| `apps/web/src/features/study-plan/StudyPlan.tsx` | Study Plan feature |
| `apps/web/src/services/storage/SettingsStorage.ts` | localStorage settings bridge |
| `apps/extension/manifest.json` | Extension manifest |
| `apps/extension/popup.html` | Extension popup |
| `dist/manifest.webmanifest` | Built PWA manifest |
| `public/icons/icon-192x192.png` | PWA icon |
| `public/icons/icon-512x512.png` | PWA icon |
| `public/apple-touch-icon.png` | iOS icon |

---

## Appendix B: Issue Count Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| PWA Configuration | 3 | 0 | 3 | 2 | 8 |
| Viewport & Meta Tags | 1 | 0 | 0 | 1 | 2 |
| Safe Area Handling | 3 | 0 | 3 | 0 | 6 |
| Responsive Layout | 0 | 1 | 3 | 1 | 5 |
| Mobile Navigation | 0 | 1 | 2 | 1 | 4 |
| Touch Targets | 0 | 6 | 4 | 0 | 10 |
| Page-by-Page Issues | 1 | 3 | 8 | 1 | 13 |
| AI Tutor Issues | 0 | 3 | 4 | 0 | 7 |
| Storage & Offline | 0 | 0 | 1 | 0 | 1 |
| Accessibility | 0 | 2 | 3 | 0 | 5 |
| Extension | 0 | 0 | 0 | 0 | 0 |
| Performance | 0 | 1 | 1 | 1 | 3 |
| **Total** | **8** | **17** | **32** | **7** | **64** |

## Appendix C: Top 10 Priority Fixes

1. **Add iOS PWA meta tags** (apple-mobile-web-app-capable, apple-mobile-web-app-title, apple-mobile-web-app-status-bar-style) to `index.html`
2. **Add `viewport-fit=cover`** to viewport meta tag
3. **Apply `env(safe-area-inset-*)`** to sticky headers (Headbar, OnboardingLayout, AppLayout)
4. **Apply `env(safe-area-inset-*)`** to fixed bottom elements (MobileBottomNavigation already done, need Modal, Drawer, ChatIcon)
5. **Replace `window.location.href`** in MobileBottomNavigation with `useNavigate()`
6. **Fix AI Tutor memory modal fixed width** — use responsive max-width
7. **Fix AI Tutor chat `max-h-[60vh]`** — use `flex-1` with proper container sizing
8. **Increase undersized touch targets** (search clear: 24px, checkboxes: 20px, pagination: 32px, modals: 32px)
9. **Add keyboard-avoiding behavior** for AI Tutor and Onboarding inputs
10. **Add `theme-color` media query variants** for light/dark mode
