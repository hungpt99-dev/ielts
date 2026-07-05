import { describe, it, expect } from 'vitest'
import type {
  AiProviderType,
  AiTutorMode,
  ExplanationStyle,
  CorrectionStrictness,
  AiResponseLanguage,
  ExerciseDifficulty,
  FeedbackDepth,
  AutomationLevel,
  StudyReminderFrequency,
  PrivacyLevel,
  AiProviderConfig,
  AiTutorConfig,
  StudyPreferences,
  VocabReviewSettings,
  SpeakingFeedbackSettings,
  WritingCorrectionSettings,
  PrivacySettings,
  ConfigurationAdvanced,
  ConfigurationBasic,
  UserConfiguration,
} from '../../src/features/configuration/models'

describe('AiProviderType', () => {
  const validProviders: AiProviderType[] = ['openai', 'claude', 'gemini', 'deepseek', 'openrouter', 'groq', 'local', 'custom']

  it.each(validProviders)('accepts provider type %s', (provider) => {
    const config: AiProviderConfig = {
      providerId: 'test',
      provider,
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      costLimit: 10,
      usageLimit: 1000,
      fallbackProvider: null,
    }
    expect(config.provider).toBe(provider)
  })

  it('rejects invalid provider type at runtime', () => {
    const invalid = 'invalid-provider'
    expect(validProviders).not.toContain(invalid)
  })
})

describe('AiTutorMode', () => {
  const validModes: AiTutorMode[] = [
    'friendly-tutor',
    'strict-examiner',
    'simple-english-teacher',
    'vietnamese-explanation-tutor',
    'motivation-coach',
    'grammar-focused-tutor',
    'vocabulary-focused-tutor',
    'writing-correction-tutor',
    'speaking-practice-tutor',
  ]

  it.each(validModes)('accepts tutor mode %s', (mode) => {
    const config: AiTutorConfig = {
      mode,
      explanationStyle: 'detailed',
      correctionStrictness: 'balanced',
      responseLanguage: 'english',
      exerciseDifficulty: 'adaptive',
      feedbackDepth: 'standard',
      automationLevel: 'semi-automatic',
      studyReminderFrequency: 'daily',
      customSystemPrompt: '',
    }
    expect(config.mode).toBe(mode)
  })
})

describe('AiProviderConfig', () => {
  it('creates a valid AiProviderConfig with all fields', () => {
    const config: AiProviderConfig = {
      providerId: 'provider-1',
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: 'You are a helpful tutor',
      costLimit: 10,
      usageLimit: 1000,
      fallbackProvider: 'provider-2',
    }
    expect(config.providerId).toBe('provider-1')
    expect(config.temperature).toBe(0.7)
    expect(config.fallbackProvider).toBe('provider-2')
  })

  it('allows fallbackProvider to be null', () => {
    const config: AiProviderConfig = {
      providerId: 'p1',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 1024,
      systemPrompt: '',
      costLimit: 5,
      usageLimit: 500,
      fallbackProvider: null,
    }
    expect(config.fallbackProvider).toBeNull()
  })

  it('allows extreme temperature values', () => {
    const config: AiProviderConfig = {
      providerId: 'p1',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4',
      temperature: 0,
      maxTokens: 2048,
      systemPrompt: '',
      costLimit: 0,
      usageLimit: 1,
      fallbackProvider: null,
    }
    expect(config.temperature).toBe(0)
  })

  it('allows maxTokens up to 1,000,000', () => {
    const config: AiProviderConfig = {
      providerId: 'p1',
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000000,
      systemPrompt: '',
      costLimit: 100,
      usageLimit: 99999,
      fallbackProvider: null,
    }
    expect(config.maxTokens).toBe(1000000)
  })
})

