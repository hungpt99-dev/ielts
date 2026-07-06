# Icon Audit Report

> Generated: 2026-07-06
> Project: IELTS Journey (`@ielts/journey`)

---

## Executive Summary

**No icon library is installed in this project.** Zero icon-related packages are declared in any `package.json`, resolved in `pnpm-lock.yaml`, or imported in any source file across the entire monorepo (13 packages, 2 apps).

The project uses **three ad-hoc icon strategies** with no abstraction layer, no shared components, and no consistent style:

| Strategy | Instances | Files | Quality |
|----------|-----------|-------|---------|
| Unicode emoji | ~250+ | ~60+ | Poor — OS-dependent rendering, no styling control |
| Inline SVGs (Heroicons-style) | ~100+ | ~30+ | Duplicated path data, no reuse, inconsistent stroke weights |
| Raw Unicode symbols | ~80+ | ~35+ | Invisible to screen readers, no styling |

---

## 1. Overall Findings

### 1.1 Icon Libraries Searched (none found)

Searched all `package.json` files + `pnpm-lock.yaml` for:
`lucide-react`, `phosphor-react`, `react-icons`, `@heroicons/react`, `heroicons`, `feather-icons`, `@radix-ui/react-icons`, `radix-icons`, `tabler-icons-react`, `@tabler/icons-react`, `font-awesome`, `@fortawesome/*`, `@mui/icons-material`, `material-ui/icons`, `iconsax-react`, `iconoir-react`, `css.gg`, `boxicons`, `bootstrap-icons`, `unicons`, `@styled-icons/*`, `remixicon`, `react-fontawesome`, `@mdi/react`, `react-ion-icons`, `react-open-icons`

Result: **Zero matches.**

### 1.2 Source Code Import Search

Searched all `.ts`, `.tsx`, `.js`, `.jsx` files for `import` statements referencing any icon package.

Result: **Zero matches.**

### 1.3 SVG / Image Assets

Only `favicon.svg` files exist in the project. No icon sprites, no icon fonts, no icon PNGs.

The browser extension's `manifest.json` references `icons/icon-{16,48,128}.png` but the directory `apps/extension/icons/` **does not exist** — these files are missing.

---

## 2. Icon Usage by Project Area

### 2.1 Website (`apps/web/src`) — Emoji-Heavy

**Primary icon strategy:** Unicode emoji embedded directly in JSX text and data properties.

#### Data/Configuration Objects Using Emoji as Icon IDs

| File | Emojis Used | Purpose |
|------|-------------|---------|
| `services/ChatContext.ts` | `🧠📚✍️🎯💡⏰📝🔍🎤❓🔊📖🎧📋📈🃏` | AI tutor mode definitions and QuickAction icons |
| `components/aiTutor/ModeSelector.tsx` | `🎓🗣️✍️📚📖📰🎧📅⭐🔍` | Tutor mode selection buttons |
| `features/onboarding/OnboardingForm.tsx` | `📖🎧✍️🗣️📚📝🌟🎯🔍🌍🌐📊📅⏰💪🤖✨` | Skill selection, tutor style, language, step indicators |
| `pages/TodayPlanPage.tsx` | `🎧📖✍️🎤📚🔤🔄🎉` | Study plan skill badges and celebration |
| `pages/Settings.tsx` | `🎯✨📅🎨🔔⚙️💾` | Settings section icons |
| `features/artifacts/ArtifactsPage.tsx` | `📝🤖📖📚✏️📤` | Artifact action buttons |
| `features/progress/ProgressTracker.tsx` | `📖🎧✍️🗣️📝🔤📘✨` | Skill progress section icons |
| `components/aiTutor/ReadingListeningTutor.tsx` | `📝📖❓💬✏️🌍🔍🔤📌🎯` | Reading/listening action buttons |
| `components/aiTutor/WritingTutor.tsx` | `💡📋🎯📝✅✨✍️` | Writing action buttons |
| `pages/roadmap/FullStudyRoadmapPage.tsx` | `🗺️🏆📝📊🔄` | Roadmap empty/error/success states |

#### Inline SVGs in Website

