import type { ExerciseModule } from './exercise-module'
import type { ExerciseMode } from './exercise-mode'
import type { ExerciseFamily } from './exercise-family'
import type { IeltsVariant } from './ielts-variant'
import type { ExerciseDifficultyProfile } from './difficulty'
import type { ExerciseStatus, ExerciseSource, LearningObjective } from './common'
import type { QuestionGroup, ExerciseQuestion } from './question'

export interface BaseExercise {
  id: string
  schemaVersion: number
  blueprintVersion: string

  module: ExerciseModule
  mode: ExerciseMode
  family: ExerciseFamily

  title: string
  description?: string
  instructions: string[]

  source: ExerciseSource
  status: ExerciseStatus

  estimatedDurationSeconds: number
  difficulty: ExerciseDifficultyProfile

  learningObjectives: LearningObjective[]
  tags: string[]

  ieltsVariant?: IeltsVariant

  createdAt: string
  updatedAt: string
}

export interface ReadingPassage {
  id: string
  title: string
  content: string
  wordCount: number
  questionGroups: QuestionGroup[]
}

export interface ReadingExercise extends BaseExercise {
  module: 'reading'
  passages: ReadingPassage[]
  totalQuestionCount: number
}

export interface ListeningPart {
  id: string
  partNumber: number
  description?: string
  audioDurationSeconds: number
  questionGroups: QuestionGroup[]
}

export interface ListeningExercise extends BaseExercise {
  module: 'listening'
  parts: ListeningPart[]
  totalQuestionCount: number
  audioSegments: AudioSegment[]
}

export interface AudioSegment {
  id: string
  partId: string
  url?: string
  durationSeconds: number
  transcript?: string
}

export interface WritingTask {
  id: string
  taskNumber: number
  taskType: 'task_1' | 'task_2'
  prompt: string
  instructions: string[]
  recommendedWordCount: { min: number; max?: number }
  recommendedMinutes: number
  weight: number
  rubric: WritingRubricCriterion[]
}

export interface WritingRubricCriterion {
  id: string
  name: string
  description: string
  maxScore: number
}

export interface WritingExercise extends BaseExercise {
  module: 'writing'
  tasks: WritingTask[]
}

export interface SpeakingPart {
  id: string
  partNumber: number
  description: string
  prompts: string[]
  preparationSeconds: number
  responseSeconds: number
  examinerScript?: string
}

export interface SpeakingExercise extends BaseExercise {
  module: 'speaking'
  parts: SpeakingPart[]
  totalDurationSeconds: number
}

export type GrammarExerciseType =
  | 'multiple_choice'
  | 'gap_completion'
  | 'sentence_correction'
  | 'error_identification'
  | 'sentence_transformation'
  | 'word_order'
  | 'matching'
  | 'guided_production'
  | 'free_production'
  | 'contextual_grammar'

export interface GrammarItem {
  id: string
  grammarConcept: string
  targetLevel?: string
  question: ExerciseQuestion
  expectedAnswerModel?: string
  acceptedVariants: string[]
  errorCategory?: string
  autoScoringReliable: boolean
}

export interface GrammarExercise extends BaseExercise {
  module: 'grammar'
  grammarType: GrammarExerciseType
  items: GrammarItem[]
  context?: string
}

export type VocabularyExerciseType =
  | 'meaning_selection'
  | 'word_to_definition'
  | 'definition_to_word'
  | 'context_completion'
  | 'collocation_matching'
  | 'word_family'
  | 'synonym_antonym'
  | 'spelling'
  | 'pronunciation'
  | 'productive_sentence'
  | 'contextual_recall'

export interface VocabularyTerm {
  id: string
  lemma: string
  partOfSpeech: string
  meaning: string
  context?: string
  collocations: string[]
  wordFamily: string[]
  pronunciation?: string
  acceptedForms: string[]
  sourceContentId?: string
  spacedRepetition?: SpacedRepetitionMetadata
}

export interface SpacedRepetitionMetadata {
  easeFactor: number
  intervalDays: number
  repetitions: number
  nextReviewDate: string
  lastReviewDate?: string
}

export interface VocabularyExercise extends BaseExercise {
  module: 'vocabulary'
  vocabularyType: VocabularyExerciseType
  terms: VocabularyTerm[]
  activities: QuestionGroup[]
}

export interface SavedContentReference {
  contentId: string
  contentType: 'article' | 'book' | 'transcript' | 'user_note' | 'browser_selection'
  title: string
  excerpt?: string
}

export interface SavedContentExercise extends BaseExercise {
  module: 'saved_content'
  contentReference: SavedContentReference
  activities: QuestionGroup[]
}

export interface MistakeEvidence {
  sourceExerciseId: string
  sourceAttemptId: string
  itemId?: string

  module: ExerciseModule
  errorType: string
  learnerAnswer?: unknown
  expectedAnswer?: unknown

  explanation?: string
  occurredAt: string
}

export interface MistakeReviewExercise extends BaseExercise {
  module: 'mistake_review'
  mistakes: MistakeEvidence[]
  reviewActivities: QuestionGroup[]
}

export type Exercise =
  | ReadingExercise
  | ListeningExercise
  | WritingExercise
  | SpeakingExercise
  | GrammarExercise
  | VocabularyExercise
  | SavedContentExercise
  | MistakeReviewExercise
