# IELTS Journey — Dashboard Page Specification

## Page Purpose

The dashboard is the landing page after login/onboarding. It serves as the user's personalized learning homepage — answering one question immediately: "What should I study today?" The dashboard aggregates all key information (progress, tasks, recommendations, streaks, weak skills) into a single motivating overview that guides the user toward their next learning action.

## User Goal

Users should feel, within 2 seconds of viewing the dashboard:

- **Clear** — They know exactly what to study today
- **Motivated** — Their streak, progress, and AI recommendation encourage them to continue
- **Confident** — They see their target band, current level, and the path forward
- **Support ed** — The AI Tutor is present and ready to help
- **Tracked** — Their effort is being recorded and progress is visible

The dashboard should not feel like an admin panel or data dashboard. It should feel like a personal learning companion greeting them each day.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/features/dashboard/Dashboard.tsx:104-724`, `apps/web/src/hooks/useDashboard.ts`, `apps/web/src/models/index.ts:623-647`):

1. **Generic greeting** — "Good morning, IELTS Learner" is generic. No personalization with the user's name or avatar. The greeting does not adapt to the user's current state (e.g., "Welcome back! You're on a 5-day streak").

2. **No visual hierarchy in the hero** — The gradient hero header packs greeting, date, study goal badge, exam countdown badge, today's mission, task progress bar, and two buttons into a single block. Everything has similar visual weight.

3. **Stats row is monotonous** — Four cards (Study Streak, IELTS Band, Weekly Tasks, Study Hours) use the exact same layout: colored icon box + label + value. No visual distinction between a celebratory stat (streak) and a neutral stat (study hours). No trend indicators.

4. **Today's tasks list is dense** — The task list renders as a vertical stack of bordered rows with checkbox circles. Categories use small inline badges. Long task titles are truncated. On mobile, the list can feel cramped.

5. **AI Tutor suggestion is buried as a sidebar card** — The AI Suggestion card is in the right sidebar on desktop. On mobile, it appears after the tasks. The AI Tutor should feel more present and proactive, not pushed to the periphery.

6. **Quick Stats sidebar card duplicates data** — "Saved Words," "Reviews Due," "Recent Mistakes," "Daily Goal," "Roadmap Progress" are text-only rows. The data overlaps with other dashboard cards. No visual or interactive treatment.

7. **Weak Skills section is purely reactive** — "Needs Practice" is a card that only appears when weak skills exist. It shows skill names as red badges but offers no context, no recommendation, and no action beyond acknowledging weakness.

8. **Skill Progress section is flat** — Skill progress renders as a grid of `SkillProgressCard` components. Each shows skill name and a bar. No trend, no target comparison, no click-to-detail action. They are purely informational.

9. **Band Progress chart is basic** — Two stacked progress bars (current band, target band) with a text summary. No visual band ladder, no milestone markers, no comparison with average IELTS scores.

10. **Weekly chart is generic** — A bar chart from `ProgressChart` component. No context about what "good" looks like. No target study time overlay. No day-of-week annotations.

11. **Quick actions are static skill links** — Three buttons (Reading, Listening, Writing) with skill-colored backgrounds. They always link to the same pages regardless of the user's plan or weak areas. No dynamic prioritization.

12. **No vocabulary review reminder** — Reviews due appears as a number in Quick Stats but there is no proactive reminder or card prompting the user to review their saved vocabulary.

13. **No exam countdown prominence** — Exam countdown is a small badge in the hero header. It should be more visually prominent to create urgency and motivation.

14. **No weekly summary card** — The weekly chart shows data but there is no narrative weekly summary ("You studied 4/7 days this week, up 20% from last week").

15. **No dashboard customization** — Users cannot reorder, show, or hide dashboard sections. Every user sees the same layout.

16. **Mobile layout is stacked but not optimized** — The `sm:grid-cols-2 lg:grid-cols-4` grid works but the card sizes and spacing are not optimized for thumb-reachable touch targets on mobile.

---

## Proposed Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────┐   │
│  │           HERO GREETING + TODAY'S MISSION    │   │
│  │  👋 Hi, Alex!     🔥 12-day streak  🎯 7.5  │   │
│  │  ┌────────────────────────────────────────┐   │   │
│  │  │  Today's Mission                       │   │   │
│  │  │  Complete your Reading and Vocabulary  │   │   │
│  │  │  [████████░░] 4/6 tasks   45 min est  │   │   │
│  │  │  [Continue Learning]  [Ask AI Tutor]   │   │   │
│  │  └────────────────────────────────────────┘   │   │
│  │  Exam: 45 days away  |  Target: 7.5  |  Current: 6.0  │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│  │Study  │ │IELTS │ │Weekly│ │Study │              │
│  │Streak │ │Band  │ │Tasks │ │Hours │              │
│  │🔥 12  │ │🎯 7.5│ │📊 68%│ │⏱ 24  │              │
│  │ days  │ │Trg:7 │ │12/18 │ │total │              │
│  └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                     │
│  ┌───────────────────────────┐ ┌──────────────────┐ │
│  │   Today's Study Tasks     │ │  AI Tutor        │ │
│  │   ┌─────────────────────┐ │ │  ✨ Suggestion   │ │
│  │   │✓ Reading Passage 1 │ │ │                    │ │
│  │   │○ Vocabulary Review │ │ │  "Focus on         │ │
│  │   │○ Writing Task 1    │ │ │  Listening this    │ │
│  │   │○ Grammar Practice  │ │ │  week — your       │ │
│  │   └─────────────────────┘ │ │  score dropped     │ │
│  │   [View Full Plan]       │ │  to 5.5."          │ │
│  └───────────────────────────┘ │                    │ │
│                                │ [Chat Now] →      │ │
│  ┌───────────────────────────┐ │                    │ │
│  │   Skill Progress          │ │ ┌──────────────┐  │ │
│  │   ┌───┐ ┌───┐ ┌───┐ ┌──┐│ │ │ Quick Stats  │  │ │
│  │   │ R │ │ L │ │ W │ │S ││ │ │ Words: 124   │  │ │
│  │   │6.5│ │5.5│ │6.0│ │7 ││ │ │ Due: 8 ⚠️    │  │ │
│  │   └───┘ └───┘ └───┘ └──┘│ │ │ Mistakes: 3  │  │ │
│  └───────────────────────────┘ │ └──────────────┘  │
│                                └──────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  ⚠️ Needs Practice: Listening (5.5), Writing  │ │
│  │  [Practice Now]  [Ask AI Tutor for Tips]       │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌──────────────────────┐ ┌───────────────────────┐│
│  │  Weekly Study Chart  │ │  Band Progress         ││
│  │  [bar chart]         │ │  [band ladder visual]  ││
│  │  Mon Tue Wed Thu Fri │ │  5.0 → 5.5 → 6.0 → 6.5││
│  └──────────────────────┘ └───────────────────────┘│
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Quick Practice                               │ │
│  │  [📖 Reading] [🎧 Listening] [✍️ Writing]      │ │
│  │  [🎤 Speaking] [📚 Grammar] [🧠 Vocabulary]    │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  🗓 Weekly Summary                              │ │
│  │  You studied 4 days this week. 20% more than   │ │
│  │  last week. Keep it up!                         │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Main Sections

### 1. Hero Greeting Section

**Purpose:** Greet the user personally, show key high-level stats, and establish the daily mission.

**Content:**
- User's name (from profile, fallback: "IELTS Learner")
- Personalized greeting based on time of day and user state:
  - New user: "Welcome to IELTS Journey, Alex!"
  - Returning with streak: "Welcome back, Alex! 🔥 12-day streak"
  - Returning + incomplete tasks: "Good afternoon, Alex. You have 3 tasks left today"
- Study streak with flame icon (prominent display)
- Target band badge
- Exam countdown (large, with urgency color when ≤ 30 days)
- Today's Mission card:
  - Auto-generated mission statement derived from unfinished tasks
  - Task completion progress bar (animated)
  - "X/Y tasks done · Z min estimated"
  - [Continue Learning] primary button → /plan
  - [Ask AI Tutor] ghost button → /ai-tutor
- Background: Gradient using `--color-primary-light` and `--color-tutor-background` with subtle pattern or illustration

### 2. Key Stats Row

**Purpose:** Four compact stat cards showing the most important metrics at a glance.

**Cards:**
| Card | Icon | Color Token | Notes |
|---|---|---|---|
| Study Streak | 🔥 | `--color-warning` | Large number + "days" label |
| IELTS Band | 🎯 | `--color-primary` | Shows target band with "Current: X" subtitle |
| Weekly Tasks | 📊 | `--color-success` | Percentage + "X/Y done" |
| Study Hours | ⏱ | `--color-info` | Total hours + "total" label |

**States:**
- Zero streak: Show "Start today!" with muted styling
- No exam date set: Show "Set exam date" → link to settings
- Zero weekly tasks: Show "No tasks yet" with [Create Plan] inline action
- Zero study hours: Show "Begin your journey" with encouraging tone

### 3. Today's Study Tasks

**Purpose:** List today's scheduled tasks with completion toggles.

**Content:**
- Section title with task count badge
- Task list items:
  - Circular checkbox (checked/unchecked/animating)
  - Task title (truncatable with tooltip on hover)
  - Skill category badge with skill-specific color
  - Estimated time in minutes
  - Optional AI Tutor annotation icon (opens AI Tutor with task context)
- Checkbox toggle: Instant visual feedback (strikethrough, opacity change, color shift)
- Empty state: Friendly illustration + [Create Plan] + [Ask AI Tutor]
- Footer: Remaining task count or "All tasks complete! 🎉" celebration

**States:**
- Loading: 4 skeleton task rows
- Empty (no tasks today): Show "Plan your first study day" with illustrations
- All complete: Celebration banner with confetti-like animation
- Partial: Remaining count + "Keep going!" message

### 4. AI Tutor Suggestion Card

**Purpose:** Provide a proactive, context-aware recommendation from the AI Tutor.

**Content:**
- Sparkle icon (AI Tutor brand)
- "AI Tutor Suggestion" heading
- Suggestion text: personalized, contextual, actionable
  - Examples: "Your Listening score dropped to 5.5. I recommend 3 focused practices this week."
  - "You have 8 vocabulary words due for review. Want to quiz yourself?"
  - "Great progress this week! Ready to try a harder Reading passage?"
- [Chat with Tutor] button → opens AI Tutor drawer or navigates to /ai-tutor
- Avatar/illustration of AI Tutor (small, friendly)

**States:**
- Data available: Show suggestion
- No data yet: "Complete your first study session, and I'll have personalized suggestions ready for you!"
- Loading: Skeleton text block

### 5. Quick Stats Sidebar

**Purpose:** Compact data summary for quick reference.

**Content:**
- Section title "Quick Stats"
- Stat rows (label + value) with alternating subtle background:
  - Saved Vocabulary: count
  - Reviews Due: count (warning color when > 0)
  - Recent Mistakes: count (danger color when > 0)
  - Daily Goal: X min
  - Roadmap Progress: X%
- Action buttons below stats:
  - [Review (N)] when reviews due → /vocabulary
  - [View Mistakes] when mistakes > 0 → /mistakes
  - [Vocabulary] otherwise → /vocabulary

### 6. Needs Practice / Weak Skills

**Purpose:** Alert users to their weakest skills without creating anxiety.

**Content:**
- Warning/attention icon
- "Needs Practice" title
- Weak skill badges with skill-specific colors
- Brief explanatory text: "Focus on these skills to improve your band score faster."
- [Practice Now] button → opens practice for weakest skill
- [Ask AI Tutor] button → opens AI Tutor with skill context

**States:**
- No weak skills: Section hidden
- Loading: Skeleton badge placeholders

### 7. Skill Progress Grid

**Purpose:** Visual overview of band score progress per skill.

**Content:**
- Section title "Skill Progress"
- 4 skill cards (Reading, Listening, Writing, Speaking), each with:
  - Skill icon and color
  - Current band score (large)
  - Progress bar from 0 to 9
  - Target band indicator on bar
  - Trend indicator (up/down/stable from last assessment)
  - Weak indicator when score is significantly below target
- Clicking a skill card navigates to the skill's detail in /progress

**States:**
- Loading: 4 skeleton cards
- No assessments yet: Show "Complete your first practice to see skill progress"

### 8. Weekly Study Chart

**Purpose:** Visualize study minutes across the current week.

**Content:**
- Section title "This Week"
- Bar chart (reusing `ProgressChart` component):
  - 7 bars for Mon-Sun
  - Highlight today's bar with primary color
  - Show target daily minutes as a dashed line overlay
  - Tooltip on hover: day name + minutes
- Empty state: "No study data this week yet. Start your practice!"

### 9. Band Progress

**Purpose:** Show the user's IELTS band journey from current to target.

**Content:**
- Section title "Band Progress"
- Current band: score + progress bar (color based on score level)
- Target band: score + progress bar (primary color)
- Gap indicator: "X bands to reach your goal"
- Exam countdown context: "Y days until exam"
- Visual band ladder: Show tick marks at each 0.5 interval from 0 to 9

**States:**
- No current band yet: Show "Take a diagnostic test to establish your baseline"
- Target reached: Celebration state with confetti and "Congratulations! You reached your target!"

### 10. Quick Practice Buttons

**Purpose:** One-tap access to all practice skills.

**Content:**
- Section title "Quick Practice"
- 3x2 grid (desktop) or scrollable row (mobile) of skill buttons:
  - Reading (purple) → /reading
  - Listening (cyan) → /listening
  - Writing (amber) → /writing
  - Speaking (pink) → /speaking
  - Grammar (indigo) → /grammar
  - Vocabulary (emerald) → /vocabulary
- Each button: icon + skill name, skill-colored background
- Hover: subtle lift + shadow

### 11. Weekly Summary (Optional)

**Purpose:** Brief narrative summary of the week's performance.

**Content:**
- Section title "Weekly Summary"
- Auto-generated text:
  - Days studied vs total days
  - Comparison with previous week (increase/decrease)
  - Most practiced skill
  - Upcoming focus recommendation

---

## Primary Actions

| Action | Destination | Context |
|---|---|---|
| Continue Learning | /plan | Primary CTA in hero mission card |
| Ask AI Tutor | /ai-tutor | Opens AI Tutor (page or drawer) |
| Chat with Tutor | /ai-tutor | From AI Tutor suggestion card |
| Practice Now | /practice/{skill} | From weak skills / skill cards |
| View Full Plan | /plan | From today's tasks footer |
| Review (N) | /vocabulary | From quick stats, when reviews due |
| View Mistakes | /mistakes | From quick stats, when mistakes > 0 |
| Create Plan | /plan | From empty task state |
| Skill card click | /progress?skill={s} | See detailed skill progress |

---

## Secondary Actions

| Action | Destination | Context |
|---|---|---|
| Vocabulary | /vocabulary | Quick stats default action |
| Reading | /reading | Quick practice button |
| Listening | /listening | Quick practice button |
| Writing | /writing | Quick practice button |
| Speaking | /speaking | Quick practice button |
| Grammar | /grammar | Quick practice button |
| Settings | /settings | User menu or gear icon |

---

## Empty State

**When:** No study data exists (new user, first login after onboarding).

**Visual:**
- Friendly illustration (e.g., a compass or map)
- Title: "Your IELTS journey starts here"
- Description: "Complete your onboarding and let's build your first study plan."
- Action: [Create My First Study Plan] → /plan

**Sub-states:**
- **No tasks today**: "No tasks planned for today. Take a rest or explore something new!"
- **No vocabulary**: "Start saving words as you study. Every word brings you closer to your goal."
- **No practice sessions**: "Complete your first practice to see your skill progress."
- **No weekly data**: "No study data this week yet. Start your practice!"

---

## Loading State

**Pattern:** Skeleton placeholders matching the dashboard layout structure.

```
┌─ Skeleton h-40 (hero) ──────────────────────────┐
├──────────┬──────────┬──────────┬──────────┐     │
│ Skeleton │ Skeleton │ Skeleton │ Skeleton │     │
│  h-24    │  h-24    │  h-24    │  h-24    │     │
├──────────┴──────────┴──────────┴──────────┘     │
├──────────────────────┬──────────────────────────┤
│  Skeleton h-64       │  Skeleton h-64            │
│  (tasks)             │  (sidebar)                │
├──────────────────────┴──────────────────────────┤
│  Skeleton h-32 (weak skills)                    │
├──────────────────────┬──────────────────────────┤
│  Skeleton h-48       │  Skeleton h-48            │
│  (weekly chart)      │  (band progress)          │
└──────────────────────────────────────────────────┘
```

- Use `SkeletonCard` component with `className` matching section heights
- Minimum loading display: 400ms (avoid flash for fast loads)
- Skeleton colors: `--color-skeleton` (light), `--color-surface-alt` (dark)

---

## Error State

**Visual:**
- Centered error illustration
- Title: "Something went wrong"
- Description: Error message text (user-friendly, not technical)
- Action: [Try Again] → calls `refresh()`

**Recovery:**
- Auto-retry once after 3 seconds on network errors
- Show toast notification if partial data is available:
  "Could not load AI suggestion. Other data is ready."

**Partial error handling:**
- If AI suggestion fails but tasks load: Show tasks section, hide suggestion card with a subtle inline notice
- If weekly chart fails: Show chart section with "Chart unavailable" placeholder
- If all data fails: Full error state with retry

---

## Mobile Layout

### Layout Changes

| Section | Desktop (≥1024px) | Mobile (<768px) |
|---|---|---|
| Hero Greeting | Full width, gradient | Full width, gradient, reduced padding |
| Key Stats Row | 4-column grid | 2-column grid |
| Today's Tasks | Left column (2/3 width) | Full width |
| AI Tutor Suggestion | Right sidebar (1/3 width) | Collapsed below tasks |
| Quick Stats | Right sidebar | Collapsed below AI suggestion |
| Weak Skills | Full width card | Full width card |
| Skill Progress | 4-column grid | 2-column grid |
| Weekly Chart | Left column (1/2 width) | Full width |
| Band Progress | Right column (1/2 width) | Full width |
| Quick Practice | 6-column grid (3x2) | Horizontal scrollable row |
| Weekly Summary | Full width or hidden on small screens | Hidden on very small screens |

### Mobile Navigation

- Bottom navigation bar visible (see global navigation spec)
- Dashboard tab is active by default
- AI Tutor shortcut in bottom nav opens the AI Tutor drawer (not full page)

### Touch Targets

- All buttons: minimum 44x44px
- Task checkboxes: minimum 44x44px
- Stat cards: minimum 48px height
- Quick practice buttons: minimum 56px height

### Mobile-Specific Behaviors

- Task list items: Expand on tap to show full title and description
- Skill cards: Tap navigates to skill progress detail
- Stats row: Swipeable horizontally if 4 cards don't fit
- AI Tutor suggestion: Collapsible (tap to expand/collapse)
- Quick practice: Horizontal scroll with "fade" edges indicating more

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|---|---|
| < 640px (mobile) | Single column, bottom nav, reduced padding |
| 640-768px (mobile landscape) | 2-column stats, single column content |
| 768-1024px (tablet) | 2-column sidebar layout, full quick practice |
| ≥ 1024px (desktop) | 3-column main + sidebar, full experience |
| ≥ 1280px (large desktop) | Wider max-width, more spacing |

- Max content width: `max-w-6xl` (72rem / 1152px)
- Padding: `p-4` mobile, `p-6` tablet, `p-8` desktop
- Gaps: `gap-4` mobile, `gap-6` desktop

---

## AI Tutor Integration

### Current Integration Points

1. **AI Tutor Suggestion Card** (sidebar): Shows proactive suggestion with [Chat with Tutor] action
2. **Ask AI Tutor button** (hero): Opens full AI Tutor page
3. **AI Tutor annotation** on task items (future): Per-task AI explanation access

### Proposed Enhancements

1. **Context-aware suggestion**: The AI suggestion should adapt based on:
   - Time since last study session
   - Incomplete tasks from yesterday
   - Upcoming exam date proximity
   - Recent mistake patterns
   - Vocabulary review backlog

2. **Proactive greeting variant**: When the AI has a strong recommendation, the hero greeting could include it:
   - "Good morning! I noticed your Writing task 2 needs attention. Want to practice?"

3. **AI Tutor mini-prompt**: Below the suggestion card, show 2-3 quick prompt chips:
   - "Quiz me on vocabulary"
   - "Explain today's reading passage"
   - "Check my writing"

4. **Tutor avatar**: A small, friendly AI Tutor avatar/illustration in the corner of the suggestion card to make the AI feel present

### Integration States

- **Recommendation available**: Show suggestion card
- **No data yet**: "Complete your first study session for personalized recommendations"
- **Loading**: Skeleton text in the card
- **Error**: "AI suggestion temporarily unavailable" (non-blocking)

---

## Accessibility Notes

- All interactive elements must be keyboard navigable
- Task checkboxes: Use native `<input type="checkbox">` with visible custom styling, or `<button>` with `role="checkbox"` and `aria-checked`
- Stat cards: `aria-label` summarizing content (e.g., "Study streak: 12 days")
- Skill progress cards: `aria-label` with skill name and score
- Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="9"`
- Empty states: Use `aria-live="polite"` when dynamically shown
- Loading skeletons: Use `aria-hidden="true"` with `role="status"` and `aria-label="Loading dashboard"`
- Error state: Use `role="alert"` for error messages
- Color contrast: All text meets WCAG AA standards
- Section headings: Use proper `<h1>`-`<h3>` hierarchy
- Touch targets: Minimum 44x44px on mobile
- Focus states: Visible focus ring on all interactive elements

