import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../../hooks/useDashboard'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import ProgressChart from './components/ProgressChart'
import type { DashboardData, WeeklyStudyDay, TaskEntry } from '../../models'

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

const SKILL_BG: Record<string, string> = {
  Vocabulary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Reading: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Writing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Writing Task 2': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Writing Task 1': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Listening: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Speaking: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Speaking Part 1': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Speaking Part 2': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Speaking Part 3': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Grammar: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
}

function getSkillBg(category: string): string {
  for (const [key, cls] of Object.entries(SKILL_BG)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return cls
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

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
  const tasksRef = useRef<HTMLUListElement>(null)

  const handleTaskKeyDown = useCallback(
    (e: React.KeyboardEvent, task: TaskEntry) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (!task.isDone) {
          navigate(`/study/${encodeURIComponent(task.title)}`)
        }
      }
    },
    [navigate],
  )

  if (loading) {
    return <LoadingSpinner size="lg" fullPage message="Loading your dashboard..." />
  }

  if (error) {
    return (
      <div role="alert" className="flex h-full items-center justify-center">
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
    examDate, studyGoal, dailyStudyMinutes,
    recentMistakes, savedVocabularyCount, aiSuggestion,
    roadmapProgress, nextTask, examCountdown,
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
  const hasExamDate = examDate && examCountdown > 0

  function getTodayAnswer(): string {
    if (todayUnfinished.length > 0) {
      const cats = [...new Set(todayUnfinished.map(t => t.category))]
      return `Complete your ${cats.slice(0, 2).join(' and ')} tasks today`
    }
    if (dueReviews > 0) return 'Review your saved vocabulary'
    if (weakSkills.length > 0) return `Practice your weakest skill: ${weakSkills[0]}`
    return 'Great job! Review your progress or explore new content.'
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header + Today's Answer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {getGreeting()}, IELTS Learner
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            {formatDate(new Date())}
          </p>
          <div
            className="mt-3 flex items-center gap-2"
            role="status"
            aria-live="polite"
            aria-label="Today's study recommendation"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs dark:bg-blue-900/40" style={{ color: 'var(--color-primary)' }} aria-hidden="true">
              ?
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              <span style={{ color: 'var(--color-muted)' }}>What should I study today?</span>{' '}
              {getTodayAnswer()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {studyGoal && (
            <span className="rounded-lg border px-2.5 py-1 text-xs font-medium capitalize" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
              {studyGoal === 'academic' ? 'IELTS Academic' : 'IELTS General'}
            </span>
          )}
          {hasExamDate && (
            <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${examCountdown <= 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
              {examCountdown} days to exam
            </span>
          )}
        </div>
      </div>

      {/* Continue Learning + Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {nextTask ? (
          <Button
            size="lg"
            onClick={() => navigate(`/study/${encodeURIComponent(nextTask.title)}`)}
          >
            Continue Learning: {nextTask.title}
          </Button>
        ) : todayUnfinished.length > 0 ? (
          <Button
            size="lg"
            onClick={() => navigate(`/study/${encodeURIComponent(todayUnfinished[0].title)}`)}
          >
            Continue Learning ({todayUnfinished.length} tasks left)
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => navigate('/vocabulary')}
          >
            Review Vocabulary
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/roadmap')}
        >
          View Roadmap
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/ai-tutor')}
        >
          Ask AI Tutor
        </Button>
      </div>

      {/* Motivation Banner */}
      <Card role="region" aria-label="Motivational quote" className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
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
        <Card aria-label={`Study streak: ${studyStreak} days`}>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }} id="stat-streak">
              Study Streak
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500" aria-labelledby="stat-streak">
              {studyStreak}
              <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>days</span>
            </p>
          </CardContent>
        </Card>
        <Card aria-label={`Weekly progress: ${progressPercent} percent`}>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }} id="stat-progress">
              Weekly Progress
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-primary)' }} aria-labelledby="stat-progress">
              {progressPercent}%
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {weeklyProgress.done} / {weeklyProgress.total} tasks
            </p>
          </CardContent>
        </Card>
        <Card aria-label={`Study hours: ${totalStudyHours}`}>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }} id="stat-hours">
              Study Hours
            </p>
            <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--color-success)' }} aria-labelledby="stat-hours">
              {totalStudyHours}
              <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>hrs</span>
            </p>
          </CardContent>
        </Card>
        <Card aria-label={`Target band: ${targetBand}, Current: ${currentBand}`}>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }} id="stat-band">
              Target Band
            </p>
            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400" aria-labelledby="stat-band">
              {targetBand}
            </p>
            <p className={`text-xs font-medium ${bandColor(currentBand)}`}>
              Current: {currentBand}
              {bandGap > 0 && ` (${bandGap.toFixed(1)} to go)`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main grid: Today's Tasks + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Tasks */}
        <Card role="region" aria-label="Today's study tasks" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Study Tasks</CardTitle>
              <span
                className="text-sm font-medium"
                style={{ color: todayDone.length === todayTasks.length && todayTasks.length > 0 ? 'var(--color-success)' : 'var(--color-muted)' }}
                aria-live="polite"
              >
                {todayDone.length}/{todayTasks.length} done
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <EmptyState
                title="No tasks planned for today"
                description="Go to the roadmap to plan your study session."
                action={{ label: 'View Roadmap', onClick: () => navigate('/roadmap') }}
              />
            ) : (
              <ul className="space-y-2" ref={tasksRef} aria-label="Today's tasks list">
                {todayTasks.map(task => (
                  <li
                    key={task.id}
                    role={task.isDone ? 'listitem' : 'button'}
                    tabIndex={task.isDone ? undefined : 0}
                    aria-disabled={task.isDone}
                    aria-label={task.isDone ? `${task.title} — completed` : `Start task: ${task.title}`}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      task.isDone
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1'
                    }`}
                    style={{
                      borderColor: task.isDone ? undefined : 'var(--color-border)',
                      backgroundColor: task.isDone ? undefined : 'var(--color-surface)',
                    }}
                    onClick={() => !task.isDone && navigate(`/study/${encodeURIComponent(task.title)}`)}
                    onKeyDown={(e) => handleTaskKeyDown(e, task)}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                        task.isDone
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-[var(--color-border)]'
                      }`}
                      style={{ color: task.isDone ? undefined : 'var(--color-muted)' }}
                      aria-hidden="true"
                    >
                      {task.isDone ? '✓' : ''}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span
                        className="block truncate font-medium"
                        style={{
                          color: task.isDone ? 'var(--color-muted)' : 'var(--color-text)',
                          textDecoration: task.isDone ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${getSkillBg(task.category)}`}>
                          {task.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {task.timeMinutes > 0 && (
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {task.timeMinutes}m
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {todayUnfinished.length > 0 && (
              <div className="mt-4 flex items-center justify-between" role="status" aria-live="polite">
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {todayUnfinished.length} task{todayUnfinished.length > 1 ? 's' : ''} remaining
                </p>
                <Button size="sm" onClick={() => navigate(`/study/${encodeURIComponent(todayUnfinished[0].title)}`)}>
                  Start Next Task
                </Button>
              </div>
            )}
            {todayTasks.length > 0 && todayUnfinished.length === 0 && (
              <div className="mt-4 rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20" role="status" aria-live="polite">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  All tasks complete! Great work today.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-4" role="region" aria-label="Dashboard sidebar: suggestions and stats">
          {/* AI Tutor Suggestion */}
          <Card className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
            <CardContent>
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                    AI Tutor Suggestion
                  </p>
                  <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {aiSuggestion}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/ai-tutor')}
                    className="mt-1"
                  >
                    Ask AI Tutor →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weak Skills Reminder */}
          {weakSkills.length > 0 && (
            <Card role="region" aria-label="Weak skills reminder">
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
                <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                  Focus on these skills to improve your band score faster.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card role="region" aria-label="Quick statistics">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Saved Words</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{savedVocabularyCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Reviews Due</span>
                  <span className="font-semibold" style={{ color: dueReviews > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>{dueReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Recent Mistakes</span>
                  <span className="font-semibold" style={{ color: recentMistakes > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>{recentMistakes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Daily Study Time</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{dailyStudyMinutes} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Roadmap</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{roadmapProgress}%</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {savedVocabularyCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/vocabulary')}
                  >
                    Review Words
                  </Button>
                )}
                {dueReviews > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/vocabulary')}
                  >
                    Due Reviews
                  </Button>
                )}
                {recentMistakes > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/mistakes')}
                  >
                    View Mistakes
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Focus */}
          <Card className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
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
        <Card className="border-l-4" style={{ borderLeftColor: 'var(--color-success)' }}>
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

        <Card className="border-l-4" style={{ borderLeftColor: 'var(--color-warning)' }}>
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
