import { injectContentStyles } from '../sharedStyles'
import { injectHighlightStyles, tryRemoveHighlightStyles } from './highlightStyles'
import {
  highlightMatches,
  removeAllHighlights,
  setActive,
  isActive,
} from './highlightEngine'
import { destroyTooltip } from './highlightTooltip'
import { type HighlightWord } from './highlightMatcher'

const SETTINGS_KEY = 'extensionSettings'
const VOCAB_STORAGE_KEY = 'vocabulary'
const SAVED_ITEMS_KEY = 'savedItems'

interface SavedVocabEntry {
  id: string
  word?: string
  text?: string
  meaning?: string
  meaningVi?: string
  exampleSentence?: string
  personalNote?: string
  note?: string
  category?: string
}

let currentWords: HighlightWord[] = []
let isEnabled = true
let observer: MutationObserver | null = null
let scanTimer: ReturnType<typeof setTimeout> | null = null
let isInitialized = false

async function loadSettings(): Promise<boolean> {
  try {
    const result = await new Promise<any>(r =>
      chrome.storage.sync.get([SETTINGS_KEY], r),
    )
    const settings = result[SETTINGS_KEY] || {}
    return settings.autoHighlightSavedVocabulary !== false
  } catch {
    return true
  }
}

function normalizeVocabEntry(
  item: SavedVocabEntry,
): HighlightWord | null {
  const text = item.word || item.text || ''
  if (!text.trim()) return null

  return {
    id: item.id,
    text: text.trim(),
    meaning: item.meaning || item.meaningVi || '',
    exampleSentence: item.exampleSentence || '',
    personalNote: item.personalNote || item.note || '',
  }
}

async function loadVocabulary(): Promise<HighlightWord[]> {
  const wordMap = new Map<string, HighlightWord>()

  try {
    const localResult = await new Promise<any>(r =>
      chrome.storage.local.get([VOCAB_STORAGE_KEY, SAVED_ITEMS_KEY], r),
    )

    const vocabList: SavedVocabEntry[] = localResult[VOCAB_STORAGE_KEY] || []
    for (const item of vocabList) {
      const entry = normalizeVocabEntry(item)
      if (entry) wordMap.set(entry.id, entry)
    }

    const savedItems: SavedVocabEntry[] = localResult[SAVED_ITEMS_KEY] || []
    for (const item of savedItems) {
      if (
        item.category === 'vocabulary' ||
        item.category === 'phrase'
      ) {
        const entry = normalizeVocabEntry(item)
        if (entry && !wordMap.has(entry.id)) {
          wordMap.set(entry.id, entry)
        }
      }
    }
  } catch {
    /* ignore storage errors */
  }

  return Array.from(wordMap.values())
}

function scanPage(): void {
  if (!isActive() || currentWords.length === 0) return

  const count = highlightMatches(document.body, currentWords)
  if (count > 0) {
    // highlighted successfully
  }
}

function debouncedScan(): void {
  if (scanTimer) {
    clearTimeout(scanTimer)
  }
  scanTimer = setTimeout(() => {
    scanPage()
    scanTimer = null
  }, 300)
}

function setupMutationObserver(): void {
  if (observer) observer.disconnect()

  observer = new MutationObserver((mutations) => {
    if (!isActive() || currentWords.length === 0) return

    let hasNewContent = false
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element
            if (
              el.matches?.(
                `.${'ielts-journey-saved-keyword-highlight'}, .${'ielts-journey-saved-keyword-highlight'} *`,
              )
            ) {
              continue
            }
            if (
              el.closest?.(
                `script, style, iframe, svg, textarea, input, select, button`,
              )
            ) {
              continue
            }
            hasNewContent = true
            break
          }
        }
      }
      if (hasNewContent) break
    }

    if (hasNewContent) {
      debouncedScan()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

async function refreshHighlights(): Promise<void> {
  currentWords = await loadVocabulary()

  removeAllHighlights()

  if (!isActive() || currentWords.length === 0) return

  scanPage()
  setupMutationObserver()
}

function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
): void {
  if (changes[SETTINGS_KEY]) {
    const newVal = changes[SETTINGS_KEY].newValue || {}
    const enabled = newVal.autoHighlightSavedVocabulary !== false

    if (enabled !== isEnabled) {
      isEnabled = enabled
      setActive(enabled)
      if (enabled) {
        refreshHighlights()
      } else {
        removeAllHighlights()
        destroyTooltip()
        if (observer) {
          observer.disconnect()
          observer = null
        }
      }
    }
    return
  }

  if (
    changes[VOCAB_STORAGE_KEY] ||
    changes[SAVED_ITEMS_KEY]
  ) {
    refreshHighlights()
  }
}

export async function initSavedKeywordHighlighter(): Promise<void> {
  if (isInitialized) return
  isInitialized = true

  isEnabled = await loadSettings()
  setActive(isEnabled)

  injectContentStyles()
  injectHighlightStyles()

  currentWords = await loadVocabulary()

  if (isActive() && currentWords.length > 0) {
    scanPage()
    setupMutationObserver()
  }

  chrome.storage.onChanged.addListener(onStorageChanged)
}

export function destroySavedKeywordHighlighter(): void {
  isInitialized = false
  removeAllHighlights()
  destroyTooltip()
  tryRemoveHighlightStyles()

  if (observer) {
    observer.disconnect()
    observer = null
  }

  if (scanTimer) {
    clearTimeout(scanTimer)
    scanTimer = null
  }

  chrome.storage.onChanged.removeListener(onStorageChanged)
}

export function getHighlightedWords(): HighlightWord[] {
  return [...currentWords]
}

initSavedKeywordHighlighter()

export {}
