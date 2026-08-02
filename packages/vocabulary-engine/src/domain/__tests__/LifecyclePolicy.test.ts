import { describe, it, expect } from 'vitest'
import { determineNextLifecycle } from '../policies'
import { LIFECYCLE_PHASE, type LifecyclePhase } from '../constants'

const PHASES: readonly LifecyclePhase[] = [
  LIFECYCLE_PHASE.DISCOVERED,
  LIFECYCLE_PHASE.LEARNING,
  LIFECYCLE_PHASE.PRACTICING,
  LIFECYCLE_PHASE.REVIEWING,
  LIFECYCLE_PHASE.USING,
  LIFECYCLE_PHASE.MASTERED,
]

describe('LifecyclePolicy — forward transitions', () => {
  it('DISCOVERED → LEARNING on FIRST_STUDY', () => {
    const result = determineNextLifecycle('DISCOVERED', 'FIRST_STUDY')
    expect(result).toEqual({
      status: 'transitioned',
      from: 'DISCOVERED',
      to: 'LEARNING',
      reason: 'FIRST_STUDY: DISCOVERED → LEARNING',
    })
  })

  it('LEARNING → PRACTICING on FIRST_PRACTICE', () => {
    const result = determineNextLifecycle('LEARNING', 'FIRST_PRACTICE')
    expect(result.status).toBe('transitioned')
    expect(result).toMatchObject({ from: 'LEARNING', to: 'PRACTICING' })
  })

  it('PRACTICING → REVIEWING on REVIEW_SCHEDULED', () => {
    const result = determineNextLifecycle('PRACTICING', 'REVIEW_SCHEDULED')
    expect(result).toMatchObject({ status: 'transitioned', from: 'PRACTICING', to: 'REVIEWING' })
  })

  it('REVIEWING → USING on CORRECT_USAGE', () => {
    const result = determineNextLifecycle('REVIEWING', 'CORRECT_USAGE')
    expect(result).toMatchObject({ status: 'transitioned', from: 'REVIEWING', to: 'USING' })
  })
})

describe('LifecyclePolicy — USING → MASTERED criteria', () => {
  it('transitions to MASTERED when masteryScore ≥ 90 and 3+ correct productions', () => {
    const result = determineNextLifecycle('USING', 'CORRECT_USAGE', {
      masteryScore: 90,
      correctProductions: 3,
    })
    expect(result).toMatchObject({ status: 'transitioned', from: 'USING', to: 'MASTERED' })
  })

  it('transitions to MASTERED with higher scores', () => {
    const result = determineNextLifecycle('USING', 'CORRECT_USAGE', {
      masteryScore: 95,
      correctProductions: 5,
    })
    expect(result).toMatchObject({ status: 'transitioned', to: 'MASTERED' })
  })

  it('no-op when masteryScore below threshold', () => {
    const result = determineNextLifecycle('USING', 'CORRECT_USAGE', {
      masteryScore: 89,
      correctProductions: 3,
    })
    expect(result.status).toBe('no-op')
    expect(result).toMatchObject({ from: 'USING', to: 'USING' })
  })

  it('no-op when correct productions below threshold', () => {
    const result = determineNextLifecycle('USING', 'CORRECT_USAGE', {
      masteryScore: 90,
      correctProductions: 2,
    })
    expect(result.status).toBe('no-op')
  })

  it('no-op when context missing', () => {
    const result = determineNextLifecycle('USING', 'CORRECT_USAGE')
    expect(result.status).toBe('no-op')
  })
})

describe('LifecyclePolicy — regression path', () => {
  const regressionCases: Array<{ from: LifecyclePhase; to: LifecyclePhase }> = [
    { from: 'DISCOVERED', to: 'LEARNING' },
    { from: 'PRACTICING', to: 'LEARNING' },
    { from: 'REVIEWING', to: 'LEARNING' },
    { from: 'USING', to: 'LEARNING' },
    { from: 'MASTERED', to: 'LEARNING' },
  ]

  for (const { from, to } of regressionCases) {
    it(`${from} → ${to} with 3 consecutive again ratings`, () => {
      const result = determineNextLifecycle(from, 'REVIEW_RATING', {
        consecutiveAgainRatings: 3,
      })
      expect(result).toMatchObject({ status: 'transitioned', from, to })
    })
  }

  it('does not regress with fewer than 3 again ratings', () => {
    for (const phase of PHASES) {
      const result = determineNextLifecycle(phase, 'REVIEW_RATING', {
        consecutiveAgainRatings: 2,
      })
      expect(result.status).toBe('no-op')
      expect(result).toMatchObject({ from: phase, to: phase })
    }
  })

  it('no-op from LEARNING with 3 again ratings (already at target)', () => {
    const result = determineNextLifecycle('LEARNING', 'REVIEW_RATING', {
      consecutiveAgainRatings: 3,
    })
    expect(result.status).toBe('no-op')
    expect(result).toMatchObject({ from: 'LEARNING', to: 'LEARNING' })
  })
})

