# IELTS Journey — Full Study Roadmap Page Specification

## Page Purpose

The Full Study Roadmap page is the user's complete IELTS journey visualization — from today to exam day. It answers "Where am I in my overall IELTS preparation?" and "What comes next?" by presenting the entire AI-generated study plan as a structured, scrollable roadmap with phases, weeks, and daily tasks. Unlike the Today's Study Plan page (which focuses on what to do today), this page provides the long-term view — showing progress across all phases, past and future weeks, and the overall trajectory toward the target band.

**Core promise:** "See your entire IELTS journey — where you've been, where you are, and what's ahead."

---

## User Goal

- See the complete study plan from today to exam date at a glance
- Understand how study time is organized into phases and weeks
- Know which phase and week they are currently in
- Track their overall progress across the entire plan
- View past completed days and upcoming tasks
- Feel motivated by seeing how far they've come
- Adjust or regenerate the plan if needed
- Get AI Tutor explanations for the plan structure and recommendations
- Feel confident that the plan will get them from their current band to their target

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/features/roadmap/RoadmapPage.tsx:1-765`, `apps/web/src/features/roadmap/roadmapService.ts`, `apps/web/src/features/roadmap/aiRoadmapGenerator.ts`):

1. **Flat accordion structure lacks visual journey feel** — The current page renders phases as accordion sections, weeks as nested accordions, and days as flat rows. There is no visual sense of progression, milestones, or journey. It reads as a technical data hierarchy, not a learning roadmap.

2. **No roadmap timeline visualization** — There is no timeline, path, or visual connector between phases. Each phase is a standalone card with no visual relationship to the next. The user cannot "see" their journey as a continuous path.

3. **Progress is purely numerical** — Overall progress is a percentage bar, phase progress is a thin bar, week progress is a thinner bar. No celebratory milestones, no phase transition animations, no visual markers for 25%/50%/75%/100%.

4. **Today is not visually distinct enough** — The current day has a subtle `ring-2` blue border. On a page with many days, today does not stand out. There is no "You are here" marker, no scroll-to-today behavior on load.

5. **No phase transition celebration** — When a user completes a phase, they get no visual celebration, no summary, and no "moving to next phase" transition. The next phase just appears expanded.

6. **Recommendations sidebar is static** — `RecommendationCard` components show text-based suggestions with colored left borders. They are not actionable in the roadmap context and do not drive the user toward the next logical action.

7. **No completion state for the entire roadmap** — When all tasks are complete (the user has finished their entire plan), there is no congratulatory final state, no certificate-like summary, no "What now?" guidance.

8. **Profile sidebar duplicates dashboard info** — The "Your Profile" card shows target band, current level, study time, exam date, and weak skills — all of which are visible on the dashboard. This space could be used for more roadmap-specific content.

9. **No week-by-week accomplishment view** — Users cannot see a quick summary per week (e.g., "Week 3: Practiced 5 Reading passages, reviewed 20 words"). Weekly stats only show task counts.

10. **Mobile experience is cramped** — On mobile, the nested accordion (phase → week → day) with inline skill badges, dates, and checkboxes creates a dense, scrolling-heavy experience. The sidebar disappears, but the main content does not adapt its hierarchy.

11. **No motivational elements** — The greeting "Good morning, IELTS Learner" is generic. There are no milestone badges, streak acknowledgments, or progress-related encouragement integrated into the roadmap view.

12. **No AI Tutor integration within the roadmap** — The AI Tutor only appears if a recommendation mentions it. There is no per-phase AI summary, no "Ask AI about this phase" action, and no proactive AI guidance embedded in the roadmap structure.

13. **Regenerate action is destructive** — The "Regenerate" button immediately clears localStorage and reloads. No confirmation dialog, no undo, no "Keep current plan as backup" option.

14. **No exam date alignment visualization** — The roadmap does not visually align weeks to the exam date. Users cannot see "I have 8 weeks until my exam" mapped against the plan's phases.

---

## Proposed Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                            │
│                                                                 │
│  ┌─── ROADMAP HEADER ────────────────────────────────────────┐  │
│  │  🗺 Your IELTS Journey                                     │  │
│  │  From Band 6.0 → Band 7.5 · 90 days · 12 weeks           │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ████████████░░░░░░░░░░░  42% Complete             │  │  │
│  │  │  38 of 90 tasks completed · 5 weeks remaining       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  📍 You are here: Phase 2 · Week 5 · Skill Improvement   │  │
│  │  📅 Exam: September 15, 2026 (67 days away)              │  │
│  │                                                           │  │
│  │  [Scroll to Today]  [Ask AI Tutor about Plan]            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─── PHASE MILESTONE TIMELINE ────────────────────────────┐    │
│  │                                                         │    │
│  │  ●━━━━━━━━━●━━━━━━━━━━━━●──────────○──────────○        │    │
│  │  Foundation  Skill      Weakness   Mock Test  Final     │    │
│  │  ✅ Done    Imp. 🔥    Fixing 🔒   🔒        🔒       │    │
│  │              Current    Upcoming   Upcoming  Upcoming   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─── PHASE: Foundation (Complete) ─────────────────────────┐   │
│  │  ✅ Phase 1 Complete · 15/15 tasks · Band 6.0 → 6.5     │   │
│  │  📅 Weeks 1-3 (Apr 1 - Apr 21)                          │   │
│  │                                                         │   │
│  │  [Collapsed: shows 3 weeks with week progress pills]     │   │
│  │  Week 1 ████  Week 2 ████  Week 3 ████                  │   │
│  │                                                         │   │
│  │  [Expand to review]  [AI Summary of Phase]              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── PHASE: Skill Improvement (Current) ──────────────────┐   │
│  │  🔥 Phase 2 · 12/25 tasks · 48%                        │   │
│  │  📅 Weeks 4-7 (Apr 22 - May 19)                        │   │
│  │  🎯 Target: Band 6.5 → 7.0                             │   │
│  │                                                         │   │
│  │  ┌──── WEEK 5 (Current Week) ───────────────────────┐  │   │
│  │  │  🗓 This Week: Focus on Listening Multiple Choice │  │   │
│  │  │  📊 3/7 days completed · 120/280 min studied     │  │   │
│  │  │                                                    │  │   │
│  │  │  ┌─ DAY (Today) ───────────────────────────────┐  │  │   │
│  │  │  │  ◉ Listening: Section 3 Multiple Choice     │  │  │   │
│  │  │  │  ○ Reading: True/False/NG Passage           │  │  │   │
│  │  │  │  ○ Vocabulary: AWL Sublist 5                │  │  │   │
│  │  │  │  ⏱ 45 min total  ·  🧠 [Ask AI]            │  │  │   │
│  │  │  └─────────────────────────────────────────────┘  │  │   │
│  │  │                                                    │  │   │
│  │  │  ┌─ DAY 2 (Yesterday) ─────────────────────────┐  │  │   │
│  │  │  │  ✅ Reading: Passage on Climate Change       │  │  │   │
│  │  │  │  ✅ Grammar: Conditional Sentences           │  │  │   │
│  │  │  │  ✅ Vocabulary: AWL Sublist 4                │  │  │   │
│  │  │  └─────────────────────────────────────────────┘  │  │   │
│  │  │                                                    │  │   │
│  │  │  ┌─ DAY 3 ────────────────────────────────────┐  │  │   │
│  │  │  │  ⏭️ Skipped — Rest day                     │  │  │   │
│  │  │  └─────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  ┌──── WEEK 4 (Completed) ──────────────────────────┐  │   │
│  │  │  ✅ 7/7 days · 275/280 min · Focus: Reading      │  │   │
│  │  │  🏆 Best day: Day 22 (Writing practice)          │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  [Collapse Phase]  [Ask AI about Skill Improvement]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── PHASE: Weakness Fixing (Upcoming) ──────────────────┐    │
│  │  🔒 Locked · Starts May 20                              │    │
│  │  🎯 Target: Band 7.0 → 7.5                             │    │
│  │  📊 Focus: Writing & Speaking improvement               │    │
│  │                                                         │    │
│  │  [Preview Phase]  [Ask AI what to expect]              │    │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── PHASE: Mock Test (Upcoming) ────────────────────────┐    │
│  │  🔒 Locked · Starts June 17                             │    │
│  │  🎯 Full mock tests every week                          │    │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── PHASE: Final Review (Upcoming) ─────────────────────┐    │
│  │  🔒 Locked · Starts July 15                             │    │
│  │  🎯 Final preparation and confidence building            │    │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── ROADMAP SUMMARY ────────────────────────────────────┐    │
│  │  📊 Plan Overview                                       │    │
│  │  • Total duration: 90 days (12 weeks)                  │    │
│  │  • Study days: 72 · Rest days: 18                      │    │
│  │  • Total study hours: ~360 hours                       │    │
│  │  • Skills focus: Reading (25%), Listening (25%),       │    │
│  │    Writing (20%), Speaking (15%), Grammar (8%),        │    │
│  │    Vocabulary (7%)                                     │    │
│  │                                                         │    │
│  │  📈 Predicted progress: 6.0 → 6.5 (Phase 1)            │    │
│  │                          → 7.0 (Phase 2)                │    │
│  │                          → 7.5 (Phase 3-5)             │    │
│  │                                                         │    │
│  │  [Regenerate Plan]  [Export Plan]  [Ask AI Review]     │    │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─── AI TUTOR ROADMAP INSIGHT ───────────────────────────┐    │
│  │  🤖 Your Roadmap at a Glance                            │    │
│  │                                                         │    │
│  │  "You're in the Skill Improvement phase, which is the   │    │
│  │  longest and most important phase. Focus on building    │    │
│  │  consistent daily habits. Your Listening is improving   │    │
│  │  faster than Writing — consider allocating extra time   │    │
│  │  to Writing Task 2 practice next week."                 │    │
│  │                                                         │    │
│  │  [Ask Follow-up Question]  [Adjust Plan Based on This]  │    │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Main Sections

### 1. Roadmap Header

**Purpose:** Provide a high-level overview of the entire roadmap — target, duration, current position, and overall progress.

**Content:**
- Back link/button: "← Back to Dashboard" navigates to `/dashboard`
- Large headline: "Your IELTS Journey" or "Your Study Roadmap"
- Subtitle: "From Band X → Band Y · N days · N weeks"
- Overall progress section:
  - Thick, animated progress bar with gradient (`--color-primary` to `--color-primary-light`)
  - Percentage label
  - Summary text: "X of Y tasks completed · Z weeks remaining"
  - Milestone markers on the bar (25%, 50%, 75%, 100%)
- Current position banner:
  - "📍 You are here: Phase Name · Week N · Focus Area"
  - Color-coded phase badge
- Exam countdown:
  - "📅 Exam: Date (N days away)" with urgency color when ≤ 30 days
  - Target band badge
- Actions:
  - [Scroll to Today] — smooth scrolls to today's day card
  - [Ask AI Tutor about Plan] — opens AI Tutor with plan context

**States:**
- **No plan yet:** "You haven't generated a study plan yet. Let's build one!"
- **Loading:** Skeleton header with shimmer
- **Error:** "Unable to load your roadmap. Please try again."
- **Plan complete (100%):** Celebration header with confetti-like badge, "🥳 You completed your entire IELTS roadmap!"

### 2. Phase Milestone Timeline

**Purpose:** Visual horizontal timeline showing all phases as connected milestones, creating a literal "roadmap" visual.

**Content:**
- Horizontal phase timeline (scrollable on mobile):
  - Connected nodes for each phase
  - Node status: completed (green checkmark), current (pulsing primary color with "🔥" indicator), upcoming (locked/locked icon), skipped (muted with dash)
  - Phase name label below each node
  - Connector lines: solid green for completed segments, dashed gray for upcoming segments
  - Estimated date range below each phase
- "You are here" marker with arrow pointing to current phase node
- Clicking a phase node scrolls to that phase section
- Animated transitions when completing a phase (node turns green, connector fills in)

**States:**
- **Only one phase:** Timeline shows single node, no connectors
- **Many phases (5+):** Horizontal scroll with fade edges, phase count indicator "Phase 3 of 5"
- **All complete:** All nodes green, final node has "🏆" icon

### 3. Phase Sections

**Purpose:** Each phase of the roadmap is a distinct expandable section with its own progress, weeks, and daily tasks.

**Content per phase:**

#### Phase Header (collapsed view)
- Phase number badge (colored circle with number)
- Phase name
- Status badge: ✅ Completed, 🔥 In Progress, 🔒 Upcoming
- Completion summary: "X/Y tasks complete" or "N weeks remaining"
- Phase date range (e.g., "Weeks 1-3, Apr 1 - Apr 21")
- Progress mini-bar
- Quick week overview row: 3-5 week pill indicators showing completion at a glance
- Expand/collapse chevron

#### Phase Body (expanded view)
- Phase description (from `RoadmapPhase.description`)
- Target band range badge (e.g., "Band 6.0 → 6.5")
- AI-generated phase summary (optional, from `GlobalStudyStrategy.phaseBreakdown`)
- Week sections listed vertically:
  - Each week has its own mini-header with:
    - Week label (e.g., "Week 5: Listening Focus")
    - Weekly goal text
    - Progress bar + "X/Y days done"
    - Completion status badge
    - Expand/collapse
  - Expanded week shows day cards (see section 4)
- Phase actions:
  - [AI Summary of This Phase] — opens AI Tutor with phase context
  - [Collapse Phase] — collapses back to header view
  - (For locked phases) [Preview Phase] — shows brief overview without days

**States:**
- **Completed phase:** Green tint header, all days show as done, "✅ Complete" badge prominent
- **Current phase:** Primary color accent border, "🔥 In Progress" badge, pre-expanded by default
- **Upcoming phase:** Grey/muted header, lock icon, no expand (or preview only)
- **Phase with skipped tasks:** Shows "⚠️ X tasks skipped" with muted warning color
- **Phase loading:** Skeleton phase header
- **Phase with errors:** "Some days failed to load" with retry option

### 4. Day Cards

**Purpose:** Represent a single day's tasks within a week, showing what was/will be studied.

**Content:**
- Date with weekday (e.g., "Tue, Jun 16")
- Day number (e.g., "Day 45")
- Status indicator:
  - ○ Not started (outlined circle)
  - ◉ In progress (half-filled circle, pulsing for today)
  - ✅ Completed (green filled circle with checkmark)
  - ⏭️ Skipped (muted, with skip icon)
  - ◐ Partially done (half-filled circle)
- Task summary: compact list of skill badges + task titles
  - Up to 3 tasks shown, "+N more" overflow label
  - Skill badge colors consistent with system (🎧 Listening, 📖 Reading, etc.)
- Estimated total time badge (clock icon + minutes)
- Today highlight: prominent blue ring, "Today" badge, pulsing indicator
- Past day styling: reduced opacity for completed/missed days
- Future day styling: slightly muted, no action available
- Click to expand: shows full task list with completion status
- [Ask AI about this day] action on expanded view
- [Go to Today's Plan] action (only for today)

**States:**
- **Today — not started:** Full opacity, blue ring, "○ N tasks today" label
- **Today — in progress:** Blue ring, pulsing, partial checkmarks visible
- **Today — completed:** Green ring, "✅ All done!" label
- **Past — completed:** Reduced opacity, green checkmark, muted date
- **Past — incomplete/missed:** Reduced opacity, warning color border, "⚠️ Incomplete" label
- **Past — skipped:** Very muted, "⏭️ Skipped" label
- **Future — upcoming:** Muted, no interaction available
- **Rest day:** Label "🛌 Rest day" with rest icon, no tasks shown

### 5. Roadmap Summary Section

**Purpose:** Aggregate statistics and insights about the entire plan.

**Content:**
- Section title: "Plan Overview"
- Key metrics:
  - Total duration (days/weeks)
  - Study days vs rest days
  - Total estimated study hours
  - Skill distribution breakdown (percentage per skill)
- Predicted band progression per phase (visual ladder or text)
- Action buttons:
  - [Regenerate Plan] — with confirmation dialog ("This will create a new plan. Your current progress will be lost.")
  - [Export Plan] — downloads plan as JSON/PDF
  - [Ask AI to Review Plan] — opens AI Tutor with full plan analysis request

**States:**
- **No plan data:** Section hidden
- **Loading:** Skeleton stat rows
- **Plan in progress:** Show all stats with real data
- **Plan complete:** "All phases complete!" with celebration styling

### 6. AI Tutor Roadmap Insight

**Purpose:** Provide a proactive, AI-generated analysis of the user's roadmap progress and recommendations.

**Content:**
- AI Tutor avatar/icon with 🤖 or ✨ accent
- Section title: "Your Roadmap at a Glance" or "AI Roadmap Insight"
- AI-generated text paragraph:
  - Summarizes current phase and progress
  - Highlights strengths and areas needing attention
  - Provides actionable recommendation for the near term
  - References actual user data (streak, weak skills, recent performance)
- Action buttons:
  - [Ask Follow-up Question] — opens AI Tutor with context
  - [Adjust Plan Based on This] — opens plan adjustment options

**States:**
- **AI available:** Show insight text with full styling
- **Loading:** Skeleton paragraph with 3-4 shimmer lines
- **Not available (no AI key):** "Connect an AI provider in Settings to get personalized roadmap insights."
- **Error:** "Unable to generate insight right now." (non-blocking, hides or collapses)

---

## Primary Actions

| Action | Trigger | Behavior |
|---|---|---|
| Scroll to Today | Header button | Smooth scroll to today's day card, highlight briefly |
| Expand/Collapse Phase | Phase header click or chevron | Toggle phase week/day visibility with animation |
| Expand/Collapse Week | Week header click or chevron | Toggle week day visibility with animation |
| Mark day as complete | Day card checkbox | Toggle completion, update progress, animate |
| Go to Today's Plan | Today day card action | Navigate to `/plan` (Today's Study Plan page) |
| Ask AI about this day | Expanded day card action | Open AI Tutor with day-specific context |
| Ask AI about Phase | Phase action button | Open AI Tutor with phase context |
| Ask AI about Plan | Header/Summary action | Open AI Tutor with full roadmap context |
| Scroll to Today (timeline) | Phase timeline node click | Scroll to that phase section |
| Regenerate Plan | Summary action | Confirmation dialog → regenerate via AI |
| Export Plan | Summary action | Download plan data as file |

---

## Secondary Actions

| Action | Trigger | Behavior |
|---|---|---|
| Back to Dashboard | Header back link | Navigate to `/dashboard` |
| Preview Phase | Upcoming/locked phase | Show brief overview with AI summary |
| Adjust Plan | AI insight action | Open plan adjustment modal |
| AI Summary of Phase | Phase action | Generate/stored phase summary from AI |
| Collapse All | Phase area button (when many expanded) | Collapse all phases |
| Expand All | Phase area button | Expand all phases |
| View Stats for Week | Week section | Navigate to `/progress?week=N` |

---

## Empty State

**When:** The user has no roadmap/plan generated yet.

**Visual:**
- Illustration: A map with a dotted path starting at a "You are here" marker
- Title: "Your IELTS journey hasn't started yet"
- Description: "Generate your personalized study roadmap to see your complete path from today to exam day."
- Actions:
  - [Create My Study Plan] → `/plan` with generate flow
  - [Complete Onboarding First] → `/onboarding` (if no profile exists)
  - [Talk to AI Tutor] → `/ai-tutor` for guidance

**Sub-states:**
- **No roadmap but has profile:** "You're all set up! Now let's build your study plan."
- **No profile/onboarding:** "Let's start with a few questions about your IELTS goals."
- **Roadmap was deleted:** "Your previous roadmap was removed. Generate a new one?"
- **All tasks complete:** "🎉 You finished your entire IELTS roadmap! Ready for your exam?"

---

## Loading State

**Pattern:** Skeleton placeholders matching the roadmap page structure.

```
┌─ Skeleton h-40 (header) ─────────────────────────────────┐
├─ Skeleton h-16 (timeline) ───────────────────────────────┤
├─ Skeleton h-32 (phase 1) ────────────────────────────────┤
├─ Skeleton h-48 (phase 2, current — expanded skeleton) ───┤
├─ Skeleton h-32 (phase 3) ────────────────────────────────┤
├─ Skeleton h-32 (phase 4) ────────────────────────────────┤
├─ Skeleton h-32 (phase 5) ────────────────────────────────┤
├─ Skeleton h-24 (summary) ────────────────────────────────┤
└───────────────────────────────────────────────────────────┘
```

- Phase skeletons: Rounded rectangle with icon placeholder + 2 text lines + small bar
- Expanded phase skeleton: Additional 3-4 day row skeletons nested inside
- Timeline skeleton: 5 horizontal pill shapes connected by thin lines
- Minimum display: 500ms to avoid flash
- Loading text (below spinner if full-page): "Loading your personalized IELTS roadmap..."

---

## Error State

**Visual:**
- Centered error illustration (broken map or disconnected path)
- Title: "Couldn't load your roadmap"
- Description: Friendly error message (not technical)
- Actions:
  - [Try Again] — reloads roadmap data
  - [Go to Dashboard] → `/dashboard`
  - [Contact Support] → mailto or support link

**Recovery:**
- **Partial load (phases load but AI insight fails):** Show roadmap sections, hide AI insight with inline notice: "AI insight unavailable right now."
- **Generation failed state:** Show "Your plan generation failed. Some tasks may be missing." with [Retry Generation] option
- **Storage error:** "Your roadmap data couldn't be read. Try regenerating your plan."
- **No AI configured:** "AI-powered insights are unavailable. Connect an AI provider in Settings."

**Sub-states:**
- **Phase load error but other phases OK:** Show error inline on that phase only: "Some days in this phase couldn't be loaded."
- **Timeline calculation error:** Fall back to showing phase list without timeline visualization

---

## Mobile Layout

### Layout Changes

| Element | Desktop (≥1024px) | Tablet (768-1024px) | Mobile (<768px) |
|---|---|---|---|
| Roadmap Header | Full width, large typography | Full width, medium typography | Compact header, smaller text |
| Phase Timeline | Horizontal, all nodes visible | Horizontal scrollable | Horizontal scrollable with snap |
| Phase Sections | 2-column or full width | Full width | Full width, single column |
| Phase Header (collapsed) | Full width, inline stats | Full width | Stacked stats below name |
| Phase Body (expanded) | Weeks listed vertically | Weeks listed vertically | Weeks compact |
| Week Header | Inline with progress bar | Inline | Compact with icon only |
| Day Cards (in week) | Grid or vertical list | Vertical list | Compact rows with badges |
| Day Card expanded | Inline modal/expand | Expand section | Bottom sheet |
| Roadmap Summary | 2-column or full | Full width | Stacked compact |
| AI Insight | Card alongside summary | Full width below | Collapsible card |
| Today highlight | Blue ring + "Today" badge | Same | Same, with sticky scroll target |

### Mobile-Specific Behaviors

- **Phase timeline**: Horizontal scroll with snap-to-node behavior, dot indicator showing position (e.g., "● ● ○ ○ ○")
- **Today scroll**: On page load, auto-scroll to today's card with gentle pulse animation
- **Day card tap**: Tapping a day card opens a bottom sheet (Drawer) with full task details
- **Phase accordion**: Tap header to expand/collapse, smooth height transition
- **Week summary**: Show week as compact row with progress dots (●●●○○○) instead of day list
- **Sticky header**: Phase header sticks while scrolling through its days within that phase
- **Swipe actions**: Swipe left on a day card to reveal "Mark as done" / "Skip" on relevant days
- **Timeline tap**: Tapping a phase node on the timeline scrolls to that phase
- **Bottom navigation**: Accessible via bottom nav (Roadmap/Today tab or dedicated nav item)
- **Touch targets**: All interactive elements minimum 44x44px
- **Back gesture**: Swipe right to go to dashboard

### Mobile Bottom Sheet for Day Detail

```
┌─────────────────────────────────────────┐
│  Day 45 · Tue, June 16                 │
│  Phase: Skill Improvement              │
├─────────────────────────────────────────┤
│  🎧 Listening: Section 3 Multiple      │
│     Choice Questions      ✅ 20 min    │
│  📖 Reading: True/False/NG             │
│     Passage                ○ 25 min    │
│  📚 Vocabulary: AWL Sublist 5          │
│                            ○ 15 min    │
├─────────────────────────────────────────┤
│  ⏱ 45 min total                       │
│  Status: In Progress (1/3 tasks done)  │
├─────────────────────────────────────────┤
│  [Mark Day Complete]                   │
│  [Ask AI About This Day]               │
│  [Go to Today's Plan]                  │
│                                         │
│  [Close]                                │
└─────────────────────────────────────────┘
```

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|---|---|
| < 640px (mobile) | Single column, compact cards, horizontal timeline scroll, bottom sheet for day details |
| 640-768px (mobile landscape) | Slightly wider cards, still single column, bottom sheet |
| 768-1024px (tablet) | Full width layout, inline phase stats, more day info visible without expansion |
| ≥ 1024px (desktop) | Full roadmap with sidebar, expanded default for current phase, rich timeline |
| ≥ 1280px (large desktop) | Wider max-width, more generous spacing, AI insight alongside summary |

- Max content width: `max-w-6xl` (72rem / 1152px)
- Padding: `p-4` mobile, `p-6` tablet, `p-8` desktop
- Phase accordion: Only current phase pre-expanded on all breakpoints
- Scroll behavior: On mobile, `scroll-margin-top` on today's card for smooth scroll target

---

## AI Tutor Integration

### Integration Points

| Entry Point | Opens | Context Provided |
|---|---|---|
| "Ask AI about Plan" (header) | AI Tutor page/drawer | Full roadmap data: phases, progress, current position, weak skills |
| "Ask AI about Phase" (per phase) | AI Tutor page/drawer | Phase name, description, progress, completed/remaining tasks |
| "Ask AI about this Day" (per day) | AI Tutor page/drawer | Day's tasks, status, skill focus, how it fits in the week |
| "Roadmap Insight" card (sidebar) | Inline AI response | Overall progress analysis + recommendation (auto-generated) |
| "Adjust Plan" (from AI insight) | Adjust plan modal | Current progress data, AI recommendation for adjustment |
| "Preview Phase" (locked phase) | AI Tutor page/drawer | Phase description, what to expect, recommended preparation |
| "AI Summary of Phase" (completed phase) | Inline expansion | Phase recap: what was covered, skills improved, readiness level |

### AI Insight Card Content Rules

The AI Roadmap Insight card should generate content based on:
- **Current progress phase** and how the user is tracking vs the plan
- **Weak skills** and whether recent days addressed them
- **Streak data** — encourage consistent study
- **Upcoming challenges** — what the next week/phase requires
- **Exam proximity** — adjust urgency and focus recommendations

Example insights:
- "You're 2 weeks ahead of schedule in the Foundation phase. Great consistency!"
- "You've missed 3 days this week. Try to catch up over the weekend — or I can adjust your plan."
- "The Weakness Fixing phase starts next week. It will focus on Writing and Speaking — your two weakest areas."
- "Only 30 days until your exam. Your Skill Improvement phase is on track, but consider adding weekend practice sessions."

### AI Context Payload

When the user asks AI about the roadmap, include:
- Plan summary (phases, weeks, total duration)
- Current phase + week
- Overall progress percentage
- Tasks completed today vs planned
- Weak skills
- Recent completion trend (last 7 days)
- Exam countdown
- Any skipped or missed days

---

## Accessibility Notes

- **Semantic structure**: Use `<nav>` for timeline, `<section>` per phase, `<article>` per day card, `<h1>`-`<h4>` for hierarchy
- **Accordion pattern**: Phase and week expand/collapse uses `aria-expanded`, `aria-controls`, `role="button"` on interactive headers
- **Timeline**: `role="list"` with `aria-label="Study plan phases"`, each node `role="listitem"` with `aria-current="step"` on current phase
- **Progress bars**: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Overall roadmap progress"`
- **Day cards**: `aria-label` summarizing day (e.g., "Day 45, Tuesday June 16, 3 tasks, 1 completed")
- **Status indicators**: Do not rely solely on color — use text labels (✅ Complete, 🔥 In Progress, 🔒 Upcoming) plus icons
- **Today highlight**: `aria-current="date"` on today's card, visual ring + "Today" text label
- **Loading state**: `aria-hidden="true"` on skeletons, `role="status"` with `aria-label="Loading your IELTS roadmap"`
- **Error state**: `role="alert"` on error messages
- **Keyboard navigation**: Tab through phases → expand/collapse with Enter/Space → Tab through days within expanded phase → Enter to open day detail
- **Timeline keyboard**: Arrow keys to navigate between phase nodes when focused
- **Focus management**: When expanding a phase, focus moves to first focusable element within; when collapsing, focus returns to phase header
- **Touch targets**: All interactive elements minimum 44x44px on mobile
- **Color contrast**: All text meets WCAG AA standards, status badges include icon + color + text
- **Skip link**: "Skip to today's tasks" at top of page for keyboard users
- **Status announcements**: Use `aria-live="polite"` for phase completion and progress updates

---

## Components Needed

| Component | Variants | Notes |
|---|---|---|
| Card | default, gradient, bordered, compact | For sections and cards |
| Accordion | phase, week | With expand/collapse, `aria-expanded` |
| Timeline | horizontal, scrollable | Phase milestone visualization |
| TimelineNode | completed, current, upcoming, locked | Connected by lines |
| ProgressBar | thick, with milestones | Animated, gradient, marker dots |
| Badge | phase-status (completed/current/upcoming), skill, count | Color-coded by state |
| DayCard | today, past-completed, past-missed, past-skipped, future, rest-day | Status-specific styling |
| DayCardCompact | mobile-row | For mobile compact view |
| DayDetailSheet | mobile-bottom-sheet | Full day detail on mobile |
| PhaseHeader | collapsed, expanded, current, completed, upcoming | Accordion trigger |
| PhaseBody | expanded | Contains week sections |
| WeekHeader | collapsed, expanded, current-week, completed-week | Week accordion trigger |
| WeekSummaryRow | default, with-progress-dots | Compact week overview |
| AITutorInsightCard | with-content, loading, empty, error | Roadmap-specific AI card |
| AITutorContextButton | per-phase, per-day, per-plan | Opens AI with context |
| RoadmapStatCard | metric, numeric | For summary stats |
| SkeletonCard | phase, week, day, header, timeline | Loading placeholders |
| EmptyStateIllustrated | no-plan, no-profile, all-complete | Empty state illustrations |
| ErrorState | full-error, partial-error | Error + retry |
| ConfirmationDialog | regenerate-plan | Destructive action confirmation |
| ScrollToToday | header-button | Anchored scroll action |
| SkillBadge | per-skill (6 variants) | Compact skill label |

---

## Data Displayed

Referencing `RoadmapData` (`apps/web/src/features/roadmap/roadmapService.ts:43-52`), `RoadmapPhase` (`:31-41`), `RoadmapWeek` (`:19-29`), `RoadmapDay` (`:9-17`), `RoadmapUserProfile`, `GlobalStudyStrategy` (`apps/web/src/features/studyPlan/types.ts:106-118`), and `StudyPlanData` (`apps/web/src/features/studyPlan/types.ts:167-181`):

| Data Field | Display Location | Display Format |
|---|---|---|
| `phases[]` | Phase sections + Timeline | Accordion sections + timeline nodes |
| `phases[].name` | Phase header + Timeline node | Large heading + label |
| `phases[].description` | Phase body | Secondary text |
| `phases[].order` | Phase number badge | "Phase N" |
| `phases[].targetRange` | Phase body | Badge |
| `phases[].weeks[]` | Phase body | Week accordion sections |
| `phases[].weeks[].weekNumber` | Week header | "Week N" label |
| `phases[].weeks[].label` | Week header | "Week N: Focus" |
| `phases[].weeks[].focus` | Week header | Focus area text |
| `phases[].weeks[].goal` | Week body | Goal text |
| `phases[].weeks[].days[]` | Week body | Day card list |
| `phases[].weeks[].isComplete` | Week header | Status badge |
| `phases[].weeks[].completedTasks` | Week header | "X/Y done" |
| `phases[].weeks[].totalTasks` | Week header | "X/Y done" |
| `phases[].isComplete` | Phase header | ✅ Complete / 🔥 In Progress / 🔒 Upcoming |
| `phases[].completedTasks` | Phase header + body | "X/Y tasks" |
| `phases[].totalTasks` | Phase header + body | "X/Y tasks" |
| `currentPhaseIndex` | Header + Timeline | "You are here" indicator |
| `currentWeekIndex` | Week header | Current week highlight |
| `overallProgress` | Header progress bar | Percentage + bar |
| `totalTasks` | Header + Summary | "N tasks" |
| `completedTasks` | Header + Summary | "N tasks completed" |
| `generatedAt` | Summary (metadata) | Date string |
| `updatedAt` | Summary (metadata) | Date string |
| `day.date` | Day card | Date with weekday |
| `day.dayNumber` | Day card | "Day N" |
| `day.skillFocus` | Day card | Skill badge |
| `day.isComplete` | Day card | Checkbox state |
| `day.objective` | Day card | Task objective text |
| `day.taskId` | Day card | (for linking to full task) |

### From `StudyPlanData` (when available)

| Data Field | Display Location | Display Format |
|---|---|---|
| `profileSnapshot.currentBand` | Header | "From Band X" |
| `profileSnapshot.targetBand` | Header | "→ Band Y" |
| `profileSnapshot.examDate` | Header | Countdown + date |
| `profileSnapshot.weakSkills` | AI Insight card | Skill badges |
| `calculatedMeta.totalDays` | Summary | "N days" |
| `calculatedMeta.totalWeeks` | Summary | "N weeks" |
| `calculatedMeta.studyDays` | Summary | "N study days" |
| `globalStrategy.phaseBreakdown[]` | Phase body | AI summary per phase |
| `globalStrategy.weeklyGoals[]` | Week header | Weekly goal text |
| `globalStrategy.planSummary` | AI Insight card | Overall AI summary |
| `dailyPlans[].status` | Day card | Status indicator |

### Computed/Additional Data

| Data | Source | Display |
|---|---|---|
| Phase date ranges | Computed from week dates | "Weeks 1-3, Apr 1 - Apr 21" |
| Phase progress % | `completedTasks / totalTasks * 100` | Phase progress bar |
| Week progress % | `completedTasks / totalTasks * 100` | Week progress bar |
| Days remaining | `totalDays - currentDayNumber` | "N days remaining" |
| Weeks remaining | `totalWeeks - currentWeekNumber` | "N weeks remaining" |
| Band gap progress | `(currentBand - startBand) / (targetBand - startBand)` | Visual band ladder |
| Skill distribution | From plan task categories | Pie/bar breakdown in Summary |
| Predicted band trajectory | From AI strategy or computed | Per-phase target ranges |
| Study hours total | Sum of all `task.estimatedMinutes` | "~N hours total" |
| Completion rate (7 days) | From last 7 day statuses | "5/7 days completed this week" |
| Missed days count | Days past with `isComplete === false` | Warning in AI Insight |
| Rest days count | From profile schedule | "N rest days" in Summary |

---

## Design Notes (Inspired by Golovko's Reference)

1. **Journey visualization over data hierarchy**: The current implementation presents a nested data structure (Phase > Week > Day). The redesign should visualize this as a journey — with a timeline, connected milestones, and a clear path from start to finish. The reference shows how educational content can feel like a progressive journey.

2. **Timeline as a narrative device**: The phase milestone timeline at the top of the page acts as a "table of contents" for the learning journey. Each node represents a chapter. This mirrors the reference's use of progress indicators that tell a story.

3. **Phase card distinction**: Completed phases use soft green tones with a checkmark pattern, current phases use warm primary gradients with a subtle glow, and upcoming phases use muted pastel tints with lock icons. The reference uses distinct visual treatments for "done," "current," and "upcoming" states.

4. **Today's visual prominence**: Today's day card should have the most visual weight — a gentle pulsing blue ring, slightly elevated shadow, and a warm background tint. The reference uses subtle animation and color to draw attention to the "now" moment.

5. **Progress celebration at milestones**: When a phase reaches 100%, show a brief animated celebration (confetti-like dots or a sparkle burst) and a summary card. The reference uses delightful micro-animations for achievement moments.

6. **Card rounding and shadow consistency**: All phase and week cards use `--radius-xl` (1rem) or `--radius-2xl` (1.25rem) with `--shadow-sm` default and `--shadow-md` on hover/interaction — matching the reference's soft, elevated card aesthetic.

7. **AI Tutor as a guide, not a widget**: The AI Roadmap Insight card uses the tutor accent color (`--color-tutor-accent`) and includes a friendly avatar/icon. The AI feels like a guide walking alongside the user's journey, offering perspective at each phase.

8. **Typography for hierarchy**: Phase names use large, bold headings (`text-xl` or `text-2xl`). Week names use `text-base` with medium weight. Day tasks use `text-sm`. The reference shows clear typographic hierarchy that makes scanning effortless.

9. **Progressive disclosure**: The accordion pattern respects the user's attention — only the current phase is pre-expanded. All other phases are collapsed, showing just their header (name, status, progress). The user drills down only when they want detail. This keeps the page from feeling overwhelming.

10. **Mobile-first phase timeline**: On mobile, the timeline is a horizontal scrollable strip with snap-to-node behavior and dot indicators. This feels native and app-like — not like a squeezed desktop component.

11. **Color-coded skill badges**: Each day's task badges use the system's consistent skill colors (purple=Vocabulary, blue=Reading, amber=Writing, green=Listening, red=Speaking, pink=Grammar). The reference uses consistent color coding for different subjects.

12. **Photo-real rest days**: Rest days in the timeline should not look like "empty" or "failed" days. They are shown with a rest icon (🛌 or 🌿), muted but intentional styling, and a gentle label "Rest day — you earned it!" — turning rest into a positive part of the journey.

13. **Locked phase preview**: Upcoming phases show a "Preview" action that opens a brief AI-generated summary of what to expect. This builds anticipation and motivation — the user can see what's coming and feel excited about their learning trajectory.

14. **White space for breathing room**: Between phases, use generous spacing (`gap-6` or 1.5rem separation). Within phases, use comfortable padding (`p-4` to `p-6`). The reference uses white space to make dense information feel approachable.
