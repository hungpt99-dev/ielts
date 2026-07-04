# Automation Design: Article Saving as Reading Materials

## Current State Summary

Saving an article requires **5-7 manual steps**: navigate to page → open extension popup → switch to Article Collector → manually copy-paste the full article content into a textarea → fill topic, difficulty, tags, note → optionally click "Generate Questions" (separate AI call) → review → click "Save". The `GET_PAGE_INFO` message only returns `title`, `url`, and `selectedText` — there is no full-page content extraction. No metadata (topic, difficulty, word count, reading time) is auto-inferred. No background saving exists.

---

## Proposed Automation Enhancements

### 1. Automatic Full-Page Content Extraction

| Change | Location | Description |
|--------|----------|-------------|
| New `GET_FULL_PAGE_CONTENT` message type | `saveSelectedText.ts` `chrome.runtime.onMessage` | Adds a handler that extracts the full article content from the DOM. Strips navigation, ads, sidebars, and other non-content elements. Returns cleaned HTML + plain text + extracted metadata (author, publish date, estimated reading time). |
| Content extraction algorithm | `saveSelectedText.ts` (inline in handler) | Uses a heuristic content-extraction approach: find the main content element (`<article>`, `[role="main"]`, `<main>`, or the largest `<div>` with substantial text). Strip scripts, styles, nav, footer, aside, and `.ad-*` / `.sidebar` elements. Return `{ title, url, contentHtml, contentText, wordCount, readingTimeMinutes, author, publishDate }`. |
| Inject readability extraction | `saveSelectedText.ts` | Bundle a minimal content extraction utility (no external dependency — ~50 lines heuristic). Falls back to `document.body.innerText` if no article element is found. |

**Implementation pattern** — new message handler in `saveSelectedText.ts`:

```typescript
interface FullPageContent {
  title: string
  url: string
  contentHtml: string
  contentText: string
  wordCount: number
  readingTimeMinutes: number
  author: string
  publishDate: string
  extractedAt: string
}

function extractPageContent(): FullPageContent {
  const article = document.querySelector('article')
    || document.querySelector('[role="main"]')
    || document.querySelector('main')
    || findLargestContentDiv()

  const clone = article?.cloneNode(true) as HTMLElement
  if (clone) {
    // Strip non-content elements
    clone.querySelectorAll('script, style, nav, footer, header, aside, iframe, .ad, .advertisement, .sidebar, .nav, .menu, .comments, .social-share').forEach(el => el.remove())
  }

  const contentHtml = clone?.innerHTML || document.body.innerHTML
  const contentText = clone?.textContent?.replace(/\s+/g, ' ').trim()
    || document.body.innerText.replace(/\s+/g, ' ').trim()

  const wordCount = contentText ? contentText.split(/\s+/).length : 0
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200))

  const author = extractMeta('author') || document.querySelector('[rel="author"]')?.textContent?.trim() || ''
  const publishDate = extractMeta('article:published_time')
    || extractMeta('date')
    || document.querySelector('time')?.getAttribute('datetime') || ''

  return {
    title: document.title,
    url: window.location.href,
    contentHtml,
    contentText,
    wordCount,
    readingTimeMinutes,
    author,
    publishDate,
    extractedAt: new Date().toISOString(),
  }
}

function extractMeta(name: string): string {
  const el = document.querySelector(`meta[name="${name}"]`)
    || document.querySelector(`meta[property="${name}"]`)
    || document.querySelector(`meta[property="og:${name}"]`)
  return el?.getAttribute('content')?.trim() || ''
}
```

### 2. One-Click Save from Browser Toolbar / Context Menu

| Change | Location | Description |
|--------|----------|-------------|
| "Save This Article" toolbar action | `manifest.json` `action` | When user clicks the extension icon while on an article page, auto-extract content and save with AI-generated metadata. Show "Article saved!" toast. No popup shown for this path. |
| Context menu "Save Article" | `background/index.ts` context menus | New context menu item (visible when right-clicking on a page, not on selected text). Label: "Save Page as IELTS Reading". One-click — auto-extract + auto-classify + background save. |
| Quick save keyboard shortcut | `background/index.ts` commands | Register `Ctrl+Shift+A` (Mac: `Cmd+Shift+A`) as "Save Article" command. When triggered, extract page content, generate metadata, save to articles store in background. |

