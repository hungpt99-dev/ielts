import type {
  ReviewHistoryEntry,
  ReviewRecord,
  SpacedRepetitionInfo,
} from '../domain/policies'

export interface ReviewStats {
  totalReviews: number
  dueCount: number
  retentionRate: number
  reviewsPerDay: Record<string, number>
}

export interface ReviewRepository {
  getSpacedRepetitionInfo(wordId: string): Promise<SpacedRepetitionInfo | null>
  saveSpacedRepetitionInfo(wordId: string, info: SpacedRepetitionInfo): Promise<void>
  deleteSpacedRepetitionInfo(wordId: string): Promise<void>
  getDueWordIds(limit?: number): Promise<string[]>
  getReviewHistory(wordId: string, limit?: number): Promise<ReviewHistoryEntry[]>

  saveReviewRecord(record: ReviewRecord): Promise<void>
  saveReviewRecords(records: ReviewRecord[]): Promise<void>
  getReviewRecords(wordId: string, limit?: number): Promise<ReviewRecord[]>
  getReviewStats(wordId: string): Promise<ReviewStats>
}
