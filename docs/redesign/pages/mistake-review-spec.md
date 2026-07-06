# IELTS Journey — Mistake Review Page Specification

## Page Purpose

The Mistake Review page is a dedicated mistake tracking and review system that helps users log, categorize, analyze, and resolve mistakes across all IELTS skills. It provides a structured workflow for turning errors into learning opportunities — from recording what went wrong, to understanding why, to practicing similar items and preventing recurrence. The page surfaces repeated mistake patterns, tracks resolution progress, and integrates AI Tutor insights to help users break persistent bad habits.

## User Goal

Users should feel, when using the Mistake Review page:

- **Aware** — A clear overview of how many mistakes exist, which are new, reviewed, or resolved, and which skill areas need the most attention
- **Organized** — Mistakes are categorised by skill, topic, and status, with search and sort making it easy to find specific entries
- **Informed** — Repeated mistake patterns are surfaced automatically so users see not just individual errors but the underlying habits causing them
- **Supported** — Each mistake includes an explanation, correction, and optional AI Tutor insight to deepen understanding
- **Progressing** — The status workflow (new → reviewed → resolved) and repetition tracking show a clear path from error to mastery
- **Proactive** — The page recommends similar practice questions and patterns to watch for, helping users avoid repeating the same mistakes
- **Confident** — Users can see their mistake resolution rate improving over time, reinforcing that learning from errors is part of the IELTS journey

