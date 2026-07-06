# IELTS Journey — Vocabulary Notebook Page Specification

## Page Purpose

The Vocabulary Notebook is the central vocabulary management hub. It serves as the user's personal IELTS vocabulary collection — a searchable, filterable, and organized repository of every word the user has saved, learned, or encountered during their IELTS journey. The notebook displays statistics, enables browsing by topic/status/difficulty, provides quick actions (review, exercises, export/import), and opens a detailed word detail panel with rich lexical information.

## User Goal

Users should feel, when landing on the Vocabulary Notebook:

- **Organized** — Every saved word is easily findable by search, topic, status, or difficulty
- **Tracked** — They see how many words are new, learning, reviewing, mastered, or hard
- **Informed** — Each word card shows meaning, pronunciation, part of speech, topic, difficulty badge, review status, and tags at a glance
- **Empowered** — They can quickly mark favorites, change difficulty, update status, edit, or delete words
- **Curious** — They can tap a word to open a rich detail panel showing collocations, synonyms, antonyms, word family (with AI-generated forms), example sentences, and personal notes
- **Connected** — They can generate word forms via AI, ask the AI Tutor for explanations, and navigate to review or exercises directly

The notebook should not feel like a static database list. It should feel like a living, interactive vocabulary learning system where every word has depth and AI enrichment available on demand.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/pages/Vocabulary.tsx:84-1048`, `apps/web/src/features/vocabulary/Vocabulary.tsx:40-848`, `apps/web/src/features/vocabulary/VocabularyManager.tsx:54-406`, `packages/ui/src/components/VocabularyWordCard.tsx:38-185`, `apps/web/src/models/index.ts:99-118`):

1. **Dense word list with too many inline actions** — Each word card renders a full row with: word (clickable), pronunciation text, part of speech badge, meaning, optional translation, status badge, difficulty badge, topic badge, tag badges, favorite toggle, mastered toggle, edit button, delete button, word family expand toggle, and status quick-change buttons. On columns with many entries, this visual density is overwhelming.

2. **Stats row is repetitive** — Six cards (Total, New, Learning, Reviewing, Mastered, Hard Words) use identical layout with colored number + uppercase label. No visual prioritization. The hard-coded Tailwind color classes (blue for Total, amber for Learning, purple for Reviewing, green for Mastered, red for Hard) do not align with a semantic theme token system.

3. **Filter controls feel disconnected** — Search, topic filter, status filter, difficulty filter, tag filter, and view tabs (All/Favorites/Difficult) are split across two separate Card containers (view tabs in one card, filters in another). This adds visual separation to controls that should feel cohesive.

4. **Word family expand is hidden behind a small arrow toggle** — The inline word family section requires the user to click a small arrow button on each card. Auto-generation on expand can feel slow. The toggle affordance is subtle (a small arrow icon in a 28x28px button).

5. **Word detail panel is a full modal** — The detail panel opens as a large Modal overlay (`size="lg"`). On desktop this works, but on mobile the modal takes the full screen and buries the context of the word list. There is no "slide-over drawer" or side panel option.

6. **No AI Tutor entry point in the vocabulary page** — Users cannot ask the AI Tutor to explain a word, provide usage examples, or suggest related vocabulary directly from the notebook. The only AI integration is generating word family forms (via `generateWordFamily` in `VocabularyManager.tsx:223-238`) and generating example sentences in the WordForm (`WordForm.tsx:139-202`).

7. **Review and Exercises are tabs that replace the entire list view** — Switching to "Review" or "Exercises" tab hides the notebook entirely. Users lose context of where they are in their vocabulary list. Tab state is not preserved in navigation.

8. **No topic grouping in list view** — Words are sorted alphabetically only. There is no visual grouping by topic (Education, Technology, Environment, etc.), which would help users browse by IELTS theme.

9. **Tag display is inconsistent** — Tags are shown as small blue pills on each card, but the tag filter is a hidden select control that only appears when `allTags.length > 0`. Tags cannot be added or removed from the list view (only via edit modal).

10. **Export/Import feel bolted on** — The import component is a hidden file input triggered by a button styled as a sibling of Export. There is no visual indicator of successful import count beyond the toast notification. No confirmation dialog for destructive operations.

11. **Pagination has no page size selector** — The current hard-coded page size of 20 (`const pageSize = 20` in `Vocabulary.tsx:107`) provides no user control over how many words to view per page.

---

## Proposed Layout

The Vocabulary Notebook should be restructured into a cleaner two-column or single-column responsive layout with a persistent header section and a details drawer:

### Desktop Layout (>= 1024px)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: "Vocabulary Notebook" subtitle + [Add Word] [Review]│
│  [Export] [Import]                                           │
├──────────────────────────────────────────────────────────────┤
│  Stats Row: Total | New | Learning | Reviewing | Mastered    │
│  | Hard | Due for Review (7 compact stat cards)              │
├──────────────────────────────────────────────────────────────┤
│  Filter Bar (single cohesive row):                           │
│  [All Words | Favorites | Difficult] [Search...] [Topic ▼]   │
│  [Status ▼] [Difficulty ▼] [Tags ▼] [Clear]                 │
├──────────────────────┬───────────────────────────────────────┤
│  Navigation sub-tabs │ Word List (scrollable)                │
│  [All] [Review]      │ ┌─────────────────────────────────┐   │
│  [Exercises]         │ │ Word card 1                     │   │
│                      │ │ Word card 2                     │   │
│  Topic Index         │ │ ...                             │   │
│  ┌─────────────────┐ │ │                                 │   │
│  │ Education    12 │ │ │                                 │   │
│  │ Technology    8  │ │ │                                 │   │
│  │ Environment   5  │ │ │                                 │   │
│  │ ...              │ │ └─────────────────────────────────┘   │
│  └─────────────────┘ │  Pagination: [<] 1 2 3 ... [>]        │
│                      │  "Showing 1–20 of 156"                │
├──────────────────────┴───────────────────────────────────────┤
│  Word Detail Panel (drawer/slide-over, opens from right)     │
└──────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌──────────────────────────────┐
│  Header + [Add Word] [Review]│
├──────────────────────────────┤
│  Stats row (horizontal       │
│  scrollable stat chips)      │
├──────────────────────────────┤
│  Filter bar (collapsible)    │
│  [Search...] [+ Filters ▼]  │
├──────────────────────────────┤
│  View tabs: [All] [Favorites]│
│  [Difficult]                 │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ Word card 1            │  │
│  │ Word card 2            │  │
│  │ Word card 3            │  │
│  │ ...                    │  │
│  └────────────────────────┘  │
│  Pagination (compact)        │
├──────────────────────────────┤
│  Bottom Navigation           │
└──────────────────────────────┘

Detail opens as full-screen modal on mobile.
Topic sidebar becomes a collapsible bottom sheet or header filter.
Review and Exercises open as separate sub-pages within the vocabulary section.
```

