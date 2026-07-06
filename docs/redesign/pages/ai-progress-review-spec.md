# IELTS Journey — AI Progress Review Page Specification

## Page Purpose

The AI Progress Review page is the dedicated AI-powered analysis hub where users receive personalized, narrative-driven evaluations of their learning progress over a selected time period. While the Learning Progress page (`/progress`) provides raw data, charts, and metrics, the AI Progress Review page transforms that data into a human-readable assessment written from the perspective of an AI IELTS tutor. It answers questions like: "How am I doing overall?", "What should I focus on next?", "Am I on track for my target band?", and "What patterns do my mistakes reveal?".

This page is the "tutor's report card" — designed to make users feel seen, understood, and guided by a personal tutor who has carefully analyzed their study data.

## User Goal

Users should feel, when using the AI Progress Review page:

- **Seen** — The AI review acknowledges their effort, consistency, and specific achievements: "You studied 18 hours this month and completed 42 tasks. Great consistency!"
- **Understood** — The review identifies patterns the user may not have noticed: "Your listening accuracy is improving, but you're making the same preposition errors in writing."
- **Guided** — Clear, prioritized recommendations tell the user exactly what to focus on next: "Focus on article usage (a/an/the) this week. You made this mistake 7 times."
- **Informed** — Skill-by-skill progress is explained in plain language, not just numbers: "Your Reading jumped from 6.0 to 6.5 — your skimming technique is improving."
- **Encouraged** — Even when progress is slow, the tone is supportive and constructive: "You've been consistent this month. Let's adjust your study plan to target your weak areas."
- **Confident** — The comparison between current progress and exam target gives clarity on whether they are on track
- **Curious** — The review invites follow-up questions, deeper analysis, and specific actions the user can take from this page

The AI Progress Review should feel like a monthly (or weekly) check-in with a personal IELTS tutor — not a generic analytics report.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/features/progressReview/ProgressReviewPage.tsx`, `apps/web/src/features/progressReview/components/ProgressReviewPanel.tsx`, `apps/web/src/features/progressReview/hooks/useProgressReview.ts`, `apps/web/src/features/progressReview/services/progressReviewService.ts`, `packages/ai-tutor/src/controllers/AIProgressReviewController.ts`, `packages/ai-tutor/src/prompts/learningProgressReview.ts`, `packages/learning-engine/src/progress/AIProgressReviewService.ts`, `packages/learning-engine/src/types.ts:220-263`):

1. **No dedicated page identity** — The current progress review is a panel component rendered inside a minimal page wrapper. There is no page header, no breadcrumb, no title section explaining what the page does. The `ProgressReviewPage.tsx` simply wraps `ProgressReviewPanel.tsx` in a fragment with a flex container. The page does not communicate its purpose to new users.

2. **Period selector is functional but visually minimal** — The `DateRangeSelector.tsx` provides three presets (Last 7 Days, Last 30 Days, Custom Range) with custom date inputs, but the UI is basic: a row of pill buttons followed by inline date input fields that appear for the custom range. No visual indication of the data span (e.g., "Analyzing data from Mar 1 to Mar 31"), no calendar picker integration, and no animation when switching periods.

3. **Report generation has no progress feedback** — The generate button triggers a loading spinner with a single text message "Analyzing your study data and generating your personalized progress report...". For users with large amounts of data, the AI call can take 5-15 seconds. There is no progress indicator, no step tracking (data collection → AI analysis → report building), no estimated time display. Users may wonder if the generation is stuck.

4. **No AI fallback explanation** — When the AI call fails (no API key, network error, or invalid response), the service falls back to `buildReportFromData()` which produces a data-driven report. However, the UI does not differentiate between an AI-generated report and a data-driven fallback report. Users may assume the report is AI-powered when it is actually a statistical summary. The fallback report loses the narrative, personalized quality of the AI review.

5. **Report sections are static cards** — The `ReportSection` wrapper adds a left accent border and icon, but each section is a static block of text with no interactivity. Users cannot collapse/expand sections, cannot copy text, cannot click recommendations to navigate to relevant pages, and cannot drill into specific stats.

6. **No recommendation actions** — The "Recommended Focus for Next Period" section shows a numbered list of text recommendations, but each recommendation is not a clickable link or action. If the AI says "Focus on Reading Passage questions", the user cannot click that recommendation to navigate to reading practice. The page provides analysis but no direct path to action.

7. **No follow-up question capability** — After reading the AI review, users cannot ask follow-up questions. If the AI says "Your writing coherence is improving but task achievement needs work", the user cannot ask "What specifically should I improve in task achievement?" without leaving the page and opening the AI Tutor separately.

8. **No save/export/report history** — The current implementation does not save generated reports. Each time the user clicks "Generate", a new report is produced. There is no history of past reviews, no way to compare this month's review to last month's, and no way to export the report as a PDF or share it. The `useProgressReview` hook stores the current `report` and `error` state only in memory.

9. **No proactive review awareness** — The `packages/ai-tutor/src/services/proactiveProgressReview.ts` generates weekly and monthly reviews automatically and stores them in `ProactiveMessageStorage`. However, the AI Progress Review page does not surface these proactive reviews. Users can generate on-demand reviews but cannot see the auto-generated ones on this page.

10. **No visual progress integration** — The report is purely text-based with no data visualizations. When the AI says "your reading accuracy improved from 65% to 78%", there is no mini-chart or progress bar showing that change. The Learning Progress page has charts, but there is no visual connection between the AI review and the actual data.

11. **Mobile layout is cramped** — The report sections use a card layout that works on desktop but feels dense on mobile. The left accent border takes visual space. Text paragraphs are long and hard to scan on small screens. The generate button and period selector are at the top, requiring scrolling back up to change the period after viewing the report.

12. **No comparison with previous period** — The current review analyzes a single period in isolation. There is no "compared to last period" view. Users cannot see if their improvements are accelerating or if they are plateauing relative to previous weeks/months.

13. **Accessibility gaps** — The `aria-live="polite"` region announces when the report loads, but individual sections lack ARIA landmarks. The repeated mistakes cards and skill progress items are not labeled for screen readers. The generate button's loading state does not announce progress to screen readers.

14. **No error differentiation** — The current error handling shows a generic error card with "Try Again". It does not differentiate between: "AI is not configured (no API key)", "Network error", "Not enough data to generate a review", "Data loading error", or "AI response parsing error". Users receive the same generic error for fundamentally different problems.

15. **No empty state guidance** — When no report exists yet, the page shows an illustrated card with "No Progress Report Yet" and "Generate your first progress report to see AI analysis of your study data." However, it does not explain what data is needed, how much data is recommended before generating a review, or what the review will contain. New users may generate a review after 1 day of study and receive a thin report with little insight.

---

## Proposed Layout

The AI Progress Review page is organized as a three-zone layout: configuration header → AI review report → follow-up actions.

### Desktop Layout (>= 1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: AI Progress Review                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ [Back]  AI Progress Review            [History ▾] [Export] │  │
│  │ Subtitle: "Your personalized learning analysis from AI"    │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Zone 1: Period & Generation Controls                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Period Selector:  [7 Days] [30 Days] [90 Days] [Custom ▾]  │  │
│  │ Date range badge: "Analyzing data from Mar 1 – Mar 31"     │  │
│  │                                                              │  │
│  │ [Generate New Report]                                      │  │
│  │  - Default state: Show report from last generation          │  │
│  │  - No report yet: Prominent generate CTA with illustration  │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Zone 2: AI Progress Review Report (scrollable)                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  Section 1: Overall Learning Summary                       │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  🤖 AI Tutor Says                                    │  │  │
│  │  │  "You studied 24.5 hours this month across 18        │  │  │
│  │  │   sessions — a 15% increase from last month.         │  │  │
│  │  │   Your estimated IELTS band has moved from 6.0       │  │  │
│  │  │   to 6.5. You're making steady progress toward       │  │  │
│  │  │   your target of 7.5. Keep it up!"                   │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌─────────────────────────┐ ┌───────────────────────────┐ │  │
│  │  │ Section 2: Strengths    │ │ Section 3: Weaknesses     │ │  │
│  │  │ ✓ Reading: 72% accuracy │ │ ⚠ Writing coherence      │ │  │
│  │  │ ✓ Listening improved 8% │ │ ⚠ Article usage (7×)     │ │  │
│  │  │ ✓ Study streak: 12 days │ │ ⚠ Speaking fluency       │ │  │
│  │  │ ✓ Vocab: 32 new words   │ │ ⚠ Preposition errors (5×)│ │  │
│  │  └─────────────────────────┘ └───────────────────────────┘ │  │
│  │                                                            │  │
│  │  Section 4: Repeated Mistakes                              │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Pattern         Skill    Freq  Analysis              │  │  │
│  │  │ ───────────────────────────────────────────────────  │  │  │
│  │  │ Article misuse  Grammar   7×   You tend to...        │  │  │
│  │  │ Verb tense      Writing   5×   Your IELTS score...   │  │  │
│  │  │ Preposition     Grammar   5×   This pattern...       │  │  │
│  │  │ Spelling        Writing   3×   Common in Task 2...   │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Section 5: Vocabulary Review Status                       │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Total: 156  │ Mastered: 84 │ Still Learning: 72     │  │  │
│  │  │ ┌──────────────────────────────────────────────────┐ │  │  │
│  │  │ │  ████████████████████████░░░░░░░░░░░  54%       │ │  │  │
│  │  │ └──────────────────────────────────────────────────┘ │  │  │
│  │  │ AI: "Review 10 words from your 'Education' topic..."  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Section 6: Skill-by-Skill Progress                        │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Skill      Status     Trend    Accuracy  Sessions    │  │  │
│  │  │ ───────────────────────────────────────────────────  │  │  │
│  │  │ Reading    Strong      ↑ 8%    78%       12          │  │  │
│  │  │ Listening  Developing   → 2%   65%       8           │  │  │
│  │  │ Writing    Needs work   ↓ 5%   52%       6           │  │  │
│  │  │ Speaking   Developing   ↑ 3%   58%       4           │  │  │
│  │  │ Vocabulary Strong       ↑12%   82%       15          │  │  │
│  │  │ Grammar    Needs work   → 1%   55%       9           │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
|  |                                                            │  │
│  │  Section 7: Study Plan Adherence                          │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ "You completed 68% of your planned study sessions    │  │  │
│  │  │  this month. You studied 24.5 of 36 planned hours.   │  │  │
│  │  │  Your strongest week was Week 3 (92% adherence).     │  │  │
│  │  │  Consider adjusting your daily goal to 45 minutes    │  │  │
│  │  │  for better consistency."                            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Section 8: Recommendations                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ 1. 📖 Practice Reading Passage questions (3/week)    │  │  │
│  │  │ 2. ✍️ Focus on Task 2 essay structure                │  │  │
│  │  │ 3. 🎧 Listen to academic lectures (15 min/day)       │  │  │
│  │  │ 4. 📝 Review article usage rules in Grammar          │  │  │
│  │  │ 5. 🗣️ Record 2 speaking answers per week             │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Section 9: Tutor's Final Feedback                         │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  "You're on the right track! Your consistency this   │  │  │
│  │  │   month is impressive. If you maintain this pace     │  │  │
│  │  │   and focus on the recommendations above, you'll     │  │  │
│  │  │   be well-prepared for your exam on June 15.         │  │  │
│  │  │                                                       │  │  │
│  │  │   Remember: improvement isn't linear. Some weeks     │  │  │
│  │  │   will feel harder than others, but every session    │  │  │
│  │  │   counts. Let's keep going!"                         │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  Zone 3: Follow-up Actions                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  [Save Report] [Export as PDF] [Share Summary]              │  │
│  │  [Compare with Previous Period] [Generate Again]            │  │
│  │                                                              │  │
│  │  Ask Follow-Up Questions:                                    │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  "Tell me more about my writing weaknesses"            │ │  │
│  │  │  "What specific article rules should I review?"        │ │  │
│  │  │  "Create a 1-week plan based on these recommendations" │ │  │
│  │  │  [Ask AI Tutor a question...]                          │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌──────────────────────────────────────┐
│  Header:  ← AI Progress Review       │
│  [History] [Export]                  │
├──────────────────────────────────────┤
│  Period: [7d] [30d] [90d] [Custom]   │
│  "Mar 1 – Mar 31"                    │
│                                       │
│  [Generate New Report]               │
├──────────────────────────────────────┤
│  AI Progress Review (scrollable)     │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ 🤖 AI Tutor Says               │  │
│  │ "You studied 24.5 hours..."    │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ ✓ Strengths                    │  │
│  │ ⚠ Weaknesses                   │  │
│  │ [Expand All ▾]                 │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Repeated Mistakes              │  │
│  │ Article misuse · 7×            │  │
│  │ Verb tense · 5×                │  │
│  │ [View All 4 ▸]                 │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Vocabulary: 54% mastered       │  │
│  │ ████████████████░░░░░░  156    │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Skill Progress [Expand ▾]      │  │
│  │ Reading   78% ↑  Strong        │  │
│  │ Writing   52% ↓  Needs work    │  │
│  │ ...                            │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ 📖 Recommendations             │  │
│  │ 1. Practice Reading Passage    │  │
│  │ 2. Focus on essay structure    │  │
│  │ 3. Listen to lectures          │  │
│  └────────────────────────────────┘  │
│                                       │
│  [Save] [PDF] [Ask AI Follow-Up]    │
├──────────────────────────────────────┤
│  Bottom Navigation                    │
└──────────────────────────────────────┘
```

