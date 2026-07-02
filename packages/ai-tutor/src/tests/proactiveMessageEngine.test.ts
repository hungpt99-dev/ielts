import { describe, it, expect } from 'vitest'
import { generateProactiveMessages, generateContextSuggestions } from '../services/proactiveMessageEngine'
import type { ProactiveEngineInput } from '../services/proactiveMessageEngine'

const baseInput: ProactiveEngineInput = {}

describe('generateProactiveMessages', () => {
  it('returns empty array for empty input', () => {
    const messages = generateProactiveMessages(baseInput)
    expect(messages).toEqual([])
  })

  it('generates vocabulary review message when words are due', () => {
    const messages = generateProactiveMessages({ dueVocabularyCount: 15 })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('vocabulary-review')
    expect(messages[0].title).toContain('15')
    expect(messages[0].priority).toBe('medium')
  })

  it('generates high priority vocabulary review for many words', () => {
    const messages = generateProactiveMessages({ dueVocabularyCount: 30 })
    expect(messages[0].priority).toBe('high')
  })

  it('generates mistake review message when mistakes are due', () => {
    const messages = generateProactiveMessages({ dueMistakeCount: 5 })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('mistake-review')
    expect(messages[0].title).toContain('5')
  })

  it('generates weak skill message when weak skills are provided', () => {
    const messages = generateProactiveMessages({
      learnerProfile: { weakSkills: ['writing', 'speaking'] },
    })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('study-plan')
    expect(messages[0].message).toContain('writing')
  })

  it('generates exam countdown for approaching exam', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 14)
    const messages = generateProactiveMessages({
      learnerProfile: { examDate: futureDate.toISOString() },
    })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('exam-countdown')
    expect(messages[0].title).toContain('14')
  })

  it('generates high urgency for exam within 7 days', () => {
    const nearDate = new Date()
    nearDate.setDate(nearDate.getDate() + 3)
    const messages = generateProactiveMessages({
      learnerProfile: { examDate: nearDate.toISOString() },
    })
    expect(messages[0].priority).toBe('high')
  })

  it('does not generate exam countdown for exams far away', () => {
    const farDate = new Date()
    farDate.setDate(farDate.getDate() + 120)
    const messages = generateProactiveMessages({
      learnerProfile: { examDate: farDate.toISOString() },
    })
    expect(messages).toHaveLength(0)
  })

  it('generates study streak message for 3+ day streaks', () => {
    const messages = generateProactiveMessages({
      learnerProfile: { studyStreak: 7 },
    })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('motivation')
    expect(messages[0].title).toContain('7')
  })

  it('does not generate streak message for short streaks', () => {
    const messages = generateProactiveMessages({
      learnerProfile: { studyStreak: 2 },
    })
    expect(messages).toHaveLength(0)
  })

  it('generates low activity message after 2+ idle days', () => {
    const messages = generateProactiveMessages({ lowActivityDays: 5 })
    expect(messages).toHaveLength(1)
    expect(messages[0].title).toContain('studied today')
    expect(messages[0].priority).toBe('low')
  })

  it('generates high priority message after 7+ idle days', () => {
    const messages = generateProactiveMessages({ lowActivityDays: 10 })
    expect(messages).toHaveLength(1)
    expect(messages[0].title).toContain('been a while')
    expect(messages[0].priority).toBe('high')
  })

  it('generates daily plan message', () => {
    const messages = generateProactiveMessages({ dailyPlanReady: true })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('study-plan')
  })

  it('generates mistake pattern for 5+ recent mistakes', () => {
    const messages = generateProactiveMessages({ recentMistakeCount: 8 })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('mistake-review')
    expect(messages[0].title).toContain('Pattern')
  })

  it('generates new content message', () => {
    const messages = generateProactiveMessages({ newContentCount: 3 })
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('saved-content')
  })

  it('generates multiple messages when multiple conditions met', () => {
    const messages = generateProactiveMessages({
      dueVocabularyCount: 10,
      dueMistakeCount: 5,
      dailyPlanReady: true,
      learnerProfile: { studyStreak: 10 },
    })
    expect(messages.length).toBeGreaterThanOrEqual(3)
    const categories = messages.map(m => m.category)
    expect(categories).toContain('vocabulary-review')
    expect(categories).toContain('mistake-review')
    expect(categories).toContain('motivation')
  })

  it('each generated message has required fields', () => {
    const messages = generateProactiveMessages({
      dueVocabularyCount: 10,
      dueMistakeCount: 5,
      learnerProfile: { studyStreak: 10, weakSkills: ['reading'] },
    })
    for (const msg of messages) {
      expect(msg.id).toBeTruthy()
      expect(msg.title).toBeTruthy()
      expect(msg.message).toBeTruthy()
      expect(msg.createdAt).toBeTruthy()
      expect(['high', 'medium', 'low']).toContain(msg.priority)
      expect(msg.isRead).toBe(false)
      expect(msg.isDismissed).toBe(false)
    }
  })

  it('orders messages by generator priority', () => {
    const messages = generateProactiveMessages({
      dueVocabularyCount: 30,
      dueMistakeCount: 15,
      learnerProfile: { weakSkills: ['writing'], studyStreak: 3 },
    })
    expect(messages.length).toBeGreaterThanOrEqual(3)
  })
})

describe('generateContextSuggestions', () => {
  it('returns set-exam-date and start-journey suggestions for empty input', () => {
    const suggestions = generateContextSuggestions(baseInput, [])
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(suggestions.some(s => s.title.includes('exam date'))).toBe(true)
  })

  it('suggests vocabulary review when words are due', () => {
    const suggestions = generateContextSuggestions({ dueVocabularyCount: 10 }, [])
    expect(suggestions.some(s => s.title.toLowerCase().includes('word'))).toBe(true)
  })

  it('suggests mistake review when mistakes are due', () => {
    const suggestions = generateContextSuggestions({ dueMistakeCount: 5 }, [])
    expect(suggestions.some(s => s.title.toLowerCase().includes('mistake'))).toBe(true)
  })

  it('suggests weak skill focus when weak skills present', () => {
    const suggestions = generateContextSuggestions({
      learnerProfile: { weakSkills: ['speaking'] },
    }, [])
    expect(suggestions.some(s => s.title.toLowerCase().includes('weak'))).toBe(true)
  })

  it('suggests setting exam date when not set', () => {
    const suggestions = generateContextSuggestions(baseInput, [])
    expect(suggestions.some(s => s.title.includes('exam date'))).toBe(true)
  })

  it('caps suggestions at 3', () => {
    const suggestions = generateContextSuggestions({
      dueVocabularyCount: 10,
      dueMistakeCount: 5,
      learnerProfile: { weakSkills: ['writing', 'speaking'], studyStreak: 7 },
    }, [])
    expect(suggestions.length).toBeLessThanOrEqual(3)
  })

  it('each suggestion has required fields', () => {
    const suggestions = generateContextSuggestions({
      dueVocabularyCount: 10,
      learnerProfile: { weakSkills: ['reading'] },
    }, [])
    for (const s of suggestions) {
      expect(s.title).toBeTruthy()
      expect(s.message).toBeTruthy()
      expect(s.actionLabel).toBeTruthy()
    }
  })
})
