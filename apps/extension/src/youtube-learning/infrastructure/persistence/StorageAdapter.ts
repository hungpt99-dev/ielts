import { safeStorageGet, safeStorageSet } from '../../../utils/safe-chrome'
import type { StudyActivityType } from '../../domain/types'

export type { StudyActivityType }

export interface StudySessionData {
  id: string
  videoId: string
  startTime: string
  activeStudyDuration: number
  watchDuration: number
  wordsViewed: number
  wordsSaved: number
  sentencesSaved: number
  notesCreated: number
  exercisesAttempted: number
  isCompleted: boolean
}

const SESSION_STORAGE_KEY = 'yt-learning-session'
const PANEL_STATE_KEY = 'yt-learning-panel-state'
const VOCAB_STORAGE_KEY = 'yt-learning-vocabulary'
const SENTENCE_STORAGE_KEY = 'yt-learning-sentences'
export class StorageAdapter {
  async getActiveSession(): Promise<StudySessionData | null> {
    try {
      const result = await safeStorageGet<StudySessionData>(SESSION_STORAGE_KEY)
      const data = result?.[SESSION_STORAGE_KEY]
      return data && typeof data === 'object' ? data : null
    } catch {
      return null
    }
  }

  async saveSession(session: StudySessionData): Promise<void> {
    try {
      await safeStorageSet({ [SESSION_STORAGE_KEY]: session })
    } catch {
      console.warn('[IELTS] Failed to save study session')
    }
  }

  async clearSession(): Promise<void> {
    try {
      await safeStorageSet({ [SESSION_STORAGE_KEY]: null })
    } catch {
      console.warn('[IELTS] Failed to clear study session')
    }
  }

  async savePanelState(state: { collapsed: boolean; width: number; activeTab: string }): Promise<void> {
    try {
      await safeStorageSet({ [PANEL_STATE_KEY]: state })
    } catch {
      console.warn('[IELTS] Failed to save panel state')
    }
  }

  async getPanelState(): Promise<{ collapsed: boolean; width: number; activeTab: string } | null> {
    try {
      const result = await safeStorageGet<{ collapsed: boolean; width: number; activeTab: string }>(PANEL_STATE_KEY)
      const data = result?.[PANEL_STATE_KEY]
      return data && typeof data === 'object' ? data : null
    } catch {
      return null
    }
  }

  async saveVocabularyToLocal(vocab: Record<string, unknown>): Promise<void> {
    try {
      const stored = await safeStorageGet<unknown[]>(VOCAB_STORAGE_KEY)
      const raw = stored?.[VOCAB_STORAGE_KEY]
      const items: Record<string, unknown>[] = Array.isArray(raw) ? raw as Record<string, unknown>[] : []
      const idx = items.findIndex((v: Record<string, unknown>) => v.word === vocab.word)
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...vocab, updatedAt: new Date().toISOString() }
      } else {
        items.push({ ...vocab, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      }
      await safeStorageSet({ [VOCAB_STORAGE_KEY]: items })
    } catch {
      // storage unavailable
    }
  }

  async saveSentenceToLocal(sentence: Record<string, unknown>): Promise<void> {
    try {
      const stored = await safeStorageGet<unknown[]>(SENTENCE_STORAGE_KEY)
      const raw = stored?.[SENTENCE_STORAGE_KEY]
      const items: Record<string, unknown>[] = Array.isArray(raw) ? raw as Record<string, unknown>[] : []
      items.push({ ...sentence, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
      await safeStorageSet({ [SENTENCE_STORAGE_KEY]: items })
    } catch {
      // storage unavailable
    }
  }

  async saveVocabularyToWebApp(vocab: Record<string, unknown>): Promise<{ success: boolean; id?: string; error?: string }> {
    await this.saveVocabularyToLocal(vocab)

    try {
      if (window.__IELTS_BRIDGE__?.saveVocabulary) {
        return await window.__IELTS_BRIDGE__.saveVocabulary(vocab)
      }
    } catch {
      // bridge unavailable on YouTube
    }
    const vocabId = typeof vocab.id === 'string' ? vocab.id : crypto.randomUUID()
    return { success: true, id: vocabId }
  }

  async saveSentenceToWebApp(sentence: Record<string, unknown>): Promise<{ success: boolean; id?: string; error?: string }> {
    await this.saveSentenceToLocal(sentence)

    try {
      if (window.__IELTS_BRIDGE__?.saveSentence) {
        return await window.__IELTS_BRIDGE__.saveSentence(sentence)
      }
    } catch {
      // bridge unavailable
    }
    const sentenceId = typeof sentence.id === 'string' ? sentence.id : crypto.randomUUID()
    return { success: true, id: sentenceId }
  }

  async saveNoteToWebApp(note: Record<string, unknown>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (window.__IELTS_BRIDGE__?.saveNote) {
        return await window.__IELTS_BRIDGE__.saveNote(note)
      }
    } catch {
      // bridge unavailable
    }
    const noteId = typeof note.id === 'string' ? note.id : crypto.randomUUID()
    return { success: true, id: noteId }
  }

  async getWebAppSettings(): Promise<Record<string, unknown> | null> {
    try {
      if (window.__IELTS_BRIDGE__?.getSettings) {
        return await window.__IELTS_BRIDGE__.getSettings()
      }
    } catch {
      // bridge unavailable
    }
    return null
  }

  async isWebAppConnected(): Promise<boolean> {
    return !!(typeof window !== 'undefined' && window.__IELTS_BRIDGE__)
  }

  async getVocabByWord(word: string): Promise<Record<string, unknown> | undefined> {
    try {
      const stored = await safeStorageGet<unknown[]>(VOCAB_STORAGE_KEY)
      const raw = stored?.[VOCAB_STORAGE_KEY]
      const items: Record<string, unknown>[] = Array.isArray(raw) ? raw as Record<string, unknown>[] : []
      return items.find((v: Record<string, unknown>) => v.word === word)
    } catch {
      return undefined
    }
  }
}

declare global {
  interface Window {
    __IELTS_BRIDGE__?: {
      saveVocabulary: (data: Record<string, unknown>) => Promise<{ success: boolean; id?: string; error?: string }>
      saveSentence: (data: Record<string, unknown>) => Promise<{ success: boolean; id?: string; error?: string }>
      saveNote: (data: Record<string, unknown>) => Promise<{ success: boolean; id?: string; error?: string }>
      getSettings: () => Promise<Record<string, unknown>>
    }
  }
}
