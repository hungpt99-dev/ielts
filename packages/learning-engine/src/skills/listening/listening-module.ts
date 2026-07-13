import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '../../domain/entities/exercise-question'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
import { gradeAnswer } from '../../domain/policies'
import type {
  LearningSkillModule,
  SkillActivityGenerationRequest,
  SkillActivityGenerationResult,
  SkillEvaluationRequest,
  SkillEvaluationResult,
  SkillReviewRequest,
  SkillReviewResult,
} from '../skill-module'

export class ListeningSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'listening'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'listening'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const questions: ExerciseQuestion[] = [
      {
        type: 'gap-fill',
        text: 'Many students use online resources to ______ their learning.',
        answers: ['supplement'],
        acceptableAlternatives: undefined,
        explanation: 'The transcript states that students "supplement their learning" with online resources.',
      },
      {
        type: 'multiple-choice',
        question: 'What are teachers finding new ways to do?',
        options: ['Replace textbooks', 'Engage students', 'Grade papers', 'Schedule classes'],
        correctIndex: 1,
        explanation: 'Teachers are finding new ways to engage students through digital platforms.',
      },
    ]

    const exercise: Exercise = {
      id: `listening-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'listening',
      exerciseType: 'comprehension',
      objectiveId: request.objectiveId,
      title: 'Listening Comprehension',
      instructions: 'Listen to the transcript and answer the questions.',
      content: { transcript: 'Today we are going to discuss the impact of technology on education. Many students now use online resources to supplement their learning. Teachers are finding new ways to engage students through digital platforms.' },
      questions,
      difficulty: request.difficulty as any || 'medium',
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: request.focusAreas,
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise, aiUsed: false, cacheHit: false }
  }

  async evaluate(request: SkillEvaluationRequest): Promise<SkillEvaluationResult> {
    const evaluations: AnswerEvaluation[] = []
    const mistakes: MistakeEvidence[] = []
    const skillEvidence: SkillEvidence[] = []

    const entries = Object.entries(request.answers)
    for (let i = 0; i < request.exercise.questions.length; i++) {
      const question = request.exercise.questions[i]
      const answerEntry = entries.find(([key]) => key === `q-${i}`)
      if (!answerEntry) continue

      const userAnswer = answerEntry[1]
      const evaluation = gradeAnswer(question, userAnswer)
      evaluations.push({ ...evaluation, questionId: `q-${i}` })

      if (evaluation.status === 'incorrect' || evaluation.status === 'partially-correct') {
        mistakes.push({
          id: `listening-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'listening',
          category: question.type,
          originalResponse: String(userAnswer),
          correctedResponse: '',
          explanation: evaluation.explanation ?? '',
          sourceExerciseId: request.exercise.id,
          sourceQuestionId: `q-${i}`,
          occurredAt: new Date().toISOString(),
          recurrenceCount: 0,
          severity: 'minor',
          confidence: evaluation.confidence,
          reviewStatus: 'unreviewed',
        })
      }
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.9 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(() => ({
      type: 'gap-fill',
      text: 'Fill in the blank: The answer was ______.',
      answers: ['review'],
      acceptableAlternatives: undefined,
      explanation: 'Please review this listening exercise.',
    }))

    const exercise: Exercise = {
      id: `listening-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'listening',
      exerciseType: 'comprehension',
      objectiveId: '',
      title: 'Listening Error Review',
      instructions: 'Review your listening mistakes and practice again.',
      questions,
      difficulty: 'easy',
      estimatedMinutes: Math.min(request.count * 3, 15),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'always' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['error-review'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
