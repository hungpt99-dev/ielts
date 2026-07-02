import type { ExerciseReviewRecord, ExerciseResult, ExerciseAttempt } from './models'
import type { ReviewRating, ISOString } from './types'
import { generateId } from './utils/id'

export interface ReviewScheduleConfig {
  initialInterval: number
  easyInterval: number
  initialEaseFactor: number
  minimumEaseFactor: number
  easeBonus: number
  intervalModifier: number
}

const DEFAULT_CONFIG: ReviewScheduleConfig = {
  initialInterval: 1,
  easyInterval: 4,
  initialEaseFactor: 2.5,
  minimumEaseFactor: 1.3,
  easeBonus: 0.15,
  intervalModifier: 1.0,
}

function now(): ISOString {
  return new Date().toISOString()
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export interface SpacedRepetitionInput {
  rating: ReviewRating
  interval: number
  easeFactor: number
  repetitions: number
  accuracy?: number
}

export interface SpacedRepetitionOutput {
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewAt: ISOString
}

export class SpacedRepetitionScheduler {
  private config: ReviewScheduleConfig

  constructor(config?: Partial<ReviewScheduleConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  schedule(input: SpacedRepetitionInput): SpacedRepetitionOutput {
    const { rating, interval, easeFactor, repetitions, accuracy } = input
    let newInterval: number
    let newEaseFactor: number
    let newRepetitions: number

    switch (rating) {
      case 'again': {
        newRepetitions = 0
        newInterval = 1
        newEaseFactor = Math.max(
          this.config.minimumEaseFactor,
          easeFactor - 0.2,
        )
        break
      }
      case 'hard': {
        newRepetitions = repetitions + 1
        newInterval = Math.max(
          1,
          interval * 1.2,
        )
        newEaseFactor = Math.max(
          this.config.minimumEaseFactor,
          easeFactor - 0.15,
        )
        break
      }
      case 'good': {
        newRepetitions = repetitions + 1
        newEaseFactor = easeFactor

        if (newRepetitions === 1) {
          newInterval = this.config.initialInterval
        } else if (newRepetitions === 2) {
          newInterval = this.config.easyInterval
        } else {
          newInterval = Math.round(interval * easeFactor * this.config.intervalModifier)
        }
        break
      }
      case 'easy': {
        newRepetitions = repetitions + 1
        newEaseFactor = easeFactor + this.config.easeBonus

        if (newRepetitions === 1) {
          newInterval = this.config.easyInterval
        } else if (newRepetitions === 2) {
          newInterval = Math.round(this.config.easyInterval * easeFactor)
        } else {
          newInterval = Math.round(interval * easeFactor * this.config.intervalModifier * 1.3)
        }
        break
      }
    }

    if (accuracy !== undefined && accuracy < 60) {
      newInterval = Math.max(1, Math.round(newInterval * 0.5))
    }

    return {
      interval: newInterval,
      easeFactor: parseFloat(newEaseFactor.toFixed(2)),
      repetitions: newRepetitions,
      nextReviewAt: addDays(new Date(), newInterval).toISOString(),
    }
  }

  getInitialReview(exerciseId: string, resultId: string): ExerciseReviewRecord {
    return {
      id: generateId(),
      exerciseId,
      resultId,
      lastReviewedAt: now(),
      nextReviewAt: addDays(new Date(), this.config.initialInterval).toISOString(),
      interval: this.config.initialInterval,
      easeFactor: this.config.initialEaseFactor,
      repetitions: 0,
      history: [],
      createdAt: now(),
      updatedAt: now(),
    }
  }

  updateReview(
    review: ExerciseReviewRecord,
    rating: ReviewRating,
    accuracy?: number,
  ): ExerciseReviewRecord {
    const result = this.schedule({
      rating,
      interval: review.interval,
      easeFactor: review.easeFactor,
      repetitions: review.repetitions,
      accuracy,
    })

    return {
      ...review,
      lastReviewedAt: now(),
      nextReviewAt: result.nextReviewAt,
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
      history: [
        ...review.history,
        {
          date: now(),
          rating,
          score: accuracy ?? 0,
        },
      ],
      updatedAt: now(),
    }
  }
}

export interface ExerciseReviewEligibility {
  dueNow: ExerciseReviewRecord[]
  dueSoon: ExerciseReviewRecord[]
  notDue: ExerciseReviewRecord[]
}

export class ReviewEligibilityChecker {

  check(records: ExerciseReviewRecord[], options?: { soonDays?: number }): ExerciseReviewEligibility {
    const now = new Date()
    const soonDays = options?.soonDays ?? 3
    const soonDate = addDays(now, soonDays)

    const dueNow: ExerciseReviewRecord[] = []
    const dueSoon: ExerciseReviewRecord[] = []
    const notDue: ExerciseReviewRecord[] = []

    for (const record of records) {
      const nextReview = new Date(record.nextReviewAt)
      if (nextReview <= now) {
        dueNow.push(record)
      } else if (nextReview <= soonDate) {
        dueSoon.push(record)
      } else {
        notDue.push(record)
      }
    }

    return { dueNow, dueSoon, notDue }
  }
}

export interface SchedulerStrategy {
  schedule(
    result: ExerciseResult,
    attempt: ExerciseAttempt,
  ): ExerciseReviewRecord
}

export class DefaultSchedulerStrategy implements SchedulerStrategy {
  schedule(result: ExerciseResult, _attempt: ExerciseAttempt): ExerciseReviewRecord {
    const sr = new SpacedRepetitionScheduler()
    const hasMistakes = result.mistakes.length > 0
    const accuracy = result.accuracy

    let rating: ReviewRating
    if (accuracy >= 90) {
      rating = 'easy'
    } else if (accuracy >= 70) {
      rating = 'good'
    } else if (accuracy >= 50) {
      rating = 'hard'
    } else {
      rating = 'again'
    }

    if (hasMistakes && rating !== 'again') {
      rating = 'hard'
    }

    const srResult = sr.schedule({
      rating,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      accuracy,
    })

    return {
      id: generateId(),
      exerciseId: result.exerciseId,
      resultId: result.id,
      lastReviewedAt: now(),
      nextReviewAt: srResult.nextReviewAt,
      interval: srResult.interval,
      easeFactor: srResult.easeFactor,
      repetitions: srResult.repetitions,
      history: [{
        date: now(),
        rating,
        score: accuracy,
      }],
      createdAt: now(),
      updatedAt: now(),
    }
  }
}

export class AdaptiveSchedulerStrategy implements SchedulerStrategy {
  schedule(result: ExerciseResult, attempt: ExerciseAttempt): ExerciseReviewRecord {
    const sr = new SpacedRepetitionScheduler()
    const accuracy = result.accuracy
    const timeRatio = attempt.timeSpentSeconds / (result.total * 30)
    const hasMistakes = result.mistakes.length > 0
    const mistakeRatio = result.mistakes.length / result.total

    let baseRating: ReviewRating
    if (accuracy >= 90 && timeRatio < 1.5 && !hasMistakes) {
      baseRating = 'easy'
    } else if (accuracy >= 75 && timeRatio < 2) {
      baseRating = 'good'
    } else if (accuracy >= 50) {
      baseRating = 'hard'
    } else {
      baseRating = 'again'
    }

    if (mistakeRatio > 0.3 && baseRating !== 'again') {
      baseRating = 'hard'
    }

    const srResult = sr.schedule({
      rating: baseRating,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      accuracy,
    })

    let adjustedInterval = srResult.interval
    if (timeRatio > 3 && accuracy < 80) {
      adjustedInterval = Math.max(1, Math.round(adjustedInterval * 0.7))
    }

    return {
      id: generateId(),
      exerciseId: result.exerciseId,
      resultId: result.id,
      lastReviewedAt: now(),
      nextReviewAt: addDays(new Date(), adjustedInterval).toISOString(),
      interval: adjustedInterval,
      easeFactor: srResult.easeFactor,
      repetitions: srResult.repetitions,
      history: [{
        date: now(),
        rating: baseRating,
        score: accuracy,
      }],
      createdAt: now(),
      updatedAt: now(),
    }
  }
}

export class ReviewScheduler {
  private scheduler: SpacedRepetitionScheduler
  private checker: ReviewEligibilityChecker
  private strategy: SchedulerStrategy

  constructor(
    strategy?: SchedulerStrategy,
    config?: Partial<ReviewScheduleConfig>,
  ) {
    this.scheduler = new SpacedRepetitionScheduler(config)
    this.checker = new ReviewEligibilityChecker()
    this.strategy = strategy ?? new DefaultSchedulerStrategy()
  }

  createInitialReview(exerciseId: string, resultId: string): ExerciseReviewRecord {
    return this.scheduler.getInitialReview(exerciseId, resultId)
  }

  scheduleReview(result: ExerciseResult, attempt: ExerciseAttempt): ExerciseReviewRecord {
    return this.strategy.schedule(result, attempt)
  }

  updateReview(review: ExerciseReviewRecord, rating: ReviewRating, accuracy?: number): ExerciseReviewRecord {
    return this.scheduler.updateReview(review, rating, accuracy)
  }

  getDueReviews(records: ExerciseReviewRecord[], options?: { soonDays?: number }): ExerciseReviewEligibility {
    return this.checker.check(records, options)
  }

  getPriorityOrder(records: ExerciseReviewRecord[]): ExerciseReviewRecord[] {
    return [...records].sort((a, b) => {
      const aDate = new Date(a.nextReviewAt).getTime()
      const bDate = new Date(b.nextReviewAt).getTime()
      if (aDate !== bDate) return aDate - bDate

      const aEase = a.easeFactor
      const bEase = b.easeFactor
      return aEase - bEase
    })
  }

  getStats(records: ExerciseReviewRecord[]) {
    const now = new Date()
    const dueNow = records.filter(r => new Date(r.nextReviewAt) <= now)
    const dueThisWeek = records.filter(r => {
      const d = new Date(r.nextReviewAt)
      return d > now && d <= addDays(now, 7)
    })
    const mastered = records.filter(r => r.interval >= 60 && r.repetitions >= 5)

    return {
      total: records.length,
      dueNow: dueNow.length,
      dueThisWeek: dueThisWeek.length,
      mastered: mastered.length,
      averageEaseFactor: records.length > 0
        ? parseFloat((records.reduce((s, r) => s + r.easeFactor, 0) / records.length).toFixed(2))
        : 0,
      averageInterval: records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.interval, 0) / records.length)
        : 0,
    }
  }
}

export function createDefaultReviewScheduler(): ReviewScheduler {
  return new ReviewScheduler(new DefaultSchedulerStrategy())
}

export function createAdaptiveReviewScheduler(): ReviewScheduler {
  return new ReviewScheduler(new AdaptiveSchedulerStrategy())
}
