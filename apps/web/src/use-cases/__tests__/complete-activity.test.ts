import { describe, it, expect, vi } from 'vitest'
import { completeActivityUseCase } from '../complete-activity'

vi.mock('../../services/engineBootstrap', () => ({
  getLearningEngine: vi.fn(() => null),
}))

describe('completeActivityUseCase', () => {
  it('returns error when engine is not initialized', async () => {
    const result = await completeActivityUseCase({
      skill: 'reading',
      topic: 'Test',
      questions: [],
      answers: {},
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Engine not initialized')
  })

  it('returns success when engine completes exercise', async () => {
    const mockEngine = {
      completeExercise: vi.fn().mockResolvedValue({
        status: 'success',
        data: { correctAnswers: 3, totalQuestions: 5 },
      }),
    }
    const mockGetLearningEngine = vi.fn(() => mockEngine)
    vi.mocked(await import('../../services/engineBootstrap')).getLearningEngine = mockGetLearningEngine

    const useCase = await import('../complete-activity')
    const result = await useCase.completeActivityUseCase({
      skill: 'reading',
      topic: 'Test',
      questions: [{ id: 'q1', question: 'Test?', correctAnswer: 'A', explanation: 'Exp' }],
      answers: { q1: 'A' },
      timeSpentMs: 30000,
    })
    expect(result.success).toBe(true)
    expect(result.score).toBe(3)
    expect(result.total).toBe(5)
  })

  it('returns error when engine fails', async () => {
    const mockEngine = {
      completeExercise: vi.fn().mockResolvedValue({
        status: 'failure',
        error: { message: 'Completion failed', code: 'completion_failure', recoverable: true },
      }),
    }
    const mockGetLearningEngine = vi.fn(() => mockEngine)
    vi.mocked(await import('../../services/engineBootstrap')).getLearningEngine = mockGetLearningEngine

    const useCase = await import('../complete-activity')
    const result = await useCase.completeActivityUseCase({
      skill: 'reading',
      topic: 'Test',
      questions: [],
      answers: {},
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe('Completion failed')
  })
})
