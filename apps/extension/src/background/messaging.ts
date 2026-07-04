import type { SaveCategory } from '../types'
import type { SharedSettingsPatch } from '@ielts/settings'
import {
  updateDailyProgress,
  setVideoPageInfo,
  setPendingVideoInfo,
  addSavedItem,
} from '../services/storage'

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
  SETTINGS_SYNC: SharedSettingsPatch
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
    await addSavedItem(msg.payload as unknown as Record<string, unknown>)
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

  registerHandler('SETTINGS_SYNC', async (_msg) => {
    const msg = _msg as ExtensionMessage<'SETTINGS_SYNC'>
    const { syncFromWebsite } = await import('./settingsStorage')
    await syncFromWebsite(msg.payload)
  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    return handleMessage(message, sender, sendResponse)
  })
}
