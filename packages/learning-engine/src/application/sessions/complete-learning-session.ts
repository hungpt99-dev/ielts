import type { CompleteLearningSessionRequest, CompleteLearningSessionResult } from '../../domain/entities/learning-session'
import type { LearningOutcome } from '../../domain/entities/learning-outcome'
import type { LearningRecommendation } from '../../domain/entities/learning-recommendation'
import type { LearningSessionRepository, LearningAttemptRepository, LearningOutcomeRepository } from '../../ports/session-repository'
import type { ProgressRepository } from '../../ports/progress-repository'
import type { StudyPlanPort } from '../../ports/study-plan-port'
import type { MistakeRepository } from '../../ports/mistake-repository'
import type { VocabularyRepository } from '../../ports/vocabulary-repository'
import type { LearningEventPublisher } from '../../ports/learning-event-publisher'
import type { ClockPort } from '../../ports/clock-port'
import { buildProgressEvidence, aggregateSkillProgress } from '../../domain/services/progress-evidence-builder'

export interface CompleteSessionDependencies {
  sessionRepository: LearningSessionRepository
  attemptRepository: LearningAttemptRepository
  outcomeRepository: LearningOutcomeRepository
  progressRepository?: ProgressRepository
  studyPlanPort?: StudyPlanPort
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
  let totalScore = 0
  let totalMaxScore = 0

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
    totalScore += outcome.score
    totalMaxScore += outcome.maximumScore
  }

  for (const o of outcomes) {
    await deps.outcomeRepository.save(o)
  }

  const accuracy = totalMaxScore > 0 ? totalScore / totalMaxScore : 0

  deps.eventPublisher.publish({
    id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
    type: 'learning_session_completed',
    occurredAt: deps.clock.toISOString(),
    source: 'learning-engine',
    sessionId: request.sessionId,
    schemaVersion: '1.0',
    skill: session.skill,
    actualDuration: request.actualDurationMinutes,
    score: totalScore,
    maximumScore: totalMaxScore,
    accuracy,
    roadmapTaskId: session.roadmapTaskId,
  })

  if (deps.vocabularyRepository) {
    for (const o of outcomes) {
      for (const ve of o.vocabularyEvidence) {
        try {
          await deps.vocabularyRepository.updateMastery(ve.wordId, ve.correct ? 0.8 : 0.3)
          if (ve.correct) {
            await deps.vocabularyRepository.markReviewed(ve.wordId)
          }
        } catch { /* continue */ }
      }
    }
  }

  if (deps.progressRepository) {
    try {
      const skillEvidence = buildProgressEvidence({
        skill: session.skill,
        score: totalScore,
        maximumScore: totalMaxScore,
        previousAccuracy: undefined,
        sourceExerciseId: '',
        sourceSessionId: request.sessionId,
      })
      const existingProgress = await deps.progressRepository.getSkillProgress(session.skill) ?? undefined
      const aggregated = aggregateSkillProgress(existingProgress, skillEvidence)
      await deps.progressRepository.updateSkillProgress(session.skill, aggregated)
    } catch { /* continue */ }
  }

  if (deps.studyPlanPort && session.roadmapTaskId) {
    try {
      await deps.studyPlanPort.markTaskFulfilled(session.roadmapTaskId, accuracy)
      deps.eventPublisher.publish({
        id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
        type: 'roadmap_task_fulfilled',
        occurredAt: deps.clock.toISOString(),
        source: 'learning-engine',
        sessionId: request.sessionId,
        schemaVersion: '1.0',
        roadmapTaskId: session.roadmapTaskId,
        accuracy,
      })
    } catch { /* continue */ }
  }

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
