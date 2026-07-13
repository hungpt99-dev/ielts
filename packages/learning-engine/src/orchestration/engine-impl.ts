import type { LearningEngine } from './learning-engine-facade'
import type { CreateLearningSessionRequest, CreateLearningSessionResult, CompleteLearningSessionRequest, CompleteLearningSessionResult, ResumeLearningSessionResult, LearningSessionSummaryResult } from '../domain/entities/learning-session'
import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../domain/entities/learning-activity'
import type { SubmitLearningAnswerRequest, SubmitLearningAnswerResult } from '../domain/entities/learning-attempt'
import type { LearningRecommendationRequest, LearningRecommendationResult } from '../domain/entities/learning-recommendation'
import type { LearningOperationOptions, LearningOperationResult, LearningOperationMetadata } from '../domain/results/learning-operation-result'
import type { LearnerContextPort } from '../ports/learner-context-port'
import type { TutorIntelligencePort } from '../ports/tutor-intelligence-port'
import type { StudyPlanPort } from '../ports/study-plan-port'
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
        error: {
          code: 'context_unavailable',
          message: err instanceof Error ? err.message : 'Failed to create session',
          recoverable: true,
        },
      }
    }
  }

  async generateActivity(
    _request: GenerateLearningActivityRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<GenerateLearningActivityResult>> {
    return {
      status: 'unavailable',
      reason: 'offline',
    }
  }

  async submitAnswer(
    _request: SubmitLearningAnswerRequest,
    _options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<SubmitLearningAnswerResult>> {
    return {
      status: 'unavailable',
      reason: 'offline',
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
        error: {
          code: 'storage_failure',
          message: err instanceof Error ? err.message : 'Failed to complete session',
          recoverable: true,
        },
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
        error: {
          code: 'storage_failure',
          message: err instanceof Error ? err.message : 'Failed to resume session',
          recoverable: true,
        },
      }
    }
  }

  async getRecommendedActivity(
    _request: LearningRecommendationRequest,
  ): Promise<LearningOperationResult<LearningRecommendationResult>> {
    return {
      status: 'unavailable',
      reason: 'offline',
    }
  }

  async getSessionSummary(
    sessionId: string,
  ): Promise<LearningOperationResult<LearningSessionSummaryResult>> {
    const session = await this.deps.sessionRepository.getById(sessionId)
    if (!session) {
      return {
        status: 'failure',
        error: { code: 'session_expired', message: 'Session not found', recoverable: true },
      }
    }

    const outcomes = await this.deps.outcomeRepository.findRecent({})
    const sessionOutcomes = outcomes.filter(o => o.sessionId === sessionId)
    const totalScore = sessionOutcomes.reduce((s, o) => s + o.score, 0)
    const totalMax = sessionOutcomes.reduce((s, o) => s + o.maximumScore, 0)
    const mistakesCount = sessionOutcomes.reduce((s, o) => s + o.mistakes.length, 0)
    const strengthsCount = sessionOutcomes.reduce((s, o) => s + o.strengths.length, 0)

    return {
      status: 'success',
      data: {
        session,
        totalScore,
        totalMaximum: totalMax,
        accuracy: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
        mistakesCount,
        strengthsCount,
      },
      metadata: metadata(false, false),
    }
  }
}
