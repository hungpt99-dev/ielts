# IELTS Journey — Empty, Loading, and Error States Specification

## Overview

This document specifies all non-ideal states across the redesigned IELTS Journey website. Every page and feature must handle three categories of non-ideal states gracefully:

| Category | Purpose | UX Goal |
|----------|---------|---------|
| **Empty State** | No data exists yet (first-time user, cleared data, nothing to show) | Guide user to create/save their first piece of content |
| **Loading State** | Data is being fetched, generated, or processed | Communicate progress, prevent layout shift, set expectation of duration |
| **Error State** | Something went wrong — network failure, generation failed, permission denied, not found | Reassure user, explain what happened, offer clear next action |

These states are equally important as the ideal state. A well-designed empty state can convert a user who would otherwise bounce. A good loading state builds trust. A clear error state reduces frustration and support tickets.

### Principles

- **Never show a blank page**: Every state communicates clearly what is happening and what the user can do
- **Friendly tone**: Messages should be encouraging, not technical or apologetic
- **Clear action**: Every non-ideal state offers a clear next step or retry path
- **Preserve context**: When possible, show surrounding navigation and layout (not a full-screen takeover)
- **Progress visibility**: Loading states communicate duration and progress where possible
- **No dead ends**: Error states always offer a way out (retry, go back, contact support, or reload)
- **Accessible by default**: All states use proper ARIA roles, semantic HTML, and keyboard-navigable actions

---

## 1. Empty State Patterns

### 1.1 Page-Level Empty State

**Purpose**: Shown when an entire page has no data — first visit to vocabulary, no study plan yet, no practice history.

**Visual Style**: Centered content block within the page layout. Optional friendly illustration (SVG, 120-160px). Title in `font.size.xl` or `font.size.2xl` with semibold weight. Description in `font.size.base` with muted color. One primary action button and optionally a secondary link.

**States**: Single — visible when data list/collection is empty.

**Components Used**: `EmptyState` (variant: `card` or `illustrated`)

**Content Pattern**:
```
[Illustration / Icon]

## Friendly Title
Brief explanation of why this is empty and what to do.

[ Primary Action Button ]
[ Secondary Link (optional) ]
```

**Accessibility**: Semantic `<h2>` or `<h3>` for title. Action button has descriptive label. Illustration is `aria-hidden="true"`. Container has `role="status"` when dynamically shown.

**Usage**: Every page-level content container — vocabulary notebook, saved articles, mistake review, practice history, study roadmap.

---

### 1.2 Section-Level Empty State (Inline)

**Purpose**: Shown when a specific section within a larger page has no data — no AI recommendations yet on dashboard, no weak skills to warn about, no recent mistakes.

**Visual Style**: Compact dashed border box or subtle card with reduced padding. Smaller icon (48px). Title in `font.size.sm` with medium weight. Description in `font.size.xs`. Small action link or button.

**States**: Single — visible when section has no data.

**Components Used**: `EmptyState` (variant: `inline`)

**Content Pattern**:
```
[Small Icon]  Short title — short description [ Action Link ]
```

**Accessibility**: Container has `role="status"` or `aria-live="polite"` if content updates dynamically.

**Usage**: Dashboard sections, settings empty states, progress sub-sections, AI recommendation slots.

---

### 1.3 First-Time User Empty State

**Purpose**: Special empty state for brand-new users who have not completed onboarding — no study plan, no saved vocabulary, no practice history.

**Visual Style**: Large illustration (200px+), welcoming title, enthusiastic description. Two actions: primary "Get Started" or "Create Your First Study Plan" and secondary "Take a Tour" or "Learn More". Gradient or tinted background card for visual emphasis.

**States**: Single — shown until user completes onboarding or creates first content.

**Components Used**: `EmptyState` (variant: `illustrated`)

**Content Pattern**:
```
[Large Friendly Illustration]

## Welcome to IELTS Journey!
You haven't set up your study plan yet. Let's create one tailored to your goal.

[ Create My Study Plan → ]
[ Take a Quick Tour ]
```

**Accessibility**: Same as page-level. Tour link should be keyboard focusable and clearly labeled.

**Usage**: Dashboard (no study plan), vocabulary (no saved words), study roadmap (no plan yet).

---

### 1.4 Search/Filter Empty State

**Purpose**: Shown when a search or filter returns no results — no vocabulary matching a search query, no articles matching a filter.

**Visual Style**: Similar to section-level but with search icon variant. Message includes the search term so user knows what was searched. Action: "Clear filters" or "Try a different search".

**States**: Single — shown when filter/search yields zero results.

**Components Used**: `EmptyState` (variant: `inline` or `card`)

**Content Pattern**:
```
[🔍]

## No results for "{query}"
Try adjusting your search or clearing filters.

[ Clear Filters ]
```

**Accessibility**: Container updates with `aria-live="polite"` when search results change dynamically.

