import type { ExerciseQuestion, ExerciseAttemptAnswer } from './models'
import type { MatchingPair } from './types'
import type { QuestionType } from './types'

export interface ScoreResult {
  isCorrect: boolean
  score: number
  maxScore: number
  feedback?: string
}

export interface ScoringStrategy {
  readonly type: QuestionType
  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeList(values: string[]): string[] {
  return values.map(v => normalizeText(v))
}

export class MultipleChoiceScoring implements ScoringStrategy {
  readonly type: QuestionType = 'multiple-choice'

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const maxScore = question.points ?? 1
    if (typeof userAnswer !== 'string' || !userAnswer) {
      return { isCorrect: false, score: 0, maxScore }
    }

    const correct = String(question.correctAnswer)
    const isCorrect = normalizeText(userAnswer) === normalizeText(correct)
    return { isCorrect, score: isCorrect ? maxScore : 0, maxScore }
  }
}

export class GapFillScoring implements ScoringStrategy {
  readonly type: QuestionType = 'gap-fill'

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const maxScore = question.points ?? 1
    if (typeof userAnswer !== 'string' || !userAnswer) {
      return { isCorrect: false, score: 0, maxScore }
    }

    const normalizedAnswer = normalizeText(userAnswer)
    const correctAnswer = normalizeText(String(question.correctAnswer))

    if (normalizedAnswer === correctAnswer) {
      return { isCorrect: true, score: maxScore, maxScore }
    }

    const acceptable = question.blanks?.flatMap(b => b.acceptableAnswers ?? []) ?? []
    const normalizedAcceptable = normalizeList(acceptable)
    if (normalizedAcceptable.includes(normalizedAnswer)) {
      return { isCorrect: true, score: maxScore, maxScore }
    }

    if (Array.isArray(question.correctAnswer)) {
      const correctAnswers = normalizeList(question.correctAnswer as string[])
      if (correctAnswers.includes(normalizedAnswer)) {
        return { isCorrect: true, score: maxScore, maxScore }
      }
    }

    return { isCorrect: false, score: 0, maxScore }
  }
}

export class TrueFalseScoring implements ScoringStrategy {
  readonly type: QuestionType = 'true-false'

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const maxScore = question.points ?? 1
    if (typeof userAnswer !== 'string' || !userAnswer) {
      return { isCorrect: false, score: 0, maxScore }
    }

    const normalized = normalizeText(userAnswer)
    const correct = normalizeText(String(question.correctAnswer))

    const isCorrect =
      normalized === correct ||
      normalized === correct.charAt(0) ||
      (normalized === 't' && correct === 'true') ||
      (normalized === 'f' && correct === 'false')

    return { isCorrect, score: isCorrect ? maxScore : 0, maxScore }
  }
}

export class ErrorCorrectionScoring implements ScoringStrategy {
  readonly type: QuestionType = 'error-correction'

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const maxScore = question.points ?? 1
    if (typeof userAnswer !== 'string' || !userAnswer) {
      return { isCorrect: false, score: 0, maxScore }
    }

    const normalizedAnswer = normalizeText(userAnswer)
    const correctAnswer = normalizeText(String(question.correctAnswer))

    const exactMatch = normalizedAnswer === correctAnswer
    if (exactMatch) {
      return { isCorrect: true, score: maxScore, maxScore }
    }

    const answerWords = new Set(normalizedAnswer.split(/\s+/))
    const correctWords = new Set(correctAnswer.split(/\s+/))

    let matchCount = 0
    for (const word of answerWords) {
      if (correctWords.has(word)) matchCount++
    }

    const ratio = correctWords.size > 0 ? matchCount / correctWords.size : 0

    if (ratio >= 0.8) {
      return { isCorrect: true, score: maxScore, maxScore, feedback: 'Nearly correct - minor differences detected' }
    }
    if (ratio >= 0.5) {
      return { isCorrect: false, score: Math.round(maxScore * 0.5), maxScore, feedback: 'Partially correct - includes some key elements' }
    }

    const normalizedAnswerClean = normalizedAnswer.replace(/[^a-z0-9\s]/g, '')
    const correctClean = correctAnswer.replace(/[^a-z0-9\s]/g, '')
    if (normalizedAnswerClean === correctClean) {
      return { isCorrect: true, score: maxScore, maxScore, feedback: 'Correct (punctuation differences ignored)' }
    }

    return { isCorrect: false, score: 0, maxScore }
  }
}

export class MatchingScoring implements ScoringStrategy {
  readonly type: QuestionType = 'matching'

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const pairs = question.matchingPairs ?? []
    const maxScore = pairs.length

    if (!Array.isArray(userAnswer)) {
      return { isCorrect: false, score: 0, maxScore }
    }

    const userPairs = userAnswer as MatchingPair[]
    let correctCount = 0

