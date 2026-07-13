import { describe, it, expect } from 'vitest'
import { buildProgressEvidence, aggregateSkillProgress } from '../progress-evidence-builder'

describe('progress-evidence-builder — buildProgressEvidence', () => {
  it('creates evidence with accuracy from score/maximumScore', () => {
    const result = buildProgressEvidence({ skill: 'reading', score: 3, maximumScore: 4, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.accuracy).toBe(0.75)
    expect(result.type).toBe('strength')
  })

  it('identifies weakness for low accuracy', () => {
    const result = buildProgressEvidence({ skill: 'reading', score: 1, maximumScore: 5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('weakness')
  })

  it('detects improvement when accuracy increased', () => {
    const result = buildProgressEvidence({ skill: 'reading', score: 4, maximumScore: 5, previousAccuracy: 0.5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('improvement')
  })

  it('detects decline when accuracy dropped', () => {
    const result = buildProgressEvidence({ skill: 'reading', score: 2, maximumScore: 5, previousAccuracy: 0.8, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('weakness')
  })

  it('detects plateau when accuracy unchanged', () => {
    const result = buildProgressEvidence({ skill: 'reading', score: 4, maximumScore: 5, previousAccuracy: 0.8, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('plateau')
  })

  it('builds description with accuracy percentage', () => {
    const result = buildProgressEvidence({ skill: 'reading', score: 3, maximumScore: 4, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.description).toContain('75%')
  })
})

describe('progress-evidence-builder — aggregateSkillProgress', () => {
  it('creates new progress with incremented exercise count', () => {
    const evidence = buildProgressEvidence({ skill: 'reading', score: 4, maximumScore: 5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    const progress = aggregateSkillProgress(undefined, evidence)

    expect(progress.exercisesCompleted).toBe(1)
    expect(progress.recentAccuracy).toBe(0.8)
    expect(progress.trend).toBe('unknown')
  })

  it('updates existing progress and detects improvement trend', () => {
    const evidence = buildProgressEvidence({ skill: 'reading', score: 4, maximumScore: 5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    const existing = { currentBand: 5, targetBand: 7, recentAccuracy: 0.5, exercisesCompleted: 3, trend: 'unknown' as const }
    const progress = aggregateSkillProgress(existing, evidence)

    expect(progress.exercisesCompleted).toBe(4)
    expect(progress.trend).toBe('improving')
  })

  it('detects declining trend', () => {
    const evidence = buildProgressEvidence({ skill: 'reading', score: 2, maximumScore: 5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    const existing = { currentBand: 5, targetBand: 7, recentAccuracy: 0.8, exercisesCompleted: 5, trend: 'improving' as const }
    const progress = aggregateSkillProgress(existing, evidence)

    expect(progress.trend).toBe('declining')
  })
})