**Usage**: Vocabulary search, saved articles search, mistake review filters, practice history filter.

---

### 1.5 Context-Specific Empty Messages

The following table defines the empty state message and action for each major feature:

| Feature | Empty State Title | Description | Primary Action |
|---------|------------------|-------------|----------------|
| Dashboard (no plan) | Welcome to IELTS Journey! | Set up your personalized study plan to get started. | Create Study Plan |
| Today's Study Plan | No Tasks for Today | You don't have any study tasks scheduled today. | View Full Plan |
| Study Roadmap | No Study Plan Yet | Create a plan from today to your exam date. | Generate Plan |
| AI Tutor (no chat) | Start a Conversation | Ask me anything about IELTS — writing, speaking, vocabulary, or study tips. | Ask a Question |
| Vocabulary Notebook | Your Vocabulary Notebook is Empty | Save words while you study to build your personal vocabulary collection. | Save Your First Word |
| Vocabulary Review | All Words Reviewed! | You're all caught up. New words will appear here when they're ready for review. | Browse Vocabulary |
| Saved Articles | No Saved Articles | Save articles from the web using the browser extension to read and practice here. | Learn About Extension |
| Saved Text | No Saved Text Selections | Select text on any webpage and save it here for later review. | Learn About Extension |
| Saved Notes | No Notes Yet | Add notes to your saved content to remember key points. | Browse Saved Content |
| Practice History | No Practice Sessions Yet | Start your first practice exercise to see your history here. | Start Practice |
| Reading Practice | No Reading Exercises | Generate reading practice tailored to your current level. | Generate Exercise |
| Listening Practice | No Listening Exercises | Generate listening practice from saved articles or AI content. | Generate Exercise |
| Writing Practice | No Writing Prompts Yet | Generate writing tasks based on real IELTS topics. | Generate Prompt |
| Speaking Practice | No Speaking Prompts Yet | Practice speaking with AI-powered prompts and feedback. | Generate Prompt |
| Grammar Practice | No Grammar Exercises | Practice grammar with exercises tailored to your weak areas. | Generate Exercise |
| Mistake Review | No Mistakes Recorded Yet | Great job! Mistakes from your practice sessions will appear here. | Start Practice |
| Learning Progress | Not Enough Data Yet | Complete a few study sessions to see your progress charts. | Start Studying |
| AI Progress Review | Insufficient Data | Complete more study sessions and practice exercises for a meaningful review. | See Progress |
| Settings (no AI key) | AI Provider Not Configured | Connect your AI provider to enable AI Tutor features. | Configure Provider |
| Extension Connection | Connect Your Browser | Install the IELTS Journey extension to save vocabulary and articles from any webpage. | Install Extension |

---

## 2. Loading State Patterns

### 2.1 Page-Level Loading Skeleton

**Purpose**: Shown while the entire page content is being fetched — initial page load, navigation between pages.

**Visual Style**: Skeleton rectangles matching the layout shape and dimensions of the actual content. Shimmer animation (left-to-right gradient sweep). Uses `surface.skeleton` and `surface.skeletonShine` tokens. No text, no images — only gray rounded rectangles.

**Components Used**: `LoadingSkeleton` (domain-specific variant)

**Domain-Specific Skeletons**:

| Skeleton | What It Mimics | Lines/Shapes | Height |
|----------|---------------|--------------|--------|
| `DashboardSkeleton` | Greeting + streak + skill cards (4) + task list (3) + AI recommendation | 1 heading bar, 5 card rects, 3 task row bars | ~600px |
| `TaskListSkeleton` | Task list in study plan | 1 heading bar, 4 task row bars with circle + text | ~300px |
| `SkillProgressSkeleton` | Skill progress cards (4 skills) | 4 card rects in grid, each with progress bar inside | ~200px |
| `StudyPlanSkeleton` | Full study plan timeline | 1 heading bar, 1 config bar, 1 timeline with 5 phase bars | ~500px |
| `VocabListSkeleton` | Vocabulary word list | 1 search bar, 8 word card rows (word + meaning + badge) | ~500px |
| `StatsRowSkeleton` | Statistics row on dashboard | 4 stat card rects in row | ~100px |
| `ChatSkeleton` | AI Tutor chat messages | 3 message bubbles (left/right alternating) | ~400px |
| `PracticeSkeleton` | Practice exercise page | 1 heading bar, 1 instruction box, 1 question area, 1 action bar | ~500px |
| `ProgressChartSkeleton` | Progress charts | 2 chart area rects (one bar chart, one line chart) | ~400px |
| `MistakeListSkeleton` | Mistake review list | 1 filter bar, 4 mistake card rects with icon + text rows | ~400px |

**Accessibility**: Skeleton container has `role="status"` and `aria-label="Loading content"`. Animations respect `prefers-reduced-motion` (show static skeleton instead of shimmer).

**Usage**: Every page that loads async data on mount.

