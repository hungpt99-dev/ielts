import type { LearningEngine, AdaptDifficultyRequest, AdaptDifficultyResult, GenerateReviewRequest, GenerateReviewResult, CreateContentSessionRequest, EvaluateWritingRequest, GenerateWritingPromptRequest } from './learning-engine-facade'
import type { CreateLearningSessionRequest, CreateLearningSessionResult, CompleteLearningSessionRequest, CompleteLearningSessionResult, ResumeLearningSessionResult, LearningSessionSummaryResult } from '../domain/entities/learning-session'
import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../domain/entities/learning-activity'
import type { StartAttemptRequest, SubmitLearningAnswerRequest, SubmitLearningAnswerResult, LearningAttempt } from '../domain/entities/learning-attempt'
import type { Exercise } from '../domain/entities/exercise'
import { startAttempt as startAttemptFn } from '../application/attempts/start-attempt'
import type { LearningRecommendationRequest, LearningRecommendationResult } from '../domain/entities/learning-recommendation'
import type { LearningOperationOptions, LearningOperationResult, LearningOperationMetadata } from '../domain/results/learning-operation-result'
import type { LearnerContextPort } from '../ports/learner-context-port'
import type { TutorIntelligencePort } from '../ports/tutor-intelligence-port'
import type { StudyPlanPort, RoadmapLearningTask } from '../ports/study-plan-port'
import type { LearningSessionRepository, LearningAttemptRepository, LearningOutcomeRepository, ExerciseRepository } from '../ports/session-repository'
import type { ProgressRepository } from '../ports/progress-repository'
import type { MistakeRepository } from '../ports/mistake-repository'
import type { VocabularyRepository } from '../ports/vocabulary-repository'
import type { LearningEventPublisher } from '../ports/learning-event-publisher'
import type { ClockPort } from '../ports/clock-port'
import type { SkillRegistry } from '../skills/skill-registry'

export interface LearningEngineDependencies {
  contextPort: LearnerContextPort
  tutorPort: TutorIntelligencePort
  studyPlanPort: StudyPlanPort
  sessionRepository: LearningSessionRepository
  attemptRepository: LearningAttemptRepository
  outcomeRepository: LearningOutcomeRepository
  exerciseRepository: ExerciseRepository
  progressRepository: ProgressRepository
  mistakeRepository: MistakeRepository
  vocabularyRepository: VocabularyRepository
  eventPublisher: LearningEventPublisher
  clock: ClockPort
  skillRegistry?: SkillRegistry
}

function metadata(aiUsed: boolean, cacheHit: boolean): LearningOperationMetadata {
  return { aiUsed, cacheHit, schemaVersion: '1.0' }
}

export class LearningEngineImpl implements LearningEngine {
  private deps: LearningEngineDependencies

  constructor(deps: LearningEngineDependencies) {
    this.deps = deps
  }

  getSkillRegistry(): SkillRegistry | undefined {
    return this.deps.skillRegistry
  }

  async createSession(
    request: CreateLearningSessionRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CreateLearningSessionResult>> {
    try {
      const { createLearningSession } = await import('../application/sessions/create-learning-session')
      const result = await createLearningSession(request, {
        contextPort: this.deps.contextPort,
        sessionRepository: this.deps.sessionRepository,
        clock: this.deps.clock,
      })
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to create session', recoverable: true },
      }
    }
  }

