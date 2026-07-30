// ═══════════════════════════════════════════════════════════════════════
// Listening Pipeline — Public API
// ═══════════════════════════════════════════════════════════════════════

export { Validator } from './validator'
export { QualityScorer } from './quality-scorer'
export { DifficultyAnalyzer } from './difficulty-analyzer'
export { ListeningGenerationPipeline } from './generation-pipeline'

export type {
  ListeningPart,
  SpeakerProfile,
  ConversationScenario,
  LanguageFeatureProfile,
  InformationEntity,
  TranscriptLine,
  Transcript,
  TranscriptMetadata,
  QuestionLayout,
  FormField,
  FormLayout,
  FormSection,
  TableLayout,
  TableCompletionRow,
  NoteLayout,
  NoteItem,
  QuestionPresentation,
  QuestionSet,
  AnswerEntry,
  AnswerKey,
  DistractorType,
  Distractor,
  ValidationError,
  ValidationResult,
  QualityDimension,
  QualityReport,
  DifficultyAnalysis,
  PipelineStage,
  PipelineConfig,
  PipelineResult,
  ExerciseMetadata,
  ListeningExerciseOutput,
} from './types'

export { CEFR_VOCABULARY } from './types'

export type { ValidateInput } from './validator'
export type { ScoreInput } from './quality-scorer'
export type { AnalyzeInput } from './difficulty-analyzer'

// ── Strategies ────────────────────────────────────────────────────────
export {
  getStrategy,
  listStrategies,
  part1Strategy,
  part2Strategy,
  part3Strategy,
  part4Strategy,
} from './strategies'
export type {
  ListeningPartStrategy,
  PartScenarioInput,
  PartTranscriptInput,
  PartQuestionInput,
  PartDistractorInput,
  PartValidationInput,
} from './strategies'

// ── Question Types ────────────────────────────────────────────────────
export {
  formCompletionGenerator,
  noteCompletionGenerator,
  tableCompletionGenerator,
  summaryCompletionGenerator,
  sentenceCompletionGenerator,
  multipleChoiceGenerator,
  matchingGenerator,
  pickQuestionType,
  ALL_QUESTION_TYPES,
} from './question-types'
export type {
  QuestionTypeStrategy,
  QuestionTypeBuildInput,
  QuestionTypeBuildOutput,
} from './question-types'
