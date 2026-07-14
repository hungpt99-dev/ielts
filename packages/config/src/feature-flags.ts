export interface FeatureFlags {
  readonly aiTutor: boolean
  readonly learningEngine: boolean
  readonly planEngine: boolean
  readonly youtubeLearning: boolean
  readonly proactiveTutor: boolean
  readonly progressReview: boolean
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  aiTutor: true,
  learningEngine: true,
  planEngine: true,
  youtubeLearning: true,
  proactiveTutor: true,
  progressReview: true,
}
