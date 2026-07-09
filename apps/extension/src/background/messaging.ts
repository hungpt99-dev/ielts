import type { SaveCategory, LearningEntry } from '../types'
import {
  updateDailyProgress,
  setVideoPageInfo,
  setPendingVideoInfo,
  incrementDailyProgress,
} from '../services/storage'
import { saveEntry } from '../storage/indexedDB'
import { saveVocabularyEntry, type ExtensionVocabEntry } from '../storage/vocabularyStore'
import { emitFromBackground } from './eventEmitters'

export interface SaveItemPayload {
  category: SaveCategory
  text: string
  pageTitle: string
  pageUrl: string
  topic?: string
  skill?: string
  difficulty?: string
  tags?: string[]
  note?: string
}

export interface UpdateProgressPayload {
  wordsAdded?: number
  notesAdded?: number
  articlesSaved?: number
}

export interface VideoPagePayload {
  isVideoPage: boolean
  platform: string
  videoTitle: string
  videoUrl: string
  videoId: string
}

export interface MiniTutorSavePayload {
  id: string
  text: string
  category: SaveCategory
  pageTitle?: string
  pageUrl?: string
}

export interface MiniTutorOpenPayload {
  action: string
  text: string
}

export interface AiExplainPayload {
  text: string
  action: string
  systemPrompt?: string
  userPrompt?: string
}

interface MessageMap {
  GET_DAILY_PROGRESS: undefined
  UPDATE_PROGRESS: UpdateProgressPayload
  OPEN_OPTIONS: undefined
  VIDEO_PAGE_DETECTED: VideoPagePayload
  VIDEO_HELPER_OPEN: VideoPagePayload
  MINI_TUTOR_SAVE_RESULT: MiniTutorSavePayload
  MINI_TUTOR_OPEN_PAGE: MiniTutorOpenPayload
  SAVE_SELECTION_FULL: SaveItemPayload
  AI_EXPLAIN: AiExplainPayload
  MINI_TUTOR_TRIGGER: MiniTutorOpenPayload
}

export type ExtensionMessage<K extends keyof MessageMap = keyof MessageMap> = {
  [P in K]: { type: P; payload: MessageMap[P] }
}[K]

export type MessageHandler = (
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
) => Promise<unknown> | unknown

export type SyncMessageHandler = (
  message: ExtensionMessage,
  sendResponse: (response: unknown) => void,
) => void

const handlers = new Map<string, MessageHandler>()

export function registerHandler(type: string, handler: MessageHandler): void {
  handlers.set(type, handler)
}

export function unregisterHandler(type: string): void {
  handlers.delete(type)
}

function isKnownMessage(msg: unknown): msg is ExtensionMessage {
  if (!msg || typeof msg !== 'object') return false
  const m = msg as Record<string, unknown>
  return typeof m.type === 'string' && handlers.has(m.type)
}

