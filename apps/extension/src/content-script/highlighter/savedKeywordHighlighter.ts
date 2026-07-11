import { injectContentStyles } from '../sharedStyles'
import { injectHighlightStyles, tryRemoveHighlightStyles } from './highlightStyles'
import {
  highlightMatches,
  removeAllHighlights,
  setActive,
  isActive,
  isModifyingDOMForHighlight,
} from './highlightEngine'
import { destroyTooltip } from './highlightTooltip'
import { type HighlightWord } from './highlightMatcher'
import {
  emitExtensionAutoHighlightEnabled,
  emitExtensionAutoHighlightDisabled,
} from '../../background/eventEmitters'

const SETTINGS_KEY = 'extensionSettings'
const VOCAB_STORAGE_KEY = 'vocabulary'
const SAVED_ITEMS_KEY = 'savedItems'

const SCAN_DEBOUNCE_MS = 300
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

interface SavedVocabEntry {
  id: string
  word?: string
  text?: string
  meaning?: string
  translation?: string
  exampleSentence?: string
  personalNote?: string
  note?: string
  category?: string
}

let currentWords: HighlightWord[] = []
let isEnabled = true
let excludedHosts: string[] = []
let observer: MutationObserver | null = null
let scanTimer: ReturnType<typeof setTimeout> | null = null
let isInitialized = false
let retryCount = 0

function isExcludedHost(): boolean {
  const host = window.location.hostname
  return excludedHosts.some(pattern => {
    const normalized = pattern.startsWith('.') ? pattern : `.${pattern}`
    return host === pattern || host.endsWith(normalized)
  })
}

async function loadSettings(): Promise<boolean> {
  try {
    const result = await new Promise<any>(r =>
      chrome.storage.local.get([SETTINGS_KEY], r),
    )
    const settings = result[SETTINGS_KEY] || {}
    excludedHosts = settings.highlightExcludedHosts ?? []
    return settings.autoHighlightSavedVocabulary !== false
  } catch {
    console.debug('[IELTS Journey] Could not load settings, defaulting to enabled')
    excludedHosts = []
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
    meaning: item.meaning || item.translation || '',
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
    console.debug('[IELTS Journey] Could not load vocabulary from storage')
  }

  return Array.from(wordMap.values())
}

function scanPage(root?: Node): void {
  if (!isActive() || currentWords.length === 0 || isExcludedHost()) return

  const target = root ?? document.body
  if (!target) return

  const count = highlightMatches(target, currentWords)
  if (count > 0) {
    console.debug(`[IELTS Journey] Auto-highlight: ${count} matches on page`)
  }
}

function debouncedScan(root?: Node): void {
  if (scanTimer) {
    clearTimeout(scanTimer)
  }
  scanTimer = setTimeout(() => {
    scanPage(root)
    scanTimer = null
    retryCount = 0
  }, SCAN_DEBOUNCE_MS)
}

function isOurHighlightElement(el: Element): boolean {
  return el.classList?.contains('ielts-journey-saved-keyword-highlight')
}

function setupMutationObserver(): void {
  if (observer) observer.disconnect()

  observer = new MutationObserver((mutations) => {
    if (!isActive() || currentWords.length === 0) return
    if (isModifyingDOMForHighlight()) return

    let hasNewContent = false
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element
            if (isOurHighlightElement(el) || el.closest?.('.ielts-journey-saved-keyword-highlight')) {
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

  if (!document.body) {
    console.debug('[IELTS Journey] document.body not ready for observer')
    return
  }

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

async function refreshHighlights(): Promise<void> {
  currentWords = await loadVocabulary()

  removeAllHighlights()

  if (!isActive() || currentWords.length === 0 || isExcludedHost()) return

  if (!document.body) {
    if (retryCount < MAX_RETRIES) {
      retryCount++
      setTimeout(refreshHighlights, RETRY_DELAY_MS)
    }
    return
  }

  scanPage()
  setupMutationObserver()
}

function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
): void {
  if (changes[SETTINGS_KEY]) {
    const newVal = changes[SETTINGS_KEY].newValue || {}
    const enabled = newVal.autoHighlightSavedVocabulary !== false

    const newExcludedHosts: string[] = newVal.highlightExcludedHosts ?? []
    const hostsChanged = JSON.stringify(newExcludedHosts) !== JSON.stringify(excludedHosts)
    if (hostsChanged) {
      excludedHosts = newExcludedHosts
    }

    if (enabled !== isEnabled || hostsChanged) {
      isEnabled = enabled
      setActive(enabled && !isExcludedHost())
      if (enabled && !isExcludedHost()) {
        refreshHighlights()
        emitExtensionAutoHighlightEnabled()
      } else {
        removeAllHighlights()
        destroyTooltip()
        if (observer) {
          observer.disconnect()
          observer = null
        }
        emitExtensionAutoHighlightDisabled()
      }
      console.debug(`[IELTS Journey] Auto-highlight ${enabled ? 'enabled' : 'disabled'}`)
    }
    return
  }

  if (
    changes[VOCAB_STORAGE_KEY] ||
    changes[SAVED_ITEMS_KEY]
  ) {
    console.debug('[IELTS Journey] Vocabulary changed, refreshing highlights')
    refreshHighlights()
  }
}

function onPageUnload(): void {
  destroySavedKeywordHighlighter()
}

export async function initSavedKeywordHighlighter(): Promise<void> {
  if (isInitialized) return
  isInitialized = true

  isEnabled = await loadSettings()
  setActive(isEnabled)

  if (isExcludedHost()) {
    console.debug(`[IELTS Journey] Auto-highlight disabled for host: ${window.location.hostname}`)
    return
  }

  injectContentStyles()
  injectHighlightStyles()

  currentWords = await loadVocabulary()

  if (isActive() && currentWords.length > 0) {
    scanPage()
    setupMutationObserver()
  }

  chrome.storage.onChanged.addListener(onStorageChanged)
  window.addEventListener('beforeunload', onPageUnload)

  console.debug(`[IELTS Journey] Auto-highlight initialized (${currentWords.length} words)`)
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
  window.removeEventListener('beforeunload', onPageUnload)
}

export function getHighlightedWords(): HighlightWord[] {
  return [...currentWords]
}

initSavedKeywordHighlighter()

export {}
