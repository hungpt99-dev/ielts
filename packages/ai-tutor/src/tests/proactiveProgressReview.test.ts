import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ProactiveProgressReview,
  isWeeklyReviewDue,
  isMonthlyReviewDue,
  getDaysSinceLastWeeklyReview,
  getDaysSinceLastMonthlyReview,
} from '../services/proactiveProgressReview'
import type {
  WeeklyReviewData,
  MonthlyReviewData,
  ReviewGenerationResult,
} from '../services/proactiveProgressReview'
import { ProactiveEventBus } from '../services/proactiveEventBus'
import { ProactiveMessageStorage } from '../services/proactiveMessageStorage'

const defaultWeeklyData: WeeklyReviewData = {
  studyMinutes: 240,
  tasksCompleted: 12,
  sessionsCompleted: 8,
  daysActive: 5,
  streak: 4,
  accuracy: 72,
  vocabularyReviewed: 18,
  mistakesReviewed: 6,
  weakSkills: ['writing', 'speaking'],
  trend: 'improving',
}

const defaultMonthlyData: MonthlyReviewData = {
  studyMinutes: 960,
  tasksCompleted: 48,
  totalSessions: 32,
  daysActive: 20,
  longestStreak: 7,
  averageAccuracy: 70,
  vocabularySaved: 45,
  vocabularyMastered: 22,
  mistakesResolved: 15,
  weakSkills: ['writing', 'listening'],
  strongestSkill: 'reading',
  trend: 'stable',
  targetBand: 7,
  currentBand: 6,
}

beforeEach(() => {
  localStorage.clear()
  ProactiveProgressReview.resetSchedule()
})

// ─── Schedule management ──────────────────────────────────────────────────────

describe('schedule management', () => {
  it('returns schedule with no reviews when empty', () => {
    const schedule = ProactiveProgressReview.getSchedule()
    expect(schedule.lastWeeklyReview).toBeUndefined()
    expect(schedule.lastMonthlyReview).toBeUndefined()
  })

  it('isWeeklyReviewDue returns true when no prior review', () => {
    expect(isWeeklyReviewDue()).toBe(true)
  })

  it('isMonthlyReviewDue returns true when no prior review', () => {
    expect(isMonthlyReviewDue()).toBe(true)
  })

  it('isWeeklyReviewDue returns false within 7 days of last review', () => {
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    expect(isWeeklyReviewDue({ lastWeeklyReview: recent })).toBe(false)
  })

  it('isWeeklyReviewDue returns true after 7 days', () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    expect(isWeeklyReviewDue({ lastWeeklyReview: old })).toBe(true)
  })

  it('isMonthlyReviewDue returns false within 30 days', () => {
    const recent = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    expect(isMonthlyReviewDue({ lastMonthlyReview: recent })).toBe(false)
  })

  it('isMonthlyReviewDue returns true after 30 days', () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    expect(isMonthlyReviewDue({ lastMonthlyReview: old })).toBe(true)
  })

  it('getDaysSinceLastWeeklyReview returns -1 when no review', () => {
    ProactiveProgressReview.resetSchedule()
    expect(getDaysSinceLastWeeklyReview()).toBe(-1)
  })

  it('getDaysSinceLastMonthlyReview returns -1 when no review', () => {
    ProactiveProgressReview.resetSchedule()
    expect(getDaysSinceLastMonthlyReview()).toBe(-1)
  })

  it('getDaysSinceLastWeeklyReview returns days since last review', () => {
    const old = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    ProactiveProgressReview.saveSchedule({ lastWeeklyReview: old })
    expect(getDaysSinceLastWeeklyReview()).toBe(3)
  })

  it('getDaysSinceLastMonthlyReview returns days since last review', () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    ProactiveProgressReview.saveSchedule({ lastMonthlyReview: old })
    expect(getDaysSinceLastMonthlyReview()).toBe(10)
  })

  it('resetSchedule clears stored schedule', () => {
    ProactiveProgressReview.saveSchedule({
      lastWeeklyReview: new Date().toISOString(),
      lastMonthlyReview: new Date().toISOString(),
    })
    ProactiveProgressReview.resetSchedule()
    const s = ProactiveProgressReview.getSchedule()
    expect(s.lastWeeklyReview).toBeUndefined()
    expect(s.lastMonthlyReview).toBeUndefined()
  })
})

// ─── generateWeeklyReview ─────────────────────────────────────────────────────

