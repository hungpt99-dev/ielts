import type { VocabularyEntry } from '../domain/entities/word'

export interface VocabularyRepository {
  findAll(): Promise<VocabularyEntry[]>
  findById(id: string): Promise<VocabularyEntry | undefined>
  create(item: Omit<VocabularyEntry, 'id'> & { id?: string }): Promise<VocabularyEntry>
  update(id: string, changes: Partial<VocabularyEntry>): Promise<void>
  delete(id: string): Promise<void>
  bulkUpsert(items: VocabularyEntry[]): Promise<void>
  findByTopic(topic: string): Promise<VocabularyEntry[]>
  findByStatus(status: VocabularyEntry['status']): Promise<VocabularyEntry[]>
  findByDifficulty(difficulty: VocabularyEntry['difficulty']): Promise<VocabularyEntry[]>
}