| File | Approx. SVGs | Notes |
|------|-------------|-------|
| `pages/AITutorChat.tsx` | 30+ | Mode buttons, action buttons, save menus |
| `pages/vocabulary/NotebookPage.tsx` | 15 | Edit, delete, favorite, search |
| `pages/DailyPlan.tsx` | 12 | Task actions, empty state |
| `components/Layout.tsx` | 10 | Nav links, accordion chevrons, tutor toggle |
| `pages/landing/FeatureGrid.tsx` | 12 | Landing page feature cards |
| `components/Footer.tsx` | 5 | Social icons (GitHub, Mail, Heart) |
| Various practice pages `pages/practice/*.tsx` | ~2 each | Skill icons |

#### Unicode Symbols in Website

Symbols used: `✓✗→←↑↓▶★●○◉•·×…⚡⟳↻↩`

These are used for:
- Checkmarks and crosses in review/quiz components
- Right arrows for navigation and "learn more" links
- Sort indicators (↑↓) in topic progress tables
- Bullets (•·) in rendered markdown and list items
- Close buttons (×) across modals, drawers, and dismissable cards
- Status indicators (●◐◑★) in vocabulary word cards

---

### 2.2 Extension (`apps/extension/src`) — Emoji-Heavy + Inline SVGs

#### Emoji Mappings in Types and Components

| File | Emojis Used | Purpose |
|------|-------------|---------|
| `types.ts` | `📖💬📝📚📰✍️🎤⚠️` | `CATEGORY_ICONS` mapping for save categories |
| `content-script/selectionPanel.ts` | `📖📝⚠️💡✂️🌐🎯` | Selected text action toolbar |
| `content-script/proactiveMessagePanel.tsx` | `📖⚠️📋🎤✍️📰🎧🎯💪💾💡📊🤔💬✕⏰` | Proactive message category icons |
| `popup/components/ExtensionProactiveMessages.tsx` | `📖⚠️📋🎤✍️📰🎧🎯💪💾💡📊🤔💬🤖▼✓✕⏰` | Extension popup proactive messages |
| `popup/components/PopupDashboard.tsx` | `📖💬📝📚📰✍️🎤⚠️📖📰🔄🤖💾📝☀️🌙🔥📚` | Dashboard quick actions, stat cards, empty state |
| `popup/components/MiniTutor.tsx` | `💡✂️🌐📝📖❓💬🎯🔄🎭✅🌟💪🚀✨🌈🎓⏳👋💾` | AI Tutor mini chat, action buttons, motivational messages |
| `popup/components/VideoHelper.tsx` | `📖📝❓🎤🎬⏳✓` | YouTube video helper tabs and states |
| `content-script/dictionaryPanel.ts` | `📖📥✕⚠️🏷🔊` | Dictionary panel actions |
| `content-script/aiExplain.ts` | `🤖✕🔑⚠️💡` | AI explain panel |
| `AI_EXPLAIN_ICONS` (from `@ielts/ai`) | Unknown (emoji-based) | AI explain tab icons |

#### Inline SVGs in Extension

| File | SVGs | Purpose |
|------|------|---------|
| `popup/components/EmptyState.tsx` | 7 | Different empty state illustrations (inbox, puzzle, lock, book, document, clock, checkmark) |
| `popup/components/PopupDashboard.tsx` | 2 | Lightning bolt (streak), external link (open dashboard) |
| `popup/components/ErrorBoundary.tsx` | 1 | Error alert circle |
| `popup/components/SyncStatusBadge.tsx` | 1 | Refresh/sync icon |
| `popup/components/WordDetails.tsx` | 1 | Speaker/pronunciation |
| `popup/components/SavedWordsView.tsx` | 1 | Speaker/pronunciation |
| `popup/components/VocabularyCollector.tsx` | 1 | Speaker/pronunciation |
| `popup/components/MistakeNotebook.tsx` | 2 | Plus/cross icon, warning info circle |

**Note:** The speaker icon SVG is duplicated across 3 files (WordDetails.tsx, SavedWordsView.tsx, VocabularyCollector.tsx) with identical path data.

#### Unicode Symbols in Extension

Symbols used: `✕✓←→⚠▼·`

- `✕` — Close buttons everywhere (selectionPanel, dictionaryPanel, aiExplain, ChatButton, ExtensionProactiveMessages, ImportExportSection, etc.)
- `←` — Back button labels (~10 files)
- `✓` — Success/confirmation states (~15 files)
- `▼` — Collapse indicator (ExtensionProactiveMessages)
- `·` — Separator (ReviewSession)
- `→` — Link indicator (highlightTooltip)

