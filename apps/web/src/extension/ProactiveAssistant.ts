// ============================================================
// Extension Proactive Assistant
// ============================================================
//
// Local-first proactive tutor assistant for the browser extension.
// Triggers helpful suggestions from user actions in the browser
// without requiring a backend or cloud push service.
//
// IMPORTANT LIMITATIONS:
// - This module ONLY fires when the extension content script is
//   active on a page (i.e., the extension is installed and the
//   content script has loaded).
// - It does NOT read full page content silently — only detects
//   user-initiated actions (text selection, page URL patterns)
//   and minimal metadata (page title, URL).
// - Without a backend push service, it cannot deliver messages
//   when the user's browser is closed or the extension is
//   disabled.
// - No data is sent to any external server. All processing is
//   local to the user's browser.
// - Proactive suggestions can be fully disabled by the user.

import { proactiveMessageEngine } from '../services/ProactiveMessageEngine'
import type {
  ProactiveMessage,
  ProactiveMessageCategory,
  ProactiveMessageTriggerType,
  ProactiveMessageAction,
} from '../services/ProactiveMessageEngine'
import { LocalChatMemory } from '../services/LocalChatMemory'
import { generateId } from '../utils'

// ── Extension-Specific Trigger Types ────────────────────────

export type ExtensionProactiveTrigger =
  | 'text_selected'
  | 'youtube_opened'
  | 'word_saved'
  | 'article_detected'

// ── Assistant Suggestion ─────────────────────────────────────

export interface ExtensionProactiveSuggestion {
  id: string
  trigger: ExtensionProactiveTrigger
  title: string
  message: string
  action?: ProactiveMessageAction
  category: ProactiveMessageCategory
  source?: {
    text?: string
    url?: string
    title?: string
    word?: string
  }
  createdAt: string
}

// ── Settings ─────────────────────────────────────────────────

export interface ExtensionProactiveSettings {
  enabled: boolean
  textSelectionSuggestions: boolean
  youtubeSuggestions: boolean
  articleSuggestions: boolean
  wordSavedSuggestions: boolean
  maxSuggestionsPerSession: number
  cooldownMinutes: number
}

export const DEFAULT_EXTENSION_PROACTIVE_SETTINGS: ExtensionProactiveSettings = {
  enabled: true,
  textSelectionSuggestions: true,
  youtubeSuggestions: true,
  articleSuggestions: true,
  wordSavedSuggestions: true,
  maxSuggestionsPerSession: 5,
  cooldownMinutes: 30,
}

const SETTINGS_KEY = 'ielts-extension-proactive-settings'
const SUGGESTION_LOG_KEY = 'ielts-extension-proactive-log'

// ── Helpers ──────────────────────────────────────────────────

function loadSettings(): ExtensionProactiveSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ExtensionProactiveSettings>
      return { ...DEFAULT_EXTENSION_PROACTIVE_SETTINGS, ...parsed }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_EXTENSION_PROACTIVE_SETTINGS }
}

