# Automation Design: Explain & Simplify Text Features

## Current State Summary

The explain/simplify features currently require **6 manual steps**: select text → spot toolbar → click a button → wait for AI → click another tab → wait again. Each of the 7 explain types (`simple`, `vietnamese`, `ielts-vocab`, `grammar`, `rewrite`, `example-sentences`, `quiz`) is loaded **lazily and individually** — the user must click each tab and wait for a separate AI call. No results are persisted across sessions.

---

## Proposed Automation Enhancements

### 1. Auto-Trigger by Selection Event

| Change | Location | Description |
|--------|----------|-------------|
| Debounced selection detection | `selectionPanel.ts` `onMouseUp` | After user finishes selecting text and pauses (>600ms), auto-show the explain panel with the first tab already loading — no toolbar button click needed. |
| Smart trigger heuristics | `selectionPanel.ts` `show()` | If selected text is >3 words, auto-load `simple` explain tab. If text contains complex sentence structures (heuristic: >15 words, >2 commas), also pre-fetch `rewrite`. |
| Configurable auto-trigger | `storage.ts` / settings | Add `autoExplain: boolean` toggle in extension settings. Default: `true`. Respect existing `floatingToolbar` disable. |

**Implementation Pattern** — modify `onMouseUp` in `selectionPanel.ts`:

```typescript
// After showing the toolbar, if text is long enough, auto-trigger explain
const timerId = setTimeout(() => {
  if (!isWord && selectedText.length > 20) {
    showExplainPanel(selectedText, 'simple')
  }
}, 600) // 600ms debounce after selection
```

### 2. Parallel Tab Pre-Fetching

Currently, tabs are loaded one-at-a-time on click (`loadTab` → `explain` → render). With parallel pre-fetching:

| Change | Location | Description |
|--------|----------|-------------|
| Batch pre-fetch `simple` + `rewrite` | `aiExplain.ts` `showExplainPanel` | When panel opens, fire AI calls for `simple` and `rewrite` simultaneously via `Promise.allSettled`. Cache both results. |
| Priority queue for remaining tabs | `aiExplain.ts` | After the first two render, pre-fetch `vietnamese` and `ielts-vocab` in the background. Remaining low-urgency tabs (`example-sentences`, `quiz`) can wait until clicked or fetched on idle. |
| Loading state improvements | `aiExplain.ts` `renderTab` | Show subtle "ready" indicator on tab buttons whose data is already cached (e.g., dimmed checkmark). Users see which results are available before clicking. |

**Implementation Pattern** — modify `showExplainPanel` in `aiExplain.ts`:

```typescript
// Batch pre-fetch top 2 explain types immediately
async function prefetchPriorityTabs(text: string): Promise<void> {
  const config = await getProviderConfig()
  const priorityTypes: AiExplainType[] = ['simple', 'rewrite']
  const results = await Promise.allSettled(
    priorityTypes.map(type => explain(type, text, () => config!))
  )
  results.forEach((result, i) => {
    const type = priorityTypes[i]
    if (result.status === 'fulfilled' && result.value.data) {
      entries[type].data = result.value.data
      entries[type].loading = false
    }
  })
  // Background pre-fetch secondary types
  prefetchSecondaryTypes(text, config)
}
```

### 3. Persistent Result Cache

| Change | Location | Description |
|--------|----------|-------------|
| Persist explain results to IndexedDB | `packages/ai/src/services/explain.ts` | Extend `AiCache` to support a persistent fallback. When user opens the panel on the same text again, results load instantly from DB instead of re-fetching. |
| LRU eviction with cap | `packages/ai/src/utils/cache.ts` | Keep last 50 unique `type:text` results. Evict oldest on overflow. TTL: 24h (up from 1h). |
| Keyed by text hash | `explain.ts` | Use SHA-256 (or simpler `hashCode`) of normalized text as cache key instead of raw text. Avoids key-length issues. |

### 4. Background Processing via Service Worker

| Change | Location | Description |
|--------|----------|-------------|
| Offload AI calls to background worker | `background/messaging.ts` | Current `loadTab` calls `explain()` directly from the content script. Move AI calls to the background service worker so the panel UI is never blocked. |
| Stream partial results | `background/messaging.ts` | Background worker sends `EXPLAIN_PARTIAL_RESULT` messages as each tab finishes. The panel's `loadTab` listens and updates the UI incrementally. |
| Keep-alive for long-running calls | `background/messaging.ts` | Use `chrome.runtime.connect` port for long-lived connections. The worker stays alive until all pre-fetches complete. |

