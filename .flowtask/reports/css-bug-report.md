# CSS Bug Report

Generated: 2026-07-02

## Scope
- `apps/web/src/styles/` — theme.css, index.css
- `apps/web/src/components/` — all TSX with inline styles
- `apps/web/src/pages/` — all TSX with inline styles
- `apps/web/src/features/` — all TSX with inline styles
- `apps/extension/src/` — popup/index.css, options/index.css, content-script/sharedStyles.ts
- `packages/theme/src/` — cssVariables.css

---

## CRITICAL

### 1. Undefined animation keyframes — animations silently fail

**Files:** `apps/web/src/components/aiTutor/ChatUXEnhancements.tsx`

The component applies the following animation names via inline `style.animation`, but the corresponding `@keyframes` rules are **never defined** anywhere in the codebase:

| Line | Animation |
|------|-----------|
| 119 | `message-in 0.25s ease-out` |
| 174 | `fade-in 0.4s ease-out` |
| 219 | `message-in 0.25s ease-out` |
| 313 | `chat-popup-out ${duration}ms ease-in forwards` |
| 317 | `chat-popup-in ${duration}ms ease-out` |
| 353 | `fade-in 0.3s ease-out` |

The `ChatUXStyles` component (line ~420) only injects keyframes for `tutor-avatar-pulse` and `typing-bounce`. These five animations are missing entirely — components appear instantly without animation; exit animation never plays.

**Fix:** Define `@keyframes message-in`, `@keyframes fade-in`, `@keyframes chat-popup-in`, `@keyframes chat-popup-out` in `ChatUXStyles`.

---

### 2. Missing `aria-controls` on all `aria-expanded` elements

Every element with `aria-expanded` lacks the `aria-controls` attribute that tells screen readers which element the button controls.

| File | Line | Element |
|------|------|---------|
| `pages/Search.tsx` | 404 | Filter toggle button |
| `components/aiTutor/ChatIcon.tsx` | 75 | Chat popup toggle |

**Fix:** Add `aria-controls="id-of-controlled-element"` to each.

---

## HIGH

### 3. Modal dialog has no max-height / scroll — content can overflow off-screen

**File:** `apps/web/src/components/ui/Modal.tsx:56-72`

The dialog `<div>` uses only `max-w-sm/lg/2xl` width constraints. On small screens or when content is tall (e.g. long feedback forms), content overflows below the viewport and is unreachable. No `max-height` or `overflow-y` is set on the dialog container.

**Fix:** Add `max-h-[85vh] overflow-y-auto` to the dialog `<div>`.

---

### 4. Body scroll lock causes layout shift

**File:** `apps/web/src/components/ui/Modal.tsx:30`

`document.body.style.overflow = 'hidden'` removes the scrollbar, causing the page to shift right by the scrollbar width. The `padding-right` compensation is missing.

**Fix:** Calculate `window.innerWidth - document.documentElement.clientWidth` and apply that as `padding-right` on the body.

---

### 5. `--color-on-danger` CSS variable is undefined

**Files:**
- `components/aiTutor/NotificationCenter.tsx:144,185`
- `components/aiTutor/ChatIcon.tsx:99`

Usage: `color: 'var(--color-on-danger, #fff)'`

The variable `--color-on-danger` is **never defined** in any CSS file. While the fallback `#fff` works currently, if `--color-danger` is ever changed to a light hue (e.g., pastel), text will become invisible (white on light).

**Fix:** Add `--color-on-danger: #ffffff` to both `:root` and `.dark` in `theme.css`.

---

### 6. `z-index: 9999` on floating button overrides all modals/dialogs

**File:** `apps/web/src/components/aiTutor/FloatingTutorButton.tsx:53`

`zIndex: 9999`. Modal uses Tailwind `z-50` (= z-index 50). The floating button renders above all modals, overlays, and dialogs, blocking interaction with them.

**Fix:** Change to `zIndex: 100` or `z-50` equivalent.

---

### 7. `--color-muted` used for interactive navigation — fails WCAG AA contrast

**File:** `apps/web/src/components/Layout.tsx:177`