---

### 2.2 Section-Level Loading Skeleton

**Purpose**: Shown when a specific section within a loaded page is still loading — AI recommendation loading on dashboard, progress data loading.

**Visual Style**: Smaller skeleton matching section dimensions. Single rectangle or small group of rectangles.

**Components Used**: `LoadingSkeleton` (variant: `card` or `rect`)

**Props**: width, height, variant, count, gap.

**Accessibility**: `aria-busy="true"` on the section container.

**Usage**: Dashboard AI recommendation section, progress sub-sections, settings previews.

---

### 2.3 Button Loading State

**Purpose**: Communicates that an action is being processed — saving, generating, submitting.

**Visual Style**: Button content replaced by a small spinning animation (SVG spinner, 16-20px). Button remains at same width to prevent layout shift. Text is visually hidden but remains in DOM for width preservation. Button is disabled during loading.

**Components Used**: `Button` (loading prop)

**Accessibility**: `aria-busy="true"` on button. Spinner has `aria-label="Loading"`. `disabled` attribute set.

**Usage**: "Generate Study Plan", "Save Vocabulary", "Submit Writing", "Export Data", "Retry" buttons.

---

### 2.4 AI Generation Progress State

**Purpose**: Shown when AI is generating a long response or plan — study plan generation (may take 10-30 seconds), AI Progress Review generation, practice exercise generation.

**Visual Style**: Progress bar with determinate or indeterminate state. Accompanying status message explaining what is happening (e.g., "Generating your study plan...", "Creating practice exercises..."). Optional step indicator showing progress through sub-tasks.

**Components Used**: `ProgressBar` (indeterminate or determinate), `Card`, status text

**Content Pattern**:
```
[Card with icon + status message]

## Generating Your Study Plan
This may take up to 30 seconds.

[Progress Bar - indeterminate animation]

Steps:  Analyzing level → Planning weeks → Creating tasks
         ✓                        ○                      ○
```

**Accessibility**: `aria-live="polite"` on status message. Progress bar has `role="progressbar"` with `aria-valuenow` for determinate, `aria-busy="true"` for indeterminate.

**Usage**: AI Study Plan Generator, AI Progress Review generator, AI Tutor long responses, practice exercise generation, vocabulary explanation generation.

---

### 2.5 Chunked Generation Progress

**Purpose**: Shown specifically for the AI Study Plan Generator when the plan is generated in chunks — first week appears first, subsequent weeks are generated progressively.

**Visual Style**: The already-generated chunks are visible and interactive. A generation indicator at the bottom shows "Generating next week..." with a thin progress bar. New chunks slide in as they complete.

**Components Used**: `ProgressBar`, loading indicator, animated transitions

**Accessibility**: `aria-live="polite"` announces when new chunks appear.

**Usage**: AI Study Plan Generator with large plan from today to exam date.

---

### 2.6 Typing Indicator (AI Tutor)

**Purpose**: Shows that AI Tutor is generating a response.

**Visual Style**: Animated dots (three dots bouncing in sequence) in a chat bubble matching tutor message styling. Shown as a pending tutor message at the bottom of the chat.

**Components Used**: `AITutorMessageCard` (typing variant)

**Accessibility**: `aria-label="AI Tutor is typing"`. `aria-live="polite"` on the chat container.

**Usage**: AI Tutor chat page, floating AI Tutor popup.

---

## 3. Error State Patterns

### 3.1 Page-Level Error State

**Purpose**: Shown when a critical page fails to load — network error, API error, permission denied, page not found.

**Visual Style**: Centered card within page layout. Error icon (SVG, 64-80px, danger-colored). Title in `font.size.xl` semibold. Description explaining the error in plain language. Primary action button ("Try Again" or "Go Back"). Optional secondary action ("Contact Support").

**Components Used**: `ErrorState` (variant: `card` or `fullscreen`)

**Content Pattern**:
```
[Danger-colored Icon]

## Something Went Wrong
We couldn't load this page. This might be a network issue.

[ Try Again ]
[ Go Back to Dashboard ]
```

**Variants**:
| Variant | Container | Use Case |
|---------|-----------|----------|
| `card` | Card within page layout | Non-critical page, user can navigate elsewhere |
| `fullscreen` | Full viewport center | Critical page, user cannot proceed without it |
| `inline` | Compact bar | Section-level error within page |

**Accessibility**: `role="alert"`. Error title is `<h1>` or `<h2>` depending on page context. Retry button is focused on mount (for `fullscreen` variant). Error details (technical) are visually hidden but present for screen readers via `sr-only`.

**Usage**: Dashboard load failure, study plan load failure, vocabulary data load failure, any page with critical API dependency.

---

### 3.2 Section-Level Error State (Inline)

**Purpose**: Shown when a section within a page fails but the rest of the page is functional — AI recommendation failed, progress data failed to load, one skill card failed.