describe('LifecyclePolicy — inactivity', () => {
  it('MASTERED → REVIEWING after 30+ days (maintenance)', () => {
    const result = determineNextLifecycle('MASTERED', 'INACTIVITY', {
      daysSinceLastInteraction: 30,
    })
    expect(result).toMatchObject({ status: 'transitioned', from: 'MASTERED', to: 'REVIEWING' })
  })

  it('any non-DISCOVERED phase → DISCOVERED after 90+ days (forgotten)', () => {
    for (const phase of PHASES.filter((p) => p !== 'DISCOVERED')) {
      const result = determineNextLifecycle(phase, 'INACTIVITY', {
        daysSinceLastInteraction: 90,
      })
      expect(result).toMatchObject({ status: 'transitioned', from: phase, to: 'DISCOVERED' })
    }
  })

  it('forgotten takes precedence over maintenance for MASTERED', () => {
    const result = determineNextLifecycle('MASTERED', 'INACTIVITY', {
      daysSinceLastInteraction: 91,
    })
    expect(result).toMatchObject({ to: 'DISCOVERED' })
  })

  it('no-op below thresholds', () => {
    const belowMaintenance = determineNextLifecycle('MASTERED', 'INACTIVITY', {
      daysSinceLastInteraction: 29,
    })
    expect(belowMaintenance.status).toBe('no-op')

    const belowForgotten = determineNextLifecycle('REVIEWING', 'INACTIVITY', {
      daysSinceLastInteraction: 89,
    })
    expect(belowForgotten.status).toBe('no-op')
  })

  it('no-op when context missing', () => {
    const result = determineNextLifecycle('MASTERED', 'INACTIVITY')
    expect(result.status).toBe('no-op')
  })
})

describe('LifecyclePolicy — edge cases', () => {
  it('no-op when already at target state', () => {
    expect(determineNextLifecycle('LEARNING', 'FIRST_STUDY').status).toBe('no-op')
    expect(determineNextLifecycle('PRACTICING', 'FIRST_PRACTICE').status).toBe('no-op')
    expect(determineNextLifecycle('REVIEWING', 'REVIEW_SCHEDULED').status).toBe('no-op')
  })

  it('returns invalid for transition not applicable from current phase', () => {
    const result = determineNextLifecycle('DISCOVERED', 'FIRST_PRACTICE')
    expect(result.status).toBe('invalid')
    expect(result).toMatchObject({ from: 'DISCOVERED', trigger: 'FIRST_PRACTICE' })
  })

  it('returns invalid for forward triggers applied out of order', () => {
    expect(determineNextLifecycle('REVIEWING', 'FIRST_STUDY').status).toBe('invalid')
    expect(determineNextLifecycle('USING', 'FIRST_PRACTICE').status).toBe('invalid')
    expect(determineNextLifecycle('MASTERED', 'REVIEW_SCHEDULED').status).toBe('invalid')
  })

  it('returns invalid for CORRECT_USAGE from non-applicable phases', () => {
    expect(determineNextLifecycle('DISCOVERED', 'CORRECT_USAGE').status).toBe('invalid')
    expect(determineNextLifecycle('LEARNING', 'CORRECT_USAGE').status).toBe('invalid')
    expect(determineNextLifecycle('MASTERED', 'CORRECT_USAGE').status).toBe('invalid')
  })

  it('is a pure function — same inputs produce same outputs', () => {
    const a = determineNextLifecycle('REVIEWING', 'REVIEW_RATING', { consecutiveAgainRatings: 3 })
    const b = determineNextLifecycle('REVIEWING', 'REVIEW_RATING', { consecutiveAgainRatings: 3 })
    expect(a).toEqual(b)
  })
})
