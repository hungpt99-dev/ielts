import type { LearnerStateSnapshot } from '../../domain/entities/learner-context'

export interface RoadmapAdjustmentRecommendation {
  type: 'reschedule' | 'reduce-load' | 'increase-focus' | 'add-mock-tests'
  reason: string
  suggestedChanges: string[]
}

export function recommendRoadmapAdjustment(state: LearnerStateSnapshot): RoadmapAdjustmentRecommendation | null {
  if (!state.roadmap) return null

  if (state.exam.daysUntilExam !== null && state.exam.daysUntilExam <= 30) {
    return {
      type: 'add-mock-tests',
      reason: `${state.exam.daysUntilExam} days until exam — time to increase timed practice`,
      suggestedChanges: [
        'Add weekly mock tests',
        'Focus on error review',
        'Reduce new material intake',
      ],
    }
  }

  if (state.roadmap.missedTasks >= 3) {
    return {
      type: 'reduce-load',
      reason: `${state.roadmap.missedTasks} missed tasks — consider adjusting the workload`,
      suggestedChanges: [
        'Reduce daily task count',
        'Reschedule missed tasks to lighter days',
        'Review why tasks were missed',
      ],
    }
  }

  const weakSkillsWithGap = Object.entries(state.skillStates)
    .filter(([_, s]) => s.gap && s.gap >= 1.5)
    .map(([skill]) => skill)

  if (weakSkillsWithGap.length > 0) {
    return {
      type: 'increase-focus',
      reason: `${weakSkillsWithGap.join(' and ')} need${weakSkillsWithGap.length === 1 ? 's' : ''} more focus to close the gap`,
      suggestedChanges: [
        `Increase ${weakSkillsWithGap[0]} study time by 20%`,
        'Add skill-specific practice sessions',
      ],
    }
  }

  return null
}
