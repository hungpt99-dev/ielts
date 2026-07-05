import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateDateString,
  isValidPhaseName,
  isValidPriority,
  isValidDifficulty,
  isValidSkill,
  isValidCategory,
  isDateInRange,
  validateDailyPlanItem,
  validateChunkDays,
  validateFullPlan,
  findMissingDayNumbers,
  findMissingDates,
  findDuplicateDayNumbers,
  findInvalidDayNumbers,
  findDaysNeedingRetry,
  findMissingRanges,
  validateNoExamDateOverlap,
  validateNoDuplicateDates,
  VALID_PHASE_NAMES,
  VALID_PRIORITIES,
  VALID_DIFFICULTIES,
  VALID_SKILLS,
  ALLOWED_CATEGORIES,
} from '../validation'
import type {
  DailyPlanItem,
  PlanChunkRequest,
  StudyPlanCalculatedMeta,
  DailyStudyTask,
  StudyPlanUserProfile,
  PlanPhaseName,
} from '../../types'
import type { TaskCategory } from '../../../../models'

function createMockTask(overrides: Partial<DailyStudyTask> = {}): DailyStudyTask {
  return {
    id: 'task-1',
    skill: 'Vocabulary',
    title: 'Learn 20 new IELTS words',
    description: 'Study vocabulary list',
    estimatedMinutes: 20,
    category: 'Vocabulary',
    isCompleted: false,
    notes: '',
    ...overrides,
  }
}

