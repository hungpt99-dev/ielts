import { DatabaseService } from '../../../services/storage/Database'
import type {
  TaskEntry,
  ReadingPracticeSession,
  ListeningPracticeSession,
  WritingSession,
  SpeakingSession,
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
  ProgressRecord,
} from '../../../models'
import type { ProgressReviewReport } from '../components/ProgressReviewPanel'
import type { DateRange } from '../components/DateRangeSelector'
import { getAITutorEngine } from '../../../services/engineBootstrap'
import type { LearnerStateSnapshot, IELTSSection } from '@ielts/ai-tutor-engine'

interface SkillStats {
  skill: string
  sessions: number
  totalMinutes: number
  accuracy: number
  trend: 'improving' | 'declining' | 'stable'
}

interface BuildReportInput {
  dateRange: DateRange
  tasks: TaskEntry[]
  readingPractices: ReadingPracticeSession[]
  listeningPractices: ListeningPracticeSession[]
  writingSessions: WritingSession[]
  speakingSessions: SpeakingSession[]
  vocabulary: VocabularyEntry[]
  vocabReviews: VocabReviewEntry[]
  mistakes: MistakeEntry[]
  progressRecords: ProgressRecord[]
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function inRange(dateStr: string, start: string, end: string): boolean {
  const d = dateStr.slice(0, 10)
  return d >= start && d <= end
}

function computeStreak(allDates: string[]): { current: number; longest: number } {
  const uniqueDays = [...new Set(allDates.map(d => d.slice(0, 10)))].sort()
  if (uniqueDays.length === 0) return { current: 0, longest: 0 }

  let longest = 1
  let current = 0
  const today = getToday()

  let streakRun = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff === 1) {
      streakRun++
    } else {
      longest = Math.max(longest, streakRun)
      streakRun = 1
    }
  }
  longest = Math.max(longest, streakRun)

  for (let i = uniqueDays.length - 1; i >= 0; i--) {
    const d = new Date(uniqueDays[i])
    const expected = new Date(today)
    expected.setDate(expected.getDate() - (uniqueDays.length - 1 - i))
    if (d.toISOString().slice(0, 10) === expected.toISOString().slice(0, 10)) {
      current = uniqueDays.length - i
    } else {
      break
    }
  }

  return { current, longest }
}

function computeConsistencyPercent(activeDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0
  return Math.round((activeDays / totalDays) * 100)
}

function computeSkillTrend(
  skill: string,
  records: ProgressRecord[],
): 'improving' | 'declining' | 'stable' {
  const relevant = records
    .filter(r => r.skill === skill)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (relevant.length < 2) return 'stable'

  const first = relevant[0].value
  const last = relevant[relevant.length - 1].value
  if (last > first) return 'improving'
  if (last < first) return 'declining'
  return 'stable'
}

function computeSkillStats(
  readingPractices: ReadingPracticeSession[],
  listeningPractices: ListeningPracticeSession[],
  writingSessions: WritingSession[],
  speakingSessions: SpeakingSession[],
  progressRecords: ProgressRecord[],
): SkillStats[] {
  const skills: { key: string; label: string; sessions: number; minutes: number; accuracySum: number; accuracyCount: number }[] = [
    { key: 'reading', label: 'reading', sessions: 0, minutes: 0, accuracySum: 0, accuracyCount: 0 },
    { key: 'listening', label: 'listening', sessions: 0, minutes: 0, accuracySum: 0, accuracyCount: 0 },
    { key: 'writing', label: 'writing', sessions: 0, minutes: 0, accuracySum: 0, accuracyCount: 0 },
    { key: 'speaking', label: 'speaking', sessions: 0, minutes: 0, accuracySum: 0, accuracyCount: 0 },
  ]

  for (const p of readingPractices) {
    const s = skills[0]
    s.sessions++
    s.minutes += (p.timeSpentSeconds || 0) / 60
    if (p.accuracy != null) { s.accuracySum += p.accuracy; s.accuracyCount++ }
  }
  for (const p of listeningPractices) {
    const s = skills[1]
    s.sessions++
    s.minutes += (p.timeSpentSeconds || 0) / 60
    if (p.accuracy != null) { s.accuracySum += p.accuracy; s.accuracyCount++ }
  }
  for (const w of writingSessions) {
    const s = skills[2]
    s.sessions++
    s.minutes += w.timeSpentMinutes || 0
    if (w.estimatedBand != null) { s.accuracySum += w.estimatedBand * 10; s.accuracyCount++ }
  }
  for (const sp of speakingSessions) {
    const s = skills[3]
    s.sessions++
    s.minutes += (sp.durationSeconds || 0) / 60
    if (sp.selfRating != null) { s.accuracySum += sp.selfRating * 20; s.accuracyCount++ }
  }

  return skills.map(s => ({
    skill: s.key,
    sessions: s.sessions,
    totalMinutes: Math.round(s.minutes),
    accuracy: s.accuracyCount > 0 ? Math.round(s.accuracySum / s.accuracyCount) : 0,
    trend: s.sessions > 0 ? computeSkillTrend(s.key, progressRecords) : 'stable',
  }))
}

