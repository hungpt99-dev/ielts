import { getLearningEngine } from '../engineBootstrap'

function id(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const SKILL_MAP: Record<string, 'reading' | 'writing' | 'speaking' | 'listening' | 'grammar' | 'vocabulary'> = {
  reading: 'reading',
  writing: 'writing',
  speaking: 'speaking',
  listening: 'listening',
  grammar: 'grammar',
  vocabulary: 'vocabulary',
}

const ACTIVITY_TYPE_MAP: Record<string, 'independent-exercise' | 'guided-exercise' | 'explanation' | 'worked-example'> = {
  reading: 'independent-exercise',
  writing: 'guided-exercise',
  speaking: 'guided-exercise',
  listening: 'independent-exercise',
  grammar: 'guided-exercise',
  vocabulary: 'guided-exercise',
}

export interface AiSessionResult {
  content: string | null
  error: string | null
}

function parseActivityResult(engine: NonNullable<ReturnType<typeof getLearningEngine>>, skill: string, sessionId: string, objectiveId: string, difficulty: string, availableMinutes: number, sourceContent?: { id: string; type: string; text: string }) {
  return engine.generateActivity({
    sessionId,
    objectiveId,
    skill: SKILL_MAP[skill] ?? 'reading',
    activityType: ACTIVITY_TYPE_MAP[skill] ?? 'independent-exercise',
    availableMinutes,
    difficulty: difficulty.includes('6') || difficulty === 'medium' ? 'medium' as any : difficulty === 'hard' ? 'hard' as any : 'easy' as any,
    contextScope: skill as any,
    sourceContent: sourceContent as any,
    correlationId: id(),
  })
}

export async function generateFromEngine(
  skill: string,
  description: string,
  difficulty: string,
  availableMinutes: number,
  sourceContent?: { id: string; type: string; text: string },
): Promise<AiSessionResult> {
  const engine = getLearningEngine()
  if (!engine) return { content: null, error: null }

  const objectiveId = id()

  try {
    const sessionResult = await engine.createSession({
      objective: {
        id: objectiveId,
        skill: SKILL_MAP[skill] ?? 'reading',
        type: 'practice',
        description,
        source: 'user-selected',
        sourceId: objectiveId,
        estimatedMinutes: availableMinutes,
        priority: 'normal',
        successCriteria: [],
      },
      skill: SKILL_MAP[skill] ?? 'reading',
      mode: 'practice',
      source: 'user-selected',
      sourceIds: [objectiveId],
      plannedDurationMinutes: availableMinutes,
      contextScope: skill as any,
      correlationId: id(),
    })

    if (sessionResult.status === 'failure') return { content: null, error: sessionResult.error?.message ?? 'Session failed' }

    const sessionId = sessionResult.data.session.id
    const activityResult = await parseActivityResult(engine, skill, sessionId, objectiveId, difficulty, availableMinutes, sourceContent)
    if (activityResult.status === 'failure' || !activityResult.data?.activity?.exercise?.questions?.length) {
      return { content: null, error: (activityResult as any)?.error?.message ?? null }
    }

    const exercise = activityResult.data.activity.exercise
    const passageText = exercise.content?.passage ?? exercise.content?.text ?? ''
    const result = {
      title: exercise.title,
      text: passageText,
      instructions: exercise.instructions,
      questions: (exercise.questions ?? []).map((q: any) => ({
        type: q.type,
        question: q.question,
        options: q.options ?? [],
        correctAnswer: String(q.correctIndex ?? q.answer ?? ''),
        explanation: q.explanation ?? '',
      })),
    }

    return { content: JSON.stringify(result), error: null }
  } catch {
    return { content: null, error: null }
  }
}