function createMockDay(overrides: Partial<DailyPlanItem> = {}): DailyPlanItem {
  const now = new Date().toISOString()
  return {
    id: 'day-1',
    planId: 'plan-1',
    date: '2026-01-01',
    dayNumber: 1,
    weekNumber: 1,
    phaseName: 'Foundation',
    mainGoal: 'Build core understanding of IELTS format',
    listeningTask: null,
    readingTask: null,
    writingTask: null,
    speakingTask: null,
    vocabularyTask: createMockTask(),
    grammarTask: null,
    reviewTask: null,
    optionalTasks: [],
    estimatedTotalMinutes: 60,
    priority: 'medium',
    difficulty: 'medium',
    status: 'not-started',
    aiTutorNote: 'Focus on foundational skills today',
    completionChecklist: ['Complete all tasks'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

const mockMeta: StudyPlanCalculatedMeta = {
  today: '2026-01-01',
  examDate: '2026-01-15',
  totalDays: 15,
  studyDays: 11,
  restDaysCount: 4,
  totalWeeks: 3,
  finalReviewPeriodDays: 7,
  mockTestSchedule: ['2026-01-08'],
  skillPriority: ['Listening', 'Reading', 'Writing', 'Vocabulary', 'Grammar', 'Speaking'],
}

function createMockChunkRequest(overrides: Partial<PlanChunkRequest> = {}): PlanChunkRequest {
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
    studyGoal: 'academic',
    preferredTopics: [],
  }

  return {
    userProfile: profile,
    calculatedMeta: mockMeta,
    globalStrategy: {
      planSummary: 'A focused 15-day IELTS plan',
      phaseBreakdown: [
        { phaseName: 'Foundation', description: '', startDate: '2026-01-01', endDate: '2026-01-07', weekCount: 1, mainFocus: '', targetSkill: 'all', weeklyGoals: [] },
        { phaseName: 'Skill Improvement', description: '', startDate: '2026-01-08', endDate: '2026-01-14', weekCount: 1, mainFocus: '', targetSkill: 'Listening', weeklyGoals: [] },
      ],
      weeklyGoals: [],
      mockTestSchedule: [],
      finalWeekStrategy: '',
      adjustmentRules: [],
      createdAt: new Date().toISOString(),
    },
    alreadyGeneratedDays: [],
    chunkStartDate: '2026-01-01',
    chunkEndDate: '2026-01-03',
    chunkDayNumbers: [1, 2, 3],
    chunkIndex: 0,
    totalChunks: 5,
    previousChunkSummary: null,
    ...overrides,
  }
}

beforeEach(() => {
  const fixed = new Date('2026-01-01T00:00:00.000Z')
  vi.useFakeTimers()
  vi.setSystemTime(fixed)
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── Constants ───────────────────────────────────────────────

describe('constants', () => {
  it('VALID_PHASE_NAMES has correct values', () => {
    expect(VALID_PHASE_NAMES).toEqual([
      'Foundation',
      'Skill Improvement',
      'Weakness Fixing',
      'Mock Test',
      'Final Review',
    ])
  })

  it('VALID_PRIORITIES has correct values', () => {
    expect(VALID_PRIORITIES).toEqual(['low', 'medium', 'high', 'critical'])
  })

  it('VALID_DIFFICULTIES has correct values', () => {
    expect(VALID_DIFFICULTIES).toEqual(['easy', 'medium', 'hard'])
  })

  it('VALID_SKILLS has correct values', () => {
    expect(VALID_SKILLS).toEqual([
      'Vocabulary', 'Reading', 'Listening', 'Writing', 'Speaking', 'Grammar',
    ])
  })

  it('ALLOWED_CATEGORIES includes mock test', () => {
    expect(ALLOWED_CATEGORIES).toContain('Mock Test')
    expect(ALLOWED_CATEGORIES).toContain('Vocabulary')
    expect(ALLOWED_CATEGORIES).toContain('Reading')
  })
})

// ─── Simple validators ──────────────────────────────────────

describe('validateDateString', () => {
  it('accepts valid YYYY-MM-DD', () => {
    expect(validateDateString('2026-01-15')).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(validateDateString('2026/01/15')).toBe(false)
    expect(validateDateString('15-01-2026')).toBe(false)
    expect(validateDateString('2026-1-1')).toBe(false)
    expect(validateDateString('')).toBe(false)
    expect(validateDateString('not-a-date')).toBe(false)
  })

  it('rejects partial date', () => {
    expect(validateDateString('2026-01')).toBe(false)
    expect(validateDateString('2026-01-')).toBe(false)
  })
})

describe('isValidPhaseName', () => {
  it('accepts valid phase names', () => {
    expect(isValidPhaseName('Foundation')).toBe(true)
    expect(isValidPhaseName('Skill Improvement')).toBe(true)
    expect(isValidPhaseName('Weakness Fixing')).toBe(true)
    expect(isValidPhaseName('Mock Test')).toBe(true)
    expect(isValidPhaseName('Final Review')).toBe(true)
  })

  it('rejects invalid phase names', () => {
    expect(isValidPhaseName('Invalid')).toBe(false)
    expect(isValidPhaseName('')).toBe(false)
    expect(isValidPhaseName('foundation')).toBe(false)
  })
})

describe('isValidPriority', () => {
  it('accepts valid priorities', () => {
    expect(isValidPriority('low')).toBe(true)
    expect(isValidPriority('medium')).toBe(true)
    expect(isValidPriority('high')).toBe(true)
    expect(isValidPriority('critical')).toBe(true)
  })

  it('rejects invalid priorities', () => {
    expect(isValidPriority('urgent')).toBe(false)
    expect(isValidPriority('')).toBe(false)
  })
})

describe('isValidDifficulty', () => {
  it('accepts valid difficulties', () => {
    expect(isValidDifficulty('easy')).toBe(true)
    expect(isValidDifficulty('medium')).toBe(true)
    expect(isValidDifficulty('hard')).toBe(true)
  })

  it('rejects invalid difficulties', () => {
    expect(isValidDifficulty('expert')).toBe(false)
    expect(isValidDifficulty('')).toBe(false)
  })
})

describe('isValidSkill', () => {
  it('accepts valid skills', () => {
    expect(isValidSkill('Vocabulary')).toBe(true)
    expect(isValidSkill('Reading')).toBe(true)
    expect(isValidSkill('Writing')).toBe(true)
  })

  it('rejects invalid skills', () => {
    expect(isValidSkill('Cooking')).toBe(false)
    expect(isValidSkill('')).toBe(false)
  })
})

describe('isValidCategory', () => {
  it('accepts valid categories', () => {
    expect(isValidCategory('Vocabulary')).toBe(true)
    expect(isValidCategory('Writing Task 1')).toBe(true)
    expect(isValidCategory('Mock Test')).toBe(true)
  })

  it('rejects invalid categories', () => {
    expect(isValidCategory('Cooking')).toBe(false)
    expect(isValidCategory('')).toBe(false)
  })
})

describe('isDateInRange', () => {
  it('returns true for dates within range', () => {
    expect(isDateInRange('2026-01-03', '2026-01-01', '2026-01-10')).toBe(true)
  })

  it('returns true for start date', () => {
    expect(isDateInRange('2026-01-01', '2026-01-01', '2026-01-10')).toBe(true)
  })

  it('returns true for end date', () => {
    expect(isDateInRange('2026-01-10', '2026-01-01', '2026-01-10')).toBe(true)
  })

  it('returns false for date before range', () => {
    expect(isDateInRange('2025-12-31', '2026-01-01', '2026-01-10')).toBe(false)
  })

  it('returns false for date after range', () => {
    expect(isDateInRange('2026-01-11', '2026-01-01', '2026-01-10')).toBe(false)
  })
})

// ─── validateDailyPlanItem ──────────────────────────────────

describe('validateDailyPlanItem', () => {
  it('returns no errors for a valid day', () => {
    const day = createMockDay()
    const errors = validateDailyPlanItem(day)
    expect(errors).toEqual([])
  })

  it('returns no errors for a valid rest day (zero minutes, no tasks)', () => {
    const day = createMockDay({
      estimatedTotalMinutes: 0,
      priority: 'low',
      difficulty: 'easy',
      vocabularyTask: null,
    })
    const errors = validateDailyPlanItem(day)
    expect(errors).toEqual([])
  })

  it('returns error for invalid date format', () => {
    const day = createMockDay({ date: '2026/01/01' })
    const errors = validateDailyPlanItem(day)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].field).toBe('date')
  })

  it('returns error for missing dayNumber', () => {
    const day = createMockDay({ dayNumber: 0 })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'dayNumber')).toBe(true)
  })

  it('returns error for negative dayNumber', () => {
    const day = createMockDay({ dayNumber: -1 })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'dayNumber')).toBe(true)
  })

  it('returns error for invalid weekNumber', () => {
    const day = createMockDay({ weekNumber: 0 })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'weekNumber')).toBe(true)
  })

  it('returns error for week number mismatch when planStartDate provided', () => {
    const day = createMockDay({ dayNumber: 8, date: '2026-01-08', weekNumber: 1 })
    const errors = validateDailyPlanItem(day, '2026-01-01')
    expect(errors.some(e => e.field === 'weekNumber')).toBe(true)
  })

  it('passes week number check when correct', () => {
    const day = createMockDay({ dayNumber: 8, date: '2026-01-08', weekNumber: 2 })
    const errors = validateDailyPlanItem(day, '2026-01-01')
    expect(errors.some(e => e.field === 'weekNumber')).toBe(false)
  })

  it('returns error for invalid phaseName', () => {
    const day = createMockDay({ phaseName: 'Invalid' as PlanPhaseName })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'phaseName')).toBe(true)
  })

  it('returns error for missing mainGoal', () => {
    const day = createMockDay({ mainGoal: '' })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'mainGoal')).toBe(true)
  })

  it('returns error for too short mainGoal', () => {
    const day = createMockDay({ mainGoal: 'Hi' })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'mainGoal')).toBe(true)
  })

  it('returns error for invalid priority', () => {
    const day = createMockDay({ priority: 'urgent' as 'medium' })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'priority')).toBe(true)
  })

  it('returns error for invalid difficulty', () => {
    const day = createMockDay({ difficulty: 'expert' as 'medium' })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'difficulty')).toBe(true)
  })

  it('returns error for negative estimatedTotalMinutes', () => {
    const day = createMockDay({ estimatedTotalMinutes: -1 })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'estimatedTotalMinutes')).toBe(true)
  })

  it('returns error for excessive estimatedTotalMinutes', () => {
    const day = createMockDay({ estimatedTotalMinutes: 9999 })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'estimatedTotalMinutes')).toBe(true)
  })

  it('returns error when minutes > 0 but no tasks', () => {
    const day = createMockDay({
      estimatedTotalMinutes: 60,
      vocabularyTask: null,
    })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'tasks')).toBe(true)
  })

  it('returns error when minutes === 0 but tasks present', () => {
    const day = createMockDay({
      estimatedTotalMinutes: 0,
      vocabularyTask: createMockTask(),
    })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'tasks')).toBe(true)
  })

  it('validates task title', () => {
    const day = createMockDay({
      vocabularyTask: createMockTask({ title: 'AB' }),
    })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'vocabularyTask.title')).toBe(true)
  })

  it('validates task skill', () => {
    const day = createMockDay({
      vocabularyTask: createMockTask({ skill: 'Cooking' as 'Vocabulary' }),
    })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'vocabularyTask.skill')).toBe(true)
  })

  it('validates task estimatedMinutes', () => {
    const day = createMockDay({
      vocabularyTask: createMockTask({ estimatedMinutes: 0 }),
    })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'vocabularyTask.estimatedMinutes')).toBe(true)
  })

  it('validates task category', () => {
    const day = createMockDay({
      vocabularyTask: createMockTask({ category: 'Cooking' as TaskCategory }),
    })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'vocabularyTask.category')).toBe(true)
  })

  it('returns error for invalid status', () => {
    const day = createMockDay({ status: 'unknown-status' as 'not-started' })
    const errors = validateDailyPlanItem(day)
    expect(errors.some(e => e.field === 'status')).toBe(true)
  })

  it('passes with all task fields filled', () => {
    const day = createMockDay({
      listeningTask: createMockTask({ skill: 'Listening', category: 'Listening' }),
      readingTask: createMockTask({ skill: 'Reading', category: 'Reading' }),
      writingTask: createMockTask({ skill: 'Writing', category: 'Writing Task 1' }),
      speakingTask: createMockTask({ skill: 'Speaking', category: 'Speaking Part 1' }),
      vocabularyTask: createMockTask({ skill: 'Vocabulary', category: 'Vocabulary' }),
      grammarTask: createMockTask({ skill: 'Grammar', category: 'Grammar' }),
      reviewTask: createMockTask({ skill: 'Grammar', category: 'Grammar', title: 'Review mistakes' }),
      estimatedTotalMinutes: 140,
    })
    const errors = validateDailyPlanItem(day)
    expect(errors).toEqual([])
  })
})

