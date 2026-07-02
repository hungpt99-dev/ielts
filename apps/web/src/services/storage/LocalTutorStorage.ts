import Dexie, { type Table } from 'dexie'
import type {
  ChatSession,
  ChatMessage,
  TutorMemory,
  UserTutorPreferences,
  Reminder,
  ProactiveSuggestion,
  SavedAiNote,
  WritingFeedbackRecord,
  ExerciseResult,
  TutorExportData,
} from '../../models/aiTutorModels'
import { DEFAULT_TUTOR_PREFERENCES, createDefaultTutorMemory } from '../../models/aiTutorModels'

const DB_NAME = 'ielts-tutor'
const DB_VERSION = 1

const TUTOR_STORAGE_KEY = 'ielts-tutor-preferences'
const TUTOR_MEMORY_KEY = 'ielts-tutor-memory-legacy'


export class TutorStorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'TutorStorageError'
  }
}


export interface ITutorDatabase {
  chatSessions: Table<ChatSession, string>
  chatMessages: Table<ChatMessage, string>
  tutorMemory: Table<TutorMemory, string>
  reminders: Table<Reminder, string>
  savedAiNotes: Table<SavedAiNote, string>
  proactiveSuggestions: Table<ProactiveSuggestion, string>
  exerciseResults: Table<ExerciseResult, string>
  writingFeedbacks: Table<WritingFeedbackRecord, string>
}

export class TutorDatabase extends Dexie implements ITutorDatabase {
  chatSessions!: Table<ChatSession, string>
  chatMessages!: Table<ChatMessage, string>
  tutorMemory!: Table<TutorMemory, string>
  reminders!: Table<Reminder, string>
  savedAiNotes!: Table<SavedAiNote, string>
  proactiveSuggestions!: Table<ProactiveSuggestion, string>
  exerciseResults!: Table<ExerciseResult, string>
  writingFeedbacks!: Table<WritingFeedbackRecord, string>

  constructor() {
    super(DB_NAME)

    this.version(DB_VERSION).stores({
      chatSessions: 'id, mode, topic, lastMessageAt, isPinned, createdAt',
      chatMessages: 'id, sessionId, role, mode, createdAt',
      tutorMemory: 'id',
      reminders: 'id, type, isEnabled, createdAt',
      savedAiNotes: 'id, type, sessionId, createdAt',
      proactiveSuggestions: 'id, type, isAccepted, createdAt',
      exerciseResults: 'id, sessionId, type, createdAt',
      writingFeedbacks: 'id, sessionId, createdAt',
    })
  }
}

let dbInstance: TutorDatabase | null = null

export function getTutorDb(): TutorDatabase {
  if (!dbInstance) {
    dbInstance = new TutorDatabase()
  }
  return dbInstance
}

export function destroyTutorDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

async function safeTutorDb<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw new TutorStorageError(
      `Tutor storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error,
    )
  }
}


function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      return JSON.parse(raw) as T
    }
  } catch {}
  return defaultValue
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to write tutor setting "${key}" to localStorage:`, e)
  }
}

function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error(`Failed to remove tutor setting "${key}" from localStorage:`, e)
  }
}


