# IELTS Journey — Practice Pages Specification

## Overview

This document specifies the design for all six IELTS practice pages: Reading, Listening, Writing, Speaking, Grammar, and Vocabulary Practice. Each practice page provides focused skill-building exercises, AI-powered feedback, mistake tracking, and progress tracking. The practice pages are the core learning engine of IELTS Journey — where users spend most of their study time and see their skills improve.

---

## 1. Reading Practice

### Page Purpose

The Reading Practice page allows users to practice IELTS Academic and General Training reading passages, answer comprehension questions, and develop passage-analysis strategies. Every reading session includes authentic IELTS-style passages, timed practice, and detailed answer review.

### User Goal

Users should feel:

- **Prepared** — Passages match IELTS difficulty and question types
- **Tracked** — Every practice session is recorded with accuracy, time, and mistakes
- **Guided** — AI Tutor can explain difficult passages, vocabulary, and question strategies
- **Growing** — Progress shows band improvement, speed improvement, and common mistake patterns

### Current UX/UI Problems

1. **Bare functional layout** — The `ReadingPractice` component (`apps/web/src/features/reading/ReadingPractice.tsx`) uses raw `<div>` tags with Tailwind classes. No design system components are used for passage cards, question rendering, or results display.

2. **Question types lack visual distinction** — Multiple-choice, true-false-not-given, matching headings, and gap-fill all use similar input styling. Users cannot distinguish question types at a glance.

3. **Passage display is plain** — The passage text renders in a single `<div>` with Georgia font. No line numbering, paragraph highlighting, or annotation support makes active reading difficult.

4. **No highlight or note-taking** — Users cannot highlight passages or take margin notes while reading — a critical feature for real IELTS reading strategy.

5. **Results view is crowded** — Score statistics, question review, and mistakes are stacked vertically in a long page. The layout does not prioritize what to review first.

6. **AI Tutor access is separate** — AI Tutor is available only via the global floating button. No contextual "explain this passage" or "explain this question" button exists inside the reading view.

7. **No vocabulary extraction** — Users cannot save words from the passage to their vocabulary notebook directly from the reading page.

### Proposed Layout

```
+-----------------------------------------------+
| Header (title, search, filter, AI Generate)    |
+-----------------------------------------------+
|                                                |
|  Browse View (default)                         |
|  +-----------+ +-----------+ +-----------+    |
|  | Passage   | | Passage   | | Passage   |    |
|  | Card      | | Card      | | Card      |    |
|  +-----------+ +-----------+ +-----------+    |
|                                                |
|  — OR —                                         |
|                                                |
|  Reading View (active session)                 |
|  +---------------------------+----------------+
|  | Passage Text              | Question Panel |
|  | (scrollable, annotated)   | (fixed side)   |
|  |                           |                |
|  +---------------------------+----------------+
|  | Bottom: Progress bar + Submit               |
|  +-----------------------------------------------+
|                                                |
|  — OR —                                         |
|                                                |
|  Results View                                   |
|  +--------+ +--------+ +--------+ +--------+  |
|  | Score  | |Accuracy| |  Time  | |Mistakes|  |
|  +--------+ +--------+ +--------+ +--------+  |
|  | Question-by-question review                |
|  | Mistakes summary with explanations         |
|  +-----------------------------------------------+
|                                                |
|  — OR —                                         |
|                                                |
|  History View                                   |
|  | Stats summary cards + session list         |
|  +-----------------------------------------------+
```

### Main Sections

| Section | Description |
|---------|-------------|
| Header | Page title + description + action buttons (AI Generate, History) |
| Search & Filter | Keyword search, topic dropdown, difficulty filter |
| Passage Browser | Responsive grid of passage cards with title, difficulty badge, topic, word count, question count, estimated time, excerpt |
| Reading View | Two-column layout: scrollable passage text on left, question panel on right (sticky on desktop) |
| Question Panel | Scrollable list of questions with type indicator icons; auto-save answers to IndexedDB |
| Progress Footer | Question progress bar (e.g., "7/12 answered"), timer display, "Submit Answers" button |
| Results Header | 4 stat cards: Score, Accuracy %, Time, Mistakes count |
| Question Review | Each question shown with user's answer vs correct answer, explanation, and "Explain with AI" button |
| Mistakes Summary | All incorrect answers grouped with explanations; "Save to Mistake Notebook" action |
| History | 5 stat cards (total practices, avg accuracy, best score, questions done, total time) + session list with click to view detail |

### Primary Actions

- Start Practice — Begin a passage (from browse)
- Submit Answers — End session and view results
- AI Generate — Open modal to create a new passage by topic/difficulty
- Review Results — Navigate between questions in results view

### Secondary Actions

- Explain with AI — Send specific question or passage section to AI Tutor
- Save Vocabulary — Select a word from passage → save to vocabulary notebook
- Save to Mistake Notebook — Add incorrect answers to mistake review system
- Try Again — Restart the same passage
- History — Browse past reading sessions
- Share Passage — Copy link or export passage content

### Empty State

**Before any passages exist:**
- Friendly illustration of a person reading a book
- Title: "No reading passages yet"
- Description: "Start with sample passages or generate one with AI"
- Action: "Generate with AI" button (primary)
- Action: "Browse Sample Passages" button (secondary)

**No search matches:**
- Title: "No passages match your search"
- Description: "Try different keywords or clear your filters"
- Action: "Clear Filters" button

### Loading State

- Skeleton cards (3 cards with shimmer animation) for the passage browser grid
- Skeleton question panel with 4 placeholder question rows
- Skeleton passage text with 8 placeholder text lines
- Results skeleton with 4 stat card skeletons + 3 question skeleton rows
- History skeleton with 2 row skeletons

### Error State

- Error illustration with sad book icon
- Title: "Failed to load passages"
- Description: Error message text
- Action: "Retry" button
- Action: "Try AI Generation" button (alternative)

### Mobile Layout

- **Browse:** Single column passage cards, full-width with compact metadata row
- **Reading:** Passage on top (scrollable), questions below (accordion-style, one at a time)
- **Results:** Statistics wrap to 2x2 grid; questions expandable via tap
- **Question Panel:** Slides up as a bottom sheet on mobile
- **Timer:** Compact pill style in the header

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column; passage above questions |
| 768–1024px | 2-column passage grid; reading is single column with sticky question panel |
| > 1024px | 3-column passage grid; reading is side-by-side passage + questions |

### AI Tutor Integration

- **Explain Passage** — Button on passage card sends passage to AI Tutor for summary/translation
- **Explain Question** — Button on each question in results sends question + passage excerpt to AI Tutor
- **Reading Strategy** — AI Tutor can suggest strategies for specific question types
- **Vocabulary Help** — Tap any word in passage → popover with AI-powered definition/IELTS usage
- **Post-Review Insights** — After results, AI Tutor offers: "I noticed you struggled with True/False/Not Given. Would you like to practice more?"

