import type { LearnerContextPort } from '../../ports/learner-context-port'
import type { BuildLearningContextRequest } from '../../domain/entities/learning-context'
import type { LearningContext } from '../../domain/entities/learning-context'

export { toSharedLearnerContext } from './to-shared-learner-context'

export class InMemoryLearnerContextAdapter implements LearnerContextPort {
  async buildLearningContext(_request: BuildLearningContextRequest): Promise<LearningContext> {
    return {
      generatedAt: new Date().toISOString(),
      learner: {
        currentOverallBand: 5.5,
        targetOverallBand: 7.0,
        currentSkillBands: {},
        targetSkillBands: {},
        timezone: 'UTC',
      },
      progress: {
        skillProgress: {},
        recentAccuracy: {},
        trendBySkill: {},
      },
      weaknesses: [],
      strengths: [],
      recentMistakes: [],
      savedVocabulary: [],
      relevantContent: [],
      recentAttempts: [],
      previousFeedback: [],
      preferences: {
        preferredLearningMethods: [],
        preferredTaskTypes: [],
        preferredLanguage: 'en',
      },
      constraints: {
        offlineOnly: false,
        aiAvailable: false,
      },
      contextQuality: {
        status: 'partial',
        missingSources: [],
        warnings: ['Using in-memory adapter — context may be incomplete'],
      },
    }
  }
}