---

### 2.3 Shared Packages (`packages/`) — Mixed Approaches

#### `packages/ui` — Inline SVGs + Unicode Symbols

**Inline SVGs:**
- `SearchInput.tsx` — Search magnifying glass
- `Select.tsx` — Chevron down
- `Toast.tsx` — SuccessIcon, ErrorIcon, InfoIcon, WarningIcon (4 separate inline SVG components)
- `ExtensionSelectedTextMenu.tsx` — Explain, Simplify, Save Vocabulary, Save Text, Ask AI Tutor (5 inline SVGs)
- `StudyTaskCard.tsx` — PendingIcon, InProgressIcon, CompletedIcon, SkippedIcon (4 inline SVGs)
- `VocabularyDetailPanel.tsx` — Close button, Play/pronounce speaker
- `ProgressRing.tsx` — Circular progress (2 circle elements)
- `DatePicker.tsx` — Chevron down, Previous month, Next month (3 inline SVGs)

**Unicode Symbols:**
- `SearchInput.tsx` — `×` (clear button)
- `Modal.tsx` — `×` (close)
- `Drawer.tsx` — `×` (close)
- `Badge.tsx` — `×` (remove)
- `VocabularyWordCard.tsx` — `▶` (play), `●◐◑★` (review status)
- `PracticeCard.tsx` — `✓` (completed), first letter fallback
- `ProgressSummaryCard.tsx` — `↑↓→` (trends)
- `SkillCard.tsx` — `↑↓→` (trends)
- `MistakeCard.tsx` — `→` (correction arrow)
- `VocabularyDetailPanel.tsx` — `✎` (edit), `✕` (delete)
- `EmptyState.tsx` — `?` (fallback)
- `ErrorState.tsx` — `!` (fallback)

#### `packages/ai-tutor` — Inline SVGs + Emoji

**Inline SVGs:**
- `ChatIcon.tsx` — Chat bubble with 3 dots
- `TutorAvatar.tsx` — Sparkle/star, Microphone
- `ChatBubble.tsx` — Save note (pencil), Copy (clipboard), Thumbs up, Thumbs down, User avatar (person silhouette)
- `ErrorBanner.tsx` — Error circle with `!`, Dismiss (X)
- `ProactiveMessagePreview.tsx` — Snooze (clock), Dismiss (X)
- `ContextSuggestionCard.tsx` — Sparkle, Dismiss (X)
- `NotificationCenter.tsx` — Bell, Close, Bell (empty state), Snooze, Dismiss, Delete (trash)
- `ChatWidget.tsx` — Bell, Clear chat (trash), Close (X), Send (paper plane)

**Emoji in QuickAction objects (`chatHelpers.ts`):**
- `📚` — "Teach me this"
- `🧠` — "Quiz me"
- `🎯` — "Practice now"
- `✍️` — "Generate exercise"
- `💡` — "Explain my mistake"
- `⏰` — "Remind me later"
- `👋` — Welcome message
- `🎯` — Practice response
- `📝` — Correct English response
- `😊` — Fallback response

#### `packages/theme` — Zero Icon Usage

No icon-related code of any kind. Only design tokens (colors, spacing, shadows, typography, border radius).

---

## 3. Inconsistencies and Issues

### 3.1 Emoji Inconsistencies

| Issue | Example |
|-------|---------|
| Same concept, different emoji across files | Reading uses both `📖` (open book) and `📰` (newspaper) |
| Same emoji, different meaning | `📖` = Vocabulary category AND Reading skill AND Explain passage |
| Emoji rendering varies by OS | Apple, Windows, Android, Linux all render emoji differently |
| No fallback for missing emoji | Old browsers/terminals show blank squares |
| Screen reader unfriendly | Emoji are read aloud as their full name (e.g., "open book" instead of a silent icon) |
| Wrong emoji for context | `📰` (newspaper) for reading content that is typically an article or blog post |

### 3.2 Inline SVG Inconsistencies

