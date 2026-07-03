import { useState, useEffect } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { suggestionEngine } from '../services/aiTutor/SuggestionEngine'
import type { ProactiveSuggestion } from '../models/aiTutorModels'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function bandColor(band: number): string {
  if (band >= 7) return 'text-green-600 dark:text-green-400'
  if (band >= 6) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const PIE_COLORS = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)']

export default function Dashboard() {
  const { data, weeklyChart, loading, error } = useDashboard()
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const pending = await suggestionEngine.getPendingSuggestions()
        if (!cancelled) {
          setSuggestions(pending.filter(s => !s.isAccepted && !s.isDismissed))
        }
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const handleAccept = async (id: string, action?: string) => {
    await suggestionEngine.acceptSuggestion(id)
    setSuggestions(prev => prev.filter(s => s.id !== id))
    if (action) {
      const prompts: Record<string, string> = {
        'teach-me': 'Please teach me something new.',
        'quiz-me': 'Test me with a quick quiz question.',
        'practice-with-me': "Let's practice together.",
        'make-exercise': 'Turn this into an exercise.',
      }
      window.open(`/ai-tutor?q=${encodeURIComponent(prompts[action] || '')}`, '_self')
    }
  }

  const handleDismiss = async (id: string) => {
    await suggestionEngine.dismissSuggestion(id)
    setSuggestions(prev => prev.filter(s => s.id !== id))
  }

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

  const {
    todayTasks, studyStreak, weeklyProgress, totalStudyHours,
    targetBand, currentBand, weakSkills, dueReviews, todayFocus, recentSessions,
  } = data

  const todayUnfinished = todayTasks.filter(t => !t.isDone)
  const todayDone = todayTasks.filter(t => t.isDone)
  const progressPercent = weeklyProgress.total > 0
    ? Math.round((weeklyProgress.done / weeklyProgress.total) * 100)
    : 0
  const bandGap = targetBand - currentBand
  const chartData = weeklyChart.map((d, i) => ({
    day: DAY_LABELS[i] || '',
    minutes: d.minutes,
  }))

  const skillData = [
    { name: 'Reading', value: recentSessions.reading },
    { name: 'Listening', value: recentSessions.listening },
    { name: 'Writing', value: recentSessions.writing },
    { name: 'Speaking', value: recentSessions.speaking },
  ].filter(s => s.value > 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {getGreeting()}, IELTS Learner
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {formatDate(new Date())}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Study Streak
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {studyStreak}
              <span className="ml-1 text-sm font-normal text-slate-400">days</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Weekly Progress
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {progressPercent}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {weeklyProgress.done} / {weeklyProgress.total} tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Study Hours
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {totalStudyHours}
              <span className="ml-1 text-sm font-normal text-slate-400">hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Band
            </p>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {targetBand}
            </p>
            <p className={`text-xs font-medium ${bandColor(currentBand)}`}>
              Current: {currentBand}
              {bandGap > 0 && ` (${bandGap.toFixed(1)} to go)`}
            </p>
          </CardContent>
        </Card>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Proactive Suggestions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.slice(0, 3).map(s => (
              <Card key={s.id} className="border-l-4" style={{ borderLeftColor: s.type === 'exam-prep' ? 'var(--color-warning)' : s.type === 'weakness-practice' ? 'var(--color-danger)' : s.type === 'vocabulary-review' ? 'var(--color-success)' : 'var(--color-primary)' }}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-base">
                      {s.type === 'weakness-practice' ? '💪' : s.type === 'vocabulary-review' ? '📖' : s.type === 'exam-prep' ? '🎯' : s.type === 'mistake-review' ? '✏️' : s.type === 'article-practice' ? '📰' : '💡'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.description}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(s.id, s.action)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          {s.actionLabel || 'Accept'}
                        </button>
                        <button
                          onClick={() => handleDismiss(s.id)}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Plan</CardTitle>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {todayDone.length}/{todayTasks.length} done
            </span>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No tasks planned for today. Add some in the Daily Plan.
              </p>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map(task => (
                  <li
                    key={task.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                      task.isDone
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        task.isDone
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-slate-300 text-slate-400 dark:border-slate-600'
                      }`}
                    >
                      {task.isDone ? '✓' : task.category.slice(0, 2)}
                    </span>
                    <span
                      className={`flex-1 ${
                        task.isDone
                          ? 'text-slate-400 line-through dark:text-slate-500'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.timeMinutes > 0 && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {task.timeMinutes}m
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

          <div className="space-y-4">
          
          <Card>
            <CardHeader>
              <CardTitle>Reviews Due</CardTitle>
            </CardHeader>
            <CardContent>
              {dueReviews > 0 ? (
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {dueReviews}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    items need review
                  </p>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                  All caught up! No reviews due.
                </p>
              )}
            </CardContent>
          </Card>

          {weakSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weak Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weakSkills.map(skill => (
                    <span
                      key={skill}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.some(d => d.minutes > 0) ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--color-muted)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted)" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [`${value}m`, 'Study time']}
                    />
                    <Bar dataKey="minutes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                No study data this week yet. Start your practice!
              </p>
            )}
          </CardContent>
        </Card>

        
        <Card>
          <CardHeader>
            <CardTitle>Skill Balance (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {skillData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={skillData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {skillData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [value, 'sessions']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      iconType="circle"
                      iconSize={8}
                    />
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
      </div>


      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Today's Focus
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {todayFocus}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-green-600 dark:text-green-400">
              Progress Summary
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {todayUnfinished.length > 0
                ? `${todayUnfinished.length} task${todayUnfinished.length > 1 ? 's' : ''} remaining today. Keep going!`
                : todayTasks.length > 0
                  ? 'All tasks completed! Great work today.'
                  : 'Plan your study session to get started.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
