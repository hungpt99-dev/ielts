import type { QuestionDifficultyProfile } from './difficulty'

export interface BaseQuestion {
  id: string
  number?: number
  type: string

  prompt: string
  instructions?: string[]

  points: number
  difficulty: QuestionDifficultyProfile

  learningObjectiveIds: string[]

  explanation?: string
  evidence?: AnswerEvidence
}

export interface AnswerEvidence {
  sourceText?: string
  referenceLocation?: string
  audioTimestamp?: number
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: string[]
  correctIndex: number
}

export interface MultipleSelectQuestion extends BaseQuestion {
  type: 'multiple_select'
  options: string[]
  correctIndices: number[]
  minSelections?: number
  maxSelections?: number
}

export interface TrueFalseNotGivenQuestion extends BaseQuestion {
  type: 'true_false_not_given'
  statement: string
  correctAnswer: 'true' | 'false' | 'not_given'
  referenceText?: string
}

export interface YesNoNotGivenQuestion extends BaseQuestion {
  type: 'yes_no_not_given'
  statement: string
  correctAnswer: 'yes' | 'no' | 'not_given'
  referenceText?: string
}

export interface CompletionQuestion extends BaseQuestion {
  type: 'completion'
  subtype: 'gap_fill' | 'sentence_completion' | 'summary_completion' | 'note_completion' | 'table_completion' | 'flow_chart_completion' | 'form_completion'
  text: string
  gaps: CompletionGap[]
  wordLimit?: number
}

export interface CompletionGap {
  id: string
  position: number
  correctAnswer: string
  acceptableAlternatives: string[]
  caseSensitive: boolean
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  subtype: 'matching_headings' | 'matching_information' | 'matching_features' | 'matching_sentence_endings' | 'general_matching'
  leftItems: MatchingItem[]
  rightItems: MatchingItem[]
  correctMatches: Record<string, string>
  allowMultipleMatches?: boolean
}

export interface MatchingItem {
  id: string
  content: string
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering'
  items: OrderingItem[]
  correctOrder: string[]
}

export interface OrderingItem {
  id: string
  content: string
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer'
  correctAnswer: string
  acceptableAlternatives: string[]
  wordLimit?: number
  caseSensitive: boolean
}

export interface ClassificationQuestion extends BaseQuestion {
  type: 'classification'
  categories: string[]
  correctCategory: string
  items: string[]
}

export interface MapLabellingQuestion extends BaseQuestion {
  type: 'map_labelling'
  mapImageUrl: string
  labels: MapLabel[]
  correctPositions: Record<string, MapPosition>
}

export interface MapLabel {
  id: string
  text: string
}

export interface MapPosition {
  x: number
  y: number
  label: string
}

export interface DiagramLabellingQuestion extends BaseQuestion {
  type: 'diagram_labelling'
  diagramImageUrl: string
  labels: DiagramLabel[]
  correctAnswers: Record<string, string>
}

export interface DiagramLabel {
  id: string
  position: string
}

export type ExerciseQuestion =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseNotGivenQuestion
  | YesNoNotGivenQuestion
  | CompletionQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ShortAnswerQuestion
  | ClassificationQuestion
  | MapLabellingQuestion
  | DiagramLabellingQuestion

export interface QuestionGroup {
  id: string
  type: string

  startNumber?: number
  endNumber?: number

  instructions: string[]
  sharedContent?: unknown

  questions: ExerciseQuestion[]
}