describe('AiTutorConfig', () => {
  const baseConfig: AiTutorConfig = {
    mode: 'friendly-tutor',
    explanationStyle: 'detailed',
    correctionStrictness: 'balanced',
    responseLanguage: 'english',
    exerciseDifficulty: 'adaptive',
    feedbackDepth: 'standard',
    automationLevel: 'semi-automatic',
    studyReminderFrequency: 'daily',
    customSystemPrompt: '',
  }

  it('validates all explanation styles', () => {
    const styles: ExplanationStyle[] = ['simple', 'detailed', 'example-based', 'socratic', 'step-by-step']
    for (const style of styles) {
      expect({ ...baseConfig, explanationStyle: style }).toHaveProperty('explanationStyle', style)
    }
  })

  it('validates all correction strictness levels', () => {
    const levels: CorrectionStrictness[] = ['gentle', 'balanced', 'strict']
    for (const level of levels) {
      expect({ ...baseConfig, correctionStrictness: level }).toHaveProperty('correctionStrictness', level)
    }
  })

  it('validates all exercise difficulty levels', () => {
    const levels: ExerciseDifficulty[] = ['easy', 'medium', 'hard', 'adaptive']
    for (const level of levels) {
      expect({ ...baseConfig, exerciseDifficulty: level }).toHaveProperty('exerciseDifficulty', level)
    }
  })

  it('validates all feedback depths', () => {
    const depths: FeedbackDepth[] = ['minimal', 'standard', 'thorough']
    for (const depth of depths) {
      expect({ ...baseConfig, feedbackDepth: depth }).toHaveProperty('feedbackDepth', depth)
    }
  })

  it('validates all automation levels', () => {
    const levels: AutomationLevel[] = ['manual', 'semi-automatic', 'automatic']
    for (const level of levels) {
      expect({ ...baseConfig, automationLevel: level }).toHaveProperty('automationLevel', level)
    }
  })

  it('validates all reminder frequencies', () => {
    const frequencies: StudyReminderFrequency[] = ['none', 'daily', 'weekdays', 'custom']
    for (const freq of frequencies) {
      expect({ ...baseConfig, studyReminderFrequency: freq }).toHaveProperty('studyReminderFrequency', freq)
    }
  })

  it('stores custom system prompt', () => {
    const prompt = 'Always provide band-9 examples'
    expect({ ...baseConfig, customSystemPrompt: prompt }).toHaveProperty('customSystemPrompt', prompt)
  })

  it('handles empty custom system prompt', () => {
    expect(baseConfig.customSystemPrompt).toBe('')
  })
})

describe('AiResponseLanguage', () => {
  it('accepts all valid languages', () => {
    const languages: AiResponseLanguage[] = ['english', 'vietnamese', 'both']
    expect(languages).toHaveLength(3)
  })

  it('supports "both" for bilingual responses', () => {
    const config: ConfigurationBasic = {
      targetBand: 6.5,
      examDate: '',
      responseLanguage: 'both',
      tutorMode: 'friendly-tutor',
      dailyStudyMinutes: 45,
    }
    expect(config.responseLanguage).toBe('both')
  })
})

describe('StudyPreferences', () => {
  it('creates a valid StudyPreferences object', () => {
    const prefs: StudyPreferences = {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: '2026-12-15',
      dailyStudyMinutes: 60,
      weakSkills: ['Writing', 'Speaking'],
      preferredTopics: ['Environment', 'Education'],
      studyGoal: 'academic',
      preferredSchedule: ['mon', 'wed', 'fri'],
      studyReminder: '09:00',
    }
    expect(prefs.weakSkills).toHaveLength(2)
    expect(prefs.studyGoal).toBe('academic')
    expect(prefs.preferredSchedule).toContain('mon')
  })

  it('handles empty weak skills', () => {
    const prefs: StudyPreferences = {
      targetBand: 6.0,
      currentBand: 5.0,
      examDate: '',
      dailyStudyMinutes: 30,
      weakSkills: [],
      preferredTopics: [],
      studyGoal: 'general',
      preferredSchedule: [],
      studyReminder: '',
    }
    expect(prefs.weakSkills).toHaveLength(0)
  })

  it('validates target band range boundaries', () => {
    const low: StudyPreferences['targetBand'] = 1
    const high: StudyPreferences['targetBand'] = 9
    expect(low).toBeGreaterThanOrEqual(1)
    expect(high).toBeLessThanOrEqual(9)
  })
})

describe('VocabReviewSettings', () => {
  it('toggles all boolean settings', () => {
    const base: VocabReviewSettings = {
      reviewsPerDay: 20,
      enableSpacedRepetition: true,
      enableContextSentences: true,
      enableExampleSentences: true,
      enableSynonyms: true,
    }
    expect(base.enableSpacedRepetition).toBe(true)
    expect(base.enableContextSentences).toBe(true)
  })

  it('allows all features to be disabled', () => {
    const settings: VocabReviewSettings = {
      reviewsPerDay: 10,
      enableSpacedRepetition: false,
      enableContextSentences: false,
      enableExampleSentences: false,
      enableSynonyms: false,
    }
    expect(Object.values(settings).every(v => v === false || typeof v === 'number')).toBe(true)
  })

  it('reviewsPerDay can be 0', () => {
    const settings: VocabReviewSettings = {
      reviewsPerDay: 0,
      enableSpacedRepetition: false,
      enableContextSentences: false,
      enableExampleSentences: false,
      enableSynonyms: false,
    }
    expect(settings.reviewsPerDay).toBe(0)
  })
})

