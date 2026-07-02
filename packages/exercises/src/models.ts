import type {
  ISOString,
  ExerciseSkill,
  ExerciseSource,
  ExerciseDifficulty,
  QuestionType,
  ExerciseStatus,
  AttemptStatus,
  ReviewRating,
  MatchingPair,
  FillInBlank,
} from './types'

export interface AnswerExplanation {
  correctAnswer: string | string[] | number | MatchingPair[]
  explanation: string
  tips?: string[]
  references?: string[]
}

export interface ExerciseQuestion {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  correctAnswer: string | string[] | number | MatchingPair[]
  explanation: AnswerExplanation
  blanks?: FillInBlank[]
  matchingPairs?: MatchingPair[]
  points?: number
  difficulty?: ExerciseDifficulty
  tags?: string[]
}

export interface Exercise {
  id: string
  title: string
  description?: string
  skill: ExerciseSkill
  topic: string
  source: ExerciseSource
  difficulty: ExerciseDifficulty
  questions: ExerciseQuestion[]
  totalPoints: number
  estimatedMinutes: number
  status: ExerciseStatus
  tags: string[]
  metadata?: Record<string, unknown>
  sourceId?: string
  contentVersion?: number
  createdAt: ISOString
  updatedAt: ISOString
}

export interface ExerciseAttemptAnswer {
  questionId: string
  userAnswer: string | string[] | number | boolean | MatchingPair[]
  isCorrect: boolean
  timeSpentSeconds: number
  score: number
  maxScore: number
}

export interface ExerciseAttempt {
  id: string
  exerciseId: string
  skill: ExerciseSkill
  status: AttemptStatus
  answers: ExerciseAttemptAnswer[]
  totalScore: number
  maxScore: number
  accuracy: number
  timeSpentSeconds: number
  startedAt: ISOString
  completedAt?: ISOString
  metadata?: Record<string, unknown>
}

export interface ExerciseResult {
  id: string
  exerciseId: string
  attemptId: string
  skill: ExerciseSkill
  topic: string
  score: number
  total: number
  accuracy: number
  timeSpentSeconds: number
  questions: ExerciseAttemptAnswer[]
  mistakes: Array<{
    questionId: string
    question: string
    userAnswer: string | string[] | number | boolean | MatchingPair[]
    correctAnswer: string | string[] | number | MatchingPair[]
    explanation: string
    skill: ExerciseSkill
  }>
  review: {
    nextReviewAt: ISOString
    interval: number
    easeFactor: number
    repetitions: number
  }
  createdAt: ISOString
}

export interface ExerciseReviewRecord {
  id: string
  exerciseId: string
  resultId: string
  lastReviewedAt: ISOString
  nextReviewAt: ISOString
  interval: number
  easeFactor: number
  repetitions: number
  history: Array<{
    date: ISOString
    rating: ReviewRating
    score: number
  }>
  createdAt: ISOString
  updatedAt: ISOString
}
