# IELTS Journey — Inspection Report & Redesign Plan

## 1. Project Overview

| Property | Value |
|----------|-------|
| Framework | Vite + React 19 |
| Routing | React Router DOM v7 (BrowserRouter) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin, no config file) |
| State | React Context + local state + IndexedDB (Dexie) |
| Monorepo | pnpm workspace — `apps/web` + 10 `packages/` |
| Build | pnpm dev:web / build:web |
| Deploy | Cloudflare Pages |

### Key Config Files

| File | Notes |
|------|-------|
| `apps/web/package.json` | React 19, TailwindCSS 4, recharts, react-hook-form, zod, dexie |
| `apps/web/vite.config.ts` | TailwindCSS v4 plugin, PWA plugin, path aliases `@/*` / `@ielts/*` |
| `apps/web/index.html` | Body classes: `bg-white dark:bg-slate-900` |
| `apps/web/vitest.config.ts` | Testing config |

### Package Library (10 packages)

| Package | Purpose |
|---------|---------|
| `@ielts/theme` | Design tokens, ThemeProvider, dark mode, accent color |
| `@ielts/ui` | Shared UI components |
| `@ielts/ai-tutor` | ChatPopup, proactive messages, context suggestions |
| `@ielts/ai` | AI client adapters, prompts, services |
| `@ielts/content` | Built-in content, schemas, search, import/export |
| `@ielts/exercises` | Exercise generation, scoring, review scheduling |
| `@ielts/learning-engine` | Personalization engine, daily planning, weakness detection |
| `@ielts/settings` | Settings types, defaults, bridge, schemas |
| `@ielts/storage` | IndexedDB wrapper (Dexie), migrations, sync, repositories |
| `@ielts/utils` | Shared utilities, error types |

---

## 2. Route Map (25+ Routes)

### Landing (no sidebar)
| Route | Component | File |
|-------|-----------|------|
| `/` | `LandingPage` | `pages/LandingPage.tsx` |

### App Routes (inside AppLayout sidebar)
| Route | Component | File | Priority |
|-------|-----------|------|----------|
| `/onboarding` | `OnboardingForm` | `features/onboarding/OnboardingForm` | High |
| `/dashboard` | `Dashboard` | `features/dashboard/Dashboard.tsx` | **Critical** |
| `/plan` | `StudyPlan` | `features/study-plan/StudyPlan.tsx` | High |
| `/roadmap` | Redirect → `/plan` | — | Medium |
| `/vocabulary` | `Vocabulary` | `features/vocabulary/Vocabulary.tsx` | High |
| `/review` | `VocabularyReview` | `pages/VocabularyReview.tsx` | High |
| `/review-center` | `ReviewCenter` | `pages/ReviewCenter.tsx` | Medium |
| `/reading` | `ReadingPractice` | `features/reading/ReadingPractice.tsx` | Medium |
| `/listening` | `ListeningPractice` | `features/listening/ListeningPractice.tsx` | Medium |
| `/writing` | `WritingPractice` | `features/writing/WritingPractice.tsx` | Medium |
| `/speaking` | `SpeakingPractice` | `features/speaking/SpeakingPractice.tsx` | Medium |
| `/grammar` | `GrammarNotes` | `pages/GrammarNotes.tsx` | Low |
| `/mistakes` | `MistakeNotebook` | `features/mistakes/MistakeNotebook.tsx` | Medium |
| `/mock-tests` | `MockTests` | `pages/MockTests.tsx` | Low |
| `/topics` | `TopicsProgress` | `pages/TopicsProgress.tsx` | Low |
| `/progress` | `Progress` | `pages/Progress.tsx` | High |
| `/progress-review` | `ProgressReviewPage` | `features/progressReview/ProgressReviewPage` | Medium |
| `/artifacts` | `ArtifactsPage` | `features/artifacts/ArtifactsPage` | Medium |
| `/search` | `SearchPage` | `pages/Search.tsx` | Low |
| `/public-api` | `PublicApiImportPage` | `pages/PublicApiImportPage.tsx` | Low |
| `/settings` | `Settings` | `pages/Settings.tsx` | High |
| `/settings/data` | `DataManagement` | `pages/Settings/DataManagement.tsx` | Medium |
| `/import-export` | `ImportExport` | `pages/ImportExport.tsx` | Low |
| `/info` | `PublicTabPage` | `components/PublicTabPage.tsx` | Low |