describe('generateWeeklyReview', () => {
  it('generates a weekly review message with correct trigger type', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.triggerType).toBe('weekly_review')
    expect(msg.category).toBe('progress-report')
  })

  it('includes study minutes in the message', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('240')
    expect(msg.message).toContain('minutes')
  })

  it('includes tasks completed', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('12')
    expect(msg.message).toContain('tasks')
  })

  it('includes days active', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('5 active days')
  })

  it('includes streak when present', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('4-day streak')
  })

  it('does not mention streak when 0', () => {
    const data = { ...defaultWeeklyData, streak: 0 }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).not.toContain('streak')
  })

  it('includes accuracy percentage', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('72%')
  })

  it('includes trend direction in improving case', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('trending up')
  })

  it('includes trend direction in declining case', () => {
    const data = { ...defaultWeeklyData, trend: 'declining' as const }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).toContain('needs extra attention')
  })

  it('includes trend direction in stable case', () => {
    const data = { ...defaultWeeklyData, trend: 'stable' as const }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).toContain('build momentum')
  })

  it('includes vocabulary reviewed count', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('18 vocabulary words')
  })

  it('omits vocab section when count is 0', () => {
    const data = { ...defaultWeeklyData, vocabularyReviewed: 0 }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).not.toContain('vocabulary')
  })

  it('includes mistakes reviewed count', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('6 mistakes')
  })

  it('omits mistakes section when count is 0', () => {
    const data = { ...defaultWeeklyData, mistakesReviewed: 0 }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).not.toContain('mistakes')
  })

  it('includes weak skill suggestions', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.message).toContain('writing')
    expect(msg.message).toContain('speaking')
  })

  it('assigns low priority for improving or stable trends', () => {
    const improving = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(improving.priority).toBe('low')

    const stable = ProactiveProgressReview.generateWeeklyReview({
      ...defaultWeeklyData,
      trend: 'stable',
    })
    expect(stable.priority).toBe('low')
  })

  it('assigns medium priority for declining trend', () => {
    const data = { ...defaultWeeklyData, trend: 'declining' as const }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.priority).toBe('medium')
  })

  it('creates message with required fields', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.id).toBeTruthy()
    expect(msg.title).toBeTruthy()
    expect(msg.message).toBeTruthy()
    expect(msg.createdAt).toBeTruthy()
    expect(msg.isRead).toBe(false)
    expect(msg.isDismissed).toBe(false)
    expect(msg.isSnoozed).toBe(false)
    expect(msg.autoGenerated).toBe(true)
  })

  it('title includes week number', () => {
    const msg = ProactiveProgressReview.generateWeeklyReview(defaultWeeklyData)
    expect(msg.title).toContain('Weekly')
    expect(msg.title).toContain('Week')
  })
})

// ─── generateMonthlyReview ───────────────────────────────────────────────────

describe('generateMonthlyReview', () => {
  it('generates a monthly review message with correct trigger type', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.triggerType).toBe('monthly_review')
    expect(msg.category).toBe('progress-report')
  })

  it('includes study minutes in the message', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('960')
    expect(msg.message).toContain('minutes')
  })

  it('includes days active', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('20 active days')
  })

  it('includes longest streak', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('7 days')
  })

  it('includes average accuracy', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('70%')
  })

  it('includes band progress when both target and current are provided', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('band 6')
    expect(msg.message).toContain('working toward 7')
    expect(msg.message).toContain('1.0 bands')
  })

  it('does not include band section when data is missing', () => {
    const data = { ...defaultMonthlyData, targetBand: undefined, currentBand: undefined }
    const msg = ProactiveProgressReview.generateMonthlyReview(data)
    expect(msg.message).not.toContain('band')
  })

  it('celebrates when target is reached', () => {
    const data = { ...defaultMonthlyData, currentBand: 7, targetBand: 7 }
    const msg = ProactiveProgressReview.generateMonthlyReview(data)
    expect(msg.message).toContain('reached your target')
  })

  it('includes vocabulary mastery percentage', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('22 of 45')
    expect(msg.message).toContain('49%')
  })

  it('shows save-only message when no words mastered', () => {
    const data = { ...defaultMonthlyData, vocabularyMastered: 0 }
    const msg = ProactiveProgressReview.generateMonthlyReview(data)
    expect(msg.message).toContain('saved 45 vocabulary words')
  })

  it('omits vocabulary section when no words saved', () => {
    const data = { ...defaultMonthlyData, vocabularySaved: 0, vocabularyMastered: 0 }
    const msg = ProactiveProgressReview.generateMonthlyReview(data)
    expect(msg.message).not.toContain('vocabulary')
  })

  it('includes mistakes resolved', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('15 mistakes')
  })

  it('includes weak and strong skills', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.message).toContain('writing')
    expect(msg.message).toContain('listening')
    expect(msg.message).toContain('reading')
  })

  it('assigns medium priority', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.priority).toBe('medium')
  })

  it('title includes month label', () => {
    const msg = ProactiveProgressReview.generateMonthlyReview(defaultMonthlyData)
    expect(msg.title).toContain('Monthly')
  })
})

// ─── checkAndGenerate ────────────────────────────────────────────────────────

