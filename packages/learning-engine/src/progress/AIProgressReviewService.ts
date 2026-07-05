import type {
  TaskEntry,
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
  ReadingPracticeSession,
  ListeningPracticeSession,
  WritingSession,
  SpeakingSession,
  MockTestEntry,
  ProgressRecord,
} from '@ielts/storage'
import type {
  AIProgressReviewInput,
  AIProgressReviewData,
  AIProgressReviewSummary,
  StudyConsistency,
  SkillProgress,
  WeaknessReport,
  ISOString,
  StudySkill,
} from '../types'
import { ProgressService } from './ProgressService'
import { WeaknessDetectionService } from '../weakness-detection'
import { AnalyticsService } from '../analytics'

export class AIProgressReviewService {
  private progressService: ProgressService
  private weaknessDetection: WeaknessDetectionService
  private analyticsService: AnalyticsService

  constructor() {
    this.progressService = new ProgressService()
    this.weaknessDetection = new WeaknessDetectionService()
    this.analyticsService = new AnalyticsService()
  }

  generateReview(
    input: AIProgressReviewInput,
    startDate: ISOString,
    endDate: ISOString,
  ): AIProgressReviewData {
    const filtered = this.filterByDateRange(input, startDate, endDate)

    const summary = this.buildSummary(filtered, startDate, endDate)
    const skillProgress = this.progressService.getSkillProgress(
      filtered.readingPractices,
      filtered.listeningPractices,
      filtered.writingSessions,
      filtered.speakingSessions,
      filtered.progressRecords,
    )
    const weaknessReport = this.weaknessDetection.getWeaknessReport(
      filtered.mistakes,
      filtered.readingPractices,
      filtered.listeningPractices,
      filtered.writingSessions,
      filtered.speakingSessions,
    )
    const vocabularyStatus = this.computeVocabularyStatus(filtered.vocabulary, filtered.vocabReviews)
    const progressTrend = this.determineProgressTrend(skillProgress, filtered.progressRecords)
    const recommendations = this.generateRecommendations(weaknessReport, vocabularyStatus, progressTrend, summary)
    const tutorFeedback = this.generateTutorFeedback(summary, weaknessReport, vocabularyStatus, progressTrend)

    return {
      dateRange: { start: startDate, end: endDate },
      summary,
      skillProgress,
      weaknessReport,
      vocabularyStatus,
      progressTrend,
      recommendations,
      tutorFeedback,
    }
  }

  private filterByDateRange(
    input: AIProgressReviewInput,
    startDate: ISOString,
    endDate: ISOString,
  ): AIProgressReviewInput {
    const start = startDate.slice(0, 10)
    const end = endDate.slice(0, 10)

    const inRange = (dateStr: string): boolean => {
      const d = dateStr.slice(0, 10)
      return d >= start && d <= end
    }

    return {
      tasks: input.tasks.filter(t => t.isDone && t.completedAt && inRange(t.completedAt)),
      readingPractices: input.readingPractices.filter(s => inRange(s.createdAt)),
      listeningPractices: input.listeningPractices.filter(s => inRange(s.createdAt)),
      writingSessions: input.writingSessions.filter(s => inRange(s.createdAt)),
      speakingSessions: input.speakingSessions.filter(s => inRange(s.createdAt)),
      vocabulary: input.vocabulary.filter(v => inRange(v.createdAt)),
      vocabReviews: input.vocabReviews.filter(r => inRange(r.lastReviewDate)),
      mistakes: input.mistakes.filter(m => inRange(m.date)),
      mockTests: input.mockTests.filter(m => inRange(m.date)),
      progressRecords: input.progressRecords.filter(r => inRange(r.date)),
    }
  }