---

## Main Sections

### Section 1: Page Header

**Purpose**: Orient the user, provide navigation context, and offer access to report history and export.

**Content**:
- Back button/arrow (navigates to previous page, typically Learning Progress or Dashboard)
- Page title: "AI Progress Review" in bold
- Subtitle: "Your personalized learning analysis from your AI Tutor"
- Header actions:
  - "History" button — opens a dropdown or side panel showing past generated reports with dates
  - "Export" icon button — triggers export menu (PDF, JSON, text summary)

**States**:
- *Default*: Shows header with standard title and subtitle
- *Report loaded*: Subtitle may update to show the period being reviewed (e.g., "Analysis for March 1–31, 2026")
- *Loading*: Static header, no interactive changes
- *Error*: Header remains visible, error displayed below

**Accessibility**:
- `role="banner"` with `aria-label="AI Progress Review header"`
- Back button: `aria-label="Go back to previous page"`
- History button: `aria-label="View report history"`
- Export button: `aria-label="Export this report"`

---

### Section 2: Period & Generation Controls

**Purpose**: Allow users to select the time period for analysis and trigger report generation. Also shows the current report date range once generated.

**Content**:
- **Period Selector**: A segmented button control with four options:
  - "7 Days" — Last week
  - "30 Days" — Last month (default, most useful cadence)
  - "90 Days" — Last quarter (requires sufficient data)
  - "Custom" — Opens a date range picker (two date inputs or calendar popover)
- **Date range badge**: A small muted label showing the computed date range: "Analyzing data from Mar 1 to Mar 31, 2026"
- **Data availability hint**: A small text showing the amount of data found: "42 tasks, 18 sessions, 156 vocabulary words found"
- **Generate button**:
  - *Default (no report)*: "Generate AI Progress Report" — primary CTA, full-width
  - *Report exists*: "Regenerate Report" — secondary style, smaller
  - *Loading*: Button shows spinner + "Analyzing your study data..."
  - *Success*: Button shows "Report Generated" with checkmark for 2 seconds, then resets

**Generation Progress States**:
- *Phase 1: Collecting* — "Collecting your study data..."
- *Phase 2: Analyzing* — "AI Tutor is analyzing your progress..."
- *Phase 3: Building* — "Building your personalized report..."
- *Complete* — Report slides into view

