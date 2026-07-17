import { getAITutorEngine } from '../services/engineBootstrap'
import type { TutorChatRequest, TutorChatResult } from '@ielts/ai-tutor-engine'
import type { TutorOperationResult } from '@ielts/ai-tutor-engine'

export interface SendTutorMessageInput {
  message: string
  sessionId?: string
  mode?: 'general-teacher' | 'skill-coach' | 'exam-prep'
  contextScope?: 'general' | 'skill-practice' | 'roadmap' | 'vocabulary-review' | 'mistake-review'
  source?: 'chat' | 'quick-action' | 'proactive' | 'page-context'
}

export interface SendTutorMessageOutput {
  success: boolean
  sessionId?: string
  response?: string
  suggestedActions?: Array<{ type: string; label: string; payload?: Record<string, unknown> }>
  error?: string
}

export async function sendTutorMessageUseCase(
  input: SendTutorMessageInput,
): Promise<SendTutorMessageOutput> {
  const engine = getAITutorEngine()
  if (!engine) {
    return { success: false, error: 'Tutor engine not initialized. Configure AI settings first.' }
  }

  const request: TutorChatRequest = {
    sessionId: input.sessionId,
    message: input.message,
    mode: (input.mode ?? 'general-teacher') as TutorChatRequest['mode'],
    contextScope: (input.contextScope ?? 'general') as TutorChatRequest['contextScope'],
    source: (input.source ?? 'chat') as TutorChatRequest['source'],
  }

  let result: TutorOperationResult<TutorChatResult>
  try {
    result = await engine.chat(request)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Tutor chat failed',
    }
  }

  if (result.status === 'failure' || result.status === 'unavailable') {
    return {
      success: false,
      error: result.error?.message ?? 'Tutor chat failed',
    }
  }

  const lastMessage = result.data?.messages?.[result.data.messages.length - 1]

  return {
    success: true,
    sessionId: result.data?.sessionId,
    response: lastMessage?.content,
    suggestedActions: result.data?.suggestedActions?.map(a => ({
      type: a.type,
      label: a.label,
      payload: a.payload,
    })),
  }
}
