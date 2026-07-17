import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendTutorMessageUseCase } from '../tutor-message'

const mockChat = vi.fn()

vi.mock('../../services/engineBootstrap', () => ({
  getAITutorEngine: vi.fn(() => ({
    chat: mockChat,
  })),
}))

beforeEach(() => {
  mockChat.mockReset()
})

describe('sendTutorMessageUseCase', () => {
  it('returns success with response when chat succeeds', async () => {
    mockChat.mockResolvedValue({
      status: 'success',
      data: {
        sessionId: 'session-abc',
        messages: [
          { role: 'assistant', content: 'Hello! How can I help you with IELTS?' },
        ],
        suggestedActions: [{ type: 'explain', label: 'Explain more' }],
      },
    })

    const result = await sendTutorMessageUseCase({
      message: 'Help me with writing task 2',
    })

    expect(result.success).toBe(true)
    expect(result.sessionId).toBe('session-abc')
    expect(result.response).toBe('Hello! How can I help you with IELTS?')
    expect(result.suggestedActions).toHaveLength(1)
  })

  it('returns error when engine is not initialized', async () => {
    const { getAITutorEngine } = await import('../../services/engineBootstrap')
    vi.mocked(getAITutorEngine).mockReturnValue(null as any)

    const result = await sendTutorMessageUseCase({
      message: 'Hello',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('not initialized')
  })

  it('returns error when chat status is failure', async () => {
    mockChat.mockResolvedValue({
      status: 'failure',
      error: { code: 'ai_failed', message: 'AI service unavailable', recoverable: true },
    })

    const result = await sendTutorMessageUseCase({
      message: 'Test',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('AI service unavailable')
  })

  it('passes through sessionId for conversation continuity', async () => {
    mockChat.mockResolvedValue({
      status: 'success',
      data: {
        sessionId: 'existing-session',
        messages: [{ role: 'assistant', content: 'Continuing conversation' }],
        suggestedActions: [],
      },
    })

    const result = await sendTutorMessageUseCase({
      sessionId: 'existing-session',
      message: 'Tell me more',
    })

    expect(result.success).toBe(true)
    expect(result.sessionId).toBe('existing-session')
  })
})