  async startAttempt(
    request: StartAttemptRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<{ attempt: LearningAttempt }>> {
    try {
      const attempt = await startAttemptFn(request, { attemptRepository: this.deps.attemptRepository })
      return { status: 'success', data: { attempt }, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to start attempt', recoverable: true },
      }
    }
  }

  async generateActivity(
    request: GenerateLearningActivityRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<GenerateLearningActivityResult>> {
    try {
      const { generateLearningActivity } = await import('../application/activities/generate-learning-activity')
      const result = await generateLearningActivity(request, {
        sessionRepository: this.deps.sessionRepository,
        exerciseRepository: this.deps.exerciseRepository,
        tutorPort: this.deps.tutorPort,
        contextPort: this.deps.contextPort,
        eventPublisher: this.deps.eventPublisher,
        skillRegistry: this.deps.skillRegistry,
      })
      return { status: 'success', data: result, metadata: metadata(result.aiUsed, result.cacheHit) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to generate activity', recoverable: true },
      }
    }
  }

  async submitAnswer(
    request: SubmitLearningAnswerRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<SubmitLearningAnswerResult>> {
    try {
      const { submitAnswer } = await import('../application/attempts/submit-answer')
      const result = await submitAnswer(request, {
        sessionRepository: this.deps.sessionRepository,
        attemptRepository: this.deps.attemptRepository,
        exerciseRepository: this.deps.exerciseRepository,
        tutorPort: this.deps.tutorPort,
        mistakeRepository: this.deps.mistakeRepository,
        eventPublisher: this.deps.eventPublisher,
      })
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      if (err instanceof Error && err.message.includes('already been submitted')) {
        return { status: 'failure', error: { code: 'attempt_already_submitted', message: err.message, recoverable: false } }
      }
      return {
        status: 'failure',
        error: { code: 'evaluation_failure', message: err instanceof Error ? err.message : 'Failed to submit answer', recoverable: true },
      }
    }
  }

  async completeSession(
    request: CompleteLearningSessionRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CompleteLearningSessionResult>> {
    try {
      const { completeLearningSession } = await import('../application/sessions/complete-learning-session')
      const result = await completeLearningSession(request, {
        sessionRepository: this.deps.sessionRepository,
        attemptRepository: this.deps.attemptRepository,
        outcomeRepository: this.deps.outcomeRepository,
        progressRepository: this.deps.progressRepository,
        studyPlanPort: this.deps.studyPlanPort,
        tutorPort: this.deps.tutorPort,
        mistakeRepository: this.deps.mistakeRepository,
        vocabularyRepository: this.deps.vocabularyRepository,
        eventPublisher: this.deps.eventPublisher,
        clock: this.deps.clock,
      })
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to complete session', recoverable: true },
      }
    }
  }

  async resumeSession(sessionId: string): Promise<LearningOperationResult<ResumeLearningSessionResult>> {
    try {
      const { resumeLearningSession } = await import('../application/sessions/resume-learning-session')
      const result = await resumeLearningSession(sessionId, {
        sessionRepository: this.deps.sessionRepository,
        attemptRepository: this.deps.attemptRepository,
      })
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to resume session', recoverable: true },
      }
    }
  }

  async getRecommendedActivity(
    request: LearningRecommendationRequest,
  ): Promise<LearningOperationResult<LearningRecommendationResult>> {
    try {
      const recommendations: import('../domain/entities/learning-recommendation').LearningRecommendation[] = []

      if (request.skill) {
        const recentMistakes = await this.deps.mistakeRepository.findRecent(request.skill, 3)
        if (recentMistakes.length > 0) {
          recommendations.push({
            action: 'review-mistakes',
            reason: `${recentMistakes.length} recent mistake${recentMistakes.length > 1 ? 's' : ''} in ${request.skill} need review`,
            estimatedMinutes: 15,
            sourceIds: recentMistakes.map(m => m.id),
            priority: 0.9,
          })
        }
      }

      const activeSessions = await this.deps.sessionRepository.findActive()
      if (activeSessions.length > 0) {
        recommendations.push({
          action: 'continue-session',
          reason: `Continue your ${activeSessions[0].skill} session`,
          estimatedMinutes: activeSessions[0].plannedDurationMinutes,
          sourceIds: [activeSessions[0].id],
          priority: 0.7,
        })
      }

      if (this.deps.vocabularyRepository) {
        const dueVocab = await this.deps.vocabularyRepository.getDueForReview(5)
        if (dueVocab.length > 0) {
          recommendations.push({
            action: 'review-vocabulary',
            reason: `${dueVocab.length} vocabulary item${dueVocab.length > 1 ? 's' : ''} due for review`,
            estimatedMinutes: 10,
            sourceIds: dueVocab.map(v => v.id),
            priority: 0.8,
          })
        }
      }

      return { status: 'success', data: { recommendations }, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to get recommendations', recoverable: true },
      }
    }
  }

  async createSessionFromRoadmapTask(
    task: RoadmapLearningTask,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CreateLearningSessionResult>> {
    try {
      const { createSessionFromRoadmapTask } = await import('../application/activities/create-roadmap-task-session')
      const result = await createSessionFromRoadmapTask(task, {
        contextPort: this.deps.contextPort,
        sessionRepository: this.deps.sessionRepository,
        clock: this.deps.clock,
      })
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to create roadmap session', recoverable: true },
      }
    }
  }

  async createSessionFromContent(
    request: CreateContentSessionRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CreateLearningSessionResult>> {
    try {
      const { createLearningSession } = await import('../application/sessions/create-learning-session')
      const result = await createLearningSession({
        objective: {
          id: crypto.randomUUID?.() ?? `${Date.now()}-obj`,
          skill: request.skill as any,
          type: 'practice',
          description: `Practice from ${request.content.type}`,
          source: request.content.type === 'youtube-transcript' ? 'saved-content' : 'imported-content',
          sourceId: request.content.id,
          estimatedMinutes: request.availableMinutes,
          priority: 'normal',
          successCriteria: [],
        },
        skill: request.skill as any,
        mode: 'practice',
        source: request.content.type === 'youtube-transcript' ? 'saved-content' : 'imported-content',
        sourceIds: [request.content.id],
        plannedDurationMinutes: request.availableMinutes,
        contextScope: request.content.type === 'youtube-transcript' ? 'youtube' : 'article',
        correlationId: crypto.randomUUID?.() ?? `${Date.now()}-corr`,
      }, {
        contextPort: this.deps.contextPort,
        sessionRepository: this.deps.sessionRepository,
        clock: this.deps.clock,
      })
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to create content session', recoverable: true },
      }
    }
  }

  async adaptDifficulty(
    request: AdaptDifficultyRequest,
  ): Promise<LearningOperationResult<AdaptDifficultyResult>> {
    try {
      const { adaptDifficulty } = await import('../application/adaptation/adapt-difficulty')
      const result = adaptDifficulty(request)
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'evaluation_failure', message: err instanceof Error ? err.message : 'Failed to adapt difficulty', recoverable: true },
      }
    }
  }

