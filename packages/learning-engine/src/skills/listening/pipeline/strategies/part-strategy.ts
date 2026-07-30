// ═══════════════════════════════════════════════════════════════════════
// ListeningPartStrategy — Interface for per-part generation
// ═══════════════════════════════════════════════════════════════════════

import type {
  ConversationScenario,
  Distractor,
  InformationEntity,
  LanguageFeatureProfile,
  ListeningPart,
  PipelineConfig,
  QuestionLayout,
  QuestionSet,
  SpeakerProfile,
  Transcript,
  ValidationResult,
} from '../types'

export interface PartScenarioInput {
  config: PipelineConfig
}

export interface PartTranscriptInput {
  scenario: ConversationScenario
  distractors: Distractor[]
}

export interface PartQuestionInput {
  scenario: ConversationScenario
  transcript: Transcript
  questionCount: number
}

export interface PartDistractorInput {
  scenario: ConversationScenario
  maxDistractors: number
}

export interface PartValidationInput {
  questionSet: QuestionSet
  transcript: Transcript
  distractors: Distractor[]
}

export interface ListeningPartStrategy {
  readonly part: ListeningPart

  /** Topics appropriate for this part */
  readonly topics: string[]

  /** Number of speakers */
  readonly speakerCount: number

  /** Allowed question layouts for this part */
  readonly allowedLayouts: QuestionLayout[]

  /** Default question count */
  readonly defaultQuestionCount: number

  /** Whether distractors are enabled for this part */
  readonly distractorEnabled: boolean

  /** Create speaker profiles for this part */
  createSpeakers(): SpeakerProfile[]

  /** Build language features appropriate for this part/band */
  getLanguageFeatures(targetBand: number): LanguageFeatureProfile

  /** Define the expected information entities for this part */
  getExpectedEntities(questionCount: number): InformationEntity[]

  /** Build a scenario for this part */
  createScenario(config: PipelineConfig): ConversationScenario

  /** Build the transcript (conversation/monologue) */
  buildTranscript(input: PartTranscriptInput): Transcript

  /** Build the question set with part-appropriate layout */
  buildQuestions(input: PartQuestionInput): QuestionSet

  /** Build distractors (returns empty array if not applicable) */
  buildDistractors(input: PartDistractorInput): Distractor[]

  /** Part-specific validation rules (called after generic validation) */
  validatePart(input: PartValidationInput): ValidationResult
}
