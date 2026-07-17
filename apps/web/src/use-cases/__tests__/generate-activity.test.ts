import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateActivityUseCase } from '../generate-activity'

vi.mock('../../services/engineBootstrap', () => ({
  getLearningEngine: vi.fn(() => null),
}))

describe('generateActivityUseCase', () => {
  it('returns error when engine is not initialized', async () => {
    const result = await generateActivityUseCase({
      skill: 'reading',
      description: 'Practice reading comprehension',
      difficulty: 'medium',
      availableMinutes: 20,
      topic: 'Education',
    })
    expect(result.content).toBeNull()
    expect(result.error).toBe('Engine not initialized')
  })

  it('returns content when engine generates activity', async () => {
    const mockEngine = {
      generateActivity: vi.fn().mockResolvedValue({
        status: 'success',
        data: {
          activity: {
            exercise: {
              title: 'Test Exercise',
              content: { passage: 'Test passage', text: 'Test passage' },
              instructions: 'Read and answer',
              questions: [
                { id: 'q1', type: 'multiple-choice', question: 'Test?', options: ['A', 'B', 'C'], correctIndex: 0, explanation: 'Test' },
              ],
            },
          },
        },
      }),
    }
    const mockGetLearningEngine = vi.fn(() => mockEngine)
    vi.mocked(await import('../../services/engineBootstrap')).getLearningEngine = mockGetLearningEngine

    const useCase = await import('../generate-activity')
    const result = await useCase.generateActivityUseCase({
      skill: 'reading',
      description: 'Practice reading comprehension',
      difficulty: 'medium',
      availableMinutes: 20,
    })
    expect(result.content).toBeTruthy()
    expect(result.error).toBeNull()
  })

  it('returns error when engine generation fails', async () => {
    const mockEngine = {
      generateActivity: vi.fn().mockResolvedValue({
        status: 'failure',
        error: { message: 'Generation failed', code: 'generation_failure', recoverable: true },
      }),
    }
    const mockGetLearningEngine = vi.fn(() => mockEngine)
    vi.mocked(await import('../../services/engineBootstrap')).getLearningEngine = mockGetLearningEngine

    const useCase = await import('../generate-activity')
    const result = await useCase.generateActivityUseCase({
      skill: 'reading',
      description: 'Should fail',
      difficulty: 'medium',
      availableMinutes: 10,
    })
    expect(result.content).toBeNull()
    expect(result.error).toBeTruthy()
  })
})
