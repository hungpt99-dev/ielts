export const REVIEW_RATING = {
  AGAIN: 'AGAIN',
  HARD: 'HARD',
  GOOD: 'GOOD',
  EASY: 'EASY',
} as const

export type ReviewRating = (typeof REVIEW_RATING)[keyof typeof REVIEW_RATING]

export const REVIEW_CONTEXT = {
  FLASHCARD: 'FLASHCARD',
  READING: 'READING',
  WRITING: 'WRITING',
  SPEAKING: 'SPEAKING',
} as const

export type ReviewContext = (typeof REVIEW_CONTEXT)[keyof typeof REVIEW_CONTEXT]

export interface ReviewHistoryEntry {
  date: Date
  rating: ReviewRating
  responseTimeMs: number
  confidenceScore: number
  context: ReviewContext
}

export interface SpacedRepetitionInfo {
  interval: number
  easeFactor: number
  repetitions: number
  stability: number
  difficulty: number
  nextReviewDate: Date
  lastReviewDate: Date
  history: ReviewHistoryEntry[]
}

const DEFAULT_RESPONSE_TIME_MS = 2500
const DEFAULT_CONFIDENCE_SCORE = 0.5
const NEUTRAL_RESPONSE_TIME_MS = 2500
const EASE_FACTOR_FLOOR = 1.3
const MAX_INTERVAL_DAYS = 36500
const PRODUCTION_CONTEXT_BOOST = 1.5
const STABILITY_SCALE = 10
const MS_PER_DAY = 86_400_000

const EASE_FACTOR_DELTA: Record<ReviewRating, number> = {
  [REVIEW_RATING.AGAIN]: -0.2,
  [REVIEW_RATING.HARD]: -0.15,
  [REVIEW_RATING.GOOD]: 0,
  [REVIEW_RATING.EASY]: 0.15,
}

const DIFFICULTY_DELTA: Record<ReviewRating, number> = {
  [REVIEW_RATING.AGAIN]: 0.08,
  [REVIEW_RATING.HARD]: 0.04,
  [REVIEW_RATING.GOOD]: -0.02,
  [REVIEW_RATING.EASY]: -0.05,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function clampEaseFactor(easeFactor: number): number {
  return Math.max(EASE_FACTOR_FLOOR, easeFactor)
}

function responseTimeModulator(responseTimeMs: number): number {
  if (responseTimeMs <= 0) return 1
  const deviation = (NEUTRAL_RESPONSE_TIME_MS - responseTimeMs) / NEUTRAL_RESPONSE_TIME_MS
  return clamp(1 + deviation * 0.2, 0.8, 1.2)
}

function confidenceModulator(confidenceScore: number): number {
  return clamp(1 + (confidenceScore - 0.5) * 0.2, 0.85, 1.1)
}

function nextDifficulty(
  difficulty: number,
  rating: ReviewRating,
  responseTimeMs: number,
  confidenceScore: number,
): number {
  const ratingDelta = DIFFICULTY_DELTA[rating]
  const responseDelta =
    responseTimeMs <= 0
      ? 0
      : clamp(
          ((responseTimeMs - NEUTRAL_RESPONSE_TIME_MS) / NEUTRAL_RESPONSE_TIME_MS) * 0.05,
          -0.05,
          0.05,
        )
  const confidenceDelta = (0.5 - confidenceScore) * 0.04
  return clamp(difficulty + ratingDelta + responseDelta + confidenceDelta, 0, 1)
}

function nextStability(interval: number): number {
  return Math.max(1, Math.round(interval * STABILITY_SCALE))
}

function applyModulation(interval: number, previousInterval: number, modulation: number): number {
  const boosted = Math.round(interval * modulation)
  return Math.max(boosted, previousInterval + 1)
}

function isProductionContext(context: ReviewContext): boolean {
  return context === REVIEW_CONTEXT.WRITING || context === REVIEW_CONTEXT.SPEAKING
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

export function calculateNextReview(
  currentSR: SpacedRepetitionInfo,
  rating: ReviewRating,
  responseTimeMs = DEFAULT_RESPONSE_TIME_MS,
  confidenceScore = DEFAULT_CONFIDENCE_SCORE,
  context: ReviewContext = REVIEW_CONTEXT.FLASHCARD,
  now: Date = new Date(),
): SpacedRepetitionInfo {
  const responseMs = responseTimeMs > 0 ? responseTimeMs : DEFAULT_RESPONSE_TIME_MS
  const confidence = clamp(confidenceScore, 0, 1)
  const intervalModulator = responseTimeModulator(responseMs) * confidenceModulator(confidence)

  let { interval, easeFactor, repetitions, stability, difficulty } = currentSR

  switch (rating) {
    case REVIEW_RATING.AGAIN:
      repetitions = 0
      interval = 1
      easeFactor = clampEaseFactor(easeFactor + EASE_FACTOR_DELTA[rating] * confidenceModulator(confidence))
      break
    case REVIEW_RATING.HARD:
      repetitions += 1
      interval = interval === 0 ? 1 : Math.round(interval * 1.2 * intervalModulator)
      easeFactor = clampEaseFactor(easeFactor + EASE_FACTOR_DELTA[rating] * confidenceModulator(confidence))
      break
    case REVIEW_RATING.GOOD:
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
      interval = applyModulation(interval, currentSR.interval, intervalModulator)
      break
    case REVIEW_RATING.EASY:
      repetitions += 1
      if (interval === 0) {
        interval = 4
      } else if (repetitions === 1) {
        interval = 4
      } else {
        interval = Math.round(interval * easeFactor * 1.3)
      }
      interval = applyModulation(interval, currentSR.interval, intervalModulator)
      easeFactor = clampEaseFactor(easeFactor + EASE_FACTOR_DELTA[rating] * confidenceModulator(confidence))
      break
  }

  if (isProductionContext(context) && rating !== REVIEW_RATING.AGAIN) {
    interval = Math.round(interval * PRODUCTION_CONTEXT_BOOST)
  }

  interval = Math.min(interval, MAX_INTERVAL_DAYS)
  difficulty = nextDifficulty(difficulty, rating, responseMs, confidence)
  stability = nextStability(interval)

  const nextReviewDate = addDaysUtc(startOfUtcDay(now), interval)

  return {
    ...currentSR,
    interval,
    easeFactor,
    repetitions,
    stability,
    difficulty,
    nextReviewDate,
    lastReviewDate: now,
    history: [
      ...currentSR.history,
      {
        date: now,
        rating,
        responseTimeMs: responseMs,
        confidenceScore: confidence,
        context,
      },
    ],
  }
}

export function getDueReviewQueue(
  srInfos: SpacedRepetitionInfo[],
  limit?: number,
): SpacedRepetitionInfo[] {
  const cutoff = startOfUtcDay(new Date()).getTime()
  const due = srInfos
    .filter((sr) => sr.nextReviewDate.getTime() <= cutoff)
    .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime())
  if (limit === undefined) return due
  return due.slice(0, Math.max(0, Math.floor(limit)))
}

export function predictRecallProbability(
  srInfo: SpacedRepetitionInfo,
  targetDate: Date,
): number {
  const elapsedMs = targetDate.getTime() - srInfo.lastReviewDate.getTime()
  if (elapsedMs <= 0) return 1
  const stability = Math.max(1, srInfo.stability)
  const daysElapsed = elapsedMs / MS_PER_DAY
  return clamp(Math.exp(-daysElapsed / stability), 0, 1)
}
