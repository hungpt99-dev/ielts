import type { QuestionResult, LearnerResponse } from '../domain/types'
import type { ExerciseQuestion } from '../domain/types'
import { normalizeAnswer, createDefaultNormalizationPolicy } from '../domain/types'

export interface ExerciseScoringStrategy<
  TExercise extends import('../domain/types').Exercise = import('../domain/types').Exercise,
> {
  score(exercise: TExercise, attempt: import('../domain/types').ExerciseAttempt): Promise<import('../domain/types').ExerciseResult>
}

function scoreTextNormalized(
  questionId: string,
  points: number,
  response: LearnerResponse,
  expectedAnswer: string,
  acceptableAlternatives: string[],
): QuestionResult {
  if (response.type !== 'text') {
    return { questionId, correct: false, partialCredit: 0, score: 0, maxScore: points }
  }
  const policy = createDefaultNormalizationPolicy()
  const normalized = normalizeAnswer(response.value, policy).replace(/[\s_-]/g, '')
  const expected = expectedAnswer.replace(/_/g, '')
  const altsNormalized = acceptableAlternatives.map(a => normalizeAnswer(a, policy).replace(/[\s_-]/g, ''))
  const correct = normalized === expected || altsNormalized.includes(normalized)
  return {
    questionId,
    correct,
    partialCredit: correct ? 1 : 0,
    score: correct ? points : 0,
    maxScore: points,
  }
}

