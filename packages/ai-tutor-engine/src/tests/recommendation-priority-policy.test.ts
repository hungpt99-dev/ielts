import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateInterventionScore, selectBestInterventions, DEFAULT_SCORING_WEIGHTS } from '../domain/policies/recommendation-priority-policy'
import type { ProactiveInterventionCandidate, ProactiveMessage } from '../domain/entities/proactive-message'

function makeCandidate(overrides: Partial<ProactiveInterventionCandidate> = {}): ProactiveInterventionCandidate {
  return {
    triggerType: 'due_review',
    category: 'vocabulary-review',
    title: 'Review due',
    message: 'You have vocabulary due.',
    reason: 'due_review',
    deduplicationKey: 'vocab-review-001',
    urgency: 0.7,
    learningValue: 0.6,
    relevance: 0.8,
    action: { type: 'navigate', label: 'Review', payload: { page: '/vocabulary-review' } },
    ...overrides,
  }
}

function makeSentMessage(overrides: Partial<ProactiveMessage> = {}): ProactiveMessage {
  return {
    id: 'sent-1',
    triggerType: 'due_review',
    category: 'vocabulary-review',
    priority: 'medium',
    title: 'Review due',
    message: 'Review your vocabulary.',
    reason: 'due_review',
    score: 0.7,
    deduplicationKey: 'sent-key',
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('calculateInterventionScore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-13T10:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a score between 0 and 1', () => {
    const score = calculateInterventionScore(makeCandidate(), [])
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('applies repetition penalty for recent messages', () => {
    const candidate = makeCandidate({ urgency: 1, learningValue: 1, relevance: 1 })
    const fewMsgs = [makeSentMessage()]
    const manyMsgs = Array.from({ length: 5 }, (_, i) => makeSentMessage({ id: `sent-${i}` }))
    const scoreFew = calculateInterventionScore(candidate, fewMsgs)
    const scoreMany = calculateInterventionScore(candidate, manyMsgs)
    expect(scoreMany).toBeLessThan(scoreFew)
  })

  it('applies recent-message penalty when same trigger type was just sent', () => {
    const candidate = makeCandidate({ triggerType: 'missed_task', urgency: 1, learningValue: 1, relevance: 1 })
    const different = [makeSentMessage({ triggerType: 'due_review' })]
    const same = [makeSentMessage({ triggerType: 'missed_task' })]
    const scoreDifferent = calculateInterventionScore(candidate, different)
    const scoreSame = calculateInterventionScore(candidate, same)
    expect(scoreSame).toBeLessThan(scoreDifferent)
  })

  it('returns 0 when penalties exceed base score', () => {
    const candidate = makeCandidate({ urgency: 0, learningValue: 0, relevance: 0 })
    const manyMsgs = Array.from({ length: 20 }, (_, i) => makeSentMessage({ id: `sent-${i}` }))
    const score = calculateInterventionScore(candidate, manyMsgs)
    expect(score).toBe(0)
  })
})

describe('selectBestInterventions', () => {
  it('returns empty array when no candidates meet threshold', () => {
    const candidates = [makeCandidate({ urgency: 0, learningValue: 0, relevance: 0 })]
    const result = selectBestInterventions(candidates, [], 2, 0.5)
    expect(result).toHaveLength(0)
  })

  it('selects top N candidates by score', () => {
    const candidates = [
      makeCandidate({ triggerType: 'high-priority', urgency: 1, learningValue: 1, relevance: 1 }),
      makeCandidate({ triggerType: 'medium-priority', urgency: 0.5, learningValue: 0.5, relevance: 0.5 }),
      makeCandidate({ triggerType: 'low-priority', urgency: 0.2, learningValue: 0.2, relevance: 0.2 }),
    ]
    const result = selectBestInterventions(candidates, [], 2)
    expect(result).toHaveLength(2)
    expect(result[0].triggerType).toBe('high-priority')
  })
})
