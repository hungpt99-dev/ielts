import type { ISOString, TaskCategory } from '../../models'

export type StudySkill =
  | 'Vocabulary'
  | 'Reading'
  | 'Listening'
  | 'Writing'
  | 'Speaking'
  | 'Grammar'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type StudyIntensity = 'light' | 'moderate' | 'intense' | 'intensive'

export type PreferredLanguage = 'english' | 'vietnamese' | 'both'

export type PlanPhaseName =
  | 'Foundation'
  | 'Skill Improvement'
  | 'Weakness Fixing'
  | 'Mock Test'
  | 'Final Review'

export type PlanStatus =
  | 'draft'
  | 'generating'
  | 'complete'
  | 'partial'
  | 'failed'
  | 'cancelled'

export type DailyPlanStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'skipped'
  | 'partially-completed'

export type DayPriority = 'low' | 'medium' | 'high' | 'critical'

export type DayDifficulty = 'easy' | 'medium' | 'hard'

export type GenerationStep =
  | 'creating-strategy'
  | 'generating-chunk'
  | 'validating-chunk'
  | 'repairing-days'
  | 'finalizing'

export type SkillFocus = StudySkill | 'mixed' | 'rest'

export interface StudyPlanUserProfile {
  currentBand: number
  targetBand: number
  examDate: string
  dailyStudyMinutes: number
  preferredStudyDays: DayOfWeek[]
  restDays: DayOfWeek[]
  weakSkills: StudySkill[]
  strongSkills: StudySkill[]
  mainFocusSkills: StudySkill[]
  studyIntensity: StudyIntensity
  preferredLanguage: PreferredLanguage
  includeMockTests: boolean
  includeVocabularyReview: boolean
  includeGrammarReview: boolean
  includeWeeklyProgressReview: boolean
  includeFinalExamPreparationWeek: boolean
  studyGoal: 'academic' | 'general'
  preferredTopics: string[]
}

export interface StudyPlanCalculatedMeta {
  today: string
  examDate: string
  totalDays: number
  studyDays: number
  restDaysCount: number
  totalWeeks: number
  finalReviewPeriodDays: number
  mockTestSchedule: string[]
  skillPriority: StudySkill[]
}

export interface PhaseWeeklyGoal {
  weekNumber: number
  startDate: string
  endDate: string
  focusArea: string
  goal: string
  keyActivities: string[]
  mockTestPlanned: boolean
}

export interface PhaseBreakdown {
  phaseName: PlanPhaseName
  description: string
  startDate: string
  endDate: string
  weekCount: number
  mainFocus: string
  targetSkill: StudySkill | 'all'
  weeklyGoals: PhaseWeeklyGoal[]
}

export interface GlobalStudyStrategy {
  planSummary: string
  phaseBreakdown: PhaseBreakdown[]
  weeklyGoals: PhaseWeeklyGoal[]
  mockTestSchedule: Array<{
    weekNumber: number
    date: string
    focus: string
  }>
  finalWeekStrategy: string
  adjustmentRules: string[]
  createdAt: ISOString
}

export interface DailyStudyTask {
  id: string
  skill: StudySkill
  title: string
  description: string
  estimatedMinutes: number
  category: TaskCategory
  isCompleted: boolean
  notes: string
}

export interface DailyPlanItem {
  id: string
  planId: string
  date: string
  dayNumber: number
  weekNumber: number
  phaseName: PlanPhaseName
  mainGoal: string
  listeningTask: DailyStudyTask | null
  readingTask: DailyStudyTask | null
  writingTask: DailyStudyTask | null
  speakingTask: DailyStudyTask | null
  vocabularyTask: DailyStudyTask | null
  grammarTask: DailyStudyTask | null
  reviewTask: DailyStudyTask | null
  optionalTasks: DailyStudyTask[]
  estimatedTotalMinutes: number
  priority: DayPriority
  difficulty: DayDifficulty
  status: DailyPlanStatus
  aiTutorNote: string
  completionChecklist: string[]
  createdAt: ISOString
  updatedAt: ISOString
}

export interface DailyPlanChunk {
  chunkIndex: number
  totalChunks: number
  startDate: string
  endDate: string
  startDayNumber: number
  endDayNumber: number
  days: DailyPlanItem[]
}

export interface StudyPlanData {
  id: string
  profileSnapshot: StudyPlanUserProfile
  calculatedMeta: StudyPlanCalculatedMeta
  globalStrategy: GlobalStudyStrategy
  dailyPlans: DailyPlanItem[]
  status: PlanStatus
  progress: {
    generatedDays: number
    totalDays: number
    percentage: number
  }
  createdAt: ISOString
  updatedAt: ISOString
}

export interface GenerationProgress {
  step: GenerationStep
  chunkIndex: number
  totalChunks: number
  currentDayStart: number
  currentDayEnd: number
  totalDays: number
  generatedDays: number
  message: string
}

export interface ValidationError {
  field: string
  message: string
  dayNumber?: number
  date?: string
}

export interface ChunkValidationResult {
  isValid: boolean
  errors: ValidationError[]
  missingDates: string[]
  duplicateDates: string[]
  invalidDays: number[]
}

export interface GenerationState {
  planId: string | null
  strategy: GlobalStudyStrategy | null
  dailyPlans: DailyPlanItem[]
  generatedDayNumbers: Set<number>
  failedChunks: number[]
  missingDayNumbers: number[]
  status: PlanStatus
  progress: GenerationProgress
  error: string | null
}

export interface PlanChunkRequest {
  userProfile: StudyPlanUserProfile
  calculatedMeta: StudyPlanCalculatedMeta
  globalStrategy: GlobalStudyStrategy
  alreadyGeneratedDays: Array<{
    dayNumber: number
    date: string
    phase: PlanPhaseName
  }>
  chunkStartDate: string
  chunkEndDate: string
  chunkDayNumbers: number[]
  chunkIndex: number
  totalChunks: number
  previousChunkSummary: string | null
}

export interface ContinueGenerationOptions {
  retainExistingDays: boolean
  retryFailedChunks: boolean
  fillMissingDays: boolean
}

export interface StudyPlanStoreEntry {
  id: string
  planData: StudyPlanData
  createdAt: ISOString
  updatedAt: ISOString
  version: number
}

export function calculateDefaultChunkSize(modelCapacity: 'small' | 'medium' | 'large'): number {
  switch (modelCapacity) {
    case 'small':
      return 3
    case 'medium':
      return 7
    case 'large':
      return 14
  }
}
