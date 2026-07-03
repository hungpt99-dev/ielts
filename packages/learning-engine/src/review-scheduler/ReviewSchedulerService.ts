import { randomUUID } from 'node:crypto'
import type {
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
} from '@ielts/storage'
import type { DueReviews, VocabReviewDue, MistakeDue } from '../types'

type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

/** Determines which vocabulary items, mistakes, and SM-2 reviews are due for the current session */
export class ReviewSchedulerService {
  getDueReviews(
    vocabulary: VocabularyEntry[],
    vocabReviews: VocabReviewEntry[],
    mistakes: MistakeEntry[],
    now: Date = new Date(),
  ): DueReviews {
    const vocabularyDue = this.getDueVocabularyReviews(vocabulary, vocabReviews, now)
    const mistakesDue = this.getDueMistakeReviews(mistakes, now)

    return {
      vocabularyDue,
      mistakesDue,
      totalDue: vocabularyDue.length + mistakesDue.length,
    }
  }

  getDueVocabularyReviews(
    vocabulary: VocabularyEntry[],
    vocabReviews: VocabReviewEntry[],
    now: Date = new Date(),
  ): VocabReviewDue[] {
    const todayStr = now.toISOString().slice(0, 10)
    const vocabMap = new Map<string, VocabularyEntry>()
    for (const v of vocabulary) {
      if (v.status !== 'mastered') {
        vocabMap.set(v.id, v)
      }
    }

    const reviewMap = new Map<string, VocabReviewEntry>()
    for (const r of vocabReviews) {
      reviewMap.set(r.vocabularyId, r)
    }

    const due: VocabReviewDue[] = []

    for (const [vocabId, vocab] of vocabMap) {
      const review = reviewMap.get(vocabId)
      if (review) {
        if (review.nextReviewDate.slice(0, 10) <= todayStr) {
          due.push({ vocabulary: vocab, review })
        }
      } else if (vocab.status === 'new' || vocab.status === 'learning') {
        due.push({ vocabulary: vocab, review: this.createInitialReviewEntry(vocab.id) })
      }
    }

    return due.sort((a, b) => {
      const dateA = a.review?.nextReviewDate ?? '9999-12-31'
      const dateB = b.review?.nextReviewDate ?? '9999-12-31'
      return dateA.localeCompare(dateB)
    })
  }

  getDueMistakeReviews(
    mistakes: MistakeEntry[],
    now: Date = new Date(),
  ): MistakeDue[] {
    const nowMs = now.getTime()
    const dayMs = 86400000

    return mistakes
      .filter(m => m.status !== 'resolved')
      .map(m => {
        const lastUpdated = new Date(m.updatedAt).getTime()
        const daysSince = Math.floor((nowMs - lastUpdated) / dayMs)
        return { mistake: m, daysSinceLastReview: Math.max(0, daysSince) }
      })
      .filter(m => m.daysSinceLastReview >= 1)
      .sort((a, b) => b.daysSinceLastReview - a.daysSinceLastReview)
  }

  calculateNextReview(
    entry: VocabReviewEntry,
    rating: ReviewRating,
    now: Date = new Date(),
  ): VocabReviewEntry {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    let { interval, easeFactor, repetitions } = entry

    switch (rating) {
      case 'again':
        repetitions = 0
        interval = 1
        easeFactor = Math.max(1.3, easeFactor - 0.2)
        break
      case 'hard':
        repetitions += 1
        if (interval === 0) {
          interval = 1
        } else {
          interval = Math.round(interval * 1.2)
        }
        easeFactor = Math.max(1.3, easeFactor - 0.15)
        break
      case 'good':
        repetitions += 1
        if (interval === 0) {
          interval = 1
        } else if (repetitions === 1) {
          interval = 1
        } else if (repetitions === 2) {
          interval = 6
        } else {
          interval = Math.round(interval * easeFactor)
        }
        break
      case 'easy':
        repetitions += 1
        if (interval === 0) {
          interval = 4
        } else if (repetitions === 1) {
          interval = 4
        } else {
          interval = Math.round(interval * easeFactor * 1.3)
        }
        easeFactor = easeFactor + 0.15
        break
    }

    const nextDate = new Date(today)
    nextDate.setDate(nextDate.getDate() + interval)

    return {
      ...entry,
      interval,
      easeFactor,
      repetitions,
      nextReviewDate: nextDate.toISOString(),
      lastReviewDate: now.toISOString(),
      history: [
        ...entry.history,
        { date: now.toISOString(), rating },
      ],
    }
  }

  getReviewStats(
    vocabReviews: VocabReviewEntry[],
    now: Date = new Date(),
  ): { dueCount: number; totalCount: number; masteredCount: number; learningCount: number } {
    const todayStr = now.toISOString().slice(0, 10)

    const dueCount = vocabReviews.filter(r => r.nextReviewDate.slice(0, 10) <= todayStr).length
    const masteredCount = vocabReviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length
    const learningCount = vocabReviews.filter(r => r.interval < 21 || r.repetitions < 5).length

    return {
      dueCount,
      totalCount: vocabReviews.length,
      masteredCount,
      learningCount,
    }
  }

  private createInitialReviewEntry(vocabularyId: string): VocabReviewEntry {
    const now = new Date()
    const iso = now.toISOString()
    return {
      id: randomUUID(),
      vocabularyId,
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: iso,
      lastReviewDate: iso,
      history: [],
    }
  }
}
