# Automation Design: Selected Text Saving & Categorization

## Current State Summary

Saving text requires **4-8 manual steps** depending on entry point. The three save paths all require explicit category selection: context menu (pick from 8 sub-menus), floating toolbar (pick from 3 buttons → opens popup form with 7+ fields), or extension popup (`SaveTextForm` with textarea, 8-category grid, topic, skill, difficulty, tags, personal note — 7 fields). No AI-driven categorization exists. No background save. No de-duplication across sessions.

---

## Proposed Automation Enhancements

### 1. AI-Powered Automatic Category Prediction

| Change | Location | Description |
|--------|----------|-------------|
| New `classifyText` AI service | `packages/ai/src/services/classify.ts` (new) | Given selected text + page context, returns predicted `SaveCategory`, topic, skill, difficulty, and suggested tags. Prompt engineered with examples for each of the 8 categories. |
| Category prediction schema | `packages/ai/src/schemas/classify.ts` (new) | Zod schema: `{ category: SaveCategory, topic: string, skill: SkillOption, difficulty: DifficultyOption, tags: string[], confidence: number }` |
| Local heuristic fallback | `packages/ai/src/services/classify.ts` | Run local rules first (fast, no API call). Fall back to AI only when heuristics are uncertain (<0.7 confidence). |

**Heuristic classification rules** (no AI cost):
```
Single word (1-2 tokens)                       → category: 'vocabulary'
Long sentence / paragraph (>20 words)           → category: 'sentence'
Contains IELTS task-specific keywords           → category: choose by keyword match
  (e.g., "graph", "chart" → 'writing',
   "discuss", "opinion" → 'speaking',
   "passage", "according to" → 'reading')
Contains error markers                         → category: 'mistake'
  (e.g., "I am go", "he don't" — common error patterns)
Multi-word phrase (3-8 words, no full sentence) → category: 'phrase'
Grammar structure detected                      → category: 'grammar'
  (e.g., "if I had", "it is important that" — subjunctive/conditional patterns)
```

**Implementation Pattern** — new file `packages/ai/src/services/classify.ts`:

```typescript
export interface ClassificationResult {
  category: SaveCategory
  topic: string
  skill: SkillOption
  difficulty: DifficultyOption
  tags: string[]
  confidence: number // 0-1
  method: 'heuristic' | 'ai'
}

export async function classifyText(
  text: string,
  context: { title: string; url: string },
  getConfig: () => ProviderConfig,
): Promise<ClassificationResult> {
  // Step 1: Try heuristic classification
  const heuristic = heuristicClassify(text, context)
  if (heuristic && heuristic.confidence >= 0.7) {
    return { ...heuristic, method: 'heuristic' }
  }

  // Step 2: Fall back to AI
  return aiClassify(text, context, getConfig)
}
```

### 2. One-Click Save from Floating Toolbar

| Change | Location | Description |
|--------|----------|-------------|
| Auto-categorize on toolbar save | `selectionPanel.ts` `saveText()` | When user clicks any save toolbar button, instead of hardcoding the category, run `classifyText()` first. If confidence is high for the clicked button's category, save silently. If AI suggests a different category with higher confidence, use it (surface the override in the toast). |
| "Quick Save" action | `selectionPanel.ts` ACTIONS | New toolbar button with AI icon — single click triggers `classifyText` + `saveText` with the top predicted category. User never touches the popup form. |
| Toast with undo | `selectionPanel.ts` `showToast` | After quick save, show "Saved as {category} ✓" with an undo link (5s timeout). Clicking undo removes the entry. |

```typescript
// Modified saveText in selectionPanel.ts
async function saveTextWithAutoCategory(text: string, preferredCategory?: SaveCategory): Promise<void> {
  const classification = await classifyText(text, {
    title: document.title,
    url: window.location.href,
  }, getProviderConfig)

  const category = classification.confidence > 0.6
    ? classification.category
    : preferredCategory || 'vocabulary'

  const entry = {
    id: crypto.randomUUID(),
    text,
    category,
    topic: classification.topic,
    skill: classification.skill,
    difficulty: classification.difficulty,
    tags: classification.tags,
    pageTitle: document.title,
    pageUrl: window.location.href,
    savedAt: new Date().toISOString(),
    note: '',
  }

  // Save to chrome.storage.local
  await saveToLocalStorage(entry)
  showToast(`Saved as ${CATEGORY_LABELS[category]}`, { undoId: entry.id })
}
```

### 3. Background Save with No Popup

