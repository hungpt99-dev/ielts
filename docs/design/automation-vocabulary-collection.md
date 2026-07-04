# Automation Design: Vocabulary Collection & AI Enrichment

## Current State Summary

The vocabulary collection and enrichment flow requires **5-7 manual steps**: select text → open popup → type word → click "Enrich" → wait for AI (3-5s) → review results → click "Save". The two popup entry points (`VocabularyCollector` and `QuickAddVocab`) duplicate save logic but neither enriches automatically. The selection panel shows dictionary data on single-word selection but offers no save action. No background enrichment exists — the user must stay on the popup while AI responds. No cross-session vocabulary detection (words seen on multiple pages are re-saved independently).

---

## Proposed Automation Enhancements

### 1. Auto-Enrich on Word Selection (Extension)

| Change | Location | Description |
|--------|----------|-------------|
| Auto-enrich for single words | `selectionPanel.ts` `show()` | When user selects 1-2 words, fire the `generateVocabularyDetails` AI call in parallel with the dictionary lookup. Cache the enriched details attached to the session. |
| "Save Word" button in dictionary panel | `selectionPanel.ts` | After the dictionary body renders with enriched details, inject a "Save" button inline below the dictionary entry. One-click save with auto-populated data. No form popup needed. |
| Auto-save setting | `storage.ts` settings | Add `autoSaveVocabulary: boolean` toggle. When enabled, single-word selections are auto-saved after enrichment completes — no click needed. A subtle toast confirms. |

**Implementation Pattern** — modify `loadDictionaryData` in `selectionPanel.ts`:

```typescript
async function loadDictionaryData(): Promise<void> {
  // ...existing dictionary fetch...

  // After dictionary renders, kick off enrichment in background
  if (config.apiKey && isWordOnly(selectedText)) {
    enrichInBackground(normalizeWord(selectedText), context)
  }
}

async function enrichInBackground(word: string, context: string): Promise<void> {
  const result = await generateVocabularyDetails(word, context, '', () => config)
  if (result.data) {
    // Cache enriched data for this selection session
    sessionEnrichedData = result.data
    // Show Save button
    injectSaveButton(word, context)
    // Auto-save if setting enabled
    if (settings.autoSaveVocabulary) {
      await quickSaveWord(word, context, result.data)
      showToast('Word saved with AI enrichment!')
    }
  }
}
```

### 2. Background Enrichment via Service Worker

| Change | Location | Description |
|--------|----------|-------------|
| Enrichment handler in background | `background/messaging.ts` | Register new `ENRICH_VOCABULARY` message type. Background worker calls AI enrichment API, stores result in IndexedDB, notifies content script when done. |
| Enrich-and-save batch handler | `background/messaging.ts` | New `SAVE_VOCABULARY_BATCH` handler that accepts multiple words, enriches each in parallel with `Promise.allSettled`, saves all results, reports progress. |
| Queue for pending enrichments | `background/enrichmentQueue.ts` (new) | A persistent queue of words awaiting enrichment. Worker processes 3 at a time (configurable concurrency). Queue persists across service worker restarts via IndexedDB. |

**Implementation Pattern** — new file `background/enrichmentQueue.ts`:

```typescript
interface PendingEnrichment {
  id: string
  word: string
  sourceSentence: string
  pageTitle: string
  pageUrl: string
  topic?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: string
  createdAt: string
  updatedAt: string
}

class EnrichmentQueue {
  private concurrency = 3
  private processing = new Set<string>()

  async enqueue(entries: PendingEnrichment[]): Promise<void> {
    const db = await openDB()
    const tx = db.transaction('enrichmentQueue', 'readwrite')
    for (const entry of entries) {
      tx.store.put(entry)
    }
    await tx.done
    this.processNext()
  }

  private async processNext(): Promise<void> {
    if (this.processing.size >= this.concurrency) return
    const pending = await this.getPending()
    for (const item of pending.slice(0, this.concurrency - this.processing.size)) {
      this.processing.add(item.id)
      this.enrich(item).finally(() => {
        this.processing.delete(item.id)
        this.processNext()
      })
    }
  }

  private async enrich(entry: PendingEnrichment): Promise<void> {
    // Call AI, update queue item to 'completed', save vocabulary to store
    const details = await generateVocabularyDetails(entry.word, entry.sourceSentence, entry.topic || '')
    if (details.data) {
      await saveEnrichedVocabulary({ ...entry, ...details.data })
      await this.updateStatus(entry.id, 'completed')
    } else {
      await this.updateStatus(entry.id, 'failed', details.error || 'Unknown error')
    }
  }
}
```

### 3. Passive Vocabulary Detection While Browsing

