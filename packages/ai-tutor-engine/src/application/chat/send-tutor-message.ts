import type { TutorChatRequest, TutorChatResult, TutorChatMessage, TutorChatSession } from '../../domain/entities/tutor-message'
import type { TutorAIClient } from '../../ai/tutor-ai-client'
import type { TutorMessageRepository } from '../../ports/tutor-message-repository'
import type { TutorEventPublisher } from '../../ports/tutor-event-publisher'
import type { LearnerContextBuilder } from '../../context/learner-context-builder'
import { GeneralChatPromptBuilder } from '../../ai/tutor-prompt-builder'
import type { TutorOperationResult } from '../../domain/results/tutor-result'
import type { ClockPort } from '../../ports/clock-port'
import type { LearnerStateSnapshot } from '../../domain/entities/learner-context'
import { summarizeForPrompt } from '../../context/context-summarizer'

export interface SendTutorMessageDependencies {
  aiClient: TutorAIClient
  messageRepository: TutorMessageRepository
  eventPublisher: TutorEventPublisher
  contextBuilder: LearnerContextBuilder
  clock: ClockPort
}

export async function sendTutorMessage(
  request: TutorChatRequest,
  deps: SendTutorMessageDependencies,
): Promise<TutorOperationResult<TutorChatResult>> {
  try {
    const state = await deps.contextBuilder.build(request.contextScope)

    const session = await resolveSession(request, deps.messageRepository, state)

    const contextSummary = summarizeForPrompt([], request.contextScope)

    const promptBuilder = new GeneralChatPromptBuilder()
    const prompt = promptBuilder.build({
      message: request.message,
      state,
      mode: request.mode,
      contextSummary,
    })

    const aiResult = await deps.aiClient.generateStructured<{ response: string }>({
      systemPrompt: prompt.systemPrompt,
      userMessage: prompt.userMessage,
      schema: { response: '' },
    })

    const userMessage: TutorChatMessage = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-user`,
      sessionId: session.id,
      role: 'user',
      content: request.message,
      mode: request.mode,
      createdAt: deps.clock.toISOString(),
    }

    const assistantMessage: TutorChatMessage = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-assistant`,
      sessionId: session.id,
      role: 'assistant',
      content: aiResult.data?.response ?? getFallbackResponse(),
      mode: request.mode,
      createdAt: deps.clock.toISOString(),
    }

    const messages = [userMessage, assistantMessage]
    await deps.messageRepository.appendMessages(session.id, messages)

    const updatedSession = {
      ...session,
      messageCount: session.messageCount + 2,
      lastMessageAt: deps.clock.toISOString(),
    }
    await deps.messageRepository.saveSession(updatedSession)

    if (aiResult.success) {
      return {
        status: 'success',
        data: { sessionId: session.id, messages, suggestedActions: [] },
        metadata: { aiUsed: true, schemaVersion: '1.0' },
      }
    }

    return {
      status: 'partial',
      data: { sessionId: session.id, messages, suggestedActions: [] },
      warnings: [{ code: 'ai_fallback', message: 'AI response was unavailable, used template response' }],
      metadata: { aiUsed: false, schemaVersion: '1.0' },
    }
  } catch (err) {
    return {
      status: 'failure',
      error: {
        code: 'ai_not_configured',
        message: err instanceof Error ? err.message : 'Unknown error',
        recoverable: true,
      },
    }
  }
}

async function resolveSession(
  request: TutorChatRequest,
  repository: TutorMessageRepository,
  _state: LearnerStateSnapshot,
): Promise<TutorChatSession> {
  if (request.sessionId) {
    const existing = await repository.findSession(request.sessionId)
    if (existing) return existing
  }

  const now = new Date().toISOString()
  const session: TutorChatSession = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-session`,
    mode: request.mode,
    title: request.message.slice(0, 50),
    topic: request.contextScope,
    messageCount: 0,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  }

  await repository.saveSession(session)
  return session
}

function getFallbackResponse(): string {
  return 'I understand your question. As your IELTS tutor, I recommend continuing with your current study plan and focusing on your weak areas. Would you like to practice a specific skill or review a topic?'
}
