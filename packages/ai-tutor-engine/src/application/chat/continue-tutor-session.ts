import type { TutorChatSession, TutorChatMessage } from '../../domain/entities/tutor-message'
import type { TutorMessageRepository } from '../../ports/tutor-message-repository'

export interface ContinueSessionRequest {
  sessionId: string
  limit?: number
}

export interface ContinueSessionResult {
  session: TutorChatSession | null
  messages: TutorChatMessage[]
}

export async function continueTutorSession(
  request: ContinueSessionRequest,
  repository: TutorMessageRepository,
): Promise<ContinueSessionResult> {
  const session = await repository.findSession(request.sessionId)
  if (!session) {
    return { session: null, messages: [] }
  }

  const messages = await repository.getMessages(request.sessionId, request.limit ?? 50)

  return { session, messages }
}