export const LocalTutorStorage = {

  loadPreferences(): UserTutorPreferences {
    return getLocal(TUTOR_STORAGE_KEY, { ...DEFAULT_TUTOR_PREFERENCES })
  },

  savePreferences(prefs: UserTutorPreferences): void {
    setLocal(TUTOR_STORAGE_KEY, prefs)
  },

  patchPreferences(patch: Partial<UserTutorPreferences>): UserTutorPreferences {
    const current = this.loadPreferences()
    const merged = { ...current, ...patch }
    this.savePreferences(merged)
    return merged
  },

  clearPreferences(): void {
    removeLocal(TUTOR_STORAGE_KEY)
  },


  async loadMemory(): Promise<TutorMemory> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      const memory = await db.table('tutorMemory').get('tutor-memory') as TutorMemory | undefined
      if (memory) return memory
      const legacy = getLocal<TutorMemory | null>(TUTOR_MEMORY_KEY, null)
      if (legacy) {
        await db.table('tutorMemory').put(legacy)
        removeLocal(TUTOR_MEMORY_KEY)
        return legacy
      }
      return createDefaultTutorMemory()
    })
  },

  async saveMemory(memory: TutorMemory): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      memory.updatedAt = new Date().toISOString()
      await db.table('tutorMemory').put(memory)
    })
  },

  async patchMemory(patch: Partial<TutorMemory>): Promise<TutorMemory> {
    const current = await this.loadMemory()
    const merged = { ...current, ...patch, updatedAt: new Date().toISOString() }
    await this.saveMemory(merged)
    return merged
  },

  async clearMemory(): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.table('tutorMemory').delete('tutor-memory')
      removeLocal(TUTOR_MEMORY_KEY)
    })
  },


  async getAllSessions(): Promise<ChatSession[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.chatSessions.orderBy('lastMessageAt').reverse().toArray()
    })
  },

  async getSessionById(id: string): Promise<ChatSession | undefined> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.chatSessions.get(id)
    })
  },

  async getSessionsByMode(mode: string): Promise<ChatSession[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.chatSessions.where('mode').equals(mode).reverse().sortBy('lastMessageAt')
    })
  },

  async getPinnedSessions(): Promise<ChatSession[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.chatSessions.where('isPinned').equals(1).reverse().sortBy('lastMessageAt')
    })
  },

  async createSession(
    data: Omit<ChatSession, 'id' | 'messageCount' | 'lastMessageAt' | 'createdAt' | 'updatedAt'>,
  ): Promise<ChatSession> {
    return safeTutorDb(async () => {
      const now = new Date().toISOString()
      const session: ChatSession = {
        ...data,
        id: crypto.randomUUID(),
        messageCount: 0,
        lastMessageAt: now,
        tags: data.tags || [],
        createdAt: now,
        updatedAt: now,
      }
      const db = getTutorDb()
      await db.chatSessions.put(session)
      return session
    })
  },

  async updateSession(id: string, changes: Partial<ChatSession>): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.chatSessions.update(id, { ...changes, updatedAt: new Date().toISOString() })
    })
  },

  async deleteSession(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.chatMessages.where('sessionId').equals(id).delete()
      await db.chatSessions.delete(id)
    })
  },

  async pinSession(id: string, pinned: boolean): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.chatSessions.update(id, { isPinned: pinned, updatedAt: new Date().toISOString() })
    })
  },

  async searchSessions(query: string): Promise<ChatSession[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      const all = await db.chatSessions.toArray()
      const lower = query.toLowerCase()
      return all.filter(
        s =>
          s.title.toLowerCase().includes(lower) ||
          (s.topic && s.topic.toLowerCase().includes(lower)) ||
          s.tags.some(t => t.toLowerCase().includes(lower)),
      )
    })
  },


  async getMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.chatMessages.where('sessionId').equals(sessionId).sortBy('createdAt')
    })
  },

  async getRecentMessages(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      const all = await db.chatMessages
        .where('sessionId')
        .equals(sessionId)
        .reverse()
        .sortBy('createdAt')
      return all.slice(0, limit).reverse()
    })
  },

  async addMessage(
    data: Omit<ChatMessage, 'id' | 'createdAt'>,
  ): Promise<ChatMessage> {
    return safeTutorDb(async () => {
      const now = new Date().toISOString()
      const message: ChatMessage = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
      }
      const db = getTutorDb()
      await db.chatMessages.put(message)
      const session = await db.chatSessions.get(data.sessionId)
      await db.chatSessions.update(data.sessionId, {
        messageCount: (session?.messageCount ?? 0) + 1,
        lastMessageAt: now,
        updatedAt: now,
      })
      return message
    })
  },

  async deleteMessage(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.chatMessages.delete(id)
    })
  },

  async deleteSessionMessages(sessionId: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.chatMessages.where('sessionId').equals(sessionId).delete()
      await db.chatSessions.update(sessionId, {
        messageCount: 0,
        updatedAt: new Date().toISOString(),
      })
    })
  },

  async markMessageAsSaved(messageId: string, noteId: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.chatMessages.update(messageId, { savedAsNoteId: noteId })
    })
  },


  async getAllReminders(): Promise<Reminder[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.reminders.toArray()
    })
  },

  async getEnabledReminders(): Promise<Reminder[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.reminders.where('isEnabled').equals(1).toArray()
    })
  },

  async getRemindersByType(type: string): Promise<Reminder[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.reminders.where('type').equals(type).toArray()
    })
  },

  async addReminder(
    data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Reminder> {
    return safeTutorDb(async () => {
      const now = new Date().toISOString()
      const reminder: Reminder = {
        ...data,
        id: crypto.randomUUID(),
        repeatDays: data.repeatDays || [],
        createdAt: now,
        updatedAt: now,
      }
      const db = getTutorDb()
      await db.reminders.put(reminder)
      return reminder
    })
  },

  async updateReminder(id: string, changes: Partial<Reminder>): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.reminders.update(id, { ...changes, updatedAt: new Date().toISOString() })
    })
  },

  async deleteReminder(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.reminders.delete(id)
    })
  },

  async toggleReminder(id: string, enabled: boolean): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.reminders.update(id, { isEnabled: enabled, updatedAt: new Date().toISOString() })
    })
  },


  async getAllSuggestions(): Promise<ProactiveSuggestion[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.proactiveSuggestions.orderBy('createdAt').reverse().toArray()
    })
  },

  async getPendingSuggestions(): Promise<ProactiveSuggestion[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      const all = await db.proactiveSuggestions.toArray()
      return all.filter(s => !s.isAccepted && !s.isDismissed).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    })
  },

  async addSuggestion(
    data: Omit<ProactiveSuggestion, 'id' | 'createdAt'>,
  ): Promise<ProactiveSuggestion> {
    return safeTutorDb(async () => {
      const suggestion: ProactiveSuggestion = {
        ...data,
        id: crypto.randomUUID(),
        isAccepted: false,
        isDismissed: false,
        createdAt: new Date().toISOString(),
      }
      const db = getTutorDb()
      await db.proactiveSuggestions.put(suggestion)
      return suggestion
    })
  },

  async acceptSuggestion(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.proactiveSuggestions.update(id, { isAccepted: true })
    })
  },

  async dismissSuggestion(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.proactiveSuggestions.update(id, { isDismissed: true })
    })
  },

  async deleteSuggestion(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.proactiveSuggestions.delete(id)
    })
  },


  async getAllSavedNotes(): Promise<SavedAiNote[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.savedAiNotes.orderBy('createdAt').reverse().toArray()
    })
  },

  async getSavedNotesByType(type: string): Promise<SavedAiNote[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.savedAiNotes.where('type').equals(type).reverse().sortBy('createdAt')
    })
  },

  async getSavedNotesBySession(sessionId: string): Promise<SavedAiNote[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.savedAiNotes.where('sessionId').equals(sessionId).sortBy('createdAt')
    })
  },

  async addSavedNote(
    data: Omit<SavedAiNote, 'id' | 'createdAt'>,
  ): Promise<SavedAiNote> {
    return safeTutorDb(async () => {
      const note: SavedAiNote = {
        ...data,
        id: crypto.randomUUID(),
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
      }
      const db = getTutorDb()
      await db.savedAiNotes.put(note)
      return note
    })
  },

  async deleteSavedNote(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.savedAiNotes.delete(id)
    })
  },


  async getAllWritingFeedbacks(): Promise<WritingFeedbackRecord[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.writingFeedbacks.orderBy('createdAt').reverse().toArray()
    })
  },

  async getWritingFeedbacksBySession(sessionId: string): Promise<WritingFeedbackRecord[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.writingFeedbacks.where('sessionId').equals(sessionId).sortBy('createdAt')
    })
  },

  async addWritingFeedback(
    data: Omit<WritingFeedbackRecord, 'id' | 'createdAt'>,
  ): Promise<WritingFeedbackRecord> {
    return safeTutorDb(async () => {
      const feedback: WritingFeedbackRecord = {
        ...data,
        id: crypto.randomUUID(),
        grammarIssues: data.grammarIssues || [],
        vocabularyIssues: data.vocabularyIssues || [],
        createdAt: new Date().toISOString(),
      }
      const db = getTutorDb()
      await db.writingFeedbacks.put(feedback)
      return feedback
    })
  },

  async deleteWritingFeedback(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.writingFeedbacks.delete(id)
    })
  },


  async getAllExerciseResults(): Promise<ExerciseResult[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.exerciseResults.orderBy('createdAt').reverse().toArray()
    })
  },

  async getExerciseResultsBySession(sessionId: string): Promise<ExerciseResult[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.exerciseResults.where('sessionId').equals(sessionId).sortBy('createdAt')
    })
  },

  async getExerciseResultsByType(type: string): Promise<ExerciseResult[]> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      return await db.exerciseResults.where('type').equals(type).reverse().sortBy('createdAt')
    })
  },

  async addExerciseResult(
    data: Omit<ExerciseResult, 'id' | 'createdAt'>,
  ): Promise<ExerciseResult> {
    return safeTutorDb(async () => {
      const result: ExerciseResult = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      const db = getTutorDb()
      await db.exerciseResults.put(result)
      return result
    })
  },

  async deleteExerciseResult(id: string): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await db.exerciseResults.delete(id)
    })
  },


  async getStats(): Promise<Record<string, number>> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      const [sessions, messages, reminders, notes, suggestions, exercises, feedbacks] =
        await Promise.all([
          db.chatSessions.count(),
          db.chatMessages.count(),
          db.reminders.count(),
          db.savedAiNotes.count(),
          db.proactiveSuggestions.count(),
          db.exerciseResults.count(),
          db.writingFeedbacks.count(),
        ])
      return {
        chatSessions: sessions,
        chatMessages: messages,
        reminders,
        savedAiNotes: notes,
        proactiveSuggestions: suggestions,
        exerciseResults: exercises,
        writingFeedbacks: feedbacks,
      }
    })
  },


  async exportAll(): Promise<TutorExportData> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      const [chatSessions, chatMessages, reminders, savedAiNotes,
        proactiveSuggestions, exerciseResults, writingFeedbacks] = await Promise.all([
        db.chatSessions.toArray(),
        db.chatMessages.toArray(),
        db.reminders.toArray(),
        db.savedAiNotes.toArray(),
        db.proactiveSuggestions.toArray(),
        db.exerciseResults.toArray(),
        db.writingFeedbacks.toArray(),
      ])
      const tutorMemory = await this.loadMemory()
      return {
        version: DB_VERSION,
        exportedAt: new Date().toISOString(),
        chatSessions,
        chatMessages,
        tutorMemory,
        userPreferences: this.loadPreferences(),
        reminders,
        proactiveSuggestions,
        savedAiNotes,
        exerciseResults,
        writingFeedbacks,
      }
    })
  },

  async importAll(data: TutorExportData): Promise<{ added: number; errors: string[] }> {
    return safeTutorDb(async () => {
      const result = { added: 0, errors: [] as string[] }
      const db = getTutorDb()

      await db.transaction('rw', [
        'chatSessions',
        'chatMessages',
        'reminders',
        'savedAiNotes',
        'proactiveSuggestions',
        'exerciseResults',
        'writingFeedbacks',
      ], async () => {
        const ops = [
          db.chatSessions.bulkAdd(data.chatSessions as never[]),
          db.chatMessages.bulkAdd(data.chatMessages as never[]),
          db.reminders.bulkAdd(data.reminders as never[]),
          db.savedAiNotes.bulkAdd(data.savedAiNotes as never[]),
          db.proactiveSuggestions.bulkAdd(data.proactiveSuggestions as never[]),
          db.exerciseResults.bulkAdd(data.exerciseResults as never[]),
          db.writingFeedbacks.bulkAdd(data.writingFeedbacks as never[]),
        ]
        await Promise.all(ops)
        result.added =
          data.chatSessions.length +
          data.chatMessages.length +
          data.reminders.length +
          data.savedAiNotes.length +
          data.proactiveSuggestions.length +
          data.exerciseResults.length +
          data.writingFeedbacks.length
      })

      if (data.tutorMemory) {
        await this.saveMemory(data.tutorMemory)
      }
      this.savePreferences(data.userPreferences)

      return result
    })
  },

  async exportJson(): Promise<string> {
    const data = await this.exportAll()
    return JSON.stringify(data, null, 2)
  },

  async importJson(json: string): Promise<{ added: number; errors: string[] }> {
    const data = JSON.parse(json) as TutorExportData
    return await this.importAll(data)
  },


  async clearAll(): Promise<void> {
    return safeTutorDb(async () => {
      const db = getTutorDb()
      await Promise.all([
        db.chatSessions.clear(),
        db.chatMessages.clear(),
        db.reminders.clear(),
        db.savedAiNotes.clear(),
        db.proactiveSuggestions.clear(),
        db.exerciseResults.clear(),
        db.writingFeedbacks.clear(),
      ])
      removeLocal(TUTOR_STORAGE_KEY)
      removeLocal(TUTOR_MEMORY_KEY)
    })
  },

  async resetAll(): Promise<void> {
    await this.clearAll()
    this.savePreferences({ ...DEFAULT_TUTOR_PREFERENCES })
  },
}

export default LocalTutorStorage