    for (const userPair of userPairs) {
      const matched = pairs.find(
        p => normalizeText(p.left) === normalizeText(userPair.left) &&
             normalizeText(p.right) === normalizeText(userPair.right)
      )
      if (matched) correctCount++
    }

    return {
      isCorrect: correctCount === pairs.length,
      score: correctCount,
      maxScore,
      feedback: correctCount < pairs.length ? `${correctCount}/${pairs.length} matched correctly` : undefined,
    }
  }
}

export class ShortAnswerScoring implements ScoringStrategy {
  readonly type: QuestionType = 'short-answer'

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const maxScore = question.points ?? 1
    if (typeof userAnswer !== 'string' || !userAnswer) {
      return { isCorrect: false, score: 0, maxScore }
    }

    const normalizedAnswer = normalizeText(userAnswer)
    const correctAnswer = normalizeText(String(question.correctAnswer))

    if (normalizedAnswer === correctAnswer) {
      return { isCorrect: true, score: maxScore, maxScore }
    }

    if (Array.isArray(question.correctAnswer)) {
      const acceptable = normalizeList(question.correctAnswer as string[])
      if (acceptable.some(a => normalizedAnswer === a)) {
        return { isCorrect: true, score: maxScore, maxScore }
      }
    }

    if (correctAnswer.includes(normalizedAnswer) || normalizedAnswer.includes(correctAnswer)) {
      return { isCorrect: true, score: maxScore, maxScore, feedback: 'Answer contained within expected response' }
    }

    return { isCorrect: false, score: 0, maxScore }
  }
}

export class RewriteScoring implements ScoringStrategy {
  readonly type: QuestionType = 'rewrite'

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const maxScore = question.points ?? 2
    if (typeof userAnswer !== 'string' || !userAnswer) {
      return { isCorrect: false, score: 0, maxScore }
    }

    const normalizedAnswer = normalizeText(userAnswer)
    const correctAnswer = normalizeText(String(question.correctAnswer))

    if (normalizedAnswer === correctAnswer) {
      return { isCorrect: true, score: maxScore, maxScore }
    }

    const answerWords = new Set(normalizedAnswer.split(/\s+/))
    const correctWords = new Set(correctAnswer.split(/\s+/))

    let matchCount = 0
    for (const word of answerWords) {
      if (correctWords.has(word) && word.length > 2) matchCount++
    }

    const significantCorrectWords = new Set([...correctWords].filter(w => w.length > 2))
    const ratio = significantCorrectWords.size > 0 ? matchCount / significantCorrectWords.size : 0

    if (ratio >= 0.8) {
      return { isCorrect: true, score: maxScore, maxScore, feedback: 'Minor differences from expected answer' }
    }
    if (ratio >= 0.5) {
      return { isCorrect: false, score: 1, maxScore, feedback: 'Captures some key ideas but missing important elements' }
    }
    return { isCorrect: false, score: 0, maxScore }
  }
}

export const DEFAULT_SCORING_STRATEGIES: ScoringStrategy[] = [
  new MultipleChoiceScoring(),
  new GapFillScoring(),
  new TrueFalseScoring(),
  new ErrorCorrectionScoring(),
  new MatchingScoring(),
  new ShortAnswerScoring(),
  new RewriteScoring(),
]

export class ScoringEngine {
  private strategies: Map<QuestionType, ScoringStrategy>

  constructor(strategies?: ScoringStrategy[]) {
    this.strategies = new Map()
    if (strategies) {
      for (const s of strategies) {
        this.strategies.set(s.type, s)
      }
    }
  }

  registerStrategy(strategy: ScoringStrategy): void {
    this.strategies.set(strategy.type, strategy)
  }

  evaluate(question: ExerciseQuestion, userAnswer: unknown): ScoreResult {
    const strategy = this.strategies.get(question.type)
    if (!strategy) {
      return { isCorrect: false, score: 0, maxScore: question.points ?? 1 }
    }
    return strategy.evaluate(question, userAnswer)
  }

  scoreExercise(
    questions: ExerciseQuestion[],
    answers: Map<string, unknown>,
  ): { answers: ExerciseAttemptAnswer[]; totalScore: number; maxScore: number; accuracy: number } {
    const results: ExerciseAttemptAnswer[] = []
    let totalScore = 0
    let maxScore = 0

    for (const question of questions) {
      const userAnswer = answers.get(question.id)
      const result = this.evaluate(question, userAnswer)
      const maxPoints = question.points ?? 1
      results.push({
        questionId: question.id,
        userAnswer: userAnswer as ExerciseAttemptAnswer['userAnswer'],
        isCorrect: result.isCorrect,
        timeSpentSeconds: 0,
        score: result.score,
        maxScore: maxPoints,
      })
      totalScore += result.score
      maxScore += maxPoints
    }

    const accuracy = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    return { answers: results, totalScore, maxScore, accuracy }
  }
}

export function createDefaultScoringEngine(): ScoringEngine {
  return new ScoringEngine(DEFAULT_SCORING_STRATEGIES)
}