**Visual Style**: Compact danger-colored banner or card. Small icon, short message, small retry button or link. Does not disrupt surrounding content.

**Components Used**: `ErrorState` (variant: `inline`)

**Content Pattern**:
```
[!] Failed to load recommendations [ Retry ]
```

**Accessibility**: `role="alert"`. `aria-live="polite"` on container.

**Usage**: Dashboard AI recommendation section, skill card failure, progress chart load failure, settings section load failure.

---

### 3.3 Network Error / Offline State

**Purpose**: Shown when the device loses internet connectivity — no connection, request timeout, DNS failure.

**Visual Style**: Warning-colored banner at top of page (not full-screen). Offline icon. Message: "You are offline. Some features may be unavailable." Auto-dismisses when connection is restored. For critical operations, show inline error on the affected component.

**Components Used**: `ErrorState` (variant: `inline`), connection status banner

**Content Pattern** (banner):
```
[📡] You are offline. Your study progress will sync when you reconnect.
```

**Content Pattern** (inline):
```
[📡] Cannot save — you are offline. Your data will be saved locally.
```

**Accessibility**: `role="alert"`. `aria-live="assertive"` for the banner (critical). Banner is dismissible but re-appears if still offline.

**Usage**: Top of all pages when offline. Inline on form submissions, vocabulary save, study plan generation.

---

### 3.4 AI Generation Failed State

**Purpose**: Shown when AI generation fails — study plan generation error, AI Tutor response error, practice exercise generation failure.

**Visual Style**: Error card with AI Tutor branding (tutor-colored accent). Friendly tone acknowledging the AI failure. Primary retry button. Secondary option to try a simpler request or contact support.

**Components Used**: `ErrorState` (variant: `card` with tutor styling)

**Content Pattern**:
```
[AI Tutor Avatar/Icon]

## I Couldn't Generate That
I ran into a problem while creating your study plan. Let's try again!

[ Try Again ]
[ Simplify My Request ]
```

**Accessibility**: `role="alert"`. Retry button is auto-focused. Error is attributed to the AI system, not the user.

**Usage**: AI Study Plan Generator failure, AI Tutor response failure, AI Progress Review generation failure, practice exercise generation failure, vocabulary explanation failure.

---

### 3.5 API / Rate Limit Error State

**Purpose**: Shown when the AI provider API returns a rate limit error or quota exceeded.

**Visual Style**: Warning card with API provider context. Message explaining the limit. Action: "Check API Settings" or "Upgrade Plan" (if applicable). May include estimated wait time if known.

**Components Used**: `ErrorState` (variant: `card`)

**Content Pattern**:
```
[API Icon]

## API Limit Reached
Your AI provider has reached its rate limit. Please wait a moment and try again.

[ Try Again in 30s ]
[ Configure AI Provider ]
```

**Accessibility**: `role="alert"`. Countdown timer (if shown) is communicated textually, not visually only.

**Usage**: AI Tutor responses, study plan generation, practice exercise generation, any AI-powered feature.

---

### 3.6 Permission / Auth Error State

**Purpose**: Shown when the user does not have permission to access a feature or page — not logged in, insufficient permissions, content deleted by another user.

**Visual Style**: Error card with appropriate icon. Clear explanation. Distinguished between "not logged in" (prompt to log in) and "not found/deleted" (prompt to go back).

**Components Used**: `ErrorState` (variant: `card`)

**Content Pattern** (not logged in):
```
[🔒]

## Sign In Required
Please sign in to access your study plan.

[ Sign In ]
[ Go Back ]
```

**Content Pattern** (not found):
```
[🔍]

## Page Not Found
This page doesn't exist or has been removed.

[ Go to Dashboard ]
```

**Accessibility**: `role="alert"`. Login link is clear and obvious.

**Usage**: Protected routes, deleted content access, expired sessions.

---

### 3.7 Form Validation Error

**Purpose**: Shown when user-submitted form data fails validation — missing required fields, invalid email, study time out of range.

**Visual Style**: Inline error message below the specific field. Danger-colored text in `font.size.sm`. Danger border on the input. Error icon inside the input (right side). For form-level errors, a summary banner at the top.

**Components Used**: `Input` (error prop), form-level `ErrorState` (variant: `inline`)

**Content Pattern** (field-level):
```
[Label]
[Input with danger border]  [!]
Error message explaining the issue
```

**Content Pattern** (form-level):
```
[!] Please fix the following errors: [Field 1], [Field 2]
```

**Accessibility**: `aria-invalid="true"` on input. Error text linked via `aria-describedby`. Form-level error has `role="alert"`. Focus moves to first error field on submit.

**Usage**: All forms — onboarding, settings, study plan configuration, vocabulary save, profile edit.

---

### 3.8 Empty Search / No Results Error

**Purpose**: Shown when a search or filter yields zero results (distinct from empty state — user actively searched and nothing matched).

