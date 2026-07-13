export interface VocabularyRepository {
  getTotalSaved(): Promise<number>
  getDueForReview(): Promise<number>
  getMastered(): Promise<number>
  getByTopic(): Promise<Record<string, number>>
}
