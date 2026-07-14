import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { evaluateCooldown, updateCooldown, DEFAULT_COOLDOWN_CONFIG } from '../domain/policies/cooldown-policy'
import type { CooldownEntry } from '../domain/policies/cooldown-policy'

describe('evaluateCooldown', () => {
  it('returns not on cooldown when no entries exist', () => {
    const result = evaluateCooldown('vocabulary_review_due', [])
    expect(result.isOnCooldown).toBe(false)
    expect(result.remainingMs).toBe(0)
  })

  it('returns on cooldown when global cooldown is active', () => {
    const state: CooldownEntry[] = [
      { triggerType: '__global__', lastFiredAt: new Date(Date.now() - 10_000).toISOString() },
    ]
    const result = evaluateCooldown('vocabulary_review_due', state, { globalCooldownMs: 60_000, perTriggerCooldownMs: {} })
    expect(result.isOnCooldown).toBe(true)
    expect(result.remainingMs).toBeGreaterThan(0)
  })

  it('returns not on cooldown when global cooldown has expired', () => {
    const state: CooldownEntry[] = [
      { triggerType: '__global__', lastFiredAt: new Date(Date.now() - 120_000).toISOString() },
    ]
    const result = evaluateCooldown('vocabulary_review_due', state, { globalCooldownMs: 60_000, perTriggerCooldownMs: {} })
    expect(result.isOnCooldown).toBe(false)
    expect(result.remainingMs).toBe(0)
  })

  it('uses per-trigger cooldown when configured', () => {
    const state: CooldownEntry[] = [
      { triggerType: 'long_inactivity', lastFiredAt: new Date(Date.now() - 60_000).toISOString() },
    ]
    const result = evaluateCooldown('long_inactivity', state, { globalCooldownMs: 60_000, perTriggerCooldownMs: { long_inactivity: 86_400_000 } })
    expect(result.isOnCooldown).toBe(true)
    expect(result.remainingMs).toBeGreaterThan(60_000)
  })

  it('falls back to global cooldown for trigger without specific config', () => {
    const state: CooldownEntry[] = [
      { triggerType: 'unknown_trigger', lastFiredAt: new Date(Date.now() - 10_000).toISOString() },
    ]
    const result = evaluateCooldown('unknown_trigger', state, { globalCooldownMs: 60_000, perTriggerCooldownMs: {} })
    expect(result.isOnCooldown).toBe(true)
  })

  it('returns not on cooldown when per-trigger entry does not exist', () => {
    const state: CooldownEntry[] = [
      { triggerType: 'exam_approaching', lastFiredAt: new Date(Date.now() - 10_000).toISOString() },
    ]
    const result = evaluateCooldown('vocabulary_review_due', state)
    expect(result.isOnCooldown).toBe(false)
  })
})

describe('updateCooldown', () => {
  it('adds a new entry for unknown trigger type', () => {
    const result = updateCooldown('vocabulary_review_due', [])
    expect(result).toHaveLength(1)
    expect(result[0].triggerType).toBe('vocabulary_review_due')
    expect(result[0].lastFiredAt).toBeTruthy()
  })

  it('replaces existing entry for the same trigger type', () => {
    const state: CooldownEntry[] = [
      { triggerType: 'vocabulary_review_due', lastFiredAt: '2020-01-01T00:00:00.000Z' },
    ]
    const result = updateCooldown('vocabulary_review_due', state)
    expect(result).toHaveLength(1)
    expect(result[0].triggerType).toBe('vocabulary_review_due')
    expect(result[0].lastFiredAt).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('preserves entries for other trigger types', () => {
    const state: CooldownEntry[] = [
      { triggerType: 'exam_approaching', lastFiredAt: '2020-01-01T00:00:00.000Z' },
    ]
    const result = updateCooldown('vocabulary_review_due', state)
    expect(result).toHaveLength(2)
    expect(result.find(e => e.triggerType === 'exam_approaching')).toBeDefined()
    expect(result.find(e => e.triggerType === 'vocabulary_review_due')).toBeDefined()
  })
})
