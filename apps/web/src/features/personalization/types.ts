import type { StudyGoal, TaskEntry } from '../../models'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type SkillType = 'Vocabulary' | 'Reading' | 'Listening' | 'Writing' | 'Speaking' | 'Grammar'

export type RecommendationPriority = 'high' | 'medium' | 'low'

export type RecommendationReason =
  | 'weak_skill'
  | 'exam_urgency'
  | 'missed_task'
  | 'due_review'
  | 'low_accuracy'
  | 'streak_maintenance'
  | 'skill_balance'
  | 'spaced_repetition'
  | 'roadmap_next'
  | 'recommended_content'

export interface Recommendation {
  id: string
  type: 'task' | 'review' | 'content' | 'exercise' | 'practice'
  skill: SkillType
  title: string
  description: string
  reason: RecommendationReason
  priority: RecommendationPriority
  estimatedMinutes: number
  context?: string
  actionLabel: string
  actionPath: string
}

export interface WeakSkillAnalysis {
  skill: SkillType
  accuracy: number
  mistakeCount: number
  trend: 'improving' | 'declining' | 'stable'
  daysSincePractice: number
  taskCount: number
}

export interface PersonalizationContext {
  profile: {
    targetBand: number
    currentBand: number
    examDate: string
    dailyStudyMinutes: number
    weakSkills: SkillType[]
    studyGoal: StudyGoal
    preferredSchedule: DayOfWeek[]
  }
  progress: {
    studyStreak: number
    roadmapProgress: number
    todayUnfinished: number
    weeklyTasksDone: number
    weeklyTasksTotal: number
    totalStudyHours: number
  }
  vocabulary: {
    totalWords: number
    dueForReview: number
    recentCount: number
    masteredCount: number
    learningCount: number
  }
  mistakes: {
    total: number
    recent: number
    bySkill: Record<string, number>
    dueForReview: number
    topSkill: SkillType | null
  }
  exam: {
    countdownDays: number
    isUrgent: boolean
    isExamSoon: boolean
  }
  tasks: {
    today: TaskEntry[]
    pending: TaskEntry[]
    completedCount: number
  }
  roadmap: {
    exists: boolean
    currentPhaseName: string
    phaseProgress: number
    currentSkillFocus: string | null
    nextTaskTitle: string | null
    nextTaskSkill: SkillType | null
  }
}
