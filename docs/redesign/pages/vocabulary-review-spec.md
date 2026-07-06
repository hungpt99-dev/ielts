# IELTS Journey — Vocabulary Review Page Specification

## Page Purpose

The Vocabulary Review page is a dedicated spaced-repetition review session system for IELTS vocabulary. It provides an interactive, multi-mode review experience where users strengthen word recall through flashcard-style prompts, quiz mechanics, and active recall exercises. The review is driven by spaced repetition algorithms that schedule word appearances based on the user's memory performance, ensuring efficient long-term retention.

## User Goal

Users should feel, when using the Vocabulary Review page:

- **Focused** — The review is a distraction-free session dedicated to vocabulary retention
- **Challenged** — Multiple review modes test recall from different angles (word-to-meaning, meaning-to-word, gap-fill, collocations, multiple choice, typing)
- **Tracked** — Session progress is clear (current position, time spent, words remaining)
- **Rewarded** — Completion feedback shows accuracy, rating breakdown, and a clear path for words needing more practice
- **Confident** — Spaced repetition ensures words they know appear less often while difficult words resurface until mastered
- **In control** — Configurable session size, topic/difficulty/status filters, and choice of review modes
- **Supported** — AI Tutor provides post-session recommendations for weak words

The review should feel like an effective study session, not a passive quiz. Active recall with immediate feedback is the core loop.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/features/vocabulary-review/ReviewSession.tsx:39-453`, `apps/web/src/features/vocabulary-review/SessionSummary.tsx:29-128`, `apps/web/src/features/vocabulary-review/reviewService.ts:64-86`, `apps/web/src/features/vocabulary-review/reviewModes.tsx:36-344`):

1. **Configuration screen is a stacked form** — The session config (topics, difficulty, status, review modes, session size) is rendered as five separate Card components stacked vertically. The interface feels like a settings panel, not an inviting start to a review session. No visual hierarchy or motivational framing.

2. **Review card is uniform across all modes** — All six review modes render inside the same Card component with identical padding and structure. There is no visual differentiation between a typing mode (which needs input) and a flashcard mode (which needs reveal + rating). The layout does not adapt to mode requirements.

3. **Rating buttons always visible before reveal** — The four rating buttons (Again, Hard, Good, Easy) are visible at the bottom of the card even before the user has revealed or attempted to recall the word. For word-to-meaning and meaning-to-word modes, users must tap "Tap to reveal meaning" first, but the rating buttons remain present, creating visual distraction.

4. **No animation or micro-interaction** — Card transitions between words are instant. No flip animation, no slide transition, no visual feedback when rating is applied. The queue index updates immediately without any sense of progression.

5. **Session summary is basic** — The `SessionSummary` component shows accuracy, reviewed count, correct count, review-again count, and a rating breakdown bar chart. There is no list of specific words rated "again" or "hard" that the user should focus on. The `weakWords` computation is broken (always returns empty).

6. **Multiple choice options are shuffled raw** — Distractors are randomly selected from other vocabulary entries. There is no intelligent distractor selection (same topic, same difficulty, common confusions). Correct answer is not highlighted with sufficient visual distinction.

7. **Typing mode lacks input field** — The typing mode (`TypingMode` component) shows the meaning and expects the user to recall the word, but there is no text input field to type into. It operates as a reveal-only mode, making it functionally identical to meaning-to-word.

8. **Gap-fill mode requires both word and example sentence** — The gap-fill mode depends on `vocab.exampleSentence`. If no example sentence exists, it shows the full sentence with no blank, which breaks the mode completely.

9. **Keyboard shortcuts are not discoverable** — While the component supports keyboard shortcuts (Space to reveal, 1-4 for ratings), there is no visual hint in the UI beyond a small text line showing "Press Space to reveal". No help overlay or shortcut legend exists.

10. **No session timer or pace awareness** — There is no indication of time spent per word or per session. Users cannot gauge whether they are rushing or spending too long per word.

11. **No AI Tutor integration in review** — The review session has no AI Tutor entry point. After completing a session, users cannot ask the AI to explain difficult words, generate more examples, or suggest related vocabulary.

12. **Config cannot be saved as preset** — Every session requires reconfiguring topics, difficulties, statuses, modes, and session size. There is no "save as preset" or "quick start with last config" option.

13. **No word detail access during review** — If a user wants to see the full word detail (collocations, synonyms, word family) during review, they must exit the session. No "View word detail" action is available on the review card.

14. **No celebration on session completion** — The completion screen shows a checkmark icon and stats but has no motivational messaging, no streak update, and no confetti or celebration effect.

---

## Proposed Layout

The Vocabulary Review page is structured as a focused, full-height session experience with three phases: configuration → review → summary.

### Desktop Layout (>= 1024px)

```
┌──────────────────────────────────────────────────────────────┐
│  Phase 1: Session Configuration (pre-review)                 │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Header: "Vocabulary Review" subtitle + quick filters  │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Quick Start Cards (3 options):                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ Due Words    │ │ Weak Words  │ │ Custom Session  │  │  │
│  │  │ 🔄 12 due   │ │ ⚠️ 8 weak   │ │ ⚙️ Configure    │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Advanced Configuration (collapsible):                 │  │
│  │  [Topics ▼] [Difficulty] [Status] [Modes] [Size]      │  │
│  │  [Start Review — N words]  [Save as Preset]            │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│  Phase 2: Active Review Session                              │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Session Header                                        │  │
│  │  [← Exit] "Word → Meaning" [Cycle Mode] [⚙️ Settings] │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  Progress Bar: [████████░░░░░░░░░] 5 / 20              │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │           REVIEW CARD (Flashcard)              │    │  │
│  │  │                                                │    │  │
│  │  │  ┌──────────────────────────────────────┐      │    │  │
│  │  │  │         Word / Prompt Area           │      │    │  │
│  │  │  │                                      │      │    │  │
│  │  │  │    "ubiquitous"                      │      │    │  │
│  │  │  │    /juːˈbɪkwɪtəs/                   │      │    │  │
│  │  │  │    adjective                         │      │    │  │
│  │  │  │                                      │      │    │  │
│  │  │  │    [🔊 Pronounce]                    │      │    │  │
│  │  │  └──────────────────────────────────────┘      │    │  │
│  │  │                                                │    │  │
│  │  │  ┌─ Reveal Area ────────────────────────┐      │    │  │
│  │  │  │  [Tap to reveal meaning]  (hidden)   │      │    │  │
│  │  │  │                                      │      │    │  │
│  │  │  │  OR (after reveal):                  │      │    │  │
│  │  │  │  Meaning: Present everywhere         │      │    │  │
│  │  │  │  Example: "Smartphones are ..."      │      │    │  │
│  │  │  │  [View Word Detail →]                │      │    │  │
│  │  │  └──────────────────────────────────────┘      │    │  │
│  │  │                                                │    │  │
│  │  │  ┌─ Rating Bar ─────────────────────────┐      │    │  │
│  │  │  │                                        │      │    │  │
│  │  │  │ [Again 1] [Hard 2] [Good 3] [Easy 4]  │      │    │  │
│  │  │  │    red       orange    blue      green │      │    │  │
│  │  │  └────────────────────────────────────────┘      │    │  │
│  │  │                                                │    │  │
│  │  │  Difficulty: Medium · Topic: Technology        │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ⚡ Keyboard: Space=Reveal · 1=Again · 2=Hard · 3=Good · 4=Easy │
└──────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌──────────────────────────────────┐
│  Session Header                  │
│  [←] "Word → Meaning" [⚙️]      │
├──────────────────────────────────┤
│  Progress: [████░░░] 5/20       │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │      REVIEW CARD           │  │
│  │                            │  │
│  │    "ubiquitous"            │  │
│  │    /juːˈbɪkwɪtəs/         │  │
│  │    adjective               │  │
│  │                            │  │
│  │    [🔊]                    │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ Meaning: Present     │  │  │
│  │  │ everywhere           │  │  │
│  │  │ "Smartphones are..." │  │  │
│  │  └──────────────────────┘  │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │  [Again]  [Hard]     │  │  │
│  │  │  [Good]   [Easy]     │  │  │
│  │  └──────────────────────┘  │  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Bottom Navigation               │
└──────────────────────────────────┘
```

---

## Main Sections

### Phase 1: Session Configuration

#### 1. Quick Start Cards

**Purpose:** Allow users to start a review session instantly with one tap, without configuring filters.

**Cards:**
- **Due Words** — Auto-selects all vocabulary due for review today. Shows count of due words. Primary action for daily review.
- **Weak Words** — Filters to "hard" difficulty and "learning" status words. Shows count of weak words. For focused practice on challenging vocabulary.
- **Custom Session** — Opens advanced configuration. Shows a gear icon. For users who want full control.

**Behavior:**
- Tapping "Due Words" or "Weak Words" immediately loads the queue and starts the session
- Tapping "Custom Session" scrolls to or expands the advanced configuration section
- Quick start cards show loading state while building the queue

#### 2. Advanced Configuration

**Purpose:** Fine-grained control over which words are included in the review session.

**Sections (collapsible accordion):**

- **Topics** — Multi-select chip grid of IELTS topics (Education, Technology, Environment, etc.). Chips show selected state with filled color. "Select All" / "Clear All" toggle. Default: all topics selected.
- **Difficulty** — Three toggle buttons: Easy (green), Medium (amber), Hard (red). Multi-select. Default: all selected.
- **Status** — Four toggle pills: New, Learning, Reviewing, Mastered. Multi-select. Default: all except Mastered.
- **Review Modes** — Checkbox list with descriptions for each mode:
  - Word → Meaning (see word, recall meaning)
  - Meaning → Word (see meaning, recall word)
  - Gap-fill (fill blank in sentence)
  - Collocations (review word combinations)
  - Multiple Choice (pick correct meaning)
  - Typing (type answer from memory)
  Default: all selected. Cycle Mode button during session rotates through selected modes.
- **Session Size** — Range slider from 5 to 50 words, step 5. Shows current count. Default: 20.

**Actions:**
- "Start Review" primary button — shows estimated word count: "Start Review — 18 words"
- "Save as Preset" secondary button — saves current config as named preset for future use
- "Reset to Defaults" text link

**Empty Config Warning:**
If filters result in zero words, show inline warning: "No words match your filters. Adjust your selection to include more words."

#### 3. Session Presets (Future)

**Purpose:** Saved configurations for different review types.

- "Daily Review" — due words, all modes, 20 words
- "Weak Words Focus" — hard difficulty, learning status, word-to-meaning + multiple choice, 15 words
- "Exam Prep" — all words, all modes, 30 words
- User-created custom presets

Presets appear as quick-select cards above the advanced configuration.

---

### Phase 2: Active Review Session

#### 4. Session Header

**Purpose:** Show current review mode, provide session controls.

**Content:**
- Back/Exit button (with confirmation dialog if session has progress)
- Current review mode label with mode icon:
  - Word → Meaning: 👁️ icon
  - Meaning → Word: 💭 icon
  - Gap-fill: ✏️ icon
  - Collocations: 🔗 icon
  - Multiple Choice: ✅ icon
  - Typing: ⌨️ icon
- "Cycle Mode" button (rotates through selected modes)
- Settings gear icon (returns to configuration without losing queue)

**Behavior:**
- Exit confirmation: "You have X words remaining. Are you sure you want to exit?" with [Cancel] [Save & Exit] [Exit Without Saving]
- Cycle Mode transitions with a brief card flip animation

#### 5. Progress Bar

**Purpose:** Show session progress at a glance.

**Content:**
- Rounded progress bar (full width)
- Current position: "5 / 20" using tabular-nums for stable width
- Percentage fills with animated width transition on each rating
- Color shifts from primary to success as session approaches 100%

**Variants:**
- Default: blue/primary fill
- Complete: green fill with subtle glow

#### 6. Review Card (Flashcard / Quiz)

**Purpose:** The core interaction element — displays the word prompt and facilitates recall.

**Structure (varies by mode):**

##### Word → Meaning (Flashcard)
- **Front (before reveal):**
  - Word displayed prominently (3xl, bold)
  - Pronunciation IPA text below
  - Part of speech in italic
  - Pronunciation speaker button (🔊)
  - "Tap to reveal meaning" prompt (subtle, blue text)
- **Back (after reveal):**
  - Translation / meaning displayed in a tinted card
  - Vietnamese translation (if available) below
  - Example sentence in italic quotes
  - "View Word Detail →" link (opens a mini modal)
- **Transition:** Card flips horizontally (CSS 3D transform) with 300ms ease-out

##### Meaning → Word (Reverse Flashcard)
- **Front (before reveal):**
  - Meaning displayed prominently (2xl, semibold)
  - Part of speech hint
  - "Tap to reveal word" prompt
- **Back (after reveal):**
  - Word displayed in tinted card
  - Pronunciation + speaker button
  - Example sentence
- **Transition:** Card flips horizontally

##### Gap-fill
- **Prompt:** Sentence with the target word masked (first and last letter visible, underscores in between)
  - Example: "Smartphones are u________s in modern society."
  - Masked word highlighted with yellow/orange background
- **Answer area:** After reveal, shows the complete sentence with the word filled in, plus the word and meaning below
- **Note:** If no `exampleSentence` exists, show a fallback message: "No example sentence available for this word" and skip this mode for that word

##### Collocations
- **Prompt:** Word displayed with "Recall collocations and related words"
- **Answer area:** Collocation chips, synonym chips (green), antonym chips (red) — same as current implementation
- **Interaction:** User tries to recall collocations before revealing

##### Multiple Choice (Quiz)
- **Prompt:** Word displayed with pronunciation
- **Options:** 4 choices (1 correct meaning + 3 distractors)
  - Distractors should prefer same-topic and same-difficulty words when available
  - Options displayed as buttons with letter labels (A, B, C, D)
  - Shuffled order per word
- **Before answer:** Options are interactive, hover shows subtle background
- **After answer:**
  - Correct: option turns green with checkmark
  - Incorrect: selected option turns red with X, correct option turns green
  - Feedback text: "Correct!" or "The correct answer is: [meaning]"
  - Rating buttons enabled only after answering
- **Progress note:** Multiple choice mode does not auto-advance; user must rate after seeing answer

##### Typing (Active Recall)
- **Prompt:** Meaning displayed, user must type the word from memory
- **Input field:** Text input with placeholder "Type the word..."
  - Auto-capitalization off
  - Submit on Enter key
  - Clear button on input
- **Feedback (after submit or reveal):**
  - Correct: input turns green border, success message, auto-rate as "good"
  - Incorrect: input turns red border, shows correct word below with green highlight
  - User can also tap "Show answer" to reveal without typing
- **Rating:** After feedback, the four rating buttons appear (default to "good" if correct, "again" if incorrect)

#### 7. Rating Bar

**Purpose:** Self-assessment of recall quality after attempting the word.

**Buttons (always visible after reveal/answer):**

| Button | Color | Keyboard | Action |
|--------|-------|----------|--------|
| Again | Red / Danger | 1 | Resets interval to 1 day, ease factor -0.2 |
| Hard | Orange / Warning | 2 | Interval × 1.2, ease factor -0.15 |
| Good | Blue / Primary | 3 | Standard interval, ease factor unchanged |
| Easy | Green / Success | 4 | Bonus interval, ease factor +0.15 |

**Behavior:**
- Buttons appear with a slide-up animation after reveal
- Selected button shows pressed state with `scale(0.95)` briefly
- Rating saves to IndexedDB and advances to next word
- Disabled state while saving (loading spinner on button)
- Keyboard shortcut label shown on each button: "Again (1)", "Hard (2)", etc.
- Tooltip on hover: explains the spaced repetition effect (e.g., "See again in 1 day", "See again in 4 days")

#### 8. Word Detail Mini Modal

**Purpose:** Allow users to view full word detail without leaving the review session.

**Content (slide-over modal on desktop, bottom sheet on mobile):**
- Word, pronunciation, part of speech, meaning, translation
- Example sentence
- Collocations, synonyms, antonyms (chip display)
- Word family (if available)
- "Ask AI Tutor" button → opens AI Tutor with word context
- "Close" button returns to review card

**Behavior:**
- Opens from the "View Word Detail →" link at the bottom of the revealed card
- Does not pause the session or advance the word
- Closes with Escape key or tap outside
- Current word state is preserved

#### 9. Keyboard Shortcuts Legend

**Purpose:** Make keyboard navigation discoverable.

**Content:** Small floating indicator in the bottom-right corner (desktop only):
- "Space" to reveal/hide
- "1-4" to rate
- "?" to toggle shortcut help overlay

**Help Overlay:**
- Triggered by pressing "?" key
- Shows all keyboard shortcuts in a modal:
  - Space / R — Reveal answer
  - 1 — Again
  - 2 — Hard
  - 3 — Good
  - 4 — Easy
  - C — Cycle review mode
  - Esc — Exit / close
  - ? — Toggle this help

---

### Phase 3: Session Summary

#### 10. Completion Header

**Purpose:** Celebrate session completion and show key metrics.

**Content:**
- Large checkmark or trophy icon in a green circle
- "Review Complete!" title
- Motivational message based on accuracy:
  - ≥ 90%: "Excellent! You really know these words!"
  - ≥ 70%: "Great session! Keep up the good work."
  - ≥ 50%: "Good effort! Review the words you missed."
  - < 50%: "Keep practicing! These words need more attention."
- "You reviewed X words in Ym Zs"
- Streak update if applicable: "🔥 5-day study streak!"

**Animation:**
- Icon bounces in with spring animation
- Stats fade in sequentially with staggered delays

#### 11. Stats Grid

**Purpose:** Quantitative session summary.

**Cards (4-column grid on desktop, 2×2 on mobile):**

| Stat | Format | Color |
|------|--------|-------|
| Accuracy | Percentage (68%) | Green / Red based on threshold |
| Reviewed | Total count (20) | Primary |
| Correct | Count (14) | Green / Success |
| Review Again | Count (6) | Red / Danger |

#### 12. Rating Breakdown

**Purpose:** Show distribution of ratings given during the session.

**Content:**
- Section title "Rating Breakdown"
- Four horizontal bars (Again, Hard, Good, Easy) with:
  - Label and color
  - Filled bar proportional to count
  - Count number at end
- Total is 100% across all ratings

#### 13. Words to Review Again

**Purpose:** Highlight specific words that need more practice (rated "again" or "hard").

**Content:**
- Section title "Words to Practice More"
- Horizontal scrollable row (desktop) or vertical list (mobile) of word mini-cards
- Each mini-card shows:
  - Word text
  - Rating badge (Again = red, Hard = orange)
  - Meaning (truncated)
  - "Practice" button → starts a mini-session with these words
  - "Ask AI" button → opens AI Tutor with word context

**Empty state:** "No words need review — great job!" if all words were rated "good" or "easy".

#### 14. Action Buttons

**Purpose:** Next steps after session completion.

**Buttons:**
- "Start New Review" primary button → returns to session configuration
- "Review Weak Words" secondary button → starts a new session filtered to words rated "again" and "hard" from this session
- "Back to Vocabulary" ghost button → returns to vocabulary notebook
- "Ask AI Tutor for Recommendations" ghost button → opens AI Tutor with session context

#### 15. AI Tutor Recommendations Section

**Purpose:** Post-session AI-powered guidance for vocabulary improvement.

**Content (appears below stats):**
- Section with subtle tutor-themed background (`--color-tutor-proactiveLight`)
- Sparkle icon + "AI Tutor Review" heading
- Generated recommendation text using session data:
  - Example: "You struggled with 6 words today. I recommend practicing these words in context — try writing a sentence for each one. Would you like me to generate example sentences for them?"
  - Example: "Great session! Your Technology topic words are strong. Your Education topic words need more attention. Want to create a focused review for Education?"
- Action chips:
  - "Generate Example Sentences" → AI generates sentences for weak words
  - "Create Focused Review" → starts new session with weak words
  - "Explain Difficult Words" → opens AI Tutor with weak word list

---

## Primary Actions

| Action | Phase | Context |
|--------|-------|---------|
| Start Review | Configuration | Primary CTA, begins session |
| Due Words Quick Start | Configuration | Instant session with due words |
| Weak Words Quick Start | Configuration | Instant session with weak words |
| Custom Session Configure | Configuration | Opens advanced config |
| Save as Preset | Configuration | Save current config |
| Tap to Reveal | Review | Reveals answer on flashcard modes |
| Rate Word (Again/Hard/Good/Easy) | Review | Saves rating, advances to next word |
| Cycle Mode | Review | Rotates to next review mode |
| View Word Detail | Review | Opens mini modal with full word info |
| Listen to Pronunciation | Review | Plays TTS pronunciation |
| Start New Review | Summary | Returns to config for a new session |
| Review Weak Words | Summary | Starts focused session on weak words |
| Back to Vocabulary | Summary | Returns to vocabulary notebook |
| Ask AI Tutor | Summary | Opens AI Tutor with session context |

## Secondary Actions

| Action | Phase | Context |
|--------|-------|---------|
| Exit Session | Review | Returns to config or vocabulary |
| Reset Filters | Configuration | Clears all filter selections |
| Select All / Clear All Topics | Configuration | Batch topic selection |
| Change Session Size | Configuration | Adjust word count via slider |
| Toggle Keyboard Help | Review | Shows/hides shortcut overlay |
| Practice Single Word | Summary | Opens mini-session for one word |
| Generate Sentences via AI | Summary | AI generates sentences for weak words |
| Create Focused Review | Summary | Auto-configures session for weak words |
| Explain with AI Tutor | Review / Summary | Opens AI Tutor with word context |

---

## Empty State

### All Words Mastered (No Due Words)

- **Icon:** Shield with checkmark or trophy
- **Title:** "All caught up!"
- **Description:** "All your vocabulary words are up to date. Add new words to keep learning, or check back later for review."
- **Action:** "Add New Words" → navigates to vocabulary notebook
- **Secondary:** "Browse Vocabulary" → navigates to vocabulary notebook

### No Words in Vocabulary

- **Icon:** Open book with plus
- **Title:** "No words to review yet"
- **Description:** "Save your first vocabulary word to start reviewing. You can add words manually, save them from practice passages, or ask the AI Tutor to suggest IELTS vocabulary."
- **Action:** "Add Your First Word" → navigates to vocabulary notebook / add word modal

### Filters Produced No Results

- **Icon:** Filter with cross
- **Title:** "No words match your filters"
- **Description:** "Try selecting more topics, difficulties, or statuses to include more words in your review."
- **Action:** "Reset Filters" → resets to defaults
- **Secondary:** "Go to Vocabulary" → navigates to vocabulary notebook

### Session Queued But No Words Fit Modes

- **Icon:** Warning triangle
- **Title:** "Some modes skipped"
- **Description:** "Some review modes were skipped because the queued words lack the required data (e.g., gap-fill needs example sentences). Your session will use the available modes."
- **Action:** "Continue Anyway" → starts session with available modes

---

## Loading State

### Config Loading

- **Pattern:** Skeleton cards matching the three quick-start cards + skeleton filter pills
- **Animation:** Shimmer effect
- **Duration:** Until `DatabaseService.getAll('vocabulary')` and `DatabaseService.getAll('vocabularyReviews')` resolve

### Session Loading (Building Queue)

- **Pattern:** Progress bar with indeterminate animation + centered text: "Building your review queue..."
- **Detail text:** "Selecting words based on spaced repetition schedule..."
- **Animation:** Pulsing bar with gradient

### Saving Rating

- **Button loading state:** The tapped rating button shows spinner + "Saving..."
- **Duration:** Until `DatabaseService.put('vocabularyReviews')` resolves
- **Fallback:** If save fails, show error toast; word stays in place for re-rating

### Session Summary Loading

- **Pattern:** Skeleton stats grid (4 skeleton stat cards) + skeleton rating breakdown bars
- **Animation:** Shimmer effect
- **Duration:** Minimal (data is already in memory)

---

## Error State

### Failed to Load Vocabulary / Reviews

- **Layout:** Centered error card in the review area
- **Icon:** Database warning or broken connection icon
- **Title:** "Could not load your vocabulary"
- **Description:** Error message from `DatabaseService.getAll()` catch block
- **Action:** "Try Again" — retries loading data
- **Fallback:** "Go to Vocabulary" — navigates to vocabulary notebook even if loading fails

### Failed to Save Rating

- **Feedback:** Toast notification: "Failed to save rating. Please try again."
- **Recovery:** Word remains on screen, user can tap a different rating or retry
- **Data loss prevention:** Ratings are saved one at a time; no batch loss

### Database Operation Failed

- **Feedback:** Toast error with the specific operation name
- **Action:** "Retry" button in toast
- **Fallback:** If session cannot continue, show error state with "Exit to Vocabulary" action

### AI Recommendation Failed (Summary Phase)

- **Layout:** The AI Tutor section shows a fallback message
- **Content:** "AI recommendations are temporarily unavailable."
- **Action:** "Try Again" button or "Skip" to dismiss
- **Fallback:** Show generic study tips instead of AI-generated recommendations

---

## Mobile Layout

### Screen Adaptation

| Phase | Desktop (≥1024px) | Mobile (<768px) |
|-------|-------------------|------------------|
| Configuration | 3-column quick start cards + collapsible config | Full-width stacked quick start cards + accordion config |
| Session Header | Full width with visible shortcuts | Compact header with icon-only buttons |
| Review Card | Centered max-w-2xl card | Full-width card, reduced padding |
| Rating Bar | Horizontal row of 4 buttons | 2×2 grid of buttons (Again/Hard top, Good/Easy bottom) |
| Session Summary | 4-column stats grid + horizontal weak words row | 2×2 stats grid + vertical weak word list |
| AI Tutor Section | Right of summary or below | Full width below summary |

### Configuration on Mobile

- Quick Start Cards: Full-width, stacked vertically with icons
- Advanced Configuration: Accordion-style, each section (Topics, Difficulty, Status, Modes, Size) is a collapsible panel
- "Start Review" button: Sticky at the bottom of the screen
- Touch targets: Minimum 44×44px for all filter chips, toggle buttons, and action buttons

### Review Card on Mobile

- Reduced horizontal padding (`px-4` vs `px-8`)
- Word displayed in `text-2xl` (smaller than desktop's `text-3xl`)
- Pronunciation button positioned to the right of the word in same line
- "Tap to reveal" text slightly smaller
- Rating buttons in 2×2 grid layout for thumb reachability:
  - Top row: Again (red, left), Hard (orange, right)
  - Bottom row: Good (blue, left), Easy (green, right)
- Word detail link at bottom: "View details"

### Keyboard on Mobile

- Typing mode automatically focuses the input and shows the soft keyboard
- Keyboard-aware layout: Input remains visible when keyboard is open
- No keyboard shortcut indicators (keyboard not available on mobile)

### Session Summary on Mobile

- Stats grid: 2 columns × 2 rows
- Weak words list: Vertical stack, each word is a full-width card
- Action buttons: Full-width, stacked vertically
- AI Tutor section: Full width, below all stats

### Gesture Support

- **Swipe left:** On review card (before rating) opens word detail mini modal
- **Swipe right:** On review card does nothing (prevents accidental navigation)
- **Swipe down:** On session summary dismisses AI Tutor section if open
- **Tap outside:** Closes word detail mini modal
- **Pull to refresh:** Not applicable (sequential flow, not a list)

### Bottom Navigation on Mobile

- **During review session:** Bottom navigation is hidden (full-screen focus mode)
- **Summary phase:** Bottom navigation reappears with standard items
- **Configuration phase:** Bottom navigation visible

---

## Responsive Behavior

| Breakpoint | Review Card Width | Rating Layout | Config Layout | Summary Layout |
|------------|-------------------|---------------|---------------|----------------|
| < 480px (small phone) | Full width (px-4) | 2×2 grid | Stacked accordion | 2×2 stats, vertical weak words |
| 480–767px (large phone) | Max-w-md (28rem) | 2×2 grid | Stacked accordion | 2×2 stats, vertical weak words |
| 768–1023px (tablet) | Max-w-lg (32rem) | Horizontal row | 2-col quick start + inline config | 4-col stats, horizontal weak words |
| 1024–1439px (desktop) | Max-w-xl (36rem) | Horizontal row | 3-col quick start + inline config | 4-col stats, horizontal weak words |
| 1440px+ (large desktop) | Max-w-2xl (42rem) | Horizontal row | 3-col quick start + inline config | 4-col stats + side AI section |

- **Transition animations:** Card content changes with fade + slight scale (200ms ease-out)
- **Mode switch animation:** When cycling modes, card performs a quick flip animation (300ms)
- **Rating animation:** Button press shows `scale(0.95)` briefly, then card advances with slide-up + fade of content

---

## AI Tutor Integration

### Entry Points

1. **Post-Session Recommendations (Summary Phase):**
   - AI Tutor section at the bottom of the session summary
   - Context-aware recommendation based on session results:
     - Words rated "again" and "hard"
     - Accuracy percentage
     - Topics with lowest performance
   - Action chips for: generate example sentences, create focused review, explain difficult words

2. **Word Detail Mini Modal — "Ask AI Tutor":**
   - Button in the word detail panel opened during review
   - Pre-fills AI Tutor with word context: "Explain the word '{word}' and give me IELTS usage examples"

3. **Weak Words — "Ask AI" Button:**
   - Each word in the "Words to Review Again" list has an "Ask AI" icon
   - Opens AI Tutor with the weak word for explanation

4. **Configuration Phase — AI Suggestion:**
   - Optional AI suggestion in config: "Based on your recent mistakes, I recommend reviewing these 5 words..." (appears as a small card)

### Chat Context Payload

When opening AI Tutor from review session:

```json
{
  "context": "vocabulary-review",
  "sessionId": "uuid-of-session",
  "accuracy": 68,
  "weakWords": ["ubiquitous", "paradigm", "ameliorate"],
  "weakTopics": ["Technology", "Environment"],
  "totalReviewed": 20,
  "correctCount": 14,
  "sessionDurationMs": 480000
}
```

The AI Tutor should respond with:
- Encouragement based on accuracy
- Specific strategies for the weak words
- Suggestions for incorporating weak words into writing/speaking practice
- Optional: recommended study plan adjustments

### AI Feature States

| State | Display |
|-------|---------|
| Recommendation available | Full AI Tutor section with generated content |
| AI loading | Skeleton text block with shimmer animation |
| AI unavailable (offline) | "AI recommendations are available when you're online. Keep reviewing!" |
| Error | "Could not generate recommendations. [Try Again]" |
| No data to analyze | "Complete a review session to get personalized AI recommendations." |

---

## Accessibility Notes

- **Review card:** Role `article` or `region` with `aria-label="Review card for word {word}"`
- **Reveal button:** `aria-expanded="true/false"` to indicate whether answer is visible
- **Rating buttons:** Each button has `aria-label` describing action and effect:
  - "Rate Again — see this word again tomorrow"
  - "Rate Hard — this word needs more practice"
  - "Rate Good — I know this word"
  - "Rate Easy — I know this word very well"
- **Progress bar:** `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax={queue.length}`, `aria-label="Review progress"`
- **Multiple choice options:** Each option is a `<button>` with `aria-label="Option A: {meaning}"`, `aria-pressed="true/false"`
- **Keyboard shortcuts:** Visible shortcut indicators on each button; `aria-keyshortcuts` attribute on buttons: `aria-keyshortcuts="1"` for Again, etc.
- **Session summary:** Use `aria-live="polite"` for dynamic stat updates
- **Error announcements:** Toast and inline errors use `role="alert"`
- **Focus management:**
  - When card advances, focus moves to the reveal button (or first option for multiple choice)
  - When session completes, focus moves to the summary heading
  - When closing word detail mini-modal, focus returns to the review card
- **Color independence:** Rating buttons use icons + text in addition to color:
  - Again: "⟳" icon + red
  - Hard: "▲" icon + orange
  - Good: "●" icon + blue
  - Easy: "★" icon + green
- **Touch targets:** Minimum 44×44px for all interactive elements on mobile
- **Motion sensitivity:** Respect `prefers-reduced-motion` — disable card flip animations, use simple fade transitions instead
- **Screen reader announcements:** After rating, announce: "Advancing to next word. Word X of Y."

---

## Components Needed

### From Component System (Existing or New)

| Component | Type | Usage |
|-----------|------|-------|
| Button | Existing | Start Review, Cycle Mode, rating buttons, action buttons |
| Card | Existing | Review card, config cards, summary stat cards, weak word cards |
| Badge | New | Difficulty badge, status badge, topic badge on review card |
| Input | Existing | Typing mode input field |
| Modal | Existing | Keyboard shortcuts help, exit confirmation, word detail mini modal |
| Drawer | New | Word detail panel (slide-over on desktop) |
| Toast | Existing | Error feedback for save failures |
| ProgressBar | Existing | Session progress bar (review phase) |
| ProgressRing | New | (Optional) accuracy display on summary |
| EmptyState | Existing | No due words, no vocabulary, no results |
| LoadingSkeleton | New | Config skeleton, summary skeleton |
| ErrorState | Existing | Load failure with retry |
| Tabs | Existing | (Optional) mode selector pills in config |
| Select | Existing | (Not used in review; config uses chips/toggles) |
| Slider | Existing | Session size range slider |
| IconButton | New | Pronunciation speaker, cycle mode, settings gear, close detail |

### New Components to Create

1. **ReviewCard** — The core flashcard/quiz component that renders the current review mode's prompt and handles reveal state. Variants: flashcard-front, flashcard-back, quiz-options, typing-input, gap-fill.
2. **RatingButtons** — Row of 4 spaced-repetition rating buttons (Again, Hard, Good, Easy) with keyboard shortcuts, tooltips, and loading states. Variants: horizontal (desktop), 2×2 grid (mobile).
3. **ReviewSessionConfig** — Configuration panel with quick-start cards, topic/difficulty/status/mode/size selectors, and session presets.
4. **SessionSummary** — Post-session summary with stats grid, rating breakdown, weak words list, and action buttons.
5. **WeakWordCard** — Compact mini-card for a word in the "Words to Review Again" list. Shows word, rating badge, meaning, practice and ask-AI actions.
6. **AITutorReviewSection** — AI-powered post-session recommendation section with generated text and action chips.
7. **WordDetailMiniModal** — Compact word detail panel accessible during review (shows meaning, example, collocations, synonyms, word family, AI action).
8. **KeyboardShortcutOverlay** — Help modal showing all keyboard shortcuts for the review session.
9. **ReviewModeRenderer** — Pluggable renderer for each review mode (word-to-meaning, meaning-to-word, gap-fill, collocation, multiple-choice, typing). Each mode has its own component.
10. **SessionProgressBar** — Animated progress bar with position counter and smooth width transitions.

### Component States Matrix

| Component | Default | Active | Hover | Focus | Disabled | Loading | Error |
|-----------|---------|--------|-------|-------|----------|---------|-------|
| ReviewCard | Shows prompt | Revealed state | — | Outline ring | — | Skeleton | Error inline |
| RatingButtons | Colored buttons | Pressed (scale) | Elevated | Focus ring | Saving spinner | Spinner on clicked | Toast |
| SessionConfig | All options visible | Selected chips | Chip hover | Focus ring | Start button disabled | Skeleton | Inline error |
| SessionSummary | Stats visible | — | — | — | — | Skeleton | Partial data |
| WordDetailModal | Hidden | Open (slide) | — | Focus trap | — | Skeleton load | Error inline |
| AITutorSection | Generated text | — | Chip hover | Focus ring | — | Skeleton text | Error + retry |

---

## Data Displayed

### From VocabularyEntry (per review word)

| Field | Display | Context |
|-------|---------|---------|
| `word` | Bold heading (3xl/2xl) | Primary prompt in word→meaning, gap-fill, multiple choice, collocation |
| `meaning` | Body text in reveal area | Primary answer in word→meaning, prompt in meaning→word |
| `meaningVi` | Muted text below meaning | Optional translation support |
| `pronunciation` | IPA text (e.g., /juːˈbɪkwɪtəs/) | Below word in all modes |
| `partOfSpeech` | Italic label | Below pronunciation |
| `topic` | Topic badge | Footer of review card |
| `difficulty` | Difficulty badge | Footer of review card |
| `exampleSentence` | Italic quoted text | Reveal area (word→meaning, meaning→word); required for gap-fill |
| `collocations` | Chip display | Collocation mode + word detail mini modal |
| `synonyms` | Green chip display | Collocation mode + word detail mini modal |
| `antonyms` | Red chip display | Collocation mode + word detail mini modal |
| `id` | (internal) | Routing, review queue building |

### From VocabReviewEntry (per review session)

| Field | Display | Context |
|-------|---------|---------|
| `nextReviewAt` | (internal) | Used for queue building (due today filter) |
| `interval` | (internal) | Spaced repetition scheduling |
| `easeFactor` | (internal) | Spaced repetition scheduling |
| `repetitions` | (internal) | Spaced repetition scheduling |
| `history` | (internal) | Rating breakdown computation |

### Session Runtime Data

| Data | Source | Display |
|------|--------|---------|
| Current index | `currentIndex` | Progress bar counter: "5 / 20" |
| Queue length | `queue.length` | Progress bar max, start button |
| Current mode | `currentMode` | Session header label |
| Ratings count | `ratings` state | Rating breakdown bars in summary |
| Session duration | `Date.now() - startTime` | Summary: "4m 30s" |
| Accuracy | `(good + easy) / total * 100` | Summary: "68%" |
| Weak words | Words rated "again" or "hard" | "Words to Review Again" list |
| Config preset | `ReviewSessionConfig` | Quick start cards, advanced config |

### Computed Stats Displayed in Summary

| Stat | Computation |
|------|-------------|
| Total reviewed | `ratings.again + ratings.hard + ratings.good + ratings.easy` |
| Correct count | `ratings.good + ratings.easy` |
| Accuracy % | `correct / total * 100` (rounded, no decimals) |
| Review again count | `ratings.again + ratings.hard` |
| Rating breakdown % | Per rating: `(rating.count / total) * 100` |
| Total time | Human-readable: "4m 30s" or "45s" |
| Words per minute | `total / (durationMs / 60000)` (rounded to 1 decimal) |

---

## Design Notes

### Inspired by the Reference (Personalized Learning App by Anastasia Golovko)

1. **Flashcard with soft shadows** — The review card should feel like a physical flashcard: generous `radius.xl` corners, `shadow.card` depth, and a subtle hover/static elevation. The reference shows rounded content cards with gentle float — apply this to every review card.

2. **Progress indicator with character** — Instead of a generic bar, the session progress should use a thick, rounded progress track with a gradient fill that shifts from blue to green as the user advances. The reference uses playful progress visuals — make the progress bar feel satisfying to watch fill.

3. **Rating buttons with distinct personality** — Each rating button should have its own visual identity beyond color: Again uses a "⟳" reset icon and feels firm; Hard uses a "▲" challenge icon; Good uses a "●" check icon; Easy uses a "★" mastery icon. The reference uses icon + color combinations for status — apply this to rating buttons.

4. **Card flip animation** — The transition between "before reveal" and "after reveal" should use a smooth card flip (3D CSS transform with `rotateY`). This creates the physical flashcard feeling the reference evokes with its card-based UI.

5. **Session summary as a celebration screen** — The summary should not feel like a spreadsheet. Use large numbers, soft colored cards, and a celebratory header icon. The reference uses friendly data display with prominent metrics — emphasize the "you did it" feeling.

6. **AI presence after session** — The AI Tutor section at the bottom should use the tutor's distinct color palette (`--color-tutor-proactiveLight` background) and feel like a natural extension of the review, not an afterthought. The reference shows a helpful assistant — position the AI as a coach debriefing after a practice session.

7. **Spaced repetition transparency** — When a user hovers over a rating button, a tooltip should explain the scheduling impact: "See again in 1 day" (Again), "See again in 4 days" (Hard), "See again in 10 days" (Good), "See again in 3 weeks" (Easy). This transparency builds trust in the system.

8. **Multiple choice as a quiz game** — The multiple choice mode should feel like a mini-quiz: letter-labeled options (A, B, C, D), correct/incorrect feedback with color flashes, and a brief "Correct!" or "The answer is..." animation. The reference uses playful quiz elements — treat multiple choice as a lightweight game.

9. **Mode variety as a feature** — The six review modes should be presented as a strength, not complexity. Each mode icon in the header (👁️, 💭, ✏️, 🔗, ✅, ⌨️) should be visually distinct. The reference uses icon-driven navigation — make modes feel like different "lenses" for learning the same word.

10. **Mobile-first card layout** — Even on desktop, the review card should never feel wide or sparse. Cap the card width at `max-w-xl` on desktop (36rem) so the layout maintains the intimate, focused feel of a mobile app. The reference achieves this by centering content in a comfortable reading width.

### Review Session as a Learning Ritual

The vocabulary review should feel like a daily learning ritual, not a chore:

- **Motivational microcopy** — Replace "Start Review" with "Begin Today's Review". Replace "Exit" with "End Session". Use encouraging messages between words: "Almost there! 3 more words."
- **Streak integration** — If the user has a study streak, show the flame icon in the session header: "🔥 Day 12"
- **Completion sound** — Optional subtle chime on session completion (respect user preference)
- **Session continuity** — If a user exits mid-session, save the queue state so they can resume later (future enhancement)
- **Personalized session naming** — "Your Daily Review" vs "Focus: Technology Vocabulary" vs "Weak Words Practice"

### Spaced Repetition Visibility

The spaced repetition system should be visible and understandable to the user:

- **Queue composition:** Show a small note in the header: "Due now: 12 · Learning: 5 · New: 3"
- **Word status indicator:** Each word in the review shows its current status icon: 🔄 (due), 📖 (learning), ⭐ (reviewing), ✅ (mastered)
- **Rating tooltips:** As described above — each rating button shows the scheduling effect on hover
- **Post-session scheduling summary:** In the summary, show when the next review will be for each rating group: "Words rated Easy will return in ~21 days"

### Color and Visual Design

- **Review card background:** `--color-surface-card` (white in light, dark gray in dark)
- **Revealed answer area:** Tinted background using status-appropriate color:
  - Correct (typing/multiple choice): `--color-status-success-light`
  - General reveal: `--color-surface-cardHover` or a subtle brand tint
- **Progress bar:** `--color-brand-primary` fill, `--color-surface-alt` track
- **Rating button colors:** Again → `--color-status-danger`, Hard → `--color-status-warning`, Good → `--color-brand-primary`, Easy → `--color-status-success`
- **Session summary header:** Green tint for high accuracy, amber for medium, red for low
- **AI Tutor section:** `--color-tutor-proactiveLight` background with `--color-tutor-accent` borders
- **Focus ring:** `--color-border-focus` with `ring-offset-2`
