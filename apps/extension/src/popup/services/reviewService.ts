import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { getAllVocabulary, updateVocabularyEntry } from '../../storage/vocabularyStore'
import { safeStorageGet, safeStorageSet } from '../../utils/safe-chrome'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

const REVIEWS_KEY = 'vocabularyReviews'

export interface VocabReviewEntry {
  id: string
  vocabularyId: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewDate: string
  lastReviewDate: string
  history: Array<{ date: string; rating: ReviewRating }>
}

export interface ReviewItem {
  vocab: ExtensionVocabEntry
  review: VocabReviewEntry | null
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function getInitialReviewEntry(vocabularyId: string, now: Date = new Date()): VocabReviewEntry {
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

function calculateNextReview(
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
      interval = interval === 0 ? 1 : Math.round(interval * 1.2)
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

function getVocabStatus(rating: ReviewRating, currentStatus: string): string {
  if (rating === 'again') return 'learning'
  if (currentStatus === 'new' || currentStatus === 'learning') return 'learning'
  if (rating === 'easy' && currentStatus === 'reviewing') return 'mastered'
  return currentStatus
}

async function loadReviews(): Promise<VocabReviewEntry[]> {
  const result = await safeStorageGet<VocabReviewEntry[]>(REVIEWS_KEY)
  return result[REVIEWS_KEY] ?? []
}

async function saveReview(entry: VocabReviewEntry): Promise<void> {
  const reviews = await loadReviews()
  const idx = reviews.findIndex(r => r.id === entry.id)
  if (idx >= 0) {
    reviews[idx] = entry
  } else {
    reviews.push(entry)
  }
  await safeStorageSet({ [REVIEWS_KEY]: reviews })
}

export async function getDueCount(): Promise<number> {
  const allVocab = await getAllVocabulary().catch(() => [] as ExtensionVocabEntry[])
  const reviews = await loadReviews()
  const todayStr = new Date().toISOString().slice(0, 10)

  let count = 0
  for (const vocab of allVocab) {
    if (vocab.status === 'mastered') continue
    if (!vocab.addedToReview) continue

    const review = reviews.find(r => r.vocabularyId === vocab.id)
    if (review) {
      if (review.nextReviewDate.slice(0, 10) <= todayStr) {
        count++
      }
    } else if (vocab.status === 'new' || vocab.status === 'learning' || vocab.status === 'reviewing') {
      count++
    }
  }
  return count
}

export async function buildReviewQueue(maxSize: number = 20): Promise<ReviewItem[]> {
  const allVocab = await getAllVocabulary().catch(() => [] as ExtensionVocabEntry[])
  const reviews = await loadReviews()
  const todayStr = new Date().toISOString().slice(0, 10)

  const reviewMap = new Map<string, VocabReviewEntry>()
  for (const r of reviews) {
    reviewMap.set(r.vocabularyId, r)
  }

  const queue: ReviewItem[] = []
  for (const vocab of allVocab) {
    if (vocab.status === 'mastered') continue
    if (!vocab.addedToReview) continue

    const review = reviewMap.get(vocab.id)

    if (review) {
      if (review.nextReviewDate.slice(0, 10) <= todayStr) {
        queue.push({ vocab, review })
      }
    } else if (vocab.status === 'new' || vocab.status === 'learning' || vocab.status === 'reviewing') {
      queue.push({ vocab, review: null })
    }
  }

  queue.sort((a, b) => {
    if (a.review && !b.review) return -1
    if (!a.review && b.review) return 1
    const dateA = a.review?.nextReviewDate ?? '9999-12-31'
    const dateB = b.review?.nextReviewDate ?? '9999-12-31'
    return dateA.localeCompare(dateB)
  })

  const shuffled = queue.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.max(1, maxSize))
}

export async function handleRating(
  item: ReviewItem,
  rating: ReviewRating,
): Promise<void> {
  const now = new Date()

  let review = item.review
  if (!review) {
    review = getInitialReviewEntry(item.vocab.id, now)
  }

  const updatedReview = calculateNextReview(review, rating, now)
  await saveReview(updatedReview)

  const newStatus = getVocabStatus(rating, item.vocab.status)
  if (item.vocab.status !== newStatus) {
    await updateVocabularyEntry(item.vocab.id, { status: newStatus as ExtensionVocabEntry['status'] })
  }
}

export async function getAllReviews(): Promise<VocabReviewEntry[]> {
  return loadReviews()
}
