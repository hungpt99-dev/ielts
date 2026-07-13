import type { LearnerContextPort, SkillProgress } from '@ielts/learning-engine'
import type { IELTSSection } from '@ielts/learning-engine'

export const extensionLearnerContextPort: LearnerContextPort = {
  async buildLearningContext() {
    const emptySkillProgress = {} as Partial<Record<IELTSSection, SkillProgress>>
    const emptyAccuracy = {} as Partial<Record<IELTSSection, number>>
    const emptyTrend = {} as Partial<Record<IELTSSection, 'improving' | 'stable' | 'declining' | 'unknown'>>
    return {
      generatedAt: new Date().toISOString(),
      learner: {
        currentSkillBands: {} as Partial<Record<IELTSSection, number>>,
        targetSkillBands: {} as Partial<Record<IELTSSection, number>>,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      progress: {
        skillProgress: emptySkillProgress,
        recentAccuracy: emptyAccuracy,
        trendBySkill: emptyTrend,
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
        offlineOnly: true,
        aiAvailable: false,
      },
      contextQuality: {
        status: 'partial',
        missingSources: ['learner-profile'],
        warnings: [],
      },
    }
  },
}