function buildReportFromData(input: BuildReportInput): ProgressReviewReport {
  const { dateRange, tasks, readingPractices, listeningPractices, writingSessions, speakingSessions, vocabulary, vocabReviews, mistakes, progressRecords } = input

  const allStudyDates: string[] = [
    ...readingPractices.map(p => p.createdAt),
    ...listeningPractices.map(p => p.createdAt),
    ...writingSessions.map(w => w.createdAt),
    ...speakingSessions.map(sp => sp.createdAt),
    ...tasks.filter(t => t.isDone && t.completedAt).map(t => t.completedAt!),
  ]

  const uniqueDays = [...new Set(allStudyDates.map(d => d.slice(0, 10)))].sort()
  const daysActive = uniqueDays.length

  const totalStudyMinutes = Math.round(
    readingPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
    listeningPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
    writingSessions.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0) +
    speakingSessions.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0) +
    tasks.filter(t => t.isDone).reduce((s, t) => s + (t.timeMinutes || 0), 0),
  )

  const totalSessions = readingPractices.length + listeningPractices.length + writingSessions.length + speakingSessions.length

  const streak = computeStreak(allStudyDates)
  const startDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
  const consistencyPercent = computeConsistencyPercent(daysActive, totalDays)

  const vocabTotal = vocabulary.length
  const vocabMastered = vocabReviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length
  const vocabLearning = vocabulary.filter(v => v.status === 'learning').length
  const vocabReviewing = vocabulary.filter(v => v.status === 'reviewing').length

  const unresolvedMistakes = mistakes.filter(m => m.status !== 'resolved')
  const mistakePatterns = unresolvedMistakes.slice(0, 5).map(m => ({
    pattern: m.mistake,
    skill: m.skill,
    frequency: m.repetitionCount || 1,
    analysis: m.explanation || 'Review this mistake to understand the correct form.',
  }))

  const skillStats = computeSkillStats(readingPractices, listeningPractices, writingSessions, speakingSessions, progressRecords)

  const improvingSkills = skillStats.filter(s => s.trend === 'improving' && s.sessions > 0)
  const strugglingSkills = skillStats.filter(s => (s.trend === 'declining' || s.accuracy < 50) && s.sessions > 0)

  const improvements = improvingSkills.map(s =>
    `${s.skill.charAt(0).toUpperCase() + s.skill.slice(1)}: ${s.accuracy}% accuracy, showing improvement`,
  )

  const struggles = strugglingSkills.map(s =>
    `${s.skill.charAt(0).toUpperCase() + s.skill.slice(1)}: ${s.accuracy}% accuracy — needs more practice`,
  )

  const skillProgress = skillStats
    .filter(s => s.sessions > 0)
    .map(s => ({
      skill: s.skill.charAt(0).toUpperCase() + s.skill.slice(1),
      status: s.trend === 'improving' ? 'improving' : s.trend === 'declining' ? 'needs work' : 'stable',
      sessions: s.sessions,
      accuracy: s.accuracy,
      trend: s.trend,
      analysis: `${s.skill.charAt(0).toUpperCase() + s.skill.slice(1)}: ${s.sessions} sessions, ${s.accuracy}% accuracy — trend is ${s.trend}.`,
    }))

  const vocabularyReviewStatus = {
    summary: `You saved ${vocabTotal} word${vocabTotal !== 1 ? 's' : ''} (${vocabMastered} mastered, ${vocabLearning + vocabReviewing} still learning).`,
    totalSaved: vocabTotal,
    mastered: vocabMastered,
    stillLearning: vocabLearning + vocabReviewing,
    recommendation: vocabTotal > 0
      ? 'Continue reviewing vocabulary daily using spaced repetition.'
      : 'Start saving new vocabulary to build your word bank.',
  }

  const recommendations: string[] = []
  if (strugglingSkills.length > 0) {
    recommendations.push(`Focus on ${strugglingSkills.map(s => s.sessions.charAt(0).toUpperCase() + s.sessions.slice(1)).join(' and ')} — your weakest areas.`)
  }
  if (consistencyPercent < 50) {
    recommendations.push('Improve study consistency. Aim for daily practice, even if only 15-30 minutes.')
  }
  if (mistakePatterns.length > 0) {
    recommendations.push(`Review repeated mistakes in ${mistakePatterns[0].skill}. Focus on understanding why errors occur.`)
  }
  if (recommendations.length === 0) {
    recommendations.push('Keep up the great work! Consistent practice is the key to IELTS success.')
  }

  const feedbackParts: string[] = []
  if (daysActive >= 5) feedbackParts.push('Great work on maintaining a consistent study routine!')
  if (vocabMastered >= 10) feedbackParts.push('Your vocabulary growth is strong — keep it up.')
  if (improvingSkills.length > 0) {
    feedbackParts.push(`You are making progress in ${improvingSkills.map(s => s.sessions).join(' and ')}.`)
  }
  if (strugglingSkills.length > 0) {
    feedbackParts.push(`Your ${strugglingSkills.map(s => s.sessions).join(' and ')} skills need extra attention. Try focused practice sessions daily.`)
  }
  feedbackParts.push('Remember, IELTS preparation is a marathon, not a sprint. Every session brings you closer to your target band score.')

  return {
    overallSummary: `During this period, you studied for ${totalStudyMinutes} minutes across ${totalSessions} sessions, completing ${tasks.filter(t => t.isDone).length} tasks across ${daysActive} active days.`,
    improvements: improvements.length > 0 ? improvements : ['Keep practicing — improvement comes with consistent effort.'],
    struggles,
    repeatedMistakes: mistakePatterns,
    vocabularyReviewStatus,
    skillProgress,
    studyPlanAdherence: `You studied on ${daysActive} active days with ${consistencyPercent}% consistency (current streak: ${streak.current} days).`,
    recommendedFocus: recommendations,
    tutorFeedback: feedbackParts.join(' '),
  }
}

