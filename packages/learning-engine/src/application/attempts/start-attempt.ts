import { ATTEMPT_STATUS } from '../../domain/constants'
import type { StartAttemptRequest, LearningAttempt } from '../../domain/entities/learning-attempt'
import type { LearningAttemptRepository } from '../../ports/session-repository'

export interface StartAttemptDependencies {
  attemptRepository: LearningAttemptRepository
}

export async function startAttempt(
  request: StartAttemptRequest,
  deps: StartAttemptDependencies,
): Promise<LearningAttempt> {
  const existing = await deps.attemptRepository.findBySession(request.sessionId)
  const active = existing.find(a => a.status === ATTEMPT_STATUS.IN_PROGRESS || a.status === ATTEMPT_STATUS.NOT_STARTED)
  if (active) return active

  const attempt: LearningAttempt = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-att`,
    sessionId: request.sessionId,
    exerciseId: request.exerciseId,
    status: ATTEMPT_STATUS.NOT_STARTED,
    answers: [],
    startedAt: new Date().toISOString(),
    timeSpentMs: 0,
    hintsUsed: 0,
    version: 1,
  }

  await deps.attemptRepository.save(attempt)
  return attempt
}
