import type {
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
  TaskEntry,
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
import type {
  ProfileData,
  WeeklyProgress,
  SkillProgress,
  ExerciseAccuracy,
  WeaknessReport,
  DueReviews,
  DailyPlan,
  NextBestAction,
  StudyConsistency,
  WeeklyReflection,
  SkillBalance,
  BandProgress,
  LearningEngineState,
  ProfileSettings,
  ISOString,
} from './types'

import { ProfileService } from './profile'
import { ProgressService } from './progress'
import { WeaknessDetectionService } from './weakness-detection'
import { ReviewSchedulerService } from './review-scheduler'
import { DailyPlanService } from './daily-plan'
import { NextBestActionService } from './next-best-action'
import { AnalyticsService } from './analytics'

export class LearningEngine {
  private profileService: ProfileService
  private progressService: ProgressService
  private weaknessDetection: WeaknessDetectionService
  private reviewScheduler: ReviewSchedulerService
  private dailyPlanService: DailyPlanService
  private nextBestActionService: NextBestActionService
  private analyticsService: AnalyticsService

  constructor() {
    this.profileService = new ProfileService()
    this.progressService = new ProgressService()
    this.weaknessDetection = new WeaknessDetectionService()
    this.reviewScheduler = new ReviewSchedulerService()
    this.dailyPlanService = new DailyPlanService()
    this.nextBestActionService = new NextBestActionService()
    this.analyticsService = new AnalyticsService()
  }

  computeFullState(input: {
    settings: ProfileSettings
    vocabulary: VocabularyEntry[]
    vocabReviews: VocabReviewEntry[]
    mistakes: MistakeEntry[]
    tasks: TaskEntry[]
    readingSessions: ReadingSession[]
    listeningSessions: ListeningSession[]
    writingSessions: WritingSession[]
    speakingSessions: SpeakingSession[]
    readingPractices: ReadingPracticeSession[]
    listeningPractices: ListeningPracticeSession[]
    mockTests: MockTestEntry[]
    progressRecords: ProgressRecord[]
    topicsProgress: TopicProgress[]
  }): LearningEngineState {
    const sessionDates = this.collectSessionDates(input)
    const taskDates = input.tasks.filter(t => t.isDone).map(t => t.date)

    const profile = this.profileService.getProfileData(input.settings, sessionDates)
    const skills = this.progressService.getSkillProgress(
      input.readingPractices,
      input.listeningPractices,
      input.writingSessions,
      input.speakingSessions,
      input.progressRecords,
    )
    const exerciseAccuracy = this.progressService.getExerciseAccuracy(
      input.readingPractices,
      input.listeningPractices,
      input.writingSessions,
      input.speakingSessions,
    )
    const weeklyProgress = this.progressService.getWeeklyProgress(input.tasks, sessionDates)

    const weaknessReport = this.weaknessDetection.getWeaknessReport(
      input.mistakes,
      input.readingPractices,
      input.listeningPractices,
      input.writingSessions,
      input.speakingSessions,
    )

    const dueReviews = this.reviewScheduler.getDueReviews(
      input.vocabulary,
      input.vocabReviews,
      input.mistakes,
    )

    const dailyPlan = this.dailyPlanService.generateDailyPlan(
      input.tasks,
      weaknessReport.weakSkills,
      dueReviews,
      input.settings.dailyStudyMinutes,
    )

    const nextBestActions = this.nextBestActionService.calculateNextBestActions(
      weaknessReport.weakSkills,
      dueReviews,
      { studyStreak: profile.studyStreak, examCountdownDays: profile.examCountdownDays },
    )

    const studyConsistency = this.analyticsService.getStudyConsistency(sessionDates, taskDates)
    const weeklyReflection = this.analyticsService.getWeeklyReflection(skills, studyConsistency, [])
    const skillBalance = this.analyticsService.getSkillBalance(
      input.readingPractices,
      input.listeningPractices,
      input.writingSessions,
      input.speakingSessions,
    )
    const bandProgressHistory = this.analyticsService.getBandProgressHistory(input.mockTests)

    return {
      profile,
      progress: { skills, exerciseAccuracy, weeklyProgress },
      weaknessReport,
      dueReviews,
      dailyPlan,
      nextBestActions,
      studyConsistency,
      weeklyReflection,
      bandProgressHistory,
      skillBalance,
    }
  }

  getProfile(
    settings: ProfileSettings,
    sessionDates: ISOString[],
  ): ProfileData {
    return this.profileService.getProfileData(settings, sessionDates)
  }

  getWeeklyProgress(
    tasks: TaskEntry[],
    sessionDates: ISOString[],
  ): WeeklyProgress {
    return this.progressService.getWeeklyProgress(tasks, sessionDates)
  }

  getSkillProgress(
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
    progressRecords: ProgressRecord[],
  ): SkillProgress[] {
    return this.progressService.getSkillProgress(
      readingPractices,
      listeningPractices,
      writingSessions,
      speakingSessions,
      progressRecords,
    )
  }

  getExerciseAccuracy(
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
  ): ExerciseAccuracy[] {
    return this.progressService.getExerciseAccuracy(
      readingPractices,
      listeningPractices,
      writingSessions,
      speakingSessions,
    )
  }

  getWeaknessReport(
    mistakes: MistakeEntry[],
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
  ): WeaknessReport {
    return this.weaknessDetection.getWeaknessReport(
      mistakes,
      readingPractices,
      listeningPractices,
      writingSessions,
      speakingSessions,
    )
  }

  getDueReviews(
    vocabulary: VocabularyEntry[],
    vocabReviews: VocabReviewEntry[],
    mistakes: MistakeEntry[],
  ): DueReviews {
    return this.reviewScheduler.getDueReviews(vocabulary, vocabReviews, mistakes)
  }

  getDailyPlan(
    tasks: TaskEntry[],
    weakSkills: WeaknessReport['weakSkills'],
    dueReviews: DueReviews,
    dailyStudyMinutes: number,
  ): DailyPlan {
    return this.dailyPlanService.generateDailyPlan(tasks, weakSkills, dueReviews, dailyStudyMinutes)
  }

  getNextBestActions(
    weakSkills: WeaknessReport['weakSkills'],
    dueReviews: DueReviews,
    profile: { studyStreak: number; examCountdownDays: number | null },
  ): NextBestAction[] {
    return this.nextBestActionService.calculateNextBestActions(weakSkills, dueReviews, profile)
  }

  calculateNextReview(
    entry: VocabReviewEntry,
    rating: 'again' | 'hard' | 'good' | 'easy',
  ): VocabReviewEntry {
    return this.reviewScheduler.calculateNextReview(entry, rating)
  }

  getStudyConsistency(
    sessionDates: ISOString[],
    taskDates: ISOString[],
  ): StudyConsistency {
    return this.analyticsService.getStudyConsistency(sessionDates, taskDates)
  }

  getWeeklyReflection(
    skills: SkillProgress[],
    consistency: StudyConsistency,
    bandHistory: BandProgress[],
  ): WeeklyReflection {
    return this.analyticsService.getWeeklyReflection(skills, consistency, bandHistory)
  }

  getSkillBalance(
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
  ): SkillBalance[] {
    return this.analyticsService.getSkillBalance(
      readingPractices,
      listeningPractices,
      writingSessions,
      speakingSessions,
    )
  }

  getBandProgressHistory(mockTests: MockTestEntry[]): BandProgress[] {
    return this.analyticsService.getBandProgressHistory(mockTests)
  }

  getReviewStats(
    vocabReviews: VocabReviewEntry[],
  ): { dueCount: number; totalCount: number; masteredCount: number; learningCount: number } {
    return this.reviewScheduler.getReviewStats(vocabReviews)
  }

  private collectSessionDates(input: {
    readingSessions: ReadingSession[]
    listeningSessions: ListeningSession[]
    writingSessions: WritingSession[]
    speakingSessions: SpeakingSession[]
    readingPractices: ReadingPracticeSession[]
    listeningPractices: ListeningPracticeSession[]
  }): ISOString[] {
    const dates: ISOString[] = []
    for (const s of input.readingSessions) dates.push(s.createdAt)
    for (const s of input.listeningSessions) dates.push(s.createdAt)
    for (const s of input.writingSessions) dates.push(s.createdAt)
    for (const s of input.speakingSessions) dates.push(s.createdAt)
    for (const s of input.readingPractices) dates.push(s.createdAt)
    for (const s of input.listeningPractices) dates.push(s.createdAt)
    return dates
  }
}

export const learningEngine = new LearningEngine()
