import type { ResumeLearningSessionResult } from '../../domain/entities/learning-session'
import type { LearningSessionRepository, LearningAttemptRepository } from '../../ports/session-repository'

export interface ResumeSessionDependencies {
  sessionRepository: LearningSessionRepository
  attemptRepository: LearningAttemptRepository
}

export async function resumeLearningSession(
  sessionId: string,
  deps: ResumeSessionDependencies,
): Promise<ResumeLearningSessionResult> {
  const session = await deps.sessionRepository.getById(sessionId)
  if (!session) {
    return { session: null, currentActivity: null, savedAnswers: [] }
  }

  const attempts = await deps.attemptRepository.findBySession(sessionId)
  const currentAttempt = attempts.find(a => a.status === 'in-progress' || a.status === 'not-started')

  const currentActivity = session.currentActivityIndex < session.activities.length
    ? session.activities[session.currentActivityIndex]
    : null

  return {
    session,
    currentActivity,
    savedAnswers: (currentAttempt?.answers ?? []) as unknown as Record<string, unknown>[],
  }
}
