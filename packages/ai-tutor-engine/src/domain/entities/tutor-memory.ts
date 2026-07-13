export interface TutorMemory {
  learnerId: string
  goals: TutorGoalMemory[]
  preferences: TutorPreferenceMemory[]
  weakPoints: TutorWeakPointMemory[]
  mistakePatterns: TutorMistakeMemory[]
  successfulStrategies: TutorStrategyMemory[]
  openLearningLoops: TutorOpenLoopMemory[]
  recommendationHistory: TutorRecommendationMemory[]
  updatedAt: string
  version: number
}

export interface TutorGoalMemory {
  id: string
  title: string
  description: string
  targetDate?: string
  isAchieved: boolean
  createdAt: string
}

export interface TutorPreferenceMemory {
  key: string
  value: string | number | boolean
  source: 'user-setting' | 'observed'
  confidence: number
  detectedAt: string
  lastConfirmedAt?: string
}

export interface TutorWeakPointMemory {
  id: string
  skill: string
  description: string
  detectedAt: string
  frequency: number
  lastObservedAt: string
  evidenceCount: number
}

export interface TutorMistakeMemory {
  id: string
  pattern: string
  skill: string
  examples: string[]
  frequency: number
  firstDetectedAt: string
  lastDetectedAt: string
  suggestion?: string
}

export interface TutorStrategyMemory {
  id: string
  technique: string
  skill: string
  wasEffective: boolean
  usedCount: number
  lastUsedAt: string
  notes?: string
}

export interface TutorOpenLoopMemory {
  id: string
  topic: string
  context: string
  openedAt: string
  lastActivityAt: string
  status: 'active' | 'stale' | 'resolved'
}

export interface TutorRecommendationMemory {
  id: string
  type: string
  title: string
  outcome: 'shown' | 'opened' | 'accepted' | 'started' | 'completed' | 'dismissed' | 'ignored' | 'expired'
  recommendedAt: string
  resolvedAt?: string
}

export interface UpdateTutorMemoryRequest {
  learnerId: string
  weakPoints?: Partial<TutorWeakPointMemory>[]
  mistakePatterns?: Partial<TutorMistakeMemory>[]
  preferences?: Partial<TutorPreferenceMemory>[]
  goals?: Partial<TutorGoalMemory>[]
  openLearningLoops?: Partial<TutorOpenLoopMemory>[]
}

export interface UpdateTutorMemoryResult {
  success: boolean
  updatedFields: string[]
}