```typescript
// background/index.ts — register handlers
chrome.contextMenus.create({
  id: 'save-article',
  title: 'Save Page as IELTS Reading',
  contexts: ['page'],
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'save-article') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab.id) return
      chrome.tabs.sendMessage(tab.id, { type: 'SAVE_ARTICLE_BACKGROUND' })
    })
  }
})
```

### 3. AI-Powered Metadata Enrichment

| Change | Location | Description |
|--------|----------|-------------|
| New `enrichArticle` AI service | `packages/ai/src/services/enrichArticle.ts` (new) | Given article title + content text, returns predicted: `topic` (from `IELTS_TOPICS`), `difficulty` (easy/medium/hard), `tags` (array of 3-5), `readingPractice` (boolean), and a `summary` (2-3 sentences). |
| Enrichment schema | `packages/ai/src/schemas/enrichArticle.ts` (new) | Zod schema: `{ topic: string, difficulty: string, tags: string[], isReadingPractice: boolean, summary: string, confidence: number }` |
| Enrichment prompt | `packages/ai/src/prompts/enrichArticle.ts` (new) | Prompt template with IELTS topic taxonomy, difficulty criteria (vocab complexity, sentence structure), and few-shot examples. |
| Local heuristic fallback | `packages/ai/src/services/enrichArticle.ts` | Pre-classify using keyword matching from content. If confidence >0.8 on topic + difficulty, skip AI call entirely. |

**Implementation pattern** — new service `packages/ai/src/services/enrichArticle.ts`:

```typescript
export interface ArticleMetadata {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  isReadingPractice: boolean
  summary: string
  confidence: number
  method: 'heuristic' | 'ai'
}

export async function enrichArticle(
  content: string,
  title: string,
  getConfig: () => ProviderConfig,
): Promise<ArticleMetadata> {
  // Step 1: Local heuristic classification
  const heuristic = heuristicClassifyArticle(content, title)
  if (heuristic.confidence >= 0.8) {
    return { ...heuristic, method: 'heuristic' }
  }

  // Step 2: AI enrichment for deeper metadata
  const prompts = await import('../prompts/enrichArticle')
  const { content: aiResult, error } = await callAI(
    prompts.enrichSystemPrompt,
    prompts.buildEnrichUserPrompt(title, content),
    getConfig,
    { temperature: 0.3, maxTokens: 500 },
  )

  if (error || !aiResult) {
    return { ...heuristic, method: 'heuristic' }
  }

  return parseAIEnrichmentResult(aiResult, heuristic)
}

function heuristicClassifyArticle(content: string, title: string): ArticleMetadata {
  const text = `${title} ${content}`.toLowerCase()

  // Topic detection by keyword frequency
  const topicScores = topicKeywords.map(({ topic, keywords }) => ({
    topic,
    score: keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0),
  }))
  const bestTopic = topicScores.sort((a, b) => b.score - a.score)[0]
  const topic = bestTopic?.score > 0 ? bestTopic.topic : 'general'

  // Difficulty heuristic: avg word length + sentence length
  const words = content.split(/\s+/)
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length
  const sentences = content.split(/[.!?]+/).filter(Boolean)
  const avgSentenceLen = sentences.length > 0
    ? words.length / sentences.length : 0
  const difficulty = avgWordLen > 6 || avgSentenceLen > 25 ? 'hard'
    : avgWordLen > 5 || avgSentenceLen > 18 ? 'medium'
    : 'easy'

  return {
    topic,
    difficulty,
    tags: [topic],
    isReadingPractice: true,
    summary: '',
    confidence: 0.6,
  }
}
```

### 4. Background Save with Progressive Enhancement

| Change | Location | Description |
|--------|----------|-------------|
| Background save handler | `saveSelectedText.ts` `SAVE_ARTICLE_BACKGROUND` | New message handler: (1) extract page content, (2) call background script to enrich metadata, (3) save to articles store, (4) show toast. All in background — no popup. |
| Background enrichment proxy | `background/messaging.ts` | Add `ENRICH_ARTICLE` message type. Background script calls AI enrichment (avoids content script network fetch CORS issues). |
| Progressive enhancement flow | `ArticleCollector.tsx` | When popup opens with a URL: auto-extract full page content (via `GET_FULL_PAGE_CONTENT`), auto-enrich metadata, and pre-fill all fields. User sees pre-filled form they can adjust, then one-click save. |

