import { describe, it, expect } from 'vitest'
import { isDuplicate, filterDuplicates } from '../domain/policies/duplicate-message-policy'
import type { ProactiveMessage } from '../domain/entities/proactive-message'

function makeMessage(overrides: Partial<ProactiveMessage> = {}): ProactiveMessage {
  return {
    id: 'msg-1',
    triggerType: 'due_review',
    category: 'vocabulary-review',
    priority: 'medium',
    title: 'Review due',
    message: 'You have vocabulary due for review.',
    reason: 'due_review',
    score: 0.7,
    deduplicationKey: 'vocab-review-due-001',
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('isDuplicate', () => {
  it('returns false when no existing messages match', () => {
    const candidate = makeMessage({ deduplicationKey: 'new-key' })
    const existing = [makeMessage({ deduplicationKey: 'other-key' })]
    expect(isDuplicate(candidate, existing)).toBe(false)
  })

  it('returns true when matching deduplication key exists within expiry', () => {
    const candidate = makeMessage({ deduplicationKey: 'same-key' })
    const existing = [makeMessage({ deduplicationKey: 'same-key', createdAt: new Date(Date.now() - 3_600_000).toISOString() })]
    expect(isDuplicate(candidate, existing)).toBe(true)
  })

  it('returns false when matching deduplication key exists but is expired', () => {
    const candidate = makeMessage({ deduplicationKey: 'old-key' })
    const existing = [makeMessage({ deduplicationKey: 'old-key', createdAt: new Date(Date.now() - 172_800_000).toISOString() })]
    expect(isDuplicate(candidate, existing, { keyExpiryMs: 86_400_000 })).toBe(false)
  })
})

describe('filterDuplicates', () => {
  it('returns all candidates when none are duplicates', () => {
    const candidates = [
      makeMessage({ deduplicationKey: 'key-1' }),
      makeMessage({ deduplicationKey: 'key-2' }),
    ]
    const existing = [makeMessage({ deduplicationKey: 'key-3' })]
    expect(filterDuplicates(candidates, existing)).toHaveLength(2)
  })

  it('filters out duplicate candidates', () => {
    const candidates = [
      makeMessage({ deduplicationKey: 'dup-key' }),
      makeMessage({ deduplicationKey: 'unique-key' }),
    ]
    const existing = [makeMessage({ deduplicationKey: 'dup-key' })]
    const filtered = filterDuplicates(candidates, existing)
    expect(filtered).toHaveLength(1)
    expect(filtered[0].deduplicationKey).toBe('unique-key')
  })
})
