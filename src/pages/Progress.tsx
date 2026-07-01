import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  TaskEntry, ReadingSession, ListeningSession, WritingSession, SpeakingSession,
  MockTestEntry, VocabularyEntry, VocabReviewEntry, MistakeEntry,
} from '../models'
import { getAll } from '../lib/db'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getWeekId(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 0, 1)
  const diff = d.getTime() - start.getTime()
  const week = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${week}`
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay() + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${MONTHS[start.getMonth()].slice(0, 3)}${start.getDate()}-${MONTHS[end.getMonth()].slice(0, 3)}${end.getDate()}`
}

interface ProgressData {
  studyDaysPerWeek: { label: string; days: number }[]
  studyHoursPerWeek: { label: string; hours: number }[]
  vocabLearned: { label: string; count: number }[]
  vocabReviewed: { label: string; count: number }[]
  readingAccuracy: { label: string; accuracy: number }[]
  listeningScore: { label: string; score: number }[]
  writingBandTrend: { label: string; band: number }[]
  speakingRatingTrend: { label: string; rating: number }[]
  mockTestTrend: { label: string; overall: number; listening: number; reading: number; writing: number; speaking: number }[]
  skillBalance: { name: string; value: number }[]
  weakSkillRanking: { skill: string; count: number }[]
  monthlySummary: {
    month: string
    totalHours: number
    sessions: number
    vocabLearned: number
    mockTests: number
    avgBand: number
  }[]
}