---

## Main Sections

### 1. Page Header

- **Content:** Title "Vocabulary Notebook", subtitle "Build your IELTS vocabulary with words, meanings, and examples", primary action buttons
- **Behavior:**
  - Sticky at top on scroll
  - "Add Word" button is primary call to action
  - "Review" button navigates to review session (opens in-page, not a new route)
  - "Exercises" button opens exercise generator
- **Responsive:** Stacks vertically on mobile (title + buttons wrap)

### 2. Stats Bar

- **Content:** 7 compact stat cards showing: Total, New, Learning, Reviewing, Mastered, Hard Words, Due for Review
- **Design:**
  - Each card shows count (large number) + label below
  - Color follows semantic token system (primary for total, blue for new, amber for learning, purple for reviewing, green for mastered, red for hard, orange for due)
  - Clicking a stat card could filter the list (e.g., click "New" to show only new words)
- **Responsive:**
  - Desktop: 7 cards in a single row (use smaller cards)
  - Tablet: 4-3 split, 2 rows
  - Mobile: horizontally scrollable chip-style stat pills

### 3. Filter Bar

- **Content:** View tabs + search input + filter dropdowns in a single cohesive bar
- **View Tabs:** All Words, Favorites, Difficult — tab-style selector with count badges
- **Search:** Full-text search input with magnifying glass icon, searches word, meaning, translation, and example sentence
- **Filter Dropdowns:**
  - Topic (IELTS_TOPICS list: Education, Technology, Environment, etc.)
  - Status (new, learning, reviewing, mastered)
  - Difficulty (easy, medium, hard)
  - Tags (dynamic list from `allTags`)
