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
  requestedTopic?: string
  generatedTopic?: string
  title?: string
  sourceType?: 'ai-generated' | 'built-in' | string
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

    const activity = result.data.activity
    const exercise = activity.exercise
    const topicMeta = activity.topicMetadata as { requestedTopic?: string; generatedTopic?: string; title?: string } | undefined

    // Extract pipeline layout metadata from the first question (if present)
    const firstQ = (exercise.questions ?? [])[0] as Record<string, unknown> | undefined
    const layoutMetadata = (firstQ as any)?.layoutMetadata as Record<string, unknown> | undefined

    const content = JSON.stringify({
      title: exercise.title,
      text: exercise.content?.passage ?? exercise.content?.text ?? '',
      transcript: exercise.content?.transcript ?? '',
      instructions: exercise.instructions,
      layoutMetadata,
      questions: (exercise.questions ?? []).map((q: any) => ({
        id: q.id ?? crypto.randomUUID(),
        type: q.type,
        question: q.question ?? q.text ?? '',
        options: q.options ?? [],
        blanks: Array.isArray(q.blanks) ? q.blanks
          : Array.isArray(q.answers) ? q.answers
          : (q.correctAnswer || q.answer) ? [String(q.correctAnswer ?? q.answer ?? '')]
          : undefined,
        correctAnswer: typeof q.correctIndex === 'number' ? q.correctIndex
          : q.correctAnswer ?? String(q.correctIndex ?? q.answer ?? ''),
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : undefined,
        explanation: q.explanation ?? '',
        formFields: Array.isArray((q as any).formFields) ? (q as any).formFields : undefined,
        tableHeaders: Array.isArray((q as any).tableHeaders) ? (q as any).tableHeaders : undefined,
        tableRows: Array.isArray((q as any).tableRows) ? (q as any).tableRows : undefined,
        acceptableAlternatives: Array.isArray(q.acceptableAlternatives) ? q.acceptableAlternatives
          : Array.isArray((q as any).acceptableAnswers) ? (q as any).acceptableAnswers
          : undefined,
      })),
    })

    function extractTopicFromTitle(title: string, skill: string): string {
      const skillPrefix = new RegExp(`^${skill}:\\s*`, 'i')
      let topic = title.replace(skillPrefix, '').trim()
      topic = topic.replace(/^(reading|listening|writing|speaking):\s*/i, '').trim()
      return topic
    }

    return {
      content,
      error: null,
      requestedTopic: topicMeta?.requestedTopic || input.topic || '',
      generatedTopic: topicMeta?.generatedTopic || extractTopicFromTitle(exercise.title, input.skill),
      title: topicMeta?.title || exercise.title,
      sourceType: exercise.sourceType,
    }
  } catch (err) {
    return { content: null, error: err instanceof Error ? err.message : 'Generation failed' }
  }
}
