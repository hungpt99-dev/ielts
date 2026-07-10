# Database Schema

> Complete reference for the IndexedDB schema, object stores, indexes, and data models used in the IELTS Journey.

---

## 1. Overview

The application uses a single IndexedDB database `ielts-journey` with 27 object stores (tables). The database is accessed through Dexie (a minimal IndexedDB wrapper) with the repository pattern.

**Database name:** `ielts-journey`
**Current version:** 4
**Package:** `packages/storage/src/`

### 1.1 Schema Version History

| Version | Changes |
|---------|---------|
| 1 | Initial schema (12 stores: vocabulary, tasks, sessions, mistakes, etc.) |
| 2 | Added 13 stores (extended content types, progress records) |
| 3 | Added `publicApiContent` store |
| 4 | Added `contentMeta` and `userContentEdits` stores |

Migrations are defined in `packages/storage/src/migrations.ts`. The `upgrade` callback in Dexie handles:
- Creating new object stores
- Adding/removing indexes
- Transforming existing data between versions

---

## 2. Entity Relationship Diagram

```
vocabulary ──1:1──→ vocabularyReviews
vocabulary ──M:N──→ passages (via highlightedWords)
vocabulary ──M:N──→ readingSessions (via newVocabulary)
vocabulary ──M:N──→ listeningSessions (via newVocabulary)

tasks ── standalone, no FK relationships

All journal entries (reading, listening, writing, speaking)
are standalone documents with optional string[] references
to vocabulary IDs.

topicsProgress ── aggregated view, refreshed on writes

contentMeta ── references built-in content by ID
userContentEdits ── references built-in content by originalId
```

---

## 3. Object Stores

### 3.1 `vocabulary`

Stores vocabulary words added by the user.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `word` | `string` | Yes | The vocabulary word |
| `meaning` | `string` | | Definition in English |
| `meaningVi` | `string` | | Vietnamese translation |
| `pronunciation` | `string` | | IPA or phonetic |
| `partOfSpeech` | `string` | Yes | noun, verb, adjective, etc. |
| `topic` | `string` | Yes | IELTS topic category |
| `exampleSentence` | `string` | | Usage example |
| `collocations` | `string[]` | | Common collocations |
| `synonyms` | `string[]` | | Synonym list |
| `antonyms` | `string[]` | | Antonym list |
| `wordFamily` | `string[]` | | Related word forms |
| `personalNote` | `string` | | User's note |
| `difficulty` | `'easy'|'medium'|'hard'` | Yes | Difficulty level |
| `status` | `'new'|'learning'|'reviewing'|'mastered'` | Yes | Learning status |
| `tags` | `string[]` | | User tags |
| `createdAt` | `string` | | ISO timestamp |
| `updatedAt` | `string` | | ISO timestamp |

### 3.2 `vocabularyReviews`

SM-2 spaced repetition data linked to vocabulary entries.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `vocabularyId` | `string` | Yes | FK → vocabulary.id |
| `interval` | `number` | | Days until next review |
| `easeFactor` | `number` | | SM-2 ease factor (default 2.5) |
| `repetitions` | `number` | | Consecutive correct reviews |
| `nextReviewDate` | `string` | Yes | ISO date due |
| `lastReviewDate` | `string` | | ISO date last reviewed |
| `history` | `Array<{date, rating}>` | | Review history log |

### 3.3 `tasks`

Daily study tasks.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `title` | `string` | | Task title |
| `description` | `string` | | Task description |
| `category` | `TaskCategory` | Yes | e.g., Vocabulary, Reading, etc. |
| `date` | `string` | Yes | ISO date assigned |
| `isDone` | `boolean` | | Completion status |
| `isRecurring` | `boolean` | | Recurring task flag |
| `recurringDays` | `number[]` | | 0=Sun, 1=Mon... |
| `notes` | `string` | | User notes |
| `timeMinutes` | `number` | | Estimated duration |
| `createdAt` | `string` | | ISO timestamp |
| `updatedAt` | `string` | | ISO timestamp |
| `completedAt` | `string` | | ISO timestamp or null |

### 3.4 `readingSessions`

Reading practice session records.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `title` | `string` | | Passage title |
| `topic` | `string` | Yes | IELTS topic |
| `sourceUrl` | `string` | | Original URL |
| `passageText` | `string` | | Full passage text |
| `questionType` | `string` | Yes | Type of questions |
| `totalQuestions` | `number` | | Question count |
| `correctAnswers` | `number` | | Correct count |
| `accuracy` | `number` | | computed: correct/total |
| `timeSpentMinutes` | `number` | | Duration |
| `newVocabulary` | `string[]` | | Related vocab IDs |
| `summary` | `string` | | User summary |
| `mistakes` | `string` | | Notes on mistakes |
| `notes` | `string` | | General notes |
| `createdAt` | `string` | Yes | ISO timestamp |