| Change | Location | Description |
|--------|----------|-------------|
| Auto-save on double-tap | `selectionPanel.ts` `onDblClick` | When user double-clicks or double-taps text, auto-save with AI-categorized metadata. No toolbar, no popup — just a subtle toast. |
| Double-tap setting | `storage.ts` settings | `doubleTapQuickSave: boolean` (default: false, opt-in). Respects existing `floatingToolbar` disable. |
| Keyboard shortcut save | `selectionPanel.ts` `onKeyDown` | `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Windows) saves selected text with auto-category. Works even when toolbar is disabled. |

```typescript
function onDblClick(e: MouseEvent): void {
  if (!settings.doubleTapQuickSave) return
  const text = window.getSelection()?.toString().trim()
  if (!text || text.length < 2) return
  saveTextWithAutoCategory(text)
}
```

### 4. Inline Save Panel (Replaces Full Popup Form)

| Change | Location | Description |
|--------|----------|-------------|
| Mini inline save panel | `selectionPanel.ts` | After selection, next to the toolbar, show a mini "Quick Save" panel with: auto-predicted category (editable dropdown), auto-predicted topic (editable text), and a single "Save" button. No full popup form. |
| Auto-fill all metadata | `SaveTextForm.tsx` | When popup opens with selected text, auto-run `classifyText()` and pre-fill every field. User can review/adjust or just click Save. |

**Implementation** — modify `SaveTextForm.tsx` to auto-classify on mount:

```typescript
useEffect(() => {
  if (!pageInfo.selectedText) return
  classifyText(pageInfo.selectedText, {
    title: pageInfo.title,
    url: pageInfo.url,
  }, getProviderConfig).then(result => {
    setForm(prev => ({
      ...prev,
      category: result.category,
      topic: result.topic,
      skill: result.skill,
      difficulty: result.difficulty,
      tags: result.tags.join(', '),
    }))
  })
}, [pageInfo.selectedText])
```

**Inline mini panel** — new element in `selectionPanel.ts`:

```
┌──────────────────────────────────────┐
│ 📝 Quick Save                        │
│──────────────────────────────────────│
│ Category: [ Vocabulary ▼ ]           │
│ Topic:    [ education             ]  │
│──────────────────────────────────────│
│ [✓ Save]                             │
└──────────────────────────────────────┘
```

### 5. Context Menu Enhanced with Auto-Categorization

| Change | Location | Description |
|--------|----------|-------------|
| Smart single-item context menu | `background/index.ts` context menus | Replace the 8-item sub-menu with a single "Save to IELTS Journey" item. On click, auto-classify in background and save. Show "Saved as {category}" notification. |
| "Save to..." sub-menu kept as fallback | `background/index.ts` | Keep the 8-item sub-menu as "Save as..." for users who want to override. Add a divider before it. New structure: `Save to IELTS Journey` (auto) → divider → `Save as Vocabulary`, `Save as Phrase`, etc. |
| Auto-classify in background handler | `background/messaging.ts` | Add `AUTO_SAVE_SELECTION` message type. Background script calls `classifyText`, saves result, notifies content script. |

```
Right-click context menu (new structure):
─────────────────────────────────
  Save to IELTS Journey        ← auto-categorize + save (one click)
  ───────────────────────────
  Save as Vocabulary           ← manual override (original behavior)
  Save as Phrase
  Save as Sentence
  Save as Grammar Note
  Save as Reading Material
  Save as Writing Idea
  Save as Speaking Idea
  Save as Mistake Note
```

### 6. Session-Based Selection Buffer

| Change | Location | Description |
|--------|----------|-------------|
| In-page selection buffer | `content-script/selectionBuffer.ts` (new) | During a browsing session, accumulative buffer that stores multiple selections. Each entry has: text, page context, classification result. User can review and batch-save at the end of the session. |
| Mini buffer indicator | `selectionPanel.ts` | Small floating badge showing count of unsaved buffered selections (e.g., "3"). Click to open a review list. |
| Batch save all | `selectionBuffer.ts` | "Save All" button saves all buffered entries in parallel. "Discard All" clears the buffer. |

```typescript
interface BufferedSelection {
  id: string
  text: string
  pageTitle: string
  pageUrl: string
  selectedAt: string
  classification: ClassificationResult | null
}

class SelectionBuffer {
  private items: BufferedSelection[] = []
  private storageKey = 'selectionBuffer'

  async add(text: string, context: { title: string; url: string }): Promise<void> {
    const result = await classifyText(text, context, getProviderConfig)
    this.items.push({
      id: crypto.randomUUID(),
      text,
      pageTitle: context.title,
      pageUrl: context.url,
      selectedAt: new Date().toISOString(),
      classification: result,
    })
    this.persist()
  }

