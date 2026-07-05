import { loadAppSettings } from '../../../services/storage/SettingsStorage'
import { DatabaseService } from '../../../services/storage/Database'
import { callAI } from '@ielts/ai'
import type { ProviderConfig } from '@ielts/ai'
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

const OPENAI_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

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

function getAiConfig(): ProviderConfig | null {
  const settings = loadAppSettings()
  if (!settings.aiApiKey) return null
  return {
    apiKey: settings.aiApiKey,
    baseUrl: settings.aiEndpoint || OPENAI_BASE_URL,
    model: settings.aiModel || DEFAULT_MODEL,
  }
}

function buildAiPrompt(input: BuildReportInput): { systemPrompt: string; userPrompt: string } {
  const { dateRange, tasks, mistakes, vocabulary, vocabReviews, readingPractices, listeningPractices, writingSessions, speakingSessions, progressRecords } = input

  const skillStats = computeSkillStats(readingPractices, listeningPractices, writingSessions, speakingSessions, progressRecords)
  const streak = computeStreak([
    ...readingPractices.map(p => p.createdAt),
    ...listeningPractices.map(p => p.createdAt),
    ...writingSessions.map(w => w.createdAt),
    ...speakingSessions.map(sp => sp.createdAt),
    ...tasks.filter(t => t.isDone && t.completedAt).map(t => t.completedAt!),
  ])

  const skillLines = skillStats
    .filter(s => s.sessions > 0)
    .map(s => {
      const icon = s.trend === 'improving' ? '↑' : s.trend === 'declining' ? '↓' : '→'
      return `  - ${s.skill.charAt(0).toUpperCase() + s.skill.slice(1)}: ${s.sessions} session(s), ${s.totalMinutes} min, ${s.accuracy}% accuracy (${icon} ${s.trend})`
    })
    .join('\n')

  const mistakeLines = mistakes
    .filter(m => m.status !== 'resolved')
    .slice(0, 10)
    .map(m => `  - "${m.mistake}" (skill: ${m.skill}, frequency: ${m.repetitionCount || 1}x)`)
    .join('\n')

  const vocabMastered = vocabReviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length
  const vocabLearning = vocabulary.filter(v => v.status === 'learning').length
  const vocabReviewing = vocabulary.filter(v => v.status === 'reviewing').length

  const start = new Date(dateRange.start)
  const end = new Date(dateRange.end)
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)

  const totalMin = Math.round(
    readingPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
    listeningPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0) +
    writingSessions.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0) +
    speakingSessions.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0),
  )
  const activeDays = [...new Set([
    ...readingPractices.map(p => p.createdAt.slice(0, 10)),
    ...listeningPractices.map(p => p.createdAt.slice(0, 10)),
    ...writingSessions.map(w => w.createdAt.slice(0, 10)),
    ...speakingSessions.map(sp => sp.createdAt.slice(0, 10)),
    ...tasks.filter(t => t.isDone && t.completedAt).map(t => t.completedAt!.slice(0, 10)),
  ])].length
  const totalSessionsCount = readingPractices.length + listeningPractices.length + writingSessions.length + speakingSessions.length
  const totalTasksDone = tasks.filter(t => t.isDone).length
  const unresolvedCount = mistakes.filter(m => m.status !== 'resolved').length

  const userPrompt = `Generate a detailed AI Learning Progress Review report for the student based on their study data below.

## Study Period
From: ${dateRange.start}
To: ${dateRange.end}

## Learning Summary
  Active days: ${activeDays} out of review period
  Total study time: ${totalMin} minutes
  Sessions completed: ${totalSessionsCount}
  Tasks completed: ${totalTasksDone}
  Study streak: ${streak.current} days (longest: ${streak.longest})
  Consistency: ${computeConsistencyPercent(activeDays, totalDays)}%
  Total mistakes recorded: ${mistakes.length} (unresolved: ${unresolvedCount})
  Sessions completed: ${readingPractices.length + listeningPractices.length + writingSessions.length + speakingSessions.length}
  Tasks completed: ${tasks.filter(t => t.isDone).length}
  Study streak: ${streak.current} days (longest: ${streak.longest})
  Consistency: ${computeConsistencyPercent(tasks.filter(t => t.isDone).length, totalDays)}%
  Total mistakes recorded: ${mistakes.length} (resolved: ${mistakes.filter(m => m.status === 'resolved').length})

## Skill-by-Skill Progress
${skillLines || '  No skill practice data recorded in this period.'}

## Mistake Analysis
${mistakeLines || '  No unresolved mistakes.'}

## Vocabulary Status
  Total vocabulary saved: ${vocabulary.length}
  New: ${vocabulary.filter(v => v.status === 'new').length}
  Learning: ${vocabLearning}
  Reviewing: ${vocabReviewing}
  Mastered: ${vocabMastered}

---
Now, acting as the student's personal IELTS tutor, generate a comprehensive progress report covering ALL of the following sections:

1. **Overall Summary** — A clear, concise paragraph summarizing the student's learning during this period.
2. **What Improved** — Specific skills, habits, or areas where the student made progress.
3. **What Still Needs Work** — Areas where the student continues to struggle or has not practiced enough.
4. **Repeated Mistakes** — Review each repeated mistake pattern, explain why it matters, and how to overcome it.
5. **Vocabulary Review Status** — Assess the student's vocabulary journey.
6. **Skill-by-Skill Progress** — For each of Listening, Reading, Writing, and Speaking that has data: assess performance, accuracy, trend, and give specific advice.
7. **Study Plan Adherence** — Based on consistency, active days, and streak, evaluate whether the student is sticking to their plan.
8. **Recommended Focus for Next Period** — Prioritized list of 3-5 specific actions or areas to focus on.
9. **Tutor Feedback** — A warm, personalized, encouraging message from the tutor.

Respond with valid JSON only, in this exact format:
{
  "overallSummary": "string",
  "improvements": ["string"],
  "struggles": ["string"],
  "repeatedMistakes": [{"pattern": "string", "skill": "string", "frequency": number, "analysis": "string"}],
  "vocabularyReviewStatus": {"summary": "string", "totalSaved": number, "mastered": number, "stillLearning": number, "recommendation": "string"},
  "skillProgress": [{"skill": "string", "status": "string", "sessions": number, "accuracy": number, "trend": "string", "analysis": "string"}],
  "studyPlanAdherence": "string",
  "recommendedFocus": ["string"],
  "tutorFeedback": "string"
}`

  return {
    systemPrompt: `You are an experienced IELTS tutor reviewing a student's learning progress. Your role is to analyze their study data thoroughly and provide honest, constructive, and encouraging feedback — just like a real tutor would.

Guidelines:
- Be specific and reference actual numbers and trends from the data.
- Be encouraging but honest — if the student is slacking, say so constructively.
- Write in a warm, professional tutor tone (use "you").
- Provide actionable, specific advice for the next study period.
- Do NOT repeat the raw data back as-is — interpret and analyze it.

You must respond with valid JSON only, matching the exact format specified. No other text outside the JSON.`,
    userPrompt,
  }
}

function parseAiResponse(content: string): ProgressReviewReport | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])

    const required: (keyof ProgressReviewReport)[] = [
      'overallSummary', 'improvements', 'struggles', 'repeatedMistakes',
      'vocabularyReviewStatus', 'skillProgress', 'studyPlanAdherence',
      'recommendedFocus', 'tutorFeedback',
    ]

    for (const key of required) {
      if (!(key in parsed)) return null
    }

    return parsed as ProgressReviewReport
  } catch {
    return null
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

    const config = getAiConfig()
    if (config) {
      const { systemPrompt, userPrompt } = buildAiPrompt(input)
      const { content, error } = await callAI(systemPrompt, userPrompt, () => config, { temperature: 0.7, maxTokens: 2000 })

      if (!error && content) {
        const parsed = parseAiResponse(content)
        if (parsed) {
          return { report: parsed, error: null }
        }
      }

      const fallback = buildReportFromData(input)
      return {
        report: fallback,
        error: error || 'AI response could not be parsed. Showing data-driven report instead.',
      }
    }

    const fallback = buildReportFromData(input)
    return { report: fallback, error: null }
  } catch (err) {
    return { report: null, error: err instanceof Error ? err.message : 'Failed to generate progress review' }
  }
}