export function scoreObjectiveQuestion(
  question: ExerciseQuestion,
  response: LearnerResponse,
): QuestionResult {
  switch (question.type) {
    case 'multiple_choice': {
      if (response.type !== 'choice') {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const correct = response.selectedIndex === question.correctIndex
      return {
        questionId: question.id,
        correct,
        partialCredit: correct ? 1 : 0,
        score: correct ? question.points : 0,
        maxScore: question.points,
      }
    }

    case 'multiple_select': {
      if (response.type !== 'multi_choice') {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const correctSet = new Set(question.correctIndices)
      const selectedSet = new Set(response.selectedIndices)
      const correctCount = [...selectedSet].filter(i => correctSet.has(i)).length
      const wrongCount = [...selectedSet].filter(i => !correctSet.has(i)).length
      const partialCredit = Math.max(0, (correctCount - wrongCount) / correctSet.size)
      return {
        questionId: question.id,
        correct: partialCredit === 1,
        partialCredit,
        score: Math.round(question.points * partialCredit),
        maxScore: question.points,
      }
    }

    case 'true_false_not_given':
      return scoreTextNormalized(question.id, question.points, response, question.correctAnswer, [])

    case 'yes_no_not_given':
      return scoreTextNormalized(question.id, question.points, response, question.correctAnswer, [])

    case 'short_answer': {
      if (response.type !== 'text') {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const policy = createDefaultNormalizationPolicy()
      policy.lowercase = !question.caseSensitive
      const normalized = normalizeAnswer(response.value, policy)
      const expectedNormalized = normalizeAnswer(question.correctAnswer, policy)
      const alternativesNormalized = question.acceptableAlternatives.map(a => normalizeAnswer(a, policy))
      const correct = normalized === expectedNormalized || alternativesNormalized.includes(normalized)
      return {
        questionId: question.id,
        correct,
        partialCredit: correct ? 1 : 0,
        score: correct ? question.points : 0,
        maxScore: question.points,
      }
    }

    case 'completion': {
      if (response.type !== 'text') {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const policy = createDefaultNormalizationPolicy()
      const normalized = normalizeAnswer(response.value, policy)
      const gap = question.gaps[0]
      if (!gap) {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const expectedNormalized = normalizeAnswer(gap.correctAnswer, policy)
      const altsNormalized = gap.acceptableAlternatives.map(a => normalizeAnswer(a, policy))
      const correct = normalized === expectedNormalized || altsNormalized.includes(normalized)
      return {
        questionId: question.id,
        correct,
        partialCredit: correct ? 1 : 0,
        score: correct ? question.points : 0,
        maxScore: question.points,
      }
    }

    case 'matching': {
      if (response.type !== 'matching') {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const totalMatches = Object.keys(question.correctMatches).length
      let correctMatches = 0
      for (const [left, right] of Object.entries(response.matches)) {
        if (question.correctMatches[left] === right) {
          correctMatches++
        }
      }
      const partialCredit = totalMatches > 0 ? correctMatches / totalMatches : 0
      return {
        questionId: question.id,
        correct: partialCredit === 1,
        partialCredit,
        score: Math.round(question.points * partialCredit),
        maxScore: question.points,
      }
    }

    case 'ordering': {
      if (response.type !== 'ordering') {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const correct = JSON.stringify(response.order) === JSON.stringify(question.correctOrder)
      return {
        questionId: question.id,
        correct,
        partialCredit: correct ? 1 : 0,
        score: correct ? question.points : 0,
        maxScore: question.points,
      }
    }

    case 'classification': {
      if (response.type !== 'classification') {
        return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
      }
      const correct = response.classifications[question.id] === question.correctCategory
      return {
        questionId: question.id,
        correct,
        partialCredit: correct ? 1 : 0,
        score: correct ? question.points : 0,
        maxScore: question.points,
      }
    }

    default:
      return { questionId: question.id, correct: false, partialCredit: 0, score: 0, maxScore: question.points }
  }
}

export function estimateBandFromRawScore(
  rawScore: number,
  maxScore: number,
  module: 'listening' | 'reading_academic' | 'reading_general_training',
): { band: number; confidence: number } {
  let band: number
  switch (module) {
    case 'listening':
      band = mapListeningBand(rawScore)
      break
    case 'reading_academic':
      band = mapAcademicReadingBand(rawScore)
      break
    case 'reading_general_training':
      band = mapGeneralTrainingReadingBand(rawScore)
      break
    default:
      band = (rawScore / maxScore) * 9
  }

  const confidence = maxScore >= 40 ? 0.85 : maxScore >= 20 ? 0.65 : 0.4

  return { band: Math.round(band * 2) / 2, confidence }
}

function mapListeningBand(raw: number): number {
  if (raw >= 39) return 9
  if (raw >= 37) return 8.5
  if (raw >= 35) return 8
  if (raw >= 32) return 7.5
  if (raw >= 30) return 7
  if (raw >= 26) return 6.5
  if (raw >= 23) return 6
  if (raw >= 18) return 5.5
  if (raw >= 16) return 5
  if (raw >= 13) return 4.5
  if (raw >= 10) return 4
  if (raw >= 8) return 3.5
  if (raw >= 6) return 3
  if (raw >= 4) return 2.5
  return raw > 0 ? 2 : 0
}

function mapAcademicReadingBand(raw: number): number {
  if (raw >= 39) return 9
  if (raw >= 37) return 8.5
  if (raw >= 35) return 8
  if (raw >= 33) return 7.5
  if (raw >= 30) return 7
  if (raw >= 27) return 6.5
  if (raw >= 23) return 6
  if (raw >= 19) return 5.5
  if (raw >= 15) return 5
  if (raw >= 13) return 4.5
  if (raw >= 10) return 4
  if (raw >= 8) return 3.5
  if (raw >= 6) return 3
  if (raw >= 4) return 2.5
  return raw > 0 ? 2 : 0
}

function mapGeneralTrainingReadingBand(raw: number): number {
  if (raw >= 40) return 9
  if (raw >= 39) return 8.5
  if (raw >= 37) return 8
  if (raw >= 36) return 7.5
  if (raw >= 34) return 7
  if (raw >= 32) return 6.5
  if (raw >= 30) return 6
  if (raw >= 27) return 5.5
  if (raw >= 23) return 5
  if (raw >= 19) return 4.5
  if (raw >= 15) return 4
  if (raw >= 12) return 3.5
  if (raw >= 9) return 3
  if (raw >= 6) return 2.5
  return raw > 0 ? 2 : 0
}
