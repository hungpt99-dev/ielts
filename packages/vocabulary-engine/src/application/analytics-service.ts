import type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'
import type { VocabularyRepository, VocabReviewRepository } from '../ports'

export interface VocabularyStats {
  total: number
  newCount: number
  learning: number
  reviewing: number
  mastered: number
  hardCount: number
  dueForReview: number
  masteredCount: number
  learningCount: number
}

export interface AnalyticsDependencies {
  vocabularyRepository: VocabularyRepository
  vocabReviewRepository: VocabReviewRepository
}

export class AnalyticsService {
  private readonly vocabularyRepository: VocabularyRepository
  private readonly vocabReviewRepository: VocabReviewRepository

  constructor(deps: AnalyticsDependencies) {
    this.vocabularyRepository = deps.vocabularyRepository
    this.vocabReviewRepository = deps.vocabReviewRepository
  }

  async computeStats(
    entries?: VocabularyEntry[],
    reviews?: VocabReviewEntry[],
  ): Promise<VocabularyStats> {
    const all = entries ?? await this.vocabularyRepository.findAll()
    const allReviews = reviews ?? await this.vocabReviewRepository.findAll()

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const dueForReview = allReviews.filter(r => {
      if (r.interval >= 21 && r.repetitions >= 5) return false
      const nextDate = new Date(r.nextReviewDate)
      nextDate.setHours(0, 0, 0, 0)
      return nextDate <= now
    }).length

    return {
      total: all.length,
      newCount: all.filter(e => e.status === 'new').length,
      learning: all.filter(e => e.status === 'learning').length,
      reviewing: all.filter(e => e.status === 'reviewing').length,
      mastered: all.filter(e => e.status === 'mastered').length,
      hardCount: all.filter(e => e.difficulty === 'hard').length,
      dueForReview,
      masteredCount: allReviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length,
      learningCount: allReviews.filter(r => r.interval < 21 || r.repetitions < 5).length,
    }
  }

  async getStats(): Promise<VocabularyStats> {
    return this.computeStats()
  }
}