```typescript
// saveSelectedText.ts — background article save
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SAVE_ARTICLE_BACKGROUND') {
    const content = extractPageContent()

    // Fire enrichment in background
    chrome.runtime.sendMessage({
      type: 'ENRICH_ARTICLE',
      payload: { title: content.title, content: content.contentText },
    }, (response) => {
      const metadata = response?.data || {}
      const now = new Date().toISOString()
      const entry: ExtensionArticleEntry = extensionArticleSchema.parse({
        id: crypto.randomUUID(),
        title: content.title,
        url: content.url,
        content: content.contentText,
        contentHtml: content.contentHtml,
        wordCount: content.wordCount,
        readingTimeMinutes: content.readingTimeMinutes,
        author: content.author,
        publishDate: content.publishDate,
        topic: metadata.topic || '',
        difficulty: metadata.difficulty || '',
        tags: metadata.tags || [],
        isReadingPractice: true,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      })

      saveArticleEntry(entry).then(() => {
        chrome.runtime.sendMessage({
          type: 'UPDATE_PROGRESS',
          payload: { articlesSaved: 1 },
        })
      })
    })

    showToast('Article saved!')
    sendResponse({ success: true })
    return true
  }
})
```

### 5. Auto-Enriched Article Form (No Manual Fill)

| Change | Location | Description |
|--------|----------|-------------|
| Auto-extract on mount | `ArticleCollector.tsx` `useEffect` | On popup open with an active tab, send `GET_FULL_PAGE_CONTENT` to extract the full page. Auto-fill title, content, word count, reading time. |
| Auto-enrich on mount | `ArticleCollector.tsx` `useEffect` | After content is extracted, call `ENRICH_ARTICLE` in background. Auto-fill topic, difficulty, tags. User only needs to click "Save". |
| Streamlined form layout | `ArticleCollector.tsx` | Reorder fields to show extracted metadata summary first (title, source, word count, reading time) as read-only info cards, then editable fields (topic, difficulty, tags, note), then AI questions section, then Save button. |

**Streamlined form UI** (replaces current 10-field manual form):

```
┌──────────────────────────────────────┐
│ 📰 Save Article                     │
│──────────────────────────────────────│
│                                      │
│  📄 Article Title (editable)         │
│  ┌──────────────────────────────────┐│
│  │ How Climate Change Affects...    ││
│  └──────────────────────────────────┘│
│                                      │
│  📊 Page Info (auto-extracted)       │
│  ┌──────────────────────────────────┐│
│  │ 📏 1,234 words · ⏱ 6 min read   ││
│  │ ✍️ John Doe · 📅 2024-03-15     ││
│  └──────────────────────────────────┘│
│                                      │
│  🏷 Topic: [ Education       ▼ ]    │
│  📊 Difficulty: [ Medium      ▼ ]   │
│  🏷 Tags: [ climate, science    ]   │
│                                      │
│  📝 Personal Note                    │
│  ┌──────────────────────────────────┐│
│  │ Why I want to save this...       ││
│  └──────────────────────────────────┘│
│                                      │
│  ☑ 📖 Reading practice material     │
│                                      │
│  🧠 AI Questions (3 ready) [View]   │
│                                      │
│  [💾 Save Article]                   │
└──────────────────────────────────────┘
```

### 6. Smart De-Duplication Across Saves

| Change | Location | Description |
|--------|----------|-------------|
| URL-based de-dup | `articleStore.ts` `saveArticleEntry()` | Before saving, check if an article with the same `url` already exists. If found, offer to update (re-extract content, keep existing AI questions) or skip. |
| Content hash de-dup | `articleStore.ts` `saveArticleEntry()` | If URL differs but content hash matches, flag as potential duplicate (same content on different URLs, e.g., syndicated articles). |
| De-dup UI | `ArticleCollector.tsx` | When duplicate detected, show inline warning: "This article was saved on {date}. Update or skip?" |