Mobile bottom nav non-active links use `text-[var(--color-muted)]`. In light mode, `--color-muted: #94a3b8` on `--color-surface: #ffffff` yields a contrast ratio of ~2.9:1, failing WCAG AA (4.5:1 minimum for normal text). Interactive elements require 4.5:1 at AA level.

**Fix:** Use `var(--color-text-secondary)` for interactive nav links.

---

## MEDIUM

### 8. Extension CSS missing theme variables

**Files:**
- `apps/extension/src/popup/index.css`
- `apps/extension/src/options/index.css`

| Missing variable | Present in `theme.css` (web) |
|----------------|------------------------------|
| `--color-info-light` | ✓ defined in web theme |
| `--color-success-light` | ✓ defined in web theme |
| `--color-warning-light` | ✓ defined in web theme |
| `--color-danger-light` | ✓ defined in web theme |
| `--spacing-xs` through `--spacing-xl` | ✓ defined in web theme |
| `--transition-fast` / `--transition-normal` | ✓ defined in web theme |

Additionally, the popup CSS has `--color-shadow` defined in dark mode but not in light mode (inconsistent). Value differences also exist between extension and web theme CSS (duplicated token sets with diverging values).

**Fix:** Align extension theme variables with the source-of-truth `packages/theme/src/cssVariables.css`.

---

### 9. Recharts chart components — hardcoded hex colors, no dark mode adaptation

**Files:**
- `pages/Progress.tsx:13` — `PIE_COLORS` hex array
- `pages/Progress.tsx:198-201` — mastery status hex colors
- `pages/Progress.tsx:394-798` — every `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Bar`, `Line` uses hardcoded `#e2e8f0`, `#94a3b8`, `#3b82f6`, `#22c55e`, `#f59e0b`, `#ef4444`, `#8b5cf6`, `#ec4899`, `#06b6d4`
- `pages/Dashboard.tsx:32` — `PIE_COLORS` hex array
- `pages/Dashboard.tsx:191` — suggestion card `borderLeftColor` uses inline hex conditional
- `pages/Dashboard.tsx:335-346` — chart grid/lines/tooltip all hardcoded hex
- `pages/MockTests.tsx:22-28` — `getSkillColor()` returns hex values
- `features/analytics/Analytics.tsx:46-47,652` — hex constants and chart fill

None of these adapt to dark mode. Grid lines that are visible in light mode may be invisible or cause visual noise in dark mode.

**Fix:** Use CSS variable references or compute colors from theme context. At minimum, apply darker stroke colors in dark mode.

---

### 10. `color-mix()` CSS function — limited browser support (12 locations)

**Files:**
- `components/aiTutor/ProactiveSettings.tsx:108,146`
- `components/aiTutor/NotificationCenter.tsx:174,223,241,251`
- `components/aiTutor/ChatUXEnhancements.tsx:79,351`
- `components/aiTutor/ErrorBoundary.tsx:55`
- `components/aiTutor/ErrorDisplay.tsx:51,74,105`

`color-mix()` is not supported in Safari < 16.2 and Firefox < 110. These backgrounds will fall back to `transparent`, making text unreadable.

**Fix:** Provide a solid fallback color using standard CSS variable or a hardcoded fallback before the `color-mix()` value.

---

### 11. `all: initial` in shared content script styles resets display to inline

**File:** `apps/extension/src/content-script/sharedStyles.ts:60-66`

```css
.ielts-toolbar, .ielts-dict-panel, .ielts-ai-panel, .ielts-toast {
  all: initial;
  font-family: system-ui, -apple-system, sans-serif;
}
```

`all: initial` resets `display` to `inline`, but these are block/flex-level UI components (toolbar, panel, toast). No explicit `display` is set afterward, so they render as inline elements, causing broken layout in the host page.

**Fix:** Add `display: flex` or `display: block` after `all: initial`.

---

### 12. Hardcoded `#ffffff`/`#fff` colors without dark mode fallback

