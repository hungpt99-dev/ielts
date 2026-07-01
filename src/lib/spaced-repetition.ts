import type { VocabReviewEntry, VocabularyEntry, ReviewRating } from '../models'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export function getInitialReviewEntry(vocabularyId: string, now: Date = new Date()): VocabReviewEntry {
  const iso = now.toISOString()
  return {
    id: generateId(),
    vocabularyId,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: iso,
    lastReviewDate: iso,
    history: [],
  }
}

export function calculateNextReview(
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

export function getDailyReviewQueue(
  vocabulary: VocabularyEntry[],
  reviews: VocabReviewEntry[],
  todayStr: string,
): Array<{ vocab: VocabularyEntry; review: VocabReviewEntry | null }> {
  const today = todayStr.slice(0, 10)

  const reviewMap = new Map<string, VocabReviewEntry>()
  for (const r of reviews) {
    reviewMap.set(r.vocabularyId, r)
  }

  const vocabMap = new Map<string, VocabularyEntry>()
  for (const v of vocabulary) {
    vocabMap.set(v.id, v)
  }

  const queue: Array<{ vocab: VocabularyEntry; review: VocabReviewEntry | null }> = []

  for (const v of vocabulary) {
    if (v.status === 'mastered') continue

    const review = reviewMap.get(v.id)

    if (review) {
      if (review.nextReviewDate.slice(0, 10) <= today) {
        queue.push({ vocab: v, review })
      }
    } else if (v.status === 'new' || v.status === 'learning' || v.status === 'reviewing') {
      queue.push({ vocab: v, review: null })
    }
  }

  queue.sort((a, b) => {
    if (a.review && !b.review) return -1
    if (!a.review && b.review) return 1
    const dateA = a.review?.nextReviewDate ?? '9999-12-31'
    const dateB = b.review?.nextReviewDate ?? '9999-12-31'
    return dateA.localeCompare(dateB)
  })

  return queue
}
