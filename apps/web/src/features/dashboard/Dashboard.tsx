import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../../hooks/useDashboard'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

import ProgressChart from './components/ProgressChart'
import type { DashboardData, WeeklyStudyDay } from '../../models'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MOTIVATIONAL_QUOTES = [
  'The secret of getting ahead is getting started. — Mark Twain',
  'Success is the sum of small efforts repeated day in and day out. — Robert Collier',
  'Believe you can and you\'re halfway there. — Theodore Roosevelt',
  'The only way to do great work is to love what you do. — Steve Jobs',
  'It does not matter how slowly you go as long as you do not stop. — Confucius',
  'The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt',
  'Your limitation—it\'s only your imagination.',
  'Push yourself because no one else is going to do it for you.',
  'Great things never come from comfort zones.',
  'Dream it. Wish it. Do it.',
  'A band score 7.0 starts with day one. Keep going!',
  'Every expert was once a beginner.',
]

const QUICK_ACTIONS = [
  { label: 'Reading', path: '/reading', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'var(--color-primary)' },
  { label: 'Listening', path: '/listening', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z', color: 'var(--color-success)' },
  { label: 'Writing', path: '/writing', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'var(--color-warning)' },
  { label: 'Speaking', path: '/speaking', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: 'var(--color-danger)' },
  { label: 'Vocabulary', path: '/vocabulary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: '#8b5cf6' },
  { label: 'Grammar', path: '/grammar', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', color: '#ec4899' },
]

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function bandColor(band: number): string {
  if (band >= 7) return 'text-green-600 dark:text-green-400'
  if (band >= 6) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function getRandomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
}

function computeSkillProgress(data: DashboardData): Array<{ name: string; value: number; color: string }> {
  const isWeak = (skill: string) => data.weakSkills.some(s => s.toLowerCase() === skill.toLowerCase())
  const { recentSessions } = data

  const skills = [
    { name: 'Reading', sessions: recentSessions.reading, color: 'var(--color-primary)' },
    { name: 'Listening', sessions: recentSessions.listening, color: 'var(--color-success)' },
    { name: 'Writing', sessions: recentSessions.writing, color: 'var(--color-warning)' },
    { name: 'Speaking', sessions: recentSessions.speaking, color: 'var(--color-danger)' },
    { name: 'Vocabulary', sessions: 0, color: '#8b5cf6' },
    { name: 'Grammar', sessions: 0, color: '#ec4899' },
  ]

  return skills.map(s => {
    let progress = s.sessions * 20
    if (progress > 100) progress = 100
    if (isWeak(s.name)) progress = Math.min(progress, 40)
    return { ...s, value: progress || (isWeak(s.name) ? 15 : 50) }
  })
}

export default function Dashboard() {
  const { data, weeklyChart, loading, error } = useDashboard()
  const navigate = useNavigate()

  if (loading) {
    return <LoadingSpinner size="lg" fullPage />
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

  const {
    todayTasks, studyStreak, weeklyProgress, totalStudyHours,
    targetBand, currentBand, weakSkills, dueReviews, todayFocus,
  } = data

  const todayUnfinished = todayTasks.filter(t => !t.isDone)
  const todayDone = todayTasks.filter(t => t.isDone)
  const progressPercent = weeklyProgress.total > 0
    ? Math.round((weeklyProgress.done / weeklyProgress.total) * 100)
    : 0
  const bandGap = targetBand - currentBand
  const chartData = weeklyChart.map((d: WeeklyStudyDay, i: number) => ({
    name: DAY_LABELS[i] || '',
    value: d.minutes,
  }))
  const skillProgress = computeSkillProgress(data)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          {getGreeting()}, IELTS Learner
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          {formatDate(new Date())}
        </p>
      </div>

      {/* Motivation Banner */}
      <Card
        className="border-l-4"
        style={{ borderLeftColor: 'var(--color-primary)' }}
      >
        <CardContent>
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">💡</span>
            <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
              {getRandomQuote()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Study Streak
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {studyStreak}
              <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>days</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Weekly Progress
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {progressPercent}%
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {weeklyProgress.done} / {weeklyProgress.total} tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Total Study Hours
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-success)' }}>
              {totalStudyHours}
              <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Practice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  '--action-color': action.color,
                } as React.CSSProperties}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  style={{ color: action.color }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Middle section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Plan / Checklist */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Checklist</CardTitle>
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {todayDone.length}/{todayTasks.length} done
            </span>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
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
                        : ''
                    }`}
                    style={{
                      borderColor: task.isDone ? undefined : 'var(--color-border)',
                      backgroundColor: task.isDone ? undefined : 'var(--color-surface)',
                    }}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        task.isDone
                          ? 'border-green-500 bg-green-500 text-white'
                          : ''
                      }`}
                      style={{
                        borderColor: task.isDone ? undefined : 'var(--color-border)',
                        color: task.isDone ? undefined : 'var(--color-muted)',
                      }}
                    >
                      {task.isDone ? '✓' : task.category.slice(0, 2)}
                    </span>
                    <span
                      className="flex-1"
                      style={{
                        color: task.isDone ? 'var(--color-muted)' : 'var(--color-text-secondary)',
                        textDecoration: task.isDone ? 'line-through' : 'none',
                      }}
                    >
                      {task.title}
                    </span>
                    {task.timeMinutes > 0 && (
                      <span className="shrink-0 text-xs" style={{ color: 'var(--color-muted)' }}>
                        {task.timeMinutes}m
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {todayUnfinished.length > 0 && (
              <p className="mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                {todayUnfinished.length} task{todayUnfinished.length > 1 ? 's' : ''} remaining
              </p>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Reviews Due */}
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
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                    items need review
                  </p>
                </div>
              ) : (
                <p className="py-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                  All caught up! No reviews due.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Weak Skills */}
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
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--color-danger-light)',
                        color: 'var(--color-danger)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Focus */}
          <Card
            className="border-l-4"
            style={{ borderLeftColor: 'var(--color-primary)' }}
          >
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                Today's Focus
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {todayFocus}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly study time */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              type="bar"
              data={chartData}
              height={200}
              dataKey="minutes"
              nameKey="day"
              emptyMessage="No study data this week yet. Start your practice!"
              formatter={(v: number) => `${v}m`}
            />
          </CardContent>
        </Card>

        {/* Skill Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              type="radial"
              data={skillProgress}
              height={240}
              dataKey="value"
              innerRadius={50}
              outerRadius={110}
              showLegend={true}
              emptyMessage="Complete sessions to see skill progress."
              formatter={(v) => `${v}%`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress Summary */}
        <Card
          className="border-l-4"
          style={{ borderLeftColor: 'var(--color-success)' }}
        >
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-success)' }}>
              Progress Summary
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {todayUnfinished.length > 0
                ? `${todayUnfinished.length} task${todayUnfinished.length > 1 ? 's' : ''} remaining today. Keep going!`
                : todayTasks.length > 0
                  ? 'All tasks completed! Great work today.'
                  : 'Plan your study session to get started.'}
            </p>
          </CardContent>
        </Card>

        {/* Band info */}
        <Card
          className="border-l-4"
          style={{ borderLeftColor: 'var(--color-warning)' }}
        >
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-warning)' }}>
              Band Progress
            </p>
            <div className="mt-2 space-y-2">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Current</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{currentBand}</span>
                </div>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--color-surface-alt)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((currentBand / 9) * 100, 100)}%`,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Target</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{targetBand}</span>
                </div>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--color-surface-alt)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((targetBand / 9) * 100, 100)}%`,
                      backgroundColor: 'var(--color-warning)',
                    }}
                  />
                </div>
              </div>
              {bandGap > 0 && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {bandGap.toFixed(1)} bands to reach your target
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