The Mistake Review should feel like a personal error analysis system, not a simple list of things gone wrong. Every mistake is framed as a learning opportunity with a clear path to resolution.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/pages/Mistakes.tsx:63-758`, `apps/web/src/features/mistakes/MistakeNotebook.tsx:85-1065`, `apps/web/src/models/index.ts:242-254`, `packages/ai-tutor/src/prompts/learningProgressReview.ts:26-31`):

1. **List-only presentation** — The current Mistake Notebook is a flat list of entries with filters and sorting. There is no overview dashboard, no pattern analysis, no visual hierarchy distinguishing high-priority from minor mistakes. The page feels like a database viewer, not a learning tool.

2. **Stats bar is disconnected** — The five stat cards (Total, New, Reviewed, Resolved, Most Repeated) sit at the top as a summary bar but do not drive any interactive features. Tapping "New" does not filter the list. The most repeated stat shows only the first 20 characters of the most repeated mistake with no ability to drill in.

3. **No repeated pattern detection** — The `repetitionCount` field exists on each `MistakeEntry` and can be incremented manually, but there is no automatic detection of repeated mistake patterns across entries. Users must manually notice they keep making the same type of error. The AI progress review (`ProgressReviewPanel.tsx:11-16`) defines a `RepeatedMistake` interface with `pattern`, `skill`, `frequency`, and `analysis`, but this data is never shown on the mistake review page itself.

4. **Explanation and correction are free text** — While the create/edit modal provides fields for explanation and correction, there is no structured guidance for what constitutes a good explanation. Users may write vague or unhelpful explanations that do not help them learn.

5. **Status transitions are manual** — Changing status from new → reviewed → resolved requires clicking individual status label buttons on each row. There is no bulk action, no "mark all reviewed as resolved" action, and no automatic status progression based on time or review activity.

6. **No AI Tutor integration** — The current mistake page has no AI Tutor entry point. Users cannot ask the AI to explain a mistake, suggest a correction, generate similar practice questions, or analyze patterns across their mistakes. The AI progress review feature generates `RepeatedMistake` data but never links back to the mistake notebook.

7. **No practice connection** — If a user identifies a mistake in grammar (e.g., tense error), there is no way to jump to relevant grammar practice exercises or vocabulary review. Mistakes are isolated records with no connection to the practice system.

8. **Daily Review mode is minimal** — The `MistakeNotebook` component adds a "Daily Review" view mode that filters to unresolved mistakes, but this is only a filtered list. There is no structured review flow, no flashcard-style mistake review, no "mark as reviewed" workflow for batch processing.

9. **Repetition tracking is unintuitive** — The repetition increment is a small refresh icon beside each entry. Users may not understand what "repeating" a mistake means. There is no explanation of repetition count or guidance on when to increment it.

10. **No skill breakdown visualisation** — The skill breakdown bar chart shows mistake counts per skill but is not interactive. Users cannot tap a skill bar to filter the list or see a detailed breakdown of mistake topics within that skill.

11. **No empty state for filters** — When filters produce no results, the empty state shows a generic message. There is no suggestion for which filter to adjust or how to find the mistake the user is looking for.

12. **No batch operations** — There is no select-all, batch delete, batch status change, or export functionality. Managing a large mistake collection becomes tedious.

13. **Search is text-only** — Users cannot search by date range, by skill+topic combination, or by repetition count threshold. The search only does substring matching across a few fields.

14. **No smart grouping** — Similar mistakes (same skill, same topic, similar text) are not grouped. A user might have five entries about article usage errors (a/an/the) that appear as separate rows with no relationship indicated.

---

## Proposed Layout

The Mistake Review page is structured as a three-section learning tool: overview dashboard → filterable mistake list → detail/review panel.

### Desktop Layout (>= 1024px)

```
┌──────────────────────────────────────────────────────────────┐
│  Section 1: Mistake Overview Dashboard                        │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Header: "Mistake Review" subtitle + actions           │  │
│  │  [Add Mistake] [⚙️ Settings] [Export]                   │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Summary Cards Row:                                    │  │
│  │  ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐ ┌─────┐ │  │
│  │  │Total │ │  New  │ │Reviewed  │ │ Resolved │ │Rate │ │  │
│  │  │  42  │ │  12   │ │   18     │ │   12     │ │ 28% │ │  │
│  │  └──────┘ └──────┘ └──────────┘ └──────────┘ └─────┘ │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Skill Breakdown + Repeated Patterns (2-column)        │  │
│  │  ┌───────────────────┐ ┌────────────────────────────┐  │  │
│  │  │ Mistakes by Skill │ │ Repeated Mistake Patterns  │  │  │
│  │  │ ┌───────────────┐ │ │ ┌──────────────────────┐   │  │  │
│  │  │ │ Grammar █████ │ │ │ │ Article misuse (5×)  │   │  │  │
│  │  │ │ Reading  ██   │ │ │ │ Tense agreement (4×) │   │  │  │
│  │  │ │ Writing  ████ │ │ │ │ Spelling (3×)        │   │  │  │
│  │  │ │ ...           │ │ │ │ ...                  │   │  │  │
│  │  │ └───────────────┘ │ │ └──────────────────────┘   │  │  │
│  │  └───────────────────┘ └────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Section 2: Mistake List with Filters                        │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Search bar [🔍]   Skill [▼]   Topic [▼]   Status [▼] │  │
│  │  Sort [▼]   Date Range [▼]   Batch [✔️ Select All]     │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │  Mistake Item 1          [Badges] [Actions ▸]  │    │  │
│  │  │  "I has gone to the store yesterday"           │    │  │
│  │  │  → "I have gone..." or "I went..."             │    │  │
│  │  │  Grammar · Verb Tense · Repeated 3× · New      │    │  │
│  │  ├────────────────────────────────────────────────┤    │  │
│  │  │  Mistake Item 2          [Badges] [Actions ▸]  │    │  │
│  │  │  "The advices are useful"                      │    │  │
│  │  │  → "The advice is useful"                      │    │  │
│  │  │  Grammar · Article/Noun · Repeated 2× · Reviewed│   │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │  ... more items ...                                    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Pagination: [Prev] 1 2 3 ... 10 [Next]               │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Section 3: Detail / Review Panel (right side or modal)      │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Mistake Detail                                        │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │  ❌ Mistake                                    │    │  │
│  │  │  "I has gone to the store yesterday"           │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │  ✅ Correction                                 │    │  │
│  │  │  "I have gone to the store yesterday"           │    │  │
│  │  │  or "I went to the store yesterday"             │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │  📘 Explanation                                │    │  │
│  │  │  "After 'has/have', use past participle..."    │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │  🤖 AI Tutor Insight                           │    │  │
│  │  │  "This is a common subject-verb agreement...   │    │  │
│  │  │  [Ask AI for more] [Generate Practice]         │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │  [Mark Reviewed] [Mark Resolved] [Practice Similar]     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌──────────────────────────────────┐
│  Section 1: Overview Cards       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │Tot │ │New │ │Rev │ │Res │   │
│  │ 42 │ │ 12 │ │ 18 │ │ 12 │   │
│  └────┘ └────┘ └────┘ └────┘   │
├──────────────────────────────────┤
│  Skill Breakdown (horizontal     │
│  scrollable bar chart)           │
├──────────────────────────────────┤
│  Repeated Patterns               │
│  ┌──────────────────────────┐    │
│  │ Article misuse · 5×      │    │
│  ├──────────────────────────┤    │
│  │ Tense agreement · 4×     │    │
│  └──────────────────────────┘    │
├──────────────────────────────────┤
│  [🔍] Search mistakes...         │
│  [Skill▼] [Status▼] [Sort▼]      │
├──────────────────────────────────┤
│  Mistake Item                    │
│  ┌──────────────────────────┐    │
│  │ "I has gone..."          │    │
│  │ → "I have gone..."       │    │
│  │ Grammar · New · 3×       │    │
│  │ [Detail ▸]               │    │
│  └──────────────────────────┘    │
│  Mistake Item                    │
│  ┌──────────────────────────┐    │
│  │ "The advices..."         │    │
│  │ → "The advice is..."     │    │
│  │ Grammar · Reviewed · 2×  │    │
│  │ [Detail ▸]               │    │
│  └──────────────────────────┘    │
├──────────────────────────────────┤
│  Detail slides up as bottom      │
│  sheet when item is tapped       │
├──────────────────────────────────┤
│  Bottom Navigation               │
└──────────────────────────────────┘
```

---

## Main Sections

### Section 1: Mistake Overview Dashboard

#### 1. Summary Cards Row

**Purpose:** Provide an at-a-glance snapshot of the user's mistake landscape.

**Cards (5 cards in a row on desktop, 2 rows of 2 + 1 on tablet, horizontal scroll on mobile):**

| Card | Display | Color | Description |
|------|---------|-------|-------------|
| Total | Count (42) | Primary | Total mistakes ever logged |
| New | Count (12) | Red/danger | Mistakes not yet reviewed |
| Reviewed | Count (18) | Amber/warning | Mistakes reviewed but not yet confirmed resolved |
| Resolved | Count (12) | Green/success | Mistakes marked as fixed |
| Resolution Rate | Percentage (28%) | Gradient blue→green | `resolved / total * 100` |

**Behavior:**
- Tapping a card filters the list below to that status: tap "New" → list shows only new mistakes
- Resolution rate shows a mini ring or bar: green portion vs grey portion
- Cards update in real-time as entries are added, modified, or resolved
- Loading state: skeleton card with shimmer

#### 2. Skill Breakdown

**Purpose:** Visualise mistake distribution across IELTS skills.

**Content:**
- Section title "Mistakes by Skill" with a small filter icon
- Horizontal bar chart (desktop) or horizontal scrollable bars (mobile), one per skill:
  - Grammar (blue) ██████████ 18
  - Reading (cyan) ██████ 10
  - Writing (amber) █████ 8
  - Vocabulary (violet) ████ 6
  - Listening (emerald) ██ 4
  - Speaking (rose) █ 2
- Each bar shows: coloured fill proportional to count, skill label, count number
- Highest-count skill has accent highlight
- Total count shown at the end of each bar

**Behavior:**
- Clicking a bar filters the list to that skill
- Clicking the active bar again removes the filter
- Bars animate width on initial load and when data changes

#### 3. Repeated Mistake Patterns

**Purpose:** Automatically detected or user-surfaced repeated mistake patterns that span multiple individual entries.

**Content:**
- Section title "Repeated Mistake Patterns" with AI sparkle icon when AI analysis is available
- List of patterns with frequency badge, sorted by frequency descending:
  - Article misuse (a/an/the) — 5× — Grammar
  - Tense agreement (subject-verb) — 4× — Grammar
  - Spelling (common words) — 3× — Writing
  - Preposition choice (in/on/at) — 3× — Grammar
  - Word form (adjective vs adverb) — 2× — Vocabulary

**Pattern Detection:**
- **Automatic (AI):** AI Tutor analyses all mistake entries periodically and groups similar mistakes by skill + topic + keyword matching
- **Manual:** User can mark multiple entries as "same pattern" via batch select
- **Hybrid:** AI suggests patterns, user confirms

**Each pattern item shows:**
- Pattern name/label
- Frequency badge with count
- Skill badge
- Number of individual mistake entries matching this pattern
- "View All" link → filters list to show only entries in this pattern
- "🤖 AI Analysis" button → opens AI insight for this pattern

**Empty State:** "No repeated patterns detected yet. As you log more mistakes, patterns will appear here."

#### 4. Quick Action Bar

**Purpose:** Immediate entry points for common tasks.

**Content:**
- "Add Mistake" primary button → opens create form
- "Daily Review" button with count badge → switches to daily review filtered view
- "Mistake-Free Streak" display (if applicable): "🔥 3 days without new mistakes"

---

### Section 2: Mistake List with Filters

#### 5. Search Bar

**Purpose:** Full-text search across mistake entries.

**Content:**
- Rounded search input with magnifying glass icon
- Placeholder: "Search mistakes, corrections, explanations..."
- Debounced search (300ms) as user types

#### 6. Filter Bar

**Purpose:** Narrow down the mistake list by multiple dimensions.

**Filters (inline chips/dropdowns):**
- **Skill:** Multi-select chip picker (Grammar, Reading, Writing, Vocabulary, Listening, Speaking)
- **Topic:** Dropdown of available topics (Grammar Rules, Spelling, Pronunciation, Word Choice, Sentence Structure, Punctuation, Collocation, Tense, Preposition, Article, Vocabulary, Comprehension, Fluency, Coherence, Task Response, Other)
- **Status:** Three toggle pills — New, Reviewed, Resolved (multi-select)
- **Date Range:** Preset options (Today, This Week, This Month, Last 3 Months, Custom Range)
- **Repetition:** Filter by minimum repetition count (1+, 3+, 5+)

**Active filter display:** Chips showing current filters with × to remove individual filters
- e.g., [Skill: Grammar ×] [Status: New ×] [Repeated: 3+ ×]

**Batch Actions Bar (appears when items are selected):**
- Select All checkbox in the header
- Selected count: "3 selected"
- Actions: [Mark Reviewed] [Mark Resolved] [Add to Pattern] [Delete]

#### 7. Mistake List

**Purpose:** The primary browseable list of mistake entries.

**Each item:**
```
┌──────────────────────────────────────────────────────────────┐
│  [✔️] Badge: Skill  Badge: Topic  Badge: Status  Count: 3×  │
│  ❝ I has gone to the store yesterday ❞                      │
│  → ❝ I have gone to the store yesterday ❞                   │
│  Date: Jan 15, 2026 · Source: Writing Task 2                │
│                              [Detail] [Edit] [AI] [Delete]   │
└──────────────────────────────────────────────────────────────┘
```

**Row structure:**
- **Select checkbox** (visible when batch mode is active) or drag handle
- **Badges row:** Skill badge (coloured), Topic badge (neutral), Status badge (coloured), Repetition badge (if > 0)
- **Mistake text:** Displayed in a tinted red/amber background blockquote style
- **Correction text:** Displayed with arrow prefix and tinted green background
- **Metadata row:** Date (formatted), source (if present)
- **Action buttons:** Detail/expand, Edit, AI Tutor (sparkle icon), Delete
- **Hover:** Subtle border highlight
- **Pattern match indicator:** If the mistake is part of a detected pattern, show a small "Pattern: [name]" link

**Grouping mode (optional toggle):**
- When "Group by Pattern" is active, items are nested under pattern headings
- Pattern heading shows the pattern name, frequency, and action buttons

**Sort options:**
- Newest First (default)
- Oldest First
- Most Repeated
- Most Recently Updated
- Skill (A-Z)
- Status (new → reviewed → resolved)

#### 8. Pagination

**Purpose:** Navigate through large mistake collections.

**Content:**
- "Showing 1–20 of 42" text
- Page number buttons with prev/next
- Page size selector: 20, 50, 100 (default: 20)

---

### Section 3: Detail / Review Panel

#### 9. Mistake Detail Panel

**Purpose:** Full detail view of a single mistake entry with all data, actions, and AI integration.

**Layout:** Right-side slide-over panel on desktop (≥ 768px), bottom sheet on mobile.

**Sections (in order):**

##### Header
- Back/Close button
- Mistake ID label (optional, internal)
- Three status action buttons: [Mark as New] [Mark as Reviewed] [Mark as Resolved]
  - Current status is highlighted
  - Status change is instant with a toast confirmation

##### Mistake & Correction
- **Mistake block** — Red/amber tinted card with the original error text
- **Correction block** — Green tinted card with the corrected version
- Visual arrow from mistake to correction

##### Explanation
- Section title "Explanation"
- Free-form text from the `explanation` field
- If empty, show a prompt: "Add an explanation to help remember why this was wrong"
- Inline edit: user can add/edit explanation directly in the panel

##### Source & Context
- Section title "Source"
- Source text (e.g., "Reading Test 3, Passage 2", "Writing Task 2 practice", "Speaking Part 1 mock")
- Date of the mistake's occurrence
- Skill and topic badges
- Repetition count with increment/decrement buttons

##### Mistake Metadata
- Created date
- Last updated date
- Times repeated: count with [Mark as Repeated] button
- Pattern membership: "This mistake is part of the [pattern name] pattern"

##### AI Tutor Insight Section
- Section with AI tutor-themed background
- AI-generated analysis of the mistake:
  - Why it's wrong (grammar rule, collocation issue, spelling pattern)
  - Why IELTS examiners deduct points for this error
  - How to avoid it in the future
  - Related IELTS band score impact if applicable
- Action buttons:
  - "Ask AI Tutor for More Detail" → opens AI Tutor chat with mistake context
  - "Generate Practice Questions" → AI creates 3 practice items targeting this mistake type
  - "Explain Like I'm 5" → simpler explanation version
  - "📋 Save as Note" → saves the AI insight to the user's study notes

**States:**
- **AI Available:** Full AI insight section with generated content
- **AI Loading:** Skeleton text with shimmer
- **AI Error:** "Could not generate AI insight. [Try Again]"
- **AI Offline:** "AI insights are available when you're online."
- **AI insight not generated yet:** "Ask AI Tutor to analyze this mistake"

##### Fix Recommendations

**Purpose:** Actionable steps to avoid repeating this mistake.

**Content:**
- **Rule card** — A concise summary of the grammar/vocabulary rule being violated:
  - Example: "Use 'have/has' + past participle for present perfect. Use past simple for completed past actions."
- **Memory aid** — A mnemonic or tip: "Think: have/has = connection to now, simple past = finished"
- **Practice link** — "Practice more verb tense questions" → navigates to relevant grammar practice
- **Related vocabulary** — If the mistake is vocabulary-related, suggest related word forms

##### Practice Similar Questions

**Purpose:** Immediate application of the corrected knowledge.

**Content:**
- Section title "Practice Similar Questions"
- If AI is available:
  - 3–5 similar questions generated by AI targeting the same mistake type
  - Each question is a multiple-choice or fill-in-the-blank exercise
  - User can answer inline in the panel
  - Immediate feedback: correct/incorrect with explanation
  - "Generate More" button
- If AI is not available:
  - "Practice similar questions on our [Grammar Practice] page"
  - Link to relevant practice page filtered by skill/topic

##### Mistake History Timeline

**Purpose:** Show when this mistake was created, reviewed, and resolved over time.

**Content:**
- Compact timeline:
  - ● Jan 15 — Created (new)
  - ● Jan 17 — Reviewed for first time
  - ● Jan 20 — Repeated (marked again)
  - ● Jan 22 — Reviewed again
  - ○ Jan 25 — Resolved
- Each dot is coloured: red (new), amber (reviewed), green (resolved)
- Grey lines between dots
- Duration hints: "Resolved in 10 days"

##### Related Mistakes

**Purpose:** Show other mistakes with similar skill/topic/pattern.

**Content:**
- Section title "Related Mistakes"
- Horizontal list of 3–5 mini mistake cards
- Each mini card shows: mistake text (truncated), skill badge, status badge
- Clicking a card opens that mistake's detail panel
- "View All [skill] Mistakes" link → filters main list to relevant skill

#### 10. Daily Review Workflow

**Purpose:** Structured review flow for processing unresolved mistakes.

**Trigger:** User taps "Daily Review" from the overview dashboard or switches to daily review view mode.

**Flow:**
1. **Review count screen:** "You have 8 mistakes to review today. Estimated time: 5 minutes."
2. **Single mistake review cards:** One mistake at a time shown as a card:
   - Mistake text (visible)
   - Correction text (hidden until revealed)
   - Explanation (optional, shown after correction)
   - Actions: [I Remember This (Mark Reviewed)] [Still Not Sure (Keep as New)] [Mark as Resolved]
3. **Progress indicator:** "3 of 8 reviewed"
4. **Completion screen:** "Daily Review Complete! You reviewed 8 mistakes."
   - Summary: X marked reviewed, Y marked resolved, Z kept as new
   - "Great — you're getting better at [skill]!"

---

## Primary Actions

| Action | Section | Context |
|--------|---------|---------|
| Add Mistake | Dashboard Header | Opens create form modal |
| Daily Review | Dashboard / Filter Bar | Switches to structured review workflow |
| Status Filter | Dashboard Cards | Tap Total/New/Reviewed/Resolved card to filter |
| Skill Filter | Skill Breakdown / Filter Bar | Tap skill bar to filter by skill |
| Select Mistake Item | Mistake List | Opens detail panel |
| Edit Mistake | Mistake List / Detail Panel | Opens edit form |
| Mark Status (New/Reviewed/Resolved) | Detail Panel | Changes mistake status |
| Mark as Repeated | Detail Panel / List | Increments repetition count |
| Ask AI Tutor | Detail Panel | Opens AI Tutor with mistake context |
| Generate Practice | Detail Panel | AI creates practice questions |
| Search | Filter Bar | Full-text search across entries |
| Batch Select | Mistake List | Enables batch operations |
| Batch Mark Reviewed/Resolved | Batch Bar | Bulk status change |
| Practice Similar Questions | Detail Panel | Inline or linked practice |
| Save AI Insight as Note | Detail Panel | Saves analysis to study notes |

## Secondary Actions

| Action | Section | Context |
|--------|---------|---------|
| Delete Mistake | Mistake List / Detail Panel | Removes entry (with confirmation) |
| Export Mistakes | Dashboard Header | Exports as JSON/CSV |
| Filter by Topic | Filter Bar | Topic dropdown filter |
| Filter by Date Range | Filter Bar | Date range preset/custom picker |
| Filter by Repetition Count | Filter Bar | Minimum repetition threshold |
| Sort List | Filter Bar | Sort order selector |
| View Related Mistakes | Detail Panel | Opens related entries |
| View Mistake Timeline | Detail Panel | Shows status change history |
| Add Mistake to Pattern | Batch Bar / Detail | Groups entries as same pattern |
| Group by Pattern | Filter Bar | Toggle grouping mode |
| Clear All Filters | Filter Bar | Reset all active filters |
| Change Page Size | Pagination | Items per page selector |
| Add Explanation | Detail Panel | Inline edit explanation |
| Copy Mistake/Correction | Detail Panel | Copy to clipboard |

---

## Empty State

### No Mistakes Recorded Yet

- **Icon:** Shield with checkmark or empty notebook
- **Title:** "No mistakes recorded yet"
- **Description:** "Start tracking your mistakes to identify weak points and improve. Mistakes are automatically saved when you practice, or you can add them manually."
- **Action:** "Add Your First Mistake" → opens create form
- **Secondary:** "Take a Practice Test" → navigates to practice page

### No Mistakes Match Filters

- **Icon:** Filter with cross
- **Title:** "No mistakes match your filters"
- **Description:** "Try adjusting your search terms, selecting different skills or topics, or clearing all filters."
- **Action:** "Clear All Filters" → resets filter state
- **Secondary:** "View All Mistakes" → removes all filters

### No Repeated Patterns Detected

- **Icon:** Puzzle piece or connection lines
- **Title:** "No patterns detected yet"
- **Description:** "As you log more mistakes, patterns will appear here. Repeated mistakes of the same type are automatically grouped for you to review."
- **Action:** None (informational state)

### Daily Review Complete

- **Icon:** Checkmark in circle
- **Title:** "All caught up!"
- **Description:** "You've reviewed all your unresolved mistakes. Great work staying on top of your errors!"
- **Action:** "Back to Mistake List" → returns to full list
- **Secondary:** "View Progress" → navigates to learning progress page

### No Mistakes to Review Today

- **Icon:** Calendar with checkmark
- **Title:** "No mistakes to review today"
- **Description:** "You're on a roll! Check back after your next practice session."
- **Action:** None (informational state)

---

## Loading State

### Initial Load

- **Pattern:** Skeleton cards for summary row (5 skeleton stat cards with shimmer)
- **Skeleton bar chart** for skill breakdown
- **Skeleton list items** (3–5 skeleton rows)
- **Animation:** Shimmer effect with `--color-skeleton` gradient
- **Duration:** Until `DatabaseService.getAll('mistakes')` resolves

### Filter/Search Loading

- **Pattern:** Current list items fade to 0.3 opacity
- **Spinner** centered in the list area if response is slow (> 500ms)
- **Animation:** Pulsing fade
- **Duration:** Until filtered results are computed

### Detail Panel Loading

- **Pattern:** Skeleton detail sections (header, mistake block, correction block, explanation block, AI insight block)
- **Animation:** Shimmer effect
- **Duration:** Until entry data is loaded from database

### AI Insight Loading

- **Pattern:** Skeleton text block with 3–4 shimmer lines
- **Label:** "AI Tutor is analyzing your mistake..."
- **Animation:** Pulsing gradient
- **Duration:** Until AI response is received (may be 2–8 seconds)

### AI Practice Generation Loading

- **Pattern:** 3 skeleton practice cards with shimmer
- **Label:** "Generating practice questions..."
- **Animation:** Pulsing gradient

### Saving Status Change

- **Button loading state:** The tapped status button shows spinner
- **Duration:** Until `DatabaseService.put('mistakes', ...)` resolves
- **Fallback:** If save fails, show error toast; status reverts to previous

---

## Error State

### Failed to Load Mistakes

- **Layout:** Centered error card in the list area
- **Icon:** Database warning icon
- **Title:** "Could not load your mistakes"
- **Description:** Error message from `DatabaseService.getAll('mistakes')` catch block
- **Action:** "Try Again" — retries loading
- **Fallback:** "Go to Dashboard" — navigates away

### Failed to Save Mistake (Create/Edit/Status Change)

- **Feedback:** Error toast: "Failed to save. Please try again."
- **Recovery:** Data entry remains open; user can retry
- **Data loss prevention:** Form state preserved until successful save

### Failed to Delete Mistake

- **Feedback:** Error toast: "Failed to delete. Please try again."
- **Recovery:** Item remains in list; user can retry delete

### AI Analysis Failed

- **Layout:** AI Insight section shows fallback message
- **Content:** "AI analysis is temporarily unavailable."
- **Action:** "Try Again" button or "Skip for Now"
- **Fallback:** Show a generic tip relevant to the skill/topic

### AI Practice Generation Failed

- **Layout:** Practice section shows fallback message
- **Content:** "Could not generate practice questions right now."
- **Action:** "Try Again" or "Go to Practice Page"

### Database Operation Failed

- **Feedback:** Toast error with operation name
- **Action:** "Retry" button in toast
- **Fallback:** If critical, show error state with "Exit to Dashboard" action

### Offline State

- **Layout:** Subtle banner at top: "You're offline. Changes will sync when you're back online."
- **Behavior:** Read operations work from local IndexedDB cache; write operations queue for sync
- **AI features:** Disabled with message: "AI Tutor requires an internet connection"

---

## Mobile Layout

### Screen Adaptation

| Section | Desktop (≥ 1024px) | Mobile (< 768px) |
|---------|-------------------|------------------|
| Summary Cards | 5 cards in a row | 2+2+1 grid |
| Skill Breakdown | Horizontal bars, full width | Horizontal scrollable bars |
| Repeated Patterns | Right column of dashboard | Below skill breakdown, full width |
| Filter Bar | Inline chips + dropdowns | Collapsible accordion + bottom sheet |
| Mistake List | Full-width list with actions | Full-width list, compact actions |
| Detail Panel | Right slide-over panel | Bottom sheet (slides up) |
| Daily Review | Centered review card | Full-width review card |
| AI Insight | Right column in detail panel | Full width below mistake details |

### Dashboard on Mobile

- Summary cards: 4 cards in 2×2 grid, resolution rate becomes a small bar below the grid
- Skill breakdown: Horizontal scrollable bar chart, each bar is a swipeable chip
- Repeated patterns: Full-width list, each pattern is a compact card with horizontal layout
- Quick action buttons: Full-width, stacked vertically

### Filter Bar on Mobile

- Search input: Full width, sticky below dashboard
- Filter chips: Horizontal scrollable row of pill buttons
- Tapping a filter pill opens a bottom sheet with options
- Active filters shown as dismissible chips below search bar
- Batch actions bar: Slides up from bottom with action buttons

### Mistake List on Mobile

- Each item: Compact card with full-width layout
- Mistake text: 2-line truncation with "..." expand
- Action buttons: Only Detail (eye icon) shown in row; Edit, AI, Delete in a context menu (three-dot menu)
- Repetition count shown as badge only
- Swipe left on item reveals: [Mark Reviewed] [Mark Repeated] [Delete]
- Pagination: "Load More" button at bottom (infinite scroll pattern)

### Detail Panel on Mobile

- Bottom sheet that covers 90% of screen height
- Pull-down handle to dismiss
- Sections in scrollable content (no fixed right column)
- AI Insight section: Full width below metadata
- Practice questions: Inline, stacked vertically
- Action buttons: Sticky at bottom of sheet
- Status buttons: Horizontal row at top

### Daily Review on Mobile

- Single mistake card: Full width, centered
- Progress: "3 of 8" with compact progress bar
- Reveal button: Large, centered tap target
- Action buttons: Two large buttons at bottom: [Mark Reviewed] [Keep as New]
- Swipe up to see explanation and AI insight

### Bottom Navigation on Mobile

- **On mistake list view:** Bottom navigation visible with standard items
- **On detail panel:** Bottom navigation hidden (panel overlays content)
- **On daily review:** Bottom navigation hidden (full-screen focus mode)
- **On create/edit form:** Bottom navigation hidden

### Gesture Support

- **Swipe left on list item:** Reveals quick actions (Mark Reviewed, Mark Repeated, Delete)
- **Swipe down on detail panel:** Dismisses bottom sheet
- **Swipe right on daily review card:** Goes to previous mistake
- **Tap outside bottom sheet:** Dismisses
- **Long press on list item:** Enters batch selection mode
- **Pull down on list:** Refresh (reloads entries from database)

---

## Responsive Behavior

| Breakpoint | Summary Layout | Detail Panel | List Density | AI Section |
|------------|---------------|--------------|--------------|------------|
| < 480px (small phone) | 2×2 grid + bar | Bottom sheet 90% | 1 item per row, compact actions | Full width below |
| 480–767px (large phone) | 2×2 grid + bar | Bottom sheet 85% | 1 item per row, compact actions | Full width below |
| 768–1023px (tablet) | 5 cards row, collapse to 3+2 | Slide-over 50% width | 1 item per row, inline actions | Below metadata in panel |
| 1024–1439px (desktop) | 5 cards row | Slide-over 45% width | 1 item per row, full actions | Right column in panel |
| 1440px+ (large desktop) | 5 cards row + wider | Slide-over 40% width | 1 item per row, full actions | Right column in panel |

- **Transition animations:** Panel slides in from right (300ms ease-out); bottom sheet slides up (250ms ease-out)
- **Dashboard card animations:** Counts animate from 0 to final value (counting animation, 500ms)
- **Status change:** Button briefly shows checkmark animation before reverting
- **Filter transitions:** List items fade/slide when filter changes (200ms ease)

---

## AI Tutor Integration

### Entry Points

1. **Detail Panel — AI Tutor Insight Section:**
   - Automatically generated AI analysis of the mistake when the detail panel opens
   - Includes: why it's wrong, IELTS impact, how to avoid it
   - Action: "Ask AI Tutor for More Detail" → opens AI Tutor chat with context

2. **Detail Panel — "Ask AI Tutor" Button:**
   - Opens AI Tutor chat with mistake context pre-filled:
   - "Explain why 'I has gone' is incorrect and how to use present perfect correctly"

3. **Detail Panel — "Generate Practice Questions":**
   - AI generates 3–5 similar questions targeting the same mistake type
   - User can answer inline or navigate to practice page

4. **Repeated Patterns — "AI Analysis" Button:**
   - AI analyses all entries in a pattern and generates a summary:
   - "You've made this article error 5 times. The pattern is: using 'a' before vowel sounds. Here's a rule to remember..."

5. **Dashboard — AI Pattern Detection:**
   - AI periodically analyses all mistakes to detect patterns
   - Patterns appear in the "Repeated Mistake Patterns" section
   - AI can suggest: "I noticed 3 of your last 5 mistakes are about prepositions. Let's work on that."

6. **Daily Review — AI Companion:**
   - After daily review, AI provides encouragement and insight:
   - "You resolved 2 grammar mistakes today. Your grammar accuracy has improved 15% this week."

7. **Practice Similar Questions — AI Generation:**
   - Inline practice questions generated by AI based on the mistake type
   - Immediate feedback with explanation for each answer

### Chat Context Payload

When opening AI Tutor from mistake review:

```json
{
  "context": "mistake-review",
  "mistakeId": "uuid-of-mistake",
  "mistake": "I has gone to the store yesterday",
  "correction": "I have gone to the store yesterday (or I went to the store yesterday)",
  "skill": "grammar",
  "topic": "Verb Tense",
  "pattern": "subject-verb agreement",
  "repetitionCount": 3,
  "status": "new"
}
```

When opening AI Tutor from pattern analysis:

```json
{
  "context": "mistake-pattern",
  "pattern": "Article misuse",
  "skill": "grammar",
  "mistakeCount": 5,
  "sampleMistakes": [
    "I have a apple",
    "She is the teacher at school",
    "He went to the bed"
  ],
  "trend": "increasing",
  "frequency": "3 times per week"
}
```

### AI Feature States

| State | Display |
|-------|---------|
| Insight available | Full AI analysis section with generated content |
| AI loading | Skeleton text with shimmer, "AI Tutor is analyzing your mistake..." |
| AI error | "Could not analyze this mistake. [Try Again]" |
| AI offline | "AI insights are available when you're online." |
| Not yet analyzed | "Ask AI Tutor to analyze this mistake" with [Ask AI] button |
| Insufficient data | "At least 3 mistakes are needed to detect patterns. Keep logging!" |

### AI Pattern Detection Logic (Conceptual)

The AI Tutor should periodically scan all mistake entries and:

1. Group entries by skill + topic
2. Within each group, compare mistake text for similarity using NLP (lemmatization, edit distance, key phrase matching)
3. Surface groups with 3+ entries as "patterns"
4. For each pattern, generate: pattern label, frequency count, trend (increasing/stable/decreasing), suggested fix
5. Notify user via proactive tutor message when a new pattern is detected

---

## Accessibility Notes

- **Mistake list items:** Role `article` with `aria-label="Mistake: {mistake text}"`
- **Status badges:** Each badge has `aria-label` describing the status: "Status: New", "Status: Reviewed", "Status: Resolved"
- **Skill badges:** `aria-label="Skill: Grammar"`, etc.
- **Status change buttons:** `aria-label="Mark as Reviewed"`, `aria-label="Mark as Resolved"`, `aria-pressed="true/false"`
- **Detail panel:** Role `dialog` with `aria-modal="true"`, `aria-label="Mistake detail for: {mistake text}"`
- **Summary cards:** Each card is a `<button>` with `aria-label="Filter by {status}: {count} mistakes"`
- **Skill bars:** Each bar is a `<button>` with `aria-label="Filter by {skill}: {count} mistakes"`
- **Search input:** `aria-label="Search mistakes"`
- **Filter controls:** Each filter has `aria-label="Filter by {dimension}"`
- **Batch checkbox:** `aria-label="Select mistake: {mistake text}"`
- **Toggle grouping:** `aria-label="Group mistakes by pattern"`
- **AI Insight section:** Role `region` with `aria-label="AI Tutor analysis"`
- **Timeline:** Role `list` with `aria-label="Mistake history"`
- **Practice questions:** Each question has `role="group"` with `aria-label="Practice question {number of {total}}"`
- **Error announcements:** Toast and inline errors use `role="alert"`
- **Focus management:**
  - When detail panel opens, focus moves to the close button
  - When detail panel closes, focus returns to the list item that was clicked
  - When a filter changes, focus moves to the first filtered result
  - When daily review starts, focus moves to the first review card
- **Color independence:** Status is conveyed with text label in addition to color:
  - New: "New" label + red dot/badge
  - Reviewed: "Reviewed" label + amber dot/badge
  - Resolved: "Resolved" label + green dot/badge
- **Touch targets:** Minimum 44×44px for all interactive elements on mobile (status buttons, action buttons, filter chips)
- **Motion sensitivity:** Respect `prefers-reduced-motion` — disable card flip, panel slide, and counting animations; use simple fade transitions instead
- **Screen reader announcements:** When status changes, announce: "Mistake marked as Reviewed" or "Mistake marked as Resolved"
- **Keyboard navigation:**
  - Tab through list items
  - Enter/Space to open detail panel
  - Escape to close detail panel
  - Arrow keys to navigate between list items when detail panel is open
  - `s` to focus search
  - `n` to create new mistake
  - `/` to focus search (universal)

---

## Components Needed

### From Component System (Existing or New)

| Component | Type | Usage |
|-----------|------|-------|
| Button | Existing | Add Mistake, action buttons, status changes, batch actions |
| Card | Existing | Summary stat cards, mistake list items, pattern cards, practice cards |
| Badge | Existing | Skill badge, status badge, topic badge, repetition count badge |
| Input | Existing | Search input, create/edit form fields |
| Select | Existing | Filter dropdowns, sort selector |
| Modal | Existing | Create/edit form, delete confirmation |
| Drawer | New | Detail panel (slide-over on desktop) |
| BottomSheet | New | Detail panel on mobile |
| Toast | Existing | Success/error feedback for saves, deletes, status changes |
| Tabs | Existing | (Optional) view mode toggle: All / Daily Review |
| ProgressBar | Existing | Daily review progress, resolution rate bar |
| ProgressRing | New | Resolution rate ring on summary card |
| EmptyState | Existing | No mistakes, no results, no patterns |
| LoadingSkeleton | New | Summary skeletons, list skeletons, AI insight skeletons |
| ErrorState | Existing | Load failure with retry |
| Pagination | Existing | Page navigation for large lists |

### New Components to Create

1. **MistakeSummaryCards** — Row of stat cards (Total, New, Reviewed, Resolved, Resolution Rate) with counting animation and click-to-filter behavior.
2. **SkillBreakdownChart** — Horizontal bar chart showing mistake count per IELTS skill, with click-to-filter interaction.
3. **RepeatedPatternCard** — Compact card showing a mistake pattern (name, frequency, skill, action buttons for view all and AI analysis).
4. **MistakeListItem** — Individual row in the mistake list with badges, mistake/correction text, metadata, and action buttons. Variants: default, selected, pattern-grouped, daily-review.
5. **MistakeDetailPanel** — Full detail view with mistake, correction, explanation, metadata, timeline, AI insight, fix recommendations, practice questions, and related mistakes. Variants: slide-over (desktop), bottom sheet (mobile).
6. **StatusActionButtons** — Three-button group for changing mistake status (New / Reviewed / Resolved) with active state indication.
7. **AIMistakeInsight** — AI Tutor generated analysis section with insight text, rule explanation, and action buttons.
8. **MistakePracticeQuestions** — Inline practice questions generated by AI, with answer feedback and explanation.
9. **MistakeTimeline** — Compact visual timeline showing status changes over time.
10. **DailyReviewSession** — Structured one-by-one mistake review flow with reveal, explanation, and status actions.
11. **MistakeFilterBar** — Filter controls row with search input, skill/topic/status/date/repetition filters, sort selector, and active filter chips.
12. **BatchActionBar** — Floating action bar for batch operations (mark reviewed, mark resolved, add to pattern, delete) that appears when items are selected.
13. **RelatedMistakesList** — Horizontal list of mini mistake cards related by skill or pattern.
14. **MistakeForm** — Create/edit form for mistake entries (with fields for mistake, correction, explanation, source, date, skill, topic, status).

### Component States Matrix

| Component | Default | Active | Hover | Focus | Disabled | Loading | Error |
|-----------|---------|--------|-------|-------|----------|---------|-------|
| MistakeSummaryCards | Stats visible | Clicked (filter active) | Elevated | Focus ring | — | Skeleton shimmer | Inline error |
| SkillBreakdownChart | Bars proportional | Active bar highlighted | Brightness up | Focus ring | — | Skeleton bars | — |
| RepeatedPatternCard | Pattern visible | Expanded | Elevated | Focus ring | — | Skeleton | — |
| MistakeListItem | Text visible | Selected highlight | Border highlight | Focus ring | — | Opacity 0.3 | — |
| MistakeDetailPanel | All sections | — | — | Focus trap | — | Skeleton sections | Inline error |
| StatusActionButtons | Current status active | Pressed (scale) | — | Focus ring | Saving spinner | Spinner on clicked | Error toast |
| AIMistakeInsight | Insight text | — | Chip hover | Focus ring | — | Skeleton text | Error + retry |
| MistakePracticeQuestions | Questions visible | Answered | Option hover | Focus ring | Submit button disabled | Generating skeleton | Error + retry |
| MistakeTimeline | Timeline visible | — | — | — | — | — | — |
| DailyReviewSession | Review card | Revealed | — | Focus ring | Action buttons during save | Skeleton | Error + retry |
| MistakeFilterBar | All controls | Active filter | Filter hover | Focus ring | — | — | — |
| BatchActionBar | Hidden | Visible with count | Button hover | Focus ring | Action buttons disabled | Spinner on action | Error toast |
| MistakeForm | Empty or pre-filled | Input focused | Input border | Focus ring | Submit disabled | Saving spinner | Inline validation |

---

## Data Displayed

### From MistakeEntry (Database)

| Field | Display | Context |
|-------|---------|---------|
| `id` | (internal) | Unique identifier for routing, editing, deleting |
| `mistake` | Tinted red/amber card, blockquote style | Primary display in list and detail |
| `correction` | Tinted green card with arrow prefix | Correction display in list and detail |
| `explanation` | Free-form text section | Detail panel, daily review |
| `source` | Metadata line: "Source: {source}" | List and detail metadata |
| `date` | Formatted date: "Jan 15, 2026" | List metadata, detail metadata |
| `skill` | Coloured badge | List badge, skill breakdown |
| `status` | Coloured badge + status label | List badge, detail status section |
| `topic` | Neutral badge (optional) | List badge, detail metadata |
| `repetitionCount` | Badge + count: "3× repeated" | List badge, detail metadata |
| `createdAt` | Formatted date in metadata | Detail timeline |
| `updatedAt` | Formatted date in metadata | Detail timeline |

### Computed Stats (Dashboard)

| Stat | Computation |
|------|-------------|
| Total | `entries.length` |
| New count | `entries.filter(e => e.status === 'new').length` |
| Reviewed count | `entries.filter(e => e.status === 'reviewed').length` |
| Resolved count | `entries.filter(e => e.status === 'resolved').length` |
| Resolution rate | `(resolved / total) * 100` (rounded, no decimals) |
| By skill | `groupBy(entries, 'skill')` → count per skill |
| Most repeated | `maxBy(entries, 'repetitionCount')` |
| Repeated patterns | AI-detected or manual groupings of similar mistakes |
| Daily review count | Unresolved entries (new + reviewed but overdue) |

### Pattern Detection Data

| Data | Source | Display |
|------|--------|---------|
| Pattern label | AI generation or manual | Pattern name in RepeatedPatternCard |
| Frequency count | Matching entries count | Badge: "5×" |
| Associated skill | Common skill among entries | Skill badge |
| Trend | AI analysis: increasing/stable/decreasing | Small trend indicator (up arrow = increasing, dash = stable, down arrow = decreasing) |
| Sample mistakes | Up to 3 representative entries | Truncated mistake text in pattern card |
| AI analysis | AI Tutor generation | AI Insight section in detail panel |

### Daily Review Session Data

| Data | Source | Display |
|------|--------|---------|
| Current index | `currentIndex` | "3 of 8" progress |
| Queue length | `unresolvedEntries.length` | Total count in queue |
| Current mistake | `queue[currentIndex]` | Review card |
| Reviewed count | Counter | Completed count |
| Resolved count | Counter | Resolved count during session |
| Skipped count | Counter | Kept as new during session |
| Session duration | `Date.now() - startTime` | "Completed in 3m 20s" |

---

## Design Notes

### Inspired by the Reference (Personalized Learning App by Anastasia Golovko)

1. **Mistakes as learning cards, not log entries** — Each mistake should be displayed in a soft, card-based layout with distinct visual zones: error in a warm-toned area, correction in a cool-toned area, and explanation in a neutral area. The reference uses colour-coded content cards — apply this to make mistakes feel like study material, not database records.

2. **Pattern detection as insight, not accusation** — Repeated patterns should be framed positively: "You're close! This pattern appears 5 times — once you master it, these 5 mistakes become 5 strengths." The reference's motivational tone should carry into how mistakes are presented.

3. **Dashboard as error command centre** — The overview dashboard should feel like a mission control for mistake management. The reference uses large, friendly numbers and clear visual hierarchy — the summary cards, skill breakdown, and patterns section should feel empowering, not overwhelming.

4. **AI Tutor as mistake coach** — The AI insight section should feel like a tutor sitting beside the user, explaining the mistake with patience and clarity. The reference shows a helpful assistant — position the AI as a coach who turns errors into learning moments.

5. **Status workflow as progress, not bureaucracy** — The new → reviewed → resolved workflow should be presented as a learning journey, not admin. Use friendly microcopy: "Just logged" → "Got it" → "Mastered" instead of cold status labels. The reference uses warm, human language throughout.

6. **Daily Review as a habit, not a chore** — The daily review flow should feel like a quick check-in, not a tedious task. Limit to the most impactful mistakes (new + unresolved), keep the interaction simple (reveal → acknowledge → resolve), and celebrate completion.

7. **Skill breakdown as a heatmap** — The skill breakdown bars should use distinct, soft colours for each skill (blue for grammar, cyan for reading, amber for writing, violet for vocabulary, emerald for listening, rose for speaking) and animate on load. The reference uses playful coloured elements — make the skill breakdown visually engaging.

8. **Timeline as story** — The mistake timeline should tell the story of a mistake's journey from error to mastery. Each dot is a chapter, the connecting line is progress. The reference's timeline-like progress elements inspire this narrative approach.

9. **Practice questions as immediate application** — When AI generates practice questions for a mistake, they should feel like the next logical step, not a separate activity. Inline answering with immediate feedback turns passive reading into active learning.

10. **Mobile-first mistake management** — Even on desktop, the mistake detail panel should feel intimate and focused. Use a slide-over panel (not a full page) that keeps the list visible for context. The reference's card-based layout works perfectly for this — centred, contained, never sprawling.

### Mistake Review as a Learning System

The mistake review should be an integral part of the IELTS learning loop:

- **Capture → Understand → Practice → Master**: Each mistake follows this cycle
- **Micro-feedback loop**: Adding a mistake immediately triggers AI analysis → practice generation → skill improvement
- **Progress signal**: Resolution rate trends upward over time, visible on the dashboard and in the progress page
- **Connected to study plan**: If a skill has many new mistakes, the study plan should adjust to include more practice in that area
- **Connected to vocabulary**: Vocabulary mistakes link to the vocabulary notebook for word-level practice
- **Celebration milestones**: "10 mistakes resolved! 🎉" "First mistake-free week! 🏆"

### Microcopy Guidelines

| Context | Current | Proposed |
|---------|---------|----------|
| Status: new | "New" | "Just Logged" |
| Status: reviewed | "Reviewed" | "Got It" |
| Status: resolved | "Resolved" | "Mastered" |
| Repetition | "3× repeated" | "Showed up 3 times" |
| Add button | "Add Mistake" | "Log a Mistake" |
| Daily review | "Daily Review" | "Today's Error Check" |
| Resolution rate | — | "Mastery Progress" |
| Pattern detection | — | "Your Learning Patterns" |
| AI analysis | — | "Coach's Notes" |

### Color Coding

| Element | Color Token | Usage |
|---------|-------------|-------|
| Mistake text bg | `--color-danger-light` (soft red) | Mistake display block |
| Correction text bg | `--color-success-light` (soft green) | Correction display block |
| New status | `--color-danger` (red) | Status badge, timeline dot |
| Reviewed status | `--color-warning` (amber) | Status badge, timeline dot |
| Resolved status | `--color-success` (green) | Status badge, timeline dot |
| Grammar skill | `--color-skill-grammar` (blue) | Skill bar, skill badge |
| Reading skill | `--color-skill-reading` (cyan) | Skill bar, skill badge |
| Writing skill | `--color-skill-writing` (amber) | Skill bar, skill badge |
| Speaking skill | `--color-skill-speaking` (rose) | Skill bar, skill badge |
| Listening skill | `--color-skill-listening` (emerald) | Skill bar, skill badge |
| Vocabulary skill | `--color-skill-vocabulary` (violet) | Skill bar, skill badge |
| AI insight bg | `--color-tutor-proactiveLight` | AI analysis section |

### Spacing and Layout Notes

- Summary cards: Equal width in a flex row, `gap-4` between cards
- Skill breakdown: Full-width bars with `h-3` height, `rounded-full` caps, `gap-2` between bars
- Mistake list items: `p-4` padding, `gap-3` between elements inside, `space-y-2` between items
- Detail panel padding: Desktop `p-6`, mobile `p-4`
- Detail panel width: Desktop `max-w-lg` (32rem), mobile full width
- Daily review card: `max-w-xl` (36rem) centered, `p-8` padding
- Pattern cards: Compact, `p-3` padding, `gap-2` between elements
- AI insight section: `p-4` with `rounded-xl` corners and tinted background
