// ============================================================
// Local Chat Memory — persists chat state across sessions
// ============================================================

export interface PopupMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface ChatMemoryMeta {
  currentLearningTopic?: string
  lastInteractionTime?: string
  lastOpenedAt?: string
  totalInteractions: number
  acceptedRecommendations: string[]
  dismissedRecommendationIds: string[]
  snoozedRecommendations: Array<{ id: string; until: string }>
}

export interface ChatMemorySnapshot {
  version: number
  messages: PopupMessage[]
  meta: ChatMemoryMeta
  createdAt: string
  updatedAt: string
}

import { generateId } from '../utils'

const MEMORY_KEY = 'ai-tutor-chat-memory'
const MAX_MESSAGES = 50

function getDefaultMeta(): ChatMemoryMeta {
  return {
    totalInteractions: 0,
    acceptedRecommendations: [],
    dismissedRecommendationIds: [],
    snoozedRecommendations: [],
  }
}

function loadSnapshot(): ChatMemorySnapshot | null {
  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMemorySnapshot
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.messages)) {
        return parsed
      }
    }
  } catch {}
  return null
}

function getOrCreateSnapshot(): ChatMemorySnapshot {
  const existing = loadSnapshot()
  if (existing) return existing
  const now = new Date().toISOString()
  return {
    version: 1,
    messages: [],
    meta: getDefaultMeta(),
    createdAt: now,
    updatedAt: now,
  }
}

function saveSnapshot(snapshot: ChatMemorySnapshot): void {
  snapshot.updatedAt = new Date().toISOString()
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(snapshot))
  } catch {}
}

export const LocalChatMemory = {

  getMessages(): PopupMessage[] {
    return getOrCreateSnapshot().messages
  },

  addMessage(message: Omit<PopupMessage, 'id' | 'createdAt'>): PopupMessage {
    const snapshot = getOrCreateSnapshot()
    const msg: PopupMessage = {
      ...message,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    snapshot.messages = [...snapshot.messages, msg].slice(-MAX_MESSAGES)
    snapshot.meta.lastInteractionTime = msg.createdAt
    snapshot.meta.totalInteractions++
    saveSnapshot(snapshot)
    return msg
  },

  setMessages(messages: PopupMessage[]): void {
    const snapshot = getOrCreateSnapshot()
    snapshot.messages = messages.slice(-MAX_MESSAGES)
    saveSnapshot(snapshot)
  },

  clearMessages(): void {
    const snapshot = getOrCreateSnapshot()
    snapshot.messages = []
    saveSnapshot(snapshot)
  },


  getMeta(): ChatMemoryMeta {
    return { ...getOrCreateSnapshot().meta }
  },

  updateMeta(patch: Partial<ChatMemoryMeta>): ChatMemoryMeta {
    const snapshot = getOrCreateSnapshot()
    snapshot.meta = { ...snapshot.meta, ...patch }
    saveSnapshot(snapshot)
    return { ...snapshot.meta }
  },

  getCurrentLearningTopic(): string | undefined {
    return getOrCreateSnapshot().meta.currentLearningTopic
  },

  setCurrentLearningTopic(topic: string | undefined): void {
    this.updateMeta({ currentLearningTopic: topic })
  },

  getLastInteractionTime(): string | undefined {
    return getOrCreateSnapshot().meta.lastInteractionTime
  },

  recordInteraction(): void {
    const now = new Date().toISOString()
    const snapshot = getOrCreateSnapshot()
    snapshot.meta.lastInteractionTime = now
    snapshot.meta.totalInteractions++
    saveSnapshot(snapshot)
  },

  recordOpen(): void {
    this.updateMeta({ lastOpenedAt: new Date().toISOString() })
  },


  acceptRecommendation(id: string): void {
    const snapshot = getOrCreateSnapshot()
    if (!snapshot.meta.acceptedRecommendations.includes(id)) {
      snapshot.meta.acceptedRecommendations = [...snapshot.meta.acceptedRecommendations, id]
    }
    saveSnapshot(snapshot)
  },

  dismissRecommendation(id: string): void {
    const snapshot = getOrCreateSnapshot()
    if (!snapshot.meta.dismissedRecommendationIds.includes(id)) {
      snapshot.meta.dismissedRecommendationIds = [...snapshot.meta.dismissedRecommendationIds, id]
    }
    saveSnapshot(snapshot)
  },

  snoozeRecommendation(id: string, until?: string): void {
    const snapshot = getOrCreateSnapshot()
    const existing = snapshot.meta.snoozedRecommendations.find(r => r.id === id)
    if (existing) {
      existing.until = until ?? new Date(Date.now() + 3600_000).toISOString()
    } else {
      snapshot.meta.snoozedRecommendations = [
        ...snapshot.meta.snoozedRecommendations,
        { id, until: until ?? new Date(Date.now() + 3600_000).toISOString() },
      ]
    }
    saveSnapshot(snapshot)
  },

  isRecommendationDismissed(id: string): boolean {
    return getOrCreateSnapshot().meta.dismissedRecommendationIds.includes(id)
  },

  isRecommendationSnoozed(id: string): boolean {
    const found = getOrCreateSnapshot().meta.snoozedRecommendations.find(r => r.id === id)
    if (!found) return false
    return new Date(found.until) > new Date()
  },

  getAcceptedRecommendations(): string[] {
    return [...getOrCreateSnapshot().meta.acceptedRecommendations]
  },


  clearAll(): void {
    try {
      localStorage.removeItem(MEMORY_KEY)
    } catch {}
  },


  getSnapshot(): ChatMemorySnapshot | null {
    return loadSnapshot()
  },
}

export default LocalChatMemory
