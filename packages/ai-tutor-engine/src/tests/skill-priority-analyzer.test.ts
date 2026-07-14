import { describe, it, expect } from 'vitest'
import { analyzeSkillPriorities } from '../domain/services/skill-priority-analyzer'
import type { SkillState } from '../domain/entities/learner-context'
import type { IELTSSection } from '../domain/value-objects'

function makeSkillState(overrides: Partial<SkillState> = {}): SkillState {
  return {
    skill: 'reading' as IELTSSection,
    currentBand: 6,
    targetBand: 7,
    gap: 1,
    recentPerformance: 70,
    trend: 'stable' as const,
    confidence: 0.5,
    priorityScore: 0,
    frequentWeaknesses: [],
    recentStrengths: [],
    ...overrides,
  }
}

describe('analyzeSkillPriorities', () => {
  it('ranks skills with largest band gap highest', () => {
    const states = {
      reading: makeSkillState({ skill: 'reading' as IELTSSection, currentBand: 5, targetBand: 7, gap: 2 }),
      listening: makeSkillState({ skill: 'listening' as IELTSSection, currentBand: 6.5, targetBand: 7, gap: 0.5 }),
    } as Record<IELTSSection, SkillState>
    const result = analyzeSkillPriorities(states, [])
    expect(result.ranked[0].skill).toBe('reading')
  })

  it('boosts score for declared weak skills', () => {
    const states = {
      reading: makeSkillState({ skill: 'reading' as IELTSSection, currentBand: 6.5, targetBand: 7, gap: 0.5 }),
      writing: makeSkillState({ skill: 'writing' as IELTSSection, currentBand: 6.5, targetBand: 7, gap: 0.5 }),
    } as Record<IELTSSection, SkillState>
    const result = analyzeSkillPriorities(states, ['writing' as IELTSSection])
    expect(result.ranked[0].skill).toBe('writing')
  })

  it('identifies gap urgency correctly', () => {
    const states = {
      reading: makeSkillState({ skill: 'reading' as IELTSSection, currentBand: 4, targetBand: 7, gap: 3 }),
      writing: makeSkillState({ skill: 'writing' as IELTSSection, currentBand: 6, targetBand: 7, gap: 1 }),
      listening: makeSkillState({ skill: 'listening' as IELTSSection, currentBand: 6.5, targetBand: 7, gap: 0.5 }),
    } as Record<IELTSSection, SkillState>
    const result = analyzeSkillPriorities(states, [])
    expect(result.gaps.find(g => g.skill === 'reading')?.urgency).toBe('high')
    expect(result.gaps.find(g => g.skill === 'writing')?.urgency).toBe('medium')
    expect(result.gaps.find(g => g.skill === 'listening')?.urgency).toBe('low')
  })

  it('detects declining trend', () => {
    const states = {
      reading: makeSkillState({ skill: 'reading' as IELTSSection, trend: 'declining' as const }),
      listening: makeSkillState({ skill: 'listening' as IELTSSection, trend: 'improving' as const }),
    } as Record<IELTSSection, SkillState>
    const result = analyzeSkillPriorities(states, [])
    expect(result.ranked[0].skill).toBe('reading')
  })

  it('detects low recent accuracy', () => {
    const states = {
      reading: makeSkillState({ skill: 'reading' as IELTSSection, recentPerformance: 40 }),
      listening: makeSkillState({ skill: 'listening' as IELTSSection, recentPerformance: 80 }),
    } as Record<IELTSSection, SkillState>
    const result = analyzeSkillPriorities(states, [])
    expect(result.ranked[0].skill).toBe('reading')
  })

  it('sets focusSkill to the highest-ranked skill', () => {
    const states = {
      reading: makeSkillState({ skill: 'reading' as IELTSSection, currentBand: 5, targetBand: 7, gap: 2 }),
    } as Record<IELTSSection, SkillState>
    const result = analyzeSkillPriorities(states, [])
    expect(result.focusSkill).toBe('reading')
  })

  it('handles empty skill states', () => {
    const result = analyzeSkillPriorities({} as Record<IELTSSection, SkillState>, [])
    expect(result.ranked).toHaveLength(0)
    expect(result.focusSkill).toBeNull()
    expect(result.gaps).toHaveLength(0)
  })
})