describe('SpeakingFeedbackSettings', () => {
  it('allows all feedback types to be enabled', () => {
    const settings: SpeakingFeedbackSettings = {
      enablePronunciationFeedback: true,
      enableFluencyFeedback: true,
      enableVocabularyFeedback: true,
      enableGrammarFeedback: true,
    }
    expect(Object.values(settings).every(v => v === true)).toBe(true)
  })

  it('allows selective disabling', () => {
    const settings: SpeakingFeedbackSettings = {
      enablePronunciationFeedback: true,
      enableFluencyFeedback: false,
      enableVocabularyFeedback: true,
      enableGrammarFeedback: false,
    }
    expect(settings.enablePronunciationFeedback).toBe(true)
    expect(settings.enableFluencyFeedback).toBe(false)
  })
})

describe('WritingCorrectionSettings', () => {
  it('includes showImprovedVersion field', () => {
    const settings: WritingCorrectionSettings = {
      enableGrammarCorrection: true,
      enableVocabularySuggestion: true,
      enableStructureFeedback: true,
      enableCoherenceFeedback: true,
      showImprovedVersion: true,
    }
    expect(settings.showImprovedVersion).toBe(true)
  })

  it('handles all features disabled except showImprovedVersion', () => {
    const settings: WritingCorrectionSettings = {
      enableGrammarCorrection: false,
      enableVocabularySuggestion: false,
      enableStructureFeedback: false,
      enableCoherenceFeedback: false,
      showImprovedVersion: true,
    }
    expect(settings.showImprovedVersion).toBe(true)
  })
})

describe('PrivacySettings', () => {
  it('accepts both privacy levels', () => {
    const levels: PrivacyLevel[] = ['local-only', 'local-with-analytics']
    for (const privacyLevel of levels) {
      const settings: PrivacySettings = {
        privacyLevel,
        allowAnonymousAnalytics: false,
        allowCrashReporting: false,
        storeConversationHistory: true,
        storeUsageStatistics: true,
      }
      expect(settings.privacyLevel).toBe(privacyLevel)
    }
  })

  it('local-only prevents analytics and crash reporting', () => {
    const settings: PrivacySettings = {
      privacyLevel: 'local-only',
      allowAnonymousAnalytics: false,
      allowCrashReporting: false,
      storeConversationHistory: true,
      storeUsageStatistics: true,
    }
    expect(settings.allowAnonymousAnalytics).toBe(false)
    expect(settings.allowCrashReporting).toBe(false)
  })
})

describe('ConfigurationAdvanced', () => {
  it('holds multiple providers', () => {
    const advanced: ConfigurationAdvanced = {
      activeProviderId: 'p1',
      providers: {
        p1: { providerId: 'p1', provider: 'openai', apiKey: '', baseUrl: '', model: 'gpt-4', temperature: 0.7, maxTokens: 2048, systemPrompt: '', costLimit: 10, usageLimit: 1000, fallbackProvider: null },
        p2: { providerId: 'p2', provider: 'claude', apiKey: '', baseUrl: '', model: 'claude-3', temperature: 0.5, maxTokens: 4096, systemPrompt: '', costLimit: 20, usageLimit: 500, fallbackProvider: null },
      },
      tutorConfig: { mode: 'friendly-tutor', explanationStyle: 'detailed', correctionStrictness: 'balanced', responseLanguage: 'english', exerciseDifficulty: 'adaptive', feedbackDepth: 'standard', automationLevel: 'semi-automatic', studyReminderFrequency: 'daily', customSystemPrompt: '' },
      vocabReview: { reviewsPerDay: 20, enableSpacedRepetition: true, enableContextSentences: true, enableExampleSentences: true, enableSynonyms: true },
      speakingFeedback: { enablePronunciationFeedback: true, enableFluencyFeedback: true, enableVocabularyFeedback: true, enableGrammarFeedback: true },
      writingCorrection: { enableGrammarCorrection: true, enableVocabularySuggestion: true, enableStructureFeedback: true, enableCoherenceFeedback: true, showImprovedVersion: true },
      privacy: { privacyLevel: 'local-only', allowAnonymousAnalytics: false, allowCrashReporting: false, storeConversationHistory: true, storeUsageStatistics: true },
    }
    expect(Object.keys(advanced.providers)).toHaveLength(2)
    expect(advanced.activeProviderId).toBe('p1')
  })

  it('handles empty providers edge case', () => {
    const advanced: ConfigurationAdvanced = {
      activeProviderId: '',
      providers: {},
      tutorConfig: { mode: 'friendly-tutor', explanationStyle: 'detailed', correctionStrictness: 'balanced', responseLanguage: 'english', exerciseDifficulty: 'adaptive', feedbackDepth: 'standard', automationLevel: 'semi-automatic', studyReminderFrequency: 'daily', customSystemPrompt: '' },
      vocabReview: { reviewsPerDay: 20, enableSpacedRepetition: true, enableContextSentences: true, enableExampleSentences: true, enableSynonyms: true },
      speakingFeedback: { enablePronunciationFeedback: true, enableFluencyFeedback: true, enableVocabularyFeedback: true, enableGrammarFeedback: true },
      writingCorrection: { enableGrammarCorrection: true, enableVocabularySuggestion: true, enableStructureFeedback: true, enableCoherenceFeedback: true, showImprovedVersion: true },
      privacy: { privacyLevel: 'local-only', allowAnonymousAnalytics: false, allowCrashReporting: false, storeConversationHistory: true, storeUsageStatistics: true },
    }
    expect(Object.keys(advanced.providers)).toHaveLength(0)
  })
})

