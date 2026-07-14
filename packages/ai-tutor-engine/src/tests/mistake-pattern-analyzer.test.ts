import { describe, it, expect } from 'vitest'
import { detectRecurringPatterns } from '../domain/services/mistake-pattern-analyzer'
import type { MistakeAnalysisInput } from '../domain/services/mistake-pattern-analyzer'
import type { IELTSSection } from '../domain/value-objects'

describe('detectRecurringPatterns', () => {
  it('returns empty array for single mistakes', () => {
    const input: MistakeAnalysisInput = {
      mistakes: [
        { skill: 'writing' as IELTSSection, category: 'grammar', text: 'I go to school yesterday', createdAt: '2026-07-01' },
      ],
    }
    const result = detectRecurringPatterns(input)
    expect(result).toHaveLength(0)
  })

  it('detects recurring verb-tense patterns', () => {
    const input: MistakeAnalysisInput = {
      mistakes: [
        { skill: 'writing' as IELTSSection, category: 'grammar', text: 'He have gone', createdAt: '2026-07-01' },
        { skill: 'writing' as IELTSSection, category: 'grammar', text: 'She have seen', createdAt: '2026-07-02' },
      ],
    }
    const result = detectRecurringPatterns(input)
    expect(result).toHaveLength(1)
    expect(result[0].pattern).toContain('verb')
  })

  it('returns patterns sorted by frequency descending', () => {
    const input: MistakeAnalysisInput = {
      mistakes: [
        { skill: 'grammar' as IELTSSection, category: 'grammar', text: 'the apple', createdAt: '2026-07-01' },
        { skill: 'grammar' as IELTSSection, category: 'grammar', text: 'a apple', createdAt: '2026-07-02' },
        { skill: 'grammar' as IELTSSection, category: 'grammar', text: 'the cat', createdAt: '2026-07-03' },
        { skill: 'writing' as IELTSSection, category: 'grammar', text: 'on the table', createdAt: '2026-07-01' },
        { skill: 'writing' as IELTSSection, category: 'grammar', text: 'in the room', createdAt: '2026-07-02' },
      ],
    }
    const result = detectRecurringPatterns(input)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(result[0].frequency).toBeGreaterThanOrEqual(result[1].frequency)
  })

  it('returns empty for unrelated mistakes', () => {
    const input: MistakeAnalysisInput = {
      mistakes: [
        { skill: 'reading' as IELTSSection, category: 'comprehension', text: 'Main idea question', createdAt: '2026-07-01' },
        { skill: 'writing' as IELTSSection, category: 'vocabulary', text: 'Wrong word choice', createdAt: '2026-07-02' },
      ],
    }
    const result = detectRecurringPatterns(input)
    expect(result).toHaveLength(0)
  })

  it('limits examples to 3 per pattern', () => {
    const mistakes = Array.from({ length: 10 }, (_, i) => ({
      skill: 'writing' as IELTSSection,
      category: 'grammar',
      text: `the example ${i}`,
      createdAt: `2026-07-${String(i + 1).padStart(2, '0')}`,
    }))
    const result = detectRecurringPatterns({ mistakes })
    expect(result).toHaveLength(1)
    expect(result[0].examples.length).toBeLessThanOrEqual(3)
  })
})
