import type { LearningOutcome } from '../learning-outcome'
import type { MistakeEvidence, MistakeSeverity, MistakeReviewStatus, SkillEvidenceType } from '../mistake-evidence'
import type { AnswerEvaluation, EvaluationStatus, EvaluationMethod } from '../evaluation-types'

type LegacyMistakeRecord = {
  questionId: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
}

export function mapLegacyMistakeToEvidence(
  mistake: LegacyMistakeRecord,
  sessionId: string,
  exerciseId: string,
  skill: string,
  severity: MistakeSeverity = 'moderate',
): MistakeEvidence {
  return {
    id: `${sessionId}-${mistake.questionId}`,
    skill: skill as any,
    category: 'answer-error',
    originalResponse: mistake.userAnswer,
    correctedResponse: mistake.correctAnswer,
    explanation: mistake.explanation,
    sourceExerciseId: exerciseId,
    sourceQuestionId: mistake.questionId,
    occurredAt: new Date().toISOString(),
    recurrenceCount: 0,
    severity,
    confidence: 0.9,
    reviewStatus: 'unreviewed' as MistakeReviewStatus,
  }
}

export function mapLegacySessionToOutcome(params: {
  sessionId: string
  exerciseId: string
  attemptId: string
  skill: string
  objectiveId: string
  score: number
  total: number
  accuracy: number
  timeSpentSeconds: number
  mistakes: LegacyMistakeRecord[]
  createdAt: string
}): LearningOutcome {
  const evidenceMistakes = params.mistakes.map(m =>
    mapLegacyMistakeToEvidence(m, params.sessionId, params.exerciseId, params.skill),
  )

  return {
    sessionId: params.sessionId,
    exerciseId: params.exerciseId,
    attemptId: params.attemptId,
    skill: params.skill as any,
    objectiveId: params.objectiveId,
    score: params.score,
    maximumScore: params.total,
    accuracy: params.accuracy,
    difficulty: '',
    actualMinutes: Math.round(params.timeSpentSeconds / 60),
    hintsUsed: 0,
    strengths: [],
    weaknesses: evidenceMistakes.length > 0
      ? [{
          skill: params.skill as any,
          type: 'weakness' as SkillEvidenceType,
          description: `${evidenceMistakes.length} incorrect answers`,
          score: params.score,
          maximumScore: params.total,
          accuracy: params.accuracy,
          sourceExerciseId: params.exerciseId,
          sourceSessionId: params.sessionId,
          occurredAt: params.createdAt,
          confidence: 0.8,
        }]
      : [],
    mistakes: evidenceMistakes,
    vocabularyEvidence: [],
    completedAt: params.createdAt,
  }
}

export function mapLegacyResultToEvaluation(
  questionId: string,
  isCorrect: boolean,
  feedback: string,
  explanation: string,
): AnswerEvaluation {
  return {
    questionId,
    status: isCorrect ? 'correct' as EvaluationStatus : 'incorrect' as EvaluationStatus,
    score: isCorrect ? 1 : 0,
    maximumScore: 1,
    feedback,
    explanation,
    mistakes: [],
    skillEvidence: [],
    evaluatedBy: 'deterministic' as EvaluationMethod,
    confidence: 1,
  }
}
