import { describe, it, expect } from 'vitest'
import { analyzeLearnerProgress } from '../domain/services/progress-analyzer'
import type { LearnerStateSnapshot } from '../domain/entities/learner-context'
import type { IELTSSection } from '../domain/value-objects'

function makeMinimalState(overrides: Partial<LearnerStateSnapshot> = {}): LearnerStateSnapshot {
  return {
    profile: {
      currentBand: 6,
      targetBand: 7,
      currentSkillBands: {},
      targetSkillBands: {},
      timezone: 'UTC',
      preferredLanguage: 'en',
      weakSkills: [],
      strongSkills: [],
    },
    exam: { examDate: null, daysUntilExam: null, isUrgent: false, isFinalWeek: false },
    progress: { overallCompletionPercent: 0, skillProgress: {}, studyStreak: 0 },
    skillStates: {} as Record<IELTSSection, LearnerStateSnapshot['skillStates'][IELTSSection]>,
    weaknesses: [],
    strengths: [],
    mistakeSummary: { total: 0, unreviewed: 0, recentCount: 0, recurringPatterns: [], bySkill: {} },
    vocabularySummary: { totalSaved: 0, dueForReview: 0, mastered: 0, byTopic: {} },
    activitySummary: { lastActiveAt: null, todayStudyMinutes: 0, weeklyStudyMinutes: 0, tasksCompletedToday: 0 },
    recentAttempts: [],
    previousFeedback: [],
    relevantContent: [],
    preferences: { preferredLearningMethods: [], preferredTaskTypes: [], language: 'en' },
    constraints: { offlineOnly: false, aiAvailable: true },
    contextQuality: { status: 'complete', missingSources: [], warnings: [] },
    generatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeSkillState(skill: IELTSSection, overrides?: Record<string, unknown>): LearnerStateSnapshot['skillStates'][IELTSSection] {
  return {
    skill,
    currentBand: 6,
    targetBand: 7,
    gap: 1,
    recentPerformance: 70,
    trend: 'stable' as const,
    confidence: 0.5,
    priorityScore: 0,
    frequentWeaknesses: [],
    recentStrengths: [],
    ...(overrides as Partial<LearnerStateSnapshot['skillStates'][IELTSSection]>),
  }
}

describe('analyzeLearnerProgress', () => {
  it('returns stable overall trend for minimal state', () => {
    const result = analyzeLearnerProgress(makeMinimalState())
    expect(result.overallTrend).toBe('stable')
  })

  it('detects improving trend as strength', () => {
    const state = makeMinimalState({
      skillStates: {
        reading: makeSkillState('reading' as IELTSSection, { trend: 'improving' }),
      } as Record<IELTSSection, LearnerStateSnapshot['skillStates'][IELTSSection]>,
    })
    const result = analyzeLearnerProgress(state)
    expect(result.strengths.length).toBeGreaterThan(0)
    expect(result.strengths[0].area).toBe('reading')
  })

  it('detects declining trend as weakness', () => {
    const state = makeMinimalState({
      skillStates: {
        writing: makeSkillState('writing' as IELTSSection, { trend: 'declining' }),
      } as Record<IELTSSection, LearnerStateSnapshot['skillStates'][IELTSSection]>,
    })
    const result = analyzeLearnerProgress(state)
    expect(result.weaknesses.length).toBeGreaterThan(0)
    expect(result.weaknesses[0].area).toBe('writing')
  })

  it('detects large band gap as weakness', () => {
    const state = makeMinimalState({
      skillStates: {
        speaking: makeSkillState('speaking' as IELTSSection, { currentBand: 4, targetBand: 7, gap: 3, trend: 'stable' }),
      } as Record<IELTSSection, LearnerStateSnapshot['skillStates'][IELTSSection]>,
    })
    const result = analyzeLearnerProgress(state)
    const gapWeakness = result.weaknesses.find(w => w.area === 'speaking' && w.evidence.includes('gap'))
    expect(gapWeakness).toBeDefined()
  })

  it('detects exam risk when exam is within 30 days', () => {
    const state = makeMinimalState({
      exam: { examDate: new Date(Date.now() + 15 * 86_400_000).toISOString(), daysUntilExam: 15, isUrgent: true, isFinalWeek: false },
    })
    const result = analyzeLearnerProgress(state)
    expect(result.risks.length).toBeGreaterThan(0)
    expect(result.risks[0].type).toBe('exam-too-soon')
  })

  it('detects inactivity risk after 7+ days', () => {
    const state = makeMinimalState({
      progress: { overallCompletionPercent: 0, skillProgress: {}, studyStreak: 0, inactiveDays: 10 },
    })
    const result = analyzeLearnerProgress(state)
    expect(result.risks.length).toBeGreaterThan(0)
    expect(result.risks[0].type).toBe('inactivity')
  })

  it('detects streak milestone at 7-day intervals', () => {
    const state = makeMinimalState({
      progress: { overallCompletionPercent: 0, skillProgress: {}, studyStreak: 14 },
    })
    const result = analyzeLearnerProgress(state)
    expect(result.milestones.length).toBeGreaterThan(0)
    expect(result.milestones[0].label).toContain('day study streak')
  })

  it('returns confidence of 0.7', () => {
    const result = analyzeLearnerProgress(makeMinimalState())
    expect(result.confidence).toBe(0.7)
  })
})