### Components Needed

- PassageCard (skill card variant)
- QuestionRenderer (per question type: multiple-choice, true-false-not-given, matching-headings, gap-fill)
- Timer
- ProgressBar
- StatCard
- ResultsReviewList
- MistakeCard
- AIExplainButton
- VocabularyWordPopover

### Data Displayed

- `ReadingPassageWithQuestions[]` — all available passages
- `ReadingPracticeSession` — current/past session data
- Question types with visual indicators
- Score, accuracy, time, mistakes per session
- Aggregate stats across all sessions

### Accessibility Notes

- Passage text must be in `<article>` with proper heading hierarchy
- Questions must use `<fieldset>` and `<legend>` for multiple-choice groups
- Timer must announce updates via `aria-live="polite"`
- Tab order: question → options → submit. Do not trap keyboard in question panel
- All interactive elements must have visible focus rings
- Reading view must support screen reader text-to-speech for passage content

### Design Notes

- Passage cards should use soft shadows and rounded corners — feel like chapter cards in a reading app
- The reading view should feel like a premium e-reader: serif font, comfortable line height, subtle background tint
- Question types should be visually distinct with color-coded icons (e.g., blue for multiple-choice, green for matching)
- Results should feel like a coaching feedback session, not a test score printout
- The timer should feel encouraging, not stressful — use soft amber color, not red
- Vocabulary extraction from passage text should feel seamless — tap word → bottom sheet with save options

---

## 2. Listening Practice

### Page Purpose

The Listening Practice page provides IELTS-style audio exercises with transcripts, comprehension questions, and note-taking support. Users practice with authentic listening scenarios including conversations, monologues, and academic lectures across all four IELTS listening sections.

### User Goal

Users should feel:

- **Focused** — Audio quality is clear; transcripts support comprehension
- **Skillful** — Practice covers all IELTS listening question types
- **Prepared** — Note-taking practice is integrated into every session
- **Tracked** — Mistake patterns across gap-fill, multiple-choice, map-labeling are identified

### Current UX/UI Problems

1. **Audio sources are inconsistent** — The `AudioPlayer` component (`apps/web/src/features/listening/components/AudioPlayer.tsx`) supports HTML5 audio, YouTube URLs, and browser TTS. Quality varies wildly and users cannot rely on consistent playback experience.

2. **No audio controls feedback** — No waveform visualization, playback speed control, or audio progress shown visually. Play/pause button is minimal.

3. **Transcript display is static** — Toggleable transcript is plain text. No synchronized highlighting with audio playback, no click-to-seek, no search within transcript.

4. **Note-taking is an afterthought** — A single `<textarea>` labeled "Notes" is provided. No structured note fields, no timestamp linking, no auto-save.

5. **Question types lack audio context** — Each question is isolated. Users cannot see which part of the transcript a question refers to.

6. **Table completion is hard to use** — The table-completion question type renders as raw HTML table with inputs. On mobile it becomes unusable due to small cell sizes.

7. **No repeat-section support** — In real IELTS, users hear audio once. In practice, users should be able to repeat sections, but the current UI offers only full track replay.

### Proposed Layout

```
+-----------------------------------------------+
| Header (title, search, filter, AI Generate)    |
+-----------------------------------------------+
|                                                |
|  Browse View                                   |
|  +-----------+ +-----------+ +-----------+    |
|  | Exercise  | | Exercise  | | Exercise  |    |
|  | Card      | | Card      | | Card      |    |
|  +-----------+ +-----------+ +-----------+    |
|                                                |
|  — OR —                                         |
|                                                |
|  Practice View (active session)                |
|  +-------------------------------------------+|
|  | Audio Player (waveform + controls)        ||
|  +-------------------------------------------+|
|  | Tab: Questions | Tab: Transcript |        |
|  | Tab: Notes     |                          |
|  +-------------------------------------------+|
|  | Progress bar + Submit                     ||
|  +-------------------------------------------+|
|                                                |
|  — OR —                                         |
|                                                |
|  Results View (same as Reading)                |
+------------------------------------------------+
```

### Main Sections

| Section | Description |
|---------|-------------|
| Header | Title + description + action buttons (AI Generate, History) |
| Browse | Grid of exercise cards with title, difficulty, topic, audio type icon, questions count, estimated time |
| Audio Player | Waveform visualization, play/pause, 10s skip, playback speed (0.5x–2x), volume, timer display |
| Transcript Tab | Scrollable transcript with tap-to-seek on audio; search within transcript; auto-scroll during playback |
| Questions Tab | List of questions organized by audio section; auto-scroll to relevant question during audio |
| Notes Tab | Timestamped note fields; auto-save notes to IndexedDB session record |
| Results | Same as Reading results: score, accuracy, mistakes with audio excerpts |

### Primary Actions

- Start Exercise — Begin a listening exercise
- Play/Pause Audio — Control audio playback
- Submit Answers — End session and view results
- Toggle Transcript — Show/hide synchronized transcript

### Secondary Actions

- Change Playback Speed — 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- Skip +10s / -10s — Navigate within audio
- Add Timestamped Note — Click a timestamp during audio → add note
- AI Generate — Create new listening exercise with AI-generated audio (TTS)
- Save Vocabulary — Save a word from transcript to vocabulary notebook
- Explain Section — Send transcript excerpt to AI Tutor for explanation

### Empty State

**Before any exercises exist:**
- Illustration of headphones
- Title: "No listening exercises yet"
- Description: "Start with sample exercises or generate one with AI"
- Action: "Generate with AI" button (primary)

**No search matches:**
- Same pattern as Reading

### Loading State

- Skeleton cards in browse grid
- Skeleton audio player (waveform placeholder)
- Skeleton question list (4 rows)
- Skeleton transcript (10 lines of shimmer)

### Error State

- Error illustration with broken headphones
- Title: "Failed to load listening exercises"
- Description: Error message
- Action: "Retry" button
- Audio-specific error: "Audio source unavailable. Try AI-generated audio instead."

### Mobile Layout

- **Browse:** Single column cards
- **Practice:** Audio player fixed at top; tabs (Questions, Transcript, Notes) as horizontal swipeable tabs; submit button fixed at bottom
- **Note-taking:** Bottom sheet for notes with timestamp buttons
- **Transcript:** Full-width with larger text for readability

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Audio player compact; tabs with swipe; full-width content |
| 768–1024px | Audio player normal; tabs side by side (questions + transcript) |
| > 1024px | Full audio player; 3-tab layout |

### AI Tutor Integration