### 3.5 `listeningSessions`

Listening practice session records.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `title` | `string` | | Audio/video title |
| `sourceUrl` | `string` | | Original URL |
| `topic` | `string` | Yes | IELTS topic |
| `durationMinutes` | `number` | | Duration |
| `section` | `number` | | 1-4 (IELTS sections) |
| `score` | `number` | | Out of 40 |
| `transcriptNotes` | `string` | | Notes on transcript |
| `newVocabulary` | `string[]` | | Related vocab IDs |
| `difficultSentences` | `string` | | Challenging parts |
| `mistakes` | `string` | | Mistake notes |
| `shadowingNotes` | `string` | | Shadowing practice |
| `selfRating` | `number` | | 1-5 self rating |
| `createdAt` | `string` | Yes | ISO timestamp |

### 3.6 `writingSessions`

Writing practice session records.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `taskType` | `'task1'|'task2'` | Yes | IELTS Writing task type |
| `question` | `string` | | Writing prompt |
| `essay` | `string` | | User's essay |
| `topic` | `string` | Yes | Topic |
| `wordCount` | `number` | | Essay word count |
| `timeSpentMinutes` | `number` | | Duration |
| `estimatedBand` | `number` | | Self-estimated band |
| `feedback` | `string` | | Feedback notes |
| `grammarMistakes` | `string` | | Grammar issues |
| `vocabularyMistakes` | `string` | | Vocabulary issues |
| `coherenceNotes` | `string` | | Coherence notes |
| `improvedSentences` | `string` | | Improved versions |
| `betterVersion` | `string` | | AI improvement |
| `personalReflection` | `string` | | Self reflection |
| `createdAt` | `string` | Yes | ISO timestamp |

### 3.7 `speakingSessions`

Speaking practice session records.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `part` | `1|2|3` | Yes | Speaking part |
| `question` | `string` | | Speaking prompt |
| `answerNotes` | `string` | | User's spoken response notes |
| `topic` | `string` | Yes | Topic |
| `durationSeconds` | `number` | | Recording duration |
| `selfRating` | `number` | | 1-5 self rating |
| `fluencyNotes` | `string` | | Fluency observations |
| `vocabularyNotes` | `string` | | Vocab observations |
| `grammarMistakes` | `string` | | Grammar issues noted |
| `pronunciationNotes` | `string` | | Pronunciation notes |
| `betterExpressions` | `string` | | Improved expressions |
| `improvedAnswer` | `string` | | Improved version |
| `createdAt` | `string` | Yes | ISO timestamp |

### 3.8 `grammarNotes`

Grammar topic notes.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `topic` | `string` | Yes | Grammar topic |
| `explanation` | `string` | | Rule explanation |
| `exampleSentences` | `string[]` | | Usage examples |
| `commonMistakes` | `string[]` | | Common errors |
| `correctedExamples` | `string[]` | | Corrected versions |
| `personalNote` | `string` | | User's note |
| `relatedSkill` | `string` | Yes | Related IELTS skill |
| `status` | `'weak'|'reviewing'|'mastered'` | Yes | Mastery status |
| `createdAt` | `string` | | ISO timestamp |
| `updatedAt` | `string` | | ISO timestamp |

### 3.9 `mistakes`

Mistake notebook entries.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `mistake` | `string` | | The mistake text |
| `correction` | `string` | | Corrected version |
| `explanation` | `string` | | Why it was wrong |
| `source` | `string` | | Where it came from |
| `date` | `string` | | ISO date |
| `skill` | `MistakeSkill` | Yes | vocabulary|grammar|reading|listening|writing|speaking |
| `status` | `'new'|'reviewed'|'resolved'` | Yes | Review status |
| `repetitionCount` | `number` | | How many times repeated |
| `createdAt` | `string` | | ISO timestamp |
| `updatedAt` | `string` | | ISO timestamp |

### 3.10 `mockTests`

Mock test band score records.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `date` | `string` | Yes | Test date |
| `listeningScore` | `number` | | Band 0-9 |
| `readingScore` | `number` | | Band 0-9 |
| `writingBand` | `number` | | Band 0-9 |
| `speakingBand` | `number` | | Band 0-9 |
| `overallBand` | `number` | | Computed average |
| `notes` | `string` | | User notes |
| `weakAreas` | `string[]` | | Identified weak areas |
| `improvementPlan` | `string` | | Action plan |
| `createdAt` | `string` | | ISO timestamp |

