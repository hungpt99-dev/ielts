export const IELTS_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const
export type IeltsSkill = (typeof IELTS_SKILLS)[number]

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export const BAND_MIN = 0
export const BAND_MAX = 9
export const BAND_STEP = 0.5

export const EXERCISE_TYPES = [
  'multiple-choice',
  'true-false-not-given',
  'gap-fill',
  'matching',
  'short-answer',
  'essay',
  'speaking-response',
] as const