- **Explain Transcript Section** — Select text in transcript → "Explain with AI Tutor"
- **Listening Strategy** — AI Tutor provides strategies for specific question types (e.g., "For map labeling, listen for directional language")
- **Difficult Audio** — If user gets <50% accuracy, AI Tutor offers: "This section had academic vocabulary. Let me explain the key terms."
- **Pronunciation Help** — AI Tutor can read transcript phrases aloud with slow pronunciation

### Components Needed

- ExerciseCard (skill card variant)
- AudioPlayer (with waveform, speed control, skip buttons)
- TranscriptView (synchronized, searchable, clickable timestamps)
- TimestampedNote
- QuestionRenderer (multiple-choice, gap-fill, true-false, short-answer, multiple-answer, table-completion)
- TableCompletionGrid (mobile-responsive table input)

### Data Displayed

- `ListeningExercise[]` — available exercises
- `ListeningPracticeSession` — current/past session data
- Audio source URL, type, duration
- Transcript with timestamp segments
- Question types with audio section references

### Accessibility Notes

- Audio player must support keyboard controls (Space = play/pause, arrows = skip)
- Transcript must be available as text (not only synchronized playback)
- Audio alerts must have visual alternatives (aria-live for "question time" cues)
- Captions for any audio instructions
- Volume control must be keyboard accessible

### Design Notes

- Audio player should look like a modern podcast player, not browser default controls
- Waveform visualization should be soft gradient (blue to purple), pulsing gently during playback
- Transcript should feel like reading along with an audiobook — current sentence highlighted in a soft color
- Questions should feel contextual — show the relevant transcript section above each question
- Table completion should expand to full screen on mobile with large input cells
- The note-taking experience should feel like a real IELTS exam — paper-like texture, pen-like icons

---

## 3. Writing Practice

### Page Purpose

The Writing Practice page provides timed essay writing with AI-powered band score estimation, detailed feedback across all four IELTS writing criteria, and improved version suggestions. Users practice both Task 1 (graphs/charts/letters) and Task 2 (essay) writing with structured feedback.

### User Goal

Users should feel:

- **Confident** — Every essay receives detailed AI feedback with band estimation
- **Improving** — Feedback shows progress across Task Response, Coherence, Vocabulary, and Grammar
- **Guided** — AI Tutor provides rewrite suggestions and common mistake corrections
- **Tracked** — Writing history shows estimated band progression over time

### Current UX/UI Problems

1. **Feedback panel is crowded** — The `FeedbackPanel` (`apps/web/src/features/writing/components/FeedbackPanel.tsx`) displays all 4 criteria, overall band, mistakes, and improved version in a single scrollable panel without visual hierarchy.

2. **Band score display is weak** — The current circular band display is a CSS circle with text inside. No visual indicator of "good band vs target band", no IELTS band scale visualization.

3. **No Task 1 / Task 2 visual distinction** — Task type is shown as a badge only. The writing experience does not differentiate between analyzing a chart (Task 1) and writing an essay (Task 2).

4. **No writing timer strategy** — Timer is a simple countdown. No suggested time breakdown (e.g., 5min plan → 30min write → 5min review).

5. **Draft save is manual** — Users must click "Save Draft" explicitly. No auto-save as the user types.

6. **No prompt image/chart display** — For Task 1, the prompt does not include chart/graph/diagram images. Users see only text descriptions.

7. **AI feedback takes too long** — The `checkWriting()` API call processes the full essay text. No loading progress indicator shows what the AI is analyzing.

### Proposed Layout

```
+-----------------------------------------------+
| Header (title, filters, stats summary)        |
+-----------------------------------------------+
|                                                |
|  Browse View                                   |
|  +-----------+ +-----------+ +-----------+    |
|  | Prompt    | | Prompt    | | Recent    |    |
|  | Card      | | Card      | | Sessions  |    |
|  +-----------+ +-----------+ +-----------+    |
|                                                |
|  — OR —                                         |
|                                                |
|  Writing View (active session)                 |
|  +---------------------------+----------------+
|  | Prompt Panel              | Writing Area   |
|  | Task type, topic,         | Timer          |
|  | question text,            | Word count     |
|  | chart image (Task 1)      | Textarea       |
|  | Time suggestion           | Auto-save      |
|  +---------------------------+----------------+
|  | Bottom: Save Draft | Get AI Feedback      |
|  +-------------------------------------------+
|                                                |
|  — OR —                                         |
|                                                |
|  Results View                                   |
|  +-------------------------------------------+|
|  | Band Score (circular, with target         ||
|  | comparison to IELTS band scale)           ||
|  +-------------------------------------------+|
|  | 4 Criterion Cards (Task Response,         ||
|  | Coherence, Vocabulary, Grammar)           ||
|  +-------------------------------------------+|
|  | Mistakes with corrections                 ||
|  | Improved Version with diff highlighting   ||
|  +-------------------------------------------+|
+------------------------------------------------+
```

### Main Sections

| Section | Description |
|---------|-------------|
| Header | Title + description + stats (total essays, avg band, writing time, words written) |
| Prompt Browser | Grid of prompt cards with task type badge, topic, difficulty, description; "Custom Prompt" card |
| Writing View | Task prompt panel + large textarea for essay writing |
| Timer | Visual countdown with suggested time phase breakdown (Plan/Write/Review) |
| Word Counter | Live word count with minimum word warning |
| Results: Band Score | Large circular band display with target band comparison indicator |
| Results: 4 Criteria | Score cards for Task Response, Coherence, Vocabulary, Grammar with color-coded score dots and personalized feedback text |
| Results: Mistakes | Categorized mistake list (Grammar, Vocabulary, Coherence, Task Response) with corrections and explanations |
| Results: Improved Version | Full improved version with green diff highlighting showing what changed |

### Primary Actions

- Start Practice — Begin a writing prompt
- Get AI Feedback — Submit essay for AI analysis (primary CTA)
- Save & Finish Later — Save draft without submitting
- Revise & Try Again — Rewrite based on AI feedback

### Secondary Actions

- Custom Prompt — Write your own question
- Save Draft (manual) — Force save current draft
- View History — Browse past writing sessions
- Save Mistake — Add specific mistakes to mistake notebook
- Copy AI Feedback — Export feedback text
- Start Over — Discard current writing and restart

### Empty State

**Before any prompts exist:**
- Illustration of a person writing in a notebook
- Title: "No writing prompts yet"
- Description: "Start with sample prompts or write about any topic"
- Action: "Browse Sample Prompts" button (primary)
- Action: "Custom Prompt" button (secondary)

### Loading State

- Skeleton prompt cards in browser
- Skeleton writing view: prompt panel skeleton + textarea skeleton + timer skeleton
- **AI Feedback loading:** Animated band meter that fills gradually; text that says "Analyzing Task Response...", "Evaluating Coherence..." etc. as sequential steps

