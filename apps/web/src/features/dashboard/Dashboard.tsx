import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorNavigation } from '../../hooks/useTutorNavigation'
import { useDashboard } from '../../hooks/useDashboard'
import { useDataRefresh } from '../../hooks/useDataRefresh'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getEmptyStateMessage, EmptyStateIllustrated, ErrorState } from '../../components/ui/EmptyState'
import ProgressChart from './components/ProgressChart'
import { DatabaseService } from '../../services/storage/Database'
import type { DashboardData, WeeklyStudyDay, TaskEntry } from '../../models'
import {
  SkillCard,
  ProgressSummaryCard,
  AITutorRecommendationCard,
  LoadingSkeleton,
  IconCheck,
  IconTarget,
  IconProgress,
  IconTimer,
  IconFlame,
  IconAITutor,
  IconTodayPlan,
  IconAlertCircle,
  IconReading,
  IconListening,
  IconWriting,
  IconSpeaking,
  IconGrammar,
  IconVocabulary,
} from '@ielts/ui'
import type { SkillType } from '@ielts/ui'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
  if (band >= 7) return 'var(--color-success)'
  if (band >= 6) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function formatExamUrgency(days: number): { color: string; label: string } {
  if (days <= 14) return { color: 'var(--color-danger)', label: `${days} days to exam` }
  if (days <= 30) return { color: 'var(--color-warning)', label: `${days} days to exam` }
  return { color: 'var(--color-success)', label: `${days} days to exam` }
}

function computeSkillProgress(data: DashboardData): Array<{ name: string; score: number; maxScore: number; weak: boolean }> {
  const isWeak = (skill: string) => data.weakSkills.some(s => s.toLowerCase() === skill.toLowerCase())
  const { recentSessions } = data

  const skills: Array<{ name: string; sessions: number }> = [
    { name: 'Reading', sessions: recentSessions.reading },
    { name: 'Listening', sessions: recentSessions.listening },
    { name: 'Writing', sessions: recentSessions.writing },
    { name: 'Speaking', sessions: recentSessions.speaking },
  ]

  const maxSessions = Math.max(...skills.map(s => s.sessions), 1)
  return skills.map(s => {
    const ratio = s.sessions / maxSessions
    const raw = 1 + ratio * 7
    const band = Math.round(raw * 2) / 2
    return {
      name: s.name,
      score: Math.max(1, Math.min(9, band)),
      maxScore: 9,
      weak: isWeak(s.name),
    }
  })
}

function skillNameToSkillType(name: string): SkillType {
  const map: Record<string, SkillType> = {
    Reading: 'reading',
    Listening: 'listening',
    Writing: 'writing',
    Speaking: 'speaking',
  }
  return map[name] || 'reading'
}

const skillIcons: Record<string, React.ReactNode> = {
  Reading: <IconReading size={18} />,
  Listening: <IconListening size={18} />,
  Writing: <IconWriting size={18} />,
  Speaking: <IconSpeaking size={18} />,
}

const quickPracticeSkills = [
  { label: 'Reading', path: '/reading', color: 'var(--color-skill-reading)', lightColor: 'var(--color-skill-reading-light)', icon: IconReading },
  { label: 'Listening', path: '/listening', color: 'var(--color-skill-listening)', lightColor: 'var(--color-skill-listening-light)', icon: IconListening },
  { label: 'Writing', path: '/writing', color: 'var(--color-skill-writing)', lightColor: 'var(--color-skill-writing-light)', icon: IconWriting },
  { label: 'Speaking', path: '/speaking', color: 'var(--color-skill-speaking)', lightColor: 'var(--color-skill-speaking-light)', icon: IconSpeaking },
  { label: 'Grammar', path: '/grammar', color: 'var(--color-info)', lightColor: 'var(--color-info-light)', icon: IconGrammar },
  { label: 'Vocabulary', path: '/vocabulary', color: 'var(--color-primary)', lightColor: 'var(--color-primary-light)', icon: IconVocabulary },
]