**Empty/Initial State** (no report yet):
- A friendly illustration (robot with clipboard or document with sparkles)
- Title: "Ready for Your Progress Review?"
- Body: "Generate an AI-powered analysis of your study data. We recommend at least 7 days of study for meaningful insights."
- Data requirement tips:
  - "📊 At least 3 practice sessions recommended"
  - "📝 At least 10 vocabulary words for vocabulary analysis"
  - "⏱️ At least 2 hours of study time for accurate trends"
- Generate CTA button

**Accessibility**:
- Period selector: `role="radiogroup"` with `aria-label="Select review period"`
- Each period option: `role="radio"` with `aria-checked`
- Generate button: `aria-label="Generate progress report for current period"`
- Loading state: `aria-live="polite"` announcements for each phase

---

### Section 3: Overall Learning Summary

**Purpose**: The headline assessment — a narrative paragraph summarizing the user's overall progress, effort, and trajectory.

**Content**:
- **AI Tutor icon** — Sparkle or robot icon with "AI Tutor Says" label
- **Narrative summary** — 3-5 sentence paragraph written in second person, covering:
  - Total study time (hours/minutes)
  - Number of sessions
  - Days active / consistency rate
  - Current estimated band vs. previous period band
  - Overall trend (improving / stable / needs attention)
  - One encouraging sentence
- **Mini stats bar** — Below the paragraph, three mini stat chips:
  - "24.5 hrs studied" (clock icon)
  - "18 sessions" (play icon)
  - "12-day streak" (fire icon)

**Data Source**: `overallSummary` from `ProgressReviewReport`, derived from `AIProgressReviewSummary` in the learning engine.

**States**:
- *Generated*: Full narrative with stats
- *Fallback (no AI)*: More factual, less narrative: "You studied 24.5 hours across 18 sessions. Your most practiced skill was Reading."
- *Insufficient data*: "You don't have enough data for a meaningful review yet. Keep studying and check back after a few more sessions."

---

### Section 4: Strengths & Weaknesses (Side by Side)

**Purpose**: A balanced, honest assessment of what the user is doing well and what needs improvement.

**Content**:
- **Left Panel — What You Improved (Strengths)**:
  - Section with green success accent
  - Title: "✅ Strengths & Improvements"
  - List of 3-5 items, each with a bullet point and brief description:
    - ✓ "Reading accuracy improved from 65% to 78% (+13%)"
    - ✓ "Consistent study streak: 12 days and counting"
    - ✓ "Vocabulary learning rate doubled this month"
    - ✓ "Listening comprehension improving steadily"
  - Each item has a small green checkmark icon
  - Items are ordered by significance (most impactful first)

- **Right Panel — What You Still Struggle With (Weaknesses)**:
  - Section with amber/red warning accent
  - Title: "⚠️ Areas Needing Attention"
  - List of 3-5 items, each with brief description:
    - ⚠ "Writing coherence: Task 2 essay structure needs work"
    - ⚠ "Article usage (a/an/the): repeated 7 times across exercises"
    - ⚠ "Speaking fluency: long pauses in Part 2 responses"
  - Each item has a small warning or exclamation icon
  - Items ordered by priority (most critical first)

**Data Source**: `improvements` and `struggles` string arrays from `ProgressReviewReport`, each containing concise bullet-point statements with supporting data.

**States**:
- *Data available*: Both panels show items
- *No weaknesses*: Panel shows "No significant weaknesses detected this period. Great work!" with a celebration icon
- *No improvements*: Panel shows "Focus on consistency this period. Small daily steps build progress." with encouraging tone

**Interaction**:
- Clicking a strength or weakness item could navigate to the relevant practice page or show more detail in a tooltip
- "Ask AI about this" button on each weakness for deeper analysis

---

### Section 5: Repeated Mistakes Analysis

**Purpose**: Surface mistake patterns the user may not notice — recurring errors grouped by type, skill, and frequency.

**Content**:
- Section title: "🔄 Repeated Mistake Patterns"
- Subtitle: "Mistakes you've made more than once — grouped by pattern"
- **Table/Card List** (repeatable items), each showing:
  - **Pattern name** — Descriptive label of the error type (e.g., "Article misuse (a/an/the)")
  - **Skill badge** — Grammar, Writing, etc.
  - **Frequency badge** — "7×" in a red/amber pill badge
  - **Analysis text** — 1-2 sentence AI analysis of why this pattern occurs and its IELTS impact
  - **Action buttons**:
    - "View Mistakes" → navigates to the Mistake Review page filtered to this pattern
    - "Practice This" → opens relevant practice exercises
    - "Ask AI →" → opens AI Tutor follow-up with pattern context
  - **Trend indicator** — Small arrow showing if the pattern is increasing (↑), stable (→), or decreasing (↓)

**Data Source**: `repeatedMistakes` array from `ProgressReviewReport`, containing `pattern`, `skill`, `frequency`, and `analysis`.

**States**:
- *Data available*: List of pattern cards, sorted by frequency descending
- *No repeated mistakes*: "No repeated mistake patterns detected! You're learning from your errors effectively." with green checkmark
- *Not enough data*: "Log more mistakes to detect patterns. At least 3-5 mistakes in the same skill area are needed."

---

### Section 6: Vocabulary Review Status

**Purpose**: Assess the user's vocabulary acquisition and retention — how many words saved, mastered, and needing review.

**Content**:
- **Stats row** — Three stat boxes in a row:
  - "Total Saved" — count (e.g., 156 words)
  - "Mastered" — count (e.g., 84 words) with green badge
  - "Still Learning" — count (e.g., 72 words) with amber badge
- **Mastery progress bar** — A horizontal gradient bar (green → primary):
  - Label: "Overall Mastery: 54%"
  - `role="progressbar"` with `aria-valuenow="54"`
  - Animated fill (transition-all duration-500)
  - Breakdown label: "84 mastered / 72 learning"
- **AI vocabulary recommendation** — A small callout card:
  - AI icon + "AI Tutor's Vocabulary Tip"
  - "Review 10 words from your 'Education' topic — 6 are due for spaced repetition review."
  - Action: "Review Words" → navigates to Vocabulary Review with topic pre-filtered

**Data Source**: `vocabularyReviewStatus` from `ProgressReviewReport`, containing `summary`, `totalSaved`, `mastered`, `stillLearning`, and `recommendation`.

**States**:
- *Data available*: Full stats with progress bar and recommendation
- *No vocabulary*: "No vocabulary saved yet. Start saving words from your practice sessions."
- *All mastered*: "All 84 words mastered! Add more vocabulary from your practice to keep growing." with celebration

---

### Section 7: Skill-by-Skill Progress Table

**Purpose**: Provide a structured, scannable overview of each IELTS skill's performance during the review period.

**Content**:
- Section title: "📊 Skill-by-Skill Progress"
- Subtitle: "Accuracy, trend, and practice volume for each skill"
- **Table layout** (desktop) or **card list** (mobile) with columns/items:

| Skill | Status | Trend | Accuracy | Sessions | Action |
|-------|--------|-------|----------|----------|--------|
| Reading | Strong 🟢 | ↑ 8% | 78% | 12 | Practice |
| Listening | Developing 🟡 | → 2% | 65% | 8 | Practice |
| Writing | Needs work 🔴 | ↓ 5% | 52% | 6 | Practice |
| Speaking | Developing 🟡 | ↑ 3% | 58% | 4 | Practice |
| Vocabulary | Strong 🟢 | ↑ 12% | 82% | 15 | Review |
| Grammar | Needs work 🔴 | → 1% | 55% | 9 | Practice |

**Row details**:
- **Skill**: Skill name with colored dot (consistent with IELTS skill colors)
- **Status badge**: Pill badge — "Strong" (green), "Developing" (amber), "Needs work" (red), "Insufficient data" (grey)
- **Trend**: Arrow + percentage change (↑ green, ↓ red, → grey)
- **Accuracy**: Progress bar with percentage (colored by skill)
- **Sessions**: Count of practice sessions
- **Action**: "Practice" or "Review" link → navigates to relevant skill practice page