### Missing Routes (needed per design docs)
| Route | Needed For | Status |
|-------|------------|--------|
| `/tutor` | AI Tutor full page | **Missing** |
| `/practice` | Practice hub | **Missing** |
| `/practice/reading` | Reading hub | **Missing** |
| `/practice/listening` | Listening hub | **Missing** |
| `/practice/writing` | Writing hub | **Missing** |
| `/practice/speaking` | Speaking hub | **Missing** |
| `/practice/grammar` | Grammar hub | **Missing** |
| `/practice/mistakes` | Mistakes hub | **Missing** |
| `/progress/tests` | Tests progress | **Missing** |
| `/progress/topics` | Topics progress | **Missing** |
| `/progress/review` | AI progress review | **Missing** |
| `/saved` | Saved content | **Missing** |
| `/settings/profile` | Profile settings | **Missing** |
| `/settings/ai` | AI settings | **Missing** |
| `/settings/extension` | Extension connection | **Missing** |

---

## 3. Current Layout Architecture

### AppLayout (`components/Layout.tsx`)
- Fixed sidebar `w-64` (desktop, `z-40`) with overlay on mobile
- 18 nav items in sidebar (Dashboard, Study Plan, Vocabulary, Review, Reading, Listening, Writing, Speaking, Grammar, Mistakes, Mock Tests, Topics, Progress, Artifacts, Search, Settings, Backup, Public API, Info)
- Headbar (`h-16`, sticky) with hamburger, AI Tutor button, dark mode toggle
- Mobile bottom nav (5 items: Home, Plan, Vocab, Review, Progress)
- Floating AI Tutor button + ChatIcon rendered in main content area
- Main content: `p-4 sm:p-6 lg:p-8` inside `flex-1 overflow-y-auto`

### Headbar (`components/layout/Headbar.tsx`)
- AI Tutor unread badge with pulse animation
- Online indicator dot
- Dark mode toggle
- Event-based communication (`toggle-ai-tutor-chat` CustomEvent)

### Mobile Bottom Nav (inline in `Layout.tsx`)
- 5 hardcoded items: Home, Plan, Vocab, Review, Progress
- Inline SVG icon paths
- Glass background (`backdrop-filter: blur(8px)`)
- Safe area support (`env(safe-area-inset-bottom)`)

---

## 4. Current Theme & Design Token System

### Token Locations
1. **CSS Custom Properties**: `apps/web/src/styles/theme.css` (220 lines) — light + dark variables
2. **TypeScript tokens**: `packages/theme/src/tokens.ts` (217 lines) — `DesignTokens` + `DARK_TOKENS`
3. **TypeScript types**: `packages/theme/src/types.ts` (149 lines) — interfaces
4. **ThemeProvider**: React context provider wrapping the app

### Current Token Coverage

**Color tokens (existing):** 34 tokens covering:
- Background/surface/primary
- Text (primary, secondary, muted, inverse)
- Border, success, warning, danger, info
- 4 skill colors (Listening, Reading, Writing, Speaking) + light/dark variants
- 4 AI Tutor colors (background, text, border, accent)
- Overlay, skeleton, highlight

**Missing from spec:**
- `color.background.secondary/tertiary` (warm off-white backgrounds)
- `color.surface.cardHover/elevated/sidebar/header/bottomNav`
- `color.surface.skeletonShine` (shimmer highlight)
- `color.text.link/linkHover/brand`
- `color.border.focus/selected/subtle`
- `color.vocabulary.*` (vocabulary-specific colors)
- `color.grammar.*` (grammar-specific colors)
- `color.band.*` (band score colors)
- `color.exam.*` (exam urgency colors)

**Typography:** `font-sans` (system stack), sizes xs (12px) → 4xl (36px), 4 weights, 3 line heights — matches spec

**Spacing:** 3xs (2px) → 3xl (64px) — 9 steps — matches spec

**Radius:** none → full (9999px) — 9 steps — matches spec

**Shadows:** sm → 2xl + inner + colored + tutor — need softer shadows per spec

**Z-index:** 11 layers (dropdown → extension-menu) + highlight — matches spec

**Breakpoints:** sm (640px) → 2xl (1536px) — matches spec

**Animation tokens:** `transition.fast/normal/slow` (150/200/300ms) — **missing keyframes** (shimmer, slideUp, scaleIn, fadeIn)

---

## 5. Current Reusable UI Components

### `/apps/web/src/components/ui/` (19 files)

