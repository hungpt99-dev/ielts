import type { IELTSSection } from './ielts-section'

export interface LearnerContext {
  generatedAt: string

  profile: {
    currentOverallBand?: number
    targetOverallBand?: number
    currentSkillBands: Partial<Record<IELTSSection, number>>
    targetSkillBands: Partial<Record<IELTSSection, number>>
    examDate?: string
    examType?: string
    timezone: string
    preferredLanguage: string
    studyIntensity?: string
    weakSkills: IELTSSection[]
    strongSkills: IELTSSection[]
  }

  exam: {
    examDate: string | null
    daysUntilExam: number | null
    isUrgent: boolean
    isFinalWeek: boolean
  }

  studyPlan?: {
    active: boolean
    currentPhase: string | null
    currentWeek: number | null
    roadmapId?: string
    todayTasks: Array<{
      id: string
      title: string
      skill: IELTSSection
      estimatedMinutes: number
      isCompleted: boolean
      isMissed: boolean
      dueDate: string
    }>
    nextTasks: Array<{
      id: string
      title: string
      skill: IELTSSection
      estimatedMinutes: number
      isCompleted: boolean
      isMissed: boolean
      dueDate: string
    }>
    completedTasks: number
    missedTasks: number
    weeklyStudyMinutesTarget: number
    weeklyStudyMinutesCompleted: number
    taskObjective?: string
    taskReason?: string
    allocatedMinutes?: number
  }

  progress: {
    overallCompletionPercent: number
    weeklyCompletionPercent?: number
    skillProgress: Partial<Record<IELTSSection, {
      currentBand?: number
      targetBand?: number
      recentAccuracy?: number
      exercisesCompleted: number
      trend: string
    }>>
    studyStreak: number
    inactiveDays?: number
    consistency?: number
    recentStudyMinutes?: number
    trendBySkill: Partial<Record<IELTSSection, string>>
  }

  skillStates: Record<IELTSSection, {
    skill: IELTSSection
    currentBand?: number
    targetBand?: number
    gap?: number
    recentPerformance?: number
    trend: string
    confidence: number
    priorityScore: number
    frequentWeaknesses: string[]
    recentStrengths: string[]
    lastPracticedAt?: string
  }>

  weaknesses: Array<{
    skill: IELTSSection
    description: string
    severity: number
  }>

  strengths: Array<{
    skill: IELTSSection
    description: string
  }>

  mistakeSummary: {
    total: number
    unreviewed: number
    recentCount: number
    recurringPatterns: Array<{
      pattern: string
      skill: IELTSSection
      frequency: number
      examples: string[]
    }>
    bySkill: Partial<Record<IELTSSection, number>>
    recentMistakes: Array<{
      skill: IELTSSection
      category: string
      frequency: number
      lastOccurred: string
    }>
  }

  vocabularySummary: {
    totalSaved: number
    dueForReview: number
    mastered: number
    byTopic: Record<string, number>
    items: Array<{
      wordId: string
      word: string
      mastery: number
      dueForReview: boolean
      topic?: string
    }>
  }

  activitySummary: {
    lastActiveAt: string | null
    todayStudyMinutes: number
    weeklyStudyMinutes: number
    tasksCompletedToday: number
  }

  recentAttempts: Array<{
    sessionId: string
    exerciseId: string
    score: number
    maximumScore: number
    completedAt: string
  }>

  previousFeedback: Array<{
    attemptId: string
    overallFeedback: string
    strengths: string[]
    weaknesses: string[]
  }>

  relevantContent: Array<{
    id: string
    type: string
    title?: string
    topic?: string
  }>

  preferences: {
    preferredMode?: string
    language: string
    explanationLevel?: string
    correctionStyle?: string
    proactiveEnabled?: boolean
    maxProactiveMessagesPerDay?: number
    allowedCategories?: string[]
    preferredLearningMethods: string[]
    preferredTaskTypes: string[]
    preferredDifficulty?: string
    maximumSessionMinutes?: number
  }

  constraints: {
    items: Array<{
      type: string
      details?: string
    }>
    availableMinutes?: number
    offlineOnly: boolean
    aiAvailable: boolean
  }

  contextQuality: {
    status: string
    missingSources: string[]
    staleSources?: string[]
    warnings: string[]
  }
}
