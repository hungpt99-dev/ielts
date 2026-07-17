export type AiProviderType =
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'groq'
  | 'local'
  | 'custom'

export type AiTutorMode =
  | 'friendly-tutor'
  | 'strict-examiner'
  | 'simple-english-teacher'
  | 'vietnamese-explanation-tutor'
  | 'motivation-coach'
  | 'grammar-focused-tutor'
  | 'vocabulary-focused-tutor'
  | 'writing-correction-tutor'
  | 'speaking-practice-tutor'

export type ExplanationStyle =
  | 'simple'
  | 'detailed'
  | 'example-based'
  | 'socratic'
  | 'step-by-step'

export type CorrectionStrictness = 'gentle' | 'balanced' | 'strict'

export type AiResponseLanguage = 'english' | 'vietnamese' | 'both'

export type ExerciseDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive'

export type FeedbackDepth = 'minimal' | 'standard' | 'thorough'

export type AutomationLevel = 'manual' | 'semi-automatic' | 'automatic'

export type StudyReminderFrequency = 'none' | 'daily' | 'weekdays' | 'custom'

export type PrivacyLevel = 'local-only' | 'local-with-analytics'

export interface AiProviderConfig {
  providerId: string
  provider: AiProviderType
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  costLimit: number
  usageLimit: number
  fallbackProvider: string | null
}

export interface AiTutorConfig {
  mode: AiTutorMode
  explanationStyle: ExplanationStyle
  correctionStrictness: CorrectionStrictness
  responseLanguage: AiResponseLanguage
  exerciseDifficulty: ExerciseDifficulty
  feedbackDepth: FeedbackDepth
  automationLevel: AutomationLevel
  studyReminderFrequency: StudyReminderFrequency
  customSystemPrompt: string
}

export interface StudyPreferences {
  targetBand: number
  currentBand: number
  examDate: string
  dailyStudyMinutes: number
  weakSkills: string[]
  preferredTopics: string[]
  studyGoal: 'academic' | 'general'
  preferredSchedule: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
  studyReminder: string
}

export interface VocabReviewSettings {
  reviewsPerDay: number
  enableSpacedRepetition: boolean
  enableContextSentences: boolean
  enableExampleSentences: boolean
  enableSynonyms: boolean
}

export interface SpeakingFeedbackSettings {
  enablePronunciationFeedback: boolean
  enableFluencyFeedback: boolean
  enableVocabularyFeedback: boolean
  enableGrammarFeedback: boolean
}

export interface WritingCorrectionSettings {
  enableGrammarCorrection: boolean
  enableVocabularySuggestion: boolean
  enableStructureFeedback: boolean
  enableCoherenceFeedback: boolean
  showImprovedVersion: boolean
}

export interface PrivacySettings {
  privacyLevel: PrivacyLevel
  allowAnonymousAnalytics: boolean
  allowCrashReporting: boolean
  storeConversationHistory: boolean
  storeUsageStatistics: boolean
}

export interface ConfigurationAdvanced {
  activeProviderId: string
  providers: Record<string, AiProviderConfig>
  tutorConfig: AiTutorConfig
  vocabReview: VocabReviewSettings
  speakingFeedback: SpeakingFeedbackSettings
  writingCorrection: WritingCorrectionSettings
  privacy: PrivacySettings
}

export interface ConfigurationBasic {
  targetBand: number
  examDate: string
  nativeLanguage: string
  responseLanguage: AiResponseLanguage
  tutorMode: AiTutorMode
  dailyStudyMinutes: number
}

export interface ExtendedUserConfiguration {
  basic: ConfigurationBasic
  advanced: ConfigurationAdvanced
}
