import { describe, it, expect } from 'vitest'
import { buildSkillEvidence, aggregateSkillEvidence, getWeakestSkills } from '../skill-evidence-builder'
import type { SkillEvidence } from '../../entities/skill-evidence'

describe('skill-evidence-builder — buildSkillEvidence', () => {
  it('creates strength evidence for accuracy >= 70% with no previous', () => {
    const result = buildSkillEvidence({ skill: 'reading', score: 4, maximumScore: 5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('strength')
    expect(result.accuracy).toBe(0.8)
    expect(result.description).toContain('80%')
  })

  it('creates weakness evidence for accuracy < 70% with no previous', () => {
    const result = buildSkillEvidence({ skill: 'writing', score: 2, maximumScore: 5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('weakness')
    expect(result.accuracy).toBe(0.4)
  })

  it('creates improvement when accuracy improves over previous', () => {
    const result = buildSkillEvidence({ skill: 'reading', score: 4, maximumScore: 5, previousAccuracy: 0.5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('improvement')
    expect(result.description).toContain('improving')
  })

  it('creates plateau when accuracy is stable', () => {
    const result = buildSkillEvidence({ skill: 'reading', score: 4, maximumScore: 5, previousAccuracy: 0.79, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('plateau')
    expect(result.description).toContain('stable')
  })

  it('creates weakness when accuracy drops', () => {
    const result = buildSkillEvidence({ skill: 'reading', score: 2, maximumScore: 5, previousAccuracy: 0.8, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(result.type).toBe('weakness')
  })

  it('increases confidence with more history', () => {
    const withPrevious = buildSkillEvidence({ skill: 'reading', score: 3, maximumScore: 5, previousAccuracy: 0.6, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    const withoutPrevious = buildSkillEvidence({ skill: 'reading', score: 3, maximumScore: 5, sourceExerciseId: 'ex-1', sourceSessionId: 's-1' })
    expect(withPrevious.confidence).toBeGreaterThan(withoutPrevious.confidence)
  })
})

describe('skill-evidence-builder — aggregateSkillEvidence', () => {
  it('adds evidence and replaces existing for same skill', () => {
    const existing: SkillEvidence[] = [
      { skill: 'reading', type: 'strength', description: 'old', score: 5, maximumScore: 5, accuracy: 1, sourceExerciseId: 'ex-1', sourceSessionId: 's-1', occurredAt: '', confidence: 0.9 },
    ]
    const newEvidence: SkillEvidence = {
      skill: 'reading', type: 'weakness', description: 'new', score: 2, maximumScore: 5, accuracy: 0.4, sourceExerciseId: 'ex-2', sourceSessionId: 's-2', occurredAt: '', confidence: 0.8,
    }

    const result = aggregateSkillEvidence(existing, newEvidence)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('weakness')
    expect(result[0].description).toBe('new')
  })
})

describe('skill-evidence-builder — getWeakestSkills', () => {
  it('returns weakest skills sorted by accuracy', () => {
    const evidence: SkillEvidence[] = [
      { skill: 'reading', type: 'weakness', description: '', score: 2, maximumScore: 5, accuracy: 0.4, sourceExerciseId: '', sourceSessionId: '', occurredAt: '', confidence: 0.9 },
      { skill: 'writing', type: 'weakness', description: '', score: 1, maximumScore: 5, accuracy: 0.2, sourceExerciseId: '', sourceSessionId: '', occurredAt: '', confidence: 0.9 },
      { skill: 'listening', type: 'strength', description: '', score: 5, maximumScore: 5, accuracy: 1, sourceExerciseId: '', sourceSessionId: '', occurredAt: '', confidence: 0.9 },
    ]

    const weakest = getWeakestSkills(evidence, 2)
    expect(weakest).toEqual(['writing', 'reading'])
  })

  it('returns empty array when no weaknesses', () => {
    const evidence: SkillEvidence[] = [
      { skill: 'reading', type: 'strength', description: '', score: 5, maximumScore: 5, accuracy: 1, sourceExerciseId: '', sourceSessionId: '', occurredAt: '', confidence: 0.9 },
    ]
    expect(getWeakestSkills(evidence)).toEqual([])
  })
})
