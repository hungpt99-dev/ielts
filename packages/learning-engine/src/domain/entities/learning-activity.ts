import type { IELTSSection } from '../value-objects'
import type { ExerciseDifficulty } from '../value-objects'
import type { Exercise } from './exercise'

export type ActivityType = 'explanation' | 'worked-example' | 'guided-exercise' | 'independent-exercise' | 'answer-review' | 'reflection' | 'next-step'

export interface LearningActivity {
  id: string
  sessionId: string
  type: ActivityType
  skill: IELTSSection
  title: string
  instructions: string
  estimatedMinutes: number
  order: number
  exercise?: Exercise
  completed: boolean
}

export interface GenerateLearningActivityRequest {
  sessionId: string
  objectiveId: string
  skill: IELTSSection
  activityType: ActivityType
  availableMinutes: number
  difficulty: ExerciseDifficulty
  contextScope: string
  sourceContent?: LearningSourceContent
  correlationId: string
}

export interface GenerateLearningActivityResult {
  activity: LearningActivity
  aiUsed: boolean
  cacheHit: boolean
}

export interface LearningSourceContent {
  id: string
  type: 'article' | 'selected-text' | 'youtube-transcript' | 'note' | 'saved-content' | 'manual-text'
  title?: string
  text: string
  language?: string
  topic?: string
  sourceUrl?: string
  metadata?: {
    videoId?: string
    timestampStart?: number
    timestampEnd?: number
    author?: string
  }
}