**Visual Style**: Similar to search empty state but with search icon and query prominently shown. Action to clear filters or modify search.

**Content Pattern**:
```
[🔍]

## No Results for "{query}"
We couldn't find anything matching your search.

[ Clear Search ]
[ Browse All Vocabulary ]
```

**Accessibility**: `aria-live="polite"` on results container.

**Usage**: Vocabulary search, saved articles search, mistake review filter, practice history filter.

---

## 4. Retry Patterns

### 4.1 Automatic Retry

**Purpose**: For transient failures (network timeout, temporary server error), automatically retry once after a short delay (2-3 seconds).

**Visual Style**: The loading state from the failed operation remains visible with an added note: "Still trying..." If the retry succeeds, transition to content. If it fails again, show the error state.

**Components Used**: Loading skeleton → Error state

**Behavior**: Show loading → on failure, show loading with note "Retrying..." for 2s → on second failure, show error state with retry button.

**Accessibility**: `aria-live="polite"` announces "Retrying..." status.

**Usage**: Dashboard data load, study plan load, vocabulary data load, settings load.

---

### 4.2 Manual Retry (Retry Button)

**Purpose**: Explicit user-initiated retry after an error.

**Visual Style**: Primary or secondary button labeled "Try Again" within the error state card. Button is clearly visible and often auto-focused.

**Behavior**: On click, dismiss error state and re-attempt the failed operation. Show loading skeleton during retry. On failure again, show error state again.

**Components Used**: `Button` (variant: `primary`), `ErrorState`

**Accessibility**: Retry button auto-focused when error state appears. Keyboard accessible (Enter/Space to retry).

**Usage**: All error states where user action can resolve the issue.

---

### 4.3 Pull-to-Refresh (Mobile)

**Purpose**: On mobile, allow user to pull down at the top of a page to retry loading the content.

**Visual Style**: Native pull-to-refresh indicator (platform standard) or custom indicator matching design system. Spinner with "Pull to refresh" / "Release to refresh" text.

**Behavior**: On release, show loading skeleton and re-fetch data. On success, transition to content. On failure, show inline error at top.

**Components Used**: Native mobile behavior or custom implementation

**Accessibility**: Announce "Refreshing content" via `aria-live="polite"`.

**Usage**: All mobile pages — dashboard, study plan, vocabulary, practice, progress.

---

### 4.4 Dismissible Error

**Purpose**: For non-critical errors (section failed but page works), allow user to dismiss the error and continue using the page.

**Visual Style**: Inline error banner with close (×) button. Error fades out on dismiss.

**Components Used**: `ErrorState` (variant: `inline`, with close prop)

**Accessibility**: Close button has `aria-label="Dismiss error"`. Error container has `role="alert"`.

**Usage**: Non-critical section failures, optional feature failures, AI recommendation failures.

---

## 5. Offline / Local-First State

### 5.1 Offline Banner

**Purpose**: Persistent top banner when device is offline.

**Visual Style**: Warning-colored bar spanning full width below the header/navigation. Server icon. Text: "You are offline. Your progress will sync when you reconnect." Auto-hides when connection is restored with a brief animation.

**Behavior**:
- Appears within 3 seconds of detecting offline status
- Does not block interaction with page content
- Dismisses automatically on reconnect with fade-out
- If user dismisses while still offline, re-appears after 30 seconds

**Components Used**: Custom banner component or `ErrorState` (variant: `inline`)

**Accessibility**: `role="alert"`, `aria-live="assertive"`. Dismiss button is keyboard focusable.

**Usage**: All pages when device is offline.

---

### 5.2 Local-First Operation

**Purpose**: When offline, critical user actions (save vocabulary, mark task complete, save settings) should be saved locally and synced when connection is restored.

**Visual Style**: No visible difference to user during save. If user navigates away before sync, show a small indicator on the affected item: "Saved locally — will sync when online."

**Behavior**:
- User performs action (e.g., saves a word)
- Data is saved to IndexedDB/localStorage immediately
- Toast/feedback shows "Saved!" as normal
- Background sync occurs when online
- If conflict occurs on sync, show conflict resolution UI

**Components Used**: Local storage handling (existing), sync status indicator

**Accessibility**: Sync status communicated via `aria-label` on affected items.

**Usage**: Vocabulary save, study task completion, settings changes, practice progress save.

---

### 5.3 Offline Content Access

**Purpose**: Cached/previously loaded content should remain accessible offline.

**Visual Style**: Content loads from cache (IndexedDB). No visual difference from online content. If user attempts to perform an action that requires connectivity, show inline message: "This action requires an internet connection."

**Behavior**:
- Dashboard data (last loaded state)
- Study plan (last loaded state)
- Vocabulary notebook (full local copy)
- Recent AI Tutor messages (last session)
- Settings (always available offline)

**Components Used**: Existing local storage/data layer

