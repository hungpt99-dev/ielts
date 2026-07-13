import { describe, it, expect } from 'vitest'
import { determineDifficulty } from '../difficulty-policy'

describe('difficulty-policy — determineDifficulty', () => {
  it('returns medium by default with no input', () => {
    const result = determineDifficulty({ consecutiveCorrect: 0, consecutiveMistakes: 0, totalAttempts: 0, timeSpentMs: 0, hintsUsed: 0 })
    expect(result.level).toBe('medium')
    expect(result.reasons).toEqual([])
  })

  it('returns easy after 2+ consecutive mistakes', () => {
    const result = determineDifficulty({ consecutiveCorrect: 0, consecutiveMistakes: 2, totalAttempts: 5, timeSpentMs: 0, hintsUsed: 0 })
    expect(result.level).toBe('easy')
    expect(result.reasons).toContain('2 consecutive mistakes — easier difficulty')
  })

  it('returns medium after 3 consecutive correct', () => {
    const result = determineDifficulty({ consecutiveCorrect: 3, consecutiveMistakes: 0, totalAttempts: 5, timeSpentMs: 0, hintsUsed: 0 })
    expect(result.level).toBe('medium')
    expect(result.reasons).toContain('3 consecutive correct answers')
  })

  it('returns hard after 5 consecutive correct', () => {
    const result = determineDifficulty({ consecutiveCorrect: 5, consecutiveMistakes: 0, totalAttempts: 5, timeSpentMs: 0, hintsUsed: 0 })
    expect(result.level).toBe('hard')
    expect(result.reasons).toContain('5 consecutive correct answers')
  })

  it('returns easy for recentAccuracy < 40', () => {
    const result = determineDifficulty({ consecutiveCorrect: 0, consecutiveMistakes: 0, totalAttempts: 3, recentAccuracy: 30, timeSpentMs: 0, hintsUsed: 0 })
    expect(result.level).toBe('easy')
  })

  it('returns hard for recentAccuracy > 80', () => {
    const result = determineDifficulty({ consecutiveCorrect: 0, consecutiveMistakes: 0, totalAttempts: 3, recentAccuracy: 85, timeSpentMs: 0, hintsUsed: 0 })
    expect(result.level).toBe('hard')
  })

  it('returns medium when exam is in final week', () => {
    const result = determineDifficulty({ consecutiveCorrect: 5, consecutiveMistakes: 0, totalAttempts: 10, timeSpentMs: 0, hintsUsed: 0, examDaysRemaining: 3 })
    expect(result.level).toBe('medium')
  })

  it('includes band gap reason when gap >= 2', () => {
    const result = determineDifficulty({ consecutiveCorrect: 0, consecutiveMistakes: 0, totalAttempts: 0, timeSpentMs: 0, hintsUsed: 0, currentBand: 5, targetBand: 7.5 })
    expect(result.reasons).toContain('Large band gap — easier exercises to build foundation')
  })

  it('calculates confidence based on total attempts', () => {
    const lowAttempts = determineDifficulty({ consecutiveCorrect: 0, consecutiveMistakes: 0, totalAttempts: 2, timeSpentMs: 0, hintsUsed: 0 })
    expect(lowAttempts.confidence).toBe(0.5)

    const highAttempts = determineDifficulty({ consecutiveCorrect: 0, consecutiveMistakes: 0, totalAttempts: 15, timeSpentMs: 0, hintsUsed: 0 })
    expect(highAttempts.confidence).toBe(0.7)
  })
})