- **Clear button** appears when any filter or search is active
- **Responsive:**
  - Desktop: Single row with inline filters
  - Mobile: Search always visible; filter dropdowns hidden behind a "Filters" toggle that expands below

### 4. Topic Index Sidebar (Desktop)

- **Content:** Left sidebar showing all IELTS topics with word counts
- **Behavior:**
  - Click a topic to filter the word list by that topic
  - Active topic is highlighted
  - "All Topics" option at top
- **Responsive:** Hidden on mobile; accessible via a "Topics" button in the filter bar

### 5. Word List

- **Content:** Paginated list of vocabulary word cards
- **Design:**
  - Each card is a compact row showing: review status icon, word (clickable), pronunciation button (play icon), part of speech (italic), meaning, translation (if available), status badge, difficulty badge, topic badge, tags (shown inline or on hover), inline action icons (favorite star, quick edit, quick delete)
  - Cards have hover state with subtle elevation change
  - Clicking the word opens the detail panel
  - Word family expand is integrated into the detail panel (not inline in the list)
- **Pagination:**
  - "Showing X–Y of Z" label
  - Page number buttons with arrow navigation
  - Optional page size selector (10, 20, 50)

### 6. Sub-tab Navigation (Review / Exercises)

- **Content:** Secondary tabs below the header for switching between "All", "Review", and "Exercises" views
- **Behavior:**
  - "All" shows the full word list (default)
  - "Review" shows the review session in-place (replacing the list)
  - "Exercises" shows the exercise generator in-place
  - Tab state is preserved as URL parameter or local state
  - Back button in Review/Exercises returns to "All" tab

### 7. Word Detail Panel (Drawer)

- **Content:** Rich word detail panel opening from the right side (desktop) or as full-screen modal (mobile)
- **Sections (in order):**
  1. Word header with pronunciation button, part of speech, pronunciation text, status badge, difficulty badge, topic badge, tags
  2. Meaning section (English + translation if available)
  3. Example sentence (quoted, italic)
  4. Collocations section (chip-style badges)
  5. Synonyms section (green chip badges)
  6. Antonyms section (red chip badges)
  7. Word Forms section (WordFamilyDisplay component, grouped by part of speech with AI generation)
  8. Personal Note section (if any)
  9. AI Tutor section — "Ask AI Tutor about this word" button that opens chat with context
  10. Metadata footer — Created date, updated date, Edit and Close buttons
- **Behavior:**
  - Opens as a slide-over drawer on desktop (overlays ~40% of screen width from the right)
  - Opens as full-screen modal on mobile
  - Scrollable content
  - Edit button in drawer opens the edit form in a sub-modal overlay
  - Close via X button, clicking outside, or Escape key

### 8. Quick Add / Edit Modal (Shared)

- **Content:** The existing WordForm component (`apps/web/src/features/vocabulary/components/WordForm.tsx:216-456`) with fields for word, pronunciation, meaning, translation, part of speech, topic, example sentence (with AI generate button), collocations, synonyms, antonyms, word family, personal note, tags, difficulty, and status
- **Design:**
  - Two-column grid layout on desktop
  - Single-column stacked on mobile
  - "AI Example" button next to example sentence field
  - Validation messages for required fields (word, meaning)
