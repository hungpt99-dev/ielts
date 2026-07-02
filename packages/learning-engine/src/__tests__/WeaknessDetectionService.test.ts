import { describe, it, expect } from 'vitest'
import { WeaknessDetectionService } from '../weakness-detection/WeaknessDetectionService'

describe('WeaknessDetectionService', () => {
  const service = new WeaknessDetectionService()

  it('detects weak skills from practice accuracy', () => {
    const lowScorePractices = [
      { score: 3, totalQuestions: 10, timeSpentSeconds: 300 } as any,
      { score: 4, totalQuestions: 10, timeSpentSeconds: 400 } as any,
    ]
    const emptyPractices: any[] = []

    const weakSkills = service.detectWeakSkills(
      lowScorePractices,
      emptyPractices,
      [],
      [],
    )

    expect(weakSkills.length).toBeGreaterThan(0)
    const reading = weakSkills.find(w => w.skill === 'reading')
    expect(reading).toBeTruthy()
    expect(reading!.accuracy).toBeLessThan(50)
    expect(reading!.severity).toBe('high')
  })

  it('detects repeated mistakes', () => {
    const baseMistake = {
      mistake: 'subject-verb agreement error',
      correction: 'fix',
      explanation: 'explanation',
      source: 'test',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mistakes = [
      { ...baseMistake, skill: 'grammar' as const, repetitionCount: 3, status: 'new' as const, id: '1' },
      { ...baseMistake, skill: 'grammar' as const, repetitionCount: 2, status: 'reviewed' as const, id: '2' },
      { ...baseMistake, skill: 'vocabulary' as const, repetitionCount: 1, status: 'new' as const, id: '3', mistake: 'wrong collocation' },
    ]

    const patterns = service.detectRepeatedMistakes(mistakes)
    expect(patterns.length).toBeGreaterThanOrEqual(1)
    expect(patterns[0].frequency).toBeGreaterThanOrEqual(2)
  })

  it('summarizes mistake categories', () => {
    const mistakes = [
      { id: '1', skill: 'grammar' as const, status: 'new' as const, repetitionCount: 1 },
      { id: '2', skill: 'grammar' as const, status: 'resolved' as const, repetitionCount: 1 },
      { id: '3', skill: 'vocabulary' as const, status: 'new' as const, repetitionCount: 1 },
      { id: '4', skill: 'vocabulary' as const, status: 'new' as const, repetitionCount: 1 },
    ].map(m => ({
      ...m,
      mistake: 'test',
      correction: '',
      explanation: '',
      source: '',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    const summaries = service.getMistakeCategorySummaries(mistakes)
    expect(summaries.length).toBe(2)

    const grammar = summaries.find(s => s.skill === 'grammar')
    expect(grammar).toBeTruthy()
    expect(grammar!.totalMistakes).toBe(2)
    expect(grammar!.unresolvedCount).toBe(1)
    expect(grammar!.resolvedCount).toBe(1)

    const vocab = summaries.find(s => s.skill === 'vocabulary')
    expect(vocab).toBeTruthy()
    expect(vocab!.totalMistakes).toBe(2)
    expect(vocab!.unresolvedCount).toBe(2)
  })

  it('builds complete weakness report', () => {
    const report = service.getWeaknessReport([], [], [], [], [])
    expect(report.weakSkills).toBeDefined()
    expect(report.repeatedMistakes).toBeDefined()
    expect(report.frequentMistakeCategories).toBeDefined()
  })
})
