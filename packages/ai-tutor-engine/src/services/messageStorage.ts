import type { ChatMessage, ChatSnapshot } from '../types'
import type { MessageRepositoryPort } from '../ports/message-repository'
import { chatSnapshotSchema } from '../schemas/chat'
import { generateId } from '../utils/id'

const STORAGE_KEY = 'ai-tutor-chat-memory'
const MAX_MESSAGES = 50

function getDefaultMeta() {
  return {
    totalInteractions: 0,
    acceptedRecommendations: [] as string[],
    dismissedRecommendationIds: [] as string[],
    snoozedRecommendations: [] as Array<{ id: string; until: string }>,
  }
}

function loadSnapshot(): ChatSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const result = chatSnapshotSchema.safeParse(parsed)
      if (result.success) {
        return result.data as ChatSnapshot
      }
    }
  } catch {}
  return null
}

function getOrCreateSnapshot(): ChatSnapshot {
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

function saveSnapshot(snapshot: ChatSnapshot): void {
  snapshot.updatedAt = new Date().toISOString()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {}
}

export class LocalStorageMessageRepository implements MessageRepositoryPort {
  getMessages(): ChatMessage[] {
    return getOrCreateSnapshot().messages
  }

  addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
    const snapshot = getOrCreateSnapshot()
    const msg: ChatMessage = {
      ...message,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    snapshot.messages = [...snapshot.messages, msg].slice(-MAX_MESSAGES)
    snapshot.meta.lastInteractionTime = msg.createdAt
    snapshot.meta.totalInteractions++
    saveSnapshot(snapshot)
    return msg
  }

  setMessages(messages: ChatMessage[]): void {
    const snapshot = getOrCreateSnapshot()
    snapshot.messages = messages.slice(-MAX_MESSAGES)
    saveSnapshot(snapshot)
  }

  clearMessages(): void {
    const snapshot = getOrCreateSnapshot()
    snapshot.messages = []
    saveSnapshot(snapshot)
  }

  addMessagesBulk(newMessages: Omit<ChatMessage, 'id' | 'createdAt'>[]): ChatMessage[] {
    const snapshot = getOrCreateSnapshot()
    const now = new Date().toISOString()
    const added = newMessages.map(msg => ({
      ...msg,
      id: generateId(),
      createdAt: now,
    }))
    snapshot.messages = [...snapshot.messages, ...added].slice(-MAX_MESSAGES)
    if (added.length > 0) {
      snapshot.meta.lastInteractionTime = now
      snapshot.meta.totalInteractions += added.length
    }
    saveSnapshot(snapshot)
    return added
  }

  getLastInteractionTime(): string | undefined {
    return getOrCreateSnapshot().meta.lastInteractionTime
  }

  recordInteraction(): void {
    const now = new Date().toISOString()
    const snapshot = getOrCreateSnapshot()
    snapshot.meta.lastInteractionTime = now
    snapshot.meta.totalInteractions++
    saveSnapshot(snapshot)
  }

  recordOpen(): void {
    const snapshot = getOrCreateSnapshot()
    snapshot.meta.lastOpenedAt = new Date().toISOString()
    saveSnapshot(snapshot)
  }

  getSnapshot(): ChatSnapshot | null {
    return loadSnapshot()
  }

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  exportToJson(): string {
    const snapshot = getOrCreateSnapshot()
    return JSON.stringify(snapshot, null, 2)
  }

  importFromJson(json: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(json)
      const result = chatSnapshotSchema.safeParse(parsed)
      if (!result.success) {
        return { success: false, error: 'Invalid chat data format' }
      }
      localStorage.setItem(STORAGE_KEY, json)
      return { success: true }
    } catch {
      return { success: false, error: 'Invalid JSON format' }
    }
  }

  getTotalInteractions(): number {
    return getOrCreateSnapshot().meta.totalInteractions
  }

  dismissRecommendation(id: string): void {
    const snapshot = getOrCreateSnapshot()
    if (!snapshot.meta.dismissedRecommendationIds.includes(id)) {
      snapshot.meta.dismissedRecommendationIds = [...snapshot.meta.dismissedRecommendationIds, id]
    }
    saveSnapshot(snapshot)
  }

  isRecommendationDismissed(id: string): boolean {
    return getOrCreateSnapshot().meta.dismissedRecommendationIds.includes(id)
  }

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
  }

  isRecommendationSnoozed(id: string): boolean {
    const found = getOrCreateSnapshot().meta.snoozedRecommendations.find(r => r.id === id)
    if (!found) return false
    return new Date(found.until) > new Date()
  }

  getAcceptedRecommendations(): string[] {
    return [...getOrCreateSnapshot().meta.acceptedRecommendations]
  }
}

export const MessageStorage: MessageRepositoryPort = new LocalStorageMessageRepository()

export default MessageStorage
