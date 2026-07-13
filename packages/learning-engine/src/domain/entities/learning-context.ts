import type { IELTSSection } from '../value-objects'
import type { ExerciseDifficulty } from '../value-objects'
import type { TaskPriority } from './learning-objective'
import type { ProgressTrend } from '../value-objects'

export type LearningContextScope =
  | 'roadmap-task'
  | 'writing'
  | 'speaking'
  | 'reading'
  | 'listening'
  | 'vocabulary'
  | 'grammar'
  | 'mistake-review'
  | 'saved-content'
  | 'article'
  | 'youtube'
  | 'mock-test'
  | 'general-practice'

export interface SkillProgress {
  currentBand?: number
  targetBand?: number
  recentAccuracy?: number
  exercisesCompleted: number
  trend: ProgressTrend
}

export interface LearningWeakness {
  skill: IELTSSection
  description: string
  severity: number
}

export interface LearningStrength {
  skill: IELTSSection
  description: string
}

export interface LearningMistakeSummary {
  skill: IELTSSection
  category: string
  frequency: number
  lastOccurred: string
}

export interface LearningVocabularySummary {
  wordId: string
  word: string
  mastery: number
  dueForReview: boolean
  topic?: string
}

export interface LearningContentSummary {
  id: string
  type: string
  title?: string
  topic?: string
}

export interface LearningAttemptSummary {
  sessionId: string
  exerciseId: string
  score: number
  maximumScore: number
  completedAt: string
}

export interface LearningFeedbackSummary {
  attemptId: string
  overallFeedback: string
  strengths: string[]
  weaknesses: string[]
}

export interface LearningContext {
  generatedAt: string
  learner: {
    currentOverallBand?: number
    targetOverallBand?: number
    currentSkillBands: Partial<Record<IELTSSection, number>>
    targetSkillBands: Partial<Record<IELTSSection, number>>
    examDate?: string
    timezone: string
  }
  studyPlan?: {
    roadmapId: string
    phaseId?: string
    weekId?: string
    taskId?: string
    taskObjective?: string
    taskReason?: string
    scheduledDate?: string
    allocatedMinutes?: number
    taskPriority?: TaskPriority
  }
  progress: {
    overallProgress?: number
    skillProgress: Partial<Record<IELTSSection, SkillProgress>>
    recentAccuracy: Partial<Record<IELTSSection, number>>
    recentStudyMinutes?: number
    learningStreak?: number
    trendBySkill: Partial<Record<IELTSSection, ProgressTrend>>
  }
  weaknesses: LearningWeakness[]
  strengths: LearningStrength[]
  recentMistakes: LearningMistakeSummary[]
  savedVocabulary: LearningVocabularySummary[]
  relevantContent: LearningContentSummary[]
  recentAttempts: LearningAttemptSummary[]
  previousFeedback: LearningFeedbackSummary[]
  preferences: {
    preferredLearningMethods: string[]
    preferredTaskTypes: string[]
    preferredLanguage: string
    maximumSessionMinutes?: number
    preferredDifficulty?: ExerciseDifficulty
  }
  constraints: {
    availableMinutes?: number
    offlineOnly: boolean
    aiAvailable: boolean
  }
  contextQuality: LearningContextQuality
}

export interface LearningContextQuality {
  status: 'complete' | 'partial' | 'insufficient' | 'stale'
  missingSources: string[]
  warnings: string[]
}

export interface BuildLearningContextRequest {
  scope: LearningContextScope
  skill?: IELTSSection
  includeStudyPlan?: boolean
  includeMistakes?: boolean
  includeVocabulary?: boolean
  includeContent?: boolean
  includeHistory?: boolean
  sourceContentId?: string
}