// ─── validateChunkDays ──────────────────────────────────────

describe('validateChunkDays', () => {
  it('returns valid for correct chunk', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 2, date: '2026-01-02', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-03', weekNumber: 1 }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.missingDates).toEqual([])
    expect(result.duplicateDates).toEqual([])
  })

  it('detects missing dates', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-03', weekNumber: 1 }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(false)
    expect(result.missingDates).toContain('2026-01-02')
  })

  it('detects duplicate dates', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 2, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-03', weekNumber: 1 }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(false)
    expect(result.duplicateDates).toContain('2026-01-01')
  })

  it('detects date outside chunk range', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 4, date: '2026-01-04', weekNumber: 1 }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.message.includes('Unexpected date'))).toBe(true)
  })

  it('detects day number outside chunk range', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 5, date: '2026-01-02', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-03', weekNumber: 1 }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'dayNumber')).toBe(true)
  })

  it('detects date continuity gap within chunk', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-03', weekNumber: 1 }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'dateContinuity')).toBe(true)
  })

  it('detects duplicate day numbers', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 1, date: '2026-01-02', weekNumber: 1 }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'duplicateDayNumber')).toBe(true)
  })

  it('includes individual day validation errors', () => {
    const request = createMockChunkRequest()
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1, phaseName: 'Invalid' as PlanPhaseName }),
    ]
    const result = validateChunkDays(days, request)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'phaseName')).toBe(true)
  })

  it('handles empty days array', () => {
    const request = createMockChunkRequest()
    const result = validateChunkDays([], request)
    expect(result.isValid).toBe(false)
    expect(result.missingDates.length).toBe(3)
  })
})

