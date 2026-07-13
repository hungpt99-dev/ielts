import type { IELTSSection } from '../value-objects'
import type { SkillState } from '../entities/learner-context'

export interface SkillPriorityAnalysis {
  ranked: RankedSkill[]
  focusSkill: IELTSSection | null
  gaps: SkillGap[]
}

export interface RankedSkill {
  skill: IELTSSection
  priorityScore: number
  reason: string
  currentBand?: number
  targetBand?: number
  gap?: number
}

export interface SkillGap {
  skill: IELTSSection
  gap: number
  urgency: 'low' | 'medium' | 'high'
}

export function analyzeSkillPriorities(
  skillStates: Record<IELTSSection, SkillState>,
  weakSkills: IELTSSection[],
): SkillPriorityAnalysis {
  const ranked: RankedSkill[] = Object.values(skillStates).map(s => {
    const gap = (s.targetBand ?? 0) - (s.currentBand ?? 0)
    let score = 0
    const reasons: string[] = []

    if (gap > 0) {
      score += gap * 10
      reasons.push(`gap of ${gap} bands`)
    }

    if (weakSkills.includes(s.skill)) {
      score += 20
      reasons.push('declared weak skill')
    }

    if (s.trend === 'declining') {
      score += 15
      reasons.push('trend is declining')
    }

    if (s.recentPerformance !== undefined && s.recentPerformance < 50) {
      score += 10
      reasons.push(`recent accuracy ${s.recentPerformance}%`)
    }

    return {
      skill: s.skill,
      priorityScore: score,
      reason: reasons.join(', ') || 'balanced performance',
      currentBand: s.currentBand,
      targetBand: s.targetBand,
      gap: gap > 0 ? gap : undefined,
    }
  })

  ranked.sort((a, b) => b.priorityScore - a.priorityScore)

  const focusSkill = ranked.length > 0 ? ranked[0].skill : null

  const gaps: SkillGap[] = ranked
    .filter(r => r.gap !== undefined && r.gap > 0)
    .map(r => ({
      skill: r.skill,
      gap: r.gap!,
      urgency: r.gap! >= 2 ? 'high' : r.gap! >= 1 ? 'medium' : 'low',
    }))

  return { ranked, focusSkill, gaps }
}
