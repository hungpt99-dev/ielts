export { extensionSessionRepository, extensionAttemptRepository, extensionExerciseRepository, extensionOutcomeRepository } from './session-adapter'
export { extensionMistakeRepository } from './mistake-adapter'
export { extensionVocabularyRepository } from './vocabulary-adapter'
export { extensionProgressRepository } from './progress-adapter'
export { extensionLearnerContextPort } from './context-adapter'
export { extensionTutorPort } from './tutor-adapter'
export { extensionEventPublisher } from './event-adapter'

import { createLearningEngine, createDefaultSkillRegistry } from '@ielts/learning-engine'
import { extensionSessionRepository, extensionAttemptRepository, extensionExerciseRepository, extensionOutcomeRepository } from './session-adapter'
import { extensionMistakeRepository } from './mistake-adapter'
import { extensionVocabularyRepository } from './vocabulary-adapter'
import { extensionProgressRepository } from './progress-adapter'
import { extensionLearnerContextPort } from './context-adapter'
import { extensionTutorPort } from './tutor-adapter'
import { extensionEventPublisher } from './event-adapter'

const systemClock = {
  now: () => new Date(),
  toISOString: () => new Date().toISOString(),
  today: () => new Date().toISOString().slice(0, 10),
}

let engineInstance: ReturnType<typeof createLearningEngine> | null = null

export async function initializeExtensionEngine() {
  if (engineInstance) return engineInstance

  const engine = createLearningEngine({
    contextPort: extensionLearnerContextPort,
    tutorPort: extensionTutorPort,
    studyPlanPort: {
      async getCurrentTask() { return null },
      async getTaskById() { return null },
      async markTaskFulfilled() {},
    },
    sessionRepository: extensionSessionRepository,
    attemptRepository: extensionAttemptRepository,
    exerciseRepository: extensionExerciseRepository,
    outcomeRepository: extensionOutcomeRepository,
    progressRepository: extensionProgressRepository,
    mistakeRepository: extensionMistakeRepository,
    vocabularyRepository: extensionVocabularyRepository,
    eventPublisher: extensionEventPublisher,
    clock: systemClock,
    skillRegistry: createDefaultSkillRegistry(),
  })

  engineInstance = engine
  return engine
}

export function getExtensionEngine() {
  return engineInstance
}