| Component | Path | Notes |
|-----------|------|-------|
| Button | `Button.tsx` | 5 variants (primary/secondary/danger/ghost/outline), 3 sizes, loading state. Uses CSS vars. **Missing: AI Tutor variant, skill variants** |
| Card | `Card.tsx` | Card, CardHeader, CardTitle, CardContent. **Missing: left-accent, tint variants** |
| Badge | `Badge.tsx` | 6 variants. **Missing: skill/vocabulary/grammar variants** |
| Modal | `Modal.tsx` | Portal rendering, Escape key, scrollbar compensation. **Solid** |
| Input | `Input.tsx` | Standard form input. Basic. |
| Select | `Select.tsx` | Native `<select>`. **Spec needs custom select with search/filter** |
| Textarea | `Textarea.tsx` | Standard textarea. Basic. |
| ToggleSwitch | `ToggleSwitch.tsx` | On/off toggle. Fine. |
| FormField | `FormField.tsx` | Label + error wrapper. Fine. |
| ConfirmDialog | `ConfirmDialog.tsx` | Confirmation overlay. Fine. |
| EmptyState | `EmptyState.tsx` | 4 variants (default/inline/card/illustrated), 11 preset messages. **Strong foundation but needs spec alignment** |
| ErrorBoundary | `ErrorBoundary.tsx` | React error boundary. Solid. |
| ErrorDisplay | `ErrorDisplay.tsx` | 3 variants (inline/card/banner). Solid. |
| LoadingSkeleton | `LoadingSkeleton.tsx` | 5 variants, 6 page-specific skeletons. **Good, needs shimmer direction** |
| LoadingSpinner | `LoadingSpinner.tsx` | Simple spinner. Basic. |
| Pagination | `Pagination.tsx` | Page controls. Fine. |
| PronounceButton | `PronounceButton.tsx` | Text-to-speech. Fine. |
| Toast | `Toast.tsx` | Notifications. **Missing: actions, position variants** |
| DarkModeToggle | `DarkModeToggle.tsx` | Light/dark/system toggle. Fine. |

### New Components Needed (per spec)

| Component | Priority |
|-----------|----------|
| SearchInput | High |
| DatePicker | Medium |
| Tabs | High |
| ProgressBar (skill variants, indeterminate) | High |
| ProgressRing (skill variants, label) | High |
| SkillCard (grammar/vocabulary types) | High |
| StudyTaskCard (polish status visuals) | High |
| AITutorMessageCard (typing, markdown, correction) | High |
| AITutorRecommendationCard | High |
| VocabularyWordCard (selected, swipe) | High |
| VocabularyDetailPanel | High |
| PracticeCard | Medium |
| MistakeCard | Medium |
| ProgressSummaryCard | Medium |
| DashboardSection | High |
| MobileBottomNavigation (glass effect, indicator) | High |
| SettingsSectionCard | Medium |
| ExtensionPopupCard | Low |
| ExtensionActionMenu | Low |
| ExtensionSyncStatusBadge | Low |

---

## 6. Hard-Coded UI Values Found

### Colors (Tailwind classes instead of CSS variables)

| Location | Code | Should Use |
|----------|------|------------|
| Settings.tsx | `text-slate-900`, `bg-slate-100`, `border-slate-300` | CSS variables |
| Settings.tsx | `bg-slate-700 text-white` (badges) | CSS variables |
| Settings.tsx | `border-blue-500`, `bg-blue-50` | CSS variables |
| ReviewCenter.tsx | `border-l-4 border-l-{color}-500` | CSS variables |
| StudyPlan.tsx | `bg-purple-100 text-purple-700` (category colors) | CSS variables |
| StudyPlan.tsx | All 10+ CATEGORY_COLORS using Tailwind | CSS variables |
| AITutorChat.tsx | `bg-purple-50`, `text-purple-600`, `border-purple-200` | CSS variables or theme tokens |
| AITutorChat.tsx | `bg-purple-600 hover:bg-purple-700` (inline button) | Button component |
| AITutorChat.tsx | `bg-purple-100 text-purple-700` (hints) | CSS variables |
| SocraticQuestionCard | `border-2 border-purple-200`, `bg-purple-50/50` | CSS variables |
| DailyPlan.tsx | Likely raw Tailwind colors | Needs audit |

### Spacing & Sizing