---

## Components Needed

| Component | Variants | Notes |
|---|---|---|
| Button | primary, ghost, outline; sm, md sizes | Reuse existing |
| Card | default, gradient, bordered | For sections |
| Badge | skill, status, count, warning, danger | Skill-colored variants |
| SkeletonCard | h-full, w-full variants | Loading placeholders |
| EmptyStateIllustrated | default, no-tasks, no-vocabulary, etc. | Reuse existing |
| SkillCard | with trend, with weak indicator | Reuse existing from `@ielts/ui` |
| StudyTaskCard | default, done, overdue | Reuse existing from `@ielts/ui` |
| ProgressChart | bar, with overlay line | Reuse existing |
| ProgressBar | inline (hero mission) | Mini progress bar |
| DashboardSection | with action, with icon | Reuse `DashboardSection` from `@ielts/ui` |
| StatCard | compact (stats row) | New component (or extend existing `DashboardCard`) |
| QuickPracticeButton | per-skill (6 variants) | New component |
| WeeklySummaryCard | default | New component |
| AITutorSuggestion | default, loading, empty | New component (extends existing pattern) |
| NeedsPracticeSection | default, hidden | New component |
| StrengthMeter | band progress (0-9) | New component (band ladder visual) |
| Toast | success, warning, error | Reuse existing |
| Modal | settings, confirm dialogs | Reuse existing |

