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

export class ReadingSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'reading'

  supports(request: GenerateExerciseRequest): boolean {
    if (request.skill !== 'reading') return false
    if (request.sourceContent?.passage) return false
    return true
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const questions: ExerciseQuestion[] = [
      {
        type: 'multiple-choice',
        question: 'What is the main purpose of the passage?',
        options: ['To explain reading skills', 'To describe IELTS', 'To discuss practice', 'To give advice'],
        correctIndex: 0,
        explanation: 'The passage focuses on explaining reading skills for IELTS.',
      },
      {
        type: 'true-false-not-given',
        question: 'The passage mentions specific question types.',
        answer: 'true',
        explanation: 'The passage states "Practice with various question types."',
      },
    ]

    const exercise: Exercise = {
      id: `reading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'reading',
      exerciseType: 'comprehension',
      objectiveId: request.objectiveId,
      title: 'Reading Comprehension',
      instructions: 'Read the passage and answer the questions that follow.',
      content: { passage: 'Reading is an essential skill for IELTS success. It requires understanding main ideas, details, and inferences from academic texts. Practice with various question types to build confidence and improve your reading speed.' },
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
          id: `reading-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'reading',
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
      type: 'multiple-choice',
      question: 'Review your previous reading mistake:',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Review this question type.',
    }))

    const exercise: Exercise = {
      id: `reading-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'reading',
      exerciseType: 'comprehension',
      objectiveId: '',
      title: 'Reading Error Review',
      instructions: 'Review your previous reading mistakes and try again.',
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
