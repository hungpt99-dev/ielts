import type { ExerciseQuestion } from '@ielts/shared'
import type { AnswerEvaluation } from '../entities/evaluation'

export function gradeAnswer(
  question: ExerciseQuestion,
  userAnswer: unknown,
): AnswerEvaluation {
  switch (question.type) {
    case 'multiple-choice':
      return gradeMultipleChoice(question, userAnswer)
    case 'true-false-not-given':
      return gradeTrueFalse(question, userAnswer)
    case 'gap-fill':
      return gradeGapFill(question, userAnswer)
    case 'short-answer':
      return gradeShortAnswer(question, userAnswer)
    default:
      return {
        questionId: '',
        status: 'not-evaluable',
        score: 0,
        maximumScore: 1,
        feedback: 'This question type requires manual or AI evaluation.',
        mistakes: [],
        skillEvidence: [],
        evaluatedBy: 'deterministic',
        confidence: 0,
      }
  }
}

function gradeMultipleChoice(
  question: ExerciseQuestion & { type: 'multiple-choice' },
  userAnswer: unknown,
): AnswerEvaluation {
  const isCorrect = userAnswer === question.correctIndex
  return {
    questionId: '',
    status: isCorrect ? 'correct' : 'incorrect',
    score: isCorrect ? 1 : 0,
    maximumScore: 1,
    feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer was option ${question.correctIndex + 1}.`,
    explanation: question.explanation,
    mistakes: isCorrect ? [] : [{
      id: '',
      skill: 'reading' as const,
      category: 'multiple-choice',
      originalResponse: String(userAnswer),
      correctedResponse: String(question.correctIndex),
      explanation: question.explanation,
      sourceExerciseId: '',
      sourceQuestionId: '',
      occurredAt: new Date().toISOString(),
      recurrenceCount: 0,
      severity: 'minor' as const,
      confidence: 1,
      reviewStatus: 'unreviewed' as const,
    }],
    skillEvidence: [],
    evaluatedBy: 'deterministic',
    confidence: 1,
  }
}

function gradeTrueFalse(
  question: ExerciseQuestion & { type: 'true-false-not-given' },
  userAnswer: unknown,
): AnswerEvaluation {
  const isCorrect = String(userAnswer).toLowerCase() === question.answer
  return {
    questionId: '',
    status: isCorrect ? 'correct' : 'incorrect',
    score: isCorrect ? 1 : 0,
    maximumScore: 1,
    feedback: isCorrect ? 'Correct!' : `Incorrect. The answer was "${question.answer}".`,
    explanation: question.explanation,
    mistakes: isCorrect ? [] : [{
      id: '',
      skill: 'reading' as const,
      category: 'true-false-not-given',
      originalResponse: String(userAnswer),
      correctedResponse: question.answer,
      explanation: question.explanation,
      sourceExerciseId: '',
      sourceQuestionId: '',
      occurredAt: new Date().toISOString(),
      recurrenceCount: 0,
      severity: 'minor' as const,
      confidence: 1,
      reviewStatus: 'unreviewed' as const,
    }],
    skillEvidence: [],
    evaluatedBy: 'deterministic',
    confidence: 1,
  }
}

function gradeGapFill(
  question: ExerciseQuestion & { type: 'gap-fill' },
  userAnswer: unknown,
): AnswerEvaluation {
  const answers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
  let correct = 0

  for (let i = 0; i < question.answers.length; i++) {
    const userAns = String(answers[i] ?? '').toLowerCase().trim()
    const correctAns = question.answers[i].toLowerCase().trim()
    const alternatives = (question.acceptableAlternatives?.[i] ?? []).map(a => a.toLowerCase().trim())

    if (userAns === correctAns || alternatives.includes(userAns)) {
      correct++
    }
  }

  const allCorrect = correct === question.answers.length
  return {
    questionId: '',
    status: allCorrect ? 'correct' : correct > 0 ? 'partially-correct' : 'incorrect',
    score: correct,
    maximumScore: question.answers.length,
    feedback: allCorrect ? 'All gaps filled correctly!' : `${correct} of ${question.answers.length} correct.`,
    explanation: question.explanation,
    mistakes: allCorrect ? [] : [{
      id: '',
      skill: 'reading' as const,
      category: 'gap-fill',
      originalResponse: JSON.stringify(userAnswer),
      correctedResponse: question.answers.join(', '),
      explanation: question.explanation,
      sourceExerciseId: '',
      sourceQuestionId: '',
      occurredAt: new Date().toISOString(),
      recurrenceCount: 0,
      severity: 'minor' as const,
      confidence: 1,
      reviewStatus: 'unreviewed' as const,
    }],
    skillEvidence: [],
    evaluatedBy: 'deterministic',
    confidence: 1,
  }
}

function gradeShortAnswer(
  question: ExerciseQuestion & { type: 'short-answer' },
  userAnswer: unknown,
): AnswerEvaluation {
  const normalized = String(userAnswer).toLowerCase().trim()
  const correct = question.answer.toLowerCase().trim()
  const alternatives = (question.acceptableAlternatives ?? []).map(a => a.toLowerCase().trim())
  const isCorrect = normalized === correct || alternatives.includes(normalized)

  return {
    questionId: '',
    status: isCorrect ? 'correct' : 'incorrect',
    score: isCorrect ? 1 : 0,
    maximumScore: 1,
    feedback: isCorrect ? 'Correct!' : `The expected answer was: ${question.answer}`,
    explanation: question.explanation,
    mistakes: isCorrect ? [] : [{
      id: '',
      skill: 'reading' as const,
      category: 'short-answer',
      originalResponse: String(userAnswer),
      correctedResponse: question.answer,
      explanation: question.explanation,
      sourceExerciseId: '',
      sourceQuestionId: '',
      occurredAt: new Date().toISOString(),
      recurrenceCount: 0,
      severity: 'minor' as const,
      confidence: 1,
      reviewStatus: 'unreviewed' as const,
    }],
    skillEvidence: [],
    evaluatedBy: 'deterministic',
    confidence: 1,
  }
}