### Error State

- Error illustration with crumpled paper
- Title: "Failed to save your essay"
- Description: Error message text
- Action: "Retry" button
- Action: "Copy to Clipboard" (preserve work before retry)

### Mobile Layout

- **Browse:** Single column prompt cards
- **Writing:** Prompt panel collapses to a header row; textarea takes full height; timer and word count in a floating bottom bar
- **Results:** Band score at top; criterion cards stack vertically; mistakes as expandable cards; improved version as collapsible section

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Prompt as header; full-height textarea; floating bottom bar with timer/word count |
| 768–1024px | Side-by-side prompt + textarea; criteria 2x2 grid |
| > 1024px | Full side-by-side; criteria 4 in a row; mistakes 2-column |

### AI Tutor Integration

- **Get AI Feedback** — Primary integration: full essay analysis with band estimation
- **Explain Criterion** — Tap any criterion score → AI Tutor explains why that score was given and how to improve
- **Rewrite Selection** — Select text in essay → "Rewrite with AI Tutor" to get an improved version
- **Grammar Help** — Select a sentence → "Check Grammar" opens AI Tutor with grammar correction
- **Vocabulary Enhancement** — Select a word → "Suggest Synonyms" shows IELTS-level alternatives
- **Post-Feedback Chat** — "Ask AI Tutor a follow-up question about this feedback" button at bottom of results

### Components Needed

- PromptCard (with task type badge, chart image placeholder)
- WritingTimer (with phase breakdown: Plan / Write / Review)
- WordCounter (with warning threshold)
- BandScoreCircle (with target comparison)
- CriterionCard (score dot + feedback text)
- MistakeCard (categorized with correction)
- DiffTextView (green highlight for improved version)
- AutoSaveIndicator (shows last saved time)

### Data Displayed

- `WritingPrompt[]` — available prompts
- `WritingSession` — current/past session with essay text, word count, time
- `WritingFeedback` — band score, 4 criterion scores, overall feedback, improved version, mistakes
- Aggregate stats: total essays, avg band, writing time, words written

### Accessibility Notes

- Textarea must be a standard `<textarea>` with proper `aria-label`
- Timer must announce at 5-minute and 1-minute remaining via `aria-live`
- Band score chart must have `aria-valuenow` / `aria-valuemin` / `aria-valuemax`
- Feedback must use semantic headings for criterion labels
- "Get AI Feedback" button must be disabled during loading with `aria-busy`

### Design Notes

- Writing view should feel like a focused writing tool — minimal distractions, clean paper-like textarea
- Timer should suggest phases visually: a segmented ring showing Plan / Write / Review time allocation
- Band score circle should glow relative to score — warm amber for low, soft green for high
- Feedback cards should feel like teacher comments in a margin — handwritten-style icons, quote highlights from the essay
- The improved version should be presented as a "polished version" (suggested rewrite), not a "correction"
- Chart images for Task 1 should be shown in a lightbox that expands on tap

---

## 4. Speaking Practice

### Page Purpose

The Speaking Practice page provides structured IELTS speaking practice across all three parts: Part 1 (Introduction/Interview), Part 2 (Long Turn / Cue Card), Part 3 (Discussion). Users can record audio responses, take notes, self-evaluate, and receive AI feedback.

### User Goal

Users should feel:

- **Practiced** — All three speaking parts are covered with realistic questions
- **Evaluated** — Self-evaluation + AI feedback together give a complete picture
- **Confident** — Repeated practice builds fluency and reduces anxiety
- **Tracked** — Speaking history shows improvement in fluency, vocabulary, grammar, pronunciation

### Current UX/UI Problems

1. **Massive component** — `SpeakingPractice` (`apps/web/src/features/speaking/SpeakingPractice.tsx`) is 1590 lines with inline state for browse, practice, results, history. Near-impossible to maintain or redesign.

2. **Two-column practice view is cramped** — The 2-column layout (left: question/timer/recording, right: self-evaluation/AI feedback) becomes unusable on screens < 1200px.

3. **Self-evaluation sliders are confusing** — Six sliders with 1–10 scale have no label descriptions. Users do not know what "fluency at 7" means or how to evaluate themselves.

4. **Recording UX is fragile** — MediaRecorder + Web Speech API combination has inconsistent browser support. Users see a recording button but no feedback if their browser doesn't support it.

5. **AI feedback feels disconnected** — "Get AI Feedback" button triggers separate analysis. Results appear in a panel below the practice area. No conversation, no follow-up chat.

6. **Cue card timer is stressful** — A round SVG progress timer counts down 1 minute for Part 2 preparation. The circular design is visually distracting during high-pressure thinking time.

7. **No speaking phrases library integration** — A "Speaking Phrases" modal exists (`COMMON_PHRASES`) but it is a separate popup. Users must leave the practice flow to access it.

8. **Part 2 cue card is just text** — The cue card renders as plain text instructions. No visual cue card design that resembles the real IELTS test.

### Proposed Layout

```
+-----------------------------------------------+
| Header (title, filters, stats summary)        |
+-----------------------------------------------+
|                                                |
|  Browse View                                   |
|  +-----------+ +-----------+ +-----------+    |
|  | Question  | | Question  | | Question  |    |
|  | Card      | | Card      | | Card      |    |
|  +-----------+ +-----------+ +-----------+    |
|                                                |
|  — OR —                                         |
|                                                |
|  Practice View (active session)                |
|  +-------------------------------------------+|
|  | Top Bar: Part badge, timer, tips          ||
|  +-------------------------------------------+|
|  | +-------------------+ +------------------+||
|  | | Question/Cue     | | Self-Evaluation  |||
|  | | Card Display      | | (compact sliders)|||
|  | |                   | |                  |||
|  | | Recording Panel   | | AI Feedback      |||
|  | | (record/stop,     | | Panel            |||
|  | |  audio waveform,  | |                  |||
|  | |  duration)        | | Speaking Notes   |||
|  | |                   | | (textarea)       |||
|  | +-------------------+ +------------------+||
|  +-------------------------------------------+|
|  | Bottom: Save & Finish | Get AI Feedback   ||
|  +-------------------------------------------+|
|                                                |
|  — OR —                                         |
|                                                |
|  Results View                                   |
|  | Self-evaluation scores + AI scores          |
|  | Score comparison (self vs AI)               |
|  | AI feedback per criterion                   |
|  | Better expressions and improved answer      |
+------------------------------------------------+
```

### Main Sections

