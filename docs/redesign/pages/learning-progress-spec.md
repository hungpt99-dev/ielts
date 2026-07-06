# IELTS Journey — Learning Progress Page Specification

## Page Purpose

The Learning Progress page is the dedicated analytics and metrics hub for the IELTS Journey app. While the dashboard provides a quick daily snapshot ("What should I study today?"), the Learning Progress page offers deep, historical, and comparative views of the user's entire learning journey. It answers questions like "How much have I improved this month?", "Which skill is holding me back?", "Am I studying enough?", and "Will I reach my target band by exam day?" The page transforms raw study data (tasks, sessions, vocabulary, mistakes, mock tests) into clear, visual, motivating progress narratives.

This page is the "report card" of the IELTS Journey — designed to make users feel proud of their effort, informed about their trajectory, and motivated to address weak areas.

## User Goal

Users should feel, when using the Learning Progress page:

- **Proud** — Seeing cumulative study hours, streak length, and band progress creates a sense of accomplishment
- **Informed** — Skill breakdowns and trend indicators reveal exactly where they are improving and where they are stagnating
- **Urgent** — Exam countdown and target band gap create healthy motivation to maintain or increase effort
- **Guided** — Vocabulary retention rates, mistake trends, and study plan completion suggest clear next actions
- **Confident** — Progress charts show their trajectory is moving in the right direction, reinforcing that the daily effort is working
- **Curious** — Interactive charts and period selectors let them explore their own data at different granularities

