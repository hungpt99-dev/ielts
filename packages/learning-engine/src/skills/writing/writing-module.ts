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

export class WritingSkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'writing'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === 'writing'
  }

  async generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult> {
    const questions: ExerciseQuestion[] = [{
      type: 'essay',
      prompt: this.selectPrompt(request),
      wordLimit: this.selectWordLimit(request),
      rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
    }]

    const exercise: Exercise = {
      id: `writing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'writing',
      exerciseType: 'essay',
      objectiveId: request.objectiveId,
      title: this.selectTitle(request),
      instructions: this.selectInstructions(request),
      content: request.focusAreas.length > 0 ? { prompt: `Focus areas: ${request.focusAreas.join(', ')}` } : undefined,
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

      const userAnswer = answerEntry[1]
      const isComplete = String(userAnswer).trim().length > 50
      evaluations.push({
        questionId: `q-${i}`,
        status: isComplete ? 'correct' : 'incorrect',
        score: isComplete ? 1 : 0,
        maximumScore: 1,
        feedback: isComplete ? 'Response submitted successfully.' : 'Please provide a more detailed response.',
        mistakes: [],
        skillEvidence: [],
        evaluatedBy: 'ai-assisted',
        confidence: 0.5,
      })

      if (isComplete) {
        skillEvidence.push({
          skill: 'writing',
          type: 'strength',
          description: 'Writing response completed',
          score: 1,
          maximumScore: 1,
          accuracy: 1,
          sourceExerciseId: request.exercise.id,
          sourceSessionId: '',
          occurredAt: new Date().toISOString(),
          confidence: 0.5,
        })
      }
    }

    return { evaluations, mistakes, skillEvidence, confidence: 0.5 }
  }

  async createReview(request: SkillReviewRequest): Promise<SkillReviewResult> {
    const questions: ExerciseQuestion[] = request.mistakes.slice(0, request.count).map(() => ({
      type: 'error-correction',
      sentence: 'Review and correct the following:',
      error: 'Writing mistake',
      correction: 'Corrected version',
      explanation: 'Please review your writing errors and try again.',
    }))

    const exercise: Exercise = {
      id: `writing-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionId: '',
      skill: 'writing',
      exerciseType: 'error-correction',
      objectiveId: '',
      title: 'Writing Mistake Review',
      instructions: 'Review and correct the following writing mistakes.',
      questions,
      difficulty: 'medium',
      estimatedMinutes: Math.min(request.count * 5, 30),
      sourceType: 'user-mistakes',
      sourceIds: request.mistakes.map(m => m.id),
      explanationPolicy: 'after-attempt' as const,
      evaluationPolicy: 'deterministic' as const,
      metadata: {
        focusAreas: ['mistake-review', 'error-correction'],
        contextSnapshotHash: '',
        schemaVersion: '1.0.0',
      },
    }

    return { exercise }
  }

  private selectTitle(request: SkillActivityGenerationRequest): string {
    if (request.focusAreas.includes('thesis')) return 'Thesis Statement Practice'
    if (request.focusAreas.includes('coherence')) return 'Coherence & Cohesion Practice'
    if (request.focusAreas.includes('lexical')) return 'Lexical Resource Practice'
    return 'Writing Practice'
  }

  private selectInstructions(request: SkillActivityGenerationRequest): string {
    if (request.availableMinutes <= 20) return 'Write a response focusing on your main ideas.'
    if (request.availableMinutes <= 40) return 'Plan, write, and review your response within the time limit.'
    return 'Plan carefully, write a structured response, and review for errors.'
  }

  private selectPrompt(_request: SkillActivityGenerationRequest): string {
    return 'Write a response on the given topic. Support your ideas with specific examples.'
  }

  private selectWordLimit(_request: SkillActivityGenerationRequest): number | undefined {
    return undefined
  }
}