| Section | Description |
|---------|-------------|
| Header | Title + description + stats (total sessions, avg self-rating, speaking time, parts practiced) |
| Question Browser | Grid of cards with part badge (Part 1/2/3), topic, question text, cue card indicator, follow-up count |
| Practice Top Bar | Part number + topic, timer mode selector (stopwatch / countdown), speaking tip of the moment |
| Question Display | Full question text for Part 1/3; authentic cue card design for Part 2 with bullet prompts and preparation time indicator |
| Recording Panel | Record button, waveform visualization during recording, duration counter, playback of recorded audio, speech-to-text transcription |
| Self-Evaluation | Compact 6-criterion sliders with descriptive labels (e.g., "How smooth was your speech?" for fluency); each slider shows score + short description |
| AI Feedback Panel | Scores per criterion (fluency, vocabulary, grammar, pronunciation, coherence, task achievement); click to expand detailed notes |
| Speaking Notes | Textarea for answer notes; 6 structured fields per criterion (fluency notes, vocabulary used, grammar notes, pronunciation notes, better expressions, improved answer) |
| Results Comparison | Self-evaluation scores vs AI scores shown side by side with gap visualization |
| Results Detail | Detailed AI feedback per criterion, categorized mistakes, suggested better expressions, improved full answer |

### Primary Actions

- Start Practice — Begin a speaking question
- Record / Stop Recording — Audio recording toggle
- Get AI Feedback — Submit answer notes/transcript for AI analysis
- Save & Finish — Complete session and save

### Secondary Actions

- Custom Practice — Enter your own question
- Speaking Phrases — Open common phrases library (by part)
- Change Timer Mode — Switch between stopwatch (Part 1/3) and countdown (Part 2 prep)
- Play Recording — Listen to your recorded answer
- View Transcript — See speech-to-text output
- View History — Browse past speaking sessions
- Save to Mistake Notebook — Add speaking mistakes

### Empty State

**Before any questions exist:**
- Illustration of a person speaking with a speech bubble
- Title: "No speaking questions yet"
- Description: "Start with sample questions or practice with AI Tutor as your speaking partner"
- Action: "Browse Sample Questions" button (primary)
- Action: "Practice with AI Speaking Partner" button (secondary)

### Loading State

- Skeleton question cards in browser
- Skeleton practice view: question skeleton + recording panel skeleton + evaluation skeleton
- **AI Feedback loading:** Animated speaking score card that fills progressively with per-criterion evaluation

### Error State

- Error illustration with muted microphone
- Title: "Microphone access required"
- Description: "Speaking practice needs microphone access. Please allow microphone permissions in your browser settings."
- Action: "Check Microphone Settings" button
- Action: "Practice with Text Only" button (fallback — type answer notes instead)

### Mobile Layout

- **Browse:** Single column cards; Part badge prominently top-left
- **Practice:** Full-screen question display; recording panel fixed at bottom; self-evaluation as bottom sheet after recording
- **Recording:** Large button in center of screen; waveform shows above; timer in header
- **Results:** Scores stack vertically; comparison as toggle between "Your self-evaluation" and "AI evaluation"

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column; recording panel fixed bottom; evaluation as sheet |
| 768–1024px | 2-column: left question + recording, right evaluation |
| > 1024px | Full 2-column with AI feedback panel always visible |

### AI Tutor Integration

- **Get AI Speaking Feedback** — Primary integration: analyze answer notes/transcript for fluency, vocabulary, grammar, pronunciation, coherence, task achievement
- **AI Speaking Partner** — "Practice with AI" button launches the AI Tutor in `speaking-partner` mode where the AI conducts a realistic IELTS speaking test
- **Phrase Suggestions** — AI Tutor suggests IELTS-level phrases based on the question topic
- **Pronunciation Tips** — After analysis, AI Tutor offers pronunciation tips for specific words the user mispronounced
- **Model Answer** — "Show me a Band 9 answer" sends question to AI Tutor for an example high-scoring response

### Components Needed

- SpeakingQuestionCard (with part badge, cue card indicator)
- CueCardDisplay (authentic IELTS-style cue card with bullet points)
- RecordingButton (large, with states: idle/recording/stopped/error)
- AudioWaveform (animated during recording)
- SpeechToTextDisplay (showing live transcription)
- SelfEvaluationSliders (6 criteria with labels + descriptions)
- ScoreComparisonChart (self vs AI per criterion)
- SpeakingPhrasesLibrary (searchable, filterable by part)

### Data Displayed

- `SpeakingQuestion[]` — available questions per part
- `SpeakingSession` — current/past session with answer notes, recording, self-evaluation
- `EvaluationResult` — self-evaluation scores (fluency, vocabulary, grammar, pronunciation, coherence, taskAchievement)
- AI feedback scores + detailed notes per criterion
- Aggregate stats: total sessions, avg rating, speaking time, parts practiced

### Accessibility Notes

- Recording button must announce state changes: "Recording started", "Recording stopped" via `aria-live`
- Timer must be visible AND audible (optional beep at final 10 seconds)
- Cue card must be proper HTML (not an image) with heading for prompts
- All evaluation sliders must have `aria-label` and `aria-valuetext` describing the score meaning
- Speech-to-text output must be accessible as written text, not only audio
- Keyboard: Space to toggle recording, Tab through evaluation sliders

### Design Notes

- The recording panel should feel safe and comfortable — round soft button (not ominous red), gentle pulse animation when recording
- Cue card should look like a real IELTS cue card: white card on soft background, bullet points, "You should say:" heading
- Timer for Part 2 (1 min prep) should be a linear progress bar (less stressful than circular), turning amber at 30s, orange at 10s
- Self-evaluation should feel like a friendly check-in, not a test — use emoji or icon + short label per criterion
- Practice view should feel like a coaching session with a tutor sitting across from you
- The common phrases library should be accessible as a slide-in drawer, not a modal

---

## 5. Grammar Practice

### Page Purpose

The Grammar Practice page provides comprehensive IELTS grammar learning with topic-based notes, interactive exercises, and mistake tracking. Users learn grammar rules, practice with exercises, and track their weak areas over time.

### User Goal

Users should feel:

- **Structured** — Grammar topics are organized by IELTS relevance, not textbook order
- **Practiced** — Every topic has exercises with explanations for correct and incorrect answers
- **Improving** — Weak areas are identified and prioritized
- **Connected** — Grammar learning is linked to Writing and Speaking performance

### Current UX/UI Problems

1. **Grammar route uses simpler page** — The route `/grammar` loads `GrammarNotes.tsx` (simple page), while the full-featured `GrammarLearning.tsx` component exists but is not the main route.

2. **No progression structure** — Topics are flatly organized. Users do not know which grammar topics they should study before others, or which are most important for IELTS.

3. **Exercise feedback is minimal** — The `Exercise` component shows correct/incorrect per question but no explanation for why an answer is wrong or how to avoid the same mistake.

4. **No IELTS skill linking** — Grammar topics are not linked to specific IELTS skills. Users don't know that "Conditional Sentences" affects Writing Task 2 score or that "Prepositions of Place" appears in Listening Section 1.

