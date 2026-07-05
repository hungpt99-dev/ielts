import type { SaveCategory } from '../types'
import { showProactiveMessage } from './proactiveMessagePanel'

interface SavePayload {
  text: string
  category: SaveCategory
  pageTitle: string
  pageUrl: string
}

const savedVocabKeys = new Set<string>()
const RECENT_WINDOW = 60_000

let lastVocabTime = 0
let vocabCountSinceLastMessage = 0

function getVocabKey(text: string): string {
  return text.trim().toLowerCase().slice(0, 50)
}

function isDuplicateVocab(text: string): boolean {
  const key = getVocabKey(text)
  if (savedVocabKeys.has(key)) return true
  savedVocabKeys.add(key)
  setTimeout(() => savedVocabKeys.delete(key), RECENT_WINDOW)
  return false
}

function showVocabSavedMessage(text: string): void {
  const word = text.split(/\s+/)[0].replace(/[.,!?;:'"()\-]/g, '')

  vocabCountSinceLastMessage++

  let title: string
  let message: string

  if (vocabCountSinceLastMessage === 1) {
    title = 'New Vocab Saved!'
    message = `You saved "${word}". Don't forget to review it later in your vocabulary list to make it stick.`
  } else if (vocabCountSinceLastMessage <= 3) {
    title = `${vocabCountSinceLastMessage} Words Saved`
    message = `Great progress! You've saved ${vocabCountSinceLastMessage} new words. Review them when you get a chance.`
  } else {
    title = 'Building Your Vocabulary'
    message = `You've saved ${vocabCountSinceLastMessage} new words this session. Regular review is the key to remembering them.`
  }

  showProactiveMessage({
    id: `vocab-save-${Date.now()}`,
    title,
    message,
    category: 'vocabulary-review',
    priority: 'low',
    action: {
      type: 'open-view',
      label: 'Review Now',
      payload: { view: 'vocabulary' },
    },
  })
}

export function handleVocabSaved(text: string): void {
  const now = Date.now()

  if (now - lastVocabTime > RECENT_WINDOW) {
    vocabCountSinceLastMessage = 0
  }

  lastVocabTime = now

  if (isDuplicateVocab(text)) return

  showVocabSavedMessage(text)
}

function isVocabCategory(category: string): boolean {
  return category === 'vocabulary'
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || typeof message !== 'object') return false
  const msg = message as Record<string, unknown>

  if (msg.type === 'SAVE_SELECTION_FULL' && msg.payload) {
    const payload = msg.payload as SavePayload
    if (isVocabCategory(payload.category)) {
      handleVocabSaved(payload.text)
    }
    return false
  }

  if (msg.type === 'VOCAB_SAVED' && msg.payload) {
    const payload = msg.payload as { text?: string; word?: string }
    const text = payload.text || payload.word || ''
    if (text) {
      handleVocabSaved(text)
    }
    return false
  }

  return false
})

export {}
