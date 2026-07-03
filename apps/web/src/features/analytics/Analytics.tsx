import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Legend,
} from 'recharts'
import type {
  TaskEntry, ReadingSession, ListeningSession, WritingSession, SpeakingSession,
  VocabularyEntry, VocabReviewEntry, MistakeEntry,
} from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'

type DateRange = '7d' | '30d' | '90d' | 'all'

interface AnalyticsData {
  dateRange: DateRange
  studyMinutesByDay: { date: string; minutes: number }[]
  studyMinutesByWeek: { label: string; minutes: number }[]
  skillSessions: { name: string; value: number }[]
  streakDays: string[]
  completedTasks: number
  totalStudyMinutes: number
  vocabLearned: number
  vocabReviewed: number
  vocabReviewByMonth: { label: string; count: number }[]
  weakSkills: { skill: string; count: number }[]
  writingBandHistory: { label: string; band: number }[]
  readingAccuracyHistory: { label: string; accuracy: number }[]
  listeningScoreHistory: { label: string; score: number }[]
}

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SKILL_COLORS: Record<string, string> = {
  Reading: 'var(--color-primary)',
  Listening: 'var(--color-success)',
  Writing: 'var(--color-warning)',
  Speaking: 'var(--color-danger)',
  Vocabulary: 'var(--color-info)',
  Grammar: 'var(--color-danger)',
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function getWeekLabel(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-W(\d{1,2})$/)
  if (match) {
    const year = parseInt(match[1], 10)
    const week = parseInt(match[2], 10)
    const jan1 = new Date(year, 0, 1)
    const days = (week - 1) * 7
    const start = new Date(jan1)
    start.setDate(jan1.getDate() + days - jan1.getDay() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${MONTHS[start.getMonth()].slice(0, 3)}${start.getDate()}-${MONTHS[end.getMonth()].slice(0, 3)}${end.getDate()}`
  }
  const d = new Date(dateStr)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay() + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${MONTHS[start.getMonth()].slice(0, 3)}${start.getDate()}-${MONTHS[end.getMonth()].slice(0, 3)}${end.getDate()}`
}

function getWeekId(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 0, 1)
  const diff = d.getTime() - start.getTime()
  const week = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${week}`
}

function isDateInRange(dateStr: string, range: DateRange): boolean {
  if (range === 'all') return true
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return new Date(dateStr) >= cutoff
}

interface StreakCalendarProps {
  streakDays: string[]
  days?: number
}

function StreakCalendar({ streakDays, days = 90 }: StreakCalendarProps) {
  const streakSet = useMemo(() => new Set(streakDays.map(d => d.slice(0, 10))), [streakDays])
  const cells = useMemo(() => {
    const result: { date: string; studied: boolean; isToday: boolean }[] = []
    const today = new Date().toISOString().slice(0, 10)
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      result.push({ date: key, studied: streakSet.has(key), isToday: key === today })
    }
    return result
  }, [streakSet, days])

  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div>
      <div className="flex gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="w-3 text-center text-[8px] font-medium uppercase" style={{ color: 'var(--color-muted)' }}>
            {d[0]}
          </div>
        ))}
      </div>
      <div className="mt-1 flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map(cell => (
              <div
                key={cell.date}
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: cell.isToday
                    ? 'var(--color-primary)'
                    : cell.studied
                      ? 'var(--color-success)'
                      : 'var(--color-surface-alt)',
                  opacity: cell.isToday ? 1 : cell.studied ? 0.8 : 0.4,
                }}
                title={`${cell.date}${cell.studied ? ' - Studied' : ''}`}
              />
            ))}
            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
              <div key={`empty-${wi}-${i}`} className="h-3 w-3" />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: 'var(--color-muted)' }}>
        <span>Less</span>
        <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'var(--color-surface-alt)', opacity: 0.4 }} />
        <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'var(--color-success)', opacity: 0.8 }} />
        <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: 'var(--color-primary)' }} />
        <span>More</span>
      </div>
    </div>
  )
}

function AnalyticsTooltip({ active, payload, label, formatter }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-md"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
    >
      <p className="font-medium">{label ?? payload[0].name}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [range, setRange] = useState<DateRange>('30d')

  const compute = useCallback(async (selectedRange: DateRange) => {
    try {
      setLoading(true)
      setError(null)

      const [tasks, reading, listening, writing, speaking, vocabulary, reviews, mistakes] =
        await Promise.all([
          DatabaseService.getAll<TaskEntry>('tasks'),
          DatabaseService.getAll<ReadingSession>('readingSessions'),
          DatabaseService.getAll<ListeningSession>('listeningSessions'),
          DatabaseService.getAll<WritingSession>('writingSessions'),
          DatabaseService.getAll<SpeakingSession>('speakingSessions'),
          DatabaseService.getAll<VocabularyEntry>('vocabulary'),
          DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
          DatabaseService.getAll<MistakeEntry>('mistakes'),
        ])

      const filteredTasks = tasks.filter(t => isDateInRange(t.date, selectedRange))
      const filteredReading = reading.filter(s => isDateInRange(s.createdAt, selectedRange))
      const filteredListening = listening.filter(s => isDateInRange(s.createdAt, selectedRange))
      const filteredWriting = writing.filter(s => isDateInRange(s.createdAt, selectedRange))
      const filteredSpeaking = speaking.filter(s => isDateInRange(s.createdAt, selectedRange))
      const filteredVocab = vocabulary.filter(v => isDateInRange(v.createdAt, selectedRange))
      const filteredReviews = reviews.filter(r => isDateInRange(r.lastReviewDate, selectedRange))
      const filteredMistakes = mistakes.filter(m => isDateInRange(m.createdAt, selectedRange))

      const completedTasks = filteredTasks.filter(t => t.isDone).length
      const totalStudyMinutes = filteredTasks
        .filter(t => t.isDone)
        .reduce((s, t) => s + (t.timeMinutes || 0), 0)

      const studyMinutesByDay = new Map<string, number>()
      for (const t of filteredTasks) {
        if (t.isDone) {
          const day = t.date.slice(0, 10)
          studyMinutesByDay.set(day, (studyMinutesByDay.get(day) || 0) + (t.timeMinutes || 0))
        }
      }
      const sortedDays = Array.from(studyMinutesByDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
      const studyMinutesByDayArr = sortedDays.map(([date, minutes]) => ({ date, minutes }))

      const studyMinutesByWeek = new Map<string, number>()
      for (const t of filteredTasks) {
        if (t.isDone) {
          const w = getWeekId(t.date)
          studyMinutesByWeek.set(w, (studyMinutesByWeek.get(w) || 0) + (t.timeMinutes || 0))
        }
      }
      const studyMinutesByWeekArr = Array.from(studyMinutesByWeek.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([weekId, minutes]) => ({ label: getWeekLabel(weekId), minutes }))

      const skillSessionsArr = [
        { name: 'Reading', value: filteredReading.length },
        { name: 'Listening', value: filteredListening.length },
        { name: 'Writing', value: filteredWriting.length },
        { name: 'Speaking', value: filteredSpeaking.length },
      ]

      const doneDates = new Set(
        tasks.filter(t => t.isDone).map(t => t.date.slice(0, 10))
      )
      const streakDays: string[] = []
      const today = new Date()
      for (let i = 90; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        if (doneDates.has(key)) {
          streakDays.push(key)
        }
      }

      const vocabLearned = filteredVocab.length
      const vocabReviewed = filteredReviews.length

      const vocabReviewByMonth = new Map<string, number>()
      for (const r of filteredReviews) {
        const ml = getMonthLabel(r.lastReviewDate)
        vocabReviewByMonth.set(ml, (vocabReviewByMonth.get(ml) || 0) + 1)
      }
      const vocabReviewByMonthArr = Array.from(vocabReviewByMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([label, count]) => ({ label, count }))

      const mistakeCounts = new Map<string, number>()
      for (const m of filteredMistakes) {
        mistakeCounts.set(m.skill, (mistakeCounts.get(m.skill) || 0) + 1)
      }
      const weakSkillsArr = Array.from(mistakeCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([skill, count]) => ({ skill: skill.charAt(0).toUpperCase() + skill.slice(1), count }))

      const sortedWriting = [...filteredWriting]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-10)
      const writingBandHistory = sortedWriting.map((s, i) => ({
        label: `#${i + 1}`,
        band: s.estimatedBand,
      }))

      const sortedReading = [...filteredReading]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-10)
      const readingAccuracyHistory = sortedReading.map((s, i) => ({
        label: `#${i + 1}`,
        accuracy: s.accuracy,
      }))

      const sortedListening = [...filteredListening]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(-10)
      const listeningScoreHistory = sortedListening.map((s, i) => ({
        label: `#${i + 1}`,
        score: s.score,
      }))

      setData({
        dateRange: selectedRange,
        studyMinutesByDay: studyMinutesByDayArr,
        studyMinutesByWeek: studyMinutesByWeekArr,
        skillSessions: skillSessionsArr,
        streakDays,
        completedTasks,
        totalStudyMinutes,
        vocabLearned,
        vocabReviewed,
        vocabReviewByMonth: vocabReviewByMonthArr,
        weakSkills: weakSkillsArr,
        writingBandHistory,
        readingAccuracyHistory,
        listeningScoreHistory,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { compute(range) }, [range, compute])

  const chartMinuteData = useMemo(() => {
    if (!data) return []
    return data.studyMinutesByDay.slice(-31).map(d => ({
      name: d.date.slice(5),
      minutes: d.minutes,
    }))
  }, [data])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p style={{ color: 'var(--color-danger)' }}>{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const totalStudyHours = Math.round((data.totalStudyMinutes / 60) * 10) / 10
  const maxMistakeCount = data.weakSkills.length > 0
    ? Math.max(...data.weakSkills.map(w => w.count), 1)
    : 1

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Progress Analytics
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Track your IELTS learning journey over time
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Date range filter">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: range === opt.value ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: range === opt.value ? 'var(--color-on-primary, #ffffff)' : 'var(--color-text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Study Time
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {totalStudyHours}
              <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Tasks Completed
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-success)' }}>
              {data.completedTasks}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Vocabulary Learned
            </p>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {data.vocabLearned}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Reviews Done
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-warning)' }}>
              {data.vocabReviewed}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartMinuteData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMinuteData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<AnalyticsTooltip formatter={(v) => `${v}m`} />} />
                    <Bar dataKey="minutes" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={24} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No study time data in this period.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            {data.studyMinutesByWeek.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.studyMinutesByWeek} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<AnalyticsTooltip formatter={(v) => `${Math.round(v / 60 * 10) / 10}h`} />} />
                    <Bar dataKey="minutes" fill="var(--color-success)" radius={[3, 3, 0, 0]} maxBarSize={40} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No weekly data in this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skill Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {data.skillSessions.some(s => s.value > 0) ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius={30}
                    outerRadius={110}
                    barSize={16}
                    data={data.skillSessions.map(s => ({
                      ...s,
                      fill: SKILL_COLORS[s.name] || 'var(--color-primary)',
                    }))}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar dataKey="value" cornerRadius={6} />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                Complete sessions to see skill progress.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <p className="text-4xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {(() => {
                  let streak = 0
                  for (let i = 0; i < 365; i++) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const key = d.toISOString().slice(0, 10)
                    if (data.streakDays.includes(key)) {
                      streak++
                    } else {
                      break
                    }
                  }
                  return streak
                })()}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>day streak</p>
            </div>
            <div className="mt-4">
              <StreakCalendar streakDays={data.streakDays} days={84} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Weakest Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {data.weakSkills.length > 0 ? (
              <ul className="space-y-2">
                {data.weakSkills.slice(0, 5).map((item, i) => (
                  <li key={item.skill} className="flex items-center gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--color-surface-alt)',
                        color: 'var(--color-muted)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.skill}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                          {item.count}
                        </span>
                      </div>
                      <div
                        className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: 'var(--color-surface-alt)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (item.count / maxMistakeCount) * 100)}%`,
                            backgroundColor: 'var(--color-danger)',
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No mistakes logged yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {data.vocabReviewByMonth.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.vocabReviewByMonth} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<AnalyticsTooltip />} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={40} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No vocabulary reviews yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Writing Score History</CardTitle>
          </CardHeader>
          <CardContent>
            {data.writingBandHistory.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.writingBandHistory} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 9]}
                    />
                    <Tooltip content={<AnalyticsTooltip formatter={(v) => `${v.toFixed(1)}`} />} />
                    <Line
                      type="monotone"
                      dataKey="band"
                      stroke="var(--color-warning)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Band"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No writing sessions yet. Practice writing to see your band progress.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reading Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            {data.readingAccuracyHistory.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.readingAccuracyHistory} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<AnalyticsTooltip formatter={(v) => `${v}%`} />} />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Accuracy"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No reading sessions yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listening Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {data.listeningScoreHistory.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.listeningScoreHistory} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 40]}
                    />
                    <Tooltip content={<AnalyticsTooltip formatter={(v) => `${v}/40`} />} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-success)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                No listening sessions yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