**Data Source**: `skillProgress` array from `ProgressReviewReport`, containing `skill`, `status`, `sessions`, `accuracy`, `trend`, and `analysis`.

**States**:
- *Data available*: Full table with all skills
- *No data for a skill*: Shows "No sessions" in grey with muted text
- *Insufficient data*: Status shows "Insufficient data" with "Need 3+ sessions for trend"

**Interaction**:
- Clicking a skill row expands an inline detail panel with the `analysis` text
- "Practice" action navigates to the skill's practice page
- "Ask AI" button per skill for focused analysis

---

### Section 8: Study Plan Adherence

**Purpose**: Evaluate how well the user followed their AI-generated study plan — consistency, completion rate, and adjustment suggestions.

**Content**:
- Section title: "📅 Study Plan Adherence"
- **Narrative paragraph** — AI-written assessment of plan adherence:
  - "You completed 68% of your planned study sessions this month."
  - "Your strongest week was Week 3 (92% adherence)."
  - "Your weakest week was Week 1 (45% adherence)."
  - "You studied 24.5 of 36 planned hours."
- **Adherence stat chips**:
  - "68% Planned sessions completed"
  - "24.5 / 36 hrs studied"
  - "Best day: Tuesday (90%)"
- **AI suggestion** — "Consider adjusting your daily goal from 60 minutes to 45 minutes for better consistency."
- **Action**: "Adjust Study Plan" → navigates to AI Study Plan Generator

**Data Source**: `studyPlanAdherence` string from `ProgressReviewReport`, combined with actual vs. planned data from the study plan system.

**States**:
- *Data available*: Full assessment with stats and suggestions
- *No study plan*: "No study plan found for this period. Generate an AI study plan to track your adherence." with action button
- *Perfect adherence*: "100% adherence! You followed every planned session. Consider challenging yourself with a higher goal." with celebration

---

### Section 9: Recommended Focus for Next Period

**Purpose**: Give the user clear, actionable, prioritized next steps — what to study, in what order, and why.

**Content**:
- Section title: "🎯 Recommended Focus for Next Period"
- Subtitle: "AI-prioritized actions to maximize your IELTS score"
- **Numbered list** (1-5 recommendations), each item showing:
  - **Number** — Prominent number badge (1, 2, 3, 4, 5)
  - **Title** — Bold action title: "Practice Academic Reading Passages"
  - **Description** — 1-2 sentences: "Focus on skimming techniques for Passage 3. Your accuracy drops from 85% to 60% on long passages."
  - **Expected impact** — Small note: "Expected band impact: +0.5"
  - **Action button** — "Start" → navigates to the recommended activity with context pre-applied
  - **Time estimate** — "~15 min/day, 3 days/week"

**Data Source**: `recommendedFocus` string array from `ProgressReviewReport`, each item expanded with metadata (skill, action type, estimated time, impact).

**States**:
- *Data available*: Full numbered list with action buttons
- *No recommendations*: "Keep up your current routine! Come back after more practice sessions for personalized recommendations."
- *Single recommendation*: Full-width card with the one action item

