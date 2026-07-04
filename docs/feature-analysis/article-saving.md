# Article Saving as Reading Material

## Overview

Articles can be saved as reading material through two independent pathways — the **browser extension** (ArticleCollector popup) and the **web app** (ReadingJournal + Public API import). There is **no automatic web scraping or URL-to-content extraction**; all article content is manually entered by the user.

---

## System Architecture

```
Browser extension path:
User on webpage
       │
       ▼
┌─────────────────────────┐     ┌──────────────────────────┐
│  selectionPanel.ts       │     │  ArticleCollector.tsx    │
│  (floating toolbar)      │ ──► │  (popup save form)       │
│  — Save Article button   │     │  — GET_PAGE_INFO msg     │
└─────────────────────────┘     │  — User pastes content   │
                                │  — AI questions (optional)│
                                └───────────┬──────────────┘
                                            │
                                      ┌─────▼──────┐
                                      │  IndexedDB  │
                                      │  (extension)│
                                      │  articles   │
                                      │  store      │
                                      └─────┬──────┘
                                            │ sync (export/import)
                                            ▼
Web app path:
┌──────────────────────┐          ┌──────────────────┐
│  ReadingJournal.tsx   │  ──────►│  Dexie/IndexedDB  │
│  — Manual session log │          │  readingSessions  │
│  — Stats & tracking   │          │  readingPassages  │
└──────────────────────┘          └──────────────────┘

┌──────────────────────────┐     ┌──────────────────┐
│  PublicApiImportPage.tsx  │ ──►│  classifyAndSave  │
│  — Wikipedia, Gutendex   │     │  (AI auto-classify)│
│  — OER Commons, etc.     │     └──────────────────┘
└──────────────────────────┘
```

---

## Pathways: How Articles Are Saved

### Pathway 1: Browser Extension — ArticleCollector (`ArticleCollector.tsx`)

- **File**: `apps/extension/src/popup/components/ArticleCollector.tsx:129`
- **Trigger**: User clicks "Save Article" (📰) from the floating selection panel or dashboard
- **Flow**:
  1. Sends `GET_PAGE_INFO` message to the active tab's content script → receives `{ title, url, selectedText }`
  2. Auto-populates the title field and selected paragraph from the page
  3. User MUST manually paste the full article content into the "Full Article Content" textarea — **no automatic extraction**
  4. User optionally selects an IELTS topic, difficulty, tags, and personal note
  5. Toggle "Mark as Reading practice material" checkbox (default: on)
  6. Optional: click "Generate Questions" to produce AI-generated IELTS questions from the content
  7. Click "Save Article" → validates with `extensionArticleSchema` → `saveArticleEntry()` writes to IndexedDB → increments `dailyProgress.articlesSaved` counter

### Pathway 2: Web App — ReadingJournal (`ReadingJournal.tsx`)

- **File**: `apps/web/src/pages/ReadingJournal.tsx:78`
- **Trigger**: User navigates to `/reading` page, clicks "Add Session"
- **Flow**:
  1. Modal form with fields: title, topic, source URL, passage text, question type, question/answer counts, time spent, vocabulary, summary, mistakes, notes
  2. User manually fills all fields — **no AI assistance on the form**
  3. Accuracy is computed automatically from correct/total answers
  4. Reading speed (wpm) is computed from passage word count / time
  5. Saves to `readingSessions` Dexie table via `DatabaseService.add()`
- **Viewing**: Sessions are listed with filters (search, topic, type), sortable by date/accuracy/speed, with a detail modal and inline accuracy/speed chart

### Pathway 3: Web App — Public API Import (`PublicApiImportPage.tsx`)

- **File**: `apps/web/src/features/publicApiIntegration/api/import.ts`
- **Sources**: Wikipedia, Gutendex (public domain books), OER Commons, YouTube
- **Flow**:
  1. User searches a source → fetches content → previews results
  2. User selects content to import → `classifyAndSave()` runs AI classification on the imported content
  3. AI classifies: topic, skill, difficulty, tags, vocabulary, summary, key phrases
  4. Saved as `PublicApiImportedContent` in the `publicApiContent` Dexie table

