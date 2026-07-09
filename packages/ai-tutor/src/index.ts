export { default as ChatPopup } from './components/ChatPopup'
export { TutorAvatar } from './components/TutorAvatar'

export { ProactiveMessageService } from './services/proactiveMessageService'
export { ProactiveEventBus } from './services/proactiveEventBus'

export { AIProgressReviewController } from './controllers/AIProgressReviewController'
export type { AICallFn, ProgressReviewSuccess, ProgressReviewFailure, ProgressReviewResult } from './controllers/AIProgressReviewController'

export type { ProgressReviewData, SkillProgress, WeaknessReport, WeakSkill, RepeatedMistake, VocabularyStatus, ReviewSummary, StudyConsistency, AIProgressReviewResponse } from './prompts/learningProgressReview'
export { buildLearningProgressReviewPrompt } from './prompts/learningProgressReview'

export type { ContextSuggestion } from './types'
export type { ProactiveMessage, ProactiveMessageSettings } from './types'