| Change | Location | Description |
|--------|----------|-------------|
| Scan page text for potential IELTS vocabulary | `content-script/vocabScanner.ts` (new) | Passive scanner runs on page load/idle, identifies uncommon/IELTS-level words by comparing against a local frequency list. Marks words with a subtle dotted underline. Hover shows a mini-tooltip with "Save word" action. |
| Local frequency list | `packages/ai/src/data/ielts-vocab-tiers.ts` (new) | Tiered word lists: Tier 1 (high-frequency, skip), Tier 2 (IELTS-specific, detect), Tier 3 (academic, detect). ~3000 words total, tree-shaken for bundle size < 5KB. |
| De-duplication check | `vocabScanner.ts` | Before showing the save hint, check extension's IndexedDB for existing entries by word. Only suggest un-saved words. |
| Scanner settings | `storage.ts` | `vocabScannerEnabled: boolean` (default: false, opt-in). `vocabScannerTier: ('tier2' | 'tier3' | 'all')`. |

**Implementation Pattern** — new file `content-script/vocabScanner.ts`:

```typescript
import { VOCAB_TIER_2, VOCAB_TIER_3 } from '@ielts/ai'

interface ScanResult {
  word: string
  sentence: string
  tier: 2 | 3
}

const scannerConfig = {
  enabled: false,
  tier: 'tier2' as 'tier2' | 'tier3' | 'all',
}

async function scanPage(): Promise<ScanResult[]> {
  if (!scannerConfig.enabled) return []

  const savedWords = await getSavedWordSet() // Set of already-saved words
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)

  const results: ScanResult[] = []
  const visited = new Set<string>()
  const wordTiers = scannerConfig.tier === 'all'
    ? [...VOCAB_TIER_2, ...VOCAB_TIER_3]
    : scannerConfig.tier === 'tier3'
      ? [...VOCAB_TIER_2, ...VOCAB_TIER_3]
      : VOCAB_TIER_2

  const wordSet = new Set(wordTiers.map(w => w.toLowerCase()))

  while (walker.nextNode()) {
    const text = walker.nodeValue || ''
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    for (const w of words) {
      if (wordSet.has(w) && !savedWords.has(w) && !visited.has(w)) {
        visited.add(w)
        results.push({ word: w, sentence: extractSentence(walker.currentNode), tier: wordSet.has(w) ? 2 : 3 })
      }
    }
  }

  return results
}
```

### 4. Background Enrichment for Batch-Imported Words

| Change | Location | Description |
|--------|----------|-------------|
| Auto-enrich after article save | `articleStore.ts` / `videoStore.ts` | When user saves an article or video, extract all sentences, detect unknown vocabulary via scanner, enqueue all detected words for background enrichment. |
| Bulk save from saved texts | `popup/components/VocabularyCollector.tsx` | New "Extract Vocabulary" button on saved items listing. Scans all saved text, finds candidate words, enriches and saves in background. User sees progress bar. |
| Public API import enrichment | `publicApiService.ts` | When importing content via public API, run the vocabulary scanner on the imported text and enqueue detected words. |

### 5. UI: One-Click Save from Anywhere

| Change | Location | Description |
|--------|----------|-------------|
| "Save" action in selection panel | `selectionPanel.ts` ACTIONS | Replace "Save Word" toolbar icon with a dedicated button that triggers enrichment + save in one click. Show checkmark animation on success. |
| Quick-save context menu | `background/contextMenus.ts` | Add right-click context menu item "Save & Enrich Word" on selected text. Triggers enrichment queue directly from background — no popup needed. |
| Enriched badge on vocabulary list | `WordForm.tsx` / `VocabularyManager.tsx` | Show a small badge/icon indicating which words have been enriched vs. which are pending enrichment in the queue. Allow manual retry for failed entries. |
| Batch enrichment progress | `VocabularyCollector.tsx` | When multiple words are detected from an article, show "Enriching 5/12 words..." progress. Each completes independently — no all-or-nothing loading state. |

### 6. Automatic Topic Context Detection

| Change | Location | Description |
|--------|----------|-------------|
| Topic inference from page content | `vocabScanner.ts` | After detecting a candidate word, scan the surrounding paragraph and page metadata for topic keywords (e.g., "environment", "education", "technology"). Auto-populate the topic field on save. |
| Topic from URL pattern | `vocabScanner.ts` | Parse URL path for topic hints (e.g., `/environment/pollution` → topic: "Environment"). |
| Domain-based topic mapping | `storage.ts` settings | Optional user-defined domain-to-topic mapping (e.g., `theguardian.com/environment` → "Environment"). |

```typescript
function inferTopic(word: string, sentence: string, url: string): string {
  const paragraphText = sentence.toLowerCase()
  const urlLower = url.toLowerCase()

  const topicKeywords: Record<string, string[]> = {
    'Environment': ['environment', 'climate', 'pollution', 'sustainable', 'ecosystem', 'conservation'],
    'Education': ['education', 'school', 'university', 'learning', 'student', 'teacher', 'academic'],
    'Technology': ['technology', 'digital', 'internet', 'software', 'ai', 'data', 'computer'],
    'Health': ['health', 'medical', 'disease', 'treatment', 'hospital', 'patient', 'wellness'],
    'Economy': ['economy', 'business', 'market', 'finance', 'trade', 'employment', 'income'],
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(k => paragraphText.includes(k))) return topic
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(k => urlLower.includes(k))) return topic
  }

  return 'General'
}
```

