import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toDateString,
  todayDateString,
  parseDate,
  addDays,
  daysBetween,
  generateDateRange,
  getDayOfWeek,
  isStudyDay,
  countStudyDays,
  countRestDays,
  calculateWeekNumber,
  generateWeekNumbers,
  calculateTotalWeeks,
  calculateFinalReviewPeriodDays,
  getFinalReviewStartDate,
  calculateMockTestSchedule,
  calculateSkillPriority,
  validateDateContinuity,
  calculatePlanMeta,
  getChunkDates,
  getChunkDayNumbers,
  calculateDefaultChunkSize,
} from '../dateUtils'
import type { StudyPlanUserProfile, DayOfWeek } from '../../types'

beforeEach(() => {
  const fixed = new Date('2026-01-01T00:00:00.000Z')
  vi.useFakeTimers()
  vi.setSystemTime(fixed)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('toDateString', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    expect(toDateString(new Date('2026-01-15T10:30:00'))).toBe('2026-01-15')
  })
})

describe('todayDateString', () => {
  it('returns today as YYYY-MM-DD using fake timers', () => {
    expect(todayDateString()).toBe('2026-01-01')
  })
})

describe('parseDate', () => {
  it('parses a date string and resets time to midnight', () => {
    const d = parseDate('2026-01-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })
})

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-01-01', 5)).toBe('2026-01-06')
  })

  it('subtracts days with negative argument', () => {
    expect(addDays('2026-01-10', -3)).toBe('2026-01-07')
  })

  it('returns same date for zero', () => {
    expect(addDays('2026-06-15', 0)).toBe('2026-06-15')
  })

  it('handles month boundary', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02')
  })

  it('handles year boundary', () => {
    expect(addDays('2025-12-30', 5)).toBe('2026-01-04')
  })
})

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2026-01-15', '2026-01-15')).toBe(0)
  })

  it('returns positive for later date', () => {
    expect(daysBetween('2026-01-01', '2026-01-10')).toBe(9)
  })

  it('returns negative for earlier date', () => {
    expect(daysBetween('2026-01-10', '2026-01-01')).toBe(-9)
  })

  it('handles month and year boundaries', () => {
    expect(daysBetween('2025-12-30', '2026-01-02')).toBe(3)
  })
})

describe('generateDateRange', () => {
  it('generates a continuous range of dates', () => {
    const result = generateDateRange('2026-01-01', '2026-01-05')
    expect(result).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ])
  })

  it('returns a single date when start equals end', () => {
    expect(generateDateRange('2026-06-15', '2026-06-15')).toEqual(['2026-06-15'])
  })

  it('handles month boundary', () => {
    const result = generateDateRange('2026-01-30', '2026-02-02')
    expect(result).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02'])
  })

  it('handles year boundary', () => {
    const result = generateDateRange('2025-12-30', '2026-01-02')
    expect(result).toEqual(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'])
  })
})

describe('getDayOfWeek', () => {
  it('returns mon for 2026-01-05 (Monday)', () => {
    expect(getDayOfWeek('2026-01-05')).toBe('mon')
  })

  it('returns sun for 2026-01-04 (Sunday)', () => {
    expect(getDayOfWeek('2026-01-04')).toBe('sun')
  })

  it('returns sat for 2026-01-10 (Saturday)', () => {
    expect(getDayOfWeek('2026-01-10')).toBe('sat')
  })
})

describe('isStudyDay', () => {
  const studyDays: DayOfWeek[] = ['mon', 'wed', 'fri']

  it('returns true when day is in study days', () => {
    expect(isStudyDay('2026-01-05', studyDays)).toBe(true)
  })

  it('returns false when day is not in study days', () => {
    expect(isStudyDay('2026-01-06', studyDays)).toBe(false)
  })
})

describe('countStudyDays', () => {
  const dates = generateDateRange('2026-01-01', '2026-01-07')
  const studyDays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

  it('counts weekdays correctly', () => {
    expect(countStudyDays(dates, studyDays)).toBe(5)
  })
})

describe('countRestDays', () => {
  const dates = generateDateRange('2026-01-01', '2026-01-07')
  const studyDays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

  it('counts weekend days as rest', () => {
    expect(countRestDays(dates, studyDays)).toBe(2)
  })

  it('returns totalDays when no study days', () => {
    expect(countRestDays(dates, [])).toBe(7)
  })
})