5. **Weak area tracking is passive** — Correct/incorrect answers are tracked in the database, but the UI does not proactively surface weak topics or recommend review.

6. **Exercise generation is not contextual** — AI generates exercises for a topic but does not base them on the user's specific mistakes or weak patterns.

### Proposed Layout

```
+-----------------------------------------------+
| Header (title, search, filter)               |
+-----------------------------------------------+
| Tab: Topics | Tab: Exercises | Tab: Weaknesses |
+-----------------------------------------------+
|                                                |
|  Topics View                                   |
|  +-----------+ +-----------+ +-----------+    |
|  | Topic     | | Topic     | | Topic     |    |
|  | Card      | | Card      | | Card      |    |
|  +-----------+ +-----------+ +-----------+    |
|  (Filterable by skill, status)                |
|                                                |
|  — OR —                                         |
|                                                |
|  Exercises View                                |
|  +-------------------------------------------+|
|  | Topic selector dropdown                   ||
|  | Start Exercise button                     ||
|  | AI Generate button                        ||
|  +-------------------------------------------+|
|  | — OR — Active exercise:                   ||
|  | Progress bar (3/10 answered)              ||
|  | Question card                             ||
|  | Answer options / input                    ||
|  | Check Answer → Correct/Incorrect + Exp    ||
|  | Next / Finish                             ||
|  +-------------------------------------------+|
|                                                |
|  — OR —                                         |
|                                                |
|  Weaknesses View                               |
|  | List of weak grammar topics sorted by       |
|  | mistake frequency                           |
|  | Each topic card shows: topic name,          |
|  | mistakes count, "Practice" button,          |
|  | "View Notes" button                         |
+------------------------------------------------+
```

### Main Sections

| Section | Description |
|---------|-------------|
| Header | Title + description + stats (topics total, mastered, reviewing, weak) |
| Tab Bar | 3 tabs: Topics | Exercises | Weaknesses |
| Topics View | Grid of grammar topic cards with status badge (weak/reviewing/mastered), skill link badge, explanation preview, exercise count, mistake count; inline status change buttons |
| Topics Filter | Filter by status (all/weak/reviewing/mastered), filter by skill (writing/speaking/reading/listening), sort by date/topic/status |
| Topic Detail Panel | Slide-in panel showing full explanation, example sentences, common mistakes with corrected versions, personal notes, related skill, start exercise button |
| Exercises View | Topic selector (dropdown), "Start Exercise" and "AI Generate" buttons; active exercise card with progress bar, question, answer options, check button, correct/incorrect feedback with explanation |
| Exercise Complete | Score summary, percentage, mistakes count, "Review Mistakes" button, "Next Topic" button |
| Weaknesses View | Ranked list of grammar topics by mistake frequency; each card shows topic, mistake count, last practiced date, "Practice Now" and "Review Notes" buttons |

### Primary Actions

- Start Exercise — Begin an exercise for a selected topic
- Check Answer — Submit answer and see correct/incorrect with explanation
- Mark Resolved — Mark a mistake as resolved (from weaknesses view)
- Change Topic Status — Update topic to weak/reviewing/mastered

### Secondary Actions

- AI Generate Exercises — Create new exercises for a topic via AI
- Add Grammar Note — Create a personal grammar note with explanation and examples
- Edit Grammar Note — Modify existing notes
- View Most Mistaken Topics — Quick access to weaknesses
- Practice Weak Topic — Start exercises for the weakest areas
- View Notes — Read full grammar explanation for a topic

### Empty State

**Before any grammar topics:**
- Illustration of books and a grammar diagram
- Title: "No grammar topics yet"
- Description: "Add grammar notes or generate exercises with AI"
- Action: "Generate Exercises with AI" button (primary)
- Action: "Add Your First Grammar Note" button (secondary)

**No weak areas (all topics mastered):**
- Title: "No weak areas!"
- Description: "You've mastered all grammar topics. Great job!"
- Action: "Review All Topics" button (maintain progress)

### Loading State

- Skeleton topic cards (6 skeleton cards with shimmer + status badge placeholder)
- Skeleton exercise: progress bar skeleton + question skeleton + 4 option skeletons
- Skeleton weaknesses: 3 ranked list skeletons with count badges

### Error State

- Error illustration with confused grammar book
- Title: "Failed to load grammar topics"
- Description: Error message
- Action: "Retry" button

### Mobile Layout

- **Topics:** Single column cards with compact status badge; filter as horizontal scroll chips
- **Topic Detail:** Full-screen slide-in panel
- **Exercises:** Full-screen exercise card; question at top, options in middle, check button fixed bottom
- **Weaknesses:** Single column ranked list

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column; tabs as sticky top bar; exercises full-screen |
| 768–1024px | 2-column topic grid; exercise side panel |
| > 1024px | 3-column topic grid; side panel for detail |

### AI Tutor Integration

- **Explain Answer** — After an incorrect answer, "Explain with AI Tutor" button sends the question + user answer for a detailed explanation
- **Generate More Exercises** — AI generates additional practice questions focusing on the user's specific weak areas
- **Grammar in Context** — "Show me this grammar rule in an IELTS Writing example" sends rule to AI Tutor for contextual demonstration
- **Personalized Weak Analysis** — AI Tutor reviews mistake patterns: "You keep confusing present perfect and past simple. Here's a trick to remember the difference."

### Components Needed

- GrammarTopicCard (with status badge, skill link, stats)
- StatusBadge (weak/reviewing/mastered with colors)
- GrammarExerciseQuestion (multiple-choice, gap-fill, true-false, error-correction)
- AnswerFeedback (correct/incorrect indicator + explanation)
- ExerciseProgressBar
- WeaknessRankedList
- GrammarNoteEditor (with topic, explanation, examples, mistakes, personal note fields)
- SkillLinkBadge (writing/speaking/reading/listening)

### Data Displayed

- `GrammarNote[]` — all topics with explanations, examples, mistakes
- `GrammarExerciseItem[]` — exercises per topic
- Exercise statistics: questions answered, correct/incorrect, recent sessions
- Weak areas: topics sorted by mistake frequency
- Status counts: total, mastered, reviewing, weak

### Accessibility Notes

- Tabs must use `role="tablist"` with `aria-controls` and `aria-selected`
- Exercise answer options must use `<fieldset>` and `<legend>`
- Correct/incorrect feedback must be announced via `aria-live="polite"`
- Status changes (weak → reviewing → mastered) must use clear visual AND textual indicators
- Grammar explanation content must use proper heading hierarchy (`h2` for topic name, `h3` for sections)

### Design Notes