| Issue | Example |
|-------|---------|
| Duplicated SVG paths | The speaker icon appears with identical path data in 3+ files |
| Inconsistent stroke widths | Some SVGs use `strokeWidth={1.5}`, others `strokeWidth={2}` |
| Inconsistent viewBox | Most use `viewBox="0 0 24 24"`, but some use `viewBox="0 0 20 20"` |
| No shared SVG component | Every icon is copy-pasted inline; no `Icon` wrapper or `icons.ts` file |
| Different icon styles mixed | Some SVGs use Heroicons v1 style, others Heroicons v2 style |
| Hard-coded colors | Some SVGs use `fill="#..."` instead of `fill="currentColor"` or `stroke="currentColor"` |

### 3.3 Unicode Symbol Inconsistencies

| Issue | Example |
|-------|---------|
| Same meaning, different characters | Close buttons use `×`, `✕`, `✖`, or `X` interchangeably |
| Invisible to screen readers | `✓` is read as "check mark" on some platforms, silent on others |
| No `aria-label` | Unicode symbols used without accessible labels |
| Mixed with emoji style checkmarks | `✓` (check mark), `✅` (white heavy check mark emoji), `✔` (heavy check mark) all used |

### 3.4 Missing Extension Icons

- `manifest.json` references `icons/icon-16.png`, `icons/icon-48.png`, `icons/icon-128.png`
- The directory `apps/extension/icons/` **does not exist** in the source tree
- These files need to be created before extension can be published

### 3.5 No Design Token or Theme Integration

- No icon-related design tokens exist in `@ielts/theme`
- No icon component or icon mapping system exists
- No consistent icon sizing — icons are sized by font-size (emoji) or width/height attributes (SVG) with no shared convention
- No consistent icon coloring — emoji inherits text color, SVGs use `currentColor` inconsistently

---

## 4. Components That Accept `icon` Prop (Slot Pattern)

These components accept `icon?: ReactNode` and are ready to receive proper icon components once one is chosen:

| Package | Component | File |
|---------|-----------|------|
| `@ielts/ui` | `Button` | `packages/ui/src/components/Button.tsx` |
| `@ielts/ui` | `Input` | `packages/ui/src/components/Input.tsx` |
| `@ielts/ui` | `Select` | `packages/ui/src/components/Select.tsx` |
| `@ielts/ui` | `Badge` | `packages/ui/src/components/Badge.tsx` |
| `@ielts/ui` | `EmptyState` | `packages/ui/src/components/EmptyState.tsx` |
| `@ielts/ui` | `ErrorState` | `packages/ui/src/components/ErrorState.tsx` |
| `@ielts/ui` | `PracticeCard` | `packages/ui/src/components/PracticeCard.tsx` |
| `@ielts/ui` | `StudyTaskCard` | `packages/ui/src/components/StudyTaskCard.tsx` |
| `@ielts/ui` | `MistakeCard` | `packages/ui/src/components/MistakeCard.tsx` |
| `@ielts/ui` | `ProgressSummaryCard` | `packages/ui/src/components/ProgressSummaryCard.tsx` |
| `@ielts/ui` | `SkillCard` | `packages/ui/src/components/SkillCard.tsx` |
| `@ielts/ui` | `SettingsSectionCard` | `packages/ui/src/components/SettingsSectionCard.tsx` |
| `@ielts/ui` | `AITutorRecommendationCard` | `packages/ui/src/components/AITutorRecommendationCard.tsx` |
| `@ielts/ui` | `AITutorMessageCard` | `packages/ui/src/components/AITutorMessageCard.tsx` |
| `@ielts/ui` | `ExtensionPopupCard` | `packages/ui/src/components/ExtensionPopupCard.tsx` |
| `@ielts/ui` | `ExtensionActionMenu` | `packages/ui/src/components/ExtensionActionMenu.tsx` |
| `@ielts/ui` | `MobileBottomNavigation` | `packages/ui/src/components/MobileBottomNavigation.tsx` |
| `@ielts/ui` | `DatePicker` | `packages/ui/src/components/DatePicker.tsx` |
| `@ielts/ui` | `IconButton` | `packages/ui/src/components/IconButton.tsx` |

---

## 5. Recommendation

### 5.1 Choose an Icon Library

