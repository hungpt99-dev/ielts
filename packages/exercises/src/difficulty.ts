import type { ExerciseDifficulty } from './types'

export interface DifficultyAdjustmentParams {
  currentDifficulty: ExerciseDifficulty
  recentAccuracy: number
  recentAttempts: number
  streak: number
  totalAttempts: number
}

export interface DifficultyAdjustmentResult {
  suggestedDifficulty: ExerciseDifficulty
  confidence: number
  reason: string
}

export interface DifficultyAdjustmentStrategy {
  adjust(params: DifficultyAdjustmentParams): DifficultyAdjustmentResult
  readonly name: string
}

const DIFFICULTY_ORDER: ExerciseDifficulty[] = ['beginner', 'intermediate', 'advanced']

function getDifficultyIndex(d: ExerciseDifficulty): number {
  return DIFFICULTY_ORDER.indexOf(d)
}

export class ProgressiveDifficultyStrategy implements DifficultyAdjustmentStrategy {
  readonly name = 'progressive'

  adjust(params: DifficultyAdjustmentParams): DifficultyAdjustmentResult {
    const { currentDifficulty, recentAccuracy, recentAttempts, streak, totalAttempts } = params
    const currentIndex = getDifficultyIndex(currentDifficulty)

    if (recentAttempts < 3) {
      return {
        suggestedDifficulty: currentDifficulty,
        confidence: 20,
        reason: 'Not enough data to adjust difficulty',
      }
    }

    if (recentAccuracy >= 90 && streak >= 3) {
      if (currentIndex < DIFFICULTY_ORDER.length - 1) {
        const next = DIFFICULTY_ORDER[currentIndex + 1]
        return {
          suggestedDifficulty: next,
          confidence: Math.min(100, 60 + streak * 5),
          reason: `High accuracy (${recentAccuracy}%) with ${streak} streak — advancing to ${next}`,
        }
      }
      return {
        suggestedDifficulty: currentDifficulty,
        confidence: 95,
        reason: 'Already at maximum difficulty with excellent performance',
      }
    }

    if (recentAccuracy < 50 && totalAttempts >= 3) {
      if (currentIndex > 0) {
        const prev = DIFFICULTY_ORDER[currentIndex - 1]
        return {
          suggestedDifficulty: prev,
          confidence: Math.min(100, 60 + (50 - recentAccuracy)),
          reason: `Low accuracy (${recentAccuracy}%) — reducing to ${prev}`,
        }
      }
      return {
        suggestedDifficulty: currentDifficulty,
        confidence: 50,
        reason: 'Struggling at the easiest level — consider reviewing fundamentals',
      }
    }

    if (recentAccuracy >= 70 && recentAccuracy < 90) {
      return {
        suggestedDifficulty: currentDifficulty,
        confidence: 60,
        reason: `Adequate performance (${recentAccuracy}%) — maintaining current difficulty`,
      }
    }

    return {
      suggestedDifficulty: currentDifficulty,
      confidence: 50,
      reason: `Mixed performance (${recentAccuracy}%) — keeping current level`,
    }
  }
}

export class ConservativeDifficultyStrategy implements DifficultyAdjustmentStrategy {
  readonly name = 'conservative'

  adjust(params: DifficultyAdjustmentParams): DifficultyAdjustmentResult {
    const { currentDifficulty, recentAccuracy, recentAttempts, totalAttempts } = params
    const currentIndex = getDifficultyIndex(currentDifficulty)

    if (recentAttempts < 5) {
      return {
        suggestedDifficulty: currentDifficulty,
        confidence: 20,
        reason: 'Need at least 5 recent attempts to adjust',
      }
    }

    if (recentAccuracy >= 95 && totalAttempts >= 10) {
      if (currentIndex < DIFFICULTY_ORDER.length - 1) {
        const next = DIFFICULTY_ORDER[currentIndex + 1]
        return {
          suggestedDifficulty: next,
          confidence: 70,
          reason: `Sustained high performance (${recentAccuracy}%) — advancing to ${next}`,
        }
      }
      return { suggestedDifficulty: currentDifficulty, confidence: 90, reason: 'Maximum difficulty reached' }
    }

    if (recentAccuracy < 40 && totalAttempts >= 5) {
      if (currentIndex > 0) {
        const prev = DIFFICULTY_ORDER[currentIndex - 1]
        return {
          suggestedDifficulty: prev,
          confidence: 70,
          reason: `Consistently low accuracy (${recentAccuracy}%) — reducing to ${prev}`,
        }
      }
      return { suggestedDifficulty: currentDifficulty, confidence: 40, reason: 'Struggling at base level' }
    }

    return { suggestedDifficulty: currentDifficulty, confidence: 50, reason: 'No change needed' }
  }
}