// ─── validateFullPlan ───────────────────────────────────────

describe('validateFullPlan', () => {
  it('returns valid for complete valid plan', () => {
    const days = Array.from({ length: 15 }, (_, i) =>
      createMockDay({
        dayNumber: i + 1,
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        weekNumber: Math.floor(i / 7) + 1,
        phaseName: i < 7 ? 'Foundation' : 'Skill Improvement',
      }),
    )
    const result = validateFullPlan(days, mockMeta)
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.missingDayNumbers).toEqual([])
  })

  it('detects missing day numbers', () => {
    const days = Array.from({ length: 14 }, (_, i) =>
      createMockDay({
        dayNumber: i + 1,
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        weekNumber: Math.floor(i / 7) + 1,
        phaseName: i < 7 ? 'Foundation' : 'Skill Improvement',
      }),
    )
    const result = validateFullPlan(days, mockMeta)
    expect(result.isValid).toBe(false)
    expect(result.missingDayNumbers).toContain(15)
  })

  it('detects duplicate dates', () => {
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 2, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-02', weekNumber: 1 }),
    ]
    const result = validateFullPlan(days, mockMeta)
    expect(result.duplicateDates).toContain('2026-01-01')
  })

  it('detects duplicate day numbers', () => {
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 1, date: '2026-01-02', weekNumber: 1 }),
    ]
    const result = validateFullPlan(days, mockMeta)
    expect(result.duplicateDayNumbers).toContain(1)
  })

  it('detects date before today', () => {
    const days = [
      createMockDay({ dayNumber: 1, date: '2025-12-31', weekNumber: 1 }),
    ]
    const result = validateFullPlan(days, mockMeta)
    expect(result.errors.some(e => e.message.includes('before today'))).toBe(true)
  })

  it('detects date after exam date', () => {
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-16', weekNumber: 1 }),
    ]
    const result = validateFullPlan(days, mockMeta)
    expect(result.errors.some(e => e.message.includes('after exam date'))).toBe(true)
  })

  it('detects gap dates', () => {
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-03', weekNumber: 1 }),
    ]
    const result = validateFullPlan(days, mockMeta)
    expect(result.gapDates.length).toBeGreaterThan(0)
    expect(result.errors.some(e => e.field === 'dateContinuity')).toBe(true)
  })

  it('handles empty plan', () => {
    const result = validateFullPlan([], mockMeta)
    expect(result.isValid).toBe(false)
    expect(result.missingDayNumbers.length).toBe(15)
  })
})