export default function Progress() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ProgressData | null>(null)

  const compute = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [tasks, reading, listening, writing, speaking, vocabulary, reviews, mockTests, mistakes] =
        await Promise.all([
          getAll<TaskEntry>('tasks'),
          getAll<ReadingSession>('readingSessions'),
          getAll<ListeningSession>('listeningSessions'),
          getAll<WritingSession>('writingSessions'),
          getAll<SpeakingSession>('speakingSessions'),
          getAll<VocabularyEntry>('vocabulary'),
          getAll<VocabReviewEntry>('vocabularyReviews'),
          getAll<MockTestEntry>('mockTests'),
          getAll<MistakeEntry>('mistakes'),
        ])

      // ── Study days per week (last 8 weeks) ──
      const now = new Date()
      const eightWeeksAgo = new Date(now)
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
      const weekTasks = tasks.filter(t => new Date(t.date) >= eightWeeksAgo)

      const studyDaysByWeek = new Map<string, Set<string>>()
      const studyHoursByWeek = new Map<string, number>()
      for (const t of weekTasks) {
        const w = getWeekId(t.date)
        if (!studyDaysByWeek.has(w)) studyDaysByWeek.set(w, new Set())
        if (t.isDone) studyDaysByWeek.get(w)!.add(t.date.slice(0, 10))
        studyHoursByWeek.set(w, (studyHoursByWeek.get(w) || 0) + (t.timeMinutes || 0))
      }

      const studyDaysPerWeek = Array.from(studyDaysByWeek.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([weekId, days]) => ({
          label: getWeekLabel(weekId),
          days: days.size,
        }))

      const studyHoursPerWeek = Array.from(studyHoursByWeek.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([weekId, mins]) => ({
          label: getWeekLabel(weekId),
          hours: Math.round(mins / 60 * 10) / 10,
        }))

      // ── Vocabulary learned/reviewed ──
      const vocabLearnedMap = new Map<string, number>()
      const vocabReviewedMap = new Map<string, number>()
      for (const v of vocabulary) {
        const month = getMonthLabel(v.createdAt)
        vocabLearnedMap.set(month, (vocabLearnedMap.get(month) || 0) + 1)
      }
      for (const r of reviews) {
        const month = getMonthLabel(r.lastReviewDate)
        vocabReviewedMap.set(month, (vocabReviewedMap.get(month) || 0) + 1)
      }

      const allMonths = [...new Set([...vocabLearnedMap.keys(), ...vocabReviewedMap.keys()])].sort()
      const recentMonths = allMonths.slice(-6)
      const vocabLearned = recentMonths.map(m => ({ label: m, count: vocabLearnedMap.get(m) || 0 }))
      const vocabReviewed = recentMonths.map(m => ({ label: m, count: vocabReviewedMap.get(m) || 0 }))

      // ── Reading accuracy ──
      const sortedReading = [...reading].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-10)
      const readingAccuracy = sortedReading.map((s, i) => ({
        label: `#${i + 1}`,
        accuracy: s.accuracy,
      }))

      // ── Listening score ──
      const sortedListening = [...listening].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-10)
      const listeningScore = sortedListening.map((s, i) => ({
        label: `#${i + 1}`,
        score: s.score,
      }))

      // ── Writing band trend ──
      const sortedWriting = [...writing].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-10)
      const writingBandTrend = sortedWriting.map((s, i) => ({
        label: `#${i + 1}`,
        band: s.estimatedBand,
      }))

      // ── Speaking self-rating trend ──
      const sortedSpeaking = [...speaking].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(-10)
      const speakingRatingTrend = sortedSpeaking.map((s, i) => ({
        label: `#${i + 1}`,
        rating: s.selfRating,
      }))

      // ── Mock test band trend ──
      const sortedMockTests = [...mockTests].sort((a, b) => a.date.localeCompare(b.date)).slice(-10)
      const mockTestTrend = sortedMockTests.map((m, i) => ({
        label: `#${i + 1}`,
        overall: m.overallBand,
        listening: m.listeningScore,
        reading: m.readingScore,
        writing: m.writingBand,
        speaking: m.speakingBand,
      }))

      // ── Skill balance ──
      const skillSessions = {
        Reading: reading.length,
        Listening: listening.length,
        Writing: writing.length,
        Speaking: speaking.length,
      }
      const skillBalance = Object.entries(skillSessions)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))

      // ── Weak skill ranking (mistakes per skill) ──
      const mistakeCounts = new Map<string, number>()
      for (const m of mistakes) {
        mistakeCounts.set(m.skill, (mistakeCounts.get(m.skill) || 0) + 1)
      }
      const weakSkillRanking = Array.from(mistakeCounts.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([skill, count]) => ({ skill: skill.charAt(0).toUpperCase() + skill.slice(1), count }))

      // ── Monthly summary ──
      const monthlyHours = new Map<string, number>()
      const monthlySessions = new Map<string, number>()
      const monthlyVocab = new Map<string, number>()
      const monthlyMockTests = new Map<string, number>()
      const monthlyBands = new Map<string, number[]>()

      const addMonth = (date: string, map: Map<string, number>, val: number) => {
        const ml = getMonthLabel(date)
        map.set(ml, (map.get(ml) || 0) + val)
      }

      for (const t of tasks) {
        if (t.isDone) addMonth(t.date, monthlyHours, t.timeMinutes || 0)
      }
      for (const s of reading) addMonth(s.createdAt, monthlySessions, 1)
      for (const s of listening) addMonth(s.createdAt, monthlySessions, 1)
      for (const s of writing) addMonth(s.createdAt, monthlySessions, 1)
      for (const s of speaking) addMonth(s.createdAt, monthlySessions, 1)
      for (const v of vocabulary) addMonth(v.createdAt, monthlyVocab, 1)
      for (const m of mockTests) {
        addMonth(m.date, monthlyMockTests, 1)
        const ml = getMonthLabel(m.date)
        if (!monthlyBands.has(ml)) monthlyBands.set(ml, [])
        monthlyBands.get(ml)!.push(m.overallBand)
      }

      const sortedMonths = [...new Set([
        ...monthlyHours.keys(), ...monthlySessions.keys(),
        ...monthlyVocab.keys(), ...monthlyMockTests.keys(),
      ])].sort().slice(-6)

      const monthlySummary = sortedMonths.map(month => {
        const bands = monthlyBands.get(month) || []
        return {
          month,
          totalHours: Math.round(((monthlyHours.get(month) || 0) / 60) * 10) / 10,
          sessions: monthlySessions.get(month) || 0,
          vocabLearned: monthlyVocab.get(month) || 0,
          mockTests: monthlyMockTests.get(month) || 0,
          avgBand: bands.length > 0
            ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10
            : 0,
        }
      })

      setData({
        studyDaysPerWeek, studyHoursPerWeek,
        vocabLearned, vocabReviewed,
        readingAccuracy, listeningScore,
        writingBandTrend, speakingRatingTrend,
        mockTestTrend, skillBalance,
        weakSkillRanking, monthlySummary,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { compute() }, [compute])

  const totalStudyHours = useMemo(() =>
    data?.monthlySummary.reduce((s, m) => s + m.totalHours, 0) ?? 0,
    [data]
  )
  const totalSessions = useMemo(() =>
    data?.monthlySummary.reduce((s, m) => s + m.sessions, 0) ?? 0,
    [data]
  )
  const totalVocabLearned = useMemo(() =>
    data?.vocabLearned.reduce((s, m) => s + m.count, 0) ?? 0,
    [data]
  )
  const totalMockTests = useMemo(() =>
    data?.monthlySummary.reduce((s, m) => s + m.mockTests, 0) ?? 0,
    [data]
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Progress Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your IELTS learning journey over time
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Study Hours
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalStudyHours.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sessions Completed
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {totalSessions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Vocabulary Learned
            </p>
            <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
              {totalVocabLearned}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mock Tests
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
              {totalMockTests}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 1: Study patterns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Study Days Per Week</CardTitle>
          </CardHeader>
          <CardContent>
            {data.studyDaysPerWeek.some(d => d.days > 0) ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.studyDaysPerWeek} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Bar dataKey="days" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Days" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No study day data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Hours Per Week</CardTitle>
          </CardHeader>
          <CardContent>
            {data.studyHoursPerWeek.some(d => d.hours > 0) ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.studyHoursPerWeek} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number) => [`${v}h`, 'Hours']} />
                    <Bar dataKey="hours" fill="#22c55e" radius={[4, 4, 0, 0]} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No study hour data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Vocabulary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Learned</CardTitle>
          </CardHeader>
          <CardContent>
            {data.vocabLearned.some(d => d.count > 0) ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.vocabLearned} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Words" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No vocabulary added yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            {data.vocabReviewed.some(d => d.count > 0) ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.vocabReviewed} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No vocabulary reviews yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 3: Reading & Listening */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reading Accuracy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.readingAccuracy.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.readingAccuracy} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number) => [`${v}%`, 'Accuracy']} />
                    <Line type="monotone" dataKey="accuracy" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} name="Accuracy" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No reading sessions yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listening Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.listeningScore.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.listeningScore} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 40]} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number) => [`${v}/40`, 'Score']} />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No listening sessions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 4: Writing & Speaking */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Writing Band Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.writingBandTrend.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.writingBandTrend} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 9]} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number) => [`${v.toFixed(1)}`, 'Band']} />
                    <Line type="monotone" dataKey="band" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Band" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No writing sessions yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Speaking Self-Rating Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.speakingRatingTrend.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.speakingRatingTrend} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 5]} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number) => [`${v}/5`, 'Rating']} />
                    <Line type="monotone" dataKey="rating" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No speaking sessions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mock test band trend */}
      <Card>
        <CardHeader>
          <CardTitle>Mock Test Band Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data.mockTestTrend.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.mockTestTrend} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 9]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Overall" />
                  <Line type="monotone" dataKey="listening" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Listening" />
                  <Line type="monotone" dataKey="reading" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Reading" />
                  <Line type="monotone" dataKey="writing" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Writing" />
                  <Line type="monotone" dataKey="speaking" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Speaking" />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No mock test data yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Bottom grid: Skill balance, Weak skills, Monthly summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Skill balance */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {data.skillBalance.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.skillBalance}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.skillBalance.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                Complete sessions across skills to see balance.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Weak skill ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Weak Skill Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {data.weakSkillRanking.length > 0 ? (
              <ul className="space-y-2">
                {data.weakSkillRanking.map((item, i) => (
                  <li key={item.skill} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.skill}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {item.count}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${Math.min(100, (item.count / Math.max(...data.weakSkillRanking.map(x => x.count), 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No mistakes logged yet to rank weaknesses.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monthly summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlySummary.length > 0 ? (
              <div className="space-y-3">
                {[...data.monthlySummary].reverse().map(month => (
                  <div
                    key={month.month}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                  >
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {month.month}
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>{month.totalHours.toFixed(1)}h study</span>
                      <span>{month.sessions} sessions</span>
                      <span>+{month.vocabLearned} words</span>
                      <span>{month.mockTests} mock tests</span>
                      {month.avgBand > 0 && (
                        <span className="col-span-2 font-medium text-blue-600 dark:text-blue-400">
                          Avg band: {month.avgBand.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No monthly data yet. Start practicing!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