**Usage**: All pages with locally cached data.

---

## 6. AI Generation Specific States

### 6.1 Generation In Progress

**Purpose**: AI is generating content — study plan, practice exercises, tutor response, progress review.

**Visual Style**: Progress bar (indeterminate for short generations, determinate with steps for long ones). Status text explaining current step. Cancel button for long operations (if applicable).

**Components Used**: `ProgressBar`, `Button` (cancel variant), status text

**Content Pattern**:
```
## Generating Your Practice Exercise

Creating questions based on your weak areas...

[ Progress Bar - indeterminate ]

[ Cancel ]
```

**Accessibility**: `aria-live="polite"` on status updates. Cancel button is keyboard focusable.

**Usage**: AI Study Plan Generator, AI Progress Review, practice generation, AI Tutor writing/spaking evaluation.

---

### 6.2 Generation Complete

**Purpose**: AI has finished generating content.

**Visual Style**: Success indicator (checkmark animation or color change). Content appears below or replaces the progress UI. Brief success toast if user is on another page.

**Components Used**: `Toast` (success), generated content components

**Behavior**: Progress UI transitions to content with smooth animation. Toast appears if generation was triggered from a different page.

**Accessibility**: `aria-live="polite"` announces "Generation complete".

**Usage**: All AI generation flows.

---

### 6.3 Generation Failed (AI-Specific)

**Purpose**: AI generation failed for a specific reason (see Section 3.4).

**Visual Style**: Error card within the generation UI context. AI Tutor avatar/icon. Friendly error message that does not blame the user.

**Components Used**: `ErrorState` (variant: `card` with tutor styling)

**Content Pattern**:
```
[AI Tutor Icon]

## I Had Trouble With That
I couldn't create your study plan this time. This usually happens with complex requests or temporary issues.

[ Try Again ]    [ Simplify My Request ]
```

**Accessibility**: `role="alert"`. Retry button auto-focused.

**Usage**: All AI generation failures.

---

### 6.4 Generation Partial (Chunked)

**Purpose**: Part of the AI-generated content is ready while the rest is still generating (chunked plan generation).

**Visual Style**: Completed chunks visible and interactive. Loading indicator at bottom: "Generating next section..." with thin indeterminate progress bar. New sections slide in as they complete.

**Components Used**: Generated content components, `ProgressBar` (inline), loading indicator

**Accessibility**: `aria-live="polite"` announces each new section as it appears.

**Usage**: AI Study Plan Generator (long plans).

---

## 7. Not Enough Data State

### 7.1 Insufficient Data for Progress Display

**Purpose**: User has not completed enough activities to show meaningful progress charts or AI Progress Review.

**Visual Style**: Card with muted icon. Title: "Not Enough Data Yet". Description: "Complete a few more study sessions to unlock your progress insights." Action: "Continue Studying" or "Start First Practice".

**Components Used**: `EmptyState` (variant: `card`)

**Content Pattern**:
```
[📊]

## Not Enough Data Yet
Complete at least 3 study sessions to see your progress charts and AI insights.

[ Start Studying → ]
```

**Accessibility**: `role="status"`.

**Usage**: Learning Progress page (first visit), AI Progress Review (insufficient sessions), skill breakdown (no data for a skill).

---

### 7.2 Insufficient Data for AI Review

**Purpose**: User has not completed enough sessions for a meaningful AI Progress Review.

**Visual Style**: Similar to above but with AI Tutor icon. Description explains how many more sessions are needed.

**Components Used**: `EmptyState` (variant: `card`)

**Content Pattern**:
```
[AI Tutor Icon]

## Let's Study a Bit More First
I need more data to create a useful progress review. Complete 2 more study sessions and come back!

[ Continue Studying → ]
[ See Basic Progress ]
```

**Usage**: AI Progress Review page when user has < 5 completed sessions.

---

### 7.3 Insufficient Data for Weak Skill Detection

**Purpose**: Not enough practice data to determine which skills are weak.

**Visual Style**: Compact inline state within the skills section. Friendly message encouraging more practice.

**Components Used**: `EmptyState` (variant: `inline`)

**Content Pattern**: "Practice more in each skill to see your strengths and weaknesses."

**Usage**: Dashboard skill section, study plan generator skill selection.

---

## 8. Logged-Out State

### 8.1 Protected Route Redirect

**Purpose**: User navigates to an authenticated page while logged out.

**Visual Style**: Full-page centered card. Friendly message. Login/Register buttons. No navigation chrome (sidebar, bottom nav).

**Components Used**: Custom full-page state or `ErrorState` (variant: `fullscreen`)

**Content Pattern**:
```
[IELTS Journey Logo]

## Sign In to Continue
Access your study plan, vocabulary, and AI Tutor.

[ Sign In ]
[ Create Account ]
```

**Accessibility**: `role="alert"`. Sign In button is auto-focused.

**Usage**: Any authenticated route when user is not logged in.

