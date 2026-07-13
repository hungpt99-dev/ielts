import type { LearnerProfile } from './learner-profile'
import type { BandScore, IELTSSection } from '../value-objects'

export type TutorContextScope =
  | 'chat'
  | 'proactive'
  | 'progress-review'
  | 'roadmap'
  | 'writing'
  | 'speaking'
  | 'reading'
  | 'listening'
  | 'vocabulary'
  | 'saved-content'
  | 'reminder'

export type TutorContextSource =
  | 'user-profile'
  | 'study-roadmap'
  | 'progress'
  | 'mistakes'
  | 'vocabulary'
  | 'saved-content'
  | 'tutor-history'
  | 'environment'
  | 'extension-page'

export type TutorInteractionSource =
  | 'chat-popup'
  | 'ai-tutor-page'
  | 'extension-mini-tutor'
  | 'roadmap'
  | 'vocabulary'
  | 'saved-content'
  | 'skill-tutor'
  | 'proactive-message'
  | 'reminder'

export interface TutorContextItem<T> {
  source: TutorContextSource
  data: T
  collectedAt: string
  relevantFrom?: string
  expiresAt?: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  confidence: number
}

export interface ExamContext {
  examDate: string | null
  daysUntilExam: number | null
  isUrgent: boolean
  isFinalWeek: boolean
}

export interface RoadmapContext {
  active: boolean
  currentPhase: string | null
  currentWeek: number | null
  todayTasks: RoadmapTask[]
  nextTasks: RoadmapTask[]
  completedTasks: number
  missedTasks: number
  weeklyStudyMinutesTarget: number
  weeklyStudyMinutesCompleted: number
}

export interface RoadmapTask {
  id: string
  title: string
  skill: IELTSSection
  estimatedMinutes: number
  isCompleted: boolean
  isMissed: boolean
  dueDate: string
}

export interface ProgressContext {
  overallCompletionPercent: number
  skillProgress: Partial<Record<IELTSSection, SkillProgressData>>
  weeklyCompletionPercent: number
  studyStreak: number
  inactiveDays: number
  consistency: number
}

export interface SkillProgressData {
  currentBand: BandScore | null
  targetBand: BandScore | null
  trend: 'improving' | 'stable' | 'declining' | 'unknown'
  exercisesCompleted: number
  accuracy: number | null
}

export interface MistakeSummary {
  total: number
  unreviewed: number
  recentCount: number
  recurringPatterns: MistakePattern[]
  bySkill: Partial<Record<IELTSSection, number>>
}

export interface MistakePattern {
  pattern: string
  skill: IELTSSection
  frequency: number
  examples: string[]
}

export interface VocabularySummary {
  totalSaved: number
  dueForReview: number
  mastered: number
  byTopic: Record<string, number>
}

export interface ActivitySummary {
  lastActiveAt: string | null
  todayStudyMinutes: number
  weeklyStudyMinutes: number
  tasksCompletedToday: number
}

export interface TutorPreferences {
  preferredMode: TutorMode
  language: 'english' | 'vietnamese' | 'both'
  explanationLevel: 'simple' | 'detailed' | 'expert'
  correctionStyle: 'gentle' | 'direct' | 'socratic'
  proactiveEnabled: boolean
  maxProactiveMessagesPerDay: number
  quietHoursStart: string
  quietHoursEnd: string
  allowedCategories: ProactiveCategory[]
}

export type TutorMode =
  | 'general-teacher'
  | 'study-coach'
  | 'roadmap-guide'
  | 'writing-tutor'
  | 'speaking-partner'
  | 'reading-tutor'
  | 'listening-tutor'
  | 'vocabulary-coach'
  | 'grammar-tutor'
  | 'mistake-review'
  | 'progress-review'
  | 'exam-preparation'

export type ProactiveCategory =
  | 'vocabulary-review'
  | 'mistake-review'
  | 'study-plan'
  | 'speaking-practice'
  | 'writing-practice'
  | 'reading-practice'
  | 'listening-practice'
  | 'exam-countdown'
  | 'motivation'
  | 'saved-content'
  | 'daily-tip'
  | 'progress-report'
  | 'suggestion'

export interface LearnerConstraint {
  type: 'quiet-hours' | 'daily-limit-reached' | 'offline' | 'no-ai' | 'cooldown'
  details?: string
}

export interface ContextQuality {
  status: 'complete' | 'partial' | 'insufficient' | 'stale'
  missingSources: TutorContextSource[]
  staleSources: TutorContextSource[]
  warnings: string[]
}

export interface LearnerStateSnapshot {
  generatedAt: string
  profile: LearnerProfile
  exam: ExamContext
  roadmap?: RoadmapContext
  progress: ProgressContext
  skillStates: Record<IELTSSection, SkillState>
  mistakeSummary: MistakeSummary
  vocabularySummary: VocabularySummary
  activitySummary: ActivitySummary
  preferences: TutorPreferences
  currentConstraints: LearnerConstraint[]
  contextQuality: ContextQuality
}

export interface SkillState {
  skill: IELTSSection
  currentBand?: number
  targetBand?: number
  gap?: number
  recentPerformance?: number
  trend: 'improving' | 'stable' | 'declining' | 'unknown'
  confidence: number
  priorityScore: number
  frequentWeaknesses: string[]
  recentStrengths: string[]
  lastPracticedAt?: string
}