function buildLearnerState(input: BuildReportInput): LearnerStateSnapshot {
  const skillStats = computeSkillStats(input.readingPractices, input.listeningPractices, input.writingSessions, input.speakingSessions, input.progressRecords)
  const allDates = [
    ...input.readingPractices.map(p => p.createdAt),
    ...input.listeningPractices.map(p => p.createdAt),
    ...input.writingSessions.map(w => w.createdAt),
    ...input.speakingSessions.map(sp => sp.createdAt),
    ...input.tasks.filter(t => t.isDone && t.completedAt).map(t => t.completedAt!),
  ]
  const uniqueDays = [...new Set(allDates.map(d => d.slice(0, 10)))]
  const streak = computeStreak(allDates)
  const start = new Date(input.dateRange.start)
  const end = new Date(input.dateRange.end)
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  const activeDays = uniqueDays.length
  const consistency = computeConsistencyPercent(activeDays, totalDays)

  const totalMin = Math.round(
    input.readingPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
    input.listeningPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
    input.writingSessions.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0) +
    input.speakingSessions.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0),
  )

  const allSections: IELTSSection[] = ['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary']
  const skillStates = {} as Record<IELTSSection, any>
  for (const section of allSections) {
    const ss = skillStats.find(s => s.skill === section)
    skillStates[section] = {
      skill: section,
      currentBand: undefined,
      targetBand: undefined,
      trend: ss?.trend ?? 'unknown',
      confidence: 1,
      priorityScore: 0,
      frequentWeaknesses: [],
      recentStrengths: [],
      lastPracticedAt: ss ? new Date().toISOString() : undefined,
    }
  }

  const unresolvedMistakes = input.mistakes.filter(m => m.status !== 'resolved')

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      currentOverallBand: null,
      targetOverallBand: null,
      currentSkillBands: null,
      targetSkillBands: null,
      examType: null,
      examDate: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferredLanguage: 'en',
      studyIntensity: 'moderate',
      weakSkills: skillStats.filter(s => s.trend === 'declining' || (s.sessions > 0 && s.accuracy < 50)).map(s => s.skill as IELTSSection),
      strongSkills: skillStats.filter(s => s.trend === 'improving' && s.sessions > 0).map(s => s.skill as IELTSSection),
    },
    exam: {
      examDate: null,
      daysUntilExam: null,
      isUrgent: false,
      isFinalWeek: false,
    },
    progress: {
      overallCompletionPercent: Math.round(input.tasks.filter(t => t.isDone).length / Math.max(input.tasks.length, 1) * 100),
      weeklyCompletionPercent: consistency,
      skillProgress: skillStats.reduce((acc, s) => {
        acc[s.skill] = { currentBand: null, targetBand: null, trend: s.trend, exercisesCompleted: s.sessions, accuracy: s.accuracy }
        return acc
      }, {} as Record<string, any>),
      studyStreak: streak.current,
      inactiveDays: 0,
      consistency,
      recentStudyMinutes: totalMin,
      trendBySkill: skillStats.reduce((acc, s) => { acc[s.skill] = s.trend; return acc }, {} as Record<string, string>),
    },
    skillStates,
    mistakeSummary: {
      total: input.mistakes.length,
      unreviewed: unresolvedMistakes.length,
      recentCount: unresolvedMistakes.length,
      recurringPatterns: unresolvedMistakes.slice(0, 5).map(m => ({
        pattern: m.mistake,
        skill: m.skill as IELTSSection,
        frequency: m.repetitionCount || 1,
        examples: [],
      })),
      bySkill: unresolvedMistakes.reduce((acc, m) => {
        const sk = m.skill as IELTSSection
        acc[sk] = (acc[sk] || 0) + 1
        return acc
      }, {} as Partial<Record<IELTSSection, number>>),
    },
    vocabularySummary: {
      totalSaved: input.vocabulary.length,
      dueForReview: input.vocabReviews.filter(r => new Date(r.nextReviewDate) <= new Date()).length,
      mastered: input.vocabReviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length,
      byTopic: {},
      items: [],
    },
    activitySummary: {
      lastActiveAt: uniqueDays.length > 0 ? uniqueDays[uniqueDays.length - 1] : null,
      todayStudyMinutes: 0,
      weeklyStudyMinutes: totalMin,
      tasksCompletedToday: 0,
    },
    preferences: {
      preferredMode: undefined,
      language: 'en',
      explanationLevel: undefined,
      correctionStyle: undefined,
      proactiveEnabled: undefined,
      maxProactiveMessagesPerDay: undefined,
      allowedCategories: undefined,
      preferredLearningMethods: [],
      preferredTaskTypes: [],
    },
    currentConstraints: [],
    contextQuality: {
      status: 'partial',
      missingSources: ['learner-profile', 'exam', 'roadmap'],
      warnings: [],
    },
  }
}

