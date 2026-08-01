// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — Canonical vocabulary domain engine.
// Consolidates the vocabulary domain model, spaced-repetition review,
// search, analytics, knowledge graph, word detail, and practice engines
// so all platform surfaces consume a single vocabulary engine.
// ═══════════════════════════════════════════════════════════════════════

// ── Orchestration (NEW — facade) ─────────────────────────────────────
export { VocabularyEngine, createVocabularyEngine } from './orchestration/vocabulary-engine'
export type { VocabularyEngineDependencies, WordInput } from './orchestration/vocabulary-engine'

// ── Domain Entities (canonical, from @ielts/storage) ──────────────────
export type { VocabularyEntry, VocabReviewEntry, WordDetail, RelatedWord, VocabReviewState } from './domain/entities/word'
export type { WordRelationship, WordRelationshipType } from './domain/entities/word-relationship'

// ── Domain Value Objects ─────────────────────────────────────────────
export type { ReviewRating, ReviewHistoryEntry } from './domain/value-objects/review-rating'
export { reviewRatingValues, isReviewRating } from './domain/value-objects/review-rating'

// ── Domain Policies (NEW — SM-2 review scheduling) ────────────────────
export {
  getInitialReviewEntry,
  calculateNextReview,
  getDailyReviewQueue,
  getDueReviewEntries,
} from './domain/policies/spaced-repetition'
export type { ReviewQueueItem } from './domain/policies/spaced-repetition'

// ── Ports (NEW) ──────────────────────────────────────────────────────
export type { VocabularyRepository } from './ports/vocabulary-repository'
export type { VocabReviewRepository } from './ports/vocab-review-repository'
export type { ClockPort } from './ports/clock-port'
export { SystemClock } from './ports/clock-port'

// ── Application Services (NEW — consolidated) ─────────────────────────
export { ReviewEngine } from './application/review-engine'
export type {
  ReviewEngineDependencies,
  ReviewSessionConfig,
  RateWordResult,
} from './application/review-engine'
export { DEFAULT_REVIEW_SESSION_CONFIG } from './application/review-engine'
export type { ReviewQueueItem as ReviewQueueItemResult } from './application/review-engine'

export { SearchEngine } from './application/search-engine'
export type { SearchEngineDependencies, VocabularyFilter } from './application/search-engine'

export { AnalyticsService } from './application/analytics-service'
export type { AnalyticsDependencies, VocabularyStats } from './application/analytics-service'

export { KnowledgeGraph } from './application/knowledge-graph'
export type { KnowledgeGraphDependencies } from './application/knowledge-graph'

export { WordDetailService } from './application/word-detail'
export type { WordDetailDependencies } from './application/word-detail'

export { PracticeEngine } from './application/practice-engine'
export type { VocabExercisePrompt } from './application/practice-engine'

// ── Infrastructure Adapters (NEW) ────────────────────────────────────
export { DexieVocabularyRepository, DexieVocabReviewRepository } from './infrastructure/dexie-adapters'
export { InMemoryVocabularyRepository, InMemoryVocabReviewRepository } from './infrastructure/in-memory-repositories'

// ── Utils (NEW) ──────────────────────────────────────────────────────
export { generateId } from './utils/id'
