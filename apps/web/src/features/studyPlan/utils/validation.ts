import type {
  DailyPlanItem,
  DailyStudyTask,
  PlanChunkRequest,
  PlanPhaseName,
  DayPriority,
  DayDifficulty,
  StudySkill,
  DailyPlanStatus,
  ChunkValidationResult,
  ValidationError,
  StudyPlanCalculatedMeta,
} from '../types'
import type { TaskCategory } from '../../../models'
import { generateDateRange, calculateWeekNumber, daysBetween } from './dateUtils'

export const VALID_PHASE_NAMES: PlanPhaseName[] = [
  'Foundation',
  'Skill Improvement',
  'Weakness Fixing',
  'Mock Test',
  'Final Review',
]

export const VALID_PRIORITIES: DayPriority[] = ['low', 'medium', 'high', 'critical']

export const VALID_DIFFICULTIES: DayDifficulty[] = ['easy', 'medium', 'hard']

export const VALID_SKILLS: StudySkill[] = [
  'Vocabulary',
  'Reading',
  'Listening',
  'Writing',
  'Speaking',
  'Grammar',
]

export const ALLOWED_CATEGORIES: TaskCategory[] = [
  'Vocabulary',
  'Reading',
  'Listening',
  'Writing Task 1',
  'Writing Task 2',
  'Speaking Part 1',
  'Speaking Part 2',
  'Speaking Part 3',
  'Grammar',
  'Mock Test',
]

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const MAX_REASONABLE_MINUTES = 600
const MIN_TITLE_LENGTH = 3
const MIN_GOAL_LENGTH = 5

const TASK_FIELDS = [
  'listeningTask',
  'readingTask',
  'writingTask',
  'speakingTask',
  'vocabularyTask',
  'grammarTask',
  'reviewTask',
] as const

type TaskFieldName = (typeof TASK_FIELDS)[number]

const TASK_FIELD_TO_SKILL: Record<TaskFieldName, StudySkill> = {
  listeningTask: 'Listening',
  readingTask: 'Reading',
  writingTask: 'Writing',
  speakingTask: 'Speaking',
  vocabularyTask: 'Vocabulary',
  grammarTask: 'Grammar',
  reviewTask: 'Grammar',
}

export function validateDateString(date: string): boolean {
  return DATE_REGEX.test(date)
}

export function isValidPhaseName(value: string): value is PlanPhaseName {
  return (VALID_PHASE_NAMES as readonly string[]).includes(value)
}

export function isValidPriority(value: string): value is DayPriority {
  return (VALID_PRIORITIES as readonly string[]).includes(value)
}

export function isValidDifficulty(value: string): value is DayDifficulty {
  return (VALID_DIFFICULTIES as readonly string[]).includes(value)
}

export function isValidSkill(value: string): value is StudySkill {
  return (VALID_SKILLS as readonly string[]).includes(value)
}

export function isValidCategory(value: string): value is TaskCategory {
  return (ALLOWED_CATEGORIES as readonly string[]).includes(value)
}

export function isDateInRange(
  date: string,
  startDate: string,
  endDate: string,
): boolean {
  return date >= startDate && date <= endDate
}

function validateTask(
  task: DailyStudyTask | null,
  fieldName: TaskFieldName,
  dayNumber: number,
  date: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  if (task === null) return errors

  if (!task.title || task.title.length < MIN_TITLE_LENGTH) {
    errors.push({
      field: `${fieldName}.title`,
      message: `Missing or too short title in ${fieldName} for Day ${dayNumber}: "${task.title}".`,
      dayNumber,
      date,
    })
  }

  if (!isValidSkill(task.skill)) {
    errors.push({
      field: `${fieldName}.skill`,
      message: `Invalid skill "${task.skill}" in ${fieldName} for Day ${dayNumber}. Must be one of: ${VALID_SKILLS.join(', ')}.`,
      dayNumber,
      date,
    })
  }

  if (typeof task.estimatedMinutes !== 'number' || task.estimatedMinutes < 1) {
    errors.push({
      field: `${fieldName}.estimatedMinutes`,
      message: `Invalid estimatedMinutes (${task.estimatedMinutes}) in ${fieldName} for Day ${dayNumber}: must be a positive number.`,
      dayNumber,
      date,
    })
  }

  if (!isValidCategory(task.category)) {
    errors.push({
      field: `${fieldName}.category`,
      message: `Invalid category "${task.category}" in ${fieldName} for Day ${dayNumber}. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`,
      dayNumber,
      date,
    })
  }

  return errors
}

