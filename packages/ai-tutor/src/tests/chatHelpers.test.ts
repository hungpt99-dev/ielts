import { describe, it, expect } from 'vitest'
import {
  getTimeBasedGreeting,
  getWelcomeMessage,
  generateQuickResponse,
  formatMessageTime,
  DEFAULT_QUICK_ACTIONS,
  ACTION_LABELS,
} from '../utils/chatHelpers'

describe('getTimeBasedGreeting', () => {
  it('returns a greeting based on time of day', () => {
    const greeting = getTimeBasedGreeting()
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting)
  })
})

describe('getWelcomeMessage', () => {
  it('includes the greeting in the welcome message', () => {
    const msg = getWelcomeMessage()
    expect(msg).toContain('👋')
    expect(msg).toContain('AI Tutor Assistant')
    expect(msg).toContain('IELTS')
  })
})

describe('generateQuickResponse', () => {
  it('returns a response for known quick actions', () => {
    const response = generateQuickResponse('teach-me')
    expect(response).toContain('teach')
    expect(response.length).toBeGreaterThan(10)
  })

  it('returns a default response for unknown actions', () => {
    const response = generateQuickResponse('unknown-action')
    expect(response).toContain('IELTS')
  })

  it('provides distinct responses for different actions', () => {
    const quizResponse = generateQuickResponse('quiz-me')
    const teachResponse = generateQuickResponse('teach-me')
    expect(quizResponse).not.toBe(teachResponse)
  })
})

describe('formatMessageTime', () => {
  it('returns "Just now" for very recent timestamps', () => {
    const recent = new Date().toISOString()
    expect(formatMessageTime(recent)).toBe('Just now')
  })

  it('returns minute-based format for recent messages', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const result = formatMessageTime(fiveMinAgo)
    expect(result).toMatch(/5m ago/)
  })

  it('returns time for today messages', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const result = formatMessageTime(threeHoursAgo)
    expect(result).toMatch(/AM|PM/)
  })

  it('returns date and time for older messages', () => {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatMessageTime(lastWeek)
    expect(result).toMatch(/AM|PM/)
    expect(result).toMatch(/[A-Z][a-z]{2}/)
  })
})

describe('DEFAULT_QUICK_ACTIONS', () => {
  it('contains all expected quick actions', () => {
    const types = DEFAULT_QUICK_ACTIONS.map(a => a.type)
    expect(types).toContain('teach-me')
    expect(types).toContain('quiz-me')
    expect(types).toContain('practice-with-me')
    expect(types).toContain('make-exercise')
    expect(types).toContain('correct-english')
    expect(types).toContain('remind-later')
  })

  it('every action has a label and icon', () => {
    for (const action of DEFAULT_QUICK_ACTIONS) {
      expect(action.label).toBeTruthy()
      expect(action.icon).toBeTruthy()
    }
  })
})

describe('ACTION_LABELS', () => {
  it('provides labels for all quick action types', () => {
    expect(ACTION_LABELS['teach-me']).toBe('Teach me this')
    expect(ACTION_LABELS['quiz-me']).toBe('Quiz me')
  })
})