export class AggressiveDifficultyStrategy implements DifficultyAdjustmentStrategy {
  readonly name = 'aggressive'

  adjust(params: DifficultyAdjustmentParams): DifficultyAdjustmentResult {
    const { currentDifficulty, recentAccuracy, streak } = params
    const currentIndex = getDifficultyIndex(currentDifficulty)

    if (recentAccuracy >= 80 && streak >= 2) {
      if (currentIndex < DIFFICULTY_ORDER.length - 1) {
        const next = DIFFICULTY_ORDER[currentIndex + 1]
        return {
          suggestedDifficulty: next,
          confidence: 80,
          reason: `Strong performance (${recentAccuracy}%, ${streak} streak) — advancing to ${next}`,
        }
      }
      return { suggestedDifficulty: currentDifficulty, confidence: 90, reason: 'Maximum level' }
    }

    if (recentAccuracy < 60) {
      if (currentIndex > 0) {
        const prev = DIFFICULTY_ORDER[currentIndex - 1]
        return {
          suggestedDifficulty: prev,
          confidence: Math.min(100, 70 + (60 - recentAccuracy)),
          reason: `Accuracy dropped to ${recentAccuracy}% — reducing to ${prev}`,
        }
      }
      return { suggestedDifficulty: currentDifficulty, confidence: 40, reason: 'Struggling at base level' }
    }

    return { suggestedDifficulty: currentDifficulty, confidence: 50, reason: 'Maintaining current level' }
  }
}

export class DifficultyAdjuster {
  private strategies: Map<string, DifficultyAdjustmentStrategy>
  private defaultStrategy: DifficultyAdjustmentStrategy

  constructor(strategies?: DifficultyAdjustmentStrategy[]) {
    this.strategies = new Map()
    if (strategies) {
      for (const s of strategies) this.strategies.set(s.name, s)
    }
    this.defaultStrategy = this.strategies.get('progressive') ?? new ProgressiveDifficultyStrategy()
  }

  registerStrategy(strategy: DifficultyAdjustmentStrategy): void {
    this.strategies.set(strategy.name, strategy)
  }

  adjust(params: DifficultyAdjustmentParams, strategyName?: string): DifficultyAdjustmentResult {
    const strategy = strategyName ? (this.strategies.get(strategyName) ?? this.defaultStrategy) : this.defaultStrategy
    return strategy.adjust(params)
  }

  getQuestionDifficulty(totalQuestions: number): ExerciseDifficulty[] {
    const difficulties: ExerciseDifficulty[] = []
    for (let i = 0; i < totalQuestions; i++) {
      if (i < totalQuestions * 0.3) {
        difficulties.push('beginner')
      } else if (i < totalQuestions * 0.7) {
        difficulties.push('intermediate')
      } else {
        difficulties.push('advanced')
      }
    }
    return difficulties
  }

  estimateDifficultyFromAccuracy(accuracy: number): ExerciseDifficulty {
    if (accuracy >= 85) return 'advanced'
    if (accuracy >= 60) return 'intermediate'
    return 'beginner'
  }
}

export function createDefaultDifficultyAdjuster(): DifficultyAdjuster {
  return new DifficultyAdjuster([
    new ProgressiveDifficultyStrategy(),
    new ConservativeDifficultyStrategy(),
    new AggressiveDifficultyStrategy(),
  ])
}