describe('calculateWeekNumber', () => {
  it('returns 1 for the start date', () => {
    expect(calculateWeekNumber('2026-01-01', '2026-01-01')).toBe(1)
  })

  it('returns 1 for day 6 of the first week', () => {
    expect(calculateWeekNumber('2026-01-06', '2026-01-01')).toBe(1)
  })

  it('returns 2 for day 7', () => {
    expect(calculateWeekNumber('2026-01-08', '2026-01-01')).toBe(2)
  })

  it('returns 5 for week 5', () => {
    expect(calculateWeekNumber('2026-01-29', '2026-01-01')).toBe(5)
  })
})

describe('generateWeekNumbers', () => {
  it('maps each date to its week number', () => {
    const dates = generateDateRange('2026-01-01', '2026-01-14')
    const weeks = generateWeekNumbers(dates, '2026-01-01')
    expect(weeks).toEqual([
      1, 1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2, 2,
    ])
  })
})

describe('calculateTotalWeeks', () => {
  it('returns 1 for 1 day', () => {
    expect(calculateTotalWeeks(1)).toBe(1)
  })

  it('returns 1 for 7 days', () => {
    expect(calculateTotalWeeks(7)).toBe(1)
  })

  it('returns 2 for 8 days', () => {
    expect(calculateTotalWeeks(8)).toBe(2)
  })

  it('returns 5 for 30 days', () => {
    expect(calculateTotalWeeks(30)).toBe(5)
  })
})

describe('calculateFinalReviewPeriodDays', () => {
  it('returns 7 when includeFinalExamPreparationWeek is true', () => {
    expect(calculateFinalReviewPeriodDays(true)).toBe(7)
  })

  it('returns 0 when includeFinalExamPreparationWeek is false', () => {
    expect(calculateFinalReviewPeriodDays(false)).toBe(0)
  })
})

describe('getFinalReviewStartDate', () => {
  it('returns the date 7 days before exam', () => {
    expect(getFinalReviewStartDate('2026-01-30', 7)).toBe('2026-01-23')
  })

  it('returns null when days is 0', () => {
    expect(getFinalReviewStartDate('2026-01-30', 0)).toBeNull()
  })
})

describe('calculateMockTestSchedule', () => {
  const allDates = generateDateRange('2026-01-01', '2026-01-28')
  const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']

  it('returns empty when includeMockTests is false', () => {
    expect(calculateMockTestSchedule(allDates, weekdays, false, 4)).toEqual([])
  })

  it('returns empty when dates array is empty', () => {
    expect(calculateMockTestSchedule([], weekdays, true, 4)).toEqual([])
  })

  it('returns mock test dates at intervals across the plan', () => {
    const result = calculateMockTestSchedule(allDates, weekdays, true, 4)
    expect(result.length).toBeGreaterThan(0)
    for (const mockDate of result) {
      expect(allDates).toContain(mockDate)
    }
  })

  it('returns sorted unique dates', () => {
    const result = calculateMockTestSchedule(allDates, weekdays, true, 4)
    const sorted = [...result].sort()
    expect(result).toEqual(sorted)
    expect(new Set(result).size).toBe(result.length)
  })
})

describe('calculateSkillPriority', () => {
  it('prioritizes main focus over weak skills', () => {
    const result = calculateSkillPriority(
      ['Reading', 'Listening'],
      ['Speaking'],
      ['Writing'],
    )
    expect(result[0]).toBe('Writing')
    expect(result.indexOf('Writing')).toBeLessThan(result.indexOf('Reading'))
  })

  it('puts strong skills last', () => {
    const result = calculateSkillPriority(
      ['Reading'],
      ['Speaking', 'Writing'],
      ['Listening'],
    )
    const lastIndex = result.length - 1
    expect(result[lastIndex]).toBe('Writing')
    expect(result[lastIndex - 1]).toBe('Speaking')
  })

  it('includes all six skills in the result', () => {
    const allSix = ['Vocabulary', 'Reading', 'Listening', 'Writing', 'Speaking', 'Grammar']
    const result = calculateSkillPriority([], [], [])
    expect(result.sort()).toEqual(allSix.sort())
  })
})

