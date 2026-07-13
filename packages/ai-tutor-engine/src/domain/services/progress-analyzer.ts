import type { LearnerProgressAnalysis, ProgressRisk, ProgressInsight, ProgressMilestone } from '../entities/progress-review'
import type { LearnerStateSnapshot } from '../entities/learner-context'
import type { IELTSSection } from '../value-objects'

export function analyzeLearnerProgress(state: LearnerStateSnapshot): LearnerProgressAnalysis {
  const skillTrends = {} as Record<IELTSSection, LearnerProgressAnalysis['skillTrends'][IELTSSection]>
  for (const [skill, skillState] of Object.entries(state.skillStates)) {
    skillTrends[skill as IELTSSection] = {
      trend: skillState.trend,
      changeRate: calculateChangeRate(skillState),
      dataPoints: skillState.recentPerformance !== undefined ? 1 : 0,
    }
  }

  const strengths = detectStrengths(state)
  const weaknesses = detectWeaknesses(state)
  const risks = detectRisks(state)
  const milestones = detectMilestones(state)

  const overallTrend = determineOverallTrend(skillTrends)

  return {
    overallTrend,
    skillTrends,
    strengths,
    weaknesses,
    risks,
    milestones,
    recommendedPriorities: [],
    confidence: calculateConfidence(state),
  }
}

function calculateChangeRate(_skillState: LearnerStateSnapshot['skillStates'][IELTSSection]): number {
  return 0
}

function determineOverallTrend(
  _trends: Record<IELTSSection, LearnerProgressAnalysis['skillTrends'][IELTSSection]>,
): 'improving' | 'stable' | 'declining' | 'unknown' {
  return 'stable'
}

function detectStrengths(state: LearnerStateSnapshot): ProgressInsight[] {
  const insights: ProgressInsight[] = []
  for (const [skill, skillState] of Object.entries(state.skillStates)) {
    if (skillState.trend === 'improving') {
      insights.push({
        area: skill,
        evidence: `${skill} is improving`,
        trend: 'improving',
      })
    }
  }
  if (state.progress.studyStreak >= 7) {
    insights.push({
      area: 'consistency',
      evidence: `${state.progress.studyStreak}-day study streak`,
      trend: 'improving',
    })
  }
  return insights
}

function detectWeaknesses(state: LearnerStateSnapshot): ProgressInsight[] {
  const insights: ProgressInsight[] = []
  for (const [skill, skillState] of Object.entries(state.skillStates)) {
    if (skillState.trend === 'declining') {
      insights.push({
        area: skill,
        evidence: `${skill} is declining`,
        trend: 'declining',
      })
    }
    if (skillState.gap && skillState.gap >= 2) {
      insights.push({
        area: skill,
        evidence: `gap of ${skillState.gap} bands to target`,
        trend: 'stable',
      })
    }
  }
  if (state.mistakeSummary.recurringPatterns.length > 0) {
    insights.push({
      area: 'mistakes',
      evidence: `${state.mistakeSummary.recurringPatterns.length} recurring mistake pattern(s)`,
      trend: 'declining',
    })
  }
  return insights
}

function detectRisks(state: LearnerStateSnapshot): ProgressRisk[] {
  const risks: ProgressRisk[] = []

  if (state.exam.daysUntilExam !== null && state.exam.daysUntilExam <= 30) {
    risks.push({
      type: 'exam-too-soon',
      severity: state.exam.daysUntilExam <= 7 ? 'high' : 'medium',
      description: `${state.exam.daysUntilExam} days until exam`,
    })
  }

  if (state.progress.inactiveDays >= 7) {
    risks.push({
      type: 'inactivity',
      severity: 'high',
      description: `${state.progress.inactiveDays} days inactive`,
    })
  }

  return risks
}

function detectMilestones(state: LearnerStateSnapshot): ProgressMilestone[] {
  const milestones: ProgressMilestone[] = []

  if (state.progress.studyStreak > 0 && state.progress.studyStreak % 7 === 0) {
    milestones.push({
      type: 'streak',
      label: `${state.progress.studyStreak}-day study streak`,
      achievedAt: new Date().toISOString(),
    })
  }

  return milestones
}

function calculateConfidence(_state: LearnerStateSnapshot): number {
  return 0.7
}