- **Behavior:**
  - Opens on "Add Word" button click
  - Opens on "Edit" action from card or detail panel
  - Saving updates the list and detail panel in real-time
  - Cancel closes the modal

---

## Primary Actions

1. **Add Word** — Opens the WordForm modal to create a new vocabulary entry
2. **Open Word Detail** — Click a word to open the slide-over detail panel
3. **Search** — Full-text search across word, meaning, translation, and example
4. **Filter by Topic** — Select an IELTS topic to narrow the list
5. **Filter by Status** — Select review status to filter
6. **Filter by Difficulty** — Select difficulty level to filter
7. **Start Review** — Navigate to the review session tab
8. **Generate Exercises** — Navigate to the exercise generator tab

## Secondary Actions

1. **Mark Favorite** — Toggle favorite star on a word card
2. **Mark Mastered** — Quick inline action to change status to mastered
3. **Edit Word** — Open edit modal from card or detail panel
4. **Delete Word** — Remove word with confirmation dialog
5. **Export Vocabulary** — Download all entries as JSON file
6. **Import Vocabulary** — Upload JSON file to bulk-add words
7. **Play Pronunciation** — Click speaker button to hear word pronunciation
8. **Show Word Family** — View AI-generated word family (noun, verb, adjective, adverb forms)
9. **Generate Word Family via AI** — Click "Generate" in Word Family section to auto-populate word forms
10. **Ask AI Tutor** — Send word to AI Tutor for explanation, usage examples, or related vocabulary
11. **Add Personal Note** — Attach a personal learning note to any word
12. **Change Difficulty** — Toggle difficulty between easy, medium, hard
13. **Toggle Tags** — Add or remove tags from a word
14. **Change Page** — Navigate paginated word list
15. **Clear Filters** — Reset all search and filter controls

---

## Empty State

### Empty Notebook (no words added yet)

- **Icon:** Open book with a pencil illustration or a friendly "no words yet" graphic
- **Title:** "Your vocabulary notebook is empty"
- **Description:** "Start building your IELTS vocabulary by adding your first word. You can also save words from articles, reading passages, or ask the AI Tutor to explain new vocabulary."
- **Primary Action:** "Add Your First Word" button (opens WordForm modal)
- **Secondary Text:** "Tip: Use the browser extension to save words while browsing the web."

### No Results (filters produce no matches)

- **Icon:** Magnifying glass with a cross or empty folder illustration
- **Title:** "No words match your filters"
- **Description:** "Try adjusting your search terms or clearing some filters to see more results."
- **Action:** "Clear All Filters" button (resets all search/filter state)

### No Favorites (Favorites view is empty)

- **Icon:** Star outline with a heart illustration
- **Title:** "No favorite words yet"
- **Description:** "Tap the star icon on any word card to add it to your favorites for quick access."
- **Action:** "Browse All Words" button (switches to All Words view)

### No Difficult Words (Difficult view is empty)

- **Icon:** Warning shield icon
- **Title:** "No difficult words marked"
- **Description:** "You haven't marked any words as difficult yet. As you learn, mark challenging words so you can focus on them."
- **Action:** "Browse All Words" button

---

## Loading State

### Initial Load

- **Skeleton pattern:**
  - Header area: Two skeleton lines (title + subtitle)
  - Stats bar: 7 skeleton stat cards (small rectangles)
  - Filter bar: skeleton search input + 3 skeleton filter pills
  - Word list: 5-8 skeleton word card rows (each showing: icon circle + two text lines + three badge skeletons)
- **Animation:** Subtle shimmer/pulse effect
- **Duration:** Until `DatabaseService.getAll('vocabulary')` resolves

### AI Generation (Word Family)

