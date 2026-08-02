import type { LifecyclePhase } from '../constants'

export type LifecycleTrigger =
  | 'FIRST_STUDY'
  | 'FIRST_PRACTICE'
  | 'REVIEW_SCHEDULED'
  | 'CORRECT_USAGE'
  | 'REVIEW_RATING'
  | 'INACTIVITY'

export interface TransitionContext {
  masteryScore?: number
  correctProductions?: number
  consecutiveAgainRatings?: number
  daysSinceLastInteraction?: number
}

export type LifecycleTransitionResult =
  | {
      status: 'transitioned'
      from: LifecyclePhase
      to: LifecyclePhase
      reason: string
    }
  | {
      status: 'no-op'
      from: LifecyclePhase
      to: LifecyclePhase
      reason: string
    }
  | {
      status: 'invalid'
      from: LifecyclePhase
      trigger: LifecycleTrigger
      reason: string
    }

const MASTERY_SCORE_THRESHOLD = 90
const MIN_CORRECT_PRODUCTIONS = 3
const REGRESSION_AGAIN_RATINGS = 3
const MAINTENANCE_DAYS = 30
const FORGOTTEN_DAYS = 90

export function determineNextLifecycle(
  currentPhase: LifecyclePhase,
  trigger: LifecycleTrigger,
  context: TransitionContext = {},
): LifecycleTransitionResult {
  const target = resolveTarget(currentPhase, trigger, context)

  if (target === null) {
    return {
      status: 'invalid',
      from: currentPhase,
      trigger,
      reason: `Transition '${trigger}' is not applicable from phase '${currentPhase}'`,
    }
  }

  if (target === currentPhase) {
    return {
      status: 'no-op',
      from: currentPhase,
      to: currentPhase,
      reason: `Already in phase '${currentPhase}'`,
    }
  }

  return {
    status: 'transitioned',
    from: currentPhase,
    to: target,
    reason: `${trigger}: ${currentPhase} → ${target}`,
  }
}

function resolveTarget(
  currentPhase: LifecyclePhase,
  trigger: LifecycleTrigger,
  context: TransitionContext,
): LifecyclePhase | null {
  switch (trigger) {
    case 'FIRST_STUDY':
      if (currentPhase === 'DISCOVERED') return 'LEARNING'
      if (currentPhase === 'LEARNING') return 'LEARNING'
      return null
    case 'FIRST_PRACTICE':
      if (currentPhase === 'LEARNING') return 'PRACTICING'
      if (currentPhase === 'PRACTICING') return 'PRACTICING'
      return null
    case 'REVIEW_SCHEDULED':
      if (currentPhase === 'PRACTICING') return 'REVIEWING'
      if (currentPhase === 'REVIEWING') return 'REVIEWING'
      return null
    case 'CORRECT_USAGE':
      if (currentPhase === 'REVIEWING') return 'USING'
      if (currentPhase === 'USING') {
        const meetsMastery =
          (context.masteryScore ?? 0) >= MASTERY_SCORE_THRESHOLD &&
          (context.correctProductions ?? 0) >= MIN_CORRECT_PRODUCTIONS
        return meetsMastery ? 'MASTERED' : 'USING'
      }
      return null
    case 'REVIEW_RATING': {
      const againRatings = context.consecutiveAgainRatings ?? 0
      return againRatings >= REGRESSION_AGAIN_RATINGS ? 'LEARNING' : currentPhase
    }
    case 'INACTIVITY': {
      const days = context.daysSinceLastInteraction ?? 0
      if (days >= FORGOTTEN_DAYS) return 'DISCOVERED'
      if (currentPhase === 'MASTERED' && days >= MAINTENANCE_DAYS) return 'REVIEWING'
      return currentPhase
    }
  }
}