```typescript
// articleStore.ts — de-dup check
export async function findArticleByUrl(url: string): Promise<ExtensionArticleEntry | undefined> {
  const all = await getAllArticles()
  return all.find(a => a.url === url)
}

export async function findArticleByContentHash(contentHash: string): Promise<ExtensionArticleEntry | undefined> {
  const all = await getAllArticles()
  return all.find(a => a.contentHash === contentHash)
}

export async function saveArticleEntry(entry: ExtensionArticleEntry): Promise<{ duplicate: boolean; existing?: ExtensionArticleEntry }> {
  const existing = await findArticleByUrl(entry.url)
  if (existing) {
    return { duplicate: true, existing }
  }
  // ... existing save logic ...
  return { duplicate: false }
}
```

### 7. Article Schema Extension

| Change | Location | Description |
|--------|----------|-------------|
| Add `contentHtml` field | `extensionArticleSchema` | Stores the cleaned HTML for rich display in the web app reading view. Default: `''`. |
| Add `wordCount` field | `extensionArticleSchema` | Number of words in the extracted content. Used for reading time estimation and progress tracking. |
| Add `readingTimeMinutes` field | `extensionArticleSchema` | Estimated reading time at 200 wpm. Default: `0`. |
| Add `author` field | `extensionArticleSchema` | Extracted author name from meta tags or DOM. Default: `''`. |
| Add `publishDate` field | `extensionArticleSchema` | Extracted publish date from meta tags. Default: `''`. |
| Add `contentHash` field | `extensionArticleSchema` | `hashCode(contentText)` for de-duplication. Default: `''`. |
| Add `summary` field | `extensionArticleSchema` | AI-generated 2-3 sentence summary. Default: `''`. |
| Add `source` field | `extensionArticleSchema` | Enum: `'manual' | 'auto-extract' | 'context-menu' | 'keyboard-shortcut'`. Tracks how article was saved. |

```typescript
// Updated extensionArticleSchema
export const extensionArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  url: z.string().default(''),
  content: z.string().default(''),
  contentHtml: z.string().default(''),
  selectedParagraph: z.string().default(''),
  wordCount: z.number().default(0),
  readingTimeMinutes: z.number().default(0),
  author: z.string().default(''),
  publishDate: z.string().default(''),
  contentHash: z.string().default(''),
  summary: z.string().default(''),
  source: z.enum(['manual', 'auto-extract', 'context-menu', 'keyboard-shortcut']).default('manual'),
  topic: z.string().default(''),
  tags: z.array(z.string()).default([]),
  personalNote: z.string().default(''),
  isReadingPractice: z.boolean().default(false),
  difficulty: z.enum(['easy', 'medium', 'hard', '']).default(''),
  aiQuestions: z.array(articleQuestionSchema).default([]),
  aiQuestionsGeneratedAt: z.string().optional(),
  status: z.enum(['new', 'reading', 'reviewed']).default('new'),
  createdAt: z.string(),
  updatedAt: z.string(),
})
```

### 8. Batch Article Capture Mode

| Change | Location | Description |
|--------|----------|-------------|
| Session-based capture buffer | `content-script/articleBuffer.ts` (new) | Accumulates articles during a browsing session. Each entry: `{ id, url, title, extractedAt, metadata }`. User can review and batch-save or discard. |
| Floating buffer badge | `selectionPanel.ts` | Small badge on the page showing unsaved article count (e.g., "3 articles"). Click opens a mini review list. "Save All" saves everything at once. |
| Auto-capture toggle | `storage.ts` settings | `autoCaptureArticles: boolean` (default: off, opt-in). When enabled, every page visit (that looks like an article) gets auto-extracted and buffered. |

```typescript
// articleBuffer.ts
interface BufferedArticle {
  id: string
  url: string
  title: string
  content: FullPageContent
  metadata: ArticleMetadata | null
  extractedAt: string
}

class ArticleBuffer {
  private items: BufferedArticle[] = []
  private storageKey = 'articleBuffer'

  async add(pageUrl: string): Promise<void> {
    if (this.items.some(i => i.url === pageUrl)) return // de-dup

    const content = await extractPageContent()
    if (content.wordCount < 100) return // skip non-article pages

    const metadata = await enrichArticle(content.contentText, content.title, getProviderConfig)
    this.items.push({
      id: crypto.randomUUID(),
      url: pageUrl,
      title: content.title,
      content,
      metadata,
      extractedAt: new Date().toISOString(),
    })
    this.persist()
  }

  async saveAll(): Promise<number> {
    let saved = 0
    for (const item of this.items) {
      const entry = buildArticleEntry(item)
      await saveArticleEntry(entry)
      saved++
    }
    this.items = []
    this.persist()
    return saved
  }

  private persist(): void {
    chrome.storage.local.set({ [this.storageKey]: this.items })
  }
}
```

