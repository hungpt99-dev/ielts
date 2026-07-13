import type { CreateLearningSessionRequest, CreateLearningSessionResult, LearningSession } from '../../domain/entities/learning-session'
import type { LearnerContextPort } from '../../ports/learner-context-port'
import type { LearningSessionRepository } from '../../ports/session-repository'
import type { ClockPort } from '../../ports/clock-port'
import { planActivities } from '../../domain/policies/activity-selection-policy'
import { determineDifficulty } from '../../domain/policies/difficulty-policy'

export interface CreateSessionDependencies {
  contextPort: LearnerContextPort
  sessionRepository: LearningSessionRepository
  clock: ClockPort
}

export async function createLearningSession(
  request: CreateLearningSessionRequest,
  deps: CreateSessionDependencies,
): Promise<CreateLearningSessionResult> {
  const context = await deps.contextPort.buildLearningContext({
    scope: request.contextScope as any,
    skill: request.skill,
    includeStudyPlan: request.source === 'roadmap',
  })

  const difficulty = request.difficulty ?? determineDifficulty({
    currentBand: context.learner.currentOverallBand,
    targetBand: context.learner.targetOverallBand,
    recentAccuracy: context.progress.recentAccuracy[request.skill],
    consecutiveCorrect: 0,
    consecutiveMistakes: 0,
    totalAttempts: 0,
    timeSpentMs: 0,
    hintsUsed: 0,
  }).level

  const activityPlan = planActivities(context, request.plannedDurationMinutes, request.skill, request.objective.type)

  const now = deps.clock.toISOString()
  const session: LearningSession = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-session`,
    objective: request.objective,
    skill: request.skill,
    mode: request.mode,
    source: request.source,
    sourceIds: request.sourceIds,
    plannedDurationMinutes: request.plannedDurationMinutes,
    difficulty,
    status: 'prepared',
    activities: activityPlan.activities.map((a, i) => ({
      id: crypto.randomUUID?.() ?? `${Date.now()}-act-${i}`,
      sessionId: '',
      type: a.type,
      skill: request.skill,
      title: a.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      instructions: '',
      estimatedMinutes: a.minutes,
      order: i,
      completed: false,
    })),
    currentActivityIndex: 0,
    contextSnapshotId: context.generatedAt,
    roadmapTaskId: request.roadmapTaskId,
    startedAt: undefined,
    generationMetadata: {
      generatedAt: now,
      schemaVersion: '1.0',
      contextSnapshotHash: context.generatedAt,
      aiUsed: false,
      aiCallCount: 0,
      templateUsed: activityPlan.activities.length > 0,
      cacheHit: false,
    },
    version: 1,
  }

  session.activities = session.activities.map(a => ({ ...a, sessionId: session.id }))

  await deps.sessionRepository.save(session)

  return {
    session,
    warnings: context.contextQuality.status !== 'complete'
      ? [`Context quality: ${context.contextQuality.status}`]
      : [],
  }
}
