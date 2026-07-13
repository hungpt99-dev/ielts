import type { LearningEngine, AdaptDifficultyRequest, AdaptDifficultyResult, GenerateReviewRequest, GenerateReviewResult, CreateContentSessionRequest } from './learning-engine-facade'
import type { CreateLearningSessionRequest, CreateLearningSessionResult, CompleteLearningSessionRequest, CompleteLearningSessionResult, ResumeLearningSessionResult, LearningSessionSummaryResult } from '../domain/entities/learning-session'
import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../domain/entities/learning-activity'
import type { SubmitLearningAnswerRequest, SubmitLearningAnswerResult } from '../domain/entities/learning-attempt'
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
}

function metadata(aiUsed: boolean, cacheHit: boolean): LearningOperationMetadata {
  return { aiUsed, cacheHit, schemaVersion: '1.0' }
}

export class LearningEngineImpl implements LearningEngine {
  private deps: LearningEngineDependencies

  constructor(deps: LearningEngineDependencies) {
    this.deps = deps
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
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to create session', recoverable: true },
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
      })
      return { status: 'success', data: result, metadata: metadata(result.aiUsed, result.cacheHit) }
    } catch (err) {
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
        mistakeRepository: this.deps.mistakeRepository,
        vocabularyRepository: this.deps.vocabularyRepository,
        eventPublisher: this.deps.eventPublisher,
        clock: this.deps.clock,
      })
      return { status: 'success', data: result, metadata: metadata(false, false) }
    } catch (err) {
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
      return {
        status: 'failure',
        error: { code: 'storage_failure', message: err instanceof Error ? err.message : 'Failed to resume session', recoverable: true },
      }
    }
  }

  async getRecommendedActivity(
    _request: LearningRecommendationRequest,
  ): Promise<LearningOperationResult<LearningRecommendationResult>> {
    return { status: 'success', data: { recommendations: [] }, metadata: metadata(false, false) }
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
      return {
        status: 'failure',
        error: { code: 'context_unavailable', message: err instanceof Error ? err.message : 'Failed to generate review', recoverable: true },
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