---

## Backend Changes Summary

| File | Change |
|------|--------|
| `packages/ai/src/services/enrichArticle.ts` (new) | `enrichArticle()` — heuristic + AI two-tier article metadata enrichment (topic, difficulty, tags, summary); `heuristicClassifyArticle()` with keyword-based topic/difficulty detection; `ArticleMetadata` interface |
| `packages/ai/src/schemas/enrichArticle.ts` (new) | Zod schema for AI enrichment response for articles |
| `packages/ai/src/prompts/enrichArticle.ts` (new) | Prompt template for article metadata enrichment with IELTS topic taxonomy and difficulty criteria |
| `apps/extension/src/content-script/saveSelectedText.ts` | Add `GET_FULL_PAGE_CONTENT` handler with `extractPageContent()`; add `SAVE_ARTICLE_BACKGROUND` handler for one-click save; add keyboard shortcut listener |
| `apps/extension/src/content-script/selectionPanel.ts` | Add article buffer badge; add "Save Page" action in the selection panel for article-like pages |
| `apps/extension/src/content-script/articleBuffer.ts` (new) | Session-based article buffer — accumulate, batch save, show count badge |
| `apps/extension/src/background/index.ts` | Register "Save Page as IELTS Reading" context menu item (page context); register `Ctrl+Shift+A` keyboard command |
| `apps/extension/src/background/messaging.ts` | Add `ENRICH_ARTICLE` message type for background-side article enrichment; add `SAVE_ARTICLE_BACKGROUND` handler |
| `apps/extension/src/popup/components/ArticleCollector.tsx` | Auto-extract full page content on mount via `GET_FULL_PAGE_CONTENT`; auto-enrich metadata via `ENRICH_ARTICLE`; pre-fill all form fields; add extracted metadata summary display (word count, reading time, author, date); add de-dup warning; streamline form layout |
| `apps/extension/src/storage/articleStore.ts` | Add `findArticleByUrl()`, `findArticleByContentHash()` for de-dup; modify `saveArticleEntry()` to return de-dup info; add `contentHtml`, `wordCount`, `readingTimeMinutes`, `author`, `publishDate`, `contentHash`, `summary`, `source` fields |
| `apps/extension/src/storage/storage.ts` | Add settings: `autoCaptureArticles`, `autoEnrichArticles` toggles |
| `apps/extension/public/manifest.json` | Add `Ctrl+Shift+A` keyboard shortcut command for "Save Article" |

## User-Facing Behavior Changes

| Before | After |
|--------|-------|
| Navigate to article → open popup → switch to Article Collector tab → manually copy-paste full content → fill 5+ fields manually → click Save | Navigate to article → click extension icon → article is auto-extracted, enriched, and saved in 1 click |
| Article form opens empty — user must type or paste title and content | Form opens with title, content, word count, reading time, author, publish date all auto-extracted — user just reviews |
| Topic, difficulty, tags all manually selected | All metadata auto-inferred by AI from content analysis |
| No way to save article without opening the popup | Save via context menu (right-click page → "Save Page as IELTS Reading") or keyboard shortcut (`Ctrl+Shift+A`) — no popup needed |
| No duplicate detection — same article can be saved multiple times | URL-based and content-hash-based deduplication prevents duplicates |
| Non-article pages can trigger the same save flow (no content validation) | Content extraction filters non-article pages (<100 words = skip); only article-like pages offer auto-save |
| Article schema has only basic fields (title, url, content, selectedParagraph) | Extended schema stores `contentHtml`, `wordCount`, `readingTimeMinutes`, `author`, `publishDate`, `contentHash`, `summary`, `source` — powers rich reading view and progress tracking |
| Each article saved individually with no batch workflow | Batch article capture mode: accumulate articles during a browsing session, review and save all at once |
| No way to track which articles were auto-saved vs. manually entered | `source` field records the method (`auto-extract`, `context-menu`, `keyboard-shortcut`, `manual`) |
