import type { Exercise, ExerciseAttempt, ExerciseResult, QuestionResult } from '../domain/types'
import type { ExerciseScoringStrategy } from './scoring-strategies'
import { scoreObjectiveQuestion, estimateBandFromRawScore } from './scoring-strategies'
import type { ReadingExercise, GrammarExercise } from '../domain/types'
import { collectAllQuestions } from '../domain/utils/count-questions'

function scoreQuestionBatch(
  attempt: ExerciseAttempt,
  questions: import('../domain/types').ExerciseQuestion[],
): { perQuestionResults: Record<string, QuestionResult>; rawScore: number; maximumScore: number } {
  const perQuestionResults: Record<string, QuestionResult> = {}
  let rawScore = 0
  let maximumScore = 0

  for (const question of questions) {
    const response = attempt.responses[question.id]
    if (!response) {
      perQuestionResults[question.id] = {
        questionId: question.id,
        correct: false,
        partialCredit: 0,
        score: 0,
        maxScore: question.points,
      }
      maximumScore += question.points
      continue
    }

    const result = scoreObjectiveQuestion(question, response)
    perQuestionResults[question.id] = result
    rawScore += result.score
    maximumScore += result.maxScore
  }

  return { perQuestionResults, rawScore, maximumScore }
}

export class ObjectiveScoringStrategy implements ExerciseScoringStrategy {
  async score(exercise: Exercise, attempt: ExerciseAttempt): Promise<ExerciseResult> {
    const questions = collectAllQuestions(exercise)
    const { perQuestionResults, rawScore, maximumScore } = scoreQuestionBatch(attempt, questions)

    const accuracy = maximumScore > 0 ? rawScore / maximumScore : 0

    return {
      rawScore,
      maximumScore,
      accuracy,
      perQuestionResults,
      requiresAiEvaluation: false,
      requiresManualReview: false,
    }
  }
}

export class ReadingScoringStrategy implements ExerciseScoringStrategy {
  async score(exercise: Exercise, attempt: ExerciseAttempt): Promise<ExerciseResult> {
    const readingExercise = exercise as ReadingExercise
    const questions = collectAllQuestions(readingExercise)
    const { perQuestionResults, rawScore } = scoreQuestionBatch(attempt, questions)
    const maximumScore = 40

    const accuracy = rawScore / maximumScore
    const variant = readingExercise.ieltsVariant === 'general_training' ? 'reading_general_training' : 'reading_academic'
    const bandEstimate = estimateBandFromRawScore(rawScore, maximumScore, variant)

    return {
      rawScore,
      maximumScore,
      accuracy,
      estimatedBand: bandEstimate.band,
      bandConfidence: bandEstimate.confidence,
      perQuestionResults,
      requiresAiEvaluation: false,
      requiresManualReview: false,
    }
  }
}

export class ListeningScoringStrategy implements ExerciseScoringStrategy {
  async score(exercise: Exercise, attempt: ExerciseAttempt): Promise<ExerciseResult> {
    const questions = collectAllQuestions(exercise)
    const { perQuestionResults, rawScore } = scoreQuestionBatch(attempt, questions)
    const maximumScore = 40

    const accuracy = rawScore / maximumScore
    const bandEstimate = estimateBandFromRawScore(rawScore, maximumScore, 'listening')

    return {
      rawScore,
      maximumScore,
      accuracy,
      estimatedBand: bandEstimate.band,
      bandConfidence: bandEstimate.confidence,
      perQuestionResults,
      requiresAiEvaluation: false,
      requiresManualReview: false,
    }
  }
}

export class WritingScoringStrategy implements ExerciseScoringStrategy {
  async score(_exercise: Exercise, _attempt: ExerciseAttempt): Promise<ExerciseResult> {
    return {
      rawScore: 0,
      maximumScore: 9,
      accuracy: 0,
      requiresAiEvaluation: true,
      requiresManualReview: false,
    }
  }
}

export class SpeakingScoringStrategy implements ExerciseScoringStrategy {
  async score(_exercise: Exercise, _attempt: ExerciseAttempt): Promise<ExerciseResult> {
    return {
      rawScore: 0,
      maximumScore: 9,
      accuracy: 0,
      requiresAiEvaluation: true,
      requiresManualReview: false,
    }
  }
}

export class GrammarScoringStrategy implements ExerciseScoringStrategy {
  async score(exercise: Exercise, attempt: ExerciseAttempt): Promise<ExerciseResult> {
    const grammarExercise = exercise as GrammarExercise
    const perQuestionResults: Record<string, QuestionResult> = {}
    let rawScore = 0
    let maximumScore = 0

    for (const item of grammarExercise.items) {
      const response = attempt.responses[item.id]
      if (!response) {
        perQuestionResults[item.question.id] = {
          questionId: item.question.id,
          correct: false,
          partialCredit: 0,
          score: 0,
          maxScore: item.question.points,
        }
        maximumScore += item.question.points
        continue
      }

      const result = scoreObjectiveQuestion(item.question, response)
      perQuestionResults[item.question.id] = result
      rawScore += result.score
      maximumScore += result.maxScore
    }

    const accuracy = maximumScore > 0 ? rawScore / maximumScore : 0

    return {
      rawScore,
      maximumScore,
      accuracy,
      perQuestionResults,
      requiresAiEvaluation: grammarExercise.items.some(i => !i.autoScoringReliable),
      requiresManualReview: false,
    }
  }
}

export class VocabularyScoringStrategy implements ExerciseScoringStrategy {
  async score(exercise: Exercise, attempt: ExerciseAttempt): Promise<ExerciseResult> {
    const questions = collectAllQuestions(exercise)
    const { perQuestionResults, rawScore, maximumScore } = scoreQuestionBatch(attempt, questions)

    const accuracy = maximumScore > 0 ? rawScore / maximumScore : 0

    return {
      rawScore,
      maximumScore,
      accuracy,
      perQuestionResults,
      requiresAiEvaluation: false,
      requiresManualReview: false,
    }
  }
}

export function getScoringStrategy(module: string): ExerciseScoringStrategy {
  switch (module) {
    case 'reading': return new ReadingScoringStrategy()
    case 'listening': return new ListeningScoringStrategy()
    case 'writing': return new WritingScoringStrategy()
    case 'speaking': return new SpeakingScoringStrategy()
    case 'grammar': return new GrammarScoringStrategy()
    case 'vocabulary': return new VocabularyScoringStrategy()
    default: return new ObjectiveScoringStrategy()
  }
}