**Implementation Pattern** — new handler in `messaging.ts`:

```typescript
registerHandler('EXPLAIN_TEXT', async (_msg, sender) => {
  const msg = _msg as ExtensionMessage<'EXPLAIN_TEXT'>
  const { text, types } = msg.payload

  const results = await Promise.allSettled(
    types.map(async (type) => {
      const result = await explain(type, text, getProviderConfig)
      return { type, result }
    })
  )

  for (const r of results) {
    if (r.status === 'fulfilled') {
      chrome.tabs.sendMessage(sender.tab!.id!, {
        type: 'EXPLAIN_RESULT',
        payload: r.value,
      })
    }
  }
})
```

### 5. UI Updates: Instant Loading & Status Indicators

| Change | Location | Description |
|--------|----------|-------------|
| Show panel skeleton immediately | `aiExplain.ts` `createPanel` | When auto-trigger fires, the panel appears with a skeleton/spinner but **no toolbar button click** was needed. The `simple` tab content streams in as soon as the AI responds. |
| Tab readiness dots | `aiExplain.ts` `renderTabs` | Each tab button shows a small status dot: grey (not loaded), spinning (loading), green (ready), red (error). |
| "Explain all" action | `selectionPanel.ts` ACTIONS | Add a single "Explain All" button that triggers all 7 types at once. Results cascade into the panel as they complete. |
| Notification when results ready | `selectionPanel.ts` | If user closes the panel before pre-fetch completes, show a subtle toast: "Explain results ready — click to view". |

### 6. Smart Text Pre-Analysis

| Change | Location | Description |
|--------|----------|-------------|
| Local text complexity analysis | `selectionPanel.ts` `onMouseUp` | Before calling AI, run a lightweight local analysis: word count, average word length, unique vocabulary ratio, presence of academic/IELTS keywords. Use this to decide which explain types to auto-trigger. |
| Language detection | `selectionPanel.ts` | If selected text appears to contain Vietnamese characters, pre-fetch `vietnamese` explain type first instead of `simple`. |

```typescript
function analyzeText(text: string): { isComplex: boolean; hasVietnamese: boolean; wordCount: number } {
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)
  const words = text.split(/\s+/).filter(Boolean)
  return {
    isComplex: words.length > 20 && text.split(',').length > 2,
    hasVietnamese,
    wordCount: words.length,
  }
}
```

---

## Backend Changes Summary

| File | Change |
|------|--------|
| `packages/ai/src/services/explain.ts` | Add persistent IndexedDB cache layer; add hash-based cache key; export batch `explainMany()` for parallel pre-fetch |
| `packages/ai/src/utils/cache.ts` | Add `persist` option flag, LRU eviction, TTL config |
| `apps/extension/src/content-script/aiExplain.ts` | Add auto-trigger in `showExplainPanel`; add pre-fetch queue; add status indicators on tabs; listen for `EXPLAIN_RESULT` messages |
| `apps/extension/src/content-script/selectionPanel.ts` | Add debounced auto-show on text selection; add `autoExplain` setting check; add "Explain All" action |
| `apps/extension/src/background/messaging.ts` | Add `EXPLAIN_TEXT` / `EXPLAIN_RESULT` / `EXPLAIN_PARTIAL_RESULT` handlers for background offload |
| `apps/extension/src/background/index.ts` | No changes needed (context menus remain as-is) |
| `apps/extension/src/popup/components/MiniTutor.tsx` | Add silent background pre-fetch when popup opens with selected text |

## User-Facing Behavior Changes

| Before | After |
|--------|-------|
| Select text → click toolbar "Explain Meaning" → wait → see result | Select text → pause 600ms → panel auto-opens with `simple` already loading |
| Click each tab individually, wait for each | First 2 tabs pre-fetched in parallel; remaining tabs show readiness dots |
| Close panel → reopen same text → re-fetch from AI | Close panel → reopen same text → instant load from persistent cache |
| AI call blocks content script UI | AI calls offloaded to background service worker; UI never freezes |
| No way to get all explain types at once | Single "Explain All" button triggers all 7 types, results stream in |
| Memory-only cache (lost on page refresh) | 24h persistent cache via IndexedDB |
