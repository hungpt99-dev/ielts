import { describe, it, expect, vi, afterEach } from 'vitest'
import { ProactiveEventBus } from '../services/proactiveEventBus'
import type { ProactiveMessage } from '../types'

const makeMsg = (id: string): ProactiveMessage => ({
  id,
  triggerType: 'due_review',
  category: 'vocabulary-review',
  title: 'Test',
  message: 'Test message',
  priority: 'medium',
  isRead: false,
  isDismissed: false,
  isSnoozed: false,
  createdAt: new Date().toISOString(),
})

describe('ProactiveEventBus', () => {
  afterEach(() => {
    ProactiveEventBus.clear()
  })

  it('emits new messages to subscribers', () => {
    const handler = vi.fn()
    ProactiveEventBus.onNewMessage(handler)

    const msg = makeMsg('1')
    ProactiveEventBus.emitNewMessage(msg)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(msg)
  })

  it('allows multiple subscribers for new messages', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    ProactiveEventBus.onNewMessage(handler1)
    ProactiveEventBus.onNewMessage(handler2)

    ProactiveEventBus.emitNewMessage(makeMsg('1'))

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes correctly', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)
    unsub()

    ProactiveEventBus.emitNewMessage(makeMsg('1'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('emits messagesCleared', () => {
    const handler = vi.fn()
    ProactiveEventBus.onMessagesCleared(handler)

    ProactiveEventBus.emitMessagesCleared()

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not emit to unsubscribed handlers', () => {
    const handler = vi.fn()
    ProactiveEventBus.onMessagesCleared(handler)
    ProactiveEventBus.clear()

    ProactiveEventBus.emitMessagesCleared()

    expect(handler).not.toHaveBeenCalled()
  })
})