  async saveAll(): Promise<number> {
    let saved = 0
    for (const item of this.items) {
      await saveEntry(buildEntry(item))
      saved++
    }
    this.items = []
    this.persist()
    return saved
  }
}
```

### 7. Smart De-Duplication

| Change | Location | Description |
|--------|----------|-------------|
| Text hash de-dup on save | `selectionPanel.ts` `saveText()` | Before saving, compute `hashCode(text)` and check against previously saved hashes. If duplicate found with same category, skip save and show "Already saved" toast. If different category, show "Saved to {new_category} (also in {old_category})". |
| Across-store de-dup | `storage-bridge.ts` | Check across `savedItems`, `vocabulary` store, `learningEntries` store for duplicate text content. Normalize (lowercase, trim) before comparison. |
| De-dup configuration | `storage.ts` settings | `deduplicateOnSave: boolean` (default: true). `dedupStrictness: 'exact' | 'normalized' | 'fuzzy'` (default: 'normalized'). |

```typescript
async function isDuplicate(text: string, category: SaveCategory): Promise<boolean> {
  const hash = hashCode(text.toLowerCase().trim())
  const result = await chrome.storage.local.get(['saveHashes'])
  const hashes: Record<string, string[]> = result.saveHashes || {}
  const existing = hashes[hash] || []
  return existing.includes(category)
}
```

### 8. Learning from User Corrections

| Change | Location | Description |
|--------|----------|-------------|
| Track user overrides | `selectionPanel.ts` / `SaveTextForm.tsx` | When user changes an auto-predicted category/topic before saving, record the override: `{ textHash, predicted, chosen, pageUrl, timestamp }`. |
| Classification training store | `storage/classificationStore.ts` (new) | IndexedDB store for override data. Used to adjust heuristic rules locally. |
| Heuristic weight adjustment | `classify.ts` | If a user consistently overrides `vocabulary` → `phrase` for multi-word selections, adjust the heuristic threshold to prefer `phrase` for that text length in the future. Simple frequency-based adjustment — no retraining needed. |

```typescript
interface ClassificationOverride {
  textHash: string
  text: string
  predicted: SaveCategory
  chosen: SaveCategory
  predictedTopic: string
  chosenTopic: string
  pageUrl: string
  timestamp: string
}

async function recordOverride(override: ClassificationOverride): Promise<void> {
  const db = await openClassificationDB()
  await db.add('overrides', override)

  // Adjust heuristic pattern weights locally
  const recentOverrides = await db
    .where('timestamp')
    .above(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .toArray()

  adjustHeuristicWeights(recentOverrides)
}
```

---

## Backend Changes Summary

| File | Change |
|------|--------|
| `packages/ai/src/services/classify.ts` (new) | `classifyText()` — heuristic + AI two-tier classification; `heuristicClassify()` with rule-based category detection; `aiClassify()` with prompt-based fallback; `ClassificationResult` and `ClassificationOverride` interfaces |
| `packages/ai/src/schemas/classify.ts` (new) | Zod schema for AI classification response |
| `packages/ai/src/prompts/classify.ts` (new) | Prompt template for AI category classification with few-shot examples for each of the 8 `SaveCategory` values |
| `apps/extension/src/content-script/selectionPanel.ts` | Replace hardcoded category in `saveText()` with AI classification call; add "Quick Save" toolbar action; add double-tap save handler; add inline mini save panel; add keyboard shortcut listener |
| `apps/extension/src/content-script/selectionBuffer.ts` (new) | Session-based selection buffer — accumulate selections, batch save, show count badge |
| `apps/extension/src/content-script/saveSelectedText.ts` | Add `AUTO_SAVE_SELECTION` message handler; add de-dup logic using `saveHashes` in storage |
| `apps/extension/src/popup/components/SaveTextForm.tsx` | Auto-classify on mount and pre-fill all form fields; highlight auto-predicted fields with a subtle indicator; add override tracking on save |
| `apps/extension/src/background/index.ts` | Restructure context menu: auto-save as first item + sub-menu fallback |
| `apps/extension/src/background/messaging.ts` | Add `AUTO_SAVE_SELECTION` message type for background-side classification |
| `apps/extension/src/storage/classificationStore.ts` (new) | IndexedDB store for `overrides` table; CRUD for override tracking |
| `apps/extension/src/storage/indexedDB.ts` | Add `saveHashes` object store for de-dup keyed by `hashCode(text)` |
| `apps/extension/src/storage/storage.ts` | Add settings: `doubleTapQuickSave`, `deduplicateOnSave`, `dedupStrictness` |

## User-Facing Behavior Changes

| Before | After |
|--------|-------|
| Select text → click save button → popup form opens → pick category (8 buttons) → fill topic, skill, difficulty, tags, note → click Save | Select text → click "Quick Save" → auto-categorized, saved in 1 click with toast confirmation |
| Context menu: right-click → Save to IELTS Journey → pick from 8 sub-categories | Right-click → "Save to IELTS Journey" → auto-categorized and saved instantly (8 sub-menu kept as fallback under divider) |
| Popup opens with empty form, user fills all 7+ fields manually | Popup opens with all fields auto-populated by AI — user just reviews and clicks Save |
| Category, topic, skill, difficulty, tags all manual | All metadata auto-inferred from text content + page context |
| Duplicate saves possible across sessions | De-duplication prevents re-saving the same text in the same category |
| No way to batch-save multiple selections | Selection buffer accumulates picks — "Save All" saves everything at once |
| No way to save via keyboard or gesture | `Cmd+Shift+S` or double-tap for instant background save |
| No learning from user behavior | System records overrides and adjusts local heuristic weights over time |
| Form has no defaults — user always starts blank | Form auto-fills with AI predictions — user only edits if they disagree |
