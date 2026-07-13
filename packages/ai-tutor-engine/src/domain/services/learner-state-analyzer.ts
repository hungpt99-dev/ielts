import type { LearnerStateSnapshot, SkillState } from '../entities/learner-context'
import type { IELTSSection } from '../value-objects'

export function analyzeSkillPriorities(state: LearnerStateSnapshot): SkillState[] {
  return Object.values(state.skillStates)
    .map(skill => ({
      ...skill,
      priorityScore: calculatePriorityScore(skill, state),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
}

function calculatePriorityScore(skill: SkillState, state: LearnerStateSnapshot): number {
  const gapWeight = 0.4
  const performanceWeight = 0.25
  const preferenceWeight = 0.2
  const confidenceWeight = 0.15

  const gap = skill.gap ?? 0
  const gapScore = Math.min(gap / 9, 1) * gapWeight

  const perfScore = skill.recentPerformance !== undefined
    ? (1 - skill.recentPerformance / 100) * performanceWeight
    : 0.5 * performanceWeight

  const prefScore = state.profile.weakSkills.includes(skill.skill)
    ? 1 * preferenceWeight
    : 0

  const confScore = (1 - skill.confidence) * confidenceWeight

  return gapScore + perfScore + prefScore + confScore
}

export function getWeakestSkills(state: LearnerStateSnapshot, count: number = 3): IELTSSection[] {
  return analyzeSkillPriorities(state)
    .slice(0, count)
    .map(s => s.skill)
}