| Library | Why it fits |
|---------|-------------|
| **lucide-react** | Clean, lightweight, iOS-like flat style, perfect stroke consistency, excellent tree-shaking, 1000+ icons, MIT license |
| **phosphor-react** | Softer, more expressive, education-app feeling, multiple weights (thin, light, regular, bold, fill), great for a learning app |
| **@radix-ui/react-icons** | Highest quality, designed for Radix/primitives, but limited selection (~300 icons) |

### 5.2 Recommended Icon Strategy

1. Install **lucide-react** (clean, flat, iOS-like) or **phosphor-react** (softer, educational)
2. Create `packages/theme/src/icons.ts` — a centralized icon mapping file with semantic names
3. Replace all emoji → mapped icon components
4. Replace all inline SVGs → mapped icon components
5. Replace all Unicode symbols → mapped icon components
6. Update `IconButton` to use the chosen library internally
7. Create extension PNG icons (16, 48, 128) to fix missing manifest references

### 5.3 Priority Order for Icon Replacement

1. **Core UI components** (`packages/ui`) — most reusable impact
2. **Dashboard and navigation** (`apps/web/src`) — highest user visibility
3. **AI Tutor** (`packages/ai-tutor`, `apps/web/src/components/aiTutor`) — key feature
4. **Extension popup** (`apps/extension/src/popup`) — second app
5. **Content script panels** (`apps/extension/src/content-script`) — extension UX
6. **Landing/onboarding** (`apps/web/src/pages`, `apps/web/src/features/onboarding`) — first impressions

---

## 6. File Inventory

### Files with Emoji Icons (need replacement)

| File | Emoji Count |
|------|-------------|
| `apps/web/src/services/ChatContext.ts` | ~40 |
| `apps/web/src/components/aiTutor/ModeSelector.tsx` | ~10 |
| `apps/web/src/features/onboarding/OnboardingForm.tsx` | ~20 |
| `apps/web/src/pages/TodayPlanPage.tsx` | ~10 |
| `apps/web/src/pages/Settings.tsx` | ~7 |
| `apps/web/src/features/progress/ProgressTracker.tsx` | ~10 |
| `apps/web/src/components/aiTutor/ReadingListeningTutor.tsx` | ~10 |
| `apps/web/src/components/aiTutor/WritingTutor.tsx` | ~8 |
| `apps/web/src/pages/roadmap/FullStudyRoadmapPage.tsx` | ~5 |
| `apps/web/src/pages/AITutorChat.tsx` | ~20 |
| `apps/web/src/features/artifacts/ArtifactsPage.tsx` | ~6 |
| `apps/web/src/features/roadmap/components/DayCard.tsx` | ~2 |
| `apps/web/src/pages/vocabulary/ReviewPage.tsx` | ~5 |
| `apps/web/src/pages/Mistakes.tsx` | ~2 |
| `apps/web/src/components/aiTutor/ChatUXEnhancements.tsx` | ~1 |
| `apps/web/src/features/mistakes/MistakeNotebook.tsx` | ~1 |
| `apps/web/src/features/progressReview/components/ProgressReviewPanel.tsx` | ~1 |
| `apps/web/src/services/ProactiveMessageEngine.ts` | ~2 |
| `apps/web/src/components/aiTutor/TeachingMode.tsx` | ~8 |
| `apps/web/src/components/aiTutor/SpeakingPartner.tsx` | ~5 |
| `apps/web/src/pages/vocabulary/NotebookPage.tsx` | ~3 |
| `apps/web/src/components/HeroSection.tsx` | ~1 |
| `apps/web/src/features/landing/LandingPage.tsx` | ~1 |
| `apps/extension/src/types.ts` | ~8 |
| `apps/extension/src/content-script/selectionPanel.ts` | ~7 |
| `apps/extension/src/content-script/proactiveMessagePanel.tsx` | ~14 |
| `apps/extension/src/content-script/dictionaryPanel.ts` | ~6 |
| `apps/extension/src/content-script/aiExplain.ts` | ~5 |
| `apps/extension/src/popup/components/ExtensionProactiveMessages.tsx` | ~18 |
| `apps/extension/src/popup/components/PopupDashboard.tsx` | ~22 |
| `apps/extension/src/popup/components/MiniTutor.tsx` | ~25 |
| `apps/extension/src/popup/components/VideoHelper.tsx` | ~8 |
| `apps/extension/src/popup/components/DashboardCard.tsx` | ~1 |
| `apps/extension/src/popup/components/ChatButton.tsx` | ~2 |
| `apps/extension/src/popup/components/ReviewSession.tsx` | ~3 |
| `apps/extension/src/popup/components/PendingReviews.tsx` | ~3 |
| `apps/extension/src/popup/components/AITutorEntry.tsx` | ~2 |
| `apps/extension/src/popup/components/BackupRestore.tsx` | ~3 |
| `apps/extension/src/popup/components/ImportExportSection.tsx` | ~2 |
| `apps/extension/src/popup/components/MistakeNotebook.tsx` | ~1 |
| `apps/extension/src/popup/components/ArticleCollector.tsx` | ~1 |
| `apps/extension/src/popup/components/SaveTextForm.tsx` | ~1 |
| `apps/extension/src/popup/components/QuickAddVocab.tsx` | ~1 |
| `apps/extension/src/content-script/highlighter/highlightTooltip.ts` | ~1 |
| `apps/extension/src/content-script/videoHelper.ts` | ~1 |
| `packages/ai-tutor/src/utils/chatHelpers.ts` | ~8 |
| `packages/ai-tutor/src/components/MissingKeyBanner.tsx` | ~1 |