- **Inline loading in Word Family section of detail panel:**
  - "Generating word forms..." text with spinner animation
  - Previously generated forms remain visible during regeneration
- **Button state:** Generate button shows spinner + "Generating..." text, disabled during generation

### Save / Edit Operations

- **Button loading state:** Save button shows spinner + "Saving..." during `handleSave()` execution
- **Optimistic update:** Word list updates immediately in local state, rolls back on error with toast notification

### Filter Application

- **Instant filtering:** No loading state for local filters (applied via `useMemo`)
- **Pagination change:** Instant (local client-side pagination)

---

## Error State

### Failed to Load Vocabulary

- **Layout:** Centered error card in the main content area
- **Icon:** Warning triangle or broken book icon
- **Message:** "Failed to load your vocabulary. The database may be unavailable."
- **Detail:** Error message from `DatabaseService.getAll()` catch block
- **Action:** "Retry" button that calls `loadEntries()` again
- **Alternative:** If partial data is available, show it with a dismissible warning banner

### Failed to Save Word

- **Feedback:** Toast error notification with the error message
- **Form state:** Form remains open with entered data intact
- **Action:** User can retry by clicking Save again

### Failed to Generate Word Family

- **Inline feedback:** Error message appears below the Word Family section with the specific AI error
- **Fallback:** Previously generated forms (if any) remain displayed
- **Retry:** "Try Again" button to re-call `generateWordFamily()`

### Failed to Import Vocabulary

- **Feedback:** Toast error notification showing file validation error or parse failure
- **Action:** User can select a different file and try again
- **Validation:** Only JSON files with `word` and `meaning` fields are accepted; invalid entries are skipped with a count shown in the result

### Database Corruption

- **Message:** "Your vocabulary data could not be read. The database may be corrupted."
- **Actions:** "Restore from Backup" (if backup exists) and "Start Fresh" (clear and recreate)
- **Note:** This should be handled gracefully without losing other app data

---

## Mobile Layout

### Screen Adaptation

- **Header:** Title + buttons stack vertically; "Add Word" button remains prominent, secondary buttons move into a "..." overflow menu
- **Stats Row:** Horizontal scrollable row of stat chips (compact pill-style cards, each showing count + icon + label)
- **Filter Bar:** Search input always visible; filter controls hidden behind a "Filters" toggle button that expands additional controls below the search
- **View Tabs:** Horizontal scrollable tab bar below filters (All Words | Favorites | Difficult)
- **Word List:** Full-width cards with compact layout; secondary action icons shown with labels hidden
- **Topic Index:** Accessible via a "Topics" button in the filter bar that opens a bottom sheet with the topic list and counts

### Detail Panel on Mobile

- **Full-Screen Modal:** Detail opens as a full-screen overlay that slides up from the bottom
- **Header:** Word + pronunciation button + part of speech + close (X) button
- **Content sections:** Same as desktop, stacked vertically
- **Actions at bottom:** Sticky bar with "Edit" and "Ask AI Tutor" buttons
- **Gesture:** Swipe down to dismiss

### Add/Edit Modal on Mobile

- **Full-Screen Modal:** Form opens as full-screen with sticky title bar
- **Single-column layout:** All fields stack vertically
- **Keyboard-aware:** Form scrolls to keep active input visible when keyboard opens
- **AI Example button:** Positioned inline next to the example sentence field

### Touch Behavior

- **Tap targets:** Minimum 44x44px for all interactive elements (favorite, edit, delete, play buttons)
- **Swipe actions:** Swipe left on a word card to reveal quick actions (delete, mark mastered)
- **Pull to refresh:** Swipe down at the top of the word list to reload vocabulary from database

---

## Responsive Behavior