// ─── findMissingDayNumbers ──────────────────────────────────

describe('findMissingDayNumbers', () => {
  it('returns empty for complete plan', () => {
    const days = Array.from({ length: 15 }, (_, i) =>
      createMockDay({ dayNumber: i + 1 }),
    )
    expect(findMissingDayNumbers(days, mockMeta)).toEqual([])
  })

  it('finds missing day numbers', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 3 }),
      createMockDay({ dayNumber: 5 }),
    ]
    const result = findMissingDayNumbers(days, mockMeta)
    expect(result).toContain(2)
    expect(result).toContain(4)
    expect(result).not.toContain(1)
    expect(result).not.toContain(3)
  })

  it('handles empty plan', () => {
    const result = findMissingDayNumbers([], mockMeta)
    expect(result.length).toBe(15)
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  })
})

// ─── findMissingDates ───────────────────────────────────────

describe('findMissingDates', () => {
  it('returns empty for complete plan', () => {
    const days = Array.from({ length: 15 }, (_, i) =>
      createMockDay({
        dayNumber: i + 1,
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
      }),
    )
    expect(findMissingDates(days, mockMeta)).toEqual([])
  })

  it('finds missing dates', () => {
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01' }),
      createMockDay({ dayNumber: 2, date: '2026-01-03' }),
    ]
    const result = findMissingDates(days, mockMeta)
    expect(result).toContain('2026-01-02')
  })
})

// ─── findDuplicateDayNumbers ────────────────────────────────

describe('findDuplicateDayNumbers', () => {
  it('returns empty when no duplicates', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2 }),
      createMockDay({ dayNumber: 3 }),
    ]
    expect(findDuplicateDayNumbers(days)).toEqual([])
  })

  it('detects duplicate day numbers', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2 }),
    ]
    expect(findDuplicateDayNumbers(days)).toEqual([1])
  })

  it('handles multiple duplicates', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2 }),
      createMockDay({ dayNumber: 2 }),
    ]
    const result = findDuplicateDayNumbers(days)
    expect(result).toContain(1)
    expect(result).toContain(2)
  })
})

// ─── findInvalidDayNumbers ──────────────────────────────────

describe('findInvalidDayNumbers', () => {
  it('returns empty for all valid days', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2 }),
    ]
    expect(findInvalidDayNumbers(days)).toEqual([])
  })

  it('detects invalid days', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2, phaseName: 'Invalid' as PlanPhaseName }),
    ]
    expect(findInvalidDayNumbers(days)).toEqual([2])
  })
})

// ─── findDaysNeedingRetry ───────────────────────────────────