The Learning Progress page should feel like a personal data dashboard for learning — not a dry analytics panel but a visual story of their IELTS preparation journey.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/pages/Progress.tsx:1-46`, `apps/web/src/features/progress/ProgressTracker.tsx:1-414`, `apps/web/src/features/progress/progressService.ts:1-499`, `apps/web/src/models/index.ts:646-662`, `packages/learning-engine/src/types.ts:168-176`):

1. **No page structure** — The current `Progress` page is a single `ProgressTracker` component that renders all sections in a stacked grid layout (`mx-auto max-w-6xl space-y-6`). There is no page header, no title, no back navigation, no period selector, no section organization. It is purely a layout container with no informational hierarchy.

2. **No period/date range control** — The page always shows data for the most recent 8 weeks (weekly progress) and last 6 months (monthly summary). Users cannot select a custom date range, view specific months, or compare different periods. The AI Progress Review feature (`ProgressReviewPanel.tsx`) has a period selector, but it exists on a separate page.

3. **Summary cards are generic stat counters** — `SummaryCards` renders four `StatCard` components (Total Study Hours, Tasks Completed, Study Streak, Vocabulary). Each card shows the same pattern (label, value, unit). No trend direction, no comparison to goals, no visual distinction between celebratory stats (streak) and neutral stats (tasks). The color prop is hardcoded in the parent call, not data-driven.

4. **Weekly chart is split into two separate bar charts** — The `WeeklyProgressChart` renders two `BarChart` components side by side: one for days active per week, one for total minutes per week. This separation is confusing — users must mentally correlate two charts to understand their weekly effort. No combined view (e.g., stacked bars or a single chart with dual axes for days and hours).

5. **Skill progress uses only horizontal bars** — `SkillProgressChart` renders each skill as a horizontal progress bar with a `TrendBadge`. There is no target band overlay, no comparison to previous period, no interactive drill-down into a skill's history. The component shows "sessions" and "minutes" as small text but does not contextualize whether those numbers are good or bad.

6. **Skill balance uses a donut chart with session count** — `SkillBalanceChart` uses a `PieChart` with `innerRadius={50}` (donut). The data key is session count, which biases toward frequently-practiced skills rather than time-invested or improvement rate. Session count can be misleading (5 quick reading exercises vs. 1 long writing session).

7. **Monthly summary is a simple card list** — `MonthlySummaryChart` renders a reverse chronological list of cards with month name and four stat lines. No chart visualization, no trend line, no comparison between months. The data structure (`MonthlySummary`) contains `totalHours`, `sessions`, `vocabLearned`, `mockTests`, `avgBand` — but the rendering treats each month as an isolated card rather than showing progression over time.

8. **Weak skills ranking has no context** — `WeakSkillsCard` renders mistake counts per skill as a ranked list with progress bars. It shows "how many mistakes" but not "how severe", "what kind", or "what to do about it". The `WeaknessReport` type in the learning engine includes `WeakSkill` with `severity` (`low | medium | high`), but the progress page only shows a flat count.

9. **Recent activity is limited and text-only** — `RecentActivity` shows up to 10 entries from the last 7 days as text rows with a single-character icon. No timestamps, no ability to click into the activity, no filtering by type. The activity computation (`computeRecentActivity`) only considers tasks, vocabulary saves, and reading sessions — ignoring listening, writing, speaking, mock tests, and mistake entries.

10. **No vocabulary retention visualization** — The snapshot includes `vocabLearned` and `vocabReviewed` totals, but there is no retention chart, no vocabulary growth over time, no mastery breakdown (new / learning / reviewing / mastered as defined in `AIProgressReviewData.vocabularyStatus`). The learning engine's `VocabularyStatus` type has structured progress data that the progress page never uses.

11. **No exam countdown display** — The `ProfileData` type includes `examCountdownDays`, and the dashboard shows it as a badge, but the progress page has no exam countdown at all. Users visiting the progress page cannot see how many days remain until their exam.

12. **No study plan completion rate** — The `roadmapProgress` field (0-100) is shown in `RoadmapProgressBar`, but this is the only "plan completion" metric. There is no daily/weekly task completion rate, no plan adherence percentage, no comparison between planned study time and actual study time.

13. **Loading, error, and empty states are minimal** — The loading state is a single spinner, the error state is a red text message in a centered card, and the empty state is a single muted text line ("No progress data available."). No skeleton loaders matching the content layout, no friendly empty state with illustration, no retry mechanism for errors.

14. **No AI Tutor integration on the progress page** — The progress page is purely a data display with no AI Tutor entry point. Users cannot ask "Why is my writing score not improving?" or "Based on my progress, what should I focus on?" directly from the progress page. The AI Progress Review is a completely separate feature.

15. **No chart interactivity** — Charts use Recharts `Tooltip` for hover information, but there is no click-to-filter, no zoom, no period range adjustment, no ability to hide/show data series. The charts are static snapshots.

16. **No mobile optimization** — The grid layout (`grid gap-6 lg:grid-cols-3`, `lg:grid-cols-2`) stacks on small screens but does not adapt the content density. Charts at 200px height may be too small on mobile. Stat cards in a 4-column grid feel cramped on mobile (2-column at `sm:` breakpoint).

---

## Proposed Layout

The learning progress page is organized into four distinct zones, each answering a specific user question:

```
┌──────────────────────────────────────────────────┐
│  Header: Learning Progress                        │
│  [Period Selector] [AI Review Button]             │
├──────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐│
│  │ ZONE 1: Quick Stats Bar                      ││
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐││
│  │ │Study │ │Band  │ │Streak│ │Vocab │ │Exam  │││
│  │ │Hours │ │Target│ │🔥    │ │Words │ │Count │││
│  │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌───────────────────────┐ ┌───────────────────┐ │
│  │ ZONE 2: Band &        │ │ ZONE 3: Skill     │ │
│  │ Skill Progression     │ │ Breakdown Cards   │ │
│  │ (Line Chart)          │ │ ┌──┐ ┌──┐ ┌──┐   │ │
│  │                       │ │ │Rd│ │Lt│ │Wr│   │ │
│  │ IELTS band target ██  │ │ └──┘ └──┘ └──┘   │ │
│  │ Overall     ██████    │ │ ┌──┐ ┌──┐ ┌──┐   │ │
│  │ Listening   ██████    │ │ │Sp│ │Vb│ │Gr│   │ │
│  │ Reading     ██████    │ │ └──┘ └──┘ └──┘   │ │
│  └───────────────────────┘ └───────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐│
│  │ ZONE 4: Study Activity (Weekly Chart)        ││
│  │ ┌──────────────────────────────────────────┐ ││
│  │ │ 📊 Minutes per Day / Tasks Completed     │ ││
│  │ └──────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────┘│
│                                                   │
│  ┌───────────────────────┐ ┌───────────────────┐ │
│  │ ZONE 5: Vocabulary    │ │ ZONE 6: Mistake   │ │
│  │ Retention & Growth    │ │ Trends & Patterns │ │
│  │ ┌─────────────────┐   │ │ ┌───────────────┐ │ │
│  │ │ Radial / Pie     │   │ │ │ Trend Chart   │ │ │
│  │ │ Mastery Status   │   │ │ │ & Top Errors  │ │ │
│  │ └─────────────────┘   │ │ └───────────────┘ │ │
│  └───────────────────────┘ └───────────────────┘ │
│                                                   │
│  ┌───────────────────────┐ ┌───────────────────┐ │
│  │ ZONE 7: Study Plan    │ │ ZONE 8: Recent    │ │
│  │ Adherence             │ │ Activity Feed     │ │
│  │ ┌─────────────────┐   │ │ ┌───────────────┐ │ │
│  │ │ Completion %    │   │ │ │ Activity list │ │ │
│  │ │ & next milestone│   │ │ │ with timestamps│ │ │
│  │ └─────────────────┘   │ │ └───────────────┘ │ │
│  └───────────────────────┘ └───────────────────┘ │
└──────────────────────────────────────────────────┘
```

On mobile, zones stack vertically in a single column, with charts full-width and stat cards in a 2-column grid.

---

## Main Sections

### Section 1: Page Header

**Purpose**: Orient the user, provide period control, and offer an entry point to the AI Progress Review.

**Content**:
- Page title: "Learning Progress" (or localized equivalent)
- Subtitle showing the current date range being viewed (e.g., "Last 30 days" or "March 2026")
- Period selector dropdown / segmented control with options: "7 days", "30 days", "90 days", "All time", "Custom range"
- "AI Progress Review" button — navigates to the AI Progress Review flow with the selected period pre-applied
- "Export Data" icon button for data export

**States**:
- Default: Shows the last 30 days by default
- Period change: Smoothly animates all chart and stat transitions to the new period

**Accessibility**:
- Period selector is a `<select>` or button group with `aria-label="Select time period"`
- AI Review button has `aria-label="Generate AI progress review for selected period"`

---

### Section 2: Quick Stats Bar

**Purpose**: Give users an immediate overview of their key metrics — the "vital signs" of their IELTS preparation.

**Content**: Five stat cards in a horizontal row, each showing:
1. **Study Hours** — Total study hours in the selected period (e.g., "24.5 hrs"). Icon: clock. Trend arrow if comparing to previous period.
2. **Band Progress** — Current estimated band vs. target (e.g., "6.5 / 7.5"). Icon: target or graduation cap. Visual mini-progress bar showing the gap.
3. **Study Streak** — Current streak in days (e.g., "12 days 🔥"). Icon: flame. Also shows longest streak as secondary text.
4. **Vocabulary Words** — Total vocabulary words saved (e.g., "156 words"). Icon: book. May show breakdown as "84 mastered".
5. **Exam Countdown** — Days until exam (e.g., "67 days"). Icon: calendar. Color-coded: green (>60 days), amber (30-60 days), red (<30 days).

**Visual Style**:
- Each card is a rounded rectangle with a subtle background (`color.surface.card`), a row layout with icon on the left and value on the right
- The large number is the primary focal point, with a small label underneath
- Trend indicators (↑ / ↓ / →) in green, red, or muted gray

**States**:
- *Data available*: Shows real values with trend indicators where applicable
- *No data*: Shows "0" or "--" with a muted label like "Start studying to track hours"
- *Loading*: Skeleton rectangles matching each card's dimensions

**Accessibility**:
- Each stat card is a `<div>` with `role="status"` and `aria-label` describing the stat (e.g., "Study hours: 24.5, improved 15% from last period")
- Trend arrows include `aria-hidden="true"` with text alternative in `aria-label`

---

### Section 3: Band & Skill Progression Chart

**Purpose**: Visualize the user's IELTS band progress over time across all skills — the most important progress narrative.

**Visual Style**: A line chart (using the `ProgressChart` component with `type="line"`, or a dedicated `BandProgressionChart` component) that shows:
- X-axis: Time (weeks or months, depending on period)
- Y-axis: IELTS band score (0-9)
- Lines: One line per skill (Reading, Listening, Writing, Speaking) plus a thicker, highlighted line for Overall band
- Target band: A horizontal dashed line across the chart representing the user's target
- Current band: A dot or marker on the most recent data point

**Data**: Uses the `BandProgress` type from the learning engine (`packages/learning-engine/src/types.ts:168-176`), which contains `date`, `overall`, `listening`, `reading`, `writing`, `speaking`. The user's profile provides `targetBand` and `currentBand`.

**Interactivity**:
- Hover on a data point shows a tooltip with: date, skill name, band score, and change from previous period
- Click on a skill name in the legend toggles that skill line visibility
- Pinch-to-zoom on mobile (or range slider on desktop) to focus on a specific time window

**Empty State**: "No band progress data yet. Take a mock test or practice session to see your band progression."

**Loading State**: Skeleton line chart matching the chart dimensions.

**Accessibility**:
- Chart has `role="img"` and `aria-label` describing the chart as "Band progression chart showing [skills] over [period]"
- Data is also available in a hidden table below the chart for screen reader access

---

### Section 4: Skill Breakdown Cards

**Purpose**: Provide a quick visual overview of each skill's current status — accuracy, trend, and practice volume.

**Content**: Six skill cards arranged in a 3x2 grid, one for each IELTS skill (Reading, Listening, Writing, Speaking, Vocabulary, Grammar).

Each card contains:
- **Skill name and icon** — e.g., 🎧 Listening
- **Accuracy percentage** — Large number with trend arrow (e.g., "72% ↑")
- **Trend badge** — Improving / Declining / Stable (using the current `TrendBadge` component pattern)
- **Mini progress ring** — Circular visual showing accuracy as a percentage of mastery
- **Sessions count** — "12 sessions"
- **Time invested** — "4.5 hours"
- **Chip/status** — "Weak" (red), "Developing" (amber), "Strong" (green), "Mastered" (blue) based on accuracy thresholds
- **Action link** — "Practice now" or "View details" linking to the relevant practice page

**Visual Style**: Each card is a compact rounded card with a subtle left border colored by skill (consistent with IELTS skill colors from the theme tokens). The progress ring is small (40px diameter) and sits next to the accuracy number.

**States**:
- *Active*: Shows full data with trend and recommendations
- *No sessions*: Shows "No sessions yet" with a "Start practicing" action button
- *Loading*: Skeleton card with pulsing rectangles

**Accessibility**:
- Each card is a `<article>` with `aria-label="Reading skill: 72 percent accuracy, improving"`
- Progress rings include `role="progressbar"` with `aria-valuenow` and `aria-valuemax`

---

### Section 5: Study Activity Chart

**Purpose**: Visualize study consistency — minutes studied per day and tasks completed — over the selected period.

**Visual Style**: A combined bar/line chart (using the `ProgressChart` component or a dedicated `StudyActivityChart`):
- X-axis: Days (or weeks for longer periods)
- Primary Y-axis (left): Minutes studied — stacked bars colored by skill (Reading=blue, Listening=green, Writing=purple, Speaking=orange, Vocabulary=amber, Grammar=pink)
- Secondary Y-axis (right): Tasks completed — a line overlay showing task count per day
- Target line: Dashed horizontal line showing the user's daily study goal (from settings)
- Annotations: Markers for "Streak day" (fire emoji), "Missed day" (grey dot), "Mock test day" (star)

**Data**: Comes from `WeeklyProgressSummary` and `DayProgress` in the snapshot, combined with daily task data from `getWeeklyChartData()`.

**Interactivity**:
- Hover shows a tooltip with: date, minutes per skill, total minutes, tasks completed
- Click on a day opens today's study plan or shows that day's activity detail

**Empty State**: "No study activity yet. Start your first lesson to see your weekly activity chart."

**Loading State**: Skeleton bar chart.

---

### Section 6: Vocabulary Retention & Growth

**Purpose**: Show vocabulary learning progress — how many words saved, their mastery status, and growth over time.

**Content**: A split panel with two visualization approaches:

**Left: Mastery Breakdown (Radial/Pie Chart)**:
- Uses the `ProgressChart` component with `type="radial"` or `type="donut"`
- Segments: New (blue), Learning (amber), Reviewing (purple), Mastered (green)
- Center text: Number of mastered words / total words

**Right: Vocabulary Growth (Line/Bar Chart)**:
- X-axis: Time (weeks)
- Y-axis: Word count
- Two lines: Cumulative words saved (total) and cumulative words mastered
- Shows vocabulary acquisition rate

**Data**: Uses vocabulary status data. The learning engine's `VocabularyStatus` type defines `total`, `new`, `learning`, `reviewing`, `mastered`. The snapshot provides `vocabLearned` and `vocabReviewed`.

**Empty State**: "No vocabulary saved yet. Start saving words from your reading and listening practice." Action button linking to Vocabulary Notebook.

---

### Section 7: Mistake Trends & Patterns

**Purpose**: Visualize mistake trends over time and highlight the most common error patterns.

**Content**:
- **Mistake trend chart**: A line chart showing mistake accumulation rate and resolution rate over time. Green line for "Resolved", red line for "New mistakes", with the gap showing the active mistake backlog.
- **Top mistake patterns**: A ranked list of the most frequent mistake types (e.g., "Verb tense errors" — 12 times). Each item shows the skill, pattern description, frequency, and a "Practice" action.
- **Resolution rate metric**: A stat card showing "Resolved" / "Total" with a percentage and trend.

**Data**: Uses `WeaknessReport` with `weakSkills`, `repeatedMistakes`, and `frequentMistakeCategories`. Mistake data from `MistakeEntry` records with timestamps.

**Empty State**: "No mistakes logged yet — that means you're practicing well!" Positive framing to encourage mistake logging.

---

### Section 8: Study Plan Adherence

**Purpose**: Show how well the user is following their AI-generated study plan.

**Content**:
- **Completion percentage**: A large progress ring showing overall plan completion (0-100%)
- **Daily adherence**: A mini heatmap or 7-day calendar showing which days met their planned study time (green = met, amber = partial, grey = missed)
- **This week's target**: "Planned: 10.5h / Actual: 7.2h (69%)"
- **Next milestone**: "Next milestone: Complete Phase 2 — 3 tasks remaining"
- **Action**: "Adjust plan" button linking to study plan

**Data**: Uses `roadmapProgress` from the snapshot, daily plan vs. actual data from `DailyPlan` and `TaskEntry` records.

**Empty State**: "No study plan yet. Generate an AI study plan to track your adherence." Action button linking to AI Study Plan Generator.

---

### Section 9: Recent Activity Feed

**Purpose**: Show the most recent learning actions so users can see what they've accomplished.

**Content**: A scrollable list of recent activity entries, each showing:
- **Icon/emoji** — Type-specific visual (task ✓, vocab W, session ▶, review ↻, mistake ✕, mock test 🎯)
- **Title** — Activity description (e.g., "Completed Reading Passage: Climate Change")
- **Timestamp** — Relative time ("2 hours ago", "Yesterday")
- **Skill badge** — Small badge showing the skill category

**Data**: Enhanced version of the snapshot's `recentActivity` array, expanded to include all session types (listening, writing, speaking, mock tests, mistakes).

**Limit**: Show last 20 entries with a "View all" link for full history.

**Empty State**: "No recent activity. Start studying to build your activity history."

---

## Primary Actions

1. **Change period** — The primary interactive control. All charts and stats update to reflect the selected time range. A smooth animation bridges old and new data to avoid jarring transitions.

2. **Go to AI Progress Review** — Primary button in the header that navigates to the dedicated AI Progress Review page with the selected period pre-applied. This connects the data view with the AI analysis view.

3. **Practice weak skill** — Each skill breakdown card has a "Practice now" link that navigates to the relevant practice page, optionally pre-filtered for that skill.

4. **View vocabulary detail** — The vocabulary section's "View all words" link navigates to the Vocabulary Notebook.

5. **Adjust study plan** — The study plan adherence section links to the study plan generator or roadmap page.

6. **Export data** — An icon button in the header that triggers data export (JSON or CSV format for the visible period).

---

## Secondary Actions

1. **Hide/show chart series** — Clicking legend items toggles visibility of individual data series (e.g., hide Listening to focus on other skills).

2. **Jump to date** — In the activity chart, clicking a specific day navigates to that day's study plan.

3. **Save chart as image** — Long-press or right-click context menu on charts allows saving as PNG (for sharing progress).

4. **Share progress** — Share button that generates a shareable summary card (streak, hours, band progress) for social media or study groups.

5. **Compare period** — A "Compare with previous period" toggle that overlays the previous period's data as a faint background on charts.

---

## Empty State

**When**: No study data exists for the selected period (new user, or no activity logged).

**Visual**: A centered, friendly illustration (e.g., an open book with sparkles, or a progress chart with no data) with:

- **Title**: "Your Progress Story Starts Here"
- **Body**: "Every lesson, every practice session, every saved word builds your IELTS journey. Start studying to see your progress charts come to life."
- **Actions**:
  - "Start Your First Lesson" → Navigates to Today's Study Plan
  - "Set Your Target Band" → Navigates to profile settings
- **Tip**: "Already studying? Make sure your study data is being saved. Check your settings if progress doesn't appear."

**Variant — No data for selected period**: "No data for this period. Try selecting a different time range or start studying to build your history."

---

## Loading State

The page loads progressively — not as a single blocking spinner — since some data is cached locally while other data requires computation:

1. **Instant skeleton**: The page shell (header, stat card silhouettes, chart outlines) renders immediately with skeleton animations (pulsing gradients).
2. **Cached data hydrate**: If a `ProgressSnapshot` is cached (via `loadProgressSnapshot`), stat cards and simple metrics hydrate first — within 50ms.
3. **Chart data loads**: Charts compute asynchronously from raw data (`computeProgressSnapshot`). Each chart shows a skeleton placeholder until its data is ready.
4. **Full page ready**: All sections show live data. No flash of empty states during loading.

**Skeleton patterns**:
- Stat cards: Rectangular blocks of varying widths with pulse animation
- Line chart: A faint gray path outline with pulse, slowly revealing the actual path
- Bar chart: Gray bars of varying heights with pulse
- Donut/radial: A gray circle with pulse
- Activity list: Rows of two lines each (title + subtitle) with pulse

---

## Error State

**When**: Data computation fails (e.g., database read error, corrupted local data).

**Visual**: A centered card with error icon and message:

- **Title**: "Couldn't Load Progress Data"
- **Body**: "There was a problem reading your study data. This is usually a temporary issue."
- **Actions**:
  - "Try Again" → Re-runs `computeProgressSnapshot()`
  - "Clear Cache & Reload" → Clears cached snapshot and re-computes from scratch
  - "Contact Support" → Opens support page or email

**Toast notification for partial errors**: If a specific chart fails but the rest of the page loads, show a small toast: "Could not load vocabulary chart" with a retry button.

**Fallback**: If all data fails, show a degraded state with the cached snapshot data (if available) and a subtle warning banner: "Showing data from earlier today. Some data may not be up to date."

---

## Mobile Layout

On small screens (below 768px), the learning progress page adapts as follows:

1. **Stat cards**: 5 cards arranged in a 2-column grid (3 on top, 2 below), with the fifth card ("Exam Countdown") spanning full width at the bottom for prominence.

2. **Band & Skill Progression**: Full-width line chart with reduced height (200px → 180px). Legend moves below the chart. Smaller font sizes for axis labels.

3. **Skill Breakdown**: 3x2 grid collapses to 2x3 (two columns, three rows). Progress ring size reduces from 40px to 32px. Cards have less padding.

4. **Study Activity Chart**: Full-width with the bar chart at 180px height. The secondary line overlay (tasks completed) may be hidden on mobile with a toggle to show it.

5. **Vocabulary Section**: The split panel (radial + line chart) stacks vertically — radial chart on top, line chart below — each at reduced height.

6. **Mistake Trends**: Trend chart full-width. The ranked list shows only top 5 patterns with a "Show more" expandable.

7. **Study Plan Adherence**: The calendar/heatmap compresses to show only the current week. The progress ring shrinks.

8. **Recent Activity**: Full-width list, no changes needed.

9. **Header**: Period selector collapses from inline buttons to a dropdown `<select>`. The "AI Progress Review" button becomes an icon-only button with the label hidden.

10. **Charts**: All chart interactivity works via touch (tap for tooltip, swipe to scroll through time). Charts are responsive and re-render at the container width.

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|---|---|
| < 480px (small phone) | Single column, stat cards 2-col, period selector as full-width select, charts reduced height (160px) |
| 480-768px (large phone) | Single column, stat cards 2-col with 5th full-width, charts 180px height |
| 768-1024px (tablet) | 2-column grid for paired sections (vocabulary + mistakes, plan + activity), stat cards in 2 rows of 3/2 |
| 1024-1440px (desktop) | 3-column for skill breakdown, paired sections side by side, stat cards full row of 5 |
| > 1440px (wide) | Centered max-width container (1200px), full layout as described |

**General rules**:
- Charts always fill the width of their container
- Stat cards reflow from row to grid based on available width
- Section order is preserved across breakpoints
- Touch targets remain at least 44x44px on mobile

---

## AI Tutor Integration

The Learning Progress page integrates with the AI Tutor in several ways:

1. **"Generate AI Review" button** — Header button that navigates to the AI Progress Review feature with the current period pre-selected. Uses `buildLearningProgressReviewPrompt` from the AI Tutor to generate a personalized analysis.

2. **Contextual "Ask AI" buttons** — Each major section has a small "Ask AI" or "AI Insight" button:
   - Band chart: "Why is my speaking score lower than listening?"
   - Skill breakdown: "How can I improve my writing from 6.0 to 7.0?"
   - Vocabulary: "Which words should I review today?"
   - Mistakes: "What patterns do you see in my errors?"
   - Study Plan: "Am I on track for my target band?"

3. **AI insight cards** — Periodically (once per page load or once per day), the page shows a small AI-generated insight card:
   - "Your reading accuracy improved 8% this month — great work!"
   - "You've been avoiding listening practice. Try 10 minutes today."
   - "Your study consistency dropped last week. Let's get back on track."

4. **Proactive tutor message** — If the page detects alarming patterns (e.g., declining trend across all skills, zero study in 7+ days, exam within 30 days with low band progress), it surfaces a proactive tutor message at the top with suggestions.

5. **Floating AI Tutor popup** — The persistent AI Tutor FAB is available on this page, and the page context informs the tutor's suggestions. When the user opens the tutor from this page, it should know they are looking at their progress.

---

## Accessibility Notes

1. **Chart accessibility**: All charts include `role="img"` with descriptive `aria-label`. A hidden data table follows each chart so screen reader users can access the raw data.

2. **Color independence**: Charts do not rely solely on color to convey information. Lines use different dash patterns (solid, dashed, dotted) in addition to colors. Segments use patterns or labels in addition to fill colors.

3. **Keyboard navigation**: All interactive chart elements, stat cards, and action buttons are keyboard-accessible. Tab through sections in a logical order. Period selector responds to Enter/Space.

4. **Focus management**: When the period changes, focus moves to the first chart or stat card so users can see the updated content without re-navigating.

5. **Touch targets**: All buttons and interactive elements are at least 44x44px (mobile standard). Stat cards are tappable on mobile.

6. **Screen reader labels**:
   - Stat cards: `aria-label="Total study hours: 24.5 hours, improved 10 percent from last period"`
   - Progress rings: `role="progressbar" aria-valuenow="72" aria-valuemin="0" aria-valuemax="100" aria-label="Reading accuracy: 72 percent"`
   - Trend badges: Include descriptive text like "Trend: improving" alongside the arrow symbol
   - Charts: `aria-label="Line chart showing IELTS band progression from January to March. Overall band improved from 6.0 to 6.5."`

7. **Reduced motion**: Chart animations and skeleton pulses respect `prefers-reduced-motion`. Use `transition: none` and `animation: none` for users who prefer reduced motion.

8. **Error announcements**: Error messages use `role="alert"` to be announced by screen readers. Retry actions use standard `<button>` elements.

---

## Components Needed

| Component | Purpose | Source Ref |
|---|---|---|
| `ProgressTracker` | Main container orchestrating all sections | `apps/web/src/features/progress/ProgressTracker.tsx` |
| `StatCard` (enhanced) | Stat metric display with trend, icon, and color | Refactor from existing `StatCard` in `ProgressTracker.tsx:37-52` |
| `BandProgressionChart` | IELTS band line chart over time | New — inspired by `ProgressChart` with `type="line"` capability |
| `SkillBreakdownCard` | Individual skill card with ring, accuracy, trend | New — inspired by `SkillProgressChart` in `ProgressTracker.tsx:116-161` |
| `SkillBreakdownGrid` | 3x2 grid container for skill cards | New |
| `StudyActivityChart` | Combined bar/line chart for study minutes + tasks | New — builds on `WeeklyProgressChart` in `ProgressTracker.tsx:66-114` |
| `VocabRetentionChart` | Radial donut for vocabulary mastery breakdown | Uses `ProgressChart` with `type="radial"` (`dashboard/components/ProgressChart.tsx:120-148`) |
| `VocabGrowthChart` | Line chart for cumulative vocabulary growth | New — inspired by `ProgressChart` |
| `MistakeTrendChart` | Line chart showing mistake accumulation and resolution | New |
| `TopMistakePatternsList` | Ranked list of most frequent mistake patterns | New — inspired by `WeakSkillsCard` in `ProgressTracker.tsx:255-295` |
| `PlanAdherenceRing` | Large progress ring for study plan completion | Uses `ProgressChart` with `type="radial"` |
| `AdherenceCalendar` | Mini calendar heatmap for daily plan adherence | New |
| `ActivityFeed` | Scrollable list of recent activity entries | Enhanced version of `RecentActivity` in `ProgressTracker.tsx:297-339` |
| `PeriodSelector` | Dropdown/segmented control for date range | New — shared component for all data pages |
| `SectionHeader` | Section title with optional "Ask AI" button and action link | New — shared component |
| `ChartSkeleton` | Skeleton loader matching chart shapes | New — from component system spec |
| `GridSkeleton` | Skeleton loader matching grid layout | New — from component system spec |
| `ProgressChart` (extended) | Generic chart component with line, bar, pie, radial types | Extend existing `ProgressChart` (`dashboard/components/ProgressChart.tsx`) to support `type="line"` and `type="bar-stacked"` |

---

## Data Displayed

| Data Point | Source | Component |
|---|---|---|
| Total study hours | `snapshot.totalStudyMinutes / 60` | StatCard (Study Hours) |
| Current streak | `snapshot.currentStreak` | StatCard (Streak) |
| Longest streak | `snapshot.longestStreak` | StatCard (Streak - secondary) |
| Target band | `profile.targetBand` | StatCard (Band Progress) |
| Current band | `profile.currentBand` | StatCard (Band Progress) |
| Exam countdown | `profile.examCountdownDays` | StatCard (Exam Countdown) |
| Vocabulary learned | `snapshot.vocabLearned` | StatCard (Vocabulary) / Vocab charts |
| Vocabulary mastered | `snapshot.vocabReviewed` or `VocabularyStatus.mastered` | VocabRetentionChart |
| Band history | `BandProgress[]` with date, overall, skills | BandProgressionChart |
| Weekly progress | `snapshot.weeklyProgress` with daysActive, totalMinutes, tasksCompleted | StudyActivityChart |
| Skill progress | `snapshot.skillProgress` with skill, sessions, accuracy, trend | SkillBreakdownGrid |
| Monthly summary | `snapshot.monthlySummary` with month, hours, vocab, avgBand | BandProgressionChart (monthly aggregation) |
| Weak skills | `snapshot.weakSkills` with skill and count | TopMistakePatternsList |
| Roadmap progress | `snapshot.roadmapProgress` (0-100) | PlanAdherenceRing |
| Recent activity | `snapshot.recentActivity` with date, description, type | ActivityFeed |
| Mistake trends | MistakeEntry records with dates and resolution status | MistakeTrendChart |
| Repeated mistakes | `WeaknessReport.repeatedMistakes` with pattern, skill, frequency | TopMistakePatternsList |
| Vocabulary status | `VocabularyStatus` with new, learning, reviewing, mastered | VocabRetentionChart |

---

## Design Notes Inspired by the Reference

1. **Progress as a story, not a dashboard** — The reference Dribbble design shows progress visualized as a narrative journey rather than raw numbers. Each chart should feel like a chapter in the user's learning story. The page header could use a subtitle like "Your 89-Day IELTS Journey" to contextualize the data.

2. **Soft gradient backgrounds for charts** — Instead of plain white chart areas, use subtle gradient backgrounds (e.g., light blue to white, or skill-color tinted) behind charts to make them feel more premium and less like spreadsheet exports.

3. **Card grouping with visual distinction** — Each zone (band progress, skills, vocabulary, mistakes, plan, activity) is separated by subtle card borders and different top accent colors, creating a sense of organized sections without visual noise.

4. **Celebration micro-interactions** — When stats improve (e.g., streak increases, band goes up, a skill becomes "Strong"), show a subtle celebration animation: a brief sparkle, a gentle number scale-up, or a soft green glow. These micro-interactions make progress feel rewarding.

5. **Friendly empty states** — The reference uses warm illustrations for empty states. Use an illustration style consistent with the app's overall design: simple, rounded, two-tone illustrations with friendly faces and IELTS-themed props (books, pencils, graduation caps, speech bubbles).

6. **Band score visualization as a ladder** — Instead of a standard line chart, the band progression could use a "band ladder" metaphor: a vertical or horizontal track from 0 to 9, with the user's scores plotted as glowing dots on the ladder. The target band shines as a star at the top. This is more intuitive and motivating than a Cartesian line chart.

7. **Streak visualization as a chain or flame path** — Show the streak as a connected chain of days or a flame trail across a calendar grid. Each day that the user studies adds a link to the chain or brightens a flame. A broken streak shows a visibly broken link.

8. **Skill balance as a radar chart** — Replace the donut chart (session count) with a radar/spider chart showing accuracy or estimated band per skill, overlaid with the target band outline. This is more intuitive for comparing multiple skills against a target than a pie/donut chart.

9. **Vocabulary retention as a garden metaphor** — Show vocabulary words as growing plants: new words are seeds, learning words are sprouts, reviewing words are blooming flowers, mastered words are fully grown plants. This playful metaphor makes vocabulary tracking feel organic and rewarding.

10. **Cards as data tiles** — Each stat card should feel like a data tile — slightly elevated, rounded, with a subtle icon and color. The number should be prominent. The label should be lowercase and muted. Trend indicators should feel natural, not technical.

11. **Section accessibility** — Each major section has a "View details" or "Ask AI" link that makes the page feel explorable. Users should feel they can go deeper into any metric, not just see a surface-level number.

12. **Glow effects for positive metrics** — High streaks (>30 days), improving trends, and nearing-target-band states use subtle glow effects (box-shadow with the color token) to draw attention to positive achievements.

13. **Data density control** — A "Show more / Show less" toggle on each chart section lets users control how much data they see. On first visit, show 4 weeks. Advanced users can expand to 12 weeks or more. This prevents overwhelming new users.

14. **Progress page as a visual summary for AI Review** — The AI Progress Review should reference the charts on this page. The review text should say things like "As you can see in the Band Progression chart, your Reading score improved..." to connect the AI analysis with the visual data.
