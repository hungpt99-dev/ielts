import type { IELTSSection } from '../value-objects'

export type LearningObjectiveType = 'learn' | 'practice' | 'review' | 'assess' | 'apply' | 'reflect'

export type LearningObjectiveSource =
  | 'roadmap'
  | 'tutor-recommendation'
  | 'user-selected'
  | 'mistake-review'
  | 'vocabulary-review'
  | 'saved-content'
  | 'imported-content'
  | 'system'

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical'

export interface LearningSuccessCriterion {
  type: string
  threshold: number
  description: string
}

export interface LearningObjective {
  id: string
  skill: IELTSSection
  subskill?: string
  type: LearningObjectiveType
  description: string
  targetLevel?: number
  source: LearningObjectiveSource
  sourceId?: string
  estimatedMinutes: number
  priority: TaskPriority
  successCriteria: LearningSuccessCriterion[]
}
