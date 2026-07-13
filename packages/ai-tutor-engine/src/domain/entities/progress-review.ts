import type { IELTSSection } from '../value-objects'

export interface ProgressReviewRequest {
  learnerState: import('./learner-context').LearnerStateSnapshot
  forceRegenerate?: boolean
}

export interface ProgressReviewResult {
  summary: string
  improvements: ProgressInsight[]
  weaknesses: ProgressInsight[]
  repeatedMistakes: RepeatedMistake[]
  studyConsistency: StudyConsistencyData
  roadmapCompletion: RoadmapCompletionData
  skillPriorityChanges: SkillPriorityChange[]
  recommendedFocus: string
  realisticNextActions: string[]
  examRisk: string | null
  generatedAt: string
}

export interface ProgressInsight {
  area: string
  evidence: string
  trend: 'improving' | 'stable' | 'declining'
}

export interface RepeatedMistake {
  pattern: string
  skill: IELTSSection
  frequency: number
  lastOccurrence: string
}

export interface StudyConsistencyData {
  weeklyCompletionRate: number
  plannedVsActual: number
  streakDays: number
  inactiveDays: number
}

export interface RoadmapCompletionData {
  overall: number
  phaseProgress: Array<{ phase: string; completed: number; total: number }>
}

export interface SkillPriorityChange {
  skill: IELTSSection
  previousPriority: number
  currentPriority: number
  reason: string
}

export interface LearnerProgressAnalysis {
  overallTrend: 'improving' | 'stable' | 'declining' | 'unknown'
  skillTrends: Record<IELTSSection, SkillProgressTrend>
  strengths: ProgressInsight[]
  weaknesses: ProgressInsight[]
  risks: ProgressRisk[]
  milestones: ProgressMilestone[]
  recommendedPriorities: TutorPriority[]
  confidence: number
}

export interface SkillProgressTrend {
  trend: 'improving' | 'stable' | 'declining' | 'unknown'
  changeRate: number
  dataPoints: number
}

export interface ProgressRisk {
  type: 'exam-too-soon' | 'falling-behind' | 'skill-imbalance' | 'inactivity' | 'plateau'
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface ProgressMilestone {
  type: 'streak' | 'band-improvement' | 'completion' | 'consistency'
  label: string
  achievedAt: string
}

export interface TutorPriority {
  skill: IELTSSection
  score: number
  reason: string
}