describe('checkAndGenerate', () => {
  it('generates weekly review when due and data provided', () => {
    const result = ProactiveProgressReview.checkAndGenerate(defaultWeeklyData)
    expect(result.weeklyGenerated).toBe(true)
    expect(result.weekly.length).toBeGreaterThan(0)
  })

  it('generates monthly review when due and data provided', () => {
    const result = ProactiveProgressReview.checkAndGenerate(undefined, defaultMonthlyData)
    expect(result.monthlyGenerated).toBe(true)
    expect(result.monthly.length).toBeGreaterThan(0)
  })

  it('generates both when both are due', () => {
    const result = ProactiveProgressReview.checkAndGenerate(defaultWeeklyData, defaultMonthlyData)
    expect(result.weeklyGenerated).toBe(true)
    expect(result.monthlyGenerated).toBe(true)
    expect(result.weekly.length).toBeGreaterThan(0)
    expect(result.monthly.length).toBeGreaterThan(0)
  })

  it('does not generate weekly when already reviewed recently', () => {
    ProactiveProgressReview.saveSchedule({
      lastWeeklyReview: new Date().toISOString(),
    })
    const result = ProactiveProgressReview.checkAndGenerate(defaultWeeklyData)
    expect(result.weeklyGenerated).toBe(false)
    expect(result.weekly).toEqual([])
  })

  it('does not generate monthly when already reviewed recently', () => {
    ProactiveProgressReview.saveSchedule({
      lastMonthlyReview: new Date().toISOString(),
    })
    const result = ProactiveProgressReview.checkAndGenerate(undefined, defaultMonthlyData)
    expect(result.monthlyGenerated).toBe(false)
    expect(result.monthly).toEqual([])
  })

  it('does not generate weekly when data is missing', () => {
    const result = ProactiveProgressReview.checkAndGenerate()
    expect(result.weeklyGenerated).toBe(false)
    expect(result.monthlyGenerated).toBe(false)
  })

  it('updates schedule after generating weekly', () => {
    ProactiveProgressReview.checkAndGenerate(defaultWeeklyData)
    const schedule = ProactiveProgressReview.getSchedule()
    expect(schedule.lastWeeklyReview).toBeTruthy()
  })

  it('updates schedule after generating monthly', () => {
    ProactiveProgressReview.checkAndGenerate(undefined, defaultMonthlyData)
    const schedule = ProactiveProgressReview.getSchedule()
    expect(schedule.lastMonthlyReview).toBeTruthy()
  })

  it('persists messages to storage', () => {
    const before = ProactiveMessageStorage.loadMessages().length
    ProactiveProgressReview.checkAndGenerate(defaultWeeklyData)
    const after = ProactiveMessageStorage.loadMessages().length
    expect(after).toBeGreaterThan(before)
  })

  it('emits messages via event bus', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)

    ProactiveProgressReview.checkAndGenerate(defaultWeeklyData)

    expect(handler).toHaveBeenCalled()
    const types = handler.mock.calls.map(
      (c: unknown[]) => (c[0] as { triggerType: string }).triggerType,
    )
    expect(types).toContain('weekly_review')
    unsub()
  })

  it('emits monthly review messages via event bus', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)

    ProactiveProgressReview.checkAndGenerate(undefined, defaultMonthlyData)

    expect(handler).toHaveBeenCalled()
    const types = handler.mock.calls.map(
      (c: unknown[]) => (c[0] as { triggerType: string }).triggerType,
    )
    expect(types).toContain('monthly_review')
    unsub()
  })

  it('returns correct generated flags in result', () => {
    const result = ProactiveProgressReview.checkAndGenerate(defaultWeeklyData, defaultMonthlyData)
    expect(result.weeklyGenerated).toBe(true)
    expect(result.monthlyGenerated).toBe(true)
    expect(result.weekly.length).toBeGreaterThan(0)
    expect(result.monthly.length).toBeGreaterThan(0)
  })
})

// ─── forceWeeklyReview ───────────────────────────────────────────────────────

describe('forceWeeklyReview', () => {
  it('generates and stores a weekly review message', () => {
    const msg = ProactiveProgressReview.forceWeeklyReview(defaultWeeklyData)
    expect(msg.triggerType).toBe('weekly_review')
    expect(msg.category).toBe('progress-report')
  })

  it('updates schedule with current date', () => {
    ProactiveProgressReview.forceWeeklyReview(defaultWeeklyData)
    const schedule = ProactiveProgressReview.getSchedule()
    expect(schedule.lastWeeklyReview).toBeTruthy()
  })

  it('persists message in storage', () => {
    const before = ProactiveMessageStorage.loadMessages().length
    ProactiveProgressReview.forceWeeklyReview(defaultWeeklyData)
    const after = ProactiveMessageStorage.loadMessages().length
    expect(after).toBeGreaterThan(before)
  })

  it('emits message via event bus', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)

    ProactiveProgressReview.forceWeeklyReview(defaultWeeklyData)

    expect(handler).toHaveBeenCalled()
    const types = handler.mock.calls.map(
      (c: unknown[]) => (c[0] as { triggerType: string }).triggerType,
    )
    expect(types).toContain('weekly_review')
    unsub()
  })
})