| Location | Value | Standard Token |
|----------|-------|----------------|
| Main content padding | `p-4 sm:p-6 lg:p-8` | var(--spacing-md/lg/xl) |
| Card inner padding | `p-4 sm:p-6` | var(--spacing-md/lg) |
| Hero padding | `p-5 sm:p-7` | var(--spacing-lg/xl) |
| Stat icon containers | `h-10 w-10`, `rounded-xl` | var(--spacing-xl), var(--radius-xl) |
| Progress bars | `h-1.5`, `h-2`, `h-2.5`, `h-3` | Should be consistent |
| Badges | `px-2 py-0.5`, `px-2.5 py-0.5`, `px-3 py-1` | Inconsistent |
| Max widths | `max-w-6xl` (Dashboard/StudyPlan/Vocab), `max-w-3xl` (Settings), `max-w-4xl` (ReviewCenter) | Inconsistent |
| Grid gaps | `gap-3`, `gap-4`, `gap-6` | Mixed usage |

### Chard-coded Chart Dimensions
- `h-48` (bar/pie charts)
- `h-8 w-8` (spinner)
- Recharts PIE_COLORS (literal color hex values)

### Duplicated Data

| Data | Locations |
|------|-----------|
| `IELTS_TOPICS` | Vocabulary.tsx (line 17) AND Settings.tsx (line 11) |
| `getTimeBasedGreeting()` | Dashboard.tsx AND AITutorChat.tsx |
| Skill config | Dashboard.tsx (SKILL_CONFIG), StudyPlan.tsx (CATEGORY_COLORS, SKILL_COLORS), CSS variables |
| Day labels | Dashboard.tsx (`DAY_LABELS`), Settings.tsx (`DAYS_OF_WEEK`) |

---

## 7. Stale or Duplicated UI Components

### Potentially Duplicated
- `packages/ui/src/` vs `apps/web/src/components/ui/` — the relationship between these needs clarification. The main components used in pages are from `apps/web/src/components/ui/`.
- `features/studyPlan/` vs `features/study-plan/` — both directories exist
- `features/aiTutor/` vs `features/ai-tutor/` — both directories exist

### Page-Level Wrapper Pages
Some pages are thin re-exports:
- `pages/Dashboard.tsx` → re-exports `features/dashboard/Dashboard`
- `pages/WritingPractice.tsx` → likely re-exports `features/writing/WritingPractice`

### Stale/Redirect Routes
- `/roadmap` just redirects to `/plan`
- `/info#about-website`, `/about-me`, `/recruit`, `/donate`, `/feedback` are hash-based redirects

---

## 8. Design Inconsistencies