- Topic cards should feel like lesson cards — soft colors, clean typography, clear status indicators
- Status badges should be distinct: red for weak, amber for reviewing, green for mastered (with a checkmark)
- Exercise flow should feel like a quiz game — satisfying animation for correct answers, helpful feedback for incorrect
- The Weaknesses view should feel encouraging, not shameful — frame as "Focus areas for improvement" not "Your mistakes"
- Grammar notes should feel like personal study cards — clean layout, example sentences highlighted, tips in callout boxes
- Each topic card should display an IELTS skill link icon (e.g., a pen icon for Writing, a speech icon for Speaking)

---

## 6. Vocabulary Practice

### Page Purpose

The Vocabulary Practice page provides active vocabulary learning through spaced repetition review, word exploration, and contextual usage practice. This is distinct from the Vocabulary Notebook (browsing/management page) — this page is for active study and practice.

### User Goal

Users should feel:

- **Active** — Vocabulary is practiced through recall, not just reading
- **Retained** — Spaced repetition ensures words move to long-term memory
- **Contextual** — Words are practiced in IELTS contexts, not isolation
- **Tracked** — Retention rate, words learned per week, and difficulty patterns are visible

### Current UX/UI Problems

1. **Practice is embedded in Vocabulary page** — The current `Vocabulary.tsx` has a "Review" tab that mixes browsing and practice. No dedicated practice/practice page exists at a separate route.

2. **Review modes are limited** — The `ReviewMode` component (`apps/web/src/features/vocabulary/components/ReviewMode.tsx`) has 4 modes (word-to-meaning, meaning-to-word, gap-fill, collocation) but they are listed as tabs. Users do not know which mode to use when.

3. **No practice session lifecycle** — Review starts immediately when switching to Review tab. No start screen with session configuration (number of words, modes, difficulty focus).

4. **Review feedback is minimal** — After rating a word (again/hard/good/easy), no explanation is shown. Users don't know why they got a word right or wrong.

5. **No context sentences** — Gap-fill mode shows a sentence with a blank, but there's no IELTS-usage context for the word. Words feel like isolated vocabulary list items.

6. **No image or visual memory aids** — Pure text-only practice. No images, no mnemonics, no visual connections to aid memory.

7. **Progress is not shown** — No session progress bar, no streak, no "words studied today" counter during review.

### Proposed Layout

```
+-----------------------------------------------+
| Header (stats summary, review history)        |
+-----------------------------------------------+
|                                                |
|  Start View (default)                         |
|  +-------------------------------------------+|
|  | Words Due Today: X                        ||
|  | New Words Available: Y                    ||
|  | Mastered Words: Z                         ||
|  +-------------------------------------------+|
|  | Session Configuration                     ||
|  | Modes: Word-Meaning | Meaning-Word |      ||
|  |        Gap-Fill    | Collocation   |      ||
|  | Word Count: 10/20/50/All                  ||
|  | Difficulty: All/Easy/Medium/Hard          ||
|  | Topics: All/Selected                      ||
|  +-------------------------------------------+|
|  | Start Review Button (large)               ||
|  +-------------------------------------------+|
|                                                |
|  — OR —                                         |
|                                                |
|  Active Review View                            |
|  +-------------------------------------------+|
|  | Top Bar: Mode indicator + Progress bar    ||
|  | (3/20) + Correct streak counter           ||
|  +-------------------------------------------+|
|  | +---------------------------------------+ ||
|  | | Flashcard / Question Card             | ||
|  | | Word (or meaning) centered            | ||
|  | | Context sentence below (if gap-fill)  | ||
|  | | Pronunciation button                  | ||
|  | +---------------------------------------+ ||
|  | +---------------------------------------+ ||
|  | | Rating Buttons                        | ||
|  | | Again | Hard | Good | Easy            | ||
|  | +---------------------------------------+ ||
|  | Bottom: Show Answer (toggle)            ||
|  +-------------------------------------------+|
|                                                |
|  — OR —                                         |
|                                                |
|  Session Complete View                         |
|  | Stats: words reviewed, accuracy, time      |
|  | Words to review again (rated again/hard)   |
|  | Words mastered this session                |
|  | AI Tutor recommendation                    |
|  | "Continue Review" / "Finish" buttons       |
+------------------------------------------------+
```

### Main Sections

| Section | Description |
|---------|-------------|
| Header | Title + description + stats (total words, due today, mastered, learning streak) |
| Start View | Words summary (due today, new available, mastered); session configuration panel (mode selection, word count, difficulty filter, topic filter) |
| Review Card | Large flashcard-style display with the word/question; pronunciation button; context sentence; part of speech badge |
| Rating Buttons | 4 spaced-repetition buttons: Again (red), Hard (orange), Good (blue), Easy (green) with short label descriptions |
| Progress Bar | Shows position in session (e.g., 7/20), correct streak indicator |
| Session Complete | Performance summary, words needing review, mastered words list, AI Tutor tip, Continue / Finish actions |

### Primary Actions

- Start Review — Begin a practice session with configured settings
- Show Answer — Reveal the word/meaning (in word-to-meaning or meaning-to-word modes)
- Rate Word — Again/Hard/Good/Easy to schedule next review
- Continue Review — Start another session after completion

### Secondary Actions

- Play Pronunciation — Hear word pronunciation
- View Word Detail — Open vocabulary detail panel for the current word
- Skip Word — Skip current word (counts as "Again")
- Pause Session — Save session progress and resume later
- Change Mode Mid-Session — Switch between word-to-meaning, meaning-to-word, etc.
- View Full Word List — Browse all words in current session

### Empty State

**Before any vocabulary exists:**
- Illustration of a person collecting words in a net
- Title: "Your vocabulary is empty"
- Description: "Add words to your Vocabulary Notebook to start practicing"
- Action: "Go to Vocabulary Notebook" button (primary)

**No words due for review:**
- Title: "All caught up!"
- Description: "You've reviewed all words. Check back later or study new words."
- Action: "Study New Words" button (primary)
- Action: "Add More Words" button (secondary)

### Loading State

- Skeleton stat cards (3 skeleton cards)
- Skeleton flashcard (large rectangle with shimmer, 2 icon circles for rating buttons)
- Skeleton progress bar

### Error State

- Error illustration with broken link
- Title: "Failed to load vocabulary"
- Description: Error message
- Action: "Retry" button
- Action: "Go to Vocabulary Notebook" button (alternative route)

### Mobile Layout

- **Start View:** Single column; configuration as expandable sections
- **Review:** Full-screen flashcard; word takes top 60% of screen; rating buttons large (touch-friendly) at bottom
- **Rating Buttons:** 4 large tappable buttons (min 48px height) with labels
- **Session Complete:** Single column stat cards

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Full-screen flashcard; rating buttons fixed at bottom; progress bar in header |
| 768–1024px | Centered medium flashcard (max-width 500px); side panels for word list |
| > 1024px | Centered flashcard with word detail panel on right side |