---

## Data Displayed

Referencing `DashboardData` (`apps/web/src/models/index.ts:623-647`):

| Data Field | Display Location | Display Format |
|---|---|---|
| `todayTasks` | Today's Study Tasks section | Task list with checkboxes |
| `studyStreak` | Hero greeting + Stats row | Number + "days" |
| `weeklyProgress.done / total` | Stats row (Weekly Tasks) | Percentage + "X/Y done" |
| `totalStudyHours` | Stats row (Study Hours) | Number + "total" |
| `targetBand` | Hero + Stats row (Band) + Band Progress | Number with "Target" label |
| `currentBand` | Stats row (Band) + Band Progress | Number with "Current" label |
| `weakSkills` | Needs Practice section | Skill badges |
| `dueReviews` | Quick Stats + Reviews button | Number with warning color |
| `todayFocus` | (future: mission statement) | Text |
| `recentSessions` | Skill Progress bars | Per-skill scores |
| `examDate` | Hero countdown badge | "X days to exam" |
| `studyGoal` | Hero badge | "IELTS Academic" / "General" |
| `dailyStudyMinutes` | Quick Stats | "X min" |
| `recentMistakes` | Quick Stats + Mistakes button | Number with danger color |
| `savedVocabularyCount` | Quick Stats | Number |
| `aiSuggestion` | AI Tutor Suggestion card | Text with optional actions |
| `roadmapProgress` | Quick Stats | Percentage |
| `examCountdown` | Hero countdown badge | Number + "days" |