// ─── forceMonthlyReview ──────────────────────────────────────────────────────

describe('forceMonthlyReview', () => {
  it('generates and stores a monthly review message', () => {
    const msg = ProactiveProgressReview.forceMonthlyReview(defaultMonthlyData)
    expect(msg.triggerType).toBe('monthly_review')
    expect(msg.category).toBe('progress-report')
  })

  it('updates schedule with current date', () => {
    ProactiveProgressReview.forceMonthlyReview(defaultMonthlyData)
    const schedule = ProactiveProgressReview.getSchedule()
    expect(schedule.lastMonthlyReview).toBeTruthy()
  })

  it('persists message in storage', () => {
    const before = ProactiveMessageStorage.loadMessages().length
    ProactiveProgressReview.forceMonthlyReview(defaultMonthlyData)
    const after = ProactiveMessageStorage.loadMessages().length
    expect(after).toBeGreaterThan(before)
  })

  it('emits message via event bus', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)

    ProactiveProgressReview.forceMonthlyReview(defaultMonthlyData)

    expect(handler).toHaveBeenCalled()
    const types = handler.mock.calls.map(
      (c: unknown[]) => (c[0] as { triggerType: string }).triggerType,
    )
    expect(types).toContain('monthly_review')
    unsub()
  })
})

// ─── Default data helpers ────────────────────────────────────────────────────

describe('default data helpers', () => {
  it('getDefaultWeeklyData returns valid weekly data', () => {
    const data = ProactiveProgressReview.getDefaultWeeklyData()
    expect(data.studyMinutes).toBeGreaterThan(0)
    expect(data.tasksCompleted).toBeGreaterThan(0)
    expect(data.daysActive).toBeGreaterThan(0)
    expect(Array.isArray(data.weakSkills)).toBe(true)
    expect(['improving', 'declining', 'stable']).toContain(data.trend)
  })

  it('getDefaultMonthlyData returns valid monthly data', () => {
    const data = ProactiveProgressReview.getDefaultMonthlyData()
    expect(data.studyMinutes).toBeGreaterThan(0)
    expect(data.tasksCompleted).toBeGreaterThan(0)
    expect(data.daysActive).toBeGreaterThan(0)
    expect(Array.isArray(data.weakSkills)).toBe(true)
    expect(data.targetBand).toBeGreaterThan(0)
    expect(data.currentBand).toBeGreaterThan(0)
  })
})

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles empty weak skills in weekly review', () => {
    const data = { ...defaultWeeklyData, weakSkills: [] }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).toBeTruthy()
    expect(msg.message).not.toContain('weakest area')
  })

  it('handles empty weak skills in monthly review', () => {
    const data = { ...defaultMonthlyData, weakSkills: [] }
    const msg = ProactiveProgressReview.generateMonthlyReview(data)
    expect(msg.message).toBeTruthy()
    expect(msg.message).not.toContain('weakest area')
  })

  it('handles zero values gracefully in weekly review', () => {
    const data: WeeklyReviewData = {
      studyMinutes: 0,
      tasksCompleted: 0,
      sessionsCompleted: 0,
      daysActive: 0,
      streak: 0,
      accuracy: 0,
      vocabularyReviewed: 0,
      mistakesReviewed: 0,
      weakSkills: [],
      trend: 'stable',
    }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).toBeTruthy()
    expect(msg.triggerType).toBe('weekly_review')
  })

  it('handles zero values gracefully in monthly review', () => {
    const data: MonthlyReviewData = {
      studyMinutes: 0,
      tasksCompleted: 0,
      totalSessions: 0,
      daysActive: 0,
      longestStreak: 0,
      averageAccuracy: 0,
      vocabularySaved: 0,
      vocabularyMastered: 0,
      mistakesResolved: 0,
      weakSkills: [],
      strongestSkill: '',
      trend: 'stable',
    }
    const msg = ProactiveProgressReview.generateMonthlyReview(data)
    expect(msg.message).toBeTruthy()
    expect(msg.triggerType).toBe('monthly_review')
  })

  it('single weak skill renders singular grammar', () => {
    const data = { ...defaultWeeklyData, weakSkills: ['writing'] }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).toContain('is writing')
  })

  it('multiple weak skills render plural grammar', () => {
    const data = { ...defaultWeeklyData, weakSkills: ['writing', 'speaking', 'reading'] }
    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.message).toContain('are')
  })
})
