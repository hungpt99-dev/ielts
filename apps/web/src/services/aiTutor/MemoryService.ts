import { LocalTutorStorage } from '../storage/LocalTutorStorage'
import type {
  TutorMemory,
  MemoryWeakPoint,
  MemoryMistakePattern,
  MemoryFeedbackSummary,
  MemoryGoal,
  UserTutorPreferences,
  ChatMessage,
  ChatSession,
} from '../../models/aiTutorModels'
import { DEFAULT_TUTOR_PREFERENCES } from '../../models/aiTutorModels'

export interface MemoryStats {
  sessionCount: number
  messageCount: number
  reminderCount: number
  savedNoteCount: number
  weakPointCount: number
  mistakePatternCount: number
  feedbackSummaryCount: number
  goalCount: number
  exerciseResultCount: number
  writingFeedbackCount: number
  acceptedRecommendations: number
  learningStreak: number
}

export const MemoryService = {

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return LocalTutorStorage.getMessagesBySession(sessionId)
  },

  async getAllSessions(): Promise<ChatSession[]> {
    return LocalTutorStorage.getAllSessions()
  },

  async deleteSession(sessionId: string): Promise<void> {
    return LocalTutorStorage.deleteSession(sessionId)
  },

  async clearChatHistory(): Promise<void> {
    const sessions = await LocalTutorStorage.getAllSessions()
    await Promise.all(sessions.map(s => LocalTutorStorage.deleteSessionMessages(s.id)))
  },

  async clearSessionMessages(sessionId: string): Promise<void> {
    return LocalTutorStorage.deleteSessionMessages(sessionId)
  },


  async getMemory(): Promise<TutorMemory> {
    return LocalTutorStorage.loadMemory()
  },

  async updateMemory(patch: Partial<TutorMemory>): Promise<TutorMemory> {
    return LocalTutorStorage.patchMemory(patch)
  },

  async addWeakPoint(weakPoint: MemoryWeakPoint): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    memory.weakPoints.push(weakPoint)
    return LocalTutorStorage.saveMemory(memory).then(() => memory)
  },

  async addMistakePattern(pattern: MemoryMistakePattern): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    memory.repeatedMistakePatterns.push(pattern)
    return LocalTutorStorage.saveMemory(memory).then(() => memory)
  },

  async addFeedbackSummary(summary: MemoryFeedbackSummary): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    memory.feedbackSummaries.push(summary)
    return LocalTutorStorage.saveMemory(memory).then(() => memory)
  },

  async addGoal(goal: MemoryGoal): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    memory.goals.push(goal)
    return LocalTutorStorage.saveMemory(memory).then(() => memory)
  },

  async removeWeakPoint(index: number): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    if (index >= 0 && index < memory.weakPoints.length) {
      memory.weakPoints.splice(index, 1)
      await LocalTutorStorage.saveMemory(memory)
    }
    return memory
  },

  async removeMistakePattern(index: number): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    if (index >= 0 && index < memory.repeatedMistakePatterns.length) {
      memory.repeatedMistakePatterns.splice(index, 1)
      await LocalTutorStorage.saveMemory(memory)
    }
    return memory
  },

  async removeFeedbackSummary(index: number): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    if (index >= 0 && index < memory.feedbackSummaries.length) {
      memory.feedbackSummaries.splice(index, 1)
      await LocalTutorStorage.saveMemory(memory)
    }
    return memory
  },

  async removeGoal(goalId: string): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    memory.goals = memory.goals.filter(g => g.id !== goalId)
    await LocalTutorStorage.saveMemory(memory)
    return memory
  },

  async updateGoal(goalId: string, updates: Partial<MemoryGoal>): Promise<TutorMemory> {
    const memory = await LocalTutorStorage.loadMemory()
    const goal = memory.goals.find(g => g.id === goalId)
    if (goal) {
      Object.assign(goal, updates)
      await LocalTutorStorage.saveMemory(memory)
    }
    return memory
  },

  async clearMemoryData(): Promise<void> {
    return LocalTutorStorage.clearMemory()
  },


  async exportMemoryAsJson(): Promise<string> {
    const [memory, preferences, sessions, reminders, notes] = await Promise.all([
      LocalTutorStorage.loadMemory(),
      Promise.resolve(LocalTutorStorage.loadPreferences()),
      LocalTutorStorage.getAllSessions(),
      LocalTutorStorage.getAllReminders().catch(() => []),
      LocalTutorStorage.getAllSavedNotes().catch(() => []),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 1,
      memory,
      preferences,
      sessionCount: sessions.length,
      reminderCount: reminders.length,
      savedNoteCount: notes.length,
    }

    return JSON.stringify(exportData, null, 2)
  },

  async exportAllAsJson(): Promise<string> {
    const data = await LocalTutorStorage.exportJson()
    return data
  },

  async importFromJson(json: string): Promise<{ added: number; errors: string[] }> {
    const parsed = JSON.parse(json)
    if (parsed.memory) {
      await LocalTutorStorage.saveMemory(parsed.memory)
    }
    if (parsed.preferences) {
      LocalTutorStorage.savePreferences(parsed.preferences)
    }
    return { added: 1, errors: [] }
  },


  async getMemoryStats(): Promise<MemoryStats> {
    const [memory, sessions, reminders, notes, stats] = await Promise.all([
      LocalTutorStorage.loadMemory(),
      LocalTutorStorage.getAllSessions(),
      LocalTutorStorage.getAllReminders().catch(() => []),
      LocalTutorStorage.getAllSavedNotes().catch(() => []),
      LocalTutorStorage.getStats().catch(() => ({}) as Record<string, number>),
    ])

    return {
      sessionCount: sessions.length,
      messageCount: stats.chatMessages ?? 0,
      reminderCount: reminders.length,
      savedNoteCount: notes.length,
      weakPointCount: memory.weakPoints.length,
      mistakePatternCount: memory.repeatedMistakePatterns.length,
      feedbackSummaryCount: memory.feedbackSummaries.length,
      goalCount: memory.goals.length,
      exerciseResultCount: stats.exerciseResults ?? 0,
      writingFeedbackCount: stats.writingFeedbacks ?? 0,
      acceptedRecommendations: memory.acceptedRecommendations,
      learningStreak: memory.learningStreak,
    }
  },


  getPreferences(): UserTutorPreferences {
    return LocalTutorStorage.loadPreferences()
  },

  updatePreferences(patch: Partial<UserTutorPreferences>): UserTutorPreferences {
    return LocalTutorStorage.patchPreferences(patch)
  },

  resetPreferences(): void {
    LocalTutorStorage.savePreferences({ ...DEFAULT_TUTOR_PREFERENCES })
  },


  async deleteAllMemory(): Promise<void> {
    return LocalTutorStorage.resetAll()
  },

  async deleteAllAndReset(): Promise<void> {
    await LocalTutorStorage.clearAll()
    LocalTutorStorage.savePreferences({ ...DEFAULT_TUTOR_PREFERENCES })
  },
}

export default MemoryService
