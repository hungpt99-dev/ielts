import type {
  TaskEntry,
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
  ReadingSession,
  ListeningSession,
  WritingSession,
  SpeakingSession,
  ReadingPracticeSession,
  ListeningPracticeSession,
  MockTestEntry,
  ProgressRecord,
  TopicProgress,
} from '@ielts/storage'

export type ISOString = string

export type StudySkill = 'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary' | 'grammar'

export interface ProfileData {
  targetBand: number
  currentBand: number
  bandProgress: number
  examDate: ISOString | null
  examCountdownDays: number | null
  studyStreak: number
  lastStudyDate: ISOString | null
  dailyStudyMinutes: number
}

export interface WeeklyProgress {
  weekStart: ISOString
  weekEnd: ISOString
  totalMinutes: number
  tasksCompleted: number
  daysActive: number
  dailyBreakdown: DayProgress[]
}

export interface DayProgress {
  date: ISOString
  minutes: number
  tasksDone: number
}

export interface SkillProgress {
  skill: StudySkill
  sessions: number
  totalMinutes: number
  accuracy: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface ExerciseAccuracy {
  skill: StudySkill
  totalExercises: number
  correctAnswers: number
  accuracyPercent: number
}

export interface WeaknessReport {
  weakSkills: WeakSkill[]
  repeatedMistakes: RepeatedMistake[]
  frequentMistakeCategories: MistakeCategorySummary[]
}

export interface WeakSkill {
  skill: StudySkill
  accuracy: number
  sessionCount: number
  severity: 'low' | 'medium' | 'high'
}

export interface RepeatedMistake {
  pattern: string
  skill: StudySkill
  frequency: number
  suggestion: string
}

export interface MistakeCategorySummary {
  skill: StudySkill
  totalMistakes: number
  unresolvedCount: number
  resolvedCount: number
}

export interface DueReviews {
  vocabularyDue: VocabReviewDue[]
  mistakesDue: MistakeDue[]
  totalDue: number
}

export interface VocabReviewDue {
  vocabulary: VocabularyEntry
  review: VocabReviewEntry
}

export interface MistakeDue {
  mistake: MistakeEntry
  daysSinceLastReview: number
}

export interface ReviewRating {
  rating: 'again' | 'hard' | 'good' | 'easy'
  reviewedAt: ISOString
}

export interface NextBestAction {
  actionType: 'vocabulary-review' | 'mistake-review' | 'weak-skill-practice' | 'mock-test' | 'daily-lesson' | 'exercise' | 'writing-practice' | 'speaking-practice' | 'reading-practice' | 'listening-practice'
  skill: StudySkill | null
  title: string
  description: string
  priority: number
  reason: string
}

export interface DailyPlan {
  date: ISOString
  totalMinutes: number
  studyPriority: number
  items: DailyPlanItem[]
  focusSkills: StudySkill[]
}

export interface DailyPlanItem {
  skill: StudySkill | 'mock-test' | 'general'
  activity: string
  minutes: number
  reason: string
}

export interface WeeklyReflection {
  weekStart: ISOString
  weekEnd: ISOString
  totalStudyMinutes: number
  totalTasksCompleted: number
  activeDays: number
  consistencyScore: number
  skillBreakdown: SkillProgress[]
  weakAreas: StudySkill[]
  improvements: string[]
  suggestions: string[]
}

export interface SkillBalance {
  skill: StudySkill
  sessions: number
  hours: number
  percentage: number
}

export interface StudyConsistency {
  currentStreak: number
  longestStreak: number
  totalStudyDays: number
  consistencyPercent: number
  weeklyHistory: WeeklyStudyDay[]
}

export interface WeeklyStudyDay {
  date: ISOString
  studied: boolean
  minutes: number
}

export interface BandProgress {
  date: ISOString
  overall: number
  listening: number
  reading: number
  writing: number
  speaking: number
}

export interface ProfileSettings {
  targetBand: number
  currentBand: number
  examDate: string
  dailyStudyMinutes: number
  weakSkills: string[]
  preferredTopics: string[]
}

export interface LearningEngineInput {
  settings: ProfileSettings
  vocabulary: VocabularyEntry[]
  vocabReviews: VocabReviewEntry[]
  mistakes: MistakeEntry[]
  tasks: TaskEntry[]
  readingSessions: ReadingSession[]
  listeningSessions: ListeningSession[]
  writingSessions: WritingSession[]
  speakingSessions: SpeakingSession[]
  readingPracticeSessions: ReadingPracticeSession[]
  listeningPracticeSessions: ListeningPracticeSession[]
  mockTests: MockTestEntry[]
  progressRecords: ProgressRecord[]
  topicsProgress: TopicProgress[]
}

export interface LearningEngineState {
  profile: ProfileData
  progress: {
    skills: SkillProgress[]
    exerciseAccuracy: ExerciseAccuracy[]
    weeklyProgress: WeeklyProgress
  }
  weaknessReport: WeaknessReport
  dueReviews: DueReviews
  dailyPlan: DailyPlan
  nextBestActions: NextBestAction[]
  studyConsistency: StudyConsistency
  weeklyReflection: WeeklyReflection
  bandProgressHistory: BandProgress[]
  skillBalance: SkillBalance[]
}

export interface AIProgressReviewInput {
  tasks: TaskEntry[]
  readingPractices: ReadingPracticeSession[]
  listeningPractices: ListeningPracticeSession[]
  writingSessions: WritingSession[]
  speakingSessions: SpeakingSession[]
  vocabulary: VocabularyEntry[]
  vocabReviews: VocabReviewEntry[]
  mistakes: MistakeEntry[]
  mockTests: MockTestEntry[]
  progressRecords: ProgressRecord[]
}

export interface AIProgressReviewSummary {
  totalStudyMinutes: number
  totalTasksCompleted: number
  totalSessions: number
  daysActive: number
  totalVocabularySaved: number
  totalVocabularyMastered: number
  totalMistakes: number
  resolvedMistakes: number
  studyConsistency: StudyConsistency
}

export interface AIProgressReviewData {
  dateRange: {
    start: ISOString
    end: ISOString
  }
  summary: AIProgressReviewSummary
  skillProgress: SkillProgress[]
  weaknessReport: WeaknessReport
  vocabularyStatus: {
    total: number
    new: number
    learning: number
    reviewing: number
    mastered: number
  }
  progressTrend: 'improving' | 'declining' | 'stable' | 'insufficient_data'
  recommendations: string[]
  tutorFeedback: string
}