  async generateReview(
    request: GenerateReviewRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<GenerateReviewResult>> {
    try {
      const { generateMistakeReview } = await import('../application/review/generate-mistake-review')
      const exercise = await generateMistakeReview(request.skill, request.count, {
        mistakeRepository: this.deps.mistakeRepository,
      })
      return { status: 'success', data: { exercise }, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to generate review', recoverable: true },
      }
    }
  }

  async getExercises(skill?: string): Promise<LearningOperationResult<{ exercises: Exercise[] }>> {
    try {
      const exercises = await this.deps.exerciseRepository.findAll(skill)
      return { status: 'success', data: { exercises }, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to get exercises', recoverable: true },
      }
    }
  }

  async saveExercise(exercise: Exercise): Promise<LearningOperationResult<void>> {
    try {
      await this.deps.exerciseRepository.save(exercise)
      return { status: 'success', data: undefined as any, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to save exercise', recoverable: true },
      }
    }
  }

  async deleteExercise(id: string): Promise<LearningOperationResult<void>> {
    try {
      await this.deps.exerciseRepository.delete(id)
      return { status: 'success', data: undefined as any, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to delete exercise', recoverable: true },
      }
    }
  }

  async evaluateWriting(request: EvaluateWritingRequest): Promise<LearningOperationResult<{ feedback: any }>> {
    try {
      const systemPrompt = `You are an expert IELTS writing examiner and tutor. Evaluate the user's essay based on the official IELTS Writing Task rubric.

Return ONLY valid JSON in this exact format, no other text:
{
  "bandScore": number (1-9),
  "taskResponse": "detailed feedback on task achievement / task response (2-3 sentences)",
  "coherence": "detailed feedback on coherence and cohesion (2-3 sentences)",
  "vocabulary": "detailed feedback on lexical resource (2-3 sentences)",
  "grammar": "detailed feedback on grammatical range and accuracy (2-3 sentences)",
  "overallFeedback": "summary of strengths and key areas to improve (2-3 sentences)",
  "improvedVersion": "a rewritten version of a key paragraph showing improvement",
  "mistakes": [
    {
      "category": "grammar" | "vocabulary" | "coherence" | "task-response",
      "text": "the incorrect or problematic text",
      "correction": "the corrected version",
      "explanation": "why this is an issue and how to fix it"
    }
  ]
}

Be specific and constructive. Reference specific sentences from the essay in your feedback.`

      const userMessage = `Writing Task Question:
${request.question}

User's Essay:
${request.essay}

Please evaluate this essay according to the IELTS Writing Task rubric.`

      const result = await this.deps.tutorPort.generateEducationalContent({
        systemPrompt,
        userMessage,
        schema: {},
      })

      if (!result.success) {
        return {
          status: 'failure',
          error: { code: 'ai_failed', message: result.error?.message ?? 'AI evaluation failed', recoverable: true },
        }
      }

      return { status: 'success', data: { feedback: result.data }, metadata: metadata(true, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'evaluation_failure', message: err instanceof Error ? err.message : 'Failed to evaluate writing', recoverable: true },
      }
    }
  }

  async generateWritingPrompt(request: GenerateWritingPromptRequest): Promise<LearningOperationResult<{ question: string }>> {
    try {
      const systemPrompt = `You are an IELTS writing examiner. Generate a single IELTS Writing Task ${request.taskType === 'task1' ? '1' : '2'} prompt about "${request.topic}" at ${request.difficulty} difficulty.

Return ONLY valid JSON in this exact format, no other text:
{
  "question": "the full IELTS writing prompt question"
}

The question must be a complete, realistic IELTS Writing Task ${request.taskType === 'task1' ? '1' : '2'} prompt about "${request.topic}".`

      const userMessage = `Generate an IELTS Writing Task ${request.taskType === 'task1' ? '1' : '2'} prompt about "${request.topic}" at ${request.difficulty} difficulty.`

      const result = await this.deps.tutorPort.generateEducationalContent({
        systemPrompt,
        userMessage,
        schema: {},
      })

      if (!result.success) {
        return {
          status: 'failure',
          error: { code: 'ai_failed', message: result.error?.message ?? 'AI generation failed', recoverable: true },
        }
      }

      const question = (result.data as any)?.question || ''
      if (!question) {
        return {
          status: 'failure',
          error: { code: 'generation_failed', message: 'AI returned empty question', recoverable: true },
        }
      }

      return { status: 'success', data: { question }, metadata: metadata(true, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'generation_failure', message: err instanceof Error ? err.message : 'Failed to generate writing prompt', recoverable: true },
      }
    }
  }

  private normalizeAnswer(userAnswer: unknown, correctAnswer: string | number | string[]): boolean {
    if (userAnswer === undefined || userAnswer === null) return false
    if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
      return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
    }
    if (typeof userAnswer === 'number' && typeof correctAnswer === 'number') {
      return userAnswer === correctAnswer
    }
    if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
      return userAnswer.some((v: string) =>
        correctAnswer.some((c: string) => v.toLowerCase().trim() === c.toLowerCase().trim())
      )
    }
    return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
  }

  private isCorrect(question: any, answer: unknown): boolean {
    if (question.type === 'gap-fill') {
      const blanks: string[] = question.blanks || []
      const userBlanks = (answer as string[]) || []
      if (blanks.length === 0) return false
      return blanks.every((b, i) => {
        const userVal = userBlanks[i]?.toLowerCase().trim() || ''
        return b.toLowerCase().trim() === userVal
      })
    }
    return this.normalizeAnswer(answer, question.correctAnswer)
  }

  async getMistakes(skill?: string): Promise<LearningOperationResult<{ mistakes: any[] }>> {
    try {
      const mistakes = await this.deps.mistakeRepository.findRecent(skill)
      return { status: 'success', data: { mistakes }, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return { status: 'failure', error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to get mistakes', recoverable: true } }
    }
  }

  async getOutcomes(skill?: string): Promise<LearningOperationResult<{ outcomes: any[] }>> {
    try {
      const outcomes = await this.deps.outcomeRepository.findRecent({ skill })
      return { status: 'success', data: { outcomes }, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return { status: 'failure', error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to get outcomes', recoverable: true } }
    }
  }

  async completeExercise(request: {
    skill: string
    topic: string
    questions: Array<{ id: string; question: string; correctAnswer: string | number | string[]; options?: string[]; explanation: string; type?: string; blanks?: string[] }>
    answers: Record<string, unknown>
    sessionId?: string
    attemptId?: string
    timeSpentMs?: number
  }): Promise<LearningOperationResult<{ totalQuestions: number; correctAnswers: number; questionResults: Array<{ questionId: string; question: string; userAnswer: unknown; correctAnswer: string | number | string[]; isCorrect: boolean; explanation: string }> }>> {
    try {
      let correct = 0
      const mistakes: any[] = []
      const questionResults: Array<{ questionId: string; question: string; userAnswer: unknown; correctAnswer: string | number | string[]; isCorrect: boolean; explanation: string }> = []
      const now = new Date().toISOString()

      for (const q of request.questions) {
        const userAnswer = request.answers[q.id]
        const isCorrect = this.isCorrect(q, userAnswer)
        questionResults.push({
          questionId: q.id,
          question: q.question,
          userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation || '',
        })
        if (isCorrect) {
          correct++
        } else {
          mistakes.push({
            id: crypto.randomUUID?.() ?? `${Date.now()}-mistake`,
            mistake: q.question,
            correction: Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer),
            explanation: q.explanation || '',
            source: `${request.skill === 'grammar' ? 'Grammar' : request.skill === 'reading' ? 'Reading' : request.skill === 'listening' ? 'Listening' : 'Exercise'} - ${request.topic}`,
            date: now.slice(0, 10),
            skill: request.skill,
            status: 'new',
            repetitionCount: 0,
            createdAt: now,
            updatedAt: now,
          })
        }
      }

      for (const m of mistakes) {
        await this.deps.mistakeRepository.save(m).catch(() => {})
      }

      if (request.sessionId && request.attemptId) {
        const { submitAnswer } = await import('../application/attempts/submit-answer')
        await submitAnswer({
          sessionId: request.sessionId,
          attemptId: request.attemptId,
          answers: mistakes.map(m => ({
            questionId: m.id || '',
            answer: m.mistake || '',
            answeredAt: now,
            timeSpentMs: request.timeSpentMs || 0,
            isFinal: true,
          })),
          correlationId: crypto.randomUUID?.() ?? `${Date.now()}-corr`,
        }, {
          sessionRepository: this.deps.sessionRepository,
          attemptRepository: this.deps.attemptRepository,
          exerciseRepository: this.deps.exerciseRepository,
          tutorPort: this.deps.tutorPort,
          mistakeRepository: this.deps.mistakeRepository,
          eventPublisher: this.deps.eventPublisher,
        }).catch(() => {})

        const { completeLearningSession } = await import('../application/sessions/complete-learning-session')
        await completeLearningSession({
          sessionId: request.sessionId,
          actualDurationMinutes: Math.ceil((request.timeSpentMs || 0) / 60000),
          correlationId: crypto.randomUUID?.() ?? `${Date.now()}-corr`,
        }, {
          sessionRepository: this.deps.sessionRepository,
          attemptRepository: this.deps.attemptRepository,
          outcomeRepository: this.deps.outcomeRepository,
          mistakeRepository: this.deps.mistakeRepository,
          vocabularyRepository: this.deps.vocabularyRepository,
          eventPublisher: this.deps.eventPublisher,
          clock: this.deps.clock,
        }).catch(() => {})
      }

      await this.deps.outcomeRepository.save({
        sessionId: request.sessionId || '',
        exerciseId: '',
        attemptId: request.attemptId || '',
        skill: request.skill,
        objectiveId: '',
        score: correct,
        maximumScore: request.questions.length,
        difficulty: 'medium',
        actualMinutes: Math.ceil((request.timeSpentMs || 0) / 60000),
        hintsUsed: 0,
        strengths: [],
        weaknesses: [],
        mistakes: mistakes.map((m: any) => ({
          id: m.id,
          skill: request.skill as any,
          category: 'incorrect',
          originalResponse: m.mistake || '',
          correctedResponse: m.correction || '',
          explanation: m.explanation || '',
          sourceExerciseId: '',
          sourceQuestionId: '',
          occurredAt: now,
          recurrenceCount: 0,
          severity: 'moderate',
          confidence: 0.5,
          reviewStatus: 'unreviewed',
        })),
        vocabularyEvidence: [],
        completedAt: now,
      }).catch(() => {})

      return { status: 'success', data: { totalQuestions: request.questions.length, correctAnswers: correct, questionResults }, metadata: metadata(false, false) }
    } catch (err) {
      console.error('packages/learning-engine/src/orchestration/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to complete exercise', recoverable: true },
      }
    }
  }

  async getSessionSummary(sessionId: string): Promise<LearningOperationResult<LearningSessionSummaryResult>> {
    const session = await this.deps.sessionRepository.getById(sessionId)
    if (!session) {
      return { status: 'failure', error: { code: 'session_expired', message: 'Session not found', recoverable: true } }
    }

    const outcomes = await this.deps.outcomeRepository.findRecent({})
    const sessionOutcomes = outcomes.filter(o => o.sessionId === sessionId)
    const totalScore = sessionOutcomes.reduce((s, o) => s + o.score, 0)
    const totalMax = sessionOutcomes.reduce((s, o) => s + o.maximumScore, 0)

    return {
      status: 'success',
      data: {
        session,
        totalScore,
        totalMaximum: totalMax,
        accuracy: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
        mistakesCount: sessionOutcomes.reduce((s, o) => s + o.mistakes.length, 0),
        strengthsCount: sessionOutcomes.reduce((s, o) => s + o.strengths.length, 0),
      },
      metadata: metadata(false, false),
    }
  }
}