| Breakpoint | Layout | Detail Panel | Stats Row | Filters |
|---|---|---|---|---|
| < 480px (small phone) | Single column, full-width | Full-screen modal | Scrollable chips | Collapsible with accordion |
| 480–767px (large phone) | Single column | Full-screen modal | 7 chips in 2 rows | Collapsible with accordion |
| 768–1023px (tablet) | Two columns (list + optional detail) | Right-side drawer (35% width) | 7 cards in 2 rows | Inline + dropdown |
| 1024–1439px (desktop) | Two columns with topic sidebar | Right-side drawer (35% width) | 7 small cards in row | Single row inline |
| 1440px+ (large desktop) | Two columns with topic sidebar | Right-side drawer (40% width) | 7 small cards in row | Single row inline |

- **Stats bar:** On mobile, stat cards shrink to compact pill-shaped chips with just number + label
- **Word cards:** Compact variant on mobile (smaller text, fewer visible badges, icons only for actions)
- **Pagination:** Simplified on mobile to "Previous" / "Next" buttons with page counter

---

## AI Tutor Integration

### Entry Points

1. **Word Detail Panel — "Ask AI Tutor" Button:**
   - Prominent button at the bottom of the detail panel
   - Pre-fills AI Tutor chat with context: "Explain the word '{word}' and show me how to use it in IELTS Writing Task 2"
   - Opens the AI Tutor chat in a new chat session or navigates to the existing AI Tutor page with the prompt

2. **Word Card — Quick AI Action:**
   - Small "magic wand" icon or "Ask AI" icon on each word card (visible on hover on desktop, always visible on mobile)
   - Opens a small tooltip/popover with options: "Explain this word", "Show IELTS examples", "Generate practice sentence"

3. **AI Example Generation (WordForm):**
   - Existing "AI Example" button in the Add/Edit Word form
   - Calls AI to generate: example sentence, 2-3 collocations, 2-3 synonyms for the word
   - Auto-fills the corresponding fields in the form

4. **AI Word Family Generation:**
   - Existing "Generate" button in the Word Family section of the detail panel
   - Calls AI to generate noun, verb, adjective, adverb forms with IPA pronunciation and definitions
   - Results are stored as encoded JSON strings in `wordFamily` array

5. **Contextual Suggestions:**
   - AI Tutor could proactively suggest weak words to review: "You have 5 words marked as 'hard' that are due for review. Want to practice them?"
   - When adding a word, AI Tutor could suggest related synonyms or topic grouping

### Chat Context

When "Ask AI Tutor" is triggered from the vocabulary notebook, the chat should receive:

```json
{
  "context": "vocabulary-word",
  "word": "ubiquitous",
  "meaning": "Present, appearing, or found everywhere",
  "partOfSpeech": "adjective",
  "topic": "Technology",
  "difficulty": "hard",
  "status": "learning"
}
```

The AI Tutor should respond with:
- Detailed explanation of the word
- IELTS-specific usage examples (Task 1 and Task 2 contexts)
- Common collocations for IELTS writing
- Practice sentence recommendations

---

## Accessibility Notes