### 3.11 `topicsProgress`

Per-topic aggregated data, updated on writes to other stores.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | Topic name |
| `topic` | `string` | Yes | Unique topic name |
| `vocabularyCount` | `number` | | Vocab items count |
| `readingCount` | `number` | | Reading sessions count |
| `listeningCount` | `number` | | Listening sessions count |
| `writingCount` | `number` | | Writing sessions count |
| `speakingCount` | `number` | | Speaking sessions count |
| `weakPoints` | `string[]` | | Identified weak points |
| `updatedAt` | `string` | | ISO timestamp |

### 3.12 `passages`

User-created passages for contextual vocabulary learning.

| Field | Type | Indexed | Description |
|-------|------|---------|-------------|
| `id` | `string` | PK | UUID |
| `title` | `string` | | Passage title |
| `content` | `string` | | Passage text |
| `highlightedWords` | `string[]` | | Word IDs or text |
| `source` | `'user-created'|'pasted'` | Yes | Source type |
| `createdAt` | `string` | | ISO timestamp |
| `updatedAt` | `string` | | ISO timestamp |

### 3.13 Additional Stores

Additional object stores for extended content types (v2+):

| Store | Key Path | Description |
|-------|----------|-------------|
| `readingPracticeSessions` | `id` | Detailed reading practice records |
| `listeningPracticeSessions` | `id` | Detailed listening practice records |
| `ieltsTopics` | `id` | IELTS topic definitions |
| `exampleSentences` | `id` | Example sentence entries |
| `readingPassages` | `id` | Extended reading passages |
| `listeningTranscripts` | `id` | Listening transcripts |
| `writingPrompts` | `id` | Writing prompt entries |
| `speakingQuestions` | `id` | Speaking question entries |
| `studyNotes` | `id` | General study notes |
| `usefulPhrases` | `id` | Useful phrase entries |
| `aiContents` | `id` | AI-generated content cache |
| `customStudyPlans` | `id` | User-created study plans |
| `progressRecords` | `id` | Daily progress records |
| `publicApiContent` | `id` | Public API imported content (v3) |
| `contentMeta` | `id` | Content metadata for versioning (v4) |
| `userContentEdits` | `id` | User modifications to built-in content (v4) |

---

## 4. SM-2 Spaced Repetition Algorithm

Used for `vocabularyReviews` scheduling:

```
After rating:
  Again (0) → interval=1, easeFactor=max(1.3, ef-0.2), reps=0
  Hard  (1) → interval=1, easeFactor=max(1.3, ef-0.15), reps+=1
  Good  (2) → interval=next(reps), easeFactor unchanged, reps+=1
  Easy  (3) → interval=next(reps)*1.3, easeFactor=ef+0.15, reps+=1

Next interval:
  reps==1 → 1 day
  reps==2 → 6 days
  reps≥3  → round(interval * easeFactor)

Next review = today + interval days
```

---

## 5. Zod Validation Schemas

Every write to the database is validated against a Zod schema defined in `packages/storage/src/schema.ts`. Key schemas:

- `vocabularyEntrySchema` — Vocabulary word validation
- `readingSessionSchema` — Reading session validation
- `listeningSessionSchema` — Listening session validation
- `writingSessionSchema` — Writing session validation
- `speakingSessionSchema` — Speaking session validation
- `mistakeEntrySchema` — Mistake entry validation
- `grammarNoteSchema` — Grammar note validation
- `taskEntrySchema` — Task entry validation
- `mockTestEntrySchema` — Mock test validation
- `topicProgressSchema` — Topic progress validation
- `appExportDataSchema` — Full export/import validation
- And more (27+ entity schemas)

All schemas are registered in `tableSchemas` for dynamic validation in the `BaseRepository`.

---

## 6. Extension Database

The browser extension maintains a separate database at its own origin:

**Database name:** `ielts-journey-extension`
**Schema:** Mirrors the web app schema exactly for full compatibility
**Additional stores:** `savedPages`, `youtubeSessions`, `syncLog`

See [extension-architecture.md](extension-architecture.md) for the extension database details.

---

## 7. Data Validation Flow

```
User Input → Feature Schema (Zod) → Service
                                        │
                                        ▼
                                  Repository Schema (Zod)
                                        │
                                        ▼
                                  IndexedDB (Dexie)
```

Validation at each boundary prevents corrupted data from entering the database.