describe('findDaysNeedingRetry', () => {
  it('returns empty for complete valid plan', () => {
    const days = Array.from({ length: 15 }, (_, i) =>
      createMockDay({
        dayNumber: i + 1,
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        weekNumber: Math.floor(i / 7) + 1,
      }),
    )
    expect(findDaysNeedingRetry(days, mockMeta)).toEqual([])
  })

  it('finds missing days', () => {
    const days = [
      createMockDay({ dayNumber: 1, date: '2026-01-01', weekNumber: 1 }),
      createMockDay({ dayNumber: 3, date: '2026-01-03', weekNumber: 1 }),
    ]
    const result = findDaysNeedingRetry(days, mockMeta)
    expect(result.some(r => r.dayNumber === 2)).toBe(true)
    expect(result.some(r => r.date === '2026-01-02')).toBe(true)
  })

  it('finds invalid days and includes reasons', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2, phaseName: 'Invalid' as PlanPhaseName }),
    ]
    const result = findDaysNeedingRetry(days, mockMeta)
    const day2 = result.find(r => r.dayNumber === 2)
    expect(day2).toBeDefined()
    expect(day2!.reasons.length).toBeGreaterThan(0)
  })
})

// ─── findMissingRanges ──────────────────────────────────────

describe('findMissingRanges', () => {
  it('returns empty for complete plan', () => {
    const days = Array.from({ length: 15 }, (_, i) =>
      createMockDay({ dayNumber: i + 1 }),
    )
    expect(findMissingRanges(days, mockMeta, 3)).toEqual([])
  })

  it('finds single missing range', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2 }),
    ]
    const ranges = findMissingRanges(days, mockMeta, 3)
    expect(ranges.length).toBeGreaterThan(0)
    expect(ranges[0].startDayNumber).toBe(3)
    expect(ranges[0].endDayNumber).toBe(5)
    expect(ranges[0].dayNumbers).toEqual([3, 4, 5])
  })

  it('splits large missing range into chunk-sized pieces', () => {
    const days: DailyPlanItem[] = []
    const ranges = findMissingRanges(days, mockMeta, 3)
    expect(ranges.length).toBe(5)
    expect(ranges[0].dayNumbers).toEqual([1, 2, 3])
    expect(ranges[1].dayNumbers).toEqual([4, 5, 6])
    expect(ranges[4].dayNumbers).toEqual([13, 14, 15])
  })

  it('handles non-contiguous missing ranges', () => {
    const days = [
      createMockDay({ dayNumber: 1 }),
      createMockDay({ dayNumber: 2 }),
      createMockDay({ dayNumber: 5 }),
      createMockDay({ dayNumber: 6 }),
    ]
    const ranges = findMissingRanges(days, mockMeta, 2)
    const dayNumbers = ranges.flatMap(r => r.dayNumbers)
    expect(dayNumbers).toContain(3)
    expect(dayNumbers).toContain(4)
  })
})

// ─── validateNoExamDateOverlap ──────────────────────────────

describe('validateNoExamDateOverlap', () => {
  it('returns empty for days within exam date', () => {
    const days = [
      createMockDay({ date: '2026-01-14' }),
      createMockDay({ date: '2026-01-15' }),
    ]
    expect(validateNoExamDateOverlap(days, '2026-01-15')).toEqual([])
  })

  it('detects days after exam date', () => {
    const days = [
      createMockDay({ date: '2026-01-16', dayNumber: 16 }),
    ]
    const errors = validateNoExamDateOverlap(days, '2026-01-15')
    expect(errors.length).toBeGreaterThan(0)
  })
})

// ─── validateNoDuplicateDates ───────────────────────────────

describe('validateNoDuplicateDates', () => {
  it('returns empty for unique dates', () => {
    const days = [
      createMockDay({ date: '2026-01-01' }),
      createMockDay({ date: '2026-01-02' }),
    ]
    expect(validateNoDuplicateDates(days)).toEqual([])
  })

  it('detects duplicate dates', () => {
    const days = [
      createMockDay({ date: '2026-01-01', dayNumber: 1 }),
      createMockDay({ date: '2026-01-01', dayNumber: 2 }),
    ]
    const errors = validateNoDuplicateDates(days)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].field).toBe('duplicateDate')
  })
})
