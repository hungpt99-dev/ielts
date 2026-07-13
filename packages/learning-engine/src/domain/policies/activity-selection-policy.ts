import type { IELTSSection } from '../value-objects'
import type { ActivityType } from '../entities/learning-activity'
import type { LearningContext } from '../entities/learning-context'

export interface ActivityPlan {
  activities: Array<{ type: ActivityType; minutes: number }>
  reason: string
}

export function planActivities(
  _context: LearningContext,
  availableMinutes: number,
  _skill: IELTSSection,
  objectiveType: string,
): ActivityPlan {
  if (availableMinutes <= 5) {
    return {
      activities: [{ type: 'independent-exercise', minutes: availableMinutes }],
      reason: 'Short session — direct practice recommended',
    }
  }

  if (objectiveType === 'review' || objectiveType === 'reflect') {
    return planReviewSession(availableMinutes)
  }

  if (availableMinutes <= 15) {
    const exerciseMinutes = availableMinutes - 2
    return {
      activities: [
        { type: 'independent-exercise', minutes: exerciseMinutes },
        { type: 'reflection', minutes: 2 },
      ],
      reason: 'Brief session — focused exercise with quick reflection',
    }
  }

  if (availableMinutes <= 30) {
    return {
      activities: [
        { type: 'guided-exercise', minutes: Math.floor(availableMinutes * 0.4) },
        { type: 'independent-exercise', minutes: Math.floor(availableMinutes * 0.4) },
        { type: 'reflection', minutes: Math.floor(availableMinutes * 0.2) },
      ],
      reason: 'Standard session — guided practice followed by independent work',
    }
  }

  return {
    activities: [
      { type: 'explanation', minutes: Math.floor(availableMinutes * 0.1) },
      { type: 'worked-example', minutes: Math.floor(availableMinutes * 0.15) },
      { type: 'guided-exercise', minutes: Math.floor(availableMinutes * 0.3) },
      { type: 'independent-exercise', minutes: Math.floor(availableMinutes * 0.3) },
      { type: 'reflection', minutes: Math.floor(availableMinutes * 0.15) },
    ],
    reason: 'Full session — explanation, examples, guided and independent practice',
  }
}

function planReviewSession(availableMinutes: number): ActivityPlan {
  return {
    activities: [
      { type: 'explanation', minutes: Math.floor(availableMinutes * 0.2) },
      { type: 'guided-exercise', minutes: Math.floor(availableMinutes * 0.5) },
      { type: 'reflection', minutes: Math.floor(availableMinutes * 0.3) },
    ],
    reason: 'Review session — explanation followed by guided practice',
  }
}