function mapEngineResultToReport(
  engineResult: import('@ielts/ai-tutor-engine').ProgressReviewResult,
  input: BuildReportInput,
): ProgressReviewReport {
  const vocabMastered = input.vocabReviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length
  const vocabLearning = input.vocabulary.filter(v => v.status === 'learning').length
  const vocabReviewing = input.vocabulary.filter(v => v.status === 'reviewing').length

  const skillProgress = engineResult.skillPriorityChanges.map(spc => ({
    skill: spc.skill.charAt(0).toUpperCase() + spc.skill.slice(1),
    status: spc.reason.includes('gap') ? 'needs work' : 'stable',
    sessions: 0,
    accuracy: 0,
    trend: spc.reason.includes('improving') ? 'improving' : 'declining',
    analysis: spc.reason,
  }))

  return {
    overallSummary: engineResult.summary,
    improvements: engineResult.improvements.map(i => `${i.area}: ${i.evidence}`),
    struggles: engineResult.weaknesses.map(w => `${w.area}: ${w.evidence}`),
    repeatedMistakes: engineResult.repeatedMistakes.map(m => ({
      pattern: m.pattern,
      skill: m.skill,
      frequency: m.frequency,
      analysis: `Repeated ${m.frequency} time${m.frequency > 1 ? 's' : ''}`,
    })),
    vocabularyReviewStatus: {
      summary: `You saved ${input.vocabulary.length} word${input.vocabulary.length !== 1 ? 's' : ''} (${vocabMastered} mastered, ${vocabLearning + vocabReviewing} still learning).`,
      totalSaved: input.vocabulary.length,
      mastered: vocabMastered,
      stillLearning: vocabLearning + vocabReviewing,
      recommendation: input.vocabulary.length > 0
        ? 'Continue reviewing vocabulary daily using spaced repetition.'
        : 'Start saving new vocabulary to build your word bank.',
    },
    skillProgress: skillProgress.length > 0 ? skillProgress : input.readingPractices.length > 0 || input.listeningPractices.length > 0 || input.writingSessions.length > 0 || input.speakingSessions.length > 0 ? [
      { skill: 'Reading', status: 'stable', sessions: input.readingPractices.length, accuracy: 0, trend: 'stable', analysis: `${input.readingPractices.length} sessions completed.` },
      { skill: 'Listening', status: 'stable', sessions: input.listeningPractices.length, accuracy: 0, trend: 'stable', analysis: `${input.listeningPractices.length} sessions completed.` },
      { skill: 'Writing', status: 'stable', sessions: input.writingSessions.length, accuracy: 0, trend: 'stable', analysis: `${input.writingSessions.length} sessions completed.` },
      { skill: 'Speaking', status: 'stable', sessions: input.speakingSessions.length, accuracy: 0, trend: 'stable', analysis: `${input.speakingSessions.length} sessions completed.` },
    ].filter(s => s.sessions > 0) : [],
    studyPlanAdherence: `Study consistency: ${engineResult.studyConsistency.weeklyCompletionRate}% — ${engineResult.studyConsistency.streakDays > 0 ? `${engineResult.studyConsistency.streakDays}-day streak.` : 'No active streak.'}`,
    recommendedFocus: engineResult.realisticNextActions.length > 0
      ? engineResult.realisticNextActions
      : [engineResult.recommendedFocus].filter(Boolean),
    tutorFeedback: engineResult.examRisk
      ? `${engineResult.examRisk} Keep up your consistent practice!`
      : 'Keep up your consistent practice! Every session brings you closer to your target band score.',
  }
}

