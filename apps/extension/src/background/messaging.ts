import { STORAGE_KEYS } from '@ielts/config'
import type { SaveCategory } from '../types'
import {
  updateDailyProgress,
  setVideoPageInfo,
  setPendingVideoInfo,
  incrementDailyProgress,
} from '../services/storage'
import { emitFromBackground } from './eventEmitters'
import { passageEntryRepo, vocabularyRepo } from '../services/repositories'

const DEBUG = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'

function bgLog(...args: unknown[]): void {
  if (DEBUG) console.debug('[BG Transcript]', ...args)
}

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

export interface FetchTranscriptPayload {
  videoId: string
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
  FETCH_TRANSCRIPT: FetchTranscriptPayload
  FETCH_TRANSCRIPT_XML: { baseUrl: string; videoId: string; language: string }
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

function safeRespond(sendResponse: (response: unknown) => void, response: unknown): void {
  try {
    sendResponse(response)
  } catch {
    // channel closed — e.g. tab navigated away during async handler
  }
  if (chrome.runtime.lastError) {
    // suppress "message channel closed" warning
  }
}

export function handleMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean {
  if (!isKnownMessage(message)) {
    return false
  }

  const handler = handlers.get(message.type)!
  try {
    const result = handler(message, sender)

    if (result instanceof Promise) {
      result
        .then((data) => {
          safeRespond(sendResponse, { success: true, data })
        })
        .catch((err) => {
          console.error(`[messaging] Handler error for ${message.type}:`, err)
          safeRespond(sendResponse, {
            success: false,
            error: 'HANDLER_ERROR',
            message: err instanceof Error ? err.message : 'Unknown error',
          })
        })
      return true
    }

    safeRespond(sendResponse, { success: true, data: result })
    return false
  } catch (err) {
    console.error(`[messaging] Sync handler error for ${message.type}:`, err)
    safeRespond(sendResponse, {
      success: false,
      error: 'HANDLER_ERROR',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
    return false
  }
}

export function initMessaging(): void {
  registerHandler('GET_POPUP_DASHBOARD', async () => {
    const [progressResult, vocabResult] = await Promise.all([
      chrome.storage.local.get([STORAGE_KEYS.extensionLocal.dailyProgress]).catch(() => ({} as Record<string, unknown>)),
      vocabularyRepo.findAll().catch(() => []),
    ])

    const storedProgress = (progressResult as Record<string, unknown>)[STORAGE_KEYS.extensionLocal.dailyProgress] as Record<string, number> | undefined
    const progress = storedProgress || {
      wordsAdded: 0, notesAdded: 0, articlesSaved: 0, notesSaved: 0, reviewDue: 0, streak: 0,
    }

    return {
      vocabularyCount: vocabResult.length,
      dueReviewCount: progress.reviewDue || 0,
      currentStreak: progress.streak || 0,
      wordsAdded: progress.wordsAdded || 0,
      articlesSaved: progress.articlesSaved || 0,
      notesSaved: progress.notesSaved || 0,
    }
  })

  registerHandler('GET_DAILY_PROGRESS', async () => {
    const result = await chrome.storage.local.get([STORAGE_KEYS.extensionLocal.dailyProgress])
    return (
      result.dailyProgress || {
        wordsAdded: 0,
        notesAdded: 0,
        articlesSaved: 0,
        notesSaved: 0,
        reviewDue: 0,
        streak: 0,
      }
    )
  })

  registerHandler('UPDATE_PROGRESS', async (_msg, _sender) => {
    const msg = _msg as ExtensionMessage<'UPDATE_PROGRESS'>
    await updateDailyProgress(msg.payload)
  })

  registerHandler('OPEN_OPTIONS', async () => {
    const targetUrl = chrome.runtime.getURL('app/index.html#/settings')
    try {
      const existingTabs = await chrome.tabs.query({
        url: chrome.runtime.getURL('app/index.html*'),
      })
      if (existingTabs.length > 0) {
        const tab = existingTabs[0]
        if (tab?.id != null && tab?.windowId != null) {
          await chrome.tabs.update(tab.id, { active: true, url: targetUrl })
          await chrome.windows.update(tab.windowId, { focused: true })
        } else if (tab?.id != null) {
          await chrome.tabs.update(tab.id, { active: true, url: targetUrl })
        }
      } else {
        await chrome.tabs.create({ url: targetUrl })
      }
      return { opened: true }
    } catch {
      await chrome.tabs.create({ url: targetUrl })
      return { opened: true }
    }
  })

  registerHandler('OPEN_MAIN_APP', async (_msg) => {
    const msg = _msg as unknown as { type: 'OPEN_MAIN_APP'; route?: string }
    const targetUrl = msg.route
      ? chrome.runtime.getURL(`app/index.html#${msg.route}`)
      : chrome.runtime.getURL('app/index.html#/dashboard')

    try {
      const existingTabs = await chrome.tabs.query({
        url: chrome.runtime.getURL('app/index.html*'),
      })
      if (existingTabs.length > 0) {
        const tab = existingTabs[0]
        if (tab?.id != null && tab?.windowId != null) {
          await chrome.tabs.update(tab.id, { active: true, url: targetUrl })
          await chrome.windows.update(tab.windowId, { focused: true })
        } else if (tab?.id != null) {
          await chrome.tabs.update(tab.id, { active: true, url: targetUrl })
        }
      } else {
        await chrome.tabs.create({ url: targetUrl })
      }
      return { opened: true }
    } catch {
      await chrome.tabs.create({ url: targetUrl })
      return { opened: true }
    }
  })

  registerHandler('VIDEO_PAGE_DETECTED', async (_msg) => {
    const msg = _msg as ExtensionMessage<'VIDEO_PAGE_DETECTED'>
    if (msg.payload?.isVideoPage) {
      await setVideoPageInfo(msg.payload)
    }
  })

  registerHandler('VIDEO_HELPER_OPEN', async (_msg, sender) => {
    const tabId = sender.tab?.id
    if (tabId) {
      try {
        await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_YOUTUBE_LEARNING', payload: true })
      } catch (error) {
        console.error('apps/extension/src/background/messaging.ts error:', error);
        // Content script not ready — fall back to popup
        const msg = _msg as ExtensionMessage<'VIDEO_HELPER_OPEN'>
        await setPendingVideoInfo(msg.payload)
        try {
          await chrome.action.openPopup()
        } catch (error) {
 console.error('apps/extension/src/background/messaging.ts error:', error);
 /* ignore */ }
      }
    }
  })

  registerHandler('MINI_TUTOR_SAVE_RESULT', async (_msg) => {
    const msg = _msg as ExtensionMessage<'MINI_TUTOR_SAVE_RESULT'>
    const now = new Date().toISOString()
    const entryId = msg.payload.id || `ext-${Date.now()}`
    try {
      await passageEntryRepo.bulkUpsert([{
        id: entryId,
        title: (msg.payload.text || '').slice(0, 80),
        content: msg.payload.text,
        createdAt: now,
        updatedAt: now,
      } as Parameters<typeof passageEntryRepo.bulkUpsert>[0][number]]).catch((err) => { console.warn("[BgMsg] save failed:", err) })
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
    } catch (error) {
      console.error('apps/extension/src/background/messaging.ts error:', error);
      /* non-critical */
    }
  })

  registerHandler('SAVE_SELECTION_FULL', async (_msg) => {
    const msg = _msg as ExtensionMessage<'SAVE_SELECTION_FULL'>
    const now = new Date().toISOString()
    const entryId = crypto.randomUUID()
    try {
      await passageEntryRepo.bulkUpsert([{
        id: entryId,
        title: (msg.payload.text || '').slice(0, 80),
        content: msg.payload.text,
        createdAt: now,
        updatedAt: now,
      } as Parameters<typeof passageEntryRepo.bulkUpsert>[0][number]]).catch((err) => { console.warn("[BgMsg] save failed:", err) })

      if (msg.payload.category === 'vocabulary') {
        const word = msg.payload.text.split(/\s+/)[0].replace(/[.,!?;:'"()\-]/g, '')
        await vocabularyRepo.bulkUpsert([{
          id: crypto.randomUUID(),
          word: word || 'unknown',
          sourceSentence: msg.payload.text,
          pageTitle: msg.payload.pageTitle || '',
          pageUrl: msg.payload.pageUrl || '',
          topic: (msg.payload.topic as string) || 'general',
          personalNote: msg.payload.note || '',
          tags: (msg.payload.tags as string[]) || [],
          meaning: word || 'unknown',
          translation: '',
          partOfSpeech: '',
          pronunciation: '',
          exampleSentence: '',
          synonyms: [],
          antonyms: [],
          collocations: [],
          wordFamily: [],
          difficulty: 'medium' as const,
          status: 'new' as const,
          cefrLevel: '',
          ieltsRelevance: '',
          addedToReview: true,
          reviewId: '',
          createdAt: now,
          updatedAt: now,
        }]).catch((err) => { console.warn("[BgMsg] save failed:", err) })
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

  registerHandler('SAVE_YOUTUBE_VOCAB_TO_IDB', async (_msg) => {
    const msg = _msg as { type: string; payload: Record<string, unknown> }
    const { word, sentence, videoTitle, videoUrl } = msg.payload
    const now = new Date().toISOString()
    await vocabularyRepo.bulkUpsert([{
      id: crypto.randomUUID(),
      word: (word as string) ?? '',
      sourceSentence: (sentence as string) ?? '',
      pageTitle: (videoTitle as string) ?? '',
      pageUrl: (videoUrl as string) ?? '',
      topic: 'general',
      personalNote: '',
      tags: [],
      meaning: (word as string) || 'unknown',
      translation: '',
      partOfSpeech: '',
      pronunciation: '',
      exampleSentence: '',
      synonyms: [],
      antonyms: [],
      collocations: [],
      wordFamily: [],
      difficulty: 'medium' as const,
      status: 'new' as const,
      cefrLevel: '',
      ieltsRelevance: '',
      addedToReview: false,
      reviewId: '',
      createdAt: now,
      updatedAt: now,
    }]).catch((err) => { console.warn("[BgMsg] save failed:", err) })
    return { success: true }
  })

  registerHandler('FETCH_TRANSCRIPT', async (_msg, sender) => {
    const msg = _msg as { type: 'FETCH_TRANSCRIPT'; payload: { videoId: string } }
    const { videoId } = msg.payload
    if (!videoId) return { success: false, error: 'NO_VIDEO_ID' }

    let tabId = sender.tab?.id

    if (!tabId) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        const ytTab = tabs.find(t => t.url?.includes('youtube.com/watch') || t.url?.includes('youtu.be'))
        tabId = ytTab?.id
      } catch { /* query failed */ }
    }

    if (tabId) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          world: 'MAIN',
          func: () => {
            try {
              const w = window as any

              let data: any = null

              const scripts = document.querySelectorAll('script')
              for (const script of scripts) {
                const text = script.textContent || ''
                const idx = text.indexOf('ytInitialPlayerResponse')
                if (idx === -1) continue
                const bracePos = text.indexOf('{', idx)
                if (bracePos === -1) continue
                let depth = 0
                let inStr = false
                let esc = false
                for (let i = bracePos; i < text.length; i++) {
                  const ch = text[i]
                  if (esc) { esc = false; continue }
                  if (ch === '\\') { esc = true; continue }
                  if (ch === '"') { inStr = !inStr; continue }
                  if (inStr) continue
                  if (ch === '{') depth++
                  if (ch === '}') depth--
                  if (depth === 0) {
                    try {
                      data = JSON.parse(text.slice(bracePos, i + 1))
                    } catch { /* malformed JSON */ }
                    break
                  }
                }
                if (data) break
              }

              if (!data) {
                const src = document.documentElement.innerHTML
                const idx2 = src.indexOf('ytInitialPlayerResponse')
                if (idx2 !== -1) {
                  const bracePos2 = src.indexOf('{', idx2)
                  if (bracePos2 !== -1) {
                    let depth2 = 0
                    let inStr2 = false
                    let esc2 = false
                    for (let i = bracePos2; i < src.length; i++) {
                      const ch = src[i]
                      if (esc2) { esc2 = false; continue }
                      if (ch === '\\') { esc2 = true; continue }
                      if (ch === '"') { inStr2 = !inStr2; continue }
                      if (inStr2) continue
                      if (ch === '{') depth2++
                      if (ch === '}') depth2--
                      if (depth2 === 0) {
                        try {
                          data = JSON.parse(src.slice(bracePos2, i + 1))
                        } catch { /* ignore */ }
                        break
                      }
                    }
                  }
                }
              }

              if (!data) return null

              const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks
              if (!tracks?.length) return null

              return tracks.map((t: any) => ({
                baseUrl: t.baseUrl || '',
                languageCode: t.languageCode || '',
                name: (t.name?.simpleText) || t.languageCode || '',
                kind: t.kind === 'asr' ? 'auto' : 'manual',
                isTranslatable: !!t.isTranslatable,
                vssId: t.vssId || undefined,
              }))
            } catch {
              return null
            }
          },
        })
        const tracks = results?.[0]?.result as Array<{ baseUrl: string; languageCode: string; name: string; kind: string; isTranslatable: boolean; vssId?: string }> | null
        if (tracks?.length) {
          bgLog('Found', tracks.length, 'caption tracks via script tag parsing')
          return { success: true, data: { tracks } }
        }
      } catch (e) {
        console.error('apps/extension/src/background/messaging.ts error:', e);
        bgLog('Scripting executeScript error:', e)
      }
    }

    return { success: false, error: 'NO_CAPTIONS_EXIST' }
  })

  function parseXmlTranscript(xml: string): Array<{ id: string; start: number; end: number; text: string }> {
    const segments: Array<{ id: string; start: number; end: number; text: string }> = []
    const textBlockRegex = /<text\b([^>]*)>([^<]*)<\/text>/g
    let match
    while ((match = textBlockRegex.exec(xml)) !== null) {
      const attrs = match[1]
      const text = match[2]?.trim()
      if (!text) continue
      const startMatch = attrs.match(/start="([^"]*)"/)
      const durMatch = attrs.match(/dur="([^"]*)"/)
      const start = parseFloat(startMatch?.[1] || '0')
      const dur = parseFloat(durMatch?.[1] || '0')
      segments.push({ id: `xml-seg-${segments.length}`, start, end: start + dur, text })
    }
    return segments
  }

  registerHandler('FETCH_TRANSCRIPT_XML', async (_msg) => {
    const msg = _msg as unknown as { type: 'FETCH_TRANSCRIPT_XML'; payload: { baseUrl: string; videoId: string; language: string } }
    const { baseUrl, videoId, language } = msg.payload
    if (!baseUrl || !videoId) return { success: false, error: 'INVALID_PARAMS' }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10_000)
      const response = await fetch(baseUrl, {
        signal: controller.signal,
        credentials: 'include',
      })
      clearTimeout(timeoutId)

      if (!response.ok) return { success: false, error: 'FETCH_FAILED' }
      const xml = await response.text()
      if (!xml || xml.length < 20) return { success: false, error: 'EMPTY_RESPONSE' }

      const parser = parseXmlTranscript(xml)
      if (!parser.length) return { success: false, error: 'PARSE_FAILED' }
      const segments = parser.map((s, index) => ({ ...s, id: `${videoId}-bg-xml-${index}` }))
      if (!segments.length) return { success: false, error: 'PARSE_FAILED' }

      return {
        success: true,
        data: {
          videoId,
          language,
          source: 'auto-generated',
          segments,
          fullText: segments.map(s => s.text).join(' '),
        },
      }
    } catch (error) {
      console.error('apps/extension/src/background/messaging.ts error:', error);
      return { success: false, error: 'FETCH_EXCEPTION' }
    }
  })

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    return handleMessage(message, sender, sendResponse)
  })
}
