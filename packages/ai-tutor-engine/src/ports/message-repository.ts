import type { ChatMessage, ChatSnapshot } from '../types'

export interface MessageRepositoryPort {
  getMessages(): ChatMessage[]
  addMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage
  setMessages(messages: ChatMessage[]): void
  clearMessages(): void
  addMessagesBulk(newMessages: Omit<ChatMessage, 'id' | 'createdAt'>[]): ChatMessage[]
  getLastInteractionTime(): string | undefined
  recordInteraction(): void
  recordOpen(): void
  getSnapshot(): ChatSnapshot | null
  clearAll(): void
  exportToJson(): string
  importFromJson(json: string): { success: boolean; error?: string }
  getTotalInteractions(): number
  dismissRecommendation(id: string): void
  isRecommendationDismissed(id: string): boolean
  snoozeRecommendation(id: string, until?: string): void
  isRecommendationSnoozed(id: string): boolean
  getAcceptedRecommendations(): string[]
}