  private buildSummary(
    filtered: AIProgressReviewInput,
    startDate: ISOString,
    endDate: ISOString,
  ): AIProgressReviewSummary {
    const allSessionDates = this.collectSessionDates(filtered)
    const taskDates = filtered.tasks.map(t => t.completedAt!).filter(Boolean)
    const allStudyDates = [...new Set([...allSessionDates, ...taskDates])].sort()

    const totalStudyMinutes =
      filtered.tasks.reduce((s, t) => s + (t.timeMinutes || 0), 0) +
      filtered.readingPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
      filtered.listeningPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
      filtered.writingSessions.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0) +
      filtered.speakingSessions.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0)

    const totalSessions =
      filtered.readingPractices.length +
      filtered.listeningPractices.length +
      filtered.writingSessions.length +
      filtered.speakingSessions.length

    const daysActive = new Set(allStudyDates.map(d => d.slice(0, 10))).size

    const totalVocabularyMastered = filtered.vocabReviews.filter(
      r => r.interval >= 21 && r.repetitions >= 5,
    ).length

    const resolvedMistakes = filtered.mistakes.filter(m => m.status === 'resolved').length

    const consistency = this.analyticsService.getStudyConsistency(
      allSessionDates,
      taskDates,
      new Date(endDate),
    )

    return {
      totalStudyMinutes: Math.round(totalStudyMinutes),
      totalTasksCompleted: filtered.tasks.length,
      totalSessions,
      daysActive,
      totalVocabularySaved: filtered.vocabulary.length,
      totalVocabularyMastered,
      totalMistakes: filtered.mistakes.length,
      resolvedMistakes,
      studyConsistency: consistency,
    }
  }

  private computeVocabularyStatus(
    vocabulary: VocabularyEntry[],
    _vocabReviews: VocabReviewEntry[],
  ): AIProgressReviewData['vocabularyStatus'] {
    const total = vocabulary.length
    const newCount = vocabulary.filter(v => v.status === 'new').length
    const learning = vocabulary.filter(v => v.status === 'learning').length
    const reviewing = vocabulary.filter(v => v.status === 'reviewing').length
    const mastered = vocabulary.filter(v => v.status === 'mastered').length

    return { total, new: newCount, learning, reviewing, mastered }
  }

  private determineProgressTrend(
    skillProgress: SkillProgress[],
    progressRecords: ProgressRecord[],
  ): AIProgressReviewData['progressTrend'] {
    if (progressRecords.length < 2) return 'insufficient_data'

    const improving = skillProgress.filter(s => s.trend === 'improving' && s.sessions > 0).length
    const declining = skillProgress.filter(s => s.trend === 'declining' && s.sessions > 0).length

    if (improving > declining) return 'improving'
    if (declining > improving) return 'declining'
    return 'stable'
  }

  private generateRecommendations(
    weaknessReport: WeaknessReport,
    vocabularyStatus: AIProgressReviewData['vocabularyStatus'],
    _progressTrend: AIProgressReviewData['progressTrend'],
    summary: AIProgressReviewSummary,
  ): string[] {
    const recommendations: string[] = []

    const weakSkills = weaknessReport.weakSkills
      .filter(s => s.severity === 'high' || s.severity === 'medium')
      .sort((a, b) => a.accuracy - b.accuracy)

    if (weakSkills.length > 0) {
      const top = weakSkills.slice(0, 2)
      recommendations.push(
        `Focus on ${top.map(s => s.skill).join(' and ')} — your weakest skill areas with ${top[0].accuracy}% accuracy.`,
      )
    }

    if (summary.studyConsistency.consistencyPercent < 50) {
      recommendations.push('Improve study consistency. Aim for daily practice, even if only 15-30 minutes.')
    }

    if (summary.totalVocabularySaved > 0 && vocabularyStatus.mastered / summary.totalVocabularySaved < 0.3) {
      recommendations.push('Review saved vocabulary more frequently using spaced repetition.')
    }

    if (weaknessReport.repeatedMistakes.length > 0) {
      const topSkill = weaknessReport.repeatedMistakes[0].skill
      recommendations.push(
        `Review repeated mistakes in ${topSkill}. Focus on understanding why errors occur.`,
      )
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the great work! Consistent practice is the key to IELTS success.')
    }

    return recommendations
  }

  private generateTutorFeedback(
    summary: AIProgressReviewSummary,
    weaknessReport: WeaknessReport,
    vocabularyStatus: AIProgressReviewData['vocabularyStatus'],
    progressTrend: AIProgressReviewData['progressTrend'],
  ): string {
    const parts: string[] = []

    const strengths: string[] = []
    const areas = weaknessReport.weakSkills
      .filter(s => s.severity === 'low' && s.sessionCount > 0)
      .map(s => s.skill)

    if (strengths.length === 0 && areas.length > 0) {
      strengths.push(...areas)
    }

    if (summary.daysActive >= 5) {
      strengths.push('consistent study routine')
    }
    if (summary.totalVocabularyMastered >= 10) {
      strengths.push('strong vocabulary growth')
    }
    if (summary.totalTasksCompleted >= 10) {
      strengths.push('great task completion rate')
    }

    if (strengths.length > 0) {
      parts.push(`Great work on ${strengths.join(', ')}!`)
    }

    const weakAreas = weaknessReport.weakSkills
      .filter(s => s.severity === 'high' && s.sessionCount > 0)
      .map(s => s.skill)

    if (weakAreas.length > 0) {
      parts.push(
        `Your ${weakAreas.join(' and ')} skills need extra attention. Try focused practice sessions daily.`,
      )
    }

    if (progressTrend === 'improving') {
      parts.push('You are making clear progress. Keep pushing forward!')
    } else if (progressTrend === 'declining') {
      parts.push('You have hit a rough patch — this is normal. Stay consistent and focus on weak areas.')
    } else if (progressTrend === 'stable') {
      parts.push('You are maintaining steady progress. Try increasing your study intensity.')
    }

    if (summary.totalMistakes > 0 && summary.resolvedMistakes / summary.totalMistakes > 0.5) {
      parts.push('You are resolving most of your mistakes — excellent learning attitude!')
    }

    parts.push(
      'Remember, IELTS preparation is a marathon, not a sprint. Every session brings you closer to your target band score.',
    )

    return parts.join(' ')
  }

  private collectSessionDates(filtered: AIProgressReviewInput): ISOString[] {
    const dates: ISOString[] = []
    for (const s of filtered.readingPractices) dates.push(s.createdAt)
    for (const s of filtered.listeningPractices) dates.push(s.createdAt)
    for (const s of filtered.writingSessions) dates.push(s.createdAt)
    for (const s of filtered.speakingSessions) dates.push(s.createdAt)
    return dates
  }
}
