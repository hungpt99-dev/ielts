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

export interface SessionInfo {
  sessionId: string
  attemptId: string
  exerciseId: string
  objectiveId: string
}

function mapDifficulty(difficulty: string, skill: string): any {
  if (skill === 'reading' || skill === 'listening') {
    if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') return difficulty as any
  }
  return difficulty.includes('6') || difficulty === 'medium' ? 'medium' as any : difficulty === 'hard' ? 'hard' as any : 'easy' as any
}

async function createEngineSession(
  engine: NonNullable<ReturnType<typeof getLearningEngine>>,
  skill: string,
  description: string,
  objectiveId: string,
  availableMinutes: number,
  contextScope: string,
) {
  return engine.createSession({
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
    contextScope: contextScope as any,
    correlationId: id(),
  })
}

function parseExerciseFromActivity(activityResult: any) {
  const exercise = activityResult.data.activity.exercise
  const passageText = exercise.content?.passage ?? exercise.content?.text ?? ''
  return {
    title: exercise.title,
    text: passageText,
    instructions: exercise.instructions,
    questions: (exercise.questions ?? []).map((q: any) => ({
      id: q.id ?? id(),
      type: q.type,
      question: q.question,
      options: q.options ?? [],
      correctAnswer: String(q.correctIndex ?? q.answer ?? ''),
      explanation: q.explanation ?? '',
    })),
  }
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
    const sessionResult = await createEngineSession(engine, skill, description, objectiveId, availableMinutes, skill)
    if (sessionResult.status === 'failure') return { content: null, error: sessionResult.error?.message ?? 'Session failed' }

    const sessionId = sessionResult.data.session.id
    const activityResult = await engine.generateActivity({
      sessionId,
      objectiveId,
      skill: SKILL_MAP[skill] ?? 'reading',
      activityType: ACTIVITY_TYPE_MAP[skill] ?? 'independent-exercise',
      availableMinutes,
      difficulty: mapDifficulty(difficulty, skill),
      contextScope: skill as any,
      sourceContent: sourceContent as any,
      correlationId: id(),
    })
    if (activityResult.status === 'failure' || !activityResult.data?.activity?.exercise?.questions?.length) {
      return { content: null, error: (activityResult as any)?.error?.message ?? null }
    }

    const result = parseExerciseFromActivity(activityResult)
    return { content: JSON.stringify(result), error: null }
  } catch (error) {
    console.error('apps/web/src/services/learning/ai-exercise-session.ts error:', error);
    return { content: null, error: null }
  }
}

export interface EngineSessionResult {
  content: string | null
  sessionInfo: SessionInfo | null
  error: string | null
}

export async function startEngineSession(
  skill: string,
  description: string,
  difficulty: string,
  availableMinutes: number,
): Promise<EngineSessionResult> {
  const engine = getLearningEngine()
  if (!engine) return { content: null, sessionInfo: null, error: 'Engine not initialized' }

  const objectiveId = id()

  try {
    const sessionResult = await createEngineSession(engine, skill, description, objectiveId, availableMinutes, skill)
    if (sessionResult.status === 'failure') return { content: null, sessionInfo: null, error: sessionResult.error?.message ?? 'Session failed' }

    const sessionId = sessionResult.data.session.id

    const activityResult = await engine.generateActivity({
      sessionId,
      objectiveId,
      skill: SKILL_MAP[skill] ?? 'reading',
      activityType: ACTIVITY_TYPE_MAP[skill] ?? 'independent-exercise',
      availableMinutes,
      difficulty: mapDifficulty(difficulty, skill),
      contextScope: skill as any,
      correlationId: id(),
    })
    if (activityResult.status === 'failure' || !activityResult.data?.activity?.exercise?.questions?.length) {
      return { content: null, sessionInfo: null, error: (activityResult as any)?.error?.message ?? null }
    }

    const exerciseId = activityResult.data.activity.exercise.id

    const attemptResult = await engine.startAttempt({ sessionId, exerciseId, correlationId: id() })
    if (attemptResult.status === 'failure') {
      return { content: null, sessionInfo: null, error: attemptResult.error?.message ?? 'Failed to start attempt' }
    }

    const parsed = parseExerciseFromActivity(activityResult)

    return {
      content: JSON.stringify(parsed),
      sessionInfo: { sessionId, attemptId: attemptResult.data.attempt.id, exerciseId, objectiveId },
      error: null,
    }
  } catch (err) {
    console.error('apps/web/src/services/learning/ai-exercise-session.ts error:', err);
    return { content: null, sessionInfo: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function submitAndComplete(
  sessionInfo: SessionInfo,
  answers: Array<{ questionId: string; answer: unknown; answeredAt: string; timeSpentMs: number }>,
  timeSpentSeconds: number,
): Promise<{ success: boolean; error?: string }> {
  const engine = getLearningEngine()
  if (!engine) return { success: false, error: 'Engine not initialized' }

  try {
    const submitResult = await engine.submitAnswer({
      sessionId: sessionInfo.sessionId,
      attemptId: sessionInfo.attemptId,
      answers: answers.map(a => ({ ...a, isFinal: true })),
      correlationId: id(),
    })
    if (submitResult.status === 'failure') return { success: false, error: submitResult.error?.message }

    const completeResult = await engine.completeSession({
      sessionId: sessionInfo.sessionId,
      actualMinutes: Math.round(timeSpentSeconds / 60),
      hintCount: 0,
      correlationId: id(),
    })
    if (completeResult.status === 'failure') return { success: false, error: completeResult.error?.message }

    return { success: true }
  } catch (err) {
    console.error('apps/web/src/services/learning/ai-exercise-session.ts error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