export function handleMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  if (!isKnownMessage(message)) {
    if (message && typeof message === 'object' && 'type' in message) {
      console.warn(`[messaging] Unknown message type: ${(message as Record<string, unknown>).type}`)
    }
    sendResponse({ success: false, error: 'UNKNOWN_MESSAGE_TYPE' })
    return false
  }

  const handler = handlers.get(message.type)!
  try {
    const result = handler(message, sender)

    if (result instanceof Promise) {
      result
        .then((data) => {
          sendResponse({ success: true, data })
        })
        .catch((err) => {
          console.error(`[messaging] Handler error for ${message.type}:`, err)
          sendResponse({
            success: false,
            error: 'HANDLER_ERROR',
            message: err instanceof Error ? err.message : 'Unknown error',
          })
        })
      return true
    }

    sendResponse({ success: true, data: result })
    return false
  } catch (err) {
    console.error(`[messaging] Sync handler error for ${message.type}:`, err)
    sendResponse({
      success: false,
      error: 'HANDLER_ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
    return false
  }
}

export function initMessaging(): void {
  registerHandler('GET_DAILY_PROGRESS', async () => {
    const result = await chrome.storage.local.get(['dailyProgress'])
    return (
      result.dailyProgress || {
        wordsAdded: 0,
        notesAdded: 0,
        articlesSaved: 0,
        reviewDue: 0,
        streak: 0,
      }
    )
  })

  registerHandler('UPDATE_PROGRESS', async (_msg, _sender) => {
    const msg = _msg as ExtensionMessage<'UPDATE_PROGRESS'>
    await updateDailyProgress(msg.payload)
  })

  registerHandler('OPEN_OPTIONS', () => {
    chrome.runtime.openOptionsPage()
  })

  registerHandler('VIDEO_PAGE_DETECTED', async (_msg) => {
    const msg = _msg as ExtensionMessage<'VIDEO_PAGE_DETECTED'>
    if (msg.payload?.isVideoPage) {
      await setVideoPageInfo(msg.payload)
    }
  })

  registerHandler('VIDEO_HELPER_OPEN', async (_msg) => {
    const msg = _msg as ExtensionMessage<'VIDEO_HELPER_OPEN'>
    await setPendingVideoInfo(msg.payload)
  })

  registerHandler('MINI_TUTOR_SAVE_RESULT', async (_msg) => {
    const msg = _msg as ExtensionMessage<'MINI_TUTOR_SAVE_RESULT'>
    const now = new Date().toISOString()
    try {
      const learningEntry: LearningEntry = {
        id: msg.payload.id,
        text: msg.payload.text,
        category: msg.payload.category,
        topic: 'general',
        skill: 'vocabulary',
        difficulty: '',
        tags: [],
        personalNote: '',
        pageTitle: msg.payload.pageTitle || '',
        pageUrl: msg.payload.pageUrl || '',
        status: 'new',
        createdAt: now,
        updatedAt: now,
      }
      await saveEntry(learningEntry)
      await incrementDailyProgress('wordsAdded', 1)

      const sourceUrl = msg.payload.pageUrl || ''
      if (msg.payload.category === 'vocabulary') {
        emitFromBackground({
          eventType: 'extension_vocabulary_saved',
          source: 'extension_popup',
          payload: {
            eventType: 'extension_vocabulary_saved',
            word: msg.payload.text.split(/\s+/)[0] || msg.payload.text,
            contextSnippet: msg.payload.text,
            sourceUrl,
          },
          entityType: 'vocabulary',
          page: sourceUrl,
        })
      } else {
        emitFromBackground({
          eventType: 'extension_selected_text_saved',
          source: 'extension_popup',
          payload: {
            eventType: 'extension_selected_text_saved',
            textSnippet: msg.payload.text,
            sourceUrl,
          },
          entityType: 'selected_text',
          page: sourceUrl,
        })
      }
    } catch {
      /* non-critical */
    }
  })

  registerHandler('SAVE_SELECTION_FULL', async (_msg) => {
    const msg = _msg as ExtensionMessage<'SAVE_SELECTION_FULL'>
    const now = new Date().toISOString()
    try {
      const entry: LearningEntry = {
        id: crypto.randomUUID(),
        text: msg.payload.text,
        category: msg.payload.category,
        topic: msg.payload.topic || 'general',
        skill: (msg.payload.skill || 'general') as LearningEntry['skill'],
        difficulty: (msg.payload.difficulty || '') as LearningEntry['difficulty'],
        tags: msg.payload.tags || [],
        personalNote: msg.payload.note || '',
        pageTitle: msg.payload.pageTitle,
        pageUrl: msg.payload.pageUrl,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      }
      await saveEntry(entry)

      if (msg.payload.category === 'vocabulary') {
        await saveVocabularyEntry({
          id: crypto.randomUUID(),
          word: msg.payload.text.split(/\s+/)[0].replace(/[.,!?;:'"()\-]/g, ''),
          sourceSentence: msg.payload.text,
          pageTitle: msg.payload.pageTitle || '',
          pageUrl: msg.payload.pageUrl || '',
          topic: (msg.payload.topic as string) || 'general',
          personalNote: msg.payload.note || '',
          tags: (msg.payload.tags as string[]) || [],
          meaning: '',
          meaningVi: '',
          partOfSpeech: '',
          pronunciation: '',
          exampleSentence: '',
          synonyms: [],
          antonyms: [],
          collocations: [],
          wordFamily: [],
          difficulty: (msg.payload.difficulty as ExtensionVocabEntry['difficulty']) || '',
          status: 'new',
          addedToReview: true,
          reviewId: '',
          createdAt: now,
          updatedAt: now,
        }).catch(() => {})
      }

      await incrementDailyProgress('wordsAdded', msg.payload.category === 'vocabulary' ? 1 : 0)
    } catch (err) {
      console.error('[messaging] SAVE_SELECTION_FULL handler error:', err)
    }
  })

  registerHandler('MINI_TUTOR_OPEN_PAGE', async (_msg, _sender) => {
    const msg = _msg as ExtensionMessage<'MINI_TUTOR_OPEN_PAGE'>
    const { action, text } = msg.payload
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'MINI_TUTOR_TRIGGER',
        payload: { action, text },
      })
    }
  })

  registerHandler('SYNC_ALL_TO_WEB', async () => {
    try {
      const { getAllVocabulary } = await import('../storage/vocabularyStore')
      const allVocab = await getAllVocabulary()
      if (allVocab.length === 0) {
        return { ok: true, count: 0 }
      }

      const tabs = await chrome.tabs.query({})
      const ieltsTabs = tabs.filter(t => {
        if (!t.id || !t.url) return false
        try { return new URL(t.url).hostname === 'ieltsjourney.dev' }
        catch { return false }
      })
      const targets = ieltsTabs.length > 0 ? ieltsTabs : tabs.filter(t => t.id)

      const batchPayload = allVocab.map(vocab => ({
        entityType: 'vocabulary' as const,
        operation: 'created' as const,
        entityId: vocab.id,
        entity: vocab as unknown as Record<string, unknown>,
        timestamp: new Date().toISOString(),
        messageId: `sync-all-${vocab.id}-${Date.now()}`,
      }))

      await Promise.all(targets.map(tab =>
        chrome.tabs.sendMessage(tab.id!, {
          type: 'FORWARD_DATA_SYNC_BATCH',
          payload: batchPayload,
        }).catch(() => {})
      ))

      return { ok: true, count: allVocab.length }
    } catch (err) {
      console.error('[messaging] SYNC_ALL_TO_WEB handler error:', err)
      return { ok: false, error: String(err) }
    }
  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    return handleMessage(message, sender, sendResponse)
  })
}
