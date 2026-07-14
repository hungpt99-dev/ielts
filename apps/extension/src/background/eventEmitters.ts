/**
 * Extension Learning Event Emitters
 *
 * Provides helper functions to emit typed learning events from extension
 * actions (content script, popup, and background contexts).
 *
 * Architecture:
 * - Content scripts use window.postMessage to send events directly to
 *   the web page's ExtensionEventBridge listener, which forwards them
 *   to the LearningEventBus.
 * - Popup and background contexts use chrome.tabs.sendMessage to relay
 *   events to content scripts, which then post them to the page.
 *
 * All functions are safe: failures never break the originating action.
 */

// ─── Event data shared across all contexts ───────────────────────────────────

export interface ExtensionLearningEventData {
  eventType: string
  source: 'extension_popup' | 'extension_content_script'
  payload: Record<string, unknown>
  page?: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, string>
}

const BRIDGE_SOURCE = 'ielts-extension'
const BRIDGE_ACTION = 'LEARNING_EVENT'
const CS_MESSAGE_TYPE = 'EXTENSION_LEARNING_EVENT'

// ─── Core emit functions (context-aware) ─────────────────────────────────────

/**
 * Unified emit: tries content-script postMessage first, then falls back
 * to chrome.tabs.sendMessage for popup / background contexts.
 */
export function emitExtensionLearningEvent(
  data: ExtensionLearningEventData,
): void {
  if (tryPostToPage(data)) return
  tryBroadcastToTabs(data)
}

/** Emit from a content script (runs in-page, can postMessage directly). */
export function emitFromContentScript(
  data: ExtensionLearningEventData,
): void {
  tryPostToPage(data)
}

/** Emit from the popup (sends to active tab's content script). */
export function emitFromPopup(data: ExtensionLearningEventData): void {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return
      chrome.tabs
        .sendMessage(tabs[0].id, { type: CS_MESSAGE_TYPE, payload: data })
        .catch(() => {})
    })
  } catch (error) {
    console.error('apps/extension/src/background/eventEmitters.ts error:', error);
    /* chrome.tabs not available */
  }
}

/** Emit from the background script (broadcasts to all tabs). */
export function emitFromBackground(data: ExtensionLearningEventData): void {
  tryBroadcastToTabs(data)
}

// ─── Individual event emitters ──────────────────────────────────────────────

/** Popup was opened (call from popup App mount). */
export function emitExtensionPopupOpened(): void {
  emitFromPopup({
    eventType: 'extension_popup_opened',
    source: 'extension_popup',
    payload: { eventType: 'extension_popup_opened' },
    entityType: 'extension',
    page: '/popup',
  })
}

/** Selected text was detected / panel shown (call from selection panel). */
export function emitExtensionSelectedTextDetected(
  textSnippet: string,
  sourceUrl: string,
): void {
  emitFromContentScript({
    eventType: 'extension_selected_text_detected',
    source: 'extension_content_script',
    payload: {
      eventType: 'extension_selected_text_detected',
      textSnippet,
      sourceUrl,
    },
    entityType: 'selected_text',
    page: sourceUrl,
    metadata: { source: 'selection_panel' },
  })
}

/** Vocabulary word saved from the extension (call from save handler). */
export function emitExtensionVocabularySaved(
  word: string,
  contextSnippet: string,
  sourceUrl: string,
): void {
  emitFromContentScript({
    eventType: 'extension_vocabulary_saved',
    source: 'extension_content_script',
    payload: {
      eventType: 'extension_vocabulary_saved',
      word,
      contextSnippet,
      sourceUrl,
    },
    entityType: 'vocabulary',
    entityId: word,
    page: sourceUrl,
  })
}

/** Selected text saved from the extension (non-vocabulary save). */
export function emitExtensionSelectedTextSaved(
  textSnippet: string,
  sourceUrl: string,
): void {
  emitFromContentScript({
    eventType: 'extension_selected_text_saved',
    source: 'extension_content_script',
    payload: {
      eventType: 'extension_selected_text_saved',
      textSnippet,
      sourceUrl,
    },
    entityType: 'selected_text',
    page: sourceUrl,
  })
}