describe('ConfigurationBasic', () => {
  it('stores valid exam date string', () => {
    const config: ConfigurationBasic = {
      targetBand: 6.5,
      examDate: '2026-10-15',
      responseLanguage: 'english',
      tutorMode: 'strict-examiner',
      dailyStudyMinutes: 90,
    }
    expect(config.examDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('handles empty exam date', () => {
    const config: ConfigurationBasic = {
      targetBand: 6.5,
      examDate: '',
      responseLanguage: 'english',
      tutorMode: 'friendly-tutor',
      dailyStudyMinutes: 60,
    }
    expect(config.examDate).toBe('')
  })

  it('accepts all tutor modes in basic config', () => {
    const modes: AiTutorMode[] = [
      'friendly-tutor', 'strict-examiner', 'simple-english-teacher',
      'vietnamese-explanation-tutor', 'motivation-coach', 'grammar-focused-tutor',
      'vocabulary-focused-tutor', 'writing-correction-tutor', 'speaking-practice-tutor',
    ]
    for (const mode of modes) {
      const config: ConfigurationBasic = {
        targetBand: 6.0,
        examDate: '',
        responseLanguage: 'english',
        tutorMode: mode,
        dailyStudyMinutes: 30,
      }
      expect(config.tutorMode).toBe(mode)
    }
  })
})

describe('UserConfiguration', () => {
  it('combines basic and advanced parts', () => {
    const userConfig: UserConfiguration = {
      basic: {
        targetBand: 7.5,
        examDate: '',
        responseLanguage: 'english',
        tutorMode: 'vocabulary-focused-tutor',
        dailyStudyMinutes: 120,
      },
      advanced: {
        activeProviderId: 'default-openai',
        providers: {},
        tutorConfig: { mode: 'vocabulary-focused-tutor', explanationStyle: 'example-based', correctionStrictness: 'strict', responseLanguage: 'english', exerciseDifficulty: 'hard', feedbackDepth: 'thorough', automationLevel: 'automatic', studyReminderFrequency: 'daily', customSystemPrompt: '' },
        vocabReview: { reviewsPerDay: 30, enableSpacedRepetition: true, enableContextSentences: true, enableExampleSentences: true, enableSynonyms: false },
        speakingFeedback: { enablePronunciationFeedback: true, enableFluencyFeedback: true, enableVocabularyFeedback: false, enableGrammarFeedback: true },
        writingCorrection: { enableGrammarCorrection: true, enableVocabularySuggestion: true, enableStructureFeedback: true, enableCoherenceFeedback: false, showImprovedVersion: true },
        privacy: { privacyLevel: 'local-only', allowAnonymousAnalytics: false, allowCrashReporting: false, storeConversationHistory: true, storeUsageStatistics: false },
      },
    }
    expect(userConfig.basic.targetBand).toBe(7.5)
    expect(userConfig.advanced.tutorConfig.mode).toBe('vocabulary-focused-tutor')
  })
})