| File | Line | Usage |
|------|------|-------|
| `components/aiTutor/FloatingTutorButton.tsx` | 65-66 | `background: linear-gradient(135deg, #3b82f6, #2563eb)`, `color: '#fff'` |
| `components/aiTutor/FloatingTutorButton.tsx` | 71 | `boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'` |
| `components/aiTutor/FloatingTutorButton.tsx` | 76-77 | Tooltip: `background: '#1e293b'`, `color: '#fff'` (dark theme hardcoded) |
| `components/aiTutor/ChatUXEnhancements.tsx` | 99,242,396 | `color: '#ffffff'` |
| `components/aiTutor/NotificationCenter.tsx` | 277 | `color: '#fff'` |

These do not respond to theme changes. If the user switches light/dark mode, colors remain fixed.

**Fix:** Use CSS custom properties via `var(--color-*)` for all colors.

---

### 13. `bg-white` without `dark:bg-*` fallback on toggle switch

| File | Line | Element |
|------|------|---------|
| `components/ui/ToggleSwitch.tsx` | 34 | Toggle knob: `bg-white` |
| `pages/Settings.tsx` | ~301 | Toggle knob: `bg-white` |

In dark mode these remain white, which is acceptable visually but inconsistent with the rest of the dark-theme UI where surfaces shift to dark grays.

**Fix:** Add `dark:bg-slate-200` or similar.

---

### 14. Review rating buttons — hardcoded colors without dark mode adaptation

| File | Lines | Colors |
|------|-------|--------|
| `features/vocabulary/components/ReviewMode.tsx` | 18-21 | `bg-red-500`, `bg-orange-500`, `bg-blue-500`, `bg-green-500` |
| `pages/VocabularyReview.tsx` | 18-21 | `bg-red-500`, `bg-orange-500`, `bg-blue-500`, `bg-green-500` |

These Tailwind color classes have no `dark:bg-*` override, so they remain bright/high-saturation in dark mode, creating visual noise.

**Fix:** Add `dark:bg-{color}-700` or theme-aware alternatives.

---

## LOW

### 15. `h-screen` uses 100vh — includes mobile browser chrome

**File:** `apps/web/src/components/Layout.tsx:60`

`h-screen` = `100vh`. On iOS Safari, this includes the bottom address bar (~60px), causing the layout to extend below the visible area. The page can scroll unexpectedly or show a gap.

**Fix:** Use `min-h-[100dvh]` (dynamic viewport height) for more reliable mobile behavior.

---

### 16. `transition: all` may cause unnecessary repaints

**File:** `apps/web/src/components/aiTutor/FloatingTutorButton.tsx:72`

`transition: 'all 0.2s ease'` transitions every property. The button only changes `transform` (animation) and `box-shadow`.

**Fix:** Use `transition: 'transform 0.2s ease, box-shadow 0.2s ease'`.

---

### 17. Unitless numeric style values

**Files:**
- `ListeningJournal.tsx:360,381`
- `WritingPractice.tsx:365`
- `ReadingJournal.tsx:352,373`
- `SpeakingPractice.tsx:425`
- `MockTests.tsx:303-306`
- `VocabularyReview.tsx:300-320`

React auto-appends `px` to unitless numbers, so these work correctly. Noted for consistency — some are `height` values that arguably should use `rem` for responsiveness rather than fixed pixels.

**Severity:** Informational — no functional bug.

---

### 18. Duplicate CSS variable declarations across packages

**Files:**
- `packages/theme/src/cssVariables.css` (source of truth)
- `apps/web/src/styles/theme.css` (duplicate)
- Extension CSS files (duplicate with variations)

The `theme.css` duplicates all variables from `cssVariables.css` but the extension CSS files use different color values (e.g., `--color-success: #16a34a` in extension vs `#22c55e` in web). These diverging duplicates are a maintenance liability.

**Fix:** Import or reference a single source of truth; consider consuming `cssVariables.css` directly or generating per-app theme files from the tokens.

---

## Summary

| Priority | Count |
|----------|-------|
| Critical | 2 |
| High | 5 |
| Medium | 7 |
| Low | 4 |
| **Total** | **18** |

## Validation
- File exists: ✓ `.flowtask/reports/css-bug-report.md`