function saveSettings(settings: ExtensionProactiveSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

// ── Cooldown / Suggestion tracking ──────────────────────────

interface SuggestionLogEntry {
  trigger: ExtensionProactiveTrigger
  timestamp: string
}

function getSuggestionLog(): SuggestionLogEntry[] {
  try {
    const raw = localStorage.getItem(SUGGESTION_LOG_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function addToSuggestionLog(trigger: ExtensionProactiveTrigger): void {
  try {
    const log = getSuggestionLog()
    log.push({ trigger, timestamp: new Date().toISOString() })
    const recent = log.filter(e => {
      const age = Date.now() - new Date(e.timestamp).getTime()
      return age < 86_400_000
    })
    localStorage.setItem(SUGGESTION_LOG_KEY, JSON.stringify(recent.slice(-50)))
  } catch { /* ignore */ }
}

function isOnCooldown(trigger: ExtensionProactiveTrigger, settings: ExtensionProactiveSettings): boolean {
  const log = getSuggestionLog()
  const recent = log.filter(e => e.trigger === trigger)
  if (recent.length === 0) return false
  const latest = new Date(recent[recent.length - 1].timestamp).getTime()
  return Date.now() - latest < settings.cooldownMinutes * 60_000
}

function getSessionSuggestionCount(): number {
  const log = getSuggestionLog()
  const today = new Date().toISOString().slice(0, 10)
  return log.filter(e => e.timestamp.slice(0, 10) === today).length
}

// ── Integration helpers ─────────────────────────────────────

function mapTriggerToEngineType(trigger: ExtensionProactiveTrigger): ProactiveMessageTriggerType {
  switch (trigger) {
    case 'text_selected': return 'topic_practice_suggestion'
    case 'youtube_opened': return 'new_content_saved'
    case 'word_saved': return 'due_review'
    case 'article_detected': return 'new_content_saved'
  }
}

// ── Language detection (lightweight, client-side) ───────────

const ENGLISH_CHAR_THRESHOLD = 0.6
const NON_ENGLISH_RANGES = [
  [0x3040, 0x309F], // Hiragana
  [0x30A0, 0x30FF], // Katakana
  [0x4E00, 0x9FFF], // CJK Unified Ideographs
  [0xAC00, 0xD7AF], // Hangul
  [0x0600, 0x06FF], // Arabic
  [0x0400, 0x04FF], // Cyrillic
  [0x0E00, 0x0E7F], // Thai
  [0x1C00, 0x1C4F], // Lepcha (Tibeto-Burman)
]

function isLikelyEnglish(text: string): boolean {
  if (!text || text.length < 3) return false
  let englishChars = 0
  let totalChars = 0
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0
    const isNonEnglish = NON_ENGLISH_RANGES.some(([start, end]) => code >= start && code <= end)
    if (!isNonEnglish && /[a-zA-Z]/.test(char)) {
      englishChars++
    }
    totalChars++
  }
  return totalChars > 0 && englishChars / totalChars >= ENGLISH_CHAR_THRESHOLD
}

function detectVideoPlatform(url: string): 'youtube' | 'other' | null {
  try {
    const hostname = new URL(url).hostname
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    }
    return null
  } catch {
    return null
  }
}

function looksLikeArticle(text: string): boolean {
  if (!text || text.length < 200) return false
  const sentenceCount = (text.match(/[.!?]+/g) ?? []).length
  return sentenceCount >= 5
}

// ══════════════════════════════════════════════════════════════
// Extension Proactive Assistant
// ══════════════════════════════════════════════════════════════

export class ExtensionProactiveAssistant {
  private settings: ExtensionProactiveSettings = { ...DEFAULT_EXTENSION_PROACTIVE_SETTINGS }
  private initialized = false
  private seenSuggestions = new Set<string>()
  private pageMetadata = {
    title: '',
    url: '',
    textContent: '',
  }

  // ── Initialization ───────────────────────────────────────────

  initialize(): void {
    if (this.initialized) return
    this.settings = loadSettings()
    this.initialized = true
  }

  destroy(): void {
    this.seenSuggestions.clear()
    this.initialized = false
  }

  // ── Settings ─────────────────────────────────────────────────

  getSettings(): ExtensionProactiveSettings {
    return { ...this.settings }
  }

  updateSettings(patch: Partial<ExtensionProactiveSettings>): ExtensionProactiveSettings {
    this.settings = { ...this.settings, ...patch }
    saveSettings(this.settings)
    return { ...this.settings }
  }

  isEnabled(): boolean {
    return this.settings.enabled
  }

  // ── Page Metadata (set once per page, does NOT read full DOM) ─

  setPageMeta(title: string, url: string): void {
    this.pageMetadata.title = title
    this.pageMetadata.url = url
  }

  setPageTextContent(text: string): void {
    this.pageMetadata.textContent = text
  }

  // ── Suggestion Generators ────────────────────────────────────

  onTextSelected(selectedText: string): ExtensionProactiveSuggestion | null {
    if (!this.settings.enabled || !this.settings.textSelectionSuggestions) return null
    if (!selectedText || selectedText.length < 3) return null
    if (!isLikelyEnglish(selectedText)) return null
    if (isOnCooldown('text_selected', this.settings)) return null
    if (getSessionSuggestionCount() >= this.settings.maxSuggestionsPerSession) return null
    const suggestion: ExtensionProactiveSuggestion = {
      id: generateId(),
      trigger: 'text_selected',
      title: 'Learn from This Text',
      message: 'Want me to explain this and save useful vocabulary for your IELTS study?',
      action: {
        type: 'action',
        label: 'Explain & Save',
        payload: { text: selectedText, action: 'explain-and-save' },
      },
      category: 'vocabulary-review',
      source: { text: selectedText.slice(0, 200) },
      createdAt: new Date().toISOString(),
    }

    if (this.isRecentlyDismissed(suggestion.id)) return null

    this.seenSuggestions.add(suggestion.id)
    addToSuggestionLog('text_selected')
    this.storeAsProactiveMessage(suggestion)
    return suggestion
  }

  onYouTubePage(): ExtensionProactiveSuggestion | null {
    if (!this.settings.enabled || !this.settings.youtubeSuggestions) return null
    if (isOnCooldown('youtube_opened', this.settings)) return null
    if (getSessionSuggestionCount() >= this.settings.maxSuggestionsPerSession) return null

    const suggestion: ExtensionProactiveSuggestion = {
      id: generateId(),
      trigger: 'youtube_opened',
      title: 'Turn This Video into Practice',
      message: 'Paste the transcript and I can create a listening exercise or vocabulary list from this video.',
      action: {
        type: 'navigate',
        label: 'Save Transcript',
        payload: { path: '/listening', source: 'youtube' },
      },
      category: 'saved-content',
      source: { url: this.pageMetadata.url, title: this.pageMetadata.title },
      createdAt: new Date().toISOString(),
    }

    this.seenSuggestions.add(suggestion.id)
    addToSuggestionLog('youtube_opened')
    this.storeAsProactiveMessage(suggestion)
    return suggestion
  }

  onWordSaved(word: string): ExtensionProactiveSuggestion | null {
    if (!this.settings.enabled || !this.settings.wordSavedSuggestions) return null
    if (!word) return null
    if (isOnCooldown('word_saved', this.settings)) return null
    if (getSessionSuggestionCount() >= this.settings.maxSuggestionsPerSession) return null

    const suggestion: ExtensionProactiveSuggestion = {
      id: generateId(),
      trigger: 'word_saved',
      title: `Create a Quiz for "${word}"`,
      message: `I can create a mini quiz from this word to help you remember it better.`,
      action: {
        type: 'action',
        label: 'Generate Quiz',
        payload: { word, action: 'generate-quiz' },
      },
      category: 'vocabulary-review',
      source: { word },
      createdAt: new Date().toISOString(),
    }

    this.seenSuggestions.add(suggestion.id)
    addToSuggestionLog('word_saved')
    this.storeAsProactiveMessage(suggestion)
    return suggestion
  }

  onArticlePage(): ExtensionProactiveSuggestion | null {
    if (!this.settings.enabled || !this.settings.articleSuggestions) return null
    if (isOnCooldown('article_detected', this.settings)) return null
    if (getSessionSuggestionCount() >= this.settings.maxSuggestionsPerSession) return null

    const text = this.pageMetadata.textContent
    if (!looksLikeArticle(text)) return null
    if (!isLikelyEnglish(text.slice(0, 500))) return null

    const suggestion: ExtensionProactiveSuggestion = {
      id: generateId(),
      trigger: 'article_detected',
      title: 'Use This Article for IELTS Reading',
      message: 'This looks useful for IELTS Reading. Save it and I can turn it into reading comprehension questions.',
      action: {
        type: 'navigate',
        label: 'Save Article',
        payload: { path: '/reading', url: this.pageMetadata.url, title: this.pageMetadata.title },
      },
      category: 'saved-content',
      source: { url: this.pageMetadata.url, title: this.pageMetadata.title },
      createdAt: new Date().toISOString(),
    }

    this.seenSuggestions.add(suggestion.id)
    addToSuggestionLog('article_detected')
    this.storeAsProactiveMessage(suggestion)
    return suggestion
  }

  // ── Context-based trigger ────────────────────────────────────

  detectAndSuggest(): ExtensionProactiveSuggestion | null {
    if (!this.settings.enabled) return null
    if (getSessionSuggestionCount() >= this.settings.maxSuggestionsPerSession) return null

    const url = this.pageMetadata.url
    const platform = detectVideoPlatform(url)

    if (platform === 'youtube') {
      return this.onYouTubePage()
    }

    const text = this.pageMetadata.textContent
    if (text && looksLikeArticle(text) && isLikelyEnglish(text.slice(0, 500))) {
      return this.onArticlePage()
    }

    return null
  }

  // ── Integration with ProactiveMessageEngine ─────────────────

  private storeAsProactiveMessage(suggestion: ExtensionProactiveSuggestion): void {
    const msg: ProactiveMessage = {
      id: suggestion.id,
      triggerType: mapTriggerToEngineType(suggestion.trigger),
      category: suggestion.category,
      title: suggestion.title,
      message: suggestion.message,
      priority: 'low',
      action: suggestion.action,
      isRead: false,
      isDismissed: false,
      isSnoozed: false,
      createdAt: suggestion.createdAt,
    }

    proactiveMessageEngine.addExternalMessage(msg)
  }

  // ── Dismissal tracking via LocalChatMemory ────────────────────

  isRecentlyDismissed(suggestionKey: string): boolean {
    return LocalChatMemory.isRecommendationDismissed(suggestionKey)
  }

  markSuggestionSeen(suggestion: ExtensionProactiveSuggestion): void {
    this.seenSuggestions.add(suggestion.id)
  }

  dismissSuggestion(suggestion: ExtensionProactiveSuggestion): void {
    this.seenSuggestions.add(suggestion.id)
    LocalChatMemory.dismissRecommendation(suggestion.id)
  }

  // ── Privacy: Clear metadata ──────────────────────────────────

  clearPageData(): void {
    this.pageMetadata = { title: '', url: '', textContent: '' }
  }

  // ── Reset ────────────────────────────────────────────────────

  resetSession(): void {
    this.seenSuggestions.clear()
    try {
      localStorage.removeItem(SUGGESTION_LOG_KEY)
    } catch { /* ignore */ }
  }
}

// ── Singleton ──────────────────────────────────────────────────

export const extensionProactiveAssistant = new ExtensionProactiveAssistant()
export default extensionProactiveAssistant
