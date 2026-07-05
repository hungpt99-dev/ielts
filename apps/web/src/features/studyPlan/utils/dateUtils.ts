import type {
  StudyPlanUserProfile,
  StudyPlanCalculatedMeta,
  StudySkill,
  DayOfWeek,
} from '../types'

const DAYS_IN_WEEK = 7
const FINAL_REVIEW_DAYS = 7

const DAY_NAMES: Record<number, DayOfWeek> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayDateString(): string {
  return toDateString(new Date())
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

export function daysBetween(start: string, end: string): number {
  const s = parseDate(start)
  const e = parseDate(end)
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
}

export function generateDateRange(startDate: string, endDate: string): string[] {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const dates: string[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(toDateString(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

export function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = parseDate(dateStr)
  return DAY_NAMES[d.getDay()]
}

export function isStudyDay(dateStr: string, studyDays: DayOfWeek[]): boolean {
  return studyDays.includes(getDayOfWeek(dateStr))
}

export function countStudyDays(dates: string[], studyDays: DayOfWeek[]): number {
  return dates.filter(d => isStudyDay(d, studyDays)).length
}

export function countRestDays(dates: string[], studyDays: DayOfWeek[]): number {
  return dates.length - countStudyDays(dates, studyDays)
}

export function calculateWeekNumber(dateStr: string, planStartDate: string): number {
  const diff = daysBetween(planStartDate, dateStr)
  return Math.floor(diff / DAYS_IN_WEEK) + 1
}

export function generateWeekNumbers(dates: string[], planStartDate: string): number[] {
  return dates.map(d => calculateWeekNumber(d, planStartDate))
}

export function calculateTotalWeeks(totalDays: number): number {
  return Math.ceil(totalDays / DAYS_IN_WEEK)
}

export function calculateFinalReviewPeriodDays(
  includeFinalExamPreparationWeek: boolean,
): number {
  return includeFinalExamPreparationWeek ? FINAL_REVIEW_DAYS : 0
}

export function getFinalReviewStartDate(
  examDate: string,
  finalReviewDays: number,
): string | null {
  if (finalReviewDays <= 0) return null
  return addDays(examDate, -finalReviewDays)
}

export function calculateMockTestSchedule(
  dates: string[],
  studyDays: DayOfWeek[],
  includeMockTests: boolean,
  totalWeeks: number,
): string[] {
  if (!includeMockTests || dates.length === 0) return []

  const studyDateCandidates = dates.filter(d => isStudyDay(d, studyDays))
  if (studyDateCandidates.length === 0) return []

  const mockDates: string[] = []
  const mockIntervalWeeks = 2

  for (let weekOffset = 2; weekOffset < totalWeeks; weekOffset += mockIntervalWeeks) {
    const targetDayIndex = weekOffset * DAYS_IN_WEEK
    const candidate = studyDateCandidates.find(d => {
      const diff = daysBetween(dates[0], d)
      return diff >= targetDayIndex - 2 && diff <= targetDayIndex + 2
    })
    if (candidate) {
      mockDates.push(candidate)
    }
  }

  if (mockDates.length === 0) {
    const midPoint = Math.floor(studyDateCandidates.length / 2)
    if (midPoint > 0 && midPoint < studyDateCandidates.length) {
      mockDates.push(studyDateCandidates[midPoint])
    }
  }

  return [...new Set(mockDates)].sort()
}

export function calculateSkillPriority(
  weakSkills: StudySkill[],
  strongSkills: StudySkill[],
  mainFocusSkills: StudySkill[],
): StudySkill[] {
  const strongSet = new Set(strongSkills)
  const mainSet = new Set(mainFocusSkills)
  const weakSet = new Set(weakSkills)

  const allSkills: StudySkill[] = [
    'Vocabulary',
    'Reading',
    'Listening',
    'Writing',
    'Speaking',
    'Grammar',
  ]

  const mainOrdered = mainFocusSkills.filter(s => allSkills.includes(s))
  const weakOrdered = weakSkills.filter(s => !mainSet.has(s) && allSkills.includes(s))
  const otherOrdered = allSkills.filter(
    s => !mainSet.has(s) && !weakSet.has(s) && !strongSet.has(s),
  )
  const strongOrdered = strongSkills.filter(
    s => !mainSet.has(s) && !weakSet.has(s) && allSkills.includes(s),
  )

  return [...mainOrdered, ...weakOrdered, ...otherOrdered, ...strongOrdered]
}

export interface DateContinuityResult {
  valid: boolean
  missingDates: string[]
  duplicateDates: string[]
  gaps: Array<{ from: string; to: string }>
}

export function validateDateContinuity(dates: string[]): DateContinuityResult {
  const missingDates: string[] = []
  const duplicateDates: string[] = []
  const gaps: Array<{ from: string; to: string }> = []

  if (dates.length === 0) {
    return { valid: false, missingDates: [], duplicateDates: [], gaps: [] }
  }

  const seen = new Set<string>()
  for (const d of dates) {
    if (seen.has(d)) {
      duplicateDates.push(d)
    } else {
      seen.add(d)
    }
  }

  const sorted = [...new Set(dates)].sort()
  for (let i = 1; i < sorted.length; i++) {
    const expected = addDays(sorted[i - 1], 1)
    if (sorted[i] !== expected) {
      gaps.push({ from: sorted[i - 1], to: sorted[i] })

      let current = expected
      while (current < sorted[i]) {
        missingDates.push(current)
        current = addDays(current, 1)
      }
    }
  }

  return {
    valid: missingDates.length === 0 && duplicateDates.length === 0,
    missingDates,
    duplicateDates,
    gaps,
  }
}

export function calculatePlanMeta(
  profile: StudyPlanUserProfile,
): StudyPlanCalculatedMeta {
  const today = todayDateString()
  const examDate = profile.examDate
  const totalDays = daysBetween(today, examDate) + 1
  const allDates = generateDateRange(today, examDate)
  const studyDaysCount = countStudyDays(allDates, profile.preferredStudyDays)
  const restDaysCount = allDates.length - studyDaysCount
  const totalWeeks = calculateTotalWeeks(totalDays)
  const finalReviewPeriodDays = calculateFinalReviewPeriodDays(
    profile.includeFinalExamPreparationWeek,
  )
  const mockTestSchedule = calculateMockTestSchedule(
    allDates,
    profile.preferredStudyDays,
    profile.includeMockTests,
    totalWeeks,
  )
  const skillPriority = calculateSkillPriority(
    profile.weakSkills,
    profile.strongSkills,
    profile.mainFocusSkills,
  )

  return {
    today,
    examDate,
    totalDays,
    studyDays: studyDaysCount,
    restDaysCount,
    totalWeeks,
    finalReviewPeriodDays,
    mockTestSchedule,
    skillPriority,
  }
}

export function getChunkDates(
  allDates: string[],
  chunkSize: number,
  chunkIndex: number,
): string[] {
  const start = chunkIndex * chunkSize
  const end = start + chunkSize
  return allDates.slice(start, end)
}

export function getChunkDayNumbers(
  allDates: string[],
  chunkSize: number,
  chunkIndex: number,
): number[] {
  const start = chunkIndex * chunkSize
  const end = Math.min(start + chunkSize, allDates.length)
  const numbers: number[] = []
  for (let i = start; i < end; i++) {
    numbers.push(i + 1)
  }
  return numbers
}

export function calculateDefaultChunkSize(
  modelCapacity: 'small' | 'medium' | 'large',
): number {
  switch (modelCapacity) {
    case 'small':
      return 3
    case 'medium':
      return 7
    case 'large':
      return 14
  }
}
