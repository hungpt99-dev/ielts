import type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'
import type { ReviewRating } from '../domain/value-objects/review-rating'
import type { VocabularyRepository, VocabReviewRepository } from '../ports'
import type { ClockPort } from '../ports'
import {
  calculateNextReview,
  getDailyReviewQueue,
  getDueReviewEntries,
  getInitialReviewEntry,
  type ReviewQueueItem,
} from '../domain/policies/spaced-repetition'

export type { ReviewQueueItem }

export interface ReviewSessionConfig {
  topics: string[]
  difficulties: string[]
  statuses: string[]
  sessionSize: number
}

export const DEFAULT_REVIEW_SESSION_CONFIG: ReviewSessionConfig = {
  topics: [],
  difficulties: [],
  statuses: [],
  sessionSize: 20,
}

export interface ReviewEngineDependencies {
  vocabularyRepository: VocabularyRepository
  vocabReviewRepository: VocabReviewRepository
  clock?: ClockPort
}

export interface RateWordResult {
  vocab: VocabularyEntry
  review: VocabReviewEntry
}

export class ReviewEngine {
  private readonly vocabularyRepository: VocabularyRepository
  private readonly vocabReviewRepository: VocabReviewRepository
  private readonly clock: ClockPort

  constructor(deps: ReviewEngineDependencies) {
    this.vocabularyRepository = deps.vocabularyRepository
    this.vocabReviewRepository = deps.vocabReviewRepository
    this.clock = deps.clock ?? { now: () => new Date() }
  }

  async buildReviewQueue(config: Partial<ReviewSessionConfig> = {}): Promise<ReviewQueueItem[]> {
    const merged: ReviewSessionConfig = {
      ...DEFAULT_REVIEW_SESSION_CONFIG,
      ...config,
    }

    const [vocabulary, reviews] = await Promise.all([
      this.vocabularyRepository.findAll(),
      this.vocabReviewRepository.findAll(),
    ])

    let filtered = vocabulary

    if (merged.topics.length > 0) {
      filtered = filtered.filter(v => merged.topics.includes(v.topic))
    }
    if (merged.difficulties.length > 0) {
      filtered = filtered.filter(v => merged.difficulties.includes(v.difficulty))
    }
    if (merged.statuses.length > 0) {
      filtered = filtered.filter(v => merged.statuses.includes(v.status))
    }

    const today = this.clock.now().toISOString()
    const due = getDailyReviewQueue(filtered, reviews, today)

    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[due[i], due[j]] = [due[j], due[i]]
    }

    return due.slice(0, Math.max(1, merged.sessionSize))
  }

  async getDueReviewItems(): Promise<ReviewQueueItem[]> {
    const [vocabulary, reviews] = await Promise.all([
      this.vocabularyRepository.findAll(),
      this.vocabReviewRepository.findAll(),
    ])
    return getDailyReviewQueue(vocabulary, reviews, this.clock.now().toISOString())
  }

  async rateWord(entry: VocabularyEntry, rating: ReviewRating): Promise<RateWordResult> {
    const now = this.clock.now()
    const existing = await this.vocabReviewRepository.findByVocabularyId(entry.id)

    const review = existing ?? getInitialReviewEntry(entry.id, now)
    const updatedReview = calculateNextReview(review, rating, now)
    await this.vocabReviewRepository.bulkUpsert([updatedReview])

    const vocabStatus: VocabularyEntry['status'] =
      rating === 'again' ? 'learning'
      : (rating === 'good' || rating === 'easy') && entry.status === 'reviewing' ? 'mastered'
      : entry.status === 'new' || entry.status === 'learning' ? 'learning'
      : entry.status

    let vocab = entry
    if (entry.status !== vocabStatus) {
      vocab = { ...entry, status: vocabStatus, updatedAt: now.toISOString() }
      await this.vocabularyRepository.bulkUpsert([vocab])
    }

    return { vocab, review: updatedReview }
  }

  async getDueReviewEntries(): Promise<VocabReviewEntry[]> {
    const reviews = await this.vocabReviewRepository.findAll()
    return getDueReviewEntries(reviews, this.clock.now())
  }

  async getDueCount(): Promise<number> {
    const due = await this.getDueReviewEntries()
    return due.length
  }
}
