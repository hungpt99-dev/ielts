import { createLearningEngine, createDefaultSkillRegistry } from '@ielts/learning-engine'
import type { LearningEngine } from '@ielts/learning-engine'

let engineInstance: LearningEngine | null = null

export function initializeExtensionEngine(): LearningEngine {
  if (engineInstance) return engineInstance

  const noopRepo = {
    save: async () => {},
    delete: async () => {},
  }

  engineInstance = createLearningEngine({
    contextPort: {
      buildLearningContext: async () => ({
        generatedAt: new Date().toISOString(),
        learner: { currentSkillBands: {}, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, examType: 'academic' as const },
        progress: { skillProgress: {}, recentAccuracy: {}, trendBySkill: {}, overallProgress: 0, studyStreak: 0 },
        weaknesses: [], strengths: [], recentMistakes: [], savedVocabulary: [], relevantContent: [],
        recentAttempts: [], previousFeedback: [],
        preferences: { preferredLearningMethods: [], preferredTaskTypes: [], preferredLanguage: 'en' },
        constraints: { offlineOnly: false, aiAvailable: false },
        contextQuality: { status: 'partial' as const, missingSources: [], staleSources: [], warnings: [] },
      }),
    },
    tutorPort: {} as any,
    studyPlanPort: {
      getCurrentTask: async () => null,
      getTaskById: async () => null,
      markTaskFulfilled: async () => {},
    },
    sessionRepository: noopRepo as any,
    exerciseRepository: noopRepo as any,
    attemptRepository: noopRepo as any,
    outcomeRepository: noopRepo as any,
    progressRepository: {} as any,
    mistakeRepository: noopRepo as any,
    vocabularyRepository: noopRepo as any,
    learningEventPublisher: { publish: async () => {} },
    clock: {
      now: () => new Date(),
    } as any,
    skillRegistry: createDefaultSkillRegistry(),
  } as any)

  return engineInstance
}

export function getExtensionEngine(): LearningEngine | null {
  return engineInstance
}
