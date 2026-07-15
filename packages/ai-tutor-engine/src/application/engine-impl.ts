import type { AITutorEngine, TutorRequestOptions, TutorOperationResult, ContextSuggestionRequest } from './ai-tutor-engine'
import type { TutorChatRequest, TutorChatResult } from '../domain/entities/tutor-message'
import type { NextBestActionRequest, NextBestActionResult } from '../domain/entities/tutor-recommendation'
import type { ProactiveEvaluationRequest, ProactiveEvaluationResult } from '../domain/entities/proactive-message'
import type { ProgressReviewRequest, ProgressReviewResult } from '../domain/entities/progress-review'
import type { LearningEvent } from '../domain/events/learning-event'
import type { UpdateTutorMemoryRequest, UpdateTutorMemoryResult } from '../domain/entities/tutor-memory'
import type { AITutorInitializationResult, TutorStateSnapshot } from '../domain/results/tutor-result'
import type { ContextSuggestion } from './recommendations/generate-context-suggestions'
import type { TutorAIClient } from '../ai/tutor-ai-client'
import type { LearnerContextBuilder } from '../context/learner-context-builder'
import type { TutorMessageRepository } from '../ports/tutor-message-repository'
import type { TutorMemoryRepository } from '../ports/tutor-memory-repository'
import type { TutorSettingsRepository } from '../ports/tutor-settings-repository'
import type { TutorEventPublisher } from '../ports/tutor-event-publisher'
import type { ClockPort } from '../ports/clock-port'

import { sendTutorMessage, type SendTutorMessageDependencies } from './chat/send-tutor-message'
import { getNextBestAction } from './recommendations/get-next-best-action'
import { generateProactiveMessages } from './proactive/generate-proactive-messages'
import { generateProgressReview } from './progress/generate-progress-review'
import { generateContextSuggestions } from './recommendations/generate-context-suggestions'
import { updateTutorMemory } from './memory/update-tutor-memory'
import { TutorMemoryManager } from '../memory/tutor-memory-manager'
import { SystemClock } from '../ports/clock-port'
import { AiGenerateResultCache } from '@ielts/ai'

export interface ProgressReviewCache {
  get(): ProgressReviewResult | null
  set(result: ProgressReviewResult): void
}

export interface AITutorEngineDependencies {
  aiClient?: TutorAIClient
  contextBuilder: LearnerContextBuilder
  messageRepository: TutorMessageRepository
  memoryRepository: TutorMemoryRepository
  settingsRepository: TutorSettingsRepository
  eventPublisher: TutorEventPublisher
  clock?: ClockPort
  progressReviewTtlMs?: number
  progressReviewCache?: ProgressReviewCache
}

export class AITutorEngineImpl implements AITutorEngine {
  private deps: AITutorEngineDependencies
  private memoryManager: TutorMemoryManager
  private initialized = false
  private progressCache: AiGenerateResultCache<ProgressReviewResult>

  constructor(deps: AITutorEngineDependencies) {
    this.deps = deps
    this.memoryManager = new TutorMemoryManager(deps.memoryRepository)
    const ttl = deps.progressReviewTtlMs ?? 3_600_000
    this.progressCache = new AiGenerateResultCache<ProgressReviewResult>({ ttlMs: ttl })
  }

  async initialize(): Promise<AITutorInitializationResult> {
    this.initialized = true
    return {
      initialized: true,
      aiAvailable: !!this.deps.aiClient,
      storageAvailable: true,
      errors: [],
    }
  }

  async chat(
    request: TutorChatRequest,
    _options?: TutorRequestOptions,
  ): Promise<TutorOperationResult<TutorChatResult>> {
    if (!this.initialized) {
      return { status: 'failure', error: { code: 'not_initialized', message: 'Engine not initialized', recoverable: true } }
    }

    const chatDeps: SendTutorMessageDependencies = {
      aiClient: this.deps.aiClient ?? createFallbackClient(),
      messageRepository: this.deps.messageRepository,
      eventPublisher: this.deps.eventPublisher,
      contextBuilder: this.deps.contextBuilder,
      clock: this.deps.clock ?? new SystemClock(),
    }

    const result = await sendTutorMessage(request, chatDeps)

    if (result.status === 'success' && result.data) {
      return { status: 'success', data: result.data }
    }
    if (result.status === 'partial' && result.data) {
      return { status: 'partial', data: result.data, warnings: result.warnings }
    }
    if (result.status === 'failure') {
      return { status: 'failure', error: { code: 'chat_failed', message: result.error?.message ?? 'Unknown error', recoverable: true } }
    }
    return { status: 'failure', error: { code: 'chat_failed', message: 'Failed to process chat message', recoverable: true } }
  }