---

## Data Storage

### Extension Article Schema (`extensionArticleSchema`) — `apps/extension/src/storage/articleStore.ts:15`

IndexedDB store `articles` in database `ielts-journey-extension`, indexed on `topic`, `status`, `isReadingPractice`, `createdAt`.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string (UUID) | yes | — | Primary key |
| title | string | yes | — | Article title |
| url | string | no | '' | Source URL |
| content | string | no | '' | Full article body (user-pasted) |
| selectedParagraph | string | no | '' | Highlighted text from page |
| topic | string | no | '' | IELTS topic (one of 13 predefined) |
| tags | string[] | no | [] | User tags |
| personalNote | string | no | '' | User's note |
| isReadingPractice | boolean | no | false | Marked as reading practice |
| difficulty | 'easy' \| 'medium' \| 'hard' \| '' | no | '' | Difficulty level |
| aiQuestions | ArticleQuestion[] | no | [] | AI-generated IELTS questions |
| aiQuestionsGeneratedAt | string (ISO) | no | undefined | When questions were generated |
| status | 'new' \| 'reading' \| 'reviewed' | yes | 'new' | Reading progress |
| createdAt | string (ISO) | yes | — | Creation timestamp |
| updatedAt | string (ISO) | yes | — | Last update timestamp |

### Web App Reading Session Schema (`readingSessionSchema`) — `packages/storage/src/schema.ts:86`

Dexie table `readingSessions` in database `ielts-journey`.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string | yes | — | Primary key |
| title | string | yes | — | Session title |
| topic | string | no | '' | IELTS topic |
| sourceUrl | string | no | '' | Source URL |
| passageText | string | no | '' | Reading passage |
| questionType | QuestionType | yes | — | One of 6 IELTS question types |
| totalQuestions | number | no | 0 | Total question count |
| correctAnswers | number | no | 0 | Correct answers |
| accuracy | number | no | 0 | Computed percentage |
| timeSpentMinutes | number | no | 0 | Time spent reading |
| newVocabulary | string[] | no | [] | New words learned |
| summary | string | no | '' | Passage summary |
| mistakes | string | no | '' | Mistakes made |
| notes | string | no | '' | User notes |
| createdAt | string (ISO) | yes | — | Creation timestamp |

### Web App Reading Passage Schema (`readingPassageSchema`) — `packages/storage/src/schema.ts:249`

Dexie table `readingPassages`, indexed on `id, topic, difficulty, tags, isFavorite, createdAt`.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | string | yes | — | Primary key |
| title | string | yes | — | Passage title |
| content | string | no | '' | Passage content |
| source | string | no | '' | Source attribution |
| topic | string | no | '' | IELTS topic |
| difficulty | 'easy' \| 'medium' \| 'hard' | yes | — | Difficulty level |
| wordCount | number | no | 0 | Word count |
| tags | string[] | no | [] | Tags |
| isFavorite | boolean | no | false | Favorite marker |
| status | 'new' \| 'learning' \| 'reviewing' \| 'mastered' | yes | — | Learning status |
| notes | string | no | '' | User notes |
| createdAt | string (ISO) | yes | — | Created timestamp |
| updatedAt | string (ISO) | yes | — | Updated timestamp |

### Public API Content Schema (`publicApiContentSchema`) — `packages/storage/src/schema.ts:379`