### AI Tutor Integration

- **Explain Word** — "Ask AI Tutor about this word" sends word for detailed explanation: meaning, IELTS usage, collocations, synonyms, word family
- **Context Sentences** — "Show me IELTS examples" generates 3 example sentences at different band levels
- **Memory Trick** — "Give me a mnemonic" asks AI Tutor for a memory aid for the word
- **Related Words** — "Find related words" shows synonyms, antonyms, and words from the same IELTS topic
- After session, AI Tutor recommends: "You struggled with environment vocabulary. Here are 5 more words you should learn."

### Components Needed

- FlashCard (large centered card with animation for flip/reveal)
- RatingButtonSet (4 buttons with colors and labels)
- SessionConfigPanel (mode selector, count selector, filter selectors)
- ReviewProgressBar
- CorrectStreakCounter
- PronunciationButton
- WordDetailPreview (compact version of vocabulary detail panel)
- SessionSummaryCard

### Data Displayed

- `VocabularyEntry[]` — words available for review
- Spaced repetition schedule (due words, intervals)
- Session progress (current index, total count, correct streak)
- Word detail: word, meaning, pronunciation, part of speech, example, topic, difficulty
- Session summary: words reviewed, accuracy, time, words needing review

### Accessibility Notes

- Flashcard content must be readable text (not an image of text)
- Rating buttons must have `aria-label` describing what each rating means (e.g., "Again — I don't remember this word")
- "Show Answer" button must announce the revealed content via `aria-live`
- Progress must be announced: "Question 3 of 20" via `aria-live="polite"`
- Correct streak counter must be visible and announced
- Keyboard: Space to show answer, 1-4 for rating buttons

### Design Notes

- The flashcard should feel satisfying to use — subtle flip animation when revealing the answer, smooth transitions between cards
- Rating buttons should be large, clearly colored, with emoji + text label for clarity:
  - Again 😓: "Don't remember" (red)
  - Hard 🤔: "Difficult" (orange)
  - Good 😊: "Got it" (blue)
  - Easy 🎯: "Knew it" (green)
- The session should feel like a game — streak count with a small fire emoji, progress ring filling up
- Background should be calm and distraction-free (solid color or very subtle gradient)
- Session complete view should feel celebratory — confetti or sparkle animation for good sessions, encouraging message for tough sessions
- Configuration should feel like setting up a study session with a tutor, not filling a form

---

## Shared Design Elements Across All Practice Pages

### Common Layout Pattern

All practice pages follow the same structural pattern:

1. **Browse state** — Grid/card view of available items with search and filter
2. **Active practice state** — Focused view for the specific practice activity
3. **Results state** — Score, review, mistakes, and recommendations
4. **History state** — Past sessions with stats and detail review

### Common Components

| Component | Usage Across Pages |
|-----------|-------------------|
| **SkillCard** | Used in browse views for passage/exercise/prompt/question cards |
| **Timer** | Present in Reading, Listening, Writing, Speaking with configurable modes |
| **ProgressBar** | Used in all active practice states for session progress |
| **QuestionRenderer** | Different variant per practice type, but consistent interaction pattern |
| **StatCard** | Used in results and history for score/accuracy/time display |
| **MistakeCard** | Used in results to categorize and explain mistakes |
| **AIExplainButton** | Contextual AI Tutor access on each page |
| **EmptyState** | Consistent illustration + message + action pattern |
| **LoadingSkeleton** | Consistent shimmer animation pattern |

### Common AI Tutor Integration Points

| Integration Point | Description |
|---|---|
| **Explain Question/Content** | Contextual button that sends specific content to AI Tutor |
| **Post-Session Insights** | After results, AI Tutor offers personalized recommendations |
| **Save Vocabulary** | Select any text → "Save to Vocabulary Notebook" via AI suggestion |
| **Difficult Content Handling** | Low accuracy triggers AI Tutor offer for review/explanation |
| **Proactive Recommendations** | AI Tutor suggests what to practice next based on weak areas |

### Common Data Flow

```
Browse View → Select Item → Practice View → Submit → Results View
                           ↓                                    |
                     Save Progress ←→ History View ←─────────────┘
                           ↓
              Mistake Notebook / Vocabulary / AI Tutor
```

### Common Empty State Pattern

```
┌──────────────────────────────┐
│                              │
│    [Relevant Illustration]    │
│                              │
│     Title: Friendly message   │
│  Description: Helpful text   │
│                              │
│  [Primary Action Button]     │
│  [Secondary Action Button]   │
│                              │
└──────────────────────────────┘
```

### Common Loading State Pattern

```
┌──────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │██████│ │██████│ │██████│ │
│ │██████│ │██████│ │██████│ │
│ │██░░██│ │██░░██│ │██░░██│ │
│ └──────┘ └──────┘ └──────┘ │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ━━━━━━━ ═══ ═══ ═══ ━━━  │
└──────────────────────────────┘
```

### Common Error State Pattern

```
┌──────────────────────────────┐
│                              │
│    [Error Illustration]      │
│                              │
│     Title: What went wrong   │
│  Description: Specific error │
│                              │
│  [Retry Button]              │
│  [Alternative Action Button] │
│                              │
└──────────────────────────────┘
```

### Mobile Navigation from Practice Pages

- **Bottom nav** shows: Dashboard | Today | AI Tutor | Vocabulary | Progress
- Practice pages are accessed from the Dashboard (study plan task cards), Today view, or quick actions
- Back button in header returns to the calling page (Dashboard or Browse)
- AI Tutor shortcut (floating button) is always accessible, even during active practice

### Design Notes Summary

- All practice pages should use the same visual language: soft rounded cards, subtle shadows, clean typography
- Skill-specific colors should be used for badges, progress indicators, and icons to distinguish practice types at a glance (Reading = blue, Listening = purple, Writing = green, Speaking = orange, Grammar = pink, Vocabulary = teal)
- The active practice experience should feel focused and distraction-free — no sidebars, no unrelated content, full attention on the task
- Results and feedback should always feel constructive, not judgmental — frame as "growth opportunities" not "mistakes"
- Mobile experience should be equally powerful, not a downgraded desktop view
- AI Tutor should feel present but not intrusive — contextual buttons that make sense at the moment
- Save, bookmark, and revisit should be one tap away — every practice session is a learning artifact

---

## Validation

- File: `docs/design/pages/practice-pages-spec.md`
- Covers all 6 practice types with objective, time, instructions, actions, AI help, result/feedback/mistake/vocab states
- Design notes consistent with overall redesign direction (soft, clean, modern, motivating, mobile-first)
- References current codebase patterns and proposes improvements based on real analysis
