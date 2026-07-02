import { describe, it, expect, beforeEach } from 'vitest'
import { MessageStorage } from '../services/messageStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('MessageStorage', () => {
  it('starts with empty messages', () => {
    expect(MessageStorage.getMessages()).toEqual([])
  })

  it('adds a message and returns it with id and createdAt', () => {
    const msg = MessageStorage.addMessage({ role: 'user', content: 'Hello' })
    expect(msg.id).toBeTruthy()
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Hello')
    expect(msg.createdAt).toBeTruthy()
  })

  it('persists messages in localStorage', () => {
    MessageStorage.addMessage({ role: 'assistant', content: 'Hi there' })
    const messages = MessageStorage.getMessages()
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe('Hi there')
  })

  it('clearMessages removes all messages', () => {
    MessageStorage.addMessage({ role: 'user', content: 'Test' })
    MessageStorage.clearMessages()
    expect(MessageStorage.getMessages()).toEqual([])
  })

  it('setMessages replaces stored messages', () => {
    MessageStorage.addMessage({ role: 'user', content: 'Original' })
    MessageStorage.setMessages([
      { id: '1', role: 'assistant', content: 'Replaced', createdAt: new Date().toISOString() },
    ])
    const messages = MessageStorage.getMessages()
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe('Replaced')
  })

  it('addMessagesBulk adds multiple messages', () => {
    const added = MessageStorage.addMessagesBulk([
      { role: 'user', content: 'A' },
      { role: 'assistant', content: 'B' },
    ])
    expect(added).toHaveLength(2)
    expect(MessageStorage.getMessages()).toHaveLength(2)
  })

  it('records interaction time', () => {
    expect(MessageStorage.getLastInteractionTime()).toBeUndefined()
    MessageStorage.recordInteraction()
    expect(MessageStorage.getLastInteractionTime()).toBeTruthy()
  })

  it('recordOpen sets lastOpenedAt', () => {
    MessageStorage.recordOpen()
    const snapshot = MessageStorage.getSnapshot()
    expect(snapshot?.meta.lastOpenedAt).toBeTruthy()
  })

  it('clearAll removes all stored data', () => {
    MessageStorage.addMessage({ role: 'user', content: 'Test' })
    MessageStorage.clearAll()
    expect(MessageStorage.getMessages()).toEqual([])
  })

  it('caps messages at MAX_MESSAGES', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      role: 'user' as const,
      content: `Message ${i}`,
    }))
    const added = MessageStorage.addMessagesBulk(many)
    expect(added).toHaveLength(100)
    expect(MessageStorage.getMessages().length).toBeLessThanOrEqual(60)
  })
})
