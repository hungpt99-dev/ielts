import { BaseRepository } from './BaseRepository'
import { vocabularyEntrySchema, vocabReviewEntrySchema } from '../schema'
import type { z } from 'zod'

export type VocabularyEntry = z.infer<typeof vocabularyEntrySchema>
export type VocabReviewEntry = z.infer<typeof vocabReviewEntrySchema>

export class VocabularyRepository extends BaseRepository<VocabularyEntry> {
  constructor() {
    super('vocabulary', vocabularyEntrySchema)
  }

  async findByTopic(topic: string): Promise<VocabularyEntry[]> {
    return this.queryByIndex('topic', topic)
  }

  async findByStatus(status: VocabularyEntry['status']): Promise<VocabularyEntry[]> {
    return this.queryByIndex('status', status)
  }

  async findByDifficulty(difficulty: VocabularyEntry['difficulty']): Promise<VocabularyEntry[]> {
    return this.queryByIndex('difficulty', difficulty)
  }

  async getStats(): Promise<{ total: number; byStatus: Record<string, number>; byDifficulty: Record<string, number> }> {
    const all = await this.findAll()
    const byStatus: Record<string, number> = {}
    const byDifficulty: Record<string, number> = {}
    for (const item of all) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1
      byDifficulty[item.difficulty] = (byDifficulty[item.difficulty] || 0) + 1
    }
    return { total: all.length, byStatus, byDifficulty }
  }
}

export class VocabReviewRepository extends BaseRepository<VocabReviewEntry> {
  constructor() {
    super('vocabularyReviews', vocabReviewEntrySchema)
  }

  async findByVocabularyId(vocabularyId: string): Promise<VocabReviewEntry | undefined> {
    const results = await this.queryByIndex('vocabularyId', vocabularyId)
    return results[0]
  }

  async findDueReviews(): Promise<VocabReviewEntry[]> {
    const all = await this.findAll()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return all
      .filter(r => new Date(r.nextReviewDate) <= now)
      .sort((a, b) => new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime())
  }

  async getDueCount(): Promise<number> {
    const due = await this.findDueReviews()
    return due.length
  }

  async getReviewStats(): Promise<{ dueCount: number; totalCount: number; masteredCount: number; learningCount: number }> {
    const all = await this.findAll()
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const dueCount = all.filter(r => new Date(r.nextReviewDate) <= now).length
    const masteredCount = all.filter(r => r.interval >= 21 && r.repetitions >= 5).length
    const learningCount = all.filter(r => r.interval < 21 || r.repetitions < 5).length
    return { dueCount, totalCount: all.length, masteredCount, learningCount }
  }
}
