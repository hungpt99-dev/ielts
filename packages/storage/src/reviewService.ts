import { z } from 'zod'

export const reviewRatingSchema = z.enum(['again', 'hard', 'good', 'easy'])
export type ReviewRating = z.infer<typeof reviewRatingSchema>

export interface VocabEntry {
  id: string
  word: string
  meaning: string
  topic: string
  difficulty: string
  status: string
  createdAt: string
}

export interface VocabReviewEntry {
  id: string
  vocabularyId: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewDate: string
  lastReviewDate: string
  history: Array<{
    date: string
    rating: ReviewRating
  }>
}

export interface ReviewStats {
  dueCount: number
  totalCount: number
  masteredCount: number
  learningCount: number
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

type StorageGet<T> = (key: string) => Promise<T | null>
type StorageSet = (key: string, value: unknown) => Promise<void>

export async function addVocabularyToReview(
  vocabularyId: string,
  storageGet: StorageGet<VocabReviewEntry[]>,
  storageSet: StorageSet,
): Promise<VocabReviewEntry> {
  const today = getTodayISO()
  const tomorrow = addDays(today, 1)

  const entry: VocabReviewEntry = {
    id: crypto.randomUUID(),
    vocabularyId,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: tomorrow,
    lastReviewDate: today,
    history: [],
  }

  const existing = await storageGet('vocabularyReviews')
  const reviews = existing || []
  reviews.push(entry)
  await storageSet('vocabularyReviews', reviews)

  return entry
}

export async function getDueReviews(
  storageGet: StorageGet<VocabReviewEntry[]>,
): Promise<VocabReviewEntry[]> {
  const existing = await storageGet('vocabularyReviews')
  if (!existing) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  return existing
    .filter(r => r.nextReviewDate <= todayStr)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))
}

export async function updateReview(
  vocabularyReviewId: string,
  rating: ReviewRating,
  storageGet: StorageGet<VocabReviewEntry[]>,
  storageSet: StorageSet,
): Promise<VocabReviewEntry | null> {
  const existing = await storageGet('vocabularyReviews')
  if (!existing) return null

  const index = existing.findIndex(r => r.id === vocabularyReviewId)
  if (index === -1) return null

  const entry = { ...existing[index] }
  const now = new Date().toISOString()

  const SM2_MIN_EASE = 1.3
  const SM2_EASE_STEP = 0.15

  switch (rating) {
    case 'again':
      entry.repetitions = 0
      entry.interval = 0
      entry.easeFactor = Math.max(SM2_MIN_EASE, entry.easeFactor - 0.2)
      break
    case 'hard':
      entry.interval = Math.max(1, Math.round(entry.interval * 1.2))
      entry.easeFactor = Math.max(SM2_MIN_EASE, entry.easeFactor - SM2_EASE_STEP)
      entry.repetitions += 1
      break
    case 'good':
      if (entry.repetitions === 0) {
        entry.interval = 1
      } else if (entry.repetitions === 1) {
        entry.interval = 6
      } else {
        entry.interval = Math.round(entry.interval * entry.easeFactor)
      }
      entry.repetitions += 1
      break
    case 'easy':
      if (entry.repetitions === 0) {
        entry.interval = 2
      } else if (entry.repetitions === 1) {
        entry.interval = 10
      } else {
        entry.interval = Math.round(entry.interval * entry.easeFactor * 1.3)
      }
      entry.easeFactor += SM2_EASE_STEP
      entry.repetitions += 1
      break
  }

  entry.lastReviewDate = now
  entry.nextReviewDate = addDays(now.slice(0, 10), entry.interval)
  entry.history = [...entry.history, { date: now, rating }]

  existing[index] = entry
  await storageSet('vocabularyReviews', existing)

  return entry
}

export async function getReviewStats(
  storageGet: StorageGet<VocabReviewEntry[]>,
): Promise<ReviewStats> {
  const existing = await storageGet('vocabularyReviews')
  if (!existing) return { dueCount: 0, totalCount: 0, masteredCount: 0, learningCount: 0 }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const dueCount = existing.filter(r => r.nextReviewDate <= todayStr).length
  const masteredCount = existing.filter(r => r.interval >= 21 && r.repetitions >= 5).length
  const learningCount = existing.filter(r => r.interval < 21 || r.repetitions < 5).length

  return {
    dueCount,
    totalCount: existing.length,
    masteredCount,
    learningCount,
  }
}