Dexie table `publicApiContent`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Primary key |
| title | string | yes | Content title |
| content | string | no | Content body |
| contentType | ContentType | yes | Type (article, book, video, etc.) |
| sourceType | 'public-api' | yes | Fixed source type |
| sourceName | SourceName | yes | API source name |
| sourceUrl | string | no | Source URL |
| licenseName | string | yes | Content license |
| attribution | string | no | Attribution text |
| importedAt | string (ISO) | yes | Import timestamp |
| skill | string | no | Classified skill |
| topic | string | no | Classified topic |
| difficulty | string | no | Classified difficulty |
| tags | string[] | no | User tags |
| userNotes | string | no | User notes |
| aiClassification | object (optional) | no | AI classification result |
| aiClassification.topic | string | yes | Classified topic |
| aiClassification.skill | string | yes | Classified skill |
| aiClassification.difficulty | string | yes | Classified difficulty |
| aiClassification.tags | string[] | yes | Classified tags |
| aiClassification.vocabulary | string[] | yes | Extracted vocabulary |
| aiClassification.summary | string | yes | Generated summary |

### AI Question Schema (`articleQuestionSchema`) — `apps/extension/src/storage/articleStore.ts:3`

| Field | Type | Description |
|-------|------|-------------|
| type | 'multiple-choice' \| 'true-false' \| 'short-answer' \| 'gap-fill' \| 'matching' | Question type |
| question | string | Question text |
| passage | string (optional) | Relevant passage |
| options | string[] (optional) | Answer options |
| correctAnswer | string | Correct answer |
| explanation | string | Answer explanation |
| skill | 'reading' \| 'listening' \| 'writing' \| 'speaking' | IELTS skill (default: reading) |
| difficulty | 'easy' \| 'medium' \| 'hard' | Difficulty (default: medium) |
| bandScore | string (optional) | Estimated band score range |

---

## AI Assistance

### Feature 1: AI Question Generation (Extension — ArticleCollector)

- **File**: `apps/extension/src/popup/components/ArticleCollector.tsx:34`
- **Inline AI call**: Direct `fetch()` to OpenAI-compatible API (not through `packages/ai`)
- **Prompt**: Generates 3-5 IELTS-style questions mixed across 5 types: multiple-choice, true-false, short-answer, gap-fill, matching
- **Inputs**: article content (or selected paragraph), title, topic
- **Temperature**: 0.5 | **Max tokens**: 2000
- **Validation**: JSON extraction by finding first `{` / last `}` in the response
- **Persistence**: Stored as `aiQuestions[]` on the `ExtensionArticleEntry`
- **Requires**: User API key configured in extension settings

### Feature 2: AI Question Generation (Web App — `packages/ai`)

- **File**: `packages/ai/src/services/article.ts:8`
- **Service**: `generateArticleQuestions()` — uses `callAI()` from shared AI client
- **Prompt**: `buildArticleQuestionPrompt()` in `packages/ai/src/prompts/article.ts`
- **Schema**: `articleQuestionSchema` in `packages/ai/src/schemas/article.ts` (returns `ArticleQuestionSet` — superset of extension schema with `questions` array)
- **Response validation**: Zod `safeParse`
- **Note**: This service is exported but **not wired into any UI component** for the article save flow. It is only tested in `packages/ai/src/__tests__/services.test.ts`.

### Feature 3: AI Content Classification (Web App — Public API Import)

- **File**: `apps/web/src/features/publicApiIntegration/ai/classify.ts:245`
- **Functions**: `classifyContent()` → `classifyAndSave()`
- **AI outputs**: topic, skill, difficulty, tags, vocabulary, summary, keyPhrases, questions
- **Persistence**: Saved as `aiClassification` on `PublicApiImportedContent`
- **Generation services** also available from same module: `generateReadingQuestions()`, `generateListeningExercise()`, `generateSpeakingPrompts()`, `generateWritingIdeas()`, `generateGrammarExercises()`, `generateMistakeReviewTasks()`, `extractVocabulary()`

---

## UI Components

### Extension Popup