export default function Dashboard() {
  const { data, weeklyChart, loading, error, refresh } = useDashboard()
  useDataRefresh(() => { refresh() })
  const navigate = useNavigate()
  const goToTutor = useTutorNavigation()
  const [tasks, setTasks] = useState<TaskEntry[]>([])

  useEffect(() => {
    if (data) {
      setTasks(data.todayTasks)
    }
  }, [data])

  async function handleToggleDone(task: TaskEntry) {
    const updated: TaskEntry = {
      ...task,
      isDone: !task.isDone,
      completedAt: !task.isDone ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    }
    await DatabaseService.put('tasks', updated)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 pb-8" role="status" aria-label="Loading dashboard">
        <LoadingSkeleton variant="dashboard" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} variant="rect" height={96} />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <LoadingSkeleton variant="card" height={256} />
          </div>
          <div className="space-y-4">
            <LoadingSkeleton variant="card" height={160} />
            <LoadingSkeleton variant="card" height={208} />
          </div>
        </div>
        <LoadingSkeleton variant="card" height={112} />
        <div className="grid gap-4 lg:grid-cols-2">
          <LoadingSkeleton variant="card" height={208} />
          <LoadingSkeleton variant="card" height={208} />
        </div>
        <LoadingSkeleton variant="card" height={80} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <ErrorState
          message={error}
          onRetry={() => refresh()}
          variant="card"
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <EmptyStateIllustrated
          variant="default"
          title="Your IELTS journey starts here"
          description="Complete your onboarding and let's build your first study plan."
          action={{ label: 'Create My First Study Plan', onClick: () => navigate('/plan') }}
        />
      </div>
    )
  }

  const {
    studyStreak, weeklyProgress, totalStudyHours,
    targetBand, currentBand, weakSkills, dueReviews,
    examDate, studyGoal, dailyStudyMinutes,
    recentMistakes, savedVocabularyCount, aiSuggestion,
    roadmapProgress, examCountdown,
  } = data

  const todayUnfinished = tasks.filter(t => !t.isDone)
  const todayDone = tasks.filter(t => t.isDone)
  const progressPercent = weeklyProgress.total > 0
    ? Math.round((weeklyProgress.done / weeklyProgress.total) * 100)
    : 0
  const bandGap = targetBand - currentBand
  const hasWeeklyData = weeklyChart.some(d => d.minutes > 0)
  const chartData = hasWeeklyData
    ? weeklyChart.map((d: WeeklyStudyDay, i: number) => ({
        name: DAY_LABELS[i] || '',
        value: d.minutes,
      }))
    : []
  const skillProgress = computeSkillProgress(data)
  const hasExamDate = examDate && examCountdown > 0
  const missionProgress = tasks.length > 0 ? Math.round((todayDone.length / tasks.length) * 100) : 0
  const hasAllTasksDone = tasks.length > 0 && todayUnfinished.length === 0
  const totalEstMinutes = tasks.reduce((s, t) => s + (t.timeMinutes || 0), 0)

  function getTodayMission(): string {
    if (todayUnfinished.length > 0) {
      const cats = [...new Set(todayUnfinished.map(t => t.category))]
      return `Complete your ${cats.slice(0, 2).join(' and ')} tasks today`
    }
    if (dueReviews > 0) return 'Review your saved vocabulary'
    if (weakSkills.length > 0) return `Practice your weakest skill: ${weakSkills[0]}`
    return 'Great job! Review your progress or explore new content.'
  }

  const greeting = getGreeting()

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-0 pb-8 pt-4 sm:pt-6">
      {/* ============================================================ */}
      {/* 1. Hero Greeting Section                                      */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden rounded-3xl p-5 sm:p-7 lg:p-8"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-tutor-background) 100%)',
        }}
        aria-label="Dashboard greeting"
      >
        <div className="relative z-10">
          {/* Top row: greeting + badges */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-primary-dark)' }}>
                {greeting}, IELTS Learner
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-primary)', opacity: 0.8 }}>
                {formatDate(new Date())}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {studyGoal && (
                <Badge variant="primary">
                  IELTS {studyGoal === 'academic' ? 'Academic' : 'General'}
                </Badge>
              )}
              {studyStreak > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-warning-light)',
                    color: 'var(--color-warning-dark)',
                  }}
                >
                  <IconFlame size={14} />
                  {studyStreak}-day streak
                </span>
              )}
              {hasExamDate && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
                  style={{
                    backgroundColor: examCountdown <= 30 ? 'var(--color-danger-light)' : 'var(--color-surface)',
                    color: examCountdown <= 30 ? 'var(--color-danger)' : 'var(--color-primary)',
                  }}
                >
                  {formatExamUrgency(examCountdown).label}
                </span>
              )}
            </div>
          </div>

          {/* Target and current band row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="inline-flex items-center gap-1">
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Target:</span> Band {targetBand.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1">
              <span style={{ fontWeight: 600, color: bandColor(currentBand) }}>Current:</span> Band {currentBand.toFixed(1)}
            </span>
            {bandGap > 0 && (
              <span className="text-xs">
                {bandGap.toFixed(1)} bands to go
              </span>
            )}
          </div>

          {/* Today's Mission Card */}
          <div
            className="mt-5 rounded-2xl p-4 backdrop-blur-sm sm:p-5"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 70%, transparent)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <IconCheck size={16} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                    Today's Mission
                  </span>
                  {tasks.length > 0 && (
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {todayDone.length}/{tasks.length} tasks done
                      {totalEstMinutes > 0 && ` · ${totalEstMinutes} min est`}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {getTodayMission()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() => navigate('/today-plan')}
                >
                  {tasks.length > 0 ? 'Continue Learning' : 'Plan Today'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => goToTutor({
                    prompt: `I'm at band ${currentBand} targeting band ${targetBand} with a ${studyStreak}-day streak. Today's mission: ${getTodayMission()}. Help me plan my study session.`,
                    title: 'AI Study Assistant',
                  })}
                >
                  Ask AI Tutor
                </Button>
              </div>
            </div>
            {tasks.length > 0 && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 60%, transparent)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${missionProgress}%`,
                    backgroundColor: hasAllTasksDone ? 'var(--color-success)' : 'var(--color-primary)',
                  }}
                  role="progressbar"
                  aria-valuenow={missionProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. Key Stats Row                                              */}
      {/* ============================================================ */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressSummaryCard
          label="Study Streak"
          value={`${studyStreak}`}
          subtitle={studyStreak > 0 ? 'days' : 'Start today!'}
          color="var(--color-warning)"
          icon={<IconFlame size={18} />}
        />
        <ProgressSummaryCard
          label="IELTS Band"
          value={`${targetBand.toFixed(1)}`}
          subtitle={`Current: ${currentBand.toFixed(1)}`}
          color="var(--color-primary)"
          icon={<IconTarget size={18} />}
        />
        <ProgressSummaryCard
          label="Weekly Tasks"
          value={weeklyProgress.total > 0 ? `${progressPercent}%` : '—'}
          subtitle={weeklyProgress.total > 0 ? `${weeklyProgress.done}/${weeklyProgress.total} done` : 'No tasks yet'}
          color={progressPercent >= 80 ? 'var(--color-success)' : 'var(--color-info)'}
          icon={<IconProgress size={18} />}
        />
        <ProgressSummaryCard
          label="Study Hours"
          value={`${totalStudyHours}`}
          subtitle={totalStudyHours > 0 ? 'total' : 'Begin your journey'}
          color="var(--color-info)"
          icon={<IconTimer size={18} />}
        />
      </div>

      {/* ============================================================ */}
      {/* 3. Main Content: Tasks + AI Tutor + Quick Stats               */}
      {/* ============================================================ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Today's Study Tasks */}
        <section className="lg:col-span-2" aria-label="Today's study tasks">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconTodayPlan size={16} />
                <CardTitle>Today's Study Tasks</CardTitle>
              </div>
              {tasks.length > 0 && (
                <Badge variant={todayDone.length === tasks.length ? 'success' : 'default'}>
                  {todayDone.length}/{tasks.length} done
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                    <IconTarget size={24} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{getEmptyStateMessage('no-tasks').title}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{getEmptyStateMessage('no-tasks').description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => navigate('/plan')}>Create Plan</Button>
                    <Button variant="outline" size="sm" onClick={() => goToTutor({
                      prompt: `I have no tasks planned. I'm at band ${currentBand} targeting band ${targetBand}. My weak skills are ${weakSkills.join(', ')}. Suggest a study plan.`,
                      title: 'Study Plan Help',
                    })}>Ask AI Tutor</Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {tasks.map(task => {
                    const categoryLower = task.category.toLowerCase()
                    const badgeVariant = categoryLower.includes('reading')
                      ? 'reading' as const
                      : categoryLower.includes('listening')
                        ? 'listening' as const
                        : categoryLower.includes('writing')
                          ? 'writing' as const
                          : categoryLower.includes('speaking')
                            ? 'speaking' as const
                            : categoryLower.includes('grammar')
                              ? 'grammar' as const
                              : 'default' as const

                    return (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all"
                        style={{
                          border: `1px solid ${task.isDone ? 'var(--color-success)' : 'var(--color-border)'}`,
                          backgroundColor: task.isDone ? 'var(--color-success-light)' : 'var(--color-surface)',
                          opacity: task.isDone ? 0.75 : 1,
                        }}
                      >
                        <button
                          onClick={() => handleToggleDone(task)}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            task.isDone
                              ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                              : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                          }`}
                          aria-label={task.isDone ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" done`}
                        >
                          {task.isDone && (
                            <IconCheck size={12} strokeWidth={3} />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span
                            className={`block truncate font-medium ${
                              task.isDone ? 'text-[var(--color-success-dark)] line-through' : 'text-[var(--color-text)]'
                            }`}
                          >
                            {task.title}
                          </span>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Badge variant={badgeVariant} size="xs">
                              {task.category}
                            </Badge>
                          </div>
                        </div>
                        {task.timeMinutes > 0 && (
                          <span className="shrink-0 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                            {task.timeMinutes}m
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
              {todayUnfinished.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {todayUnfinished.length} task{todayUnfinished.length > 1 ? 's' : ''} remaining
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/plan')}>
                    View Full Plan
                  </Button>
                </div>
              )}
              {hasAllTasksDone && (
                <div className="mt-4 rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--color-success-light)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-success-dark)' }}>
                    All tasks complete! Great work today.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right Column: AI Tutor + Quick Stats */}
        <div className="space-y-4">
          {/* AI Tutor Suggestion */}
          <section aria-label="AI Tutor suggestion">
            <AITutorRecommendationCard
              title="AI Tutor Suggestion"
              recommendation={aiSuggestion || 'Complete your first study session, and I\'ll have personalized suggestions ready for you!'}
              icon={<IconAITutor size={20} />}
              action={
                <Button size="sm" variant="ghost" onClick={() => goToTutor({
                  prompt: `You suggested: "${aiSuggestion || 'Help me improve my IELTS score'}". I'm at band ${currentBand} targeting band ${targetBand}. What should I focus on?`,
                  title: 'Discuss AI Suggestion',
                })}>
                  Chat with Tutor
                </Button>
              }
              priority="medium"
            />
          </section>

          {/* Quick Stats */}
          <section aria-label="Quick stats">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                <IconProgress size={16} />
                <CardTitle>Quick Stats</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Saved Words</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{savedVocabularyCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Reviews Due</span>
                    <span className="text-sm font-bold" style={{ color: dueReviews > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>{dueReviews}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Recent Mistakes</span>
                    <span className="text-sm font-bold" style={{ color: recentMistakes > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>{recentMistakes}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Daily Goal</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{dailyStudyMinutes} min</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Roadmap Progress</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{roadmapProgress}%</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant={dueReviews > 0 ? 'primary' : 'outline'} onClick={() => navigate('/vocabulary')}>
                    {dueReviews > 0 ? `Review (${dueReviews})` : 'Vocabulary'}
                  </Button>
                  {recentMistakes > 0 && (
                    <Button size="sm" variant="outline" onClick={() => navigate('/mistakes')}>
                      View Mistakes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. Needs Practice / Weak Skills                                */}
      {/* ============================================================ */}
      {weakSkills.length > 0 && (
        <section aria-label="Skills needing practice">
          <Card role="region">
            <CardHeader>
              <div className="flex items-center gap-2">
                <IconAlertCircle size={16} style={{ color: 'var(--color-danger)' }} />
                <CardTitle>Needs Practice</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  {weakSkills.map(skill => {
                    const variant = skill.toLowerCase() as 'listening' | 'reading' | 'writing' | 'speaking'
                    return (
                      <Badge key={skill} variant={variant} icon={<IconAlertCircle size={12} />}>
                        {skill}
                      </Badge>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/practice/${weakSkills[0].toLowerCase()}`)}>
                    Practice Now
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => goToTutor({
                    prompt: `I need tips to improve my weak skills: ${weakSkills.join(', ')}. I'm at band ${currentBand} targeting band ${targetBand}. Give me specific strategies for each.`,
                    type: 'tips',
                    title: 'Weak Skills Improvement',
                  })}>
                    Ask AI Tutor for Tips
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                Focus on these skills to improve your band score faster.
              </p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ============================================================ */}
      {/* 5. Skill Progress Grid                                        */}
      {/* ============================================================ */}
      <section aria-label="Skill progress">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Skill Progress
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/progress')}>
            View Details
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {skillProgress.map(skill => (
            <SkillCard
              key={skill.name}
              skill={skillNameToSkillType(skill.name)}
              label={skill.name}
              score={skill.score}
              maxScore={skill.maxScore}
              weak={skill.weak}
              icon={skillIcons[skill.name]}
              onClick={() => navigate(`/progress?skill=${skill.name.toLowerCase()}`)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. Charts Row: Weekly Chart + Band Progress                    */}
      {/* ============================================================ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Study Chart */}
        <section aria-label="Weekly study chart">
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
                nameKey="name"
                emptyMessage="No study data this week yet. Start your practice!"
                formatter={(v: number) => `${v}m`}
              />
            </CardContent>
          </Card>
        </section>

        {/* Band Progress */}
        <section aria-label="Band progress">
          <Card>
            <CardHeader>
              <CardTitle>Band Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Current Band</span>
                    <span className="text-lg font-bold" style={{ color: bandColor(currentBand) }}>
                      {currentBand.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((currentBand / 9) * 100, 100)}%`,
                        backgroundColor: bandColor(currentBand),
                      }}
                      role="progressbar"
                      aria-valuenow={currentBand}
                      aria-valuemin={0}
                      aria-valuemax={9}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Target Band</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{targetBand.toFixed(1)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((targetBand / 9) * 100, 100)}%`, backgroundColor: 'var(--color-warning)' }}
                      role="progressbar"
                      aria-valuenow={targetBand}
                      aria-valuemin={0}
                      aria-valuemax={9}
                    />
                  </div>
                </div>
                {bandGap > 0 && (
                  <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary-dark)' }}>
                      {bandGap.toFixed(1)} bands to reach your goal
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--color-primary)', opacity: 0.7 }}>
                      {hasExamDate ? `${examCountdown} days until exam` : 'Set an exam date for a countdown'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* ============================================================ */}
      {/* 7. Quick Practice Buttons                                     */}
      {/* ============================================================ */}
      <section aria-label="Quick practice">
        <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Quick Practice
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickPracticeSkills.map(skill => {
            const SkillIcon = skill.icon
            return (
              <button
                key={skill.label}
                onClick={() => navigate(skill.path)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:shadow-md active:scale-[0.98] w-full"
                style={{ backgroundColor: skill.lightColor }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: skill.color }}
                >
                  <SkillIcon size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: skill.color }}>{skill.label}</p>
                  <p className="text-xs" style={{ color: skill.color, opacity: 0.7 }}>Practice</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
