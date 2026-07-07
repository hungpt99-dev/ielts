import { learningEventRepository } from './learningEventRepository'
import type { CreateLearningEventInput, LearningEvent } from './types'
import { LEARNING_EVENT_TYPES } from './types'

export type LearningEventSubscriber = (event: LearningEvent) => void | Promise<void>

export class LearningEventBus {
  private static instance: LearningEventBus | null = null
  private subscribers: Set<LearningEventSubscriber> = new Set()

  private constructor() {}

  static getInstance(): LearningEventBus {
    if (!LearningEventBus.instance) {
      LearningEventBus.instance = new LearningEventBus()
    }
    return LearningEventBus.instance
  }

  static resetInstance(): void {
    LearningEventBus.instance = null
  }

  subscribe(subscriber: LearningEventSubscriber): () => void {
    this.subscribers.add(subscriber)
    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  unsubscribe(subscriber: LearningEventSubscriber): void {
    this.subscribers.delete(subscriber)
  }

  getSubscriberCount(): number {
    return this.subscribers.size
  }

  async emitLearningEvent(input: CreateLearningEventInput): Promise<LearningEvent> {
    this.validateInput(input)

    try {
      const event = await learningEventRepository.save(input)
      this.dispatchToSubscribers(event)
      return event
    } catch (error) {
      console.error('[LearningEventBus] Failed to save event:', error)
      return this.createFallbackEvent(input)
    }
  }

  private validateInput(input: CreateLearningEventInput): void {
    if (!LEARNING_EVENT_TYPES.includes(input.eventType)) {
      console.warn(`[LearningEventBus] Unknown event type: "${input.eventType}"`)
    }

    if (input.payload.eventType !== input.eventType) {
      console.warn(
        `[LearningEventBus] Payload eventType mismatch: expected "${input.eventType}", got "${input.payload.eventType}"`,
      )
    }
  }

  private dispatchToSubscribers(event: LearningEvent): void {
    for (const subscriber of this.subscribers) {
      try {
        const result = subscriber(event)
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error('[LearningEventBus] Subscriber async error:', err)
          })
        }
      } catch (err) {
        console.error('[LearningEventBus] Subscriber error:', err)
      }
    }
  }

  private createFallbackEvent(input: CreateLearningEventInput): LearningEvent {
    const now = new Date().toISOString()
    return {
      eventId: crypto.randomUUID(),
      eventType: input.eventType,
      source: input.source,
      timestamp: now,
      page: input.page ?? '/',
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      payload: input.payload,
      metadata: input.metadata ?? {},
      sessionId: crypto.randomUUID(),
      correlationId: input.correlationId ?? null,
      createdAt: now,
      syncStatus: 'local_only',
    }
  }
}

export const learningEventBus = LearningEventBus.getInstance()

export async function emitLearningEvent(
  input: CreateLearningEventInput,
): Promise<LearningEvent> {
  return learningEventBus.emitLearningEvent(input)
}