export function validateDailyPlanItem(
  day: DailyPlanItem,
  planStartDate?: string,
): ValidationError[] {
  const errors: ValidationError[] = []

  if (!validateDateString(day.date)) {
    errors.push({
      field: 'date',
      message: `Invalid date format for Day ${day.dayNumber}: "${day.date}". Expected YYYY-MM-DD.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
    return errors
  }

  if (typeof day.dayNumber !== 'number' || day.dayNumber < 1) {
    errors.push({
      field: 'dayNumber',
      message: `Invalid or missing dayNumber for date ${day.date}. Expected a positive number.`,
      date: day.date,
    })
  }

  if (typeof day.weekNumber !== 'number' || day.weekNumber < 1) {
    errors.push({
      field: 'weekNumber',
      message: `Invalid or missing weekNumber for Day ${day.dayNumber}. Expected a positive number.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  if (planStartDate) {
    const expectedWeek = calculateWeekNumber(day.date, planStartDate)
    if (day.weekNumber !== expectedWeek) {
      errors.push({
        field: 'weekNumber',
        message: `Week number mismatch for Day ${day.dayNumber} (${day.date}): got ${day.weekNumber}, expected ${expectedWeek}.`,
        dayNumber: day.dayNumber,
        date: day.date,
      })
    }
  }

  if (!isValidPhaseName(day.phaseName)) {
    errors.push({
      field: 'phaseName',
      message: `Invalid phaseName for Day ${day.dayNumber}: "${day.phaseName}". Must be one of: ${VALID_PHASE_NAMES.join(', ')}.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  if (!day.mainGoal || day.mainGoal.length < MIN_GOAL_LENGTH) {
    errors.push({
      field: 'mainGoal',
      message: `Missing or too short mainGoal for Day ${day.dayNumber}.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  if (!isValidPriority(day.priority)) {
    errors.push({
      field: 'priority',
      message: `Invalid priority for Day ${day.dayNumber}: "${day.priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  if (!isValidDifficulty(day.difficulty)) {
    errors.push({
      field: 'difficulty',
      message: `Invalid difficulty for Day ${day.dayNumber}: "${day.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(', ')}.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  if (
    typeof day.estimatedTotalMinutes !== 'number' ||
    day.estimatedTotalMinutes < 0 ||
    day.estimatedTotalMinutes > MAX_REASONABLE_MINUTES
  ) {
    errors.push({
      field: 'estimatedTotalMinutes',
      message: `Invalid estimatedTotalMinutes for Day ${day.dayNumber}: ${day.estimatedTotalMinutes}. Must be between 0 and ${MAX_REASONABLE_MINUTES}.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  const hasAnyTask =
    day.listeningTask !== null ||
    day.readingTask !== null ||
    day.writingTask !== null ||
    day.speakingTask !== null ||
    day.vocabularyTask !== null ||
    day.grammarTask !== null ||
    day.reviewTask !== null

  if (day.estimatedTotalMinutes > 0 && !hasAnyTask) {
    errors.push({
      field: 'tasks',
      message: `Day ${day.dayNumber} has estimatedTotalMinutes > 0 but no tasks assigned.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  if (day.estimatedTotalMinutes === 0 && hasAnyTask) {
    errors.push({
      field: 'tasks',
      message: `Day ${day.dayNumber} has estimatedTotalMinutes === 0 but tasks are assigned.`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  for (const field of TASK_FIELDS) {
    const task = day[field]
    if (task !== null) {
      errors.push(...validateTask(task, field, day.dayNumber, day.date))
    }
  }

  if (!isValidStatus(day.status)) {
    errors.push({
      field: 'status',
      message: `Invalid status for Day ${day.dayNumber}: "${day.status}".`,
      dayNumber: day.dayNumber,
      date: day.date,
    })
  }

  return errors
}

function isValidStatus(value: string): value is DailyPlanStatus {
  const valid: DailyPlanStatus[] = [
    'not-started',
    'in-progress',
    'completed',
    'skipped',
    'partially-completed',
  ]
  return (valid as readonly string[]).includes(value)
}

export function validateChunkDays(
  days: DailyPlanItem[],
  request: PlanChunkRequest,
): ChunkValidationResult {
  const errors: ValidationError[] = []
  const missingDates: string[] = []
  const duplicateDates: string[] = []
  const invalidDays: number[] = []

  const expectedDates = generateDateRange(request.chunkStartDate, request.chunkEndDate)
  const receivedDates = days.map(d => d.date)
  const dateSet = new Set<string>()

  for (const date of receivedDates) {
    if (dateSet.has(date)) {
      duplicateDates.push(date)
    } else {
      dateSet.add(date)
    }
  }

  for (const expectedDate of expectedDates) {
    if (!dateSet.has(expectedDate)) {
      missingDates.push(expectedDate)
    }
  }

  for (const date of receivedDates) {
    if (!expectedDates.includes(date)) {
      errors.push({
        field: 'date',
        message: `Unexpected date outside chunk range: ${date}. Expected range: ${request.chunkStartDate} to ${request.chunkEndDate}.`,
        date,
      })
    }
  }

  for (const day of days) {
    if (!request.chunkDayNumbers.includes(day.dayNumber)) {
      errors.push({
        field: 'dayNumber',
        message: `Day number ${day.dayNumber} for date ${day.date} is not in the requested chunk day range: ${request.chunkDayNumbers.join(', ')}.`,
        dayNumber: day.dayNumber,
        date: day.date,
      })
      invalidDays.push(day.dayNumber)
    }

    const itemErrors = validateDailyPlanItem(day, request.calculatedMeta?.today)
    for (const err of itemErrors) {
      errors.push(err)
      if (err.dayNumber != null) {
        invalidDays.push(err.dayNumber)
      }
    }
  }

  if (days.length > 1) {
    const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber)
    for (let i = 1; i < sorted.length; i++) {
      const diffDays = daysBetween(sorted[i - 1].date, sorted[i].date)
      if (diffDays !== 1) {
        errors.push({
          field: 'dateContinuity',
          message: `Date gap between Day ${sorted[i - 1].dayNumber} (${sorted[i - 1].date}) and Day ${sorted[i].dayNumber} (${sorted[i].date}): ${diffDays} day(s) apart, expected 1.`,
          dayNumber: sorted[i].dayNumber,
          date: sorted[i].date,
        })
        invalidDays.push(sorted[i].dayNumber)
      }
    }
  }

  const uniqueDayNumbers = new Set(days.map(d => d.dayNumber))
  if (uniqueDayNumbers.size !== days.length) {
    const seen = new Set<number>()
    for (const d of days) {
      if (seen.has(d.dayNumber)) {
        errors.push({
          field: 'duplicateDayNumber',
          message: `Duplicate day number: ${d.dayNumber}.`,
          dayNumber: d.dayNumber,
          date: d.date,
        })
        invalidDays.push(d.dayNumber)
      }
      seen.add(d.dayNumber)
    }
  }

  return {
    isValid:
      errors.length === 0 && missingDates.length === 0 && duplicateDates.length === 0,
    errors,
    missingDates,
    duplicateDates,
    invalidDays: [...new Set(invalidDays)],
  }
}

export interface FullPlanValidationResult {
  isValid: boolean
  errors: ValidationError[]
  missingDayNumbers: number[]
  extraDayNumbers: number[]
  duplicateDates: string[]
  duplicateDayNumbers: number[]
  invalidDayNumbers: number[]
  gapDates: Array<{ from: string; to: string; fromDay: number; toDay: number }>
}

export function validateFullPlan(
  dailyPlans: DailyPlanItem[],
  calculatedMeta: StudyPlanCalculatedMeta,
): FullPlanValidationResult {
  const errors: ValidationError[] = []
  const missingDayNumbers: number[] = []
  const extraDayNumbers: number[] = []
  const duplicateDates: string[] = []
  const duplicateDayNumbers: number[] = []
  const invalidDayNumbers: number[] = []
  const gapDates: FullPlanValidationResult['gapDates'] = []

  const expectedDates = generateDateRange(calculatedMeta.today, calculatedMeta.examDate)
  const expectedCount = calculatedMeta.totalDays
  const expectedDayNumbers = Array.from({ length: expectedCount }, (_, i) => i + 1)

  const seenDates = new Map<string, DailyPlanItem>()
  const seenDayNumbers = new Map<number, DailyPlanItem>()

  for (const day of dailyPlans) {
    const itemErrors = validateDailyPlanItem(day, calculatedMeta.today)
    for (const err of itemErrors) {
      errors.push(err)
      if (err.dayNumber != null) {
        invalidDayNumbers.push(err.dayNumber)
      }
    }

    if (seenDates.has(day.date)) {
      duplicateDates.push(day.date)
    }
    seenDates.set(day.date, day)

    if (seenDayNumbers.has(day.dayNumber)) {
      duplicateDayNumbers.push(day.dayNumber)
    }
    seenDayNumbers.set(day.dayNumber, day)

    if (day.date < calculatedMeta.today) {
      errors.push({
        field: 'date',
        message: `Day ${day.dayNumber} date ${day.date} is before today (${calculatedMeta.today}).`,
        dayNumber: day.dayNumber,
        date: day.date,
      })
      invalidDayNumbers.push(day.dayNumber)
    }

    if (day.date > calculatedMeta.examDate) {
      errors.push({
        field: 'date',
        message: `Day ${day.dayNumber} date ${day.date} is after exam date (${calculatedMeta.examDate}).`,
        dayNumber: day.dayNumber,
        date: day.date,
      })
      invalidDayNumbers.push(day.dayNumber)
    }

    if (!expectedDates.includes(day.date)) {
      extraDayNumbers.push(day.dayNumber)
    }
  }

  const generatedDayNumbers = new Set(dailyPlans.map(d => d.dayNumber))
  for (const n of expectedDayNumbers) {
    if (!generatedDayNumbers.has(n)) {
      missingDayNumbers.push(n)
    }
  }

  const generatedDates = new Set(dailyPlans.map(d => d.date))
  for (const expectedDate of expectedDates) {
    if (!generatedDates.has(expectedDate)) {
      errors.push({
        field: 'date',
        message: `Missing expected date: ${expectedDate}.`,
        date: expectedDate,
      })
    }
  }

  if (dailyPlans.length > 0) {
    const sorted = [...dailyPlans]
      .filter(d => !duplicateDates.includes(d.date))
      .sort((a, b) => a.dayNumber - b.dayNumber)

    for (let i = 1; i < sorted.length; i++) {
      const diffDays = daysBetween(sorted[i - 1].date, sorted[i].date)
      if (diffDays !== 1) {
        gapDates.push({
          from: sorted[i - 1].date,
          to: sorted[i].date,
          fromDay: sorted[i - 1].dayNumber,
          toDay: sorted[i].dayNumber,
        })
        errors.push({
          field: 'dateContinuity',
          message: `Gap between Day ${sorted[i - 1].dayNumber} (${sorted[i - 1].date}) and Day ${sorted[i].dayNumber} (${sorted[i].date}): ${diffDays} day(s), expected 1.`,
          dayNumber: sorted[i].dayNumber,
          date: sorted[i].date,
        })
      }
    }
  }

  return {
    isValid:
      errors.length === 0 &&
      missingDayNumbers.length === 0 &&
      extraDayNumbers.length === 0 &&
      duplicateDates.length === 0 &&
      duplicateDayNumbers.length === 0 &&
      gapDates.length === 0,
    errors,
    missingDayNumbers,
    extraDayNumbers,
    duplicateDates,
    duplicateDayNumbers,
    invalidDayNumbers: [...new Set(invalidDayNumbers)],
    gapDates,
  }
}

export function findMissingDayNumbers(
  dailyPlans: DailyPlanItem[],
  calculatedMeta: StudyPlanCalculatedMeta,
): number[] {
  const generated = new Set(dailyPlans.map(d => d.dayNumber))
  const missing: number[] = []
  for (let i = 1; i <= calculatedMeta.totalDays; i++) {
    if (!generated.has(i)) {
      missing.push(i)
    }
  }
  return missing
}

export function findMissingDates(
  dailyPlans: DailyPlanItem[],
  calculatedMeta: StudyPlanCalculatedMeta,
): string[] {
  const expectedDates = generateDateRange(calculatedMeta.today, calculatedMeta.examDate)
  const generatedDates = new Set(dailyPlans.map(d => d.date))
  return expectedDates.filter(d => !generatedDates.has(d))
}

export function findDuplicateDayNumbers(dailyPlans: DailyPlanItem[]): number[] {
  const seen = new Set<number>()
  const duplicates: number[] = []
  for (const d of dailyPlans) {
    if (seen.has(d.dayNumber)) {
      duplicates.push(d.dayNumber)
    }
    seen.add(d.dayNumber)
  }
  return [...new Set(duplicates)]
}

export function findInvalidDayNumbers(dailyPlans: DailyPlanItem[]): number[] {
  const invalid: number[] = []
  for (const day of dailyPlans) {
    const errors = validateDailyPlanItem(day)
    if (errors.length > 0) {
      invalid.push(day.dayNumber)
    }
  }
  return [...new Set(invalid)]
}

export function findDaysNeedingRetry(
  dailyPlans: DailyPlanItem[],
  calculatedMeta: StudyPlanCalculatedMeta,
): Array<{ dayNumber: number; date: string | null; reasons: string[] }> {
  const needsRetry: Array<{ dayNumber: number; date: string | null; reasons: string[] }> = []

  const missingDays = findMissingDayNumbers(dailyPlans, calculatedMeta)
  const expectedDates = generateDateRange(calculatedMeta.today, calculatedMeta.examDate)

  for (const dayNumber of missingDays) {
    const dateIndex = dayNumber - 1
    const date = dateIndex >= 0 && dateIndex < expectedDates.length ? expectedDates[dateIndex] : null
    needsRetry.push({
      dayNumber,
      date,
      reasons: ['Missing day'],
    })
  }

  for (const day of dailyPlans) {
    const errors = validateDailyPlanItem(day, calculatedMeta.today)
    if (errors.length > 0) {
      needsRetry.push({
        dayNumber: day.dayNumber,
        date: day.date,
        reasons: errors.map(e => `${e.field}: ${e.message}`),
      })
    }
  }

  return needsRetry
}

export interface RequiredDayRange {
  startDayNumber: number
  endDayNumber: number
  startDate: string
  endDate: string
  dayNumbers: number[]
}

export function findMissingRanges(
  dailyPlans: DailyPlanItem[],
  calculatedMeta: StudyPlanCalculatedMeta,
  chunkSize: number,
): RequiredDayRange[] {
  const missingDayNumbers = findMissingDayNumbers(dailyPlans, calculatedMeta)
  if (missingDayNumbers.length === 0) return []

  const expectedDates = generateDateRange(calculatedMeta.today, calculatedMeta.examDate)

  missingDayNumbers.sort((a, b) => a - b)

  const ranges: RequiredDayRange[] = []
  let rangeStart = missingDayNumbers[0]

  for (let i = 0; i < missingDayNumbers.length; i++) {
    const current = missingDayNumbers[i]
    const next = missingDayNumbers[i + 1]

    if (next !== current + 1) {
      const dayNumbers: number[] = []
      for (let n = rangeStart; n <= current; n++) {
        dayNumbers.push(n)
      }

      while (dayNumbers.length > 0) {
        const chunk = dayNumbers.splice(0, chunkSize)
        ranges.push({
          startDayNumber: chunk[0],
          endDayNumber: chunk[chunk.length - 1],
          startDate: expectedDates[chunk[0] - 1],
          endDate: expectedDates[chunk[chunk.length - 1] - 1],
          dayNumbers: chunk,
        })
      }

      rangeStart = next
    }
  }

  if (rangeStart != null && missingDayNumbers.length > 0) {
    const last = missingDayNumbers[missingDayNumbers.length - 1]
    if (rangeStart <= last) {
      const dayNumbers: number[] = []
      for (let n = rangeStart; n <= last; n++) {
        dayNumbers.push(n)
      }
      while (dayNumbers.length > 0) {
        const chunk = dayNumbers.splice(0, chunkSize)
        ranges.push({
          startDayNumber: chunk[0],
          endDayNumber: chunk[chunk.length - 1],
          startDate: expectedDates[chunk[0] - 1],
          endDate: expectedDates[chunk[chunk.length - 1] - 1],
          dayNumbers: chunk,
        })
      }
    }
  }

  return ranges
}

export function validateNoExamDateOverlap(
  dailyPlans: DailyPlanItem[],
  examDate: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  for (const day of dailyPlans) {
    if (day.date > examDate) {
      errors.push({
        field: 'date',
        message: `Day ${day.dayNumber} has date ${day.date} after exam date ${examDate}.`,
        dayNumber: day.dayNumber,
        date: day.date,
      })
    }
  }
  return errors
}

export function validateNoDuplicateDates(dailyPlans: DailyPlanItem[]): ValidationError[] {
  const errors: ValidationError[] = []
  const seen = new Map<string, number>()
  for (const day of dailyPlans) {
    if (seen.has(day.date)) {
      errors.push({
        field: 'duplicateDate',
        message: `Duplicate date ${day.date} for Day ${day.dayNumber} (also seen for Day ${seen.get(day.date)}).`,
        dayNumber: day.dayNumber,
        date: day.date,
      })
    }
    seen.set(day.date, day.dayNumber)
  }
  return errors
}
