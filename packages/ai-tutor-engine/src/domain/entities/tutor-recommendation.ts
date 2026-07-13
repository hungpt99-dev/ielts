import type { IELTSSection } from '../value-objects'

export type NextBestAction =
  | { type: 'study-roadmap-task'; taskId: string }
  | { type: 'review-mistakes'; count: number }
  | { type: 'review-vocabulary'; count: number }
  | { type: 'continue-exercise'; exerciseId: string }
  | { type: 'practice-skill'; skill: IELTSSection }
  | { type: 'take-mock-section'; section: IELTSSection }
  | { type: 'read-saved-content'; contentId: string }
  | { type: 'rest' }
  | { type: 'complete-profile'; missingFields: string[] }

export interface NextBestActionRequest {
  learnerState: import('./learner-context').LearnerStateSnapshot
  availableMinutes: number
  preferences?: {
    skillFocus?: IELTSSection
    difficulty?: 'easy' | 'medium' | 'hard'
  }
}

export interface NextBestActionResult {
  action: NextBestAction
  estimatedMinutes: number
  skill: IELTSSection
  priority: number
  reason: string
  relatedDataIds?: string[]
  alternatives: NextBestAction[]
  aiUsed: boolean
}

export interface DailyRecommendation {
  date: string
  focusArea: string
  reason: string
  suggestedTasks: TaskRecommendation[]
  streakMessage: string | null
  weakSkillReminder: string | null
  examCountdownMessage: string | null
}

export interface TaskRecommendation {
  title: string
  description: string
  skill: IELTSSection
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedMinutes: number
  actionLabel: string
}

export interface WeeklyRecommendation {
  weekStart: string
  weekEnd: string
  focusSkills: IELTSSection[]
  objectives: string[]
  suggestedSchedule: Array<{ day: string; tasks: TaskRecommendation[] }>
}
