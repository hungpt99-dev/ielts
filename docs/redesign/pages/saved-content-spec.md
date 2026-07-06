# IELTS Journey — Saved Content Page Specification

## Page Purpose

The Saved Content page is the central repository for all content the user has saved from external sources — articles, selected text passages, study notes, and web resources. It serves as the bridge between the user's browsing activities (via the browser extension) and their IELTS study workflow. Saved content can be converted into reading practice passages, mined for vocabulary, sent to the AI Tutor for explanation, and reused across multiple learning activities.

## User Goal

Users should feel, when using the Saved Content page:

- **Collective** — Every piece of interesting English content they encounter while browsing is saved here, ready for IELTS learning
- **Reusable** — Saved articles become reading practice; saved text becomes vocabulary or grammar material
- **Connected** — The browser extension feeds directly into this page, making it the hub of their self-guided learning
- **Organized** — Content is searchable by title, tag, category, topic, and skill — nothing is lost
- **Extensible** — Every saved item offers actions: generate exercises, explain with AI, save vocabulary, start reading practice
- **Seamless** — The flow from "I found something interesting on the web" to "I learned from it for IELTS" is smooth

The page should not feel like a bookmark manager. It should feel like a personal IELTS content library where every saved item has learning potential.

---

## Current UX/UI Problems

Based on analysis of the current implementation (`apps/web/src/features/artifacts/ArtifactsPage.tsx:49-466`, `apps/extension/src/popup/components/SaveTextForm.tsx:15-509`, `apps/extension/src/popup/components/ArticleCollector.tsx`, `apps/web/src/components/FeatureSection.tsx:85`, `apps/web/src/components/AITutorSection.tsx:35`, `packages/storage/src/schema.ts:33-45`, `packages/storage/src/repositories/ContentRepository.ts:236-260`):

1. **Separated into "Artifacts" instead of "Saved Content"** — The current route is `/artifacts` and the page title is "Artifacts", which is a technical-sounding name. Users may not intuitively understand that this is where their saved articles and web content live. The term lacks warmth and learning context.

