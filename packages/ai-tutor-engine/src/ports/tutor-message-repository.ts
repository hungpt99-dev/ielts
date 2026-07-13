import type { TutorChatSession, TutorChatMessage } from '../domain/entities/tutor-message'

export interface TutorMessageRepository {
  findSession(sessionId: string): Promise<TutorChatSession | null>
  saveSession(session: TutorChatSession): Promise<void>
  appendMessages(sessionId: string, messages: TutorChatMessage[]): Promise<void>
  getMessages(sessionId: string, limit?: number): Promise<TutorChatMessage[]>
  deleteSession(sessionId: string): Promise<void>
}
