import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb, APP_SCHEMA } from '@ielts/storage'
import {
  LearningEventBus,
  learningEventBus,
  emitLearningEvent,
  type LearningEventSubscriber,
} from '../LearningEventBus'
import { resetInMemoryStore } from '../learningEventRepository'
import type { CreateLearningEventInput, LearningEvent } from '../types'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('learningEvents').clear()
}

function makeInput(overrides: Partial<CreateLearningEventInput> = {}): CreateLearningEventInput {
  return {
    eventType: 'app_opened',
    source: 'website',
    payload: {
      eventType: 'app_opened',
      lastActiveAt: null,
      isReturnVisit: false,
    },
    page: '/dashboard',
    ...overrides,
  }
}

describe('LearningEventBus', () => {
  let bus: LearningEventBus

  beforeEach(async () => {
    setupDb()
    await clearData()
    resetInMemoryStore()
    LearningEventBus.resetInstance()
    bus = LearningEventBus.getInstance()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('singleton', () => {
    it('returns the same instance', () => {
      const instance1 = LearningEventBus.getInstance()
      const instance2 = LearningEventBus.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('resetInstance creates a new instance', () => {
      const instance1 = LearningEventBus.getInstance()
      LearningEventBus.resetInstance()
      const instance2 = LearningEventBus.getInstance()
      expect(instance2).not.toBe(instance1)
    })

    it('exposes a default singleton', () => {
      expect(learningEventBus instanceof LearningEventBus).toBe(true)
    })
  })

  describe('emitLearningEvent', () => {
    it('saves an event and returns it with all fields', async () => {
      const input = makeInput()
      const event = await bus.emitLearningEvent(input)

      expect(event).toBeDefined()
      expect(event.eventId).toBeTruthy()
      expect(event.eventType).toBe('app_opened')
      expect(event.source).toBe('website')
      expect(event.timestamp).toBeTruthy()
      expect(event.page).toBe('/dashboard')
      expect(event.payload.eventType).toBe('app_opened')
      expect(event.sessionId).toBeTruthy()
      expect(event.syncStatus).toBe('local_only')
      expect(event.createdAt).toBeTruthy()
    })

    it('saves event with vocabulary payload', async () => {
      const input: CreateLearningEventInput = {
        eventType: 'vocabulary_saved',
        source: 'vocabulary',
        payload: {
          eventType: 'vocabulary_saved',
          vocabularyId: 'vocab-1',
          word: 'abandon',
          topic: 'education',
          sessionWordCount: 3,
        },
      }
      const event = await bus.emitLearningEvent(input)

      expect(event.eventType).toBe('vocabulary_saved')
      expect(event.payload).toMatchObject({
        word: 'abandon',
        topic: 'education',
      })
    })

    it('does not throw on unknown event type', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const input = makeInput({ eventType: 'unknown_type' as never })
      const event = await bus.emitLearningEvent(input)

      expect(event).toBeDefined()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown event type'),
      )

      consoleSpy.mockRestore()
    })

    it('warns on payload eventType mismatch', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const input = makeInput({
        eventType: 'app_opened',
        payload: { eventType: 'dashboard_opened', activeTasks: 3 } as never,
      })
      await bus.emitLearningEvent(input)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Payload eventType mismatch'),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('convenience API', () => {
    it('emitLearningEvent works without importing class', async () => {
      const input = makeInput()
      const event = await emitLearningEvent(input)

      expect(event).toBeDefined()
      expect(event.eventType).toBe('app_opened')
    })
  })

  describe('subscribers', () => {
    it('notifies subscribed callback on event', async () => {
      const callback = vi.fn()
      bus.subscribe(callback)

      const input = makeInput()
      const event = await bus.emitLearningEvent(input)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(event)
    })

    it('notifies all subscribers', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      bus.subscribe(callback1)
      bus.subscribe(callback2)

      await bus.emitLearningEvent(makeInput())

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('does not notify unsubscribed callbacks', async () => {
      const callback = vi.fn()
      const unsubscribe = bus.subscribe(callback)
      unsubscribe()

      await bus.emitLearningEvent(makeInput())

      expect(callback).not.toHaveBeenCalled()
    })

    it('supports unsubscribe', async () => {
      const callback = vi.fn()
      bus.subscribe(callback)
      bus.unsubscribe(callback)

      await bus.emitLearningEvent(makeInput())

      expect(callback).not.toHaveBeenCalled()
    })

    it('tracks subscriber count', async () => {
      expect(bus.getSubscriberCount()).toBe(0)

      const unsub1 = bus.subscribe(vi.fn())
      expect(bus.getSubscriberCount()).toBe(1)

      const unsub2 = bus.subscribe(vi.fn())
      expect(bus.getSubscriberCount()).toBe(2)

      unsub1()
      expect(bus.getSubscriberCount()).toBe(1)

      unsub2()
      expect(bus.getSubscriberCount()).toBe(0)
    })

    it('handles async subscribers', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      bus.subscribe(callback)

      await bus.emitLearningEvent(makeInput())

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('error isolation', () => {
    it('does not break when subscriber throws synchronously', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const throwingSubscriber: LearningEventSubscriber = () => {
        throw new Error('Subscriber error')
      }
      bus.subscribe(throwingSubscriber)

      const event = await bus.emitLearningEvent(makeInput())

      expect(event).toBeDefined()
      expect(event.eventId).toBeTruthy()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscriber error'),
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })

    it('does not break when subscriber rejects', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const rejectingSubscriber: LearningEventSubscriber = async () => {
        throw new Error('Async subscriber error')
      }
      bus.subscribe(rejectingSubscriber)

      const event = await bus.emitLearningEvent(makeInput())

      expect(event).toBeDefined()
      expect(event.eventId).toBeTruthy()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Subscriber async error'),
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })

    it('still notifies other subscribers when one throws', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const goodCallback = vi.fn()
      const badCallback: LearningEventSubscriber = () => {
        throw new Error('Bad subscriber')
      }

      bus.subscribe(goodCallback)
      bus.subscribe(badCallback)

      await bus.emitLearningEvent(makeInput())

      expect(goodCallback).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })

    it('returns fallback event when repository save fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      destroyDb()

      const input = makeInput()
      const event = await bus.emitLearningEvent(input)

      expect(event).toBeDefined()
      expect(event.eventId).toBeTruthy()
      expect(event.eventType).toBe('app_opened')
      expect(event.syncStatus).toBe('local_only')

      consoleSpy.mockRestore()
    })

    it('fallback event contains all required fields', async () => {
      destroyDb()

      const input = makeInput({
        page: '/vocabulary',
        entityType: 'vocabulary',
        entityId: 'v-1',
        metadata: { source: 'test' },
        correlationId: 'corr-1',
      })
      const event = await bus.emitLearningEvent(input)

      expect(event.eventId).toBeTruthy()
      expect(event.eventType).toBe('app_opened')
      expect(event.source).toBe('website')
      expect(event.timestamp).toBeTruthy()
      expect(event.page).toBe('/vocabulary')
      expect(event.entityType).toBe('vocabulary')
      expect(event.entityId).toBe('v-1')
      expect(event.payload.eventType).toBe('app_opened')
      expect(event.metadata).toEqual({ source: 'test' })
      expect(event.sessionId).toBeTruthy()
      expect(event.correlationId).toBe('corr-1')
      expect(event.createdAt).toBeTruthy()
      expect(event.syncStatus).toBe('local_only')
    })

    it('main action is not blocked by event emission failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      destroyDb()

      const event = await bus.emitLearningEvent(makeInput())

      expect(event).toBeDefined()
      expect(event.eventId).toBeTruthy()

      consoleSpy.mockRestore()
    })
  })

  describe('event is saved in repository', () => {
    it('saved event can be retrieved from repository', async () => {
      const input = makeInput()
      const event = await bus.emitLearningEvent(input)

      const { learningEventRepository } = await import('../learningEventRepository')
      const found = await learningEventRepository.findById(event.eventId)
      expect(found).toBeDefined()
      expect(found!.eventId).toBe(event.eventId)
      expect(found!.eventType).toBe('app_opened')
      expect(found!.syncStatus).toBe('local_only')
    })

    it('saves event with entity info', async () => {
      const input = makeInput({
        eventType: 'mistake_saved',
        source: 'practice',
        entityType: 'mistake',
        entityId: 'mistake-1',
        payload: {
          eventType: 'mistake_saved',
          mistakeId: 'mistake-1',
          mistake: 'subject-verb agreement',
          skill: 'grammar',
          sessionMistakeCount: 1,
        },
      })
      const event = await bus.emitLearningEvent(input)

      expect(event.entityType).toBe('mistake')
      expect(event.entityId).toBe('mistake-1')
      expect(event.syncStatus).toBe('local_only')
    })
  })
})
