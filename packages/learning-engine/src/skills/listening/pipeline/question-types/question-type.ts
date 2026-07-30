// ═══════════════════════════════════════════════════════════════════════
// QuestionTypeStrategy — Per-question-type generation strategy
// ═══════════════════════════════════════════════════════════════════════

import type {
  InformationEntity,
  QuestionLayout,
  QuestionPresentation,
  ValidationError,
} from '../types'

export interface QuestionTypeBuildInput {
  entities: InformationEntity[]
  scenarioTitle: string
  scenarioTopic: string
}

export interface QuestionTypeBuildOutput {
  layout: QuestionLayout
  presentation: QuestionPresentation
  instructions: string
  totalQuestions: number
}

export interface QuestionTypeStrategy {
  /** The question layout this strategy produces */
  readonly layout: QuestionLayout

  /** Human-readable label */
  readonly label: string

  /** Whether this type is suitable for the given part */
  supportsPart(part: string): boolean

  /** Build the question set for the given entities */
  build(input: QuestionTypeBuildInput): QuestionTypeBuildOutput

  /** Validate the output for this question type */
  validate(presentation: QuestionPresentation, entities: InformationEntity[]): ValidationError[]
}
