import type { IELTSSection } from '../value-objects'
import type { ExerciseDifficulty } from '../value-objects'
import type { ExerciseQuestion } from './exercise-question'

export type ExerciseType = 'lesson' | 'quiz' | 'essay' | 'speaking' | 'comprehension' | 'error-correction' | 'gap-fill' | 'matching' | 'shadowing'

export type ExerciseSourceType = 'built-in' | 'ai-generated' | 'saved-content' | 'saved-vocabulary' | 'user-mistakes' | 'youtube-transcript' | 'article' | 'manual'

export type ExplanationPolicy = 'always' | 'after-attempt' | 'on-demand' | 'never'
export type EvaluationPolicy = 'deterministic' | 'ai-assisted' | 'ai-only' | 'self-evaluated'

export interface LearningContentPayload {
  passage?: string
  prompt?: string
  transcript?: string
  imageUrl?: string
  audioUrl?: string
  referenceUrl?: string
}

export interface Exercise {
  id: string
  sessionId: string
  skill: IELTSSection
  exerciseType: ExerciseType
  objectiveId: string
  title: string
  instructions: string
  content?: LearningContentPayload
  questions: ExerciseQuestion[]
  difficulty: ExerciseDifficulty
  estimatedMinutes: number
  sourceType: ExerciseSourceType
  sourceIds: string[]
  explanationPolicy: ExplanationPolicy
  evaluationPolicy: EvaluationPolicy
  metadata: {
    targetBand?: number
    focusAreas: string[]
    templateId?: string
    aiGenerationId?: string
    contextSnapshotHash: string
    schemaVersion: string
  }
}

export interface ExerciseTemplate {
  id: string
  skill: IELTSSection
  type: ExerciseType
  supportedBands: { minimum: number; maximum: number }
  supportedDurations: number[]
  difficulty: ExerciseDifficulty
  tags: string[]
  build(input: ExerciseTemplateInput): Exercise
}

export interface ExerciseTemplateInput {
  sessionId: string
  objectiveId: string
  difficulty: ExerciseDifficulty
  estimatedMinutes: number
  contextSnapshotHash: string
}

export interface GenerateExerciseRequest {
  objective: import('./learning-objective').LearningObjective
  skill: IELTSSection
  requestedType?: ExerciseType
  contextScope: string
  sourceContent?: LearningContentPayload
  constraints: {
    availableMinutes: number
    targetQuestionCount?: number
    allowedQuestionTypes?: import('./exercise-question').ExerciseQuestionType[]
    maximumContentLength?: number
    offlineOnly: boolean
  }
  preferences?: {
    difficulty?: ExerciseDifficulty
    language?: string
    useSavedVocabulary?: boolean
    includeExplanations?: boolean
  }
  correlationId: string
}
