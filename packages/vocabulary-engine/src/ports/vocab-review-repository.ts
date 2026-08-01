import type { VocabReviewEntry } from '../domain/entities/word'

export interface VocabReviewRepository {
  findAll(): Promise<VocabReviewEntry[]>
  findByVocabularyId(vocabularyId: string): Promise<VocabReviewEntry | undefined>
  bulkUpsert(items: VocabReviewEntry[]): Promise<void>
  findDueReviews(): Promise<VocabReviewEntry[]>
}
