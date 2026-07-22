import type { ExerciseModule } from '../types/exercise-module'
import type { ExerciseMode } from '../types/exercise-mode'
import type { ExerciseFamily } from '../types/exercise-family'
import type { ExerciseDifficultyProfile } from '../types/difficulty'
import type { LearningObjective } from '../types/common'
import type { IeltsVariant } from '../types/ielts-variant'

export interface ExerciseStructureRule {
  minItems?: number
  maxItems?: number
  exactItems?: number
  requiredParts?: number
  questionsPerPart?: number
  totalQuestions?: number
  passages?: number
  tasks?: number
}

export interface ExerciseTimingRule {
  officialDurationSeconds?: number
  estimatedDurationSeconds: number
  perItemSeconds?: number
  preparationSeconds?: number
  reviewSeconds?: number
  strictMode: boolean
}

export interface ExerciseScoringRule {
  maxScore: number
  scoringMethod: 'deterministic' | 'ai_assisted' | 'ai_only' | 'rubric' | 'hybrid'
  partialCredit: boolean
  weights?: Record<string, number>
}

export interface ExerciseValidationRule {
  field: string
  rule: string
  message: string
  severity: 'error' | 'warning'
}

export interface ExerciseBlueprint {
  id: string
  version: string

  module: ExerciseModule
  mode: ExerciseMode
  family: ExerciseFamily

  ieltsVariant?: IeltsVariant

  structure: ExerciseStructureRule
  timing: ExerciseTimingRule
  scoring: ExerciseScoringRule
  difficulty: ExerciseDifficultyProfile

  allowedQuestionTypes: string[]
  requiredQuestionTypes?: string[]

  learningObjectives: LearningObjective[]

  validationRules: ExerciseValidationRule[]
}

export interface ReadingBlueprint extends ExerciseBlueprint {
  module: 'reading'
  structure: ExerciseStructureRule & {
    passages: number
    totalQuestions: number
  }
}

export interface ListeningBlueprint extends ExerciseBlueprint {
  module: 'listening'
  structure: ExerciseStructureRule & {
    requiredParts: number
    questionsPerPart: number
    totalQuestions: number
  }
}

export interface WritingBlueprint extends ExerciseBlueprint {
  module: 'writing'
  structure: ExerciseStructureRule & {
    tasks: number
    task1Weight: number
    task2Weight: number
  }
}

export interface SpeakingBlueprint extends ExerciseBlueprint {
  module: 'speaking'
  structure: ExerciseStructureRule & {
    requiredParts: number
    part1DurationSeconds: number
    part2PreparationSeconds: number
    part2ResponseSeconds: number
    part3DurationSeconds: number
  }
}

export interface GrammarBlueprint extends ExerciseBlueprint {
  module: 'grammar'
  grammarConcepts: string[]
}

export interface VocabularyBlueprint extends ExerciseBlueprint {
  module: 'vocabulary'
  termCount: number
  vocabularyTypes: string[]
}

export interface ReviewBlueprint extends ExerciseBlueprint {
  module: 'mistake_review'
  sourceModules: ExerciseModule[]
  mistakeCount: number
}

export type ModuleExerciseBlueprint =
  | ReadingBlueprint
  | ListeningBlueprint
  | WritingBlueprint
  | SpeakingBlueprint
  | GrammarBlueprint
  | VocabularyBlueprint
  | ReviewBlueprint

export function freezeBlueprint<T extends ExerciseBlueprint>(blueprint: T): Readonly<T> {
  return Object.freeze({ ...blueprint })
}
