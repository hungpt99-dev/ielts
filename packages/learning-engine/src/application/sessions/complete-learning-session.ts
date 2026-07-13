import type { CompleteLearningSessionRequest, CompleteLearningSessionResult } from '../../domain/entities/learning-session'
import type { LearningOutcome } from '../../domain/entities/learning-outcome'
import type { LearningRecommendation } from '../../domain/entities/learning-recommendation'
import type { LearningSessionRepository, LearningAttemptRepository, LearningOutcomeRepository } from '../../ports/session-repository'
import type { MistakeRepository } from '../../ports/mistake-repository'
import type { VocabularyRepository } from '../../ports/vocabulary-repository'
import type { LearningEventPublisher } from '../../ports/learning-event-publisher'
import type { ClockPort } from '../../ports/clock-port'

export interface CompleteSessionDependencies {
  sessionRepository: LearningSessionRepository
  attemptRepository: LearningAttemptRepository
  outcomeRepository: LearningOutcomeRepository
  mistakeRepository: MistakeRepository
  vocabularyRepository: VocabularyRepository
  eventPublisher: LearningEventPublisher
  clock: ClockPort
}

export async function completeLearningSession(
  request: CompleteLearningSessionRequest,
  deps: CompleteSessionDependencies,
): Promise<CompleteLearningSessionResult> {
  const session = await deps.sessionRepository.getById(request.sessionId)
  if (!session) {
    throw new Error(`Session ${request.sessionId} not found`)
  }

  session.status = 'completed'
  session.actualDurationMinutes = request.actualDurationMinutes
  session.completedAt = deps.clock.toISOString()
  await deps.sessionRepository.save(session)

  const attempts = await deps.attemptRepository.findBySession(request.sessionId)
  const outcomes: LearningOutcome[] = []

  for (const attempt of attempts) {
    if (attempt.status !== 'evaluated') continue

    const outcome: LearningOutcome = {
      sessionId: request.sessionId,
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
      skill: session.skill,
      objectiveId: session.objective.id,
      score: 0,
      maximumScore: 0,
      difficulty: 'medium' as any,
      actualMinutes: Math.floor(attempt.timeSpentMs / 60000),
      hintsUsed: attempt.hintsUsed,
      strengths: [],
      weaknesses: [],
      mistakes: [],
      vocabularyEvidence: [],
      completedAt: deps.clock.toISOString(),
    }
    outcomes.push(outcome)
  }

  for (const o of outcomes) {
    await deps.outcomeRepository.save(o)
  }

  deps.eventPublisher.publish({
    id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
    type: 'learning_session_completed',
    occurredAt: deps.clock.toISOString(),
    source: 'learning-engine',
    sessionId: request.sessionId,
    schemaVersion: '1.0',
    skill: session.skill,
    actualDuration: request.actualDurationMinutes,
    score: outcomes.reduce((s, o) => s + o.score, 0),
    maximumScore: outcomes.reduce((s, o) => s + o.maximumScore, 0),
    accuracy: outcomes.reduce((s, o) => s + (o.accuracy ?? 0), 0) / Math.max(outcomes.length, 1),
    roadmapTaskId: session.roadmapTaskId,
  })

  const recommendations: LearningRecommendation[] = []
  if (session.roadmapTaskId) {
    recommendations.push({
      action: 'start-roadmap-task',
      reason: 'Continue with your study roadmap',
      estimatedMinutes: 20,
      sourceIds: [session.roadmapTaskId],
      priority: 0.8,
    })
  }

  return { session, outcomes, recommendations }
}
