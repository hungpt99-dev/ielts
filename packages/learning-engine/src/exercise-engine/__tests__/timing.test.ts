import { describe, it, expect } from 'vitest'
import { calculateTiming } from '../timing'
import { createSeedFullReadingTest, createSeedFullListeningTest, createSeedFullWritingTest, createSeedFullSpeakingSimulation, createSeedGrammarExercise, createSeedVocabularyExercise } from '../infrastructure/seed-data'

describe('Timing Engine', () => {
  it('calculates timing for full reading test', () => {
    const exercise = createSeedFullReadingTest()
    const timing = calculateTiming(exercise)
    expect(timing.officialDurationSeconds).toBe(3600)
    expect(timing.estimatedDurationSeconds).toBe(3600)
  })

  it('calculates timing for full listening test', () => {
    const exercise = createSeedFullListeningTest()
    const timing = calculateTiming(exercise)
    expect(timing.officialDurationSeconds).toBe(1800)
    expect(timing.breakdown).toBeDefined()
    expect(timing.breakdown!.length).toBeGreaterThan(0)
  })

  it('calculates timing for full writing test with task breakdown', () => {
    const exercise = createSeedFullWritingTest()
    const timing = calculateTiming(exercise)
    expect(timing.officialDurationSeconds).toBe(3600)
    expect(timing.breakdown).toBeDefined()
    expect(timing.breakdown!.length).toBe(2)
    expect(timing.breakdown![0].label).toBe('Task 1')
    expect(timing.breakdown![1].label).toBe('Task 2')
  })

  it('calculates timing for speaking simulation with part breakdown', () => {
    const exercise = createSeedFullSpeakingSimulation()
    const timing = calculateTiming(exercise)
    expect(timing.officialDurationSeconds).toBe(840)
    expect(timing.breakdown).toBeDefined()
    expect(timing.breakdown!.length).toBe(3)
  })

  it('calculates timing for grammar exercise based on item count', () => {
    const exercise = createSeedGrammarExercise()
    const timing = calculateTiming(exercise)
    expect(timing.estimatedDurationSeconds).toBeGreaterThan(0)
    expect(timing.perItemSeconds).toBeDefined()
  })

  it('calculates timing for vocabulary exercise based on term count', () => {
    const exercise = createSeedVocabularyExercise()
    const timing = calculateTiming(exercise)
    expect(timing.estimatedDurationSeconds).toBeGreaterThan(0)
    expect(timing.perItemSeconds).toBeDefined()
  })

  it('differentiates official vs estimated duration', () => {
    const exercise = createSeedFullListeningTest()
    const timing = calculateTiming(exercise)
    expect(timing.officialDurationSeconds).toBeDefined()
    expect(timing.estimatedDurationSeconds).toBeDefined()
    expect(timing.estimatedDurationSeconds).toBeGreaterThanOrEqual(timing.officialDurationSeconds!)
  })
})
