import type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'
import type { VocabularyRepository, VocabReviewRepository } from '../ports'

export class InMemoryVocabularyRepository implements VocabularyRepository {
  private readonly store = new Map<string, VocabularyEntry>()

  async findAll(): Promise<VocabularyEntry[]> {
    return Array.from(this.store.values())
  }

  async findById(id: string): Promise<VocabularyEntry | undefined> {
    return this.store.get(id)
  }

  async create(item: Omit<VocabularyEntry, 'id'> & { id?: string }): Promise<VocabularyEntry> {
    const now = new Date().toISOString()
    const entry: VocabularyEntry = {
      ...item,
      id: item.id ?? crypto.randomUUID(),
      createdAt: item.createdAt ?? now,
      updatedAt: item.updatedAt ?? now,
    } as VocabularyEntry
    this.store.set(entry.id, entry)
    return entry
  }

  async update(id: string, changes: Partial<VocabularyEntry>): Promise<void> {
    const existing = this.store.get(id)
    if (!existing) return
    this.store.set(id, { ...existing, ...changes, updatedAt: new Date().toISOString() })
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }

  async bulkUpsert(items: VocabularyEntry[]): Promise<void> {
    for (const item of items) {
      this.store.set(item.id, item)
    }
  }

  async findByTopic(topic: string): Promise<VocabularyEntry[]> {
    return Array.from(this.store.values()).filter(e => e.topic === topic)
  }

  async findByStatus(status: VocabularyEntry['status']): Promise<VocabularyEntry[]> {
    return Array.from(this.store.values()).filter(e => e.status === status)
  }

  async findByDifficulty(difficulty: VocabularyEntry['difficulty']): Promise<VocabularyEntry[]> {
    return Array.from(this.store.values()).filter(e => e.difficulty === difficulty)
  }
}

export class InMemoryVocabReviewRepository implements VocabReviewRepository {
  private readonly store = new Map<string, VocabReviewEntry>()

  async findAll(): Promise<VocabReviewEntry[]> {
    return Array.from(this.store.values())
  }

  async findByVocabularyId(vocabularyId: string): Promise<VocabReviewEntry | undefined> {
    return Array.from(this.store.values()).find(r => r.vocabularyId === vocabularyId)
  }

  async bulkUpsert(items: VocabReviewEntry[]): Promise<void> {
    for (const item of items) {
      this.store.set(item.id, item)
    }
  }

  async findDueReviews(): Promise<VocabReviewEntry[]> {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return Array.from(this.store.values())
      .filter(r => new Date(r.nextReviewDate) <= now)
      .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
  }
}