### Files with Inline SVGs (need replacement)

| File | SVG Count |
|------|-----------|
| `apps/web/src/pages/AITutorChat.tsx` | 30+ |
| `apps/web/src/pages/vocabulary/NotebookPage.tsx` | 15 |
| `apps/web/src/pages/DailyPlan.tsx` | 12 |
| `apps/web/src/pages/landing/FeatureGrid.tsx` | 12 |
| `apps/web/src/components/Layout.tsx` | 10 |
| `apps/web/src/pages/MockTests.tsx` | 5 |
| `apps/web/src/pages/Mistakes.tsx` | 6 |
| `apps/web/src/pages/ListeningJournal.tsx` | 5 |
| `apps/web/src/pages/ReadingJournal.tsx` | 5 |
| `apps/web/src/pages/Search.tsx` | 3 |
| `apps/web/src/pages/ImportExport.tsx` | 4 |
| `apps/web/src/pages/ReviewCenter.tsx` | 3 |
| `apps/web/src/pages/TopicsProgress.tsx` | 1 |
| `apps/web/src/pages/vocabulary/ReviewPage.tsx` | 3 |
| `apps/web/src/pages/LandingPage.tsx` | 4 |
| `apps/web/src/components/Footer.tsx` | 5 |
| `apps/web/src/features/chat/components/HeaderChatIcon.tsx` | 1 |
| `apps/web/src/features/planner/Planner.tsx` | 3 |
| `apps/web/src/features/roadmap/components/DayCard.tsx` | 1 |
| `packages/ui/src/components/SearchInput.tsx` | 1 |
| `packages/ui/src/components/Select.tsx` | 1 |
| `packages/ui/src/components/Toast.tsx` | 4 |
| `packages/ui/src/components/ExtensionSelectedTextMenu.tsx` | 5 |
| `packages/ui/src/components/StudyTaskCard.tsx` | 4 |
| `packages/ui/src/components/VocabularyDetailPanel.tsx` | 2 |
| `packages/ui/src/components/ProgressRing.tsx` | 1 |
| `packages/ui/src/components/DatePicker.tsx` | 3 |
| `packages/ai-tutor/src/components/ChatIcon.tsx` | 1 |
| `packages/ai-tutor/src/components/TutorAvatar.tsx` | 2 |
| `packages/ai-tutor/src/components/ChatBubble.tsx` | 5 |
| `packages/ai-tutor/src/components/ErrorBanner.tsx` | 2 |
| `packages/ai-tutor/src/components/ProactiveMessagePreview.tsx` | 2 |
| `packages/ai-tutor/src/components/ContextSuggestionCard.tsx` | 2 |
| `packages/ai-tutor/src/components/NotificationCenter.tsx` | 8 |
| `packages/ai-tutor/src/components/ChatWidget.tsx` | 4 |
| `apps/extension/src/popup/components/EmptyState.tsx` | 7 |
| `apps/extension/src/popup/components/PopupDashboard.tsx` | 2 |
| `apps/extension/src/popup/components/ErrorBoundary.tsx` | 1 |
| `apps/extension/src/popup/components/SyncStatusBadge.tsx` | 1 |
| `apps/extension/src/popup/components/WordDetails.tsx` | 1 |
| `apps/extension/src/popup/components/SavedWordsView.tsx` | 1 |
| `apps/extension/src/popup/components/VocabularyCollector.tsx` | 1 |
| `apps/extension/src/popup/components/MistakeNotebook.tsx` | 2 |