1. **Settings page** uses raw Tailwind color classes (`text-slate-900`, `bg-slate-100`, `border-slate-300`) instead of CSS variables used everywhere else
2. **StudyPlan's CATEGORY_COLORS** uses Tailwind utility classes while the rest of the app uses CSS variables
3. **ReviewCenter** uses literal Tailwind classes for text/background colors
4. **AITutorChat** mixes inline `style={{}}` with raw Tailwind classes (e.g., `bg-purple-50`)
5. **Mixed approach overall:** Some components use `style={{}}` with CSS variables, others use Tailwind utility classes, others mix both
6. **Duplicated greeting logic** in Dashboard.tsx and AITutorChat.tsx
7. **No Tabs component** — tab-like navigation is done manually with buttons in each page
8. **No SearchInput component** — search is done with regular Input
9. **No Drawer component** — all overlays use Modal
10. **No ProgressBar component** — progress bars are inline `div`s
11. **No ProgressRing component** — all progress is shown as bars
12. **No consistent page header pattern** — each page handles headers differently
13. **No AI Tutor full-page route** (`/tutor` doesn't exist)

---

## 9. Key Data Flow Observations

- **100% offline-first**: IndexedDB via Dexie for all user data
- **AI configurable**: Provider (OpenAI/Custom), model, API key in localStorage
- **Settings stored**: In localStorage, with IndexedDB fallback
- **Theme mode**: `light` / `dark` / `system` with accent color presets (8 options)
- **No backend**: Entirely client-side PWA
- **Localization**: No i18n framework — Vietnamese text is mixed in via conditionals (`language === 'vietnamese'`)

---

## 10. Implementation Plan

### Phase 0: Foundation — Theme Token Enhancement
**Files to change:**
- `packages/theme/src/types.ts` — extend `DesignTokens` with new categories (surface variants, vocabulary, grammar, band, exam, animation)
- `packages/theme/src/tokens.ts` — add new tokens, refine existing (softer shadows, warm backgrounds)
- `apps/web/src/styles/theme.css` — add new CSS properties, animation keyframes, update dark mode
- `apps/web/src/index.css` or `globals.css` — add keyframe animations

### Phase 1: Component System Redesign
**Files to create/change:**
- Refine existing: Button, Card, Badge, Modal, Toast, LoadingSkeleton, EmptyState, ErrorDisplay
- Create new: SearchInput, Tabs, ProgressBar, ProgressRing, SkillCard, StudyTaskCard, AITutorMessageCard, AITutorRecommendationCard, VocabularyWordCard, VocabularyDetailPanel, PracticeCard, MistakeCard, ProgressSummaryCard, DashboardSection, MobileBottomNavigation, SettingsSectionCard

### Phase 2: Layout & Navigation Redesign
**Files to create/change:**
- `apps/web/src/components/Layout.tsx` — new sidebar with groupings, collapsed state, section headers
- `apps/web/src/components/layout/Headbar.tsx` — search integration, breadcrumbs, AI Tutor visibility
- Create `MobileBottomNavigation.tsx` — glass effect, active indicator, 5 items
- Create `FloatingAITutorButton.tsx` — persistent AI Tutor access
- Add `/tutor` route
- Add `/practice` hub route
- Add `/saved` route
- Restructure `/settings/*` routes

### Phase 3: Landing Page Redesign
**Files to change:**
- `pages/LandingPage.tsx` — full redesign per `landing-page-spec.md`
- Update/add landing section components

### Phase 4: Onboarding Redesign
**Files to change:**
- `features/onboarding/OnboardingForm` — full redesign per `onboarding-spec.md`

### Phase 5: Dashboard Redesign
**Files to change:**
- `features/dashboard/Dashboard.tsx` — full redesign per `dashboard-spec.md`
- Update dashboard hook/service if needed

### Phase 6: Study Plan Redesign
**Files to change:**
- `features/study-plan/StudyPlan.tsx` — Today's Plan view per spec
- Create/update AI Study Plan Generator

### Phase 7: Study Roadmap
**Files to change:**
- `features/roadmap/RoadmapPage.tsx` — redesign per spec

### Phase 8: AI Tutor
**Files to change:**
- `pages/AITutorChat.tsx` — full page redesign per spec; create `/tutor` route
- Update AI Tutor components (ModeSelector, etc.)

### Phase 9: Vocabulary
**Files to change:**
- `features/vocabulary/Vocabulary.tsx` — redesign per `vocabulary-notebook-spec.md`
- `pages/VocabularyReview.tsx` — redesign per `vocabulary-review-spec.md`

### Phase 10: Practice Pages
**Files to change:**
- All practice pages (Reading, Listening, Writing, Speaking, Grammar) — redesign per `practice-pages-spec.md`

### Phase 11: Saved Content / Artifacts
**Files to change:**
- `features/artifacts/ArtifactsPage.tsx` — redesign per `saved-content-spec.md`
- Create `/saved` route

### Phase 12: Mistake Review
**Files to change:**
- `features/mistakes/MistakeNotebook.tsx` — redesign per spec

### Phase 13: Progress Pages
**Files to change:**
- `pages/Progress.tsx` — redesign per `learning-progress-spec.md`
- `features/progressReview/ProgressReviewPage` — redesign per `ai-progress-review-spec.md`

### Phase 14: Settings
**Files to change:**
- `pages/Settings.tsx` — redesign per `settings-spec.md`
- Create `/settings/profile`, `/settings/ai`, `/settings/extension`, etc.

### Phase 15: Extension Connection
**Files to create:**
- New page at `/settings/extension` per `extension-connection-spec.md`

### Phase 16: Empty/Loading/Error States
- Audit every page for proper states per `empty-loading-error-states-spec.md`

### Phase 17: Mobile Responsive Polish
- Audit every page per `responsive-mobile-design-spec.md`

### Phase 18: Accessibility Audit
- Audit per `accessibility-spec.md`

### Phase 19: Dark Mode Verification
- Verify all pages look correct in dark mode

### Validation Commands
```bash
pnpm lint       # Check for code quality issues
pnpm test       # Run tests to avoid regressions
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Current routes | ~25 |
| Routes to add | ~15 |
| Current UI components | 19 |
| Components to refine | 16 |
| New components to create | ~20 |
| Theme tokens to add | ~50+ |
| Files with hardcoded colors | 5+ |
| Duplicated data/patterns | 5+ |
| Estimated redesign phases | 19 |
