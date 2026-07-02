import { describe, it, expect } from 'vitest'
import {
  ProgressiveDifficultyStrategy,
  ConservativeDifficultyStrategy,
  AggressiveDifficultyStrategy,
  createDefaultDifficultyAdjuster,
} from '../difficulty'

describe('ProgressiveDifficultyStrategy', () => {
  const strategy = new ProgressiveDifficultyStrategy()

  it('keeps current difficulty with insufficient attempts', () => {
    const result = strategy.adjust({
      currentDifficulty: 'beginner',
      recentAccuracy: 80,
      recentAttempts: 2,
      streak: 1,
      totalAttempts: 2,
    })
    expect(result.suggestedDifficulty).toBe('beginner')
    expect(result.confidence).toBeLessThanOrEqual(20)
  })

  it('advances to next difficulty on high accuracy streak', () => {
    const result = strategy.adjust({
      currentDifficulty: 'beginner',
      recentAccuracy: 95,
      recentAttempts: 5,
      streak: 4,
      totalAttempts: 10,
    })
    expect(result.suggestedDifficulty).toBe('intermediate')
    expect(result.confidence).toBeGreaterThanOrEqual(60)
  })

  it('reduces difficulty on low accuracy', () => {
    const result = strategy.adjust({
      currentDifficulty: 'intermediate',
      recentAccuracy: 30,
      recentAttempts: 5,
      streak: 0,
      totalAttempts: 10,
    })
    expect(result.suggestedDifficulty).toBe('beginner')
  })

  it('stays at maximum difficulty with good performance', () => {
    const result = strategy.adjust({
      currentDifficulty: 'advanced',
      recentAccuracy: 95,
      recentAttempts: 5,
      streak: 5,
      totalAttempts: 20,
    })
    expect(result.suggestedDifficulty).toBe('advanced')
    expect(result.confidence).toBeGreaterThanOrEqual(90)
  })

  it('maintains current difficulty with adequate performance', () => {
    const result = strategy.adjust({
      currentDifficulty: 'intermediate',
      recentAccuracy: 75,
      recentAttempts: 5,
      streak: 2,
      totalAttempts: 10,
    })
    expect(result.suggestedDifficulty).toBe('intermediate')
  })
})

describe('ConservativeDifficultyStrategy', () => {
  const strategy = new ConservativeDifficultyStrategy()

  it('requires more attempts before changing', () => {
    const result = strategy.adjust({
      currentDifficulty: 'beginner',
      recentAccuracy: 95,
      recentAttempts: 3,
      streak: 3,
      totalAttempts: 3,
    })
    expect(result.suggestedDifficulty).toBe('beginner')
    expect(result.confidence).toBeLessThanOrEqual(20)
  })

  it('advances only with sustained high performance', () => {
    const result = strategy.adjust({
      currentDifficulty: 'beginner',
      recentAccuracy: 98,
      recentAttempts: 6,
      streak: 6,
      totalAttempts: 12,
    })
    expect(result.suggestedDifficulty).toBe('intermediate')
  })
})

describe('AggressiveDifficultyStrategy', () => {
  const strategy = new AggressiveDifficultyStrategy()

  it('advances quickly with good performance', () => {
    const result = strategy.adjust({
      currentDifficulty: 'beginner',
      recentAccuracy: 85,
      recentAttempts: 3,
      streak: 2,
      totalAttempts: 3,
    })
    expect(result.suggestedDifficulty).toBe('intermediate')
  })

  it('reduces quickly on poor performance', () => {
    const result = strategy.adjust({
      currentDifficulty: 'intermediate',
      recentAccuracy: 50,
      recentAttempts: 3,
      streak: 0,
      totalAttempts: 5,
    })
    expect(result.suggestedDifficulty).toBe('beginner')
  })
})

describe('DifficultyAdjuster', () => {
  const adjuster = createDefaultDifficultyAdjuster()

  it('uses progressive strategy by default', () => {
    const result = adjuster.adjust({
      currentDifficulty: 'beginner',
      recentAccuracy: 95,
      recentAttempts: 5,
      streak: 4,
      totalAttempts: 10,
    })
    expect(result.suggestedDifficulty).toBe('intermediate')
  })

  it('selects named strategy', () => {
    const result = adjuster.adjust({
      currentDifficulty: 'beginner',
      recentAccuracy: 85,
      recentAttempts: 3,
      streak: 2,
      totalAttempts: 3,
    }, 'aggressive')
    expect(result.suggestedDifficulty).toBe('intermediate')
  })

  it('distributes questions across difficulties', () => {
    const difficulties = adjuster.getQuestionDifficulty(10)
    expect(difficulties.filter(d => d === 'beginner')).toHaveLength(3)
    expect(difficulties.filter(d => d === 'intermediate')).toHaveLength(4)
    expect(difficulties.filter(d => d === 'advanced')).toHaveLength(3)
  })

  it('estimates difficulty from accuracy', () => {
    expect(adjuster.estimateDifficultyFromAccuracy(90)).toBe('advanced')
    expect(adjuster.estimateDifficultyFromAccuracy(70)).toBe('intermediate')
    expect(adjuster.estimateDifficultyFromAccuracy(40)).toBe('beginner')
  })
})