2. **No distinction between content types** — The current `Artifact` model has categories (article, video, reference, tool, other) but no dedicated type for "saved selected text" or "saved notes". Selected text saved via the extension (`SaveTextForm`) and full articles saved via `ArticleCollector` both end up in separate stores (`learningEntries` and `articleEntries` in the extension's IndexedDB), not in the web app's `artifacts` table. The web experience is disconnected from the extension experience.

3. **No content detail view** — Clicking an artifact card opens the external URL in a new tab. There is no in-app content detail view where the user can read the saved content, highlight passages, look up vocabulary, or take notes. The user is sent out of the app immediately.

4. **No learn-from-content actions** — The current artifact cards only allow editing metadata (URL, title, description, tags, category) and toggling favorites. There is no "Generate Exercise", "Explain with AI", "Save Vocabulary", or "Start Reading Practice" action. The saved content is static — it cannot be turned into learning materials from this page.

5. **Extension content is siloed** — Content saved via the browser extension (`SaveTextForm` → `learningEntries`, `ArticleCollector` → `articleEntries`) is stored in the extension's IndexedDB and is not reflected in the web app's artifacts page. Users who use both the extension and the web app lose continuity.

6. **No topic-based filtering for IELTS themes** — The current filter options are category, tags, and favorites. There is no IELTS topic filter (Education, Technology, Environment, etc.), which makes it hard to find articles related to specific IELTS themes.

7. **No skill association** — Users cannot associate a saved article with a specific IELTS skill (reading, listening, writing). If an article is good for reading practice, there is no way to mark it or filter by skill.

8. **No study notes integration** — The `StudyNoteRepository` (`packages/storage/src/repositories/ContentRepository.ts:101`) exists but is not accessible from the artifacts page. Notes taken during study are stored separately and cannot be attached to or viewed alongside related content.

9. **Grid layout lacks content density** — The current 3-column card grid shows title, description, tags, and actions. For articles with long titles or descriptions, the card truncates content (`line-clamp-2`). There is no list view option for users who prefer browsing denser content.

10. **No reading progress tracking** — When a user opens an article for reading practice, there is no way to mark it as "read", "in progress", or "saved for later". Reading progress is not tracked.

11. **No "save from article" vocabulary flow** — While the extension allows saving vocabulary directly from selected text, the web app's artifacts page does not offer a way to scan a saved article for IELTS vocabulary and add interesting words to the vocabulary notebook.

12. **Add/Edit form is generic** — The current modal form (`ArtifactsPage.tsx:387-463`) has fields for URL, title, description, category, and tags. It does not include fields for: IELTS topic, skill association, difficulty level, personal notes, or reading status. The form lacks the context needed for a learning-focused content library.

---

## Proposed Layout

The Saved Content page should be restructured into a comprehensive content library with two main views: a list/grid of saved items and a rich content detail view.

### Desktop Layout (>= 1024px)

```
┌──────────────────────────────────────────────────────────────┐
│  Header: "Saved Content" subtitle + stats + actions          │
│  [Add Manually] [Extension Guide]  Total: 42 items           │
├──────────────────────────────────────────────────────────────┤
│  Quick stat cards:                                            │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │
│  │Articles│ │  Text   │ │  Notes   │ │ Reading│ │Unread    │ │
│  │   24   │ │   12   │ │    6     │ │  In Prg│ │   18     │ │
│  └────────┘ └────────┘ └──────────┘ └────────┘ └──────────┘ │
├──────────────────────────────────────────────────────────────┤
│  Filter bar:                                                 │
│  [Search titles, tags, content...] [Type ▼] [Topic ▼]       │
│  [Skill ▼] [Status ▼] [Tags ▼] [Sort ▼] [Grid/List toggle]  │
├──────────────────────────────────────────────────────────────┤
│  Content Grid (or List)                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Content Card │ │ Content Card │ │ Content Card │         │
│  │  (article)   │ │   (text)     │ │   (note)     │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ Content Card │ │ Content Card │ │ Content Card │         │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│  Pagination: [<] 1 2 3 ... [>]  "Showing 1–12 of 42"        │
├──────────────────────────────────────────────────────────────┤
│  Content Detail Panel (slide-over from right)                 │
│  Shows full content + learning actions                        │
└──────────────────────────────────────────────────────────────┘
```

### Content Card (Compact)

```
┌──────────────────────────────────────────────────┐
│ [Favicon] Type Badge     [Status Badge] [★] [⋮] │
│ Title of the saved article or text               │
│ Short description or excerpt (2 lines max)       │
│ Topic: Education · Skill: Reading · 3 tags       │
│ 📅 May 15, 2026 · Source: Extension              │
│ [Generate Exercise] [Explain AI] [Read Practice] │
└──────────────────────────────────────────────────┘
```

### Content Detail Panel

```
┌─────────────────────────────────────────────────────┐
│ [← Back to list]  [Open Original ↗]  [Edit] [Delete]│
│ ─────────────────────────────────────────────────── │
│ Type: Article · Topic: Education · Skill: Reading    │
│                                                     │
│ Title of the Article                                │
│ Tags: #ielts #academic #environment                 │
│ Status: Unread | Reading Progress: ███░░ 60%        │
│ Saved from: https://example.com/article              │
│ Personal Note: "Good for Task 2 environment topic"  │
│ ─────────────────────────────────────────────────── │
│                                                     │
│ Content Section                                      │
│ ┌───────────────────────────────────────────────┐   │
│ │                                               │   │
│ │ Full article text or saved passage displayed   │   │
│ │ in a readable format.                          │   │
│ │                                               │   │
│ │ User can select text to trigger action menu:   │   │
│ │ [Save Word] [Explain] [Save Sentence]          │   │
│ │                                               │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ─────────────────────────────────────────────────── │
│ Learning Actions                                     │
│ ┌──────────────── ───────────────── ──────────────┐  │
│ │ 📝 Generate     │ 🤖 Explain    │ 📖 Save       │  │
│ │   Exercise      │   with AI     │   Vocabulary  │  │
│ ├──────────────── ┼──────────────── ┼──────────────┤  │
│ │ 📚 Start        │ ✏️ Add Note   │ 📤 Share      │  │
│ │   Reading       │               │              │  │
│ │   Practice      │               │              │  │
│ └──────────────── ┴──────────────── ┴──────────────┘  │
│ ───────────────────────────────────────────────────── │
│ Vocabulary Mined From This Article                     │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Word           │ Meaning      │ Status    │ [⋮]  │  │
│ │ ubiquitous     │ present ev.. │ learning  │ [⋯]  │  │
│ │ paradigm       │ a typical..  │ new       │ [⋯]  │  │
│ │ ameliorate     │ to make..    │ saved     │ [⋯]  │  │
│ └──────────────────────────────────────────────────┘  │
│ [Add Word from Selection]                              │
└─────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌──────────────────────────────┐
│  Header: "Saved Content"     │
│  [Add Manually]              │
├──────────────────────────────┤
│  Stats row (horizontal       │
│  scrollable stat chips)      │
├──────────────────────────────┤
│  Filter bar (collapsible)    │
│  [Search...] [+ Filters ▼]  │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ Content Card (stacked) │  │
│  │ (full-width, compact)  │  │
│  ├────────────────────────┤  │
│  │ Content Card           │  │
│  ├────────────────────────┤  │
│  │ Content Card           │  │
│  ├────────────────────────┤  │
│  │ ...                    │  │
│  └────────────────────────┘  │
│  Pagination (compact)        │
├──────────────────────────────┤
│  Bottom Navigation           │
└──────────────────────────────┘

Detail opens as full-screen view with sticky action bar.
```

---

## Main Sections

### 1. Page Header

- **Content:** Title "Saved Content", subtitle "Your IELTS learning library from the web", primary action buttons
- **Stat line:** "42 items · 24 articles · 12 text passages · 6 notes" in muted text
- **Actions:**
  - "Add Manually" button — opens modal to save a URL or paste text
  - "Extension Guide" ghost button — opens help modal explaining how the browser extension feeds content here
- **Behavior:** Sticky on scroll

### 2. Stats Bar

- **Content:** 5 compact stat cards showing content type breakdown
- **Cards:**
  - Articles — count of saved full articles
  - Text — count of saved selected text passages
  - Notes — count of personal study notes
  - Reading — count of items marked as "in progress" or "completed"
  - Unread — count of items not yet opened
- **Design:** Each card shows icon + number + label, colored by type
- **Responsive:** Desktop shows all 5 in a row; tablet wraps to 3+2; mobile uses horizontally scrollable chips

### 3. Filter Bar

- **Content:** Single cohesive row with search + multiple filter dropdowns
- **Search:** Full-text search across title, description, content text, tags, and personal notes
- **Filters:**
  - Type — Article, Text, Note, Video, Reference, Tool, Other (from `ArtifactCategory`)
  - Topic — IELTS topics (Education, Technology, Environment, etc.)
  - Skill — Reading, Listening, Writing, Speaking, Grammar, Vocabulary, General
  - Status — Unread, In Progress, Completed, Saved for Later
  - Tags — Dynamic list from all unique tags across saved items
  - Sort — Newest, Oldest, Title A-Z, Title Z-A, Last Opened, Most Words
- **View toggle:** Grid view icon / List view icon
- **Clear button** appears when any filter is active
- **Responsive:** Search always visible on mobile; filters behind "Filters" toggle

### 4. Content Grid (Default View)

- **Content:** Paginated grid (3 columns desktop, 2 columns tablet, 1 column mobile) of content cards
- **Each card shows:**
  - Favicon (from URL) or content type icon
  - Type badge (Article, Text, Note, Video, etc.)
  - Status badge (Unread, In Progress, Completed)
  - Favorite star toggle
  - Overflow menu (⋮) with: Edit, Delete, Share
  - Title (clickable — opens detail panel)
  - Description or first line of content (2-line truncation)
  - Topic badge, skill badge, first 3 tag badges
  - Source label: "Via Extension" or "Manual" or "Imported"
  - Date saved
  - Quick action row: [Generate Exercise] [Explain AI] [Read Practice] (2-3 buttons, depending on content type)
- **Hover state:** Subtle elevation increase, action buttons become fully visible
- **List view alternative:** Single-column dense rows with smaller thumbnails, more text visible, actions on the right

### 5. Content Detail Panel (Drawer / Full View)

- **Purpose:** Rich detail view for reading and interacting with saved content
- **Layout (desktop):** Slide-over drawer from right side (~45% width) or full-page view
- **Layout (mobile):** Full-screen view with sticky bottom action bar
- **Sections:**
  1. **Header bar:** Back button, content type badge, status badge, favorite toggle, "Open Original ↗" link, Edit, Delete
  2. **Metadata row:** Topic badge, skill badge, tag badges, source label, saved date, last opened date
  3. **Title:** Large heading
  4. **Personal Note:** Editable text area (if user has added a note)
  5. **Reading Progress:** Progress bar (Unread → In Progress → Completed), "Mark as Read" button
  6. **Content Body:** Full article text or saved passage in a readable container with proper typography
     - Text selection triggers a floating action bar: [Save Word] [Explain Selection] [Save Sentence] [Ask AI]
  7. **Learning Actions Section:** Action card grid (see below)
  8. **Mined Vocabulary Section:** Table of words saved from this article with status, meaning, and quick actions
  9. **Related Study Notes:** List of notes attached to or referencing this content

### 6. Learning Actions Section

- **Content:** A grid of action cards offering learning activities based on the saved content
- **Action Cards:**

| Action | Icon | Description | Behavior |
|--------|------|-------------|----------|
| Generate Exercise | 📝 | Create IELTS exercises from content | Opens exercise generator with content pre-loaded |
| Explain with AI | 🤖 | AI explains content in IELTS context | Opens AI Tutor chat with content as context |
| Save Vocabulary | 📖 | Extract and save IELTS words from content | Opens vocabulary extraction tool |
| Start Reading Practice | 📚 | Use article as IELTS reading passage | Opens reading practice with this content |
| Add Note | ✏️ | Attach a personal learning note to content | Inline editable text area |
| Share Content | 📤 | Share or export saved content | Opens share sheet / export dialog |

- **Design:** Each action is a rounded card with icon, label, and subtle hover effect
- **Conditional display:**
  - "Start Reading Practice" only for articles and text with >= 100 words
  - "Generate Exercise" only for articles and text
  - "Save Vocabulary" available for all content types

### 7. Mined Vocabulary Section (in Detail Panel)

- **Purpose:** Track all vocabulary words the user has saved from this specific content item
- **Content:** Table or list showing:
  - Word (bold, clickable to open vocabulary detail)
  - Meaning (truncated)
  - Part of speech
  - Status badge (new, learning, reviewing, mastered)
  - Difficulty badge
  - "Open in Vocabulary" button (navigates to word in vocabulary notebook)
  - "Ask AI" button
- **Empty state:** "No vocabulary saved from this article yet. Select text in the content above and choose 'Save Word'."
- **"Add Word from Selection"** button at bottom — enables text selection mode

### 8. Quick Add / Edit Modal

- **Content:** Modal form for adding or editing saved content
- **Fields:**
  - URL (for articles/videos from web)
  - Title (required)
  - Content text (textarea, for pasted text or notes)
  - Content Type (select: article, text, note, video, reference, tool, other)
  - IELTS Topic (select from IELTS_TOPICS)
  - Skill Association (select: reading, listening, writing, speaking, grammar, vocabulary, general)
  - Difficulty (select: easy, medium, hard, not specified)
  - Status (select: unread, in progress, completed, saved for later)
  - Tags (comma separated, with autocomplete from existing tags)
  - Personal Note (textarea)
- **Behavior:**
  - URL field auto-fetches title and favicon on blur
  - If no URL (for text/notes), content text can be pasted directly
  - "Save" primary action
  - "Cancel" secondary action

---

## Primary Actions

1. **Open Content Detail** — Click a card to open the detail panel or full view
2. **Search** — Full-text search across all saved content fields
3. **Filter by Type** — Filter to articles, text, notes, etc.
4. **Filter by Topic** — Narrow to specific IELTS topics
5. **Filter by Skill** — Filter by associated IELTS skill
6. **Filter by Status** — Filter by reading status
7. **Generate Exercise** — Create IELTS exercise from content
8. **Explain with AI** — Send content to AI Tutor for analysis
9. **Save Vocabulary from Content** — Extract and save IELTS words
10. **Start Reading Practice** — Use content as reading passage
11. **Add Manually** — Save a new URL or paste text
12. **Mark as Read** — Update reading status

## Secondary Actions

1. **Toggle Favorite** — Star/unstar a content item
2. **Add Personal Note** — Attach a learning note
3. **Edit Metadata** — Update title, tags, category, topic, etc.
4. **Delete Content** — Remove with confirmation dialog
5. **Open Original URL** — Visit the source website
6. **Share / Export** — Share link or export content data
7. **Save Text Selection** — Select text in detail view and save as word or sentence
8. **Attach Study Note** — Link an existing study note to this content
9. **Change Reading Status** — Toggle between Unread / In Progress / Completed
10. **Toggle View** — Switch between grid and list layout
11. **Clear Filters** — Reset all search and filter state
12. **Extension Guide** — Learn how to save content from the browser

---

## Empty State

### No Saved Content At All

- **Icon:** Empty bookshelf or folder with a "+" illustration
- **Title:** "Your content library is empty"
- **Description:** "Save articles, text passages, and web content to build your personal IELTS learning library. Use the browser extension to save content while browsing, or add URLs manually."
- **Primary Action:** "Add Your First Content" (opens Add modal)
- **Secondary Text:** "Learn how to use the browser extension →" (opens extension guide)
- **Extra:** "Tip: Try saving an IELTS reading article from BBC News or The Guardian to practice with real content."

### No Results (filters match nothing)

- **Icon:** Magnifying glass with empty document
- **Title:** "No saved content matches your filters"
- **Description:** "Try adjusting your search terms or clearing some filters to see more items."
- **Action:** "Clear All Filters" button

### No Articles (filtered to article type)

- **Icon:** Newspaper or document icon
- **Title:** "No saved articles yet"
- **Description:** "Articles are full web pages saved from your browser. Install the extension to save articles while browsing, or paste article text manually."
- **Actions:** "Add Article Manually" / "Extension Guide"

### No Text Passages (filtered to text type)

- **Icon:** Quote bubble or text snippet icon
- **Title:** "No saved text passages yet"
- **Description:** "Select text on any web page and save it to your IELTS Journey. Text passages are great for vocabulary mining and grammar study."
- **Actions:** "Add Text Manually" / "Extension Guide"

### No Study Notes (filtered to notes type)

- **Icon:** Notebook or pencil icon
- **Title:** "No study notes yet"
- **Description:** "Add personal notes while studying. Notes help you remember key insights, grammar rules, and writing tips."
- **Action:** "Create a Note"

### No Vocabulary Mined (in detail panel)

- **Icon:** Book open with sparkle
- **Title:** "No vocabulary saved from this content yet"
- **Description:** "Select text in the article above and choose 'Save Word' to add IELTS vocabulary from this content."
- **Action:** "Select Text Mode" (enables text selection)

---

## Loading State

### Initial Load

- **Skeleton pattern:**
  - Header area: Two skeleton lines (title + subtitle)
  - Stats bar: 5 skeleton stat cards (small rounded rectangles)
  - Filter bar: skeleton search input + 4 skeleton filter pills
  - Content grid: 6 skeleton content cards (each showing: icon circle + 3 text lines + 3 badge skeletons + action button skeletons)
- **Animation:** Subtle shimmer/pulse effect
- **Duration:** Until `DatabaseService.getAll('artifacts')` resolves, plus any extension data sync

### Detail Panel Loading

- **Skeleton pattern:**
  - Header skeleton (back button + title placeholder)
  - Metadata row skeleton (3 badge pills)
  - Content body skeleton (8-10 text lines of varying width)
  - Learning actions skeleton (4 action card placeholders)
- **Animation:** Shimmer effect

### Saving Content

- **Button loading state:** Save button shows spinner + "Saving..."
- **Modal remains open** with form data intact during save
- **Success feedback:** Toast "Content saved" with optional undo action
- **Optimistic update:** Card appears in grid immediately, with rollback on error

### AI Operations (Generate Exercise / Explain)

- **Button loading state:** The action button shows spinner + "Generating..." or "Analyzing..."
- **Inline loading:** Action card shows a progress indicator with status text
- **Fallback:** If content is too short, show inline message: "This content is too short for exercise generation. Try saving a longer article."

### Filter Application

- **Instant filtering:** For local/client-side filtering (no loading state)
- **Pagination change:** Instant (client-side pagination)
- **Debounced search:** 300ms debounce on search input

---

## Error State

### Failed to Load Saved Content

- **Layout:** Centered error card
- **Icon:** Database or connection warning
- **Title:** "Could not load your saved content"
- **Description:** "The database may be temporarily unavailable. Your saved content is stored locally and should be available again shortly."
- **Action:** "Try Again" button
- **Secondary:** "Check Extension Connection" (if content from extension is missing)

### Failed to Save Content

- **Feedback:** Toast error notification: "Failed to save content. Please try again."
- **Form state:** Modal remains open with entered data intact
- **Action:** User can retry by clicking Save again
- **Validation errors:** Inline field validation messages for required fields

### AI Action Failed

- **Feedback:** Toast error: "AI analysis is temporarily unavailable."
- **Fallback:** Show a simpler non-AI option (e.g., "Read content directly" instead of "Explain with AI")
- **Retry:** "Try Again" button on the action card

### Extension Content Not Syncing

- **Feedback:** Inline banner at the top: "Content saved from your browser extension may not appear immediately. Make sure you're logged into the same account."
- **Action:** "Check Extension Status" → navigates to extension connection page
- **Dismissible:** User can dismiss the banner

### Content Too Short for Exercise

- **Feedback:** Inline message on the "Generate Exercise" action card
- **Message:** "This content is too short (X words). Save a longer article (at least 100 words) to generate exercises."
- **Alternative:** "Try 'Explain with AI' instead"

### Database Corruption

- **Content:** "Your saved content data could not be read."
- **Actions:** "Restore from Backup" (if backup exists), "Start Fresh"

---

## Mobile Layout

### Screen Adaptation

- **Header:** Title + "Add" button; stats become a single stat line (e.g., "42 items")
- **Stats Row:** Horizontally scrollable chip-style stat pills (icon + count)
- **Filter Bar:** Search input always visible; filter controls behind a "Filters" toggle button that expands additional controls
- **Content Grid:** Single-column, full-width cards with compact layout (smaller icons, fewer tags visible, actions accessible via swipe or tap)
- **View Toggle:** Grid/List toggle hidden on mobile (always single-column list)
- **Pagination:** Simplified to "Show More" button at the bottom (infinite scroll pattern)

### Detail Panel on Mobile

- **Full-Screen View:** Detail opens as a full-page view that pushes the list behind
- **Sticky Header:** Back button, title, content type badge, favorite, and overflow menu at top
- **Sticky Bottom Action Bar:** Fixed bar at the bottom with primary actions (scrollable horizontal row of icon+label buttons for: Generate Exercise, Explain AI, Save Vocabulary, Read Practice)
- **Content Body:** Full-width reading view with proper typography
- **Text Selection:** Standard mobile text selection triggers the system selection menu with custom actions added via the share sheet

### Add/Edit Modal on Mobile

- **Full-Screen Modal:** Form opens as full-screen with sticky title bar
- **Single-Column Layout:** All fields stack vertically
- **Keyboard-Aware:** Form scrolls to keep active input visible
- **Fields:** URL (optional), Title, Content Text (large textarea), Type, Topic, Skill, Status, Tags, Note

### Touch Behavior

- **Tap targets:** Minimum 44x44px for all interactive elements
- **Swipe left:** On a content card reveals quick actions (Delete, Mark as Read)
- **Long press:** On a content card opens context menu (Edit, Share, Change Status)
- **Pull to refresh:** Swipe down at the top of the content list to reload
- **Tap to open:** Tap a card to open detail view
- **Swipe to close:** In detail view, swipe right or tap back to return to list

### Bottom Navigation on Mobile

- **During list view:** Bottom navigation visible with standard items
- **During detail view:** Bottom navigation replaced by sticky action bar
- **During add/edit form:** Bottom navigation hidden

---

## Responsive Behavior

| Breakpoint | Grid Columns | Detail Panel | Stats Bar | Filters |
|---|---|---|---|---|
| < 480px (small phone) | 1 column | Full-screen page | Scrollable chips | Collapsible accordion |
| 480–767px (large phone) | 1 column | Full-screen page | Scrollable chips | Collapsible accordion |
| 768–1023px (tablet) | 2 columns | Slide-over drawer (40%) | 5 stat row | Inline + dropdown |
| 1024–1439px (desktop) | 3 columns | Slide-over drawer (45%) | 5 compact stat row | Single row inline |
| 1440px+ (large desktop) | 3-4 columns | Slide-over drawer (45%) or full-page | 5 compact stat row | Single row inline |

- **Content cards:** Compact variant on mobile (smaller font, fewer action buttons visible, tags hidden behind "..." chip)
- **Quick action row:** On desktop, shown as 2-3 text buttons below description. On mobile, actions are in the sticky bottom bar when detail is open, or accessible via swipe/long-press on the card.
- **Detail view:** Slide-over drawer on desktop preserves list context. Full-screen on mobile for maximum reading space.
- **Infinite scroll:** On mobile, use "load more" at the bottom instead of traditional pagination.
- **Transition animations:** Cards slide in with staggered fade; detail panel slides in from right; filters expand with smooth height transition

---

## AI Tutor Integration

### Entry Points

1. **"Explain with AI" Action Card (Detail Panel):**
   - Primary action button in the Learning Actions section
   - Sends the full content text to AI Tutor with prompt: "Explain this article in the context of IELTS preparation. Identify key vocabulary, grammar patterns, and potential IELTS topics."
   - Opens AI Tutor chat with content context pre-loaded

2. **Text Selection in Detail View:**
   - When user selects text in the content body, a floating action bar appears with: "Explain Selection" → sends selected text to AI Tutor
   - "Explain Selection" opens AI Tutor with: "Explain this text and how it can be used in IELTS Writing/Speaking"

3. **"Save Vocabulary" with AI Suggestions:**
   - When user saves a word from content, AI Tutor suggests: related words, collocations, and IELTS usage examples
   - Shows as a small inline suggestion panel in the mined vocabulary section

4. **Proactive AI Recommendations:**
   - AI Tutor can proactively recommend reviewing saved content: "You saved 3 articles about climate change. Want to generate a reading exercise from them?"
   - Appears in dashboard as a proactive message related to `saved-content` category

5. **AI-Generated Content Summary:**
   - In the detail panel header, an optional "AI Summary" section provides a 2-3 sentence IELTS-relevant summary of the content
   - Generated on demand via a "Generate AI Summary" button

### Chat Context Payload

When opening AI Tutor from saved content:

```json
{
  "context": "saved-content",
  "contentId": "uuid-of-content",
  "contentType": "article",
  "title": "Climate Change and Its Global Impact",
  "topic": "Environment",
  "skill": "reading",
  "wordCount": 850,
  "savedFrom": "https://example.com/article",
  "action": "explain"
}
```

For "Explain Selection":

```json
{
  "context": "saved-content-selection",
  "contentId": "uuid-of-content",
  "selectedText": "The rapid industrialization...",
  "action": "explain-selection"
}
```

### AI Feature States

| State | Display |
|---|---|
| Available | Action cards show active state with label |
| Loading | Action card shows spinner + "Analyzing content..." |
| Content too short | "Content too short for this action. Save longer content." |
| AI unavailable (offline) | Action cards are disabled with note: "Available when online" |
| Error | "AI analysis failed. [Try Again]" |
| Success | Opens AI Tutor chat with context loaded |

---

## Accessibility Notes

- **Search input:** `aria-label="Search saved content"` with `aria-live="polite"` region for result count updates
- **Filter dropdowns:** Each select element has unique `aria-label` (e.g., "Filter by content type", "Filter by topic")
- **Content cards:** Each card uses `role="article"` with `aria-label="Saved content: {title}"`; entire card is clickable with `tabindex="0"` and keyboard Enter/Space to open detail
- **Action buttons:** Each button within a card has `aria-label` (e.g., "Generate exercise from {title}", "Explain {title} with AI")
- **Favorite toggle:** `aria-label="Add {title} to favorites"` / "Remove {title} from favorites"; `aria-pressed` state
- **Detail panel:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="detail-content-title"`; focus trapped when open; dismissible with Escape key
- **Content body in detail:** Use semantic HTML (`<article>`, `<h1>`–`<h6>`, `<p>`, `<blockquote>`) for readability and screen reader navigation
- **Text selection actions:** Selection toolbar items have `aria-label` (e.g., "Save selected word to vocabulary", "Explain selected text")
- **Empty state:** `role="status"` to announce empty state to screen readers
- **Stats cards:** Each stat is announced as "{count} {label}" with `aria-label`
- **Color independence:** Content type and status use icons + text in addition to color badges; do not rely solely on color
- **Touch targets:** Minimum 44x44px for all interactive elements on mobile
- **Focus order:** Search → filters → content grid → pagination → actions, logical top-to-bottom
- **Error announcements:** Toast and inline errors use `role="alert"`
- **Keyboard navigation:** Arrow keys navigate between content cards in grid; Tab moves between action buttons within a card
- **Reading progress:** `aria-label="Reading progress: 60 percent"` on progress bar

---

## Components Needed

### From Component System (Existing or New)

| Component | Type | Usage |
|---|---|---|
| Button | Existing | Add Manually, action buttons, Save, Cancel, Retry, pagination |
| IconButton | Existing/Nav | Favorite, edit, delete, overflow menu, view toggle, close detail |
| Card | Existing | Content cards, stat cards, action cards, filter container |
| Badge | New | Type badge, status badge, topic badge, skill badge, tag badge |
| Input | Existing | Search input, form text inputs |
| SearchInput | New | Dedicated search component with icon, clear button, debounced input |
| Select | Existing | Type filter, topic filter, skill filter, status filter, sort selector |
| Textarea | Existing | Content paste area, personal note field in detail panel |
| Modal | Existing | Add/Edit content form, delete confirmation, extension guide |
| Drawer | New | Content detail panel slide-over from right |
| Toast | Existing | Success/error/info feedback for CRUD and AI operations |
| Tabs | Existing | (Optional) tabs for different content categories in header |
| ProgressBar | Existing | Reading progress indicator in detail panel |
| EmptyState | Existing | Empty library, no results, no articles, no text, no notes |
| LoadingSkeleton | New | Skeleton cards for initial loading, detail panel loading |
| ErrorState | Existing | Failed to load with retry, AI error fallback |
| Pagination | Existing | Page navigation for content list |
| Grid | Existing | CSS grid container for content cards |

### New Components to Create

1. **SavedContentCard** — Content card with compact/grid variants showing type icon, title, excerpt, metadata, and quick action buttons. Variants: grid (desktop), list (dense), compact (mobile).
2. **ContentDetailPanel** — Slide-over drawer (desktop) or full-page view (mobile) showing full content, metadata, reading progress, learning actions, mined vocabulary, and related notes.
3. **LearningActionCard** — Action card in the Learning Actions section showing an icon, label, description, and click handler. Variants: generate exercise, explain AI, save vocabulary, read practice, add note, share.
4. **FilterBar** — Unified filter bar combining search input, type/topic/skill/status/tag/sort dropdowns, view toggle, and clear button.
5. **StatCard** — Compact stat card for the stats bar (icon + count + label, colored by content type).
6. **MinedVocabularyTable** — Table/list display of vocabulary saved from a specific content item, showing word, meaning, status, difficulty, and quick actions.
7. **SelectionActionBar** — Floating action bar that appears when user selects text in the content detail body. Options: Save Word, Explain Selection, Save Sentence.
8. **ExtensionGuideModal** — Help modal explaining how the browser extension saves content to this page.
9. **ReadingProgressBar** — Interactive progress bar for marking reading status (unread → in progress → completed).
10. **ContentFormFields** — Reusable form field set for add/edit content modal, with conditional fields based on content type.

### Component States Matrix

| Component | Default | Active | Hover | Focus | Disabled | Loading | Error |
|---|---|---|---|---|---|---|---|
| SavedContentCard | Card with metadata | Opened (visited state) | Elevation increase | Focus ring | — | Skeleton variant | Error badge on card |
| ContentDetailPanel | Hidden (closed) | Open (slide in) | — | Focus trap | — | Skeleton content | Inline error banner |
| LearningActionCard | Colored icon + label | Scale press | Background tint | Focus ring | Greyed out | Spinner + text | Red tint + retry |
| FilterBar | All filters visible | Active filter badge | — | Focus ring | — | — | — |
| SelectionActionBar | Hidden | Visible on select | Button hover | Focus ring | — | — | — |
| StatCard | Number + label | Tappable (filter) | Slight lift | Focus ring | — | Skeleton number | — |
| MinedVocabularyTable | Word rows | Word click (navigate) | Row highlight | Focus ring | — | Skeleton rows | Empty message |
| ReadingProgressBar | Current state | Click updates | Segment hover | Focus ring | — | — | — |

---

## Data Displayed

### Artifact (per saved content item)

| Field | Type | Display |
|---|---|---|
| `id` | string | (internal) |
| `url` | string | Link to original source, displayed as clickable URL |
| `title` | string | Bold heading, primary identifier of the content |
| `description` | string | Excerpt or user description, truncated to 2 lines |
| `favicon` | string | Small icon from the source website |
| `tags` | string[] | Chip-style badges |
| `isFavorite` | boolean | Star toggle state |
| `category` | ArtifactCategory | Badge: article (blue), video (purple), reference (green), tool (amber), other (slate) |
| `source` | string | Origin label: "manual", "extension", "imported" |
| `createdAt` | ISOString | Formatted date: "May 15, 2026" |
| `updatedAt` | ISOString | Footer metadata |

### Additional Fields (New / Extended)

| Field | Type | Display |
|---|---|---|
| `contentText` | string | Full article/saved text body — shown in detail panel |
| `contentType` | ContentType | Refined type: article, text, note, video, reference, tool, other |
| `ieltsTopic` | string | IELTS topic badge (Education, Technology, etc.) |
| `skill` | string | Skill badge (reading, listening, writing, speaking, grammar, vocabulary, general) |
| `difficulty` | string | Difficulty badge (easy, medium, hard) |
| `readingStatus` | string | Status: unread, in_progress, completed, saved_for_later |
| `readingProgress` | number | 0–100 percentage of content read |
| `personalNote` | string | User's personal note attached to this content |
| `wordCount` | number | Computed: total word count of content text |
| `estimatedReadTime` | number | Computed: wordCount / 200 (minutes) |
| `lastOpenedAt` | ISOString | Timestamp of last detail view |
| `minedVocabulary` | string[] | Array of vocabulary IDs saved from this content |
| `extensionData` | object | Original extension metadata (pageTitle, pageUrl, category) |

### Stats Data

| Stat | Computation | Color |
|---|---|---|
| Total | `artifacts.length` | Primary |
| Articles | `artifacts.filter(a => a.category === 'article' && a.contentType === 'article').length` | Blue |
| Text | `artifacts.filter(a => a.contentType === 'text').length` | Green |
| Notes | `artifacts.filter(a => a.contentType === 'note').length` | Amber |
| In Progress | `artifacts.filter(a => a.readingStatus === 'in_progress').length` | Purple |
| Unread | `artifacts.filter(a => a.readingStatus === 'unread').length` | Slate |

### Content Detail — Additional Computed Data

| Data | Computation |
|---|---|
| Word count | `contentText.split(/\s+/).length` |
| Estimated reading time | `Math.ceil(wordCount / 200)` minutes |
| Mined vocabulary count | `minedVocabulary.length` |
| Related study notes count | `StudyNoteRepository.findByContentId(id).length` |
| Days since saved | `Math.floor((Date.now() - createdAt) / 86400000)` |

---

## Design Notes

### Inspired by the Reference (Personalized Learning App by Anastasia Golovko)

1. **Content library as a visual collection** — Content cards should look like a curated collection, not a file manager. Use rounded card corners, soft shadows, and generous spacing. Each card should feel like a physical article clipping with a paper-like texture or subtle background tint.

2. **Type differentiation with color** — Articles use a soft blue left border accent, text passages use green, notes use amber, videos use purple. This follows the reference's use of color to differentiate content types without overwhelming the grid.

3. **Detail view as a reading experience** — The content detail panel should feel like a premium reading experience: comfortable line-height (1.8 for text), generous padding, serif or readable sans-serif font for the body, subtle background tint (off-white or light warm gray) to distinguish the reading area from the UI chrome.

4. **Learning actions as inviting cards** — The Learning Actions section should not look like a toolbar. Each action should be a rounded card with icon, label, and a brief description. The reference uses friendly action cards — apply the same approach to make learning from content feel inviting, not mechanical.

5. **Mined vocabulary as a collection** — The vocabulary mined from an article should display as a small collection of word cards, not a dense table. Each word should have a mini-card with word, meaning preview, and status dot. This aligns with the reference's approach of showing learning items as visual cards.

6. **Reading progress as a friendly indicator** — Instead of a generic progress bar, use a segmented progress indicator with three clear states: Unread (empty track with a circle), In Progress (half-filled track with walking figure icon), Completed (filled track with checkmark). The reference uses playful progress visuals — make content reading feel like a journey.

7. **Empty state as motivation** — The empty state should not just say "no content". It should motivate: "Your IELTS content library is waiting to be filled! Every article you save is a potential reading passage, vocabulary source, or essay topic." Include a small illustration and clear next steps.

8. **Extension connection visible** — A subtle banner or badge on the page should indicate: "Connected to browser extension" or "Install extension to save from web". This reinforces the product ecosystem feel. The reference shows a connected, multi-device experience.

9. **Seamless type mixing** — Articles, text snippets, and notes should coexist in the same grid without feeling mismatched. Use consistent card structure with type-appropriate content previews: articles show favicon + title + description, text passages show a quoted excerpt, notes show a notebook icon with first line.

10. **Mobile reading mode** — On mobile, the content detail should feel like a dedicated reading app: system font for maximum readability, dark mode support, estimated reading time at the top ("4 min read"), and a clean bottom action bar that doesn't distract from reading.

### Content Library as a Learning Ecosystem

The saved content page should reinforce that IELTS Journey is more than a collection of tools — it is a connected learning environment:

- **Every saved item is a learning opportunity** — The page should frame every article, text, and note as raw material for IELTS practice
- **Cross-referencing with vocabulary** — The mined vocabulary section creates a bridge between content browsing and vocabulary learning: "I found this word while reading an article about climate change"
- **Cross-referencing with practice** — "Start Reading Practice" and "Generate Exercise" turn passive content into active learning
- **Content as study material** — The AI Tutor can analyze any saved content and generate IELTS-relevant insights, creating a loop of: browse → save → learn → practice
- **Extension feeds the library** — The connection to the browser extension should be visible and celebrated: "24 articles saved from the web"
- **Local-first, sync-ready** — All content is stored locally (IndexedDB) with future sync to cloud accounts; offline access is always available

### Visual References from the Codebase

- **Current layout:** `ArtifactsPage.tsx:220-465` — The current page structure (header + filter + grid) should be preserved but enhanced with richer card content and a detail panel
- **Extension SaveTextForm:** `SaveTextForm.tsx:15-509` — The category selector, skill picker, and tag input patterns should inform the add/edit form design
- **ArticleCollector:** `ArticleCollector.tsx` — The IELTS topic selection and reading practice flagging should be integrated into the content form
- **Artifact schema:** `schema.ts:33-45` — The existing `artifactSchema` should be extended with new fields (contentText, ieltsTopic, skill, readingStatus, etc.) rather than replaced
