import type { VocabularyEntry, VocabReviewEntry, ReviewRating, VocabStatus } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { getDailyReviewQueue, calculateNextReview, getInitialReviewEntry } from '../../utils/spaced-repetition'

export type ReviewMode =
  | 'word-to-meaning'
  | 'meaning-to-word'
  | 'gap-fill'
  | 'collocation'
  | 'multiple-choice'
  | 'typing'

export interface ReviewModeConfig {
  value: ReviewMode
  label: string
  description: string
}

export const REVIEW_MODES: ReviewModeConfig[] = [
  { value: 'word-to-meaning', label: 'Word → Meaning', description: 'See the word, recall the meaning' },
  { value: 'meaning-to-word', label: 'Meaning → Word', description: 'See the meaning, recall the word' },
  { value: 'gap-fill', label: 'Gap-fill', description: 'Fill in the blank in a sentence' },
  { value: 'collocation', label: 'Collocations', description: 'Review word combinations and synonyms' },
  { value: 'multiple-choice', label: 'Multiple Choice', description: 'Pick the correct meaning from options' },
  { value: 'typing', label: 'Typing', description: 'Type the answer from memory' },
]

export const RATING_BUTTONS: { rating: ReviewRating; label: string; shortcut: string; color: string }[] = [
  { rating: 'again', label: 'Again', shortcut: '1', color: 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-400 dark:bg-red-700 dark:hover:bg-red-800' },
  { rating: 'hard', label: 'Hard', shortcut: '2', color: 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400 dark:bg-orange-700 dark:hover:bg-orange-800' },
  { rating: 'good', label: 'Good', shortcut: '3', color: 'bg-blue-500 hover:bg-blue-600 focus-visible:ring-blue-400 dark:bg-blue-700 dark:hover:bg-blue-800' },
  { rating: 'easy', label: 'Easy', shortcut: '4', color: 'bg-green-500 hover:bg-green-600 focus-visible:ring-green-400 dark:bg-green-700 dark:hover:bg-green-800' },
]

export interface ReviewItem {
  vocab: VocabularyEntry
  review: VocabReviewEntry | null
}

export interface ReviewSessionState {
  queue: ReviewItem[]
  currentIndex: number
  ratings: Record<ReviewRating, number>
  startedAt: number
  completed: boolean
}

export interface ReviewSessionConfig {
  topics: string[]
  difficulties: string[]
  statuses: string[]
  modes: ReviewMode[]
  sessionSize: number
}

export const DEFAULT_SESSION_CONFIG: ReviewSessionConfig = {
  topics: [],
  difficulties: [],
  statuses: [],
  modes: ['word-to-meaning', 'meaning-to-word', 'gap-fill', 'collocation', 'multiple-choice', 'typing'],
  sessionSize: 20,
}

export function buildReviewQueue(
  vocabulary: VocabularyEntry[],
  reviews: VocabReviewEntry[],
  config: ReviewSessionConfig,
): ReviewItem[] {
  let filtered = vocabulary

  if (config.topics.length > 0) {
    filtered = filtered.filter(v => config.topics.includes(v.topic))
  }
  if (config.difficulties.length > 0) {
    filtered = filtered.filter(v => config.difficulties.includes(v.difficulty))
  }
  if (config.statuses.length > 0) {
    filtered = filtered.filter(v => config.statuses.includes(v.status))
  }

  const today = new Date().toISOString().slice(0, 10)
  const due = getDailyReviewQueue(filtered, reviews, today)
  const shuffled = due.sort(() => Math.random() - 0.5)

  return shuffled.slice(0, Math.max(1, config.sessionSize))
}

export function getVocabStatus(rating: ReviewRating, currentStatus: VocabStatus): VocabStatus {
  if (rating === 'again') return 'learning'
  if (currentStatus === 'new' || currentStatus === 'learning') return 'learning'
  if (rating === 'easy' && currentStatus === 'reviewing') return 'mastered'
  return currentStatus
}

export async function handleRating(
  item: ReviewItem,
  rating: ReviewRating,
): Promise<void> {
  const now = new Date()

  let review = item.review
  if (!review) {
    review = getInitialReviewEntry(item.vocab.id, now)
    await DatabaseService.put('vocabularyReviews', review)
  }

  const updatedReview = calculateNextReview(review, rating, now)
  await DatabaseService.put('vocabularyReviews', updatedReview)

  const newStatus = getVocabStatus(rating, item.vocab.status)
  if (item.vocab.status !== newStatus) {
    const updatedVocab: VocabularyEntry = {
      ...item.vocab,
      status: newStatus,
      updatedAt: now.toISOString(),
    }
    await DatabaseService.put('vocabulary', updatedVocab)
  }
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}