describe('validateDateContinuity', () => {
  it('returns valid for continuous dates', () => {
    const dates = generateDateRange('2026-01-01', '2026-01-10')
    const result = validateDateContinuity(dates)
    expect(result.valid).toBe(true)
    expect(result.missingDates).toEqual([])
    expect(result.duplicateDates).toEqual([])
    expect(result.gaps).toEqual([])
  })

  it('detects gaps', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-05', '2026-01-06']
    const result = validateDateContinuity(dates)
    expect(result.valid).toBe(false)
    expect(result.missingDates).toEqual(['2026-01-03', '2026-01-04'])
    expect(result.gaps).toHaveLength(1)
    expect(result.gaps[0]).toEqual({ from: '2026-01-02', to: '2026-01-05' })
  })

  it('detects duplicates', () => {
    const dates = ['2026-01-01', '2026-01-02', '2026-01-02', '2026-01-03']
    const result = validateDateContinuity(dates)
    expect(result.valid).toBe(false)
    expect(result.duplicateDates).toEqual(['2026-01-02'])
  })

  it('handles empty array', () => {
    const result = validateDateContinuity([])
    expect(result.valid).toBe(false)
    expect(result.missingDates).toEqual([])
  })

  it('handles single date', () => {
    const result = validateDateContinuity(['2026-01-01'])
    expect(result.valid).toBe(true)
  })
})

describe('calculatePlanMeta', () => {
  it('computes all meta fields correctly', () => {
    const profile: StudyPlanUserProfile = {
      currentBand: 5.5,
      targetBand: 7.0,
      examDate: '2026-01-15',
      dailyStudyMinutes: 60,
      preferredStudyDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      restDays: ['sat', 'sun'],
      weakSkills: ['Reading', 'Writing'],
      strongSkills: ['Speaking'],
      mainFocusSkills: ['Listening'],
      studyIntensity: 'moderate',
      preferredLanguage: 'english',
      includeMockTests: true,
      includeVocabularyReview: true,
      includeGrammarReview: true,
      includeWeeklyProgressReview: true,
      includeFinalExamPreparationWeek: true,
    }

    const meta = calculatePlanMeta(profile)

    expect(meta.today).toBe('2026-01-01')
    expect(meta.examDate).toBe('2026-01-15')
    expect(meta.totalDays).toBe(15)
    expect(meta.studyDays).toBe(11)
    expect(meta.restDaysCount).toBe(4)
    expect(meta.totalWeeks).toBe(3)
    expect(meta.finalReviewPeriodDays).toBe(7)
    expect(meta.mockTestSchedule.length).toBeGreaterThan(0)
    expect(meta.skillPriority[0]).toBe('Listening')
  })

  it('calculates studyDays=totalDays when no rest days', () => {
    const profile: StudyPlanUserProfile = {
      currentBand: 5.5,
      targetBand: 7.0,
      examDate: '2026-01-05',
      dailyStudyMinutes: 60,
      preferredStudyDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      restDays: [],
      weakSkills: [],
      strongSkills: [],
      mainFocusSkills: [],
      studyIntensity: 'moderate',
      preferredLanguage: 'english',
      includeMockTests: false,
      includeVocabularyReview: false,
      includeGrammarReview: false,
      includeWeeklyProgressReview: false,
      includeFinalExamPreparationWeek: false,
    }

    const meta = calculatePlanMeta(profile)
    expect(meta.studyDays).toBe(meta.totalDays)
    expect(meta.restDaysCount).toBe(0)
  })
})

describe('getChunkDates', () => {
  const allDates = generateDateRange('2026-01-01', '2026-01-10')

  it('returns first chunk', () => {
    expect(getChunkDates(allDates, 3, 0)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
    ])
  })

  it('returns second chunk', () => {
    expect(getChunkDates(allDates, 3, 1)).toEqual([
      '2026-01-04',
      '2026-01-05',
      '2026-01-06',
    ])
  })

  it('returns last partial chunk', () => {
    expect(getChunkDates(allDates, 3, 3)).toEqual(['2026-01-10'])
  })
})

describe('getChunkDayNumbers', () => {
  const allDates = generateDateRange('2026-01-01', '2026-01-10')

  it('returns day numbers 1-3 for first chunk', () => {
    expect(getChunkDayNumbers(allDates, 3, 0)).toEqual([1, 2, 3])
  })

  it('returns day numbers 4-6 for second chunk', () => {
    expect(getChunkDayNumbers(allDates, 3, 1)).toEqual([4, 5, 6])
  })

  it('returns day number 10 for last chunk', () => {
    expect(getChunkDayNumbers(allDates, 3, 3)).toEqual([10])
  })
})

describe('calculateDefaultChunkSize', () => {
  it('returns 3 for small model', () => {
    expect(calculateDefaultChunkSize('small')).toBe(3)
  })

  it('returns 7 for medium model', () => {
    expect(calculateDefaultChunkSize('medium')).toBe(7)
  })

  it('returns 14 for large model', () => {
    expect(calculateDefaultChunkSize('large')).toBe(14)
  })
})