---

## Backend Changes Summary

| File | Change |
|------|--------|
| `packages/ai/src/services/vocabulary.ts` | Add batch `enrichVocabularyBatch()` for parallel enrichment; add `enrichFromQueueItem()` for background processing; add `generateVocabularyDetails` overload accepting cached context |
| `packages/ai/src/utils/cache.ts` | Extend `AiCache` with persistent IndexedDB fallback for vocabulary details; LRU eviction cap at 200 entries |
| `packages/ai/src/data/ielts-vocab-tiers.ts` (new) | Export `VOCAB_TIER_2` (IELTS-specific, ~1500 words) and `VOCAB_TIER_3` (academic, ~1500 words) as sorted string arrays |
| `apps/extension/src/content-script/selectionPanel.ts` | Add auto-enrich after dictionary load; inject Save button; add `autoSaveVocabulary` check; add `injectSaveButton()` and `quickSaveWord()` functions |
| `apps/extension/src/content-script/vocabScanner.ts` (new) | Passive vocabulary scanner — page load scan, idle-time scan, detect tier-2/tier-3 words, de-duplicate against saved words, show mini-tooltip hints |
| `apps/extension/src/background/messaging.ts` | Add `ENRICH_VOCABULARY` and `SAVE_VOCABULARY_BATCH` message types with background handles |
| `apps/extension/src/background/enrichmentQueue.ts` (new) | Persistent queue with IndexedDB storage, concurrency control, retry logic, progress reporting |
| `apps/extension/src/background/contextMenus.ts` | Add "Save & Enrich Word" right-click context menu item |
| `apps/extension/src/popup/components/VocabularyCollector.tsx` | Simplify form: auto-enrich on mount when a word is detected; remove manual "Enrich" button; add progress indicator for batch enrichment; add "Extract Vocabulary from Page" option |
| `apps/extension/src/popup/components/QuickAddVocab.tsx` | Add optional background enrichment: save word immediately, enqueue enrichment as separate step — no waiting |
| `apps/extension/src/storage/vocabularyStore.ts` | Add `getSavedWordSet()` returning `Set<string>` for efficient de-duplication; add IndexedDB store for enrichment queue |
| `apps/extension/src/background/index.ts` | Register `enrichmentQueue`, `contextMenus`, `vocabScanner` init |
| `apps/web/src/features/vocabulary/VocabularyManager.tsx` | Show enrichment status badge; batch re-enrich action for stale entries |
| `apps/web/src/features/vocabulary/components/WordForm.tsx` | Remove manual "AI Example" button — auto-fetch enrichment if word is new and AI key is configured |

## User-Facing Behavior Changes

| Before | After |
|--------|-------|
| Select a word → toolbar appears → click "Save Word" → popup opens → type word → click "Enrich" → wait → review → click "Save" | Select a word → toolbar appears → dictionary shows → enrichment is auto-triggered in background → "Save" button appears inline → click once to save with all AI data populated |
| Quick Add saves word with no AI data | Quick Add saves immediately, enrichment queued in background — user sees enriched data later on the web app |
| No way to save from right-click context menu | Right-click any selected text → "Save & Enrich Word" → saved in one action |
| Saved articles/texts have no vocabulary extraction | "Extract Vocabulary" scans saved text, auto-detects new words, enriches them in batch |
| No passive vocabulary discovery while browsing | Opt-in passive scanner highlights IELTS-level words with dotted underline and hover tooltip |
| AI enrichment blocks the popup UI | Enrichment offloaded to background service worker or queue — popup is never blocked |
| No enrichment status feedback in vocabulary list | Each word in the list shows enrichment status (pending/completed/failed) |
| Topic field is manually typed | Topic auto-inferred from page content, URL, and domain |
| Duplicate words may be saved across browsing sessions | De-duplication check prevents re-saving words already in the vocabulary store |

## Performance & Data Considerations

- **Enrichment queue concurrency**: 3 parallel AI calls max. Respects API rate limits. Retry with exponential backoff (1s, 5s, 30s). Max 3 retries per word.
- **Scanner: idle-time only**: Uses `requestIdleCallback` with timeout 2000ms. Never runs during user interaction. Scans at most once per page load.
- **Frequency list bundle size**: ~4KB gzipped for tier 2 + tier 3 combined. Tree-shaken to include only used tier levels.
- **IndexedDB storage**: Enrichment queue entries < 1KB each. Auto-cleanup completed entries older than 7 days.
- **API cost awareness**: Automatic enrichment only fires if AI key is configured. `autoSaveVocabulary` defaults to `false` — user opts in explicitly.
