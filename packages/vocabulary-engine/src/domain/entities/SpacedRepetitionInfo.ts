// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — SpacedRepetitionInfo
// ═══════════════════════════════════════════════════════════════════════

import type { ReviewRating, ReviewRecord } from './ReviewRecord'
import { createId, nowIso } from './common'

export interface SpacedRepetitionInfo {
  id: string
  wordId: string
  interval: number
  easeFactor: number
  repetitions: number
  lastReviewedAt: string
  nextReviewAt: string
  stability: number
  difficultyRating: number
  recallProbability: number
  avgResponseTimeMs: number
  totalReviews: number
  consecutiveCorrect: number
  lastRating: ReviewRating
  reviewHistory: ReviewRecord[]
}

export function createSpacedRepetitionInfo(
  overrides: Partial<SpacedRepetitionInfo> = {},
): SpacedRepetitionInfo {
  return {
    id: createId(),
    wordId: '',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    lastReviewedAt: '',
    nextReviewAt: nowIso(),
    stability: 0,
    difficultyRating: 0.5,
    recallProbability: 0,
    avgResponseTimeMs: 0,
    totalReviews: 0,
    consecutiveCorrect: 0,
    lastRating: 0,
    reviewHistory: [],
    ...overrides,
  }
}
