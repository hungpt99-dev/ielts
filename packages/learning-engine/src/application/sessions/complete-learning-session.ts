import type { CompleteLearningSessionRequest, CompleteLearningSessionResult } from '../../domain/entities/learning-session'
import type { LearningOutcome, VocabularyEvidence } from '../../domain/entities/learning-outcome'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
import type { LearningRecommendation } from '../../domain/entities/learning-recommendation'
import type { LearningSessionRepository, LearningAttemptRepository, LearningOutcomeRepository } from '../../ports/session-repository'
import type { ProgressRepository } from '../../ports/progress-repository'
import type { StudyPlanPort } from '../../ports/study-plan-port'
import type { MistakeRepository } from '../../ports/mistake-repository'
import type { VocabularyRepository } from '../../ports/vocabulary-repository'
import type { LearningEventPublisher } from '../../ports/learning-event-publisher'
import type { TutorIntelligencePort } from '../../ports/tutor-intelligence-port'
import type { ClockPort } from '../../ports/clock-port'
import { buildProgressEvidence, aggregateSkillProgress } from '../../domain/services/progress-evidence-builder'

export interface CompleteSessionDependencies {
  sessionRepository: LearningSessionRepository
  attemptRepository: LearningAttemptRepository
  outcomeRepository: LearningOutcomeRepository
  progressRepository?: ProgressRepository
  studyPlanPort?: StudyPlanPort
  tutorPort?: TutorIntelligencePort
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
  const allMistakes: MistakeEvidence[] = []
  const allSkillEvidence: SkillEvidence[] = []
  let totalScore = 0
  let totalMaxScore = 0

  for (const attempt of attempts) {
    if (attempt.status !== 'evaluated') continue

    const evaluations = attempt.evaluations ?? []
    const attemptScore = evaluations.reduce((s, e) => s + e.score, 0)
    const attemptMaxScore = evaluations.reduce((s, e) => s + e.maximumScore, 0)
    totalScore += attemptScore
    totalMaxScore += attemptMaxScore

    const mistakes: MistakeEvidence[] = []
    for (const eval_ of evaluations) {
      for (const m of eval_.mistakes) {
        mistakes.push(m)
        allMistakes.push(m)
      }
      if (eval_.status === 'incorrect' || eval_.status === 'partially-correct') {
        const m: MistakeEvidence = {
          id: `complete-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: session.skill,
          category: 'incorrect',
          originalResponse: '',
          correctedResponse: '',
          explanation: eval_.explanation ?? '',
          sourceExerciseId: attempt.exerciseId,
          sourceQuestionId: eval_.questionId ?? attempt.exerciseId,
          occurredAt: deps.clock.toISOString(),
          recurrenceCount: 0,
          severity: 'minor',
          confidence: eval_.confidence,
          reviewStatus: 'unreviewed',
        }
        mistakes.push(m)
        allMistakes.push(m)
      }
    }

    const skillEvidence: SkillEvidence[] = []
    for (const eval_ of evaluations) {
      for (const se of eval_.skillEvidence) {
        skillEvidence.push(se)
        allSkillEvidence.push(se)
      }
    }

    if (evaluations.length > 0 && skillEvidence.length === 0) {
      const correctCount = evaluations.filter(e => e.status === 'correct').length
      const totalEvalCount = evaluations.length
      skillEvidence.push({
        skill: session.skill,
        type: correctCount / totalEvalCount >= 0.8 ? 'strength' : correctCount / totalEvalCount >= 0.5 ? 'improvement' : 'weakness',
        description: `Session accuracy: ${correctCount}/${totalEvalCount} correct`,
        score: correctCount,
        maximumScore: totalEvalCount,
        accuracy: totalEvalCount > 0 ? Math.round((correctCount / totalEvalCount) * 100) : 0,
        sourceExerciseId: attempt.exerciseId,
        sourceSessionId: request.sessionId,
        occurredAt: deps.clock.toISOString(),
        confidence: 0.9,
      })
      allSkillEvidence.push(skillEvidence[skillEvidence.length - 1])
    }

    const vocabularyEvidence: VocabularyEvidence[] = []
    for (const se of skillEvidence) {
      if (se.skill === 'vocabulary') {
        vocabularyEvidence.push({
          wordId: se.sourceExerciseId,
          word: se.description,
          correct: se.type !== 'weakness',
          context: se.description,
        })
      }
    }

    const outcome: LearningOutcome = {
      sessionId: request.sessionId,
      exerciseId: attempt.exerciseId,
      attemptId: attempt.id,
      skill: session.skill,
      objectiveId: session.objective.id,
      score: attemptScore,
      maximumScore: attemptMaxScore,
      difficulty: session.difficulty ?? 'medium',
      actualMinutes: Math.floor(attempt.timeSpentMs / 60000),
      hintsUsed: attempt.hintsUsed,
      strengths: skillEvidence.filter(s => s.type === 'strength' || s.type === 'improvement'),
      weaknesses: skillEvidence.filter(s => s.type === 'weakness' || s.type === 'plateau'),
      mistakes,
      vocabularyEvidence,
      completedAt: deps.clock.toISOString(),
    }
    outcomes.push(outcome)
  }

  for (const o of outcomes) {
    await deps.outcomeRepository.save(o)
  }

  const accuracy = totalMaxScore > 0 ? totalScore / totalMaxScore : 0

  await deps.eventPublisher.publish({
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

  await Promise.all(allMistakes.map(m => deps.mistakeRepository.save(m).catch(() => {})))

  if (deps.vocabularyRepository) {
    for (const o of outcomes) {
      for (const ve of o.vocabularyEvidence) {
        try {
          await deps.vocabularyRepository.updateMastery(ve.wordId, ve.correct ? 0.8 : 0.3)
          if (ve.correct) {
            await deps.vocabularyRepository.markReviewed(ve.wordId)
          }
        } catch (error) {
 console.error('packages/learning-engine/src/application/sessions/complete-learning-session.ts error:', error);
 /* continue */ }
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
    } catch (error) {
 console.error('packages/learning-engine/src/application/sessions/complete-learning-session.ts error:', error);
 /* continue */ }
  }

  if (deps.studyPlanPort && session.roadmapTaskId) {
    try {
      await deps.studyPlanPort.markTaskFulfilled(session.roadmapTaskId, accuracy)
      await deps.eventPublisher.publish({
        id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
        type: 'roadmap_task_fulfilled',
        occurredAt: deps.clock.toISOString(),
        source: 'learning-engine',
        sessionId: request.sessionId,
        schemaVersion: '1.0',
        roadmapTaskId: session.roadmapTaskId,
        accuracy,
      })
    } catch (error) {
 console.error('packages/learning-engine/src/application/sessions/complete-learning-session.ts error:', error);
 /* continue */ }
  }

  if (deps.tutorPort) {
    try {
      await deps.tutorPort.recordLearningOutcome({
        sessionId: request.sessionId,
        skill: session.skill,
        score: totalScore,
        maximumScore: totalMaxScore,
        accuracy,
        mistakes: allMistakes.map(m => ({ category: m.category, text: m.originalResponse })),
        strengths: allSkillEvidence.filter(s => s.type === 'strength' || s.type === 'improvement').map(s => s.description),
      })
    } catch (error) {
 console.error('packages/learning-engine/src/application/sessions/complete-learning-session.ts error:', error);
 /* continue */ }
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