| Component | File | Role |
|-----------|------|------|
| ArticleCollector | `apps/extension/src/popup/components/ArticleCollector.tsx` | Main article save form |
| SaveTextForm | `apps/extension/src/popup/components/SaveTextForm.tsx` | Generic text save (includes reading category) |
| PopupDashboard | `apps/extension/src/popup/components/PopupDashboard.tsx` | Dashboard with "Save Article" action |
| SelectionPanel | `apps/extension/src/content-script/selectionPanel.tsx` | Floating toolbar on web pages |

### Web App

| Component | File | Role |
|-----------|------|------|
| ReadingJournal | `apps/web/src/pages/ReadingJournal.tsx` | Session list + stats + create/edit/detail modals |
| ReadingPractice | `apps/web/src/features/reading/ReadingPractice.tsx` | Interactive passage reading with questions |
| PublicApiImportPage | `apps/web/src/pages/PublicApiImportPage.tsx` | Import articles from public APIs |
| ReadingListeningTutor | `apps/web/src/components/aiTutor/ReadingListeningTutor.tsx` | AI tutor for reading/listening content analysis |

---

## Data Flow Summary

```
Article URL (browser)
       │
       ▼  User highlights text → clicks "Save Article"
┌─────────────────────────────────────┐
│ GET_PAGE_INFO → {title, url, text}  │
│ User pastes full article content    │
│ User selects topic, difficulty      │
│ [Optional] Generate AI questions    │
│ User clicks "Save Article"          │
└──────────┬──────────────────────────┘
           ▼
┌──────────────────────┐     ┌──────────────────────┐
│ extensionArticleSchema│ ──►│ IndexedDB (articles)  │
│   .parse() validates  │     │ ielts-journey-       │
│   saveArticleEntry()  │     │ extension            │
└──────────────────────┘     └──────────┬───────────┘
                                        │
                              ┌─────────▼─────────┐
                              │ storage-bridge.ts   │
                              │ (sync to IndexedDB) │
                              └────────────────────┘

                   Web App Path (parallel):
Reading passage (user pastes)
       │
       ▼
┌──────────────────────┐    ┌──────────────────┐
│ ReadingJournal form  │──►│ readingSessions   │
│ (manual, no AI)      │   │ Dexie table       │
└──────────────────────┘   └──────────────────┘

Public API content:
API fetch → classifyAndSave(AI) → publicApiContent table
```

---

## Synchronization Between Extension and Web App

- **Bridge**: `packages/storage/src/syncService.ts` — `exportExtensionData()` / `importExtensionData()`
- **Sync data**: Articles are carried in the `articles` array of `ExtensionExportData`
- **Trigger**: User must explicitly use the backup/restore feature — **no automatic sync**
- **Result**: Extension articles and web app reading sessions live in separate IndexedDB instances

---

## Current Limitations & Automation Gaps

1. **No automatic web scraping** — Users must manually copy-paste article content. No Readability, Mercury, or Turndown library is used anywhere in the codebase.
2. **No "Save Article from URL"** — Pasting a URL does not fetch content; `sourceUrl` is stored only as metadata for reference.
3. **No full-page extraction from content script** — `GET_PAGE_INFO` returns only the page title, URL, and user-selected text (not the full DOM content).
4. **Two separate storage systems** — Extension (`ielts-journey-extension`) and web app (`ielts-journey`) IndexedDB instances are not automatically synced; sync requires explicit backup/restore.
5. **AI question generation is optional & manual** — Requires clicking "Generate Questions" button after content is entered. Both the extension (inline fetch) and web app (`packages/ai` service) have AI question generation, but the latter is not wired to any UI.
6. **No automatic topic/difficulty tagging** for extension-saved articles — Topic and difficulty are manually selected. The `classifyAndSave()` AI classification exists only for `PublicApiImportedContent`.
7. **No AI summarization on save** — Summary field in ReadingJournal is user-entered text; `classifyAndSave()` generates a summary via AI but only for public API imports.
8. **No vocabulary extraction/auto-save during article save** — Vocabulary from articles is not automatically extracted or added to the vocabulary store.
9. **All AI features require a user-supplied API key** — No built-in AI service.