### Computed/Additional Data

| Data | Source | Display |
|---|---|---|
| Band gap | `targetBand - currentBand` | Band Progress text |
| Mission progress | `doneTasks / totalTasks` | Hero mission progress bar |
| Task completion status | `tasks.filter(t => t.isDone)` | Per-task visual state |
| Today's mission text | Computed from incomplete tasks + dueReviews + weakSkills | "Complete your X and Y tasks today" |
| Skill trends | From historical assessments (not in current DashboardData) | Up/down/stable arrows |

---

## Design Notes (Inspired by Golovko's Reference)

1. **Hero gradient**: Use a soft, warm gradient (not hard-edged) to create a welcoming top section. The reference uses pastel gradients with smooth transitions — apply this to the dashboard hero.

2. **Card rounding**: All cards should use `--radius-xl` (1rem) or `--radius-2xl` (1.25rem) for a friendly, modern feel. Avoid sharp corners.

3. **Shadow depth**: Cards should use `--shadow-sm` by default and elevate to `--shadow-md` on hover/interaction. The reference shows subtle shadow layering that creates depth without heaviness.

4. **Stat cards with icons**: Icons in colored rounded-square containers (as the reference shows for statistics) create a friendly, app-like feel vs text-only data.

5. **Progress visuals**: Use rounded progress bars with animated width transitions. The reference shows thick, rounded progress indicators that feel satisfying.

6. **Typography hierarchy**: Bold, large numbers for stats with smaller, muted labels underneath — exactly as the reference displays metrics.

7. **AI Tutor presence**: The reference shows a helpful assistant figure. The AI Tutor on the dashboard should feel like a friendly guide, not a widget. Use the tutor accent color (`--color-tutor-accent`) consistently.

8. **Spacing generosity**: The reference uses generous white space between sections. Each dashboard section should have comfortable `gap` and `padding` — never cramped.

9. **Skill colors**: Each skill should maintain its distinct color identity (cyan=Listening, purple=Reading, amber=Writing, pink=Speaking) as shown in the reference's subject color coding.

10. **Mobile feel on desktop**: Even on desktop, the dashboard should feel app-like — not like a web dashboard. Use `max-w-6xl` centering, card-based layout, and consistent rounded corners to maintain mobile app DNA.

11. **Personalization evidence**: The reference clearly shows "for you" personalization. The dashboard should surface the user's name, their specific weak skills, and AI recommendations that reference their actual data.

12. **Motivational microcopy**: Replace neutral labels ("Study Streak: 12") with motivating ones ("12-day streak! 🔥"). The reference uses emoji and friendly tone throughout.