/** Article / page saved from the extension. */
export function emitExtensionArticleSaved(
  title: string,
  sourceUrl: string,
): void {
  emitFromContentScript({
    eventType: 'extension_article_saved',
    source: 'extension_content_script',
    payload: {
      eventType: 'extension_article_saved',
      title,
      sourceUrl,
    },
    entityType: 'article',
    page: sourceUrl,
  })
}

/** Selected text was explained by AI (call from AI explain). */
export function emitExtensionSelectedTextExplained(
  textSnippet: string,
  sourceUrl: string,
): void {
  emitFromContentScript({
    eventType: 'extension_selected_text_explained',
    source: 'extension_content_script',
    payload: {
      eventType: 'extension_selected_text_explained',
      textSnippet,
      sourceUrl,
    },
    entityType: 'selected_text',
    page: sourceUrl,
    metadata: { source: 'ai_explain_panel' },
  })
}

/** Selected text was simplified by AI (call from AI explain). */
export function emitExtensionSelectedTextSimplified(
  textSnippet: string,
  sourceUrl: string,
): void {
  emitFromContentScript({
    eventType: 'extension_selected_text_simplified',
    source: 'extension_content_script',
    payload: {
      eventType: 'extension_selected_text_simplified',
      textSnippet,
      sourceUrl,
    },
    entityType: 'selected_text',
    page: sourceUrl,
    metadata: { source: 'ai_explain_panel' },
  })
}

/** Auto-highlight was enabled (call from savedKeywordHighlighter). */
export function emitExtensionAutoHighlightEnabled(): void {
  emitFromContentScript({
    eventType: 'extension_auto_highlight_enabled',
    source: 'extension_content_script',
    payload: { eventType: 'extension_auto_highlight_enabled' },
    entityType: 'extension',
  })
}

/** Auto-highlight was disabled (call from savedKeywordHighlighter). */
export function emitExtensionAutoHighlightDisabled(): void {
  emitFromContentScript({
    eventType: 'extension_auto_highlight_disabled',
    source: 'extension_content_script',
    payload: { eventType: 'extension_auto_highlight_disabled' },
    entityType: 'extension',
  })
}

/** Vocabulary review started from the extension popup. */
export function emitExtensionVocabularyReviewStarted(
  dueCount: number,
): void {
  emitFromPopup({
    eventType: 'extension_vocabulary_review_started',
    source: 'extension_popup',
    payload: {
      eventType: 'extension_vocabulary_review_started',
      dueCount,
    },
    entityType: 'vocabulary',
    page: '/popup/review',
  })
}

/** AI Tutor opened from the extension popup. */
export function emitExtensionAITutorOpened(): void {
  emitFromPopup({
    eventType: 'extension_ai_tutor_opened',
    source: 'extension_popup',
    payload: { eventType: 'extension_ai_tutor_opened' },
    entityType: 'ai_tutor',
    page: '/popup/ai-tutor',
  })
}

// ─── Internals ───────────────────────────────────────────────────────────────

function tryPostToPage(data: ExtensionLearningEventData): boolean {
  try {
    if (typeof window !== 'undefined' && typeof window.postMessage === 'function') {
      window.postMessage(
        { source: BRIDGE_SOURCE, action: BRIDGE_ACTION, data },
        window.location.origin,
      )
      return true
    }
  } catch (error) {
    console.error('apps/extension/src/background/eventEmitters.ts error:', error);
    /* not in content-script context */
  }
  return false
}

function tryBroadcastToTabs(data: ExtensionLearningEventData): void {
  try {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue
        chrome.tabs
          .sendMessage(tab.id, { type: CS_MESSAGE_TYPE, payload: data })
          .catch(() => {})
      }
    })
  } catch (error) {
    console.error('apps/extension/src/background/eventEmitters.ts error:', error);
    /* chrome.tabs not available */
  }
}
