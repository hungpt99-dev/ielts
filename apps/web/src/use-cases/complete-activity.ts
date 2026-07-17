import { getLearningEngine } from '../services/engineBootstrap'

export interface CompleteActivityInput {
  skill: string
  topic: string
  questions: Array<{
    id: string
    question: string
    correctAnswer: string | number | string[]
    options?: string[]
    explanation: string
    type?: string
    blanks?: string[]
  }>
  answers: Record<string, unknown>
  timeSpentMs?: number
}

export interface CompleteActivityOutput {
  success: boolean
  error?: string
  score?: number
  total?: number
}

export async function completeActivityUseCase(
  input: CompleteActivityInput,
): Promise<CompleteActivityOutput> {
  const engine = getLearningEngine()
  if (!engine) return { success: false, error: 'Engine not initialized' }

  try {
    const result = await engine.completeExercise({
      skill: input.skill,
      topic: input.topic,
      questions: input.questions,
      answers: input.answers,
      timeSpentMs: input.timeSpentMs ?? 0,
    })

    if (result.status === 'failure') {
      return { success: false, error: result.error?.message ?? 'Completion failed' }
    }

    return {
      success: true,
      score: result.data?.correctAnswers,
      total: result.data?.totalQuestions,
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