export async function generateProgressReview(
  dateRange: DateRange,
): Promise<{ report: ProgressReviewReport | null; error: string | null }> {
  try {
    const [tasks, readingPractices, listeningPractices, writingSessions, speakingSessions, vocabulary, vocabReviews, mistakes, progressRecords] = await Promise.all([
      DatabaseService.safeGetAll<TaskEntry>('tasks'),
      DatabaseService.safeGetAll<ReadingPracticeSession>('readingPracticeSessions'),
      DatabaseService.safeGetAll<ListeningPracticeSession>('listeningPracticeSessions'),
      DatabaseService.safeGetAll<WritingSession>('writingSessions'),
      DatabaseService.safeGetAll<SpeakingSession>('speakingSessions'),
      DatabaseService.safeGetAll<VocabularyEntry>('vocabulary'),
      DatabaseService.safeGetAll<VocabReviewEntry>('vocabularyReviews'),
      DatabaseService.safeGetAll<MistakeEntry>('mistakes'),
      DatabaseService.safeGetAll<ProgressRecord>('progressRecords'),
    ])

    const input: BuildReportInput = {
      dateRange,
      tasks: tasks.filter(t => t.isDone && t.completedAt && inRange(t.completedAt, dateRange.start, dateRange.end)),
      readingPractices: readingPractices.filter(p => inRange(p.createdAt, dateRange.start, dateRange.end)),
      listeningPractices: listeningPractices.filter(p => inRange(p.createdAt, dateRange.start, dateRange.end)),
      writingSessions: writingSessions.filter(w => inRange(w.createdAt, dateRange.start, dateRange.end)),
      speakingSessions: speakingSessions.filter(sp => inRange(sp.createdAt, dateRange.start, dateRange.end)),
      vocabulary: vocabulary.filter(v => inRange(v.createdAt, dateRange.start, dateRange.end)),
      vocabReviews: vocabReviews.filter(r => inRange(r.lastReviewDate, dateRange.start, dateRange.end)),
      mistakes: mistakes.filter(m => inRange(m.date, dateRange.start, dateRange.end)),
      progressRecords: progressRecords.filter(r => inRange(r.date, dateRange.start, dateRange.end)),
    }

    const engine = getAITutorEngine()
    if (engine) {
      try {
        const learnerState = buildLearnerState(input)
        const result = await engine.generateProgressReview({ learnerState })

        if (result.status === 'success') {
          const report = mapEngineResultToReport(result.data, input)
          return { report, error: null }
        }
      } catch {
        // engine failed — fall through to data-driven report
      }
    }

    const fallback = buildReportFromData(input)
    return { report: fallback, error: null }
  } catch (err) {
    return { report: null, error: err instanceof Error ? err.message : 'Failed to generate progress review' }
  }
}
