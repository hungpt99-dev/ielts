import { getLearningEngine } from '../services/engineBootstrap'

export interface GenerateActivityInput {
  skill: string
  description: string
  difficulty: string
  availableMinutes: number
  topic?: string
}

export interface GenerateActivityOutput {
  content: string | null
  error: string | null
}

export async function generateActivityUseCase(
  input: GenerateActivityInput,
): Promise<GenerateActivityOutput> {
  const engine = getLearningEngine()
  if (!engine) return { content: null, error: 'Engine not initialized' }

  try {
    const objectiveId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const sessionResult = await engine.createSession({
      objective: {
        id: objectiveId,
        skill: input.skill as any,
        type: 'practice',
        description: input.description,
        source: 'user-selected',
        sourceId: objectiveId,
        estimatedMinutes: input.availableMinutes,
        priority: 'normal',
        successCriteria: [],
      },
      skill: input.skill as any,
      mode: 'practice',
      source: 'user-selected',
      sourceIds: [objectiveId],
      plannedDurationMinutes: input.availableMinutes,
      contextScope: input.skill as any,
      correlationId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })
    if (sessionResult.status === 'failure') {
      return { content: null, error: sessionResult.error?.message ?? 'Session creation failed' }
    }

    const result = await engine.generateActivity({
      sessionId: sessionResult.data.session.id,
      objectiveId,
      skill: input.skill as any,
      activityType: 'independent-exercise' as any,
      availableMinutes: input.availableMinutes,
      difficulty: input.difficulty as any,
      contextScope: input.skill as any,
      topic: input.topic,
      correlationId: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    })

    if (result.status === 'failure' || !result.data?.activity?.exercise?.questions?.length) {
      return { content: null, error: (result as any)?.error?.message ?? 'No activity generated' }
    }

    const exercise = result.data.activity.exercise
    const content = JSON.stringify({
      title: exercise.title,
      text: exercise.content?.passage ?? exercise.content?.text ?? '',
      transcript: exercise.content?.transcript ?? '',
      instructions: exercise.instructions,
      questions: (exercise.questions ?? []).map((q: any) => ({
        id: q.id ?? crypto.randomUUID(),
        type: q.type,
        question: q.question,
        options: q.options ?? [],
        blanks: Array.isArray(q.blanks) ? q.blanks : undefined,
        correctAnswer: String(q.correctIndex ?? q.answer ?? ''),
        explanation: q.explanation ?? '',
      })),
    })

    return { content, error: null }
  } catch (err) {
    return { content: null, error: err instanceof Error ? err.message : 'Generation failed' }
  }
}
