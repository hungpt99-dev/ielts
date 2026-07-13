import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '../../domain/entities/exercise-question'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import { gradeAnswer, estimateQuestionCount, selectQuestionTypes } from '../../domain/policies'
import type {
  LearningSkillModule,
  SkillActivityGenerationRequest,
  SkillActivityGenerationResult,
  SkillEvaluationRequest,
  SkillEvaluationResult,
  SkillReviewRequest,
  SkillReviewResult,
} from '../skill-module'

const VOCABULARY_QUESTIONS: ExerciseQuestion[] = [
  { type: 'multiple-choice', question: 'Choose the closest synonym for "important":', options: ['Similar', 'Significant', 'Different', 'Ordinary'], correctIndex: 1, explanation: '"Significant" is a synonym for "important".' },
  { type: 'multiple-choice', question: 'Which word commonly collocates with "research"?', options: ['Make', 'Do', 'Conduct', 'Take'], correctIndex: 2, explanation: '"Conduct research" is the correct collocation.' },
  { type: 'multiple-choice', question: 'What does "comprehensive" mean?', options: ['Limited', 'Incomplete', 'Thorough', 'Difficult'], correctIndex: 2, explanation: '"Comprehensive" means thorough and complete.' },
]

export class VocabularySkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'reading'

  supports(request: GenerateExerciseRequest): boolean {
    return request.contextScope === 'vocabulary'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const questionTypes = selectQuestionTypes('reading', 'quiz')
    const count = estimateQuestionCount(request.availableMinutes, questionTypes, 0)
    const questions = Array.from({ length: Math.max(1, count) }, (_, i) => VOCABULARY_QUESTIONS[i % VOCABULARY_QUESTIONS.length])

    const exercise: Exercise = {
      id: `vocabulary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'reading' as IELTSSection,
      exerciseType: 'gap-fill',
      objectiveId: request.objectiveId,
      title: 'Vocabulary Practice',
      instructions: 'Test and expand your vocabulary knowledge.',
      questions,
      difficulty: request.difficulty as any || 'medium',
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: [...request.focusAreas, 'vocabulary'],
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

      if (evaluation.status === 'incorrect') {
        mistakes.push({
          id: `vocab-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'reading' as IELTSSection,
          category: 'vocabulary',
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
      type: 'multiple-choice' as const,
      question: 'Review vocabulary item:',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Review this vocabulary item in context.',
    }))

    const exercise: Exercise = {
      id: `vocab-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'reading' as IELTSSection,
      exerciseType: 'gap-fill',
      objectiveId: '',
      title: 'Vocabulary Review',
      instructions: 'Review vocabulary items you previously answered incorrectly.',
      questions,
      difficulty: 'easy',
      estimatedMinutes: Math.min(request.count * 2, 15),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'always' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['vocabulary-review'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