  async getNextBestAction(
    request: NextBestActionRequest,
  ): Promise<TutorOperationResult<NextBestActionResult>> {
    try {
      const learnerState = request.learnerState ?? await this.deps.contextBuilder.build('proactive')
      const enrichedRequest: NextBestActionRequest = {
        ...request,
        learnerState,
      }
      const result = getNextBestAction(enrichedRequest)
      return { status: 'success', data: result }
    } catch (err) {
      console.error('packages/ai-tutor-engine/src/application/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: {
          code: 'action_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          recoverable: true,
        },
      }
    }
  }

  async evaluateProactiveSupport(
    request: ProactiveEvaluationRequest,
  ): Promise<TutorOperationResult<ProactiveEvaluationResult>> {
    try {
      const settings = await this.deps.settingsRepository.getProactiveSettings()
      const recentMessages = request.recentMessages ?? []
      const cooldownState = recentMessages
        .filter(m => m.createdAt)
        .map(m => ({ triggerType: m.triggerType, lastFiredAt: m.createdAt }))
      const result = await generateProactiveMessages(request, settings, cooldownState)
      return { status: 'success', data: result }
    } catch (err) {
      console.error('packages/ai-tutor-engine/src/application/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: {
          code: 'proactive_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          recoverable: true,
        },
      }
    }
  }

  async generateProgressReview(
    request: ProgressReviewRequest,
  ): Promise<TutorOperationResult<ProgressReviewResult>> {
    const cacheKey = request.forceRegenerate ? '' : AiGenerateResultCache.generateKey('progress-review')
    if (cacheKey) {
      const cached = this.progressCache.get(cacheKey)
      if (cached) return { status: 'success', data: cached }
      const persisted = this.deps.progressReviewCache?.get()
      if (persisted) {
        this.progressCache.set(cacheKey, persisted)
        return { status: 'success', data: persisted }
      }
    }
    try {
      const learnerState = request.learnerState ?? await this.deps.contextBuilder.build('proactive')
      const enrichedRequest: ProgressReviewRequest = {
        ...request,
        learnerState,
      }
      const result = await generateProgressReview(enrichedRequest, { aiClient: this.deps.aiClient })
      if (cacheKey) {
        this.progressCache.set(cacheKey, result)
      }
      this.deps.progressReviewCache?.set(result)
      return { status: 'success', data: result }
    } catch (err) {
      console.error('packages/ai-tutor-engine/src/application/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: {
          code: 'progress_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          recoverable: true,
        },
      }
    }
  }

  async generateContextSuggestions(
    request: ContextSuggestionRequest,
  ): Promise<TutorOperationResult<ContextSuggestion[]>> {
    try {
      const suggestions = generateContextSuggestions(request.learnerState)
      return { status: 'success', data: suggestions }
    } catch (err) {
      console.error('packages/ai-tutor-engine/src/application/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: {
          code: 'suggestions_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          recoverable: true,
        },
      }
    }
  }

  async handleLearningEvent(
    event: LearningEvent,
  ): Promise<TutorOperationResult<void>> {
    try {
      this.deps.eventPublisher.publishLearningEvent(event)

      const memoryUpdates: UpdateTutorMemoryRequest = {
        learnerId: 'default',
        weakPoints: event.type === 'writing_reviewed' || event.type === 'speaking_session_completed'
          ? [{ description: `${event.type} completed`, detectedAt: event.occurredAt, skill: event.source, id: crypto.randomUUID?.() ?? `${Date.now()}-wp`, frequency: 1, lastObservedAt: event.occurredAt, evidenceCount: 1 }]
          : undefined,
        mistakePatterns: event.type === 'mistake_recorded'
          ? [{ pattern: 'recorded_mistake', skill: 'entityId' in event ? `${event.entityId}` : 'general', firstDetectedAt: event.occurredAt, lastDetectedAt: event.occurredAt, frequency: 1, id: crypto.randomUUID?.() ?? `${Date.now()}-mp`, examples: [] }]
          : undefined,
        goals: event.type === 'task_completed' || event.type === 'progress_milestone'
          ? [{ title: `Completed: ${'taskTitle' in event ? event.taskTitle : event.type}`, description: `${event.type} on ${event.occurredAt}`, isAchieved: true, createdAt: event.occurredAt, id: crypto.randomUUID?.() ?? `${Date.now()}-g` }]
          : undefined,
      }
      await updateTutorMemory(memoryUpdates, this.memoryManager)

      const settings = await this.deps.settingsRepository.getProactiveSettings()
      if (settings.enabled) {
        const learnerState = await this.deps.contextBuilder.build('proactive')
        const result = await generateProactiveMessages(
          { triggerEvent: event.type, learnerState, recentMessages: [] },
          settings,
          [],
        )
        if (result.selected.length > 0) {
          this.deps.eventPublisher.publishTutorEvent({
            id: crypto.randomUUID?.() ?? `${Date.now()}-evt`,
            type: 'proactive_intervention',
            occurredAt: new Date().toISOString(),
            interventions: result.selected.map(i => ({
              title: i.title,
              message: i.message,
              priority: 'medium',
            })),
          })
        }
      }

      return { status: 'success', data: undefined }
    } catch (err) {
      console.error('packages/ai-tutor-engine/src/application/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: {
          code: 'learning_event_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          recoverable: true,
        },
      }
    }
  }

  async updateMemory(
    request: UpdateTutorMemoryRequest,
  ): Promise<TutorOperationResult<UpdateTutorMemoryResult>> {
    try {
      const result = await updateTutorMemory(request, this.memoryManager)
      return { status: 'success', data: result }
    } catch (err) {
      console.error('packages/ai-tutor-engine/src/application/engine-impl.ts error:', err);
      return {
        status: 'failure',
        error: {
          code: 'memory_failed',
          message: err instanceof Error ? err.message : 'Unknown error',
          recoverable: true,
        },
      }
    }
  }

  async getTutorState(): Promise<TutorStateSnapshot> {
    let activeMessages = 0
    let sessionCount = 0
    let memoryVersion = 1
    try {
      const state = await this.deps.contextBuilder.build('proactive')
      memoryVersion = state.activitySummary?.tasksCompletedToday ?? 1
    } catch (error) {
      console.error('packages/ai-tutor-engine/src/application/engine-impl.ts error:', error);
      /* use defaults */
    }
    return {
      initialized: this.initialized,
      aiConfigured: !!this.deps.aiClient,
      proactiveEnabled: true,
      currentSessionsCount: sessionCount,
      activeProactiveMessages: activeMessages,
      memoryVersion,
    }
  }
}

function createFallbackClient(): TutorAIClient {
  return {
    async generateStructured() {
      return { success: false, error: { code: 'ai_not_configured', message: 'No AI provider', recoverable: true } }
    },
  }
}
