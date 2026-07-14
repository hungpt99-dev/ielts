import { describe, it, expect } from 'vitest'
import { isInQuietHours, getQuietHoursRemainingMs } from '../domain/policies/quiet-hours-policy'

const QUIET_HOURS = { start: '22:00', end: '08:00' }

describe('isInQuietHours', () => {
  it('returns true during quiet hours (overnight)', () => {
    const during = new Date('2026-07-13T02:00:00')
    expect(isInQuietHours(QUIET_HOURS, during)).toBe(true)
  })

  it('returns false outside quiet hours', () => {
    const outside = new Date('2026-07-13T14:00:00')
    expect(isInQuietHours(QUIET_HOURS, outside)).toBe(false)
  })

  it('returns true at start boundary', () => {
    const atStart = new Date('2026-07-13T22:00:00')
    expect(isInQuietHours(QUIET_HOURS, atStart)).toBe(true)
  })

  it('returns false at end boundary', () => {
    const atEnd = new Date('2026-07-14T08:00:00')
    expect(isInQuietHours(QUIET_HOURS, atEnd)).toBe(false)
  })

  it('handles same-day quiet hours (no overnight wrap)', () => {
    const config = { start: '12:00', end: '13:00' }
    expect(isInQuietHours(config, new Date('2026-07-13T12:30:00'))).toBe(true)
    expect(isInQuietHours(config, new Date('2026-07-13T11:00:00'))).toBe(false)
    expect(isInQuietHours(config, new Date('2026-07-13T13:00:00'))).toBe(false)
  })
})

describe('getQuietHoursRemainingMs', () => {
  it('returns 0 when not in quiet hours', () => {
    const outside = new Date('2026-07-13T14:00:00')
    expect(getQuietHoursRemainingMs(QUIET_HOURS, outside)).toBe(0)
  })

  it('returns positive remaining time during quiet hours', () => {
    const during = new Date('2026-07-13T02:00:00')
    const remaining = getQuietHoursRemainingMs(QUIET_HOURS, during)
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(6 * 3_600_000)
  })
})