### Files with Unicode Symbols (need review)

| File | Symbols |
|------|---------|
| `packages/ui/src/components/VocabularyWordCard.tsx` | `●◐◑★▶` |
| `packages/ui/src/components/SearchInput.tsx` | `×` |
| `packages/ui/src/components/Modal.tsx` | `×` |
| `packages/ui/src/components/Drawer.tsx` | `×` |
| `packages/ui/src/components/Badge.tsx` | `×` |
| `packages/ui/src/components/PracticeCard.tsx` | `✓` |
| `packages/ui/src/components/ProgressSummaryCard.tsx` | `↑↓→` |
| `packages/ui/src/components/SkillCard.tsx` | `↑↓→` |
| `packages/ui/src/components/MistakeCard.tsx` | `→` |
| `packages/ui/src/components/VocabularyDetailPanel.tsx` | `✎✕` |
| `packages/ui/src/components/EmptyState.tsx` | `?` |
| `packages/ui/src/components/ErrorState.tsx` | `!` |
| `apps/web/src/pages/vocabulary/ReviewPage.tsx` | `✓★▲⟳→⚡×·●` |
| `apps/web/src/pages/vocabulary/NotebookPage.tsx` | `×·` |
| `apps/web/src/pages/Mistakes.tsx` | `→` |
| `apps/web/src/pages/ReviewCenter.tsx` | `×…` |
| `apps/web/src/pages/TopicsProgress.tsx` | `↑↓` |
| `apps/web/src/pages/GrammarNotes.tsx` | `✗` |
| `apps/web/src/pages/TodayPlanPage.tsx` | `·` |
| `apps/web/src/components/HeroSection.tsx` | `·` |
| `apps/web/src/features/landing/LandingPage.tsx` | `·` |
| `apps/web/src/features/roadmap/components/DayCard.tsx` | `✓○◉→↩` |
| `apps/web/src/features/roadmap/RoadmapPage.tsx` | `★!→'→'` |
| `apps/web/src/features/progress/ProgressTracker.tsx` | `✓▶↻` |
| `apps/web/src/features/grammar/GrammarLearning.tsx` | `✓✗→` |
| `apps/web/src/features/writing/WritingPromptsPage.tsx` | `✓` |
| `apps/web/src/features/writing/components/FeedbackPanel.tsx` | `→` |
| `apps/web/src/components/aiTutor/SpeakingPartner.tsx` | `→•` |
| `apps/web/src/components/aiTutor/aiTutorHelper.ts` | `→` |
| `apps/web/src/services/aiTutor/ContextManager.ts` | `•·` |
| `apps/web/src/services/aiTutor/TopicContextManager.ts` | `•` |

---

## 7. Test Files with Icon Dependencies

| Test File | Emoji Used | Issue |
|-----------|------------|-------|
| `packages/ai-tutor/src/tests/useProactiveMessages.test.ts` | `👋` | Expects emoji in assertion — will break if icons change |
| `packages/ai-tutor/src/tests/chatHelpers.test.ts` | `👋` | Expects emoji in assertion — will break if icons change |
| `packages/ai-tutor/src/tests/ChatBubble.test.tsx` | `🤖`, `👤` | Expects emoji in rendered output — will break if icons change |
| `packages/ai-tutor/src/tests/QuickActions.test.tsx` | `📚`, `🧠` | Test data uses emoji as icon values |

---

## 8. Missing Extension Icons

| Reference | Path | Status |
|-----------|------|--------|
| `manifest.json` → `icons/16` | `apps/extension/icons/icon-16.png` | **MISSING** |
| `manifest.json` → `icons/48` | `apps/extension/icons/icon-48.png` | **MISSING** |
| `manifest.json` → `icons/128` | `apps/extension/icons/icon-128.png` | **MISSING** |

---

*End of report.*
