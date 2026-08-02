// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — ReviewRecord
// ═══════════════════════════════════════════════════════════════════════

import { createId, nowIso } from './common'

export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5

export type ReviewContext = 'FLASHCARD' | 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'

export type ReviewMode = 'MANUAL' | 'SPACED_REPETITION' | 'RECALL' | 'MIXED'

export interface ReviewRecord {
  id: string
  wordId: string
  reviewedAt: string
  rating: ReviewRating
  responseTimeMs: number
  confidenceScore: number
  reviewMode: ReviewMode
  context: ReviewContext
  mistakes?: string[]
}

export function createReviewRecord(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    id: createId(),
    wordId: '',
    reviewedAt: nowIso(),
    rating: 0,
    responseTimeMs: 0,
    confidenceScore: 0,
    reviewMode: 'MANUAL',
    context: 'FLASHCARD',
    ...overrides,
  }
}
