import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '../../domain/entities/exercise-question'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
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

const GRAMMAR_QUESTIONS: ExerciseQuestion[] = [
  { type: 'multiple-choice', question: 'Choose the correct form:', options: ['He go', 'He goes', 'He going', 'He went'], correctIndex: 1, explanation: 'Third person singular requires "goes" in present simple.' },
  { type: 'multiple-choice', question: 'Choose the correct article:', options: ['a apple', 'an apple', 'the apple', 'apple'], correctIndex: 1, explanation: '"An" is used before vowel sounds.' },
  { type: 'multiple-choice', question: 'Choose the correct tense:', options: ['I have go', 'I have gone', 'I have went', 'I have going'], correctIndex: 1, explanation: 'Present perfect uses "have" + past participle.' },
]

export class GrammarSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'grammar'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'grammar'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const questionTypes = selectQuestionTypes('grammar', 'error-correction')
    const count = estimateQuestionCount(request.availableMinutes, questionTypes, 0)
    const questions = Array.from({ length: Math.max(1, count) }, (_, i) => GRAMMAR_QUESTIONS[i % GRAMMAR_QUESTIONS.length])

    const exercise: Exercise = {
      id: `grammar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'grammar',
      exerciseType: 'error-correction',
      objectiveId: request.objectiveId,
      title: 'Grammar Practice',
      instructions: 'Practice your grammar skills.',
      questions,
      difficulty: request.difficulty as any || 'medium',
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        targetBand: request.targetBand,
        focusAreas: [...request.focusAreas, 'grammar'],
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
          id: `grammar-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'grammar' as IELTSSection,
          category: 'grammar-choice',
          originalResponse: String(userAnswer),
          correctedResponse: evaluation.explanation ?? '',
          explanation: evaluation.explanation ?? '',
          sourceExerciseId: request.exercise.id,
          sourceQuestionId: `q-${i}`,
          occurredAt: new Date().toISOString(),
          recurrenceCount: 0,
          severity: 'moderate',
          confidence: evaluation.confidence,
          reviewStatus: 'unreviewed',
        })
      }
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.9 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(() => ({
      type: 'error-correction' as const,
      sentence: 'Correct the grammar error:',
      error: 'incorrect usage',
      correction: 'corrected usage',
      explanation: 'Review this grammar rule.',
    }))

    const exercise: Exercise = {
      id: `grammar-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'grammar' as IELTSSection,
      exerciseType: 'error-correction',
      objectiveId: '',
      title: 'Grammar Error Review',
      instructions: 'Review and correct your grammar mistakes.',
      questions,
      difficulty: 'easy',
      estimatedMinutes: Math.min(request.count * 3, 15),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'always' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['grammar-review', 'error-correction'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
