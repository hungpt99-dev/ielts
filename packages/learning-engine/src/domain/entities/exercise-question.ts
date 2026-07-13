export type ExerciseQuestionType =
  | 'multiple-choice'
  | 'multiple-select'
  | 'true-false-not-given'
  | 'yes-no-not-given'
  | 'gap-fill'
  | 'short-answer'
  | 'matching'
  | 'matching-headings'
  | 'sentence-completion'
  | 'error-correction'
  | 'ordering'
  | 'free-response'
  | 'essay'
  | 'speaking-response'
  | 'shadowing'
  | 'reflection'

export interface MultipleChoiceQuestion {
  type: 'multiple-choice'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface GapFillQuestion {
  type: 'gap-fill'
  text: string        // text with ___ markers
  answers: string[]
  acceptableAlternatives?: string[][]
  explanation: string
}

export interface TrueFalseNotGivenQuestion {
  type: 'true-false-not-given'
  question: string
  answer: 'true' | 'false' | 'not-given'
  explanation: string
  referenceText?: string
}

export interface ShortAnswerQuestion {
  type: 'short-answer'
  question: string
  answer: string
  acceptableAlternatives?: string[]
  explanation: string
}

export interface MatchingQuestion {
  type: 'matching'
  instruction: string
  leftItems: string[]
  rightItems: string[]
  correctMatches: Record<string, string>
  explanation: string
}

export interface ErrorCorrectionQuestion {
  type: 'error-correction'
  sentence: string
  error: string
  correction: string
  explanation: string
}

export interface EssayQuestion {
  type: 'essay'
  prompt: string
  wordLimit?: number
  rubric: string[]
}

export interface SpeakingResponseQuestion {
  type: 'speaking-response'
  prompt: string
  preparationSeconds: number
  responseSeconds: number
  tips: string[]
}

export type ExerciseQuestion =
  | MultipleChoiceQuestion
  | GapFillQuestion
  | TrueFalseNotGivenQuestion
  | ShortAnswerQuestion
  | MatchingQuestion
  | ErrorCorrectionQuestion
  | EssayQuestion
  | SpeakingResponseQuestion
