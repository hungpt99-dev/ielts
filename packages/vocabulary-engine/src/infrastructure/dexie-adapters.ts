import {
  VocabularyRepository as StorageVocabularyRepository,
  VocabReviewRepository as StorageVocabReviewRepository,
} from '@ielts/storage'
import type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'
import type { VocabularyRepository, VocabReviewRepository } from '../ports'

export class DexieVocabularyRepository implements VocabularyRepository {
  private readonly repo: StorageVocabularyRepository

  constructor(repo: StorageVocabularyRepository = new StorageVocabularyRepository()) {
    this.repo = repo
  }

  async findAll(): Promise<VocabularyEntry[]> {
    return this.repo.findAll()
  }

  async findById(id: string): Promise<VocabularyEntry | undefined> {
    return this.repo.findById(id)
  }

  async create(item: Omit<VocabularyEntry, 'id'> & { id?: string }): Promise<VocabularyEntry> {
    return this.repo.create(item)
  }

  async update(id: string, changes: Partial<VocabularyEntry>): Promise<void> {
    return this.repo.update(id, changes)
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id)
  }

  async bulkUpsert(items: VocabularyEntry[]): Promise<void> {
    await this.repo.bulkUpsert(items)
  }

  async findByTopic(topic: string): Promise<VocabularyEntry[]> {
    return this.repo.findByTopic(topic)
  }

  async findByStatus(status: VocabularyEntry['status']): Promise<VocabularyEntry[]> {
    return this.repo.findByStatus(status)
  }

  async findByDifficulty(difficulty: VocabularyEntry['difficulty']): Promise<VocabularyEntry[]> {
    return this.repo.findByDifficulty(difficulty)
  }
}

export class DexieVocabReviewRepository implements VocabReviewRepository {
  private readonly repo: StorageVocabReviewRepository

  constructor(repo: StorageVocabReviewRepository = new StorageVocabReviewRepository()) {
    this.repo = repo
  }

  async findAll(): Promise<VocabReviewEntry[]> {
    return this.repo.findAll()
  }

  async findByVocabularyId(vocabularyId: string): Promise<VocabReviewEntry | undefined> {
    return this.repo.findByVocabularyId(vocabularyId)
  }

  async bulkUpsert(items: VocabReviewEntry[]): Promise<void> {
    await this.repo.bulkUpsert(items)
  }

  async findDueReviews(): Promise<VocabReviewEntry[]> {
    return this.repo.findDueReviews()
  }
}
