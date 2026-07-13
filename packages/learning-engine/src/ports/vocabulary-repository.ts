export interface VocabularyEntry {
  id: string
  word: string
  meaning: string
  topic?: string
  mastery: number
  dueForReview: boolean
  lastReviewedAt?: string
}

export interface VocabularyRepository {
  getDueForReview(limit?: number): Promise<VocabularyEntry[]>
  getByTopic(topic: string): Promise<VocabularyEntry[]>
  updateMastery(wordId: string, mastery: number): Promise<void>
  markReviewed(wordId: string): Promise<void>
}
