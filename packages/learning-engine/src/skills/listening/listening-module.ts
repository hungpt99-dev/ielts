import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '@ielts/shared'
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

// ═══════════════════════════════════════════════════════════════════════
// ListeningSkillModule
// ═══════════════════════════════════════════════════════════════════════

export class ListeningSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'listening'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'listening'
  }

  async generateActivity(_request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    return {
      exercise: {
        id: `listening-fallback-${Date.now()}`,
        sessionId: '',
        skill: 'listening',
        exerciseType: 'comprehension',
        objectiveId: '',
        title: 'Listening Practice',
        instructions: 'Listen to the recording and answer the questions.',
        questions: [],
        difficulty: 'medium',
        estimatedMinutes: 15,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'deterministic',
        metadata: { focusAreas: ['listening-comprehension'], contextSnapshotHash: '', schemaVersion: '2.0.0' },
      },
      aiUsed: false,
      cacheHit: false,
    }
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
          category: question.type === 'gap-fill' ? 'gap-fill'
            : question.type === 'matching' ? 'matching'
            : question.type === 'short-answer' ? 'short-answer'
            : 'multiple-choice',
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

    const correctCount = evaluations.filter(e => e.status === 'correct').length
    const totalCount = evaluations.length
    if (totalCount > 0) {
      skillEvidence.push({
        skill: 'listening',
        type: correctCount / totalCount >= 0.8 ? 'strength' : correctCount / totalCount >= 0.5 ? 'improvement' : 'weakness',
        description: `Listening accuracy: ${correctCount}/${totalCount} correct`,
        score: correctCount,
        maximumScore: totalCount,
        accuracy: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
        sourceExerciseId: request.exercise.id,
        sourceSessionId: request.exercise.sessionId ?? '',
        occurredAt: new Date().toISOString(),
        confidence: 0.9,
      })
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.9 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(m => {
      if (m.category === 'gap-fill') {
        return { type: 'gap-fill', text: 'Fill in the blank: The correct answer was ______.', answers: ['review'], acceptableAlternatives: undefined, explanation: m.explanation || 'Please review this listening exercise.' }
      }
      return { type: 'multiple-choice', question: `Review: ${m.originalResponse || 'What was the correct information from the recording?'}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctIndex: 0, explanation: m.explanation || 'Listen again for the specific details mentioned.' }
    })

    const exercise: Exercise = {
      id: `listening-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'listening',
      exerciseType: 'comprehension',
      objectiveId: '',
      title: 'Listening Error Review',
      instructions: 'Review your listening mistakes. Focus on identifying specific words and numbers in the recording.',
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

