import type { CreateLearningSessionResult } from '../../domain/entities/learning-session'
import type { RoadmapLearningTask } from '../../ports/study-plan-port'
import type { LearnerContextPort } from '../../ports/learner-context-port'
import type { LearningSessionRepository } from '../../ports/session-repository'
import type { ClockPort } from '../../ports/clock-port'
import { determineDifficulty } from '../../domain/policies/difficulty-policy'

export interface CreateRoadmapSessionDependencies {
  contextPort: LearnerContextPort
  sessionRepository: LearningSessionRepository
  clock: ClockPort
}

export async function createSessionFromRoadmapTask(
  task: RoadmapLearningTask,
  deps: CreateRoadmapSessionDependencies,
): Promise<CreateLearningSessionResult> {
  const context = await deps.contextPort.buildLearningContext({
    scope: 'roadmap-task',
    skill: task.skill,
    includeStudyPlan: true,
  })

  const difficulty = task.difficulty ?? determineDifficulty({
    currentBand: context.learner.currentOverallBand,
    targetBand: context.learner.targetOverallBand,
    recentAccuracy: context.progress.recentAccuracy[task.skill],
    consecutiveCorrect: 0,
    consecutiveMistakes: 0,
    totalAttempts: 0,
    timeSpentMs: 0,
    hintsUsed: 0,
  }).level

  const now = deps.clock.toISOString()
  const sessionId = crypto.randomUUID?.() ?? `${Date.now()}-session`

  const session = {
    id: sessionId,
    objective: {
      id: crypto.randomUUID?.() ?? `${Date.now()}-obj`,
      skill: task.skill,
      type: 'practice' as const,
      description: task.objective,
      source: 'roadmap' as const,
      sourceId: task.taskId,
      estimatedMinutes: task.estimatedMinutes,
      priority: task.priority,
      successCriteria: task.successCriteria ?? [],
    },
    skill: task.skill,
    mode: 'practice' as const,
    source: 'roadmap' as const,
    sourceIds: [task.taskId],
    plannedDurationMinutes: task.estimatedMinutes,
    difficulty,
    status: 'prepared' as const,
    activities: [],
    currentActivityIndex: 0,
    contextSnapshotId: context.generatedAt,
    roadmapTaskId: task.taskId,
    generationMetadata: {
      generatedAt: now,
      schemaVersion: '1.0',
      contextSnapshotHash: context.generatedAt,
      aiUsed: false,
      aiCallCount: 0,
      templateUsed: true,
      cacheHit: false,
    },
    version: 1,
  }

  await deps.sessionRepository.save(session as any)

  return {
    session: session as any,
    warnings: context.contextQuality.status !== 'complete' ? [`Context quality: ${context.contextQuality.status}`] : [],
  }
}