---

### 8.2 Session Expired

**Purpose**: User's session has expired while they were using the app.

**Visual Style**: Modal dialog or inline banner. Message: "Your session has expired. Please sign in again." Action: "Sign In" button that preserves current page URL for redirect after login.

**Components Used**: `Modal` (small) or `ErrorState` (variant: `card`)

**Content Pattern**:
```
## Session Expired
For security, your session has expired. Sign in again to continue.

[ Sign In ]
```

**Accessibility**: `role="alertdialog"`. Focus trap within modal. Escape key can close (if modal variant).

**Usage**: API 401 response during active use.

---

## 9. Deleted / Not Found Content State

### 9.1 Content Not Found

**Purpose**: User navigates to a specific content item that no longer exists — deleted vocabulary word, removed article, expired practice session.

**Visual Style**: Error card with search/not-found icon. Message explaining the content is no longer available. Action to go back to the parent list or dashboard.

**Components Used**: `ErrorState` (variant: `card`)

**Content Pattern**:
```
[🔍]

## Word Not Found
This vocabulary word may have been deleted or is no longer available.

[ Back to Vocabulary ]
[ Go to Dashboard ]
```

**Accessibility**: `role="alert"`. Back button is focusable and clearly labeled.

**Usage**: Direct link to deleted vocabulary, expired practice session, removed article.

---

## 10. State Transition Rules

### 10.1 Loading → Content

| Trigger | Transition | Duration Expectation |
|---------|-----------|---------------------|
| Page mount | Skeleton → Fade in content with staggered animation | < 3 seconds expected |
| Search/filter | Brief spinner (200ms min to avoid flash) → Content | < 500ms expected |
| AI generation | Progress bar with status → Content slides in | 5-30 seconds expected |
| Form submit | Button loading → Success toast + content update | < 3 seconds expected |

### 10.2 Loading → Error

| Trigger | Transition | UX Behavior |
|---------|-----------|-------------|
| Page load failure | Skeleton → Error card (with retry) | Auto-retry once at 3s, then show error |
| AI generation failure | Progress bar → Error card (tutor-styled) | No auto-retry — user clicks retry |
| API timeout | Skeleton → Error card | Auto-retry once, then show error |
| Network offline during load | Skeleton → Offline state | Show cached content if available, else error |

### 10.3 Error → Retry

| Trigger | Transition | UX Behavior |
|---------|-----------|-------------|
| User clicks "Try Again" | Error → Loading skeleton → Content or Error | Clear loading state first |
| Pull-to-refresh | Error → Loading → Content or Error | Same as manual retry |
| Network reconnected | Offline banner hides, content refreshes silently | No visible loading if cache is fresh |

### 10.4 Empty → First Content

| Trigger | Transition | UX Behavior |
|---------|-----------|-------------|
| User clicks empty state CTA | Navigate to creation flow → back with data | Celebration toast or subtle success animation |
| First word saved | Empty → Word appears with save animation | Brief confetti or card slide-in |
| First plan generated | Empty → Plan preview with welcome animation | Confetti + "Your journey begins!" message |

---

## 11. Accessibility Notes

### 11.1 ARIA Roles and Live Regions

| State | ARIA Attribute | Value | Usage |
|-------|---------------|-------|-------|
| Loading (page) | `role` | `status` | Container wrapping skeleton |
| Loading (section) | `aria-busy` | `true` | Section container |
| Loading (AI generation) | `aria-live` | `polite` | Status text area |
| Error (page) | `role` | `alert` | Error card container |
| Error (inline) | `role` | `alert` | Error banner |
| Error (modal) | `role` | `alertdialog` | Error modal |
| Empty state | `role` | `status` | Empty state container |
| Offline banner | `role` | `alert` | Offline notification |
| AI typing | `aria-live` | `polite` | Chat container |
| Button loading | `aria-busy` | `true` | Loading button |

### 11.2 Focus Management

| Transition | Focus Target | Rationale |
|-----------|-------------|-----------|
| Page loads → content | Page heading (`<h1>`) | Announce page is ready |
| Page loads → error | Retry button | Quick recovery action |
| Error appears | Retry button (or dismiss button) | Fastest path to resolution |
| Modal error appears | Close or primary action button | Within focus trap |
| Empty state appears | Primary CTA button | Guide user to next step |
| AI generation starts | Keep focus on current element | Do not steal focus during async operation |
| AI generation completes | First content element | Announce completion naturally |

### 11.3 Color and Contrast

| State | Token | Contrast Ratio Target |
|-------|-------|----------------------|
| Error background | `color.status.danger.surface` | N/A (background only) |
| Error text | `color.status.danger.text` | 4.5:1 minimum |
| Warning background | `color.status.warning.surface` | N/A (background only) |
| Warning text | `color.status.warning.text` | 4.5:1 minimum |
| Success text | `color.status.success.text` | 4.5:1 minimum |
| Loading skeleton | `surface.skeleton` (base) | N/A (no text) |
| Empty state text | `color.text.muted` | 4.5:1 against background |

