// ═══════════════════════════════════════════════════════════════════════
// Spaced-repetition policy — consolidated onto @ielts/vocabulary-engine.
// The canonical SM-2 scheduling implementation lives in the vocabulary
// engine package; this module re-exports it so the web app's review and
// vocabulary features consume a single source of truth.
// ═══════════════════════════════════════════════════════════════════════

export {
  getInitialReviewEntry,
  calculateNextReview,
  getDailyReviewQueue,
} from '@ielts/vocabulary-engine'

export type { ReviewQueueItem } from '@ielts/vocabulary-engine'
