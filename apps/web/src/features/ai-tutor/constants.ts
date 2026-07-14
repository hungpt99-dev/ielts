import { STORAGE_KEYS } from '@ielts/config'

export const AI_TUTOR_CACHE = {
  PROGRESS_REVIEW_TTL_MS: 86_400_000,
  PROGRESS_REVIEW_STORAGE_KEY: STORAGE_KEYS.localStorage.aiProgressReviewCache,
} as const

export const AI_TUTOR_REFRESH = {
  SAFETY_TIMEOUT_MS: 120_000,
} as const