### 11.4 Animation and Motion

| Animation | Default | `prefers-reduced-motion` |
|-----------|---------|-------------------------|
| Skeleton shimmer | Left-to-right gradient sweep | Static skeleton (no animation) |
| Content appear | Fade in + slide up (300ms) | Instant appear (0ms) |
| Error appear | Fade in (200ms) | Instant appear (0ms) |
| Toast slide in | Slide from right (250ms) | Fade in (0ms, no slide) |
| Loading spinner | Continuous rotation | Static icon |
| AI typing dots | Bouncing dots (1s cycle) | Static dots |

### 11.5 Announcements

| State Change | Announcement | Method |
|-------------|--------------|--------|
| Page content loaded | "Dashboard loaded" | `aria-live="polite"` on region |
| Error occurred | "Error: [description]" | `role="alert"` |
| AI generation complete | "Your study plan is ready" | `aria-live="polite"` on status |
| AI generation failed | "Generation failed. Try again." | `role="alert"` |
| Empty state shown | "No vocabulary saved yet" | `aria-live="polite"` on container |
| Offline detected | "You are offline" | `role="alert"` |
| Online restored | "You are back online" | `aria-live="polite"` on banner |

---

## 12. Implementation Notes

### 12.1 Existing Components to Leverage

| Existing Component | File Location | Enhancement Needed |
|-------------------|--------------|-------------------|
| `EmptyState` | `packages/ui/src/components/EmptyState.tsx` | Add illustration variant, search-empty variant |
| `LoadingSkeleton` | `packages/ui/src/components/LoadingSkeleton.tsx` | Add domain-specific skeletons (chat, practice, progress charts) |
| `ErrorState` | `apps/web/src/components/ui/EmptyState.tsx` (ErrorState export) | Fullscreen variant, auto-retry, dismissible inline variant |
| `ProgressBar` | `packages/ui/src/components/ProgressBar.tsx` | Indeterminate mode for AI generation |
| `AITutorMessageCard` | `packages/ui/src/components/AITutorMessageCard.tsx` | Typing indicator variant |

### 12.2 State Management Pattern

States should follow a consistent React pattern:

```tsx
type PageState<T> =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T }
```

This pattern enables consistent rendering logic across all pages:

```tsx
function DashboardPage() {
  const [state, setState] = useState<PageState<DashboardData>>({ status: 'loading' });

  if (state.status === 'loading') return <DashboardSkeleton />;
  if (state.status === 'empty') return <EmptyState variant="illustrated" {...emptyProps} />;
  if (state.status === 'error') return <ErrorState onRetry={reload} />;
  return <DashboardContent data={state.data} />;
}
```

### 12.3 New Components Required

| Component | Purpose | File Location |
|-----------|---------|--------------|
| `OfflineBanner` | Persistent top banner when offline | `packages/ui/src/components/OfflineBanner.tsx` |
| `GenerationProgress` | AI generation progress with status steps | `packages/ui/src/components/GenerationProgress.tsx` |
| `TypingIndicator` | Animated AI typing dots | `packages/ui/src/components/AITutorMessageCard.tsx` (add variant) |

### 12.4 Content Strings

Store all empty state, error, and status messages as a centralized constants file (e.g., `packages/ui/src/constants/statusMessages.ts` or extend the existing pattern in `apps/web/src/components/ui/EmptyState.tsx`). This enables:

- Easy editing of copy without touching components
- Future localization (one file to translate)
- Consistent messaging across features

---

## Summary

The empty, loading, and error state system for IELTS Journey covers:

| Pattern | Count | Key Component |
|---------|-------|--------------|
| **Empty State Patterns** | 5 (page-level, section-level, first-time, search/filter, context-specific) | `EmptyState` |
| **Loading State Patterns** | 6 (page skeleton, section skeleton, button loading, AI progress, chunked progress, typing indicator) | `LoadingSkeleton`, `ProgressBar` |
| **Error State Patterns** | 8 (page-level, section-level, network, AI failure, rate limit, permission, validation, no results) | `ErrorState` |
| **Retry Patterns** | 4 (auto-retry, manual retry, pull-to-refresh, dismissible) | `ErrorState`, `Button` |
| **Special States** | 5 (offline, local-first, AI generation states, not enough data, logged-out) | `OfflineBanner`, `GenerationProgress` |
| **Accessibility** | 5 areas (ARIA, focus, contrast, motion, announcements) | — |
| **Implementation** | State management pattern, new components needed | — |

Every state is designed to guide the user toward a meaningful next action, never leaving them confused or stuck. The system prioritizes friendly, encouraging language over technical jargon, and ensures all states are fully accessible with proper ARIA attributes, focus management, and motion respect.