- **Search input:** Has a visible label or `aria-label="Search vocabulary"`; proper `aria-live` region for search result count updates
- **Filter dropdowns:** Each select element has a unique `aria-label` (e.g., "Filter by topic", "Filter by status")
- **Word cards:** Each card is a `<button>` or has `role="button"` and `tabindex="0"` with `aria-label="View details for {word}"`
- **Pronunciation button:** `aria-label="Pronounce {word}"` and visible focus state
- **Action icons:** Each icon button has `aria-label` (e.g., "Add {word} to favorites", "Edit {word}", "Delete {word}")
- **Pagination:** Page numbers have appropriate `aria-label="Page {n}"`, current page has `aria-current="page"`
- **Detail panel:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="detail-word-title"`; focus trapped inside when open; dismissible with Escape key
- **Empty state:** `role="status"` to announce empty state to screen readers
- **Stats cards:** Each stat is announced as "{count} {label}" with `aria-label` on the number element
- **Color independence:** Status and difficulty use icons + text labels in addition to color badges; do not rely solely on color to convey meaning
- **Touch targets:** Minimum 44x44px for all interactive elements
- **Focus order:** Search → filters → word list → pagination → actions, logical left-to-right top-to-bottom
- **Error announcements:** Toast and inline errors use `role="alert"`

---

## Components Needed

### From Component System (Existing or New)

| Component | Type | Usage |
|---|---|---|
| Button | Existing | Add Word, Review, Exercises, Export, Import, Clear, Edit, Save, Delete, Retry |
| IconButton | Existing/Nav | Pronunciation play, favorite, edit, delete, ask AI, close detail |
| Card | Existing | Stats cards, filter container, word cards |
| Badge | New | Status badge, difficulty badge, topic badge, tag badge |
| Input | Existing | Search input, word form text inputs |
| SearchInput | New | Dedicated search component with icon, clear button, debounced input |
| Select | Existing | Topic filter, status filter, difficulty filter, tag filter, part of speech |
| Modal | Existing | Add/Edit word form, confirmation dialogs |
| Drawer | New | Word detail panel slide-over (right side on desktop) |
| Toast | Existing | Success/error/info feedback for CRUD operations |
| Tabs | Existing | View tabs (All/Favorites/Difficult), sub-tabs (Browse/Review/Exercises) |
| Pagination | Existing | Page navigation for word list |
| ProgressBar | Existing | (Optional) space repetition progress indicators |
| EmptyState | Existing | Empty notebook, no results, no favorites, no difficult |
| LoadingSkeleton | New | Skeleton cards for initial loading state |
| ErrorState | Existing | Failed to load vocabulary with retry |
| VocabularyWordCard | Existing/Refined | Word card component with compact/normal variants |
| VocabularyWordDetailPanel | New | Slide-over word detail panel |
| WordForm | Existing | Add/Edit vocabulary form |
| WordFamilyDisplay | Existing | AI-generated word family grouped by part of speech |
| PronounceButton | Existing | Pronunciation play button |
| StatCard | New/Refined | Compact stat card for stats bar |
| FilterBar | New | Combined search + filters + view tabs component |

### New Components to Create

1. **VocabularyWordDetailPanel** — Slide-over drawer with rich word detail (meaning, examples, collocations, synonyms, antonyms, word family, personal note, AI Tutor entry point)
2. **FilterBar** — Unified filter bar combining view tabs, search input, topic/status/difficulty/tag dropdowns, and clear button
3. **StatCard** — Compact stat card for the stats bar (count + label + color variant)
4. **SearchInput** — Search input with icon, debounced onChange, clear button, aria-label
5. **TopicIndex** — Sidebar or bottom sheet listing all IELTS topics with word counts for filtering

---

## Data Displayed

### VocabularyEntry (per word card)

| Field | Type | Display |
|---|---|---|
| `word` | string | Bold heading, clickable to open detail |
| `meaning` | string | Subtitle text below word |
| `meaningVi` | string | Optional translation, shown below meaning |
| `pronunciation` | string | IPA text (e.g., /ˈjuːbɪkwɪtəs/) next to word |
| `partOfSpeech` | string | Italic label (e.g., *adjective*) |
| `topic` | string | Topic badge (e.g., Education, Technology) |
| `exampleSentence` | string | Shown only in detail panel |
| `collocations` | string[] | Shown only in detail panel as chips |
| `synonyms` | string[] | Shown only in detail panel as green chips |
| `antonyms` | string[] | Shown only in detail panel as red chips |
| `wordFamily` | string[] | Shown only in detail panel in WordFamilyDisplay |
| `personalNote` | string | Shown only in detail panel |
| `difficulty` | VocabDifficulty | Badge: easy (green), medium (amber), hard (red) |
| `status` | VocabStatus | Badge: new (blue), learning (amber), reviewing (purple), mastered (green) |
| `tags` | string[] | Inline chip badges (e.g., "favorite", "academic", "essay-writing") |
| `createdAt` | ISOString | Footer in detail panel |
| `updatedAt` | ISOString | Footer in detail panel |

### Stats Data

| Stat | Computation | Color |
|---|---|---|
| Total | `entries.length` | Primary |
| New | `entries.filter(e => e.status === 'new').length` | Blue |
| Learning | `entries.filter(e => e.status === 'learning').length` | Amber |
| Reviewing | `entries.filter(e => e.status === 'reviewing').length` | Purple |
| Mastered | `entries.filter(e => e.status === 'mastered').length` | Green |
| Hard Words | `entries.filter(e => e.difficulty === 'hard').length` | Red |
| Due for Review | Reviews where `nextReviewDate <= today` | Orange |

### Topic Breakdown

| Topic | Count |
|---|---|
| Education | `entries.filter(e => e.topic === 'Education').length` |
| Technology | `entries.filter(e => e.topic === 'Technology').length` |
| Environment | `entries.filter(e => e.topic === 'Environment').length` |
| ... (19 topics total) | Computed per topic |

---

## Design Notes

### Inspired by the Reference (Personalized Learning App by Anastasia Golovko)

1. **Soft rounded cards with shadow** — Each word card should feel like a physical flashcard: rounded corners, subtle shadow, gentle hover lift. Stats cards should use small icon + number in a pill shape.

2. **Color-coded learning status** — Review status should use soft pastel backgrounds (blue for new, amber for learning, purple for reviewing, green for mastered) with matching border accents, applied as a subtle left border on each word card rather than full background fills.

3. **Progress indication on each card** — Add a thin progress indicator on the bottom edge of each word card showing spaced repetition progress: full width for mastered, partial for learning, dot for new.

4. **Floating AI action** — "Ask AI Tutor" should be a floating action button on mobile when browsing vocabulary, allowing the user to ask about any word they see.

5. **Topic grouping visual** — Group words by topic with soft section headers (e.g., "📚 Education", "💻 Technology") and a subtle background tint per group, making the list feel organized by IELTS themes.

6. **Search-first interface** — The search input should be visually prominent with a subtle background tint, clear button, and search icon. Typing should instantly filter (debounced 300ms) with a smooth fade transition.

7. **Micro-interactions** — Favorite star icon should have a bounce animation on toggle. Delete should have a confirmation with a gentle shake animation on the card. Status change should animate the badge with a color fade.

8. **Detail panel as a learning dashboard for one word** — The word detail panel should not just show data; it should feel like a mini-learning dashboard for that word, with the AI Tutor section at the bottom appearing as a "Want to learn more about this word?" call-to-action card.

9. **Word form visualization** — The Word Family section should display forms in a clean grid format with part-of-speech colored labels and pronunciation buttons, making it easy to scan related forms.

10. **Mobile-first word cards** — On mobile, word cards should use a compact layout with the word at full width, meaning truncated to one line, and actions (favorite, play, edit) available via a long-press context menu or tap to expand, keeping the list clean and scannable.

### Vocabulary-First Product Feeling

The vocabulary notebook should reinforce that IELTS Journey is a vocabulary learning tool first. Key design choices:

- **All roads lead to vocabulary:** Every practice page, article, and AI Tutor response should offer a "Save to Vocabulary" action that directly adds words here
- **Bulk operations:** Allow selecting multiple words (via checkboxes) for batch operations: add tag, change status, change difficulty, delete, export selected
- **Smart sorting options:** Alphabetical (A-Z), by status (new first), by difficulty (hard first), by topic (grouped), by recently added (newest first), by next review date
- **Import from sources:** In addition to manual entry and file import, provide a "From Saved Articles" option that scans saved articles for IELTS vocabulary and suggests words to add
- **Vocabulary statistics:** In addition to the stats bar, provide a small "insights" section showing "Most added topic", "Fastest mastered words", "Commonly confused words" (from mistake review)
