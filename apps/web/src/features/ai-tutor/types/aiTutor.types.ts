export interface TutorSession {
  focus: string
  lessonTitle: string
  reason: string
  estimatedTime: string
  skill: string
  focusArea: string
}

export interface LearningProfile {
  targetBand: string
  currentBand: number
  targetBandNum: number
  examDate: string
  examCountdown: number
  weakSkills: string
  weakSkillsList: string[]
  todayFocus: string
  savedWords: number
  mistakesToReview: number
  studyStreak: number
  weeklyTasksDone: number
  weeklyTasksTotal: number
  totalStudyHours: number
  roadmapProgress: number
  dailyStudyMinutes: number
  vocabMastered: number
  vocabDueReview: number
  loading: boolean
}

export interface FeedbackSummary {
  mainWeakness: string
  mostCommonIssue: string
  recommendedNextStep: string
  streak: number
  examCountdown: number
  isExamUrgent: boolean
}

export interface TeacherAdviceItem {
  key: string
  title: string
  description: string
  iconName: 'target' | 'grammar' | 'vocabulary' | 'speaking'
  actionLabel: string
}

export interface ActivityItem {
  id: string
  label: string
  timestamp: number
}

export type AITutorEventType =
  | 'AI_TUTOR_PAGE_VIEWED'
  | 'TODAY_SESSION_STARTED'
  | 'TODAY_LESSON_STARTED'
  | 'MISTAKE_REVIEW_OPENED'
  | 'VOCAB_PRACTICE_STARTED'
  | 'STUDY_PLAN_UPDATE_CLICKED'
  | 'TEACHER_ADVICE_CLICKED'
  | 'ASK_TUTOR_SUBMITTED'
  | 'PROGRESS_REVIEW_VIEWED'