**Interaction**:
- Each item is a clickable card that navigates to the relevant activity
- "Ask AI to elaborate" on any recommendation
- "Add all to study plan" button at the bottom (adds all 5 recommendations to the user's study plan)

---

### Section 10: Tutor's Final Feedback

**Purpose**: End the report with a warm, personalized, motivating message from the AI Tutor — the "human touch" that makes the review feel personal.

**Content**:
- **Card with left accent border** — Purple or primary color
- **AI Tutor icon** — Robot or sparkle icon with "AI Tutor's Final Note" label
- **Personalized message** — 2-4 sentence paragraph that:
  - Acknowledges effort ("Your consistency this month is impressive")
  - Addresses the user's specific situation ("With your exam 75 days away")
  - Provides perspective ("Improvement isn't linear")
  - Ends with encouragement ("Let's keep going!")

**Data Source**: `tutorFeedback` string from `ProgressReviewReport`.

**States**:
- *Generated*: Full personalized message
- *Fallback (no AI)*: Generic encouraging message: "Keep studying consistently. Every session brings you closer to your target band."
- *Insufficient data*: "Start your IELTS Journey today! Every practice session builds toward your goal."

---

### Section 11: Follow-up Actions

**Purpose**: Provide utility actions and the ability to have a conversation with the AI Tutor about the report.

**Content**:
- **Action buttons row**:
  - "💾 Save Report" — Saves the current report to local storage for history
  - "📄 Export as PDF" — Generates a PDF version of the report
  - "📤 Share Summary" — Generates a shareable text/ card summarising the key findings
  - "📊 Compare with Previous" — Toggles a comparison view overlaying the previous period's data
  - "🔄 Regenerate" — Triggers a new generation for the same period
- **Follow-up Questions section**:
  - Section title: "💬 Ask AI Tutor Follow-Up Questions"
  - Suggested question chips (tappable):
    - "Tell me more about my writing weaknesses"
    - "What specific article rules should I review?"
    - "Create a 1-week plan based on these recommendations"
    - "Compare my progress with last month's"
    - "How can I improve my speaking fluency?"
  - **Input field**: A text input with "Ask your AI Tutor a question about your progress…" placeholder
  - **Send button**: Arrow or send icon
  - **Chat expansion**: Activating any follow-up question opens the AI Tutor chat with the report context pre-populated, allowing back-and-forth conversation

**States**:
- *Report exists*: Full follow-up section with suggested questions and input
- *No report*: Hidden (follow-up is only relevant after a report exists)
- *Saving*: Toast "Report saved" on save action
- *Exporting*: PDF generation progress with download

---

## Primary Actions

| Action | Location | Context |
|--------|----------|---------|
| Generate Report | Period Controls | Triggers AI analysis for the selected period |
| Regenerate Report | Period Controls / Footer | Re-runs AI analysis for the same period |
| Save Report | Follow-up Actions | Persists the report to local history |
| Export as PDF | Follow-up Actions | Generates downloadable PDF |
| Share Summary | Follow-up Actions | Creates shareable text or image summary |
| Compare with Previous | Follow-up Actions | Overlays previous period data for comparison |
| Ask Follow-Up Question | Follow-up Actions | Opens AI Tutor chat with report context |
| Start Recommendation | Recommendations Section | Navigates to recommended activity |
| View Mistakes (Pattern) | Repeated Mistakes | Filters Mistake Review page by pattern |
| Practice Skill | Skill Progress | Navigates to skill practice page |
| Review Vocabulary | Vocabulary Status | Navigates to Vocabulary Review |
| Adjust Study Plan | Study Plan Adherence | Navigates to AI Study Plan Generator |

## Secondary Actions

| Action | Location | Context |
|--------|----------|---------|
| View Report History | Header | Opens side panel or dropdown of past reports |
| Change Period | Period Controls | Switches the review period |
| Compare Period Toggle | Follow-up Actions | Overlays old data on current report |
| Expand/Collapse Section | Any section | Collapse long sections for scrolling ease |
| Ask AI about Item | Strengths/Weaknesses / Mistakes | Opens AI Tutor with item-specific context |
| AI Elaborate on Recommendation | Recommendations | Gets deeper explanation for a recommendation |
| Copy Report Text | Report Body (context menu) | Copy individual sections |
| Hide/Show Stats | Stats row | Minimize stats for compact view |
| Scroll to Section | Any (via sticky nav) | Jump directly to a section |

---

## Empty State

### No Report Yet (First Visit)

- **Illustration**: Friendly robot or mascot holding a clipboard with a progress chart, surrounded by sparkles
- **Title**: "Ready for Your Progress Review?"
- **Body**: "Generate an AI-powered analysis of your recent study data. Your AI Tutor will analyze your practice sessions, vocabulary learning, and mistake patterns to create a personalized progress report."
- **Data requirement note**: "For the most useful review, we recommend at least 7 days of study with a few practice sessions."
- **Action**: "Generate Your First Report" — prominent primary button
- **Secondary**: "Go to Learning Progress" → navigates to `/progress`

### No Data for Selected Period

- **Illustration**: Calendar with a muted or empty day grid
- **Title**: "No Study Data for This Period"
- **Body**: "There's no study data in the selected time range. Try selecting a different period or start studying to build your history."
- **Action**: "Try Last 7 Days" — auto-selects the 7-day period and triggers generation
- **Secondary**: "Go to Dashboard" → navigates to Dashboard

### Insufficient Data for Meaningful Review

- **Illustration**: Small plant sprout or seedling (representing early growth)
- **Title**: "Still Early in Your Journey"
- **Body**: "You're just getting started! We need a bit more data to generate a useful progress review. Keep practicing and check back after a few more sessions."
- **Action**: "Continue Learning" → navigates to Today's Study Plan
- **Metrics shown**: Basic stats without AI analysis (e.g., "3 tasks completed", "45 minutes studied")

### No Report History

- **Illustration**: Empty folder or document drawer
- **Title**: "No Past Reports"
- **Body**: "Your saved progress reports will appear here. Save a report after generating it to build your history."
- **Action**: None (informational overlay in the History panel)

---

## Loading State

### Page Initial Load

- **Pattern**: Skeleton shell of the full page layout
- **Header skeleton**: Title bar + subtitle placeholder
- **Period control skeleton**: Chips placeholder row (3 pill shapes)
- **Content skeleton**: Simple illustration + text block + button placeholder in the center
- **Animation**: Shimmer effect with `--color-skeleton` gradient
- **Duration**: Until `useProgressReview` hook initializes state from local storage or previous session

### Report Generation Loading

The generation process has multiple phases, each with distinct visual feedback:

**Phase 1 — Collecting Data** (0-2 seconds):
- Generate button shows spinner + "Collecting your study data..."
- A small task list appears below the button:
  - [✓] Reading your learning data
  - [✓] Gathering vocabulary progress
  - [ ] Analyzing mistake patterns (spinning)
  - [ ] Building your report (pending)
- Each step transitions from pending → spinning → checked as it completes

**Phase 2 — AI Analysis** (2-10 seconds):
- Task list updates:
  - [✓] Reading your learning data
  - [✓] Gathering vocabulary progress
  - [✓] Analyzing mistake patterns
  - [⏳] AI Tutor is writing your report...
- A pulsing AI icon (sparkle or robot face) with shimmer effect
- Subtitle: "AI Tutor is analyzing your study patterns and writing your personalized review..."
- Estimated time hint: "This usually takes 5-10 seconds"

**Phase 3 — Building Report** (0-2 seconds):
- Task list completes:
  - [✓] Reading your learning data
  - [✓] Gathering vocabulary progress
  - [✓] Analyzing mistake patterns
  - [✓] Building your report
- Brief checkmark animation on the final step
- Report sections slide in from the bottom with staggered animation (each section 100ms apart)

**Phase 4 — Complete**:
- Report is fully visible
- Generate button shows "Report Generated ✓" briefly then resets
- Subtle celebration: green glow on the "AI Tutor Says" section

**Fallback (Data-driven report — no AI)**:
- Same loading phases but Phase 2 shows "Generating data summary..." instead of "AI Tutor is analyzing..."
- No AI icon, no sparkle effects
- Report sections still slide in but with simpler styling (no AI Tutor Say section, just the summary stat)

### AI Analysis Detailed Breakdown (Alternative Visualization)

For users with large datasets, show a visual breakdown of what the AI is processing:

```
┌────────────────────────────────────────────────────┐
│ ⏳ Analyzing Your Progress...                      │
│                                                    │
│ 📊 Processing 18 practice sessions...              │
│ ████████████████░░░░░░░░░░░░░░  45%                │
│                                                    │
│ 📝 Analyzing vocabulary (156 words)...             │
│ ██████████████████████████░░░░  80%                │
│                                                    │
│ 🔄 Detecting mistake patterns (42 entries)...       │
│ █████████░░░░░░░░░░░░░░░░░░░░░  25%               │
│                                                    │
│ Estimated time: 8 seconds remaining                │
└────────────────────────────────────────────────────┘
```

### Regeneration Loading

- Same phases as initial generation
- Report fades to 30% opacity while regenerating
- New report slides in when complete
- Previous report remains visible until new one is ready

---

## Error State

### AI Not Configured (No API Key)

- **Icon**: Key with cross mark or settings gear
- **Title**: "AI Tutor Not Set Up"
- **Body**: "You haven't configured your AI provider yet. AI Progress Review requires an AI API key to generate personalized reports."
- **Action**: "Configure AI Settings" → navigates to AI Provider Settings
- **Fallback**: "Generate Data Summary" → generates a non-AI statistical summary

### AI Call Failed (Network Error)

- **Icon**: Cloud with cross or disconnected
- **Title**: "Could Not Complete Your Review"
- **Body**: "The AI Tutor encountered a connection error. This is usually temporary. You can try again or generate a data summary instead."
- **Action**: "Try Again" — retries the AI call
- **Secondary**: "Generate Data Summary" — falls back to non-AI report
- **Passive fallback**: If the user clicks "Try Again" and it fails again, auto-offer the data summary option

### AI Response Parsing Failed

- **Icon**: Document with warning
- **Title**: "Could Not Read AI Response"
- **Body**: "The AI Tutor returned an unexpected response. This sometimes happens with different AI models."
- **Action**: "Try Again" — reruns the generation
- **Secondary**: "Generate Data Summary" — falls back to non-AI report

### Not Enough Data

- **Icon**: Bar chart with minimum data
- **Title**: "Not Enough Data for AI Review"
- **Body**: "We need more study data to generate a meaningful review. Here's what we recommend before trying again:"
- **Checklist**:
  - [ ] Complete at least 3 practice sessions
  - [ ] Save at least 10 vocabulary words
  - [ ] Log at least 3 mistakes
  - [ ] Study for at least 2 hours total
- **Action**: "Go to Dashboard" → navigates to Dashboard
- **Secondary**: "Generate Anyway" → generates report with warning that results may be minimal

### Database/Loading Error

- **Icon**: Database with warning or broken link
- **Title**: "Could Not Load Your Study Data"
- **Body**: "There was a problem reading your study history. This is usually a temporary issue."
- **Action**: "Try Again" — reloads data from database
- **Secondary**: "Clear Cache & Retry" — clears cached data and retries
- **Fallback**: "Go to Dashboard" → navigates away

### Offline State

- **Layout**: Subtle banner at top: "You're offline. AI review requires an internet connection."
- **Behavior**: The generate button is disabled with tooltip: "Connect to the internet to generate a progress review"
- **Cached view**: If a previous report is cached, it remains visible but shows a banner: "Showing last saved report. Generate a new one when you're online."
- **AI features**: All AI-related actions disabled with "requires internet" messaging

### Generation In Progress — User Leaves Page

- **Warning**: If the user tries to navigate away during generation, show a confirmation dialog:
  - "AI Progress Review is still generating. If you leave now, the report will not be saved."
  - [Stay] [Leave Anyway]
- **Recovery**: If the user left and returns, check if there's a partial or cached report

---

## Mobile Layout

### Screen Adaptation

| Section | Desktop (>= 1024px) | Mobile (< 768px) |
|---------|---------------------|------------------|
| Page Header | Full-width with back, title, actions | Compact: back + title only, history/export in overflow menu |
| Period Controls | Inline segmented buttons | Horizontal scrollable pill row |
| Generate Button | Full-width within period section | Full-width, sticky? |
| Summary Section | Card with narrative + stats row | Card with narrative, stats as 3 compact chips |
| Strengths/Weaknesses | Side-by-side columns (2-col grid) | Stacked vertically (strengths first, then weaknesses) |
| Repeated Mistakes | Table/card list with 4 columns | Card list, one pattern per card with vertical layout |
| Vocabulary Status | Stats row + progress bar | Stats as 3 compact chips stacked, progress bar full-width |
| Skill Progress | Table with 6 columns | Card list, one skill per card with compact layout |
| Study Plan Adherence | Card with narrative + stat chips | Card with truncated narrative, stats as inline text |
| Recommendations | Numbered list with action buttons | Numbered list with compact action buttons |
| Tutor's Final Note | Card with left accent border | Full-width card, no accent border (uses top border) |
| Follow-up Actions | Action buttons row + question chips | Action buttons stacked vertically, question chips in horizontal scroll |
| History Panel | Slide-over side panel | Bottom sheet |

### Period Controls on Mobile

- Segmented buttons collapse to a horizontal scrollable row of pills
- Custom date range opens a bottom sheet with two date inputs
- The selected period is highlighted with bold text and an underline indicator
- The date range badge ("Mar 1 – Mar 31") appears below the pills

### Report Content on Mobile

- Each section is full-width with no side-by-side layouts
- Sections are collapsible: each section header is a tappable row with an expand/collapse chevron
- Default: All sections expanded (user can collapse to scroll faster)
- Section headers stick to the top when scrolling within the report (sticky positioning)
- Text paragraphs use `text-sm` for readability on small screens (14px minimum)

### Skill Progress on Mobile

- Table layout converts to individual cards:
  - Each card: Skill name + status badge on the left, accuracy bar + percentage on the right
  - Trend arrow shown next to accuracy as a small colored indicator
  - "Practice" link at bottom-right of each card
  - Only show top 4 skills by default with "Show all 6" expandable

### Recommendations on Mobile

- Compact numbered list:
  - Number badge + title on first line
  - Description on second line (truncated to 2 lines with "..." expand)
  - Action button as a small link at bottom-right
  - Time estimate as a muted chip

### Follow-up Actions on Mobile

- Action buttons: Stacked vertically, full-width buttons
- Suggested questions: Horizontal scrollable chip row (not wrapping)
- Input field: Full-width with send button at right
- The input field gains focus when a suggested question is tapped

### Sticky Generate / Actions

- On mobile, the "Generate" button could optionally be sticky at the top (below the header) as the user scrolls through the report, allowing quick period change and regeneration
- Alternative: A floating "↑ Back to Top" button appears when scrolled past the period controls, plus a mini FAB for "Regenerate"

### Bottom Navigation Behavior

- **On report view**: Bottom navigation visible (standard nav)
- **During generation**: Bottom navigation visible but dimmed (user can navigate away with warning)
- **On history panel (bottom sheet)**: Bottom navigation hidden
- **During AI follow-up chat**: Bottom navigation hidden (chat takes full screen)

### Touch Targets

- All action buttons: minimum 44×44px
- Suggested question chips: minimum 44px height
- Skill cards: entire card is tappable
- Section headers (for collapse/expand): minimum 44px height
- Period pills: minimum 120px width for comfortable tapping

### Gesture Support

- **Swipe down on report**: Refresh / regenerate (pull-to-refresh pattern)
- **Swipe right on report section**: Collapse section
- **Tap period pill**: Selects that period + auto-triggers generation (no separate generate tap needed)
- **Long press on recommendation**: Opens context menu (copy, share, add to plan)

---

## Responsive Behavior

| Breakpoint | Layout | Period Controls | Report Sections | Actions | History Panel |
|------------|--------|----------------|-----------------|---------|---------------|
| < 480px (small phone) | Single column, compact | Scrollable pills, auto-select | Collapsible sections, text-sm | Stacked full-width | Bottom sheet 90% |
| 480-767px (large phone) | Single column | Scrollable pills | Collapsible sections | Stacked full-width | Bottom sheet 85% |
| 768-1023px (tablet) | Single column, wider cards | Inline pills with wrap | Expandable but not collapsed by default | Button row (wrap) | Slide-over 50% |
| 1024-1439px (desktop) | Full layout as designed | Segmented buttons | All sections expanded | Button row inline | Slide-over 40% |
| 1440px+ (large desktop) | Max-width container (1200px) | Segmented buttons | All sections expanded, wider | Button row inline | Slide-over 35% |

**Transition animations**:
- Period change: Sections fade out (200ms), regenerate, slide in (300ms)
- Collapse/expand: Height animation (250ms ease)
- Report generation: Sections stagger-slide in from bottom (100ms each)
- History panel: Slide from right (300ms ease-out) / Bottom sheet slide up (250ms)
- Follow-up chat expansion: Full chat UI slides up over the report

---

## AI Tutor Integration

### Entry Points

1. **Generate Button** — The primary AI interaction. The entire report generation flow is powered by the AI Tutor. When the user clicks "Generate", the AI analyzes their data and produces the review.

2. **"Ask AI" Per-Item Buttons** — Throughout the report, each major section has an "Ask AI" or "Tell me more" button:
   - Strengths: "Why is my reading improving faster than listening?"
   - Weaknesses: "How can I fix my writing coherence?"
   - Repeated Mistakes: "Explain the article usage pattern in detail"
   - Vocabulary: "Which words should I focus on mastering?"
   - Skill Progress: "How do I improve my grammar from 55%?"
   - Recommendations: "Create a detailed study plan for recommendation #3"

3. **Follow-Up Questions Section** — The dedicated section at the bottom of the page for asking contextual follow-up questions after reading the report.

4. **Proactive Review Integration** — If a weekly or monthly proactive review exists in `ProactiveMessageStorage` for the current period, surface a banner:
   - "📬 An AI progress review was auto-generated for this period. [View Auto-Review]"
   - Tapping the banner loads the proactive review content

5. **Floating AI Tutor Popup** — The persistent AI Tutor FAB is available on this page. When the user opens the tutor from this page, the report context is passed so the AI knows what was just reviewed.

### Chat Context Payload

When opening the AI Tutor from a follow-up question or per-item "Ask AI" button:

```json
{
  "context": "progress-review",
  "period": {
    "start": "2026-03-01",
    "end": "2026-03-31"
  },
  "reportSummary": {
    "totalStudyMinutes": 1470,
    "totalSessions": 18,
    "daysActive": 24,
    "currentBand": 6.5,
    "targetBand": 7.5,
    "trend": "improving"
  },
  "selectedSection": "weaknesses",
  "selectedItem": "Writing coherence needs work"
}
```

For a general follow-up:

```json
{
  "context": "progress-review-followup",
  "period": {
    "start": "2026-03-01",
    "end": "2026-03-31"
  }
}
```

### Proactive Review Integration

If the user has enabled auto-weekly or auto-monthly reviews (`autoWeeklyReview` / `autoMonthlyReview` in `ProactiveSettings.tsx`), the AI Progress Review page should:

1. **Poll for pending proactive reviews** on page load
2. **Surface a banner** if a new auto-generated review is available:
   - "📬 Your weekly AI review is ready! [View Now] [Dismiss]"
3. **Merge proactive review data** into the on-demand review display
4. **Mark proactive review as read** when viewed

### AI Feature States

| State | Display |
|-------|---------|
| AI available, generating | Phase-based progress with task list and AI icon animation |
| AI available, report ready | Full report with "AI Tutor Says" branding and narrative style |
| AI not configured | "AI Tutor Not Set Up" error with configure action |
| AI call failed | "Could Not Complete" error with retry + data summary fallback |
| AI offline | Generate button disabled, show cached report if available |
| AI parsing error | "Unexpected response" error with retry |
| Proactive review available | Banner notification with "View Now" action |
| Proactive review viewed | Merged into report display |

### AI Report Generation Flow

```
1. User selects period → period control updates
2. User clicks "Generate" → loading phase begins
3. Phase 1: Collect data from 9 storage collections (tasks, reading, listening,
   writing, speaking, vocabulary, vocab reviews, mistakes, progress records)
4. Phase 2: Build AI prompt via buildAiPrompt() with all collected data
5. Phase 3: Call AI via callAI(systemPrompt, userPrompt, aiConfig)
   - System prompt: Act as IELTS tutor, be specific/honest/encouraging/actionable
   - User prompt: Structured data dump with skill stats, mistakes, vocabulary, consistency
6a. AI success: Parse JSON response, validate required fields → build report
6b. AI failure: Fall back to buildReportFromData() data-driven report
7. UI renders report with appropriate styling (AI vs. data-driven indicator)
8. User can save, export, or ask follow-up questions
```

---

## Accessibility Notes

1. **Report structure**: Each report section uses semantic HTML: `<section>` with `aria-labelledby` pointing to the section title. The overall report container has `role="region"` and `aria-label="AI progress review report"`.

2. **Live region for generation**: The entire generation status area uses `aria-live="polite"` so screen readers announce phase transitions. The final report uses `aria-live="assertive"` to announce completion.

3. **Section navigation**: A skip-link or "Jump to section" navigation at the top of the report allows keyboard users to quickly navigate to specific sections (Summary, Strengths, Weaknesses, Mistakes, Vocabulary, Skills, Plan, Recommendations, Feedback).

4. **Collapsible sections**: Each collapsible section uses `<button>` with `aria-expanded="true/false"` and `aria-controls` pointing to the section content. The button text includes the section name and current state.

5. **Progress bars**: All progress/accuracy bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label` describing the metric (e.g., "Reading accuracy: 78 percent").

6. **Table accessibility**: The Skill Progress table uses proper `<table>`, `<thead>`, `<th>`, `<tbody>`, `<tr>`, `<td>` semantics with `scope` attributes on headers. On mobile (card layout), each card uses `role="article"` with consistent labeling.

7. **Trend indicators**: Arrows (↑/↓/→) include `aria-hidden="true"` with text alternatives in `aria-label` (e.g., `aria-label="Improving 8 percent"`). Color is not the only visual indicator — trend text ("improving", "declining", "stable") accompanies arrows.

8. **Action buttons**: "Practice", "Review", "View Mistakes", "Start" — all use descriptive `aria-label` beyond just the button text: "Practice reading exercises", "Review vocabulary words", etc.

9. **Generate button loading**: During generation, the button is `aria-disabled="true"` and its text updates for each phase. A `role="status"` region announces each phase change.

10. **Follow-up questions**: Suggested question chips are `<button>` elements with descriptive text. The input field has `aria-label="Ask a follow-up question about your progress"`.

11. **Keyboard navigation**: All interactive elements are keyboard-accessible. Tab through sections in report order (Skip nav → Period controls → Generate → Each section → Follow-up actions). Arrow keys navigate within the skill table.

12. **Focus management**:
    - When report generation completes, focus moves to the "AI Tutor Says" section heading
    - When a period changes, focus moves to the Generate button
    - When an "Ask AI" button is clicked, focus moves to the AI Tutor chat input
    - When the history panel opens, focus moves to the first history item
    - When the history panel closes, focus returns to the History button

13. **Reduced motion**: Respect `prefers-reduced-motion`. Staggered slide-in animations become simple fade-in. Progress bar animations become instant transitions. Skeleton shimmer effects become static grey blocks.

14. **Color independence**: Status indicators (Strong, Developing, Needs work) use text labels in addition to color. Trend arrows include text descriptions. The AI report narrative provides the primary meaning, with visual styling as enhancement.

15. **Error announcements**: Errors use `role="alert"` and `aria-live="assertive"` so screen readers announce them immediately. Error recovery options are described in the error message.

16. **Screen reader announcements**:
    - Report generation: "Collecting your study data" → "AI Tutor is analyzing" → "Building your report" → "Report ready"
    - Period change: "Review period changed to last 30 days"
    - Report saved: "Progress report saved"
    - Report exported: "Report exported as PDF"

---

## Components Needed

### From Component System (Existing or New)

| Component | Type | Usage |
|-----------|------|-------|
| Button | Existing | Generate, Save, Export, Practice, Action buttons throughout |
| IconButton | Existing | Back navigation, export, history, share, close |
| Card | Existing | Report sections, stat containers, recommendation items |
| Badge | Existing | Status badges (Strong, Developing, Needs work), frequency badges, skill badges |
| Input | Existing | Follow-up question input |
| Select | Existing | Period selector (custom range), history selector |
| DatePicker | New | Custom date range selection (two date inputs or calendar picker) |
| Modal | Existing | Period comparison view settings |
| Drawer | New | Report history side panel (desktop) |
| BottomSheet | New | Report history panel (mobile), custom date range picker |
| Toast | Existing | Save confirmation, export status, error feedback |
| Tabs | Existing | (Optional) section navigation within the report |
| ProgressBar | Existing | Accuracy bars, vocabulary mastery bar |
| ProgressRing | New | Overall mastery percentage ring (vocabulary section) |
| EmptyState | Existing | No report, no data, insufficient data states |
| LoadingSkeleton | New | Report section skeletons, skill table skeletons, generation progress UI |
| ErrorState | Existing | AI failure, data loading failure, not configured errors |
| SkillCard | New | Individual skill row in the progress table, mobile variant as compact card |

### New Components to Create

1. **PeriodSelector** — Segmented button group with 7/30/90/Custom options, custom range expands to date inputs, shows computed date range label. Variants: inline (desktop), scrollable pills (mobile).

2. **GenerationProgress** — Multi-phase progress display with task list (3-4 steps), animated step transitions, estimated time, AI icon animation. Phases: Collecting → Analyzing → Building → Complete. Also: fallback (no AI) variant without the AI icon.

3. **AIProgressReport** — The main report container, orchestrating all report sections. Handles report state (empty, loading, ready, error), staggered section animation, collapse/expand, and scroll-to-section.

4. **SummarySection** — "AI Tutor Says" card with narrative paragraph text, AI icon, and mini stats row (3 stat chips). Variants: AI-generated (with AI branding), data-driven (without AI branding), insufficient-data (minimal).

5. **StrengthsWeaknessesSection** — Side-by-side panels (desktop) or stacked sections (mobile) showing improvement items and areas needing attention. Left panel: green success accent, right panel: amber/red warning accent. Expandable for long lists.

6. **RepeatedMistakesList** — List of repeated mistake pattern cards, each with pattern name, skill badge, frequency badge, analysis text, trend indicator, and action buttons. Empty state for no patterns.

7. **VocabularyStatusSection** — Stats row (3 numbers), mastery progress bar with gradient fill, and AI recommendation card with "Review Words" action.

8. **SkillProgressTable** — Table (desktop) or card list (mobile) showing all 6 IELTS skills with status badge, trend arrow, accuracy bar, sessions count, and action link. Interactive rows for drill-down. Empty/insufficient states per skill.

9. **StudyPlanAdherenceSection** — Card with narrative assessment, stat chips (3-4 metrics), and AI suggestion for plan adjustment. "Adjust Study Plan" action button.

10. **RecommendationsList** — Numbered list of recommendation cards (1-5), each with title, description, expected impact note, time estimate, and "Start" action button. "Add all to plan" bulk action at bottom.

11. **TutorFeedbackSection** — Card with left accent border, AI Tutor icon, "AI Tutor's Final Note" label, and personalized encouraging message.

12. **FollowUpActions** — Action buttons row (Save, Export, Share, Compare, Regenerate) + suggested questions chips row + input field for custom questions. States: report-ready, no-report.

13. **ReportHistoryPanel** — Side panel (desktop) or bottom sheet (mobile) listing past saved reports with date, period, and summary preview. "Load Report" action on each item. Empty state for no history.

14. **SectionNavigation** — Sticky or floating "Jump to section" nav that appears when scrolling through a long report. Compact pill-style links: Summary, Strengths, Weaknesses, Mistakes, Vocabulary, Skills, Plan, Recommendations, Feedback.

### Component States Matrix

| Component | Default | Active | Hover | Focus | Disabled | Loading | Error | Empty |
|-----------|---------|--------|-------|-------|----------|---------|-------|-------|
| PeriodSelector | Period selected | Active pill | Pill highlight | Focus ring | Generating | — | — | — |
| GenerationProgress | Hidden | — | — | — | — | Steps animating | Phase failed | — |
| AIProgressReport | Report visible | — | — | Focus within | — | Skeleton sections | Error banner | CTA illustration |
| SummarySection | Narrative visible | — | — | — | — | Skeleton text | — | — |
| StrengthsWeaknesses | Items listed | — | Item hover | Item focus | — | Skeleton pillars | — | "No items" message |
| RepeatedMistakesList | Cards listed | — | Card elevation | Card focus | — | Skeleton cards | Pattern load error | "No patterns" |
| VocabularyStatusSection | Stats+bar visible | — | — | — | — | Skeleton stats | Load error | "No vocabulary" |
| SkillProgressTable | Table visible | Row expanded | Row hover | Row focus | — | Skeleton rows | Load error | "No skills" |
| StudyPlanAdherence | Card visible | — | — | — | — | Skeleton card | Load error | "No plan" |
| RecommendationsList | Items listed | — | Item hover | Item focus | — | Skeleton items | — | "No recs" |
| TutorFeedbackSection | Message visible | — | — | — | — | Skeleton text | — | Generic message |
| FollowUpActions | Buttons+chips | Button pressed | Button hover | Button focus | Generating | Save/export progress | Action failed | Hidden |
| ReportHistoryPanel | Items listed | Item selected | Item hover | Item focus | — | Skeleton list | Load error | "No history" |

---

## Data Displayed

| Data Point | Source | Type | Display |
|-----------|--------|------|---------|
| Period start/end | DateRange state | ISO date strings | "Mar 1 – Mar 31, 2026" |
| Total tasks | TaskEntry[] count | number | Stat: "18 sessions" |
| Total study minutes | TaskEntry[] sum | number | Stat: "24.5 hrs" |
| Days active | Unique dates | number | Stat: "15 days active" |
| Overall summary | AI generated | string (3-5 sentences) | Narrative paragraph |
| Improvements | AI generated | string[] (3-5 items) | Bullet list with checkmarks |
| Struggles | AI generated | string[] (3-5 items) | Bullet list with warnings |
| Repeated mistake patterns | AI generated | {pattern, skill, frequency, analysis}[] | Card list with badges |
| Vocab total saved | vocabulary.length | number | Stat: "156 words" |
| Vocab mastered | vocabReviews + logic | number | Stat: "84 mastered" |
| Vocab still learning | total - mastered | number | Stat: "72 learning" |
| Vocab mastery % | computed | number (0-100) | Progress bar: "54%" |
| Vocab recommendation | AI generated | string | Callout card with action |
| Skill name | SkillProgressItem.skill | string | Table/card row |
| Skill status | SkillProgressItem.status | string | Badge: "Strong", "Developing", "Needs work" |
| Skill trend | SkillProgressItem.trend | string | Arrow + "% change" |
| Skill accuracy | SkillProgressItem.accuracy | number (0-100) | Progress bar + percentage |
| Skill sessions | SkillProgressItem.sessions | number | Count |
| Study plan adherence | AI generated | string | Narrative paragraph |
| Plan completion % | computed | number (0-100) | Stat chip: "68%" |
| Planned vs actual hours | computed | {planned, actual} | Stat: "24.5 / 36 hrs" |
| Recommendations | AI generated | string[] (5 items) | Numbered list with action buttons |
| Tutor feedback | AI generated | string (2-4 sentences) | Card with AI icon |
| Report history | localStorage | {date, period, summary}[] | Side panel / bottom sheet list |
| Data source indicator | service.ts return | "ai" | "data-fallback" | Badge: "AI-Powered" or "Data Summary" |

---

## Design Notes Inspired by the Reference

1. **Conversational tone, not report tone** — The Dribbble reference shows educational UI with a warm, conversational interface. The AI Progress Review should read like a tutor talking to a student, not like an analytics dashboard printout. Use contractions ("you're", "you've", "don't"), second-person address, and encouraging phrases.

2. **Gradient card headers for visual hierarchy** — Each report section should have a subtle gradient header (from skill color tint to transparent) at the top of its card, creating a visual entry point. The Strengths section could have a green-tinted gradient, Weaknesses an amber-tinted gradient.

3. **Avatar or visual identity for AI Tutor** — The "AI Tutor Says" section should have a distinct visual identity: a small circular avatar (robot face, sparkle icon, or friendly mascot), a colored accent (purple or primary), and a distinct card style (left accent bar, slight elevation, subtle glow). This makes the AI feel like a person, not a feature.

4. **Narrative-first, data-second** — Lead with the story ("Your reading accuracy improved significantly this month") and show the data as supporting evidence ("from 65% to 78%"). The current report does this well in the narrative section but loses it in the table-heavy skill progress section.

5. **Soft celebratory elements** — When a report is first generated, subtle celebration micro-interactions: a brief confetti-style animation on the "AI Tutor Says" card, a gentle pulse on improvement items, and a green glow on positive metrics. These should be tasteful and fast (< 1 second).

6. **Spaced readability** — The reference uses generous whitespace between content blocks. Each report section should have ample padding (24-32px), clear visual separation via card borders or background color changes, and comfortable line heights (1.6-1.8) for narrative text.

7. **Progressive disclosure for large sections** — The Skill Progress table shows 6 skills, which is manageable. But if the user has many recommendations or repeated mistakes (e.g., 10+ patterns), use progressive disclosure: show top 3-5 with "Show more" expandable. The Dribbble reference manages information density without overwhelming the user.

8. **AI personality in feedback** — The Tutor's Final Feedback should have a unique, warm tone that distinguishes it from the analytical sections. Consider a slightly different card style: softer shadow, rounded corners, a background tint (very light purple or primary at 5% opacity), and an illustration or icon that makes it feel like a personal note.

9. **Visual connection to Learning Progress page** — The AI Progress Review should reference the visual language of the Learning Progress page. For example, the Skill Progress section uses the same skill colors, the same trend arrow styles, and the same status badges. Users who visit both pages should feel they're in the same product.

10. **Data source indicator** — The reference does not show "AI vs. Not AI" labels, but for transparency, the report should include a subtle indicator of whether it was AI-generated or a data-driven fallback. A small badge "AI-Powered" (with sparkle) or "Data Summary" (with chart icon) in the report header footer. This builds trust — users know what they're reading.

11. **Actionable recommendations as cards** — Each recommendation in the numbered list should feel like a card you can take action on, not just text. The Dribbble reference uses icon + title + description card patterns for actionable items. Each recommendation card should have a visual affordance for clicking/tapping.

12. **Smooth transitions between states** — The transition from "loading" to "report ready" should feel fluid and satisfying. Sections stagger in, numbers count up, progress bars animate. The Dribbble reference uses smooth animations throughout to make the UI feel polished and premium.

13. **Report as a scrollable narrative** — The report should feel like reading a personalized letter or email from a tutor, with natural section breaks and a clear beginning (summary) → middle (analysis) → end (recommendations + final note). Users should feel they've read a coherent story, not a collection of data points.

14. **Mobile-first paragraph length** — On mobile, narrative paragraphs should be shorter (2-3 sentences max) with generous line spacing. The reference's mobile design uses compact, scannable text blocks rather than long paragraphs. Consider a "Read more" expandable for long AI narrative sections on mobile.

15. **Follow-up questions as natural conversation starters** — The suggested questions at the bottom should feel like natural continuations of the report's content: "Tell me more about..." rather than generic "Ask a question" prompts. The Dribbble reference shows how contextual prompts make AI feel more integrated and intelligent.
