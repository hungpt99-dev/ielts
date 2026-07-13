import type { IELTSSection } from '../../domain/value-objects'
import type { Exercise, GenerateExerciseRequest } from '../../domain/entities/exercise'
import type { ExerciseQuestion } from '../../domain/entities/exercise-question'
import type { AnswerEvaluation } from '../../domain/entities/evaluation'
import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../../domain/entities/skill-evidence'
import type {
  LearningSkillModule,
  SkillActivityGenerationRequest,
  SkillActivityGenerationResult,
  SkillEvaluationRequest,
  SkillEvaluationResult,
  SkillReviewRequest,
  SkillReviewResult,
} from '../skill-module'

export class SpeakingSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'speaking'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'speaking'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const questions: ExerciseQuestion[] = [
      {
        type: 'speaking-response',
        prompt: 'Tell me about your hometown.',
        preparationSeconds: 30,
        responseSeconds: 60,
        tips: ['Describe the location', 'Mention what you like about it', 'Give specific examples'],
      },
      {
        type: 'speaking-response',
        prompt: 'What do you do for work or study?',
        preparationSeconds: 30,
        responseSeconds: 60,
        tips: ['Describe your role', 'Explain your responsibilities', 'Mention what you enjoy'],
      },
    ]

    const exercise: Exercise = {
      id: `speaking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'speaking',
      exerciseType: 'speaking',
      objectiveId: request.objectiveId,
      title: 'Speaking Part 1 Practice',
      instructions: 'Practice answering IELTS Speaking Part 1 questions. Focus on fluency and clear pronunciation.',
      questions,
      difficulty: request.difficulty as any || 'medium',
      estimatedMinutes: request.availableMinutes,
      sourceType: 'built-in',
      sourceIds: [],
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'ai-assisted' as const,
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
      const answerEntry = entries.find(([key]) => key === `q-${i}`)
      if (!answerEntry) continue

      const userAnswer = String(answerEntry[1])
      const wordCount = userAnswer.split(/\s+/).filter(Boolean).length
      const hasContent = wordCount > 5

      evaluations.push({
        questionId: `q-${i}`,
        status: hasContent ? 'correct' : 'incorrect',
        score: hasContent ? Math.min(wordCount / 50, 1) * 10 : 0,
        maximumScore: 10,
        feedback: hasContent
          ? `Your response has ${wordCount} words. Focus on organizing your ideas with clear main points and supporting details.`
          : 'Please provide a more detailed response with specific examples and explanations.',
        evaluatedBy: 'deterministic',
        confidence: 0.6,
        mistakes: [],
        skillEvidence: [],
      })

      if (!hasContent) {
        mistakes.push({
          id: `speaking-mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          skill: 'speaking',
          category: 'response-length',
          originalResponse: userAnswer,
          correctedResponse: 'Expand your response with examples and details.',
          explanation: 'Short responses limit the examiner\'s ability to assess your fluency and vocabulary.',
          sourceExerciseId: request.exercise.id,
          sourceQuestionId: `q-${i}`,
          occurredAt: new Date().toISOString(),
          recurrenceCount: 0,
          severity: 'moderate',
          confidence: 0.6,
          reviewStatus: 'unreviewed',
        })
      }
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.6 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(() => ({
      type: 'speaking-response',
      prompt: 'Describe your experience with this topic.',
      preparationSeconds: 30,
      responseSeconds: 60,
      tips: ['Speak clearly', 'Organize your thoughts', 'Use specific examples'],
    }))

    const exercise: Exercise = {
      id: `speaking-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'speaking',
      exerciseType: 'speaking',
      objectiveId: '',
      title: 'Speaking Fluency Review',
      instructions: 'Practice speaking on the following topics to improve fluency.',
      questions,
      difficulty: 'medium',
      estimatedMinutes: Math.min(request.count * 5, 20),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'ai-assisted' as const,
      metadata: {
        focusAreas: ['fluency', 'pronunciation'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }
}
