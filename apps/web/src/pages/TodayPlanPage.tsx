import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorNavigation } from '../hooks/useTutorNavigation'
import { today, formatDateLabel } from '../utils'
import { DatabaseService } from '../services/storage/Database'
import { StudyPlanStore } from '../features/studyPlan/storage/studyPlanStore'
import type { TaskEntry } from '../models'
import { IconListening, IconReading, IconWriting, IconSpeaking, IconVocabulary, IconGrammar, IconVocabularyReview, IconAITutor, IconCheckCircle, IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconMenu, IconTodayPlan } from '@ielts/ui'
import PageContainer from '../components/layout/PageContainer'
import type {
  DailyPlanItem,
  DailyPlanStatus,
  DailyStudyTask,
} from '../features/studyPlan/types'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { LoadingSkeleton } from '@ielts/ui'
import { ErrorState } from '../components/ui/EmptyState'

const SKILL_TASK_KEYS: Array<{
  key: keyof Pick<DailyPlanItem, 'listeningTask' | 'readingTask' | 'writingTask' | 'speakingTask' | 'vocabularyTask' | 'grammarTask' | 'reviewTask'>
  label: string
  skillColor: string
  icon: React.ReactNode
}> = [
  { key: 'listeningTask', label: 'Listening', skillColor: 'var(--color-skill-listening)', icon: <IconListening size={16} /> },
  { key: 'readingTask', label: 'Reading', skillColor: 'var(--color-skill-reading)', icon: <IconReading size={16} /> },
  { key: 'writingTask', label: 'Writing', skillColor: 'var(--color-skill-writing)', icon: <IconWriting size={16} /> },
  { key: 'speakingTask', label: 'Speaking', skillColor: 'var(--color-skill-speaking)', icon: <IconSpeaking size={16} /> },
  { key: 'vocabularyTask', label: 'Vocabulary', skillColor: 'var(--color-info)', icon: <IconVocabulary size={16} /> },
  { key: 'grammarTask', label: 'Grammar', skillColor: 'var(--color-success)', icon: <IconGrammar size={16} /> },
  { key: 'reviewTask', label: 'Review', skillColor: 'var(--color-muted)', icon: <IconVocabularyReview size={16} /> },
]

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'var(--color-muted)', label: 'Low' },
  medium: { color: 'var(--color-info)', label: 'Medium' },
  high: { color: 'var(--color-warning)', label: 'High' },
  critical: { color: 'var(--color-danger)', label: 'Critical' },
}

const DIFFICULTY_CONFIG: Record<string, { color: string; label: string }> = {
  easy: { color: 'var(--color-success)', label: 'Easy' },
  medium: { color: 'var(--color-warning)', label: 'Medium' },
  hard: { color: 'var(--color-danger)', label: 'Hard' },
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return Array.from({ length: 7 }, (_, i) => {
    const next = new Date(d)
    next.setDate(next.getDate() + i)
    return next.toISOString().slice(0, 10)
  })
}

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const startOfYear = new Date(d.getFullYear(), 0, 1)
  const diff = d.getTime() - startOfYear.getTime()
  return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)
}

export default function TodayPlanPage() {
  const navigate = useNavigate()
  const goToTutor = useTutorNavigation()
  const todayStr = useMemo(() => today(), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [planDay, setPlanDay] = useState<DailyPlanItem | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskEntry[]>([])
  const [checklistItems, setChecklistItems] = useState<Array<{ text: string; checked: boolean }>>([])


  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const allPlans = await StudyPlanStore.getAllPlans()
      const activePlan = allPlans.length > 0 ? allPlans[allPlans.length - 1] : null

      if (activePlan) {
        const pid = activePlan.planData.id
        setPlanId(pid)

        const todayPlan = await StudyPlanStore.getDailyPlan(pid, todayStr)
        if (todayPlan) {
          setPlanDay(todayPlan)
          setChecklistItems(
            (todayPlan.completionChecklist || []).map(text => ({
              text,
              checked: false,
            }))
          )
        } else {
          setPlanDay(null)
        }
      } else {
        setPlanId(null)
        setPlanDay(null)
      }

      const allTasks = await DatabaseService.getAll<TaskEntry>('tasks')
      setTasks(allTasks.filter(t => t.date.slice(0, 10) === todayStr))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load today\'s plan')
    } finally {
      setLoading(false)
    }
  }, [todayStr])

  useEffect(() => {
    loadData()
  }, [loadData])

  const todayDayOfWeek = useMemo(() => new Date().getDay(), [])
  const adjustedDayOfWeek = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1

  async function handleToggleTaskDone(task: TaskEntry) {
    const updated: TaskEntry = {
      ...task,
      isDone: !task.isDone,
      completedAt: !task.isDone ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    }
    await DatabaseService.put('tasks', updated)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  async function handleToggleDayTask(taskKey: string, task: DailyStudyTask, day: DailyPlanItem) {
    const updated = { ...task, isCompleted: !task.isCompleted }
    const keyMap: Record<string, keyof DailyPlanItem> = {
      listeningTask: 'listeningTask',
      readingTask: 'readingTask',
      writingTask: 'writingTask',
      speakingTask: 'speakingTask',
      vocabularyTask: 'vocabularyTask',
      grammarTask: 'grammarTask',
      reviewTask: 'reviewTask',
    }
    const prop = keyMap[taskKey]
    if (!prop || !planId) return

    const changes: Partial<DailyPlanItem> = {
      [prop]: updated,
      updatedAt: new Date().toISOString(),
    }

    try {
      await StudyPlanStore.updateDailyPlan(planId, day.date, changes)
      setPlanDay(prev => prev ? { ...prev, ...changes } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  async function handleUpdateDayStatus(day: DailyPlanItem, status: DailyPlanStatus) {
    if (!planId) return
    try {
      await StudyPlanStore.updateDailyPlanStatus(planId, day.date, status)
      setPlanDay(prev => prev ? { ...prev, status } : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update day status')
    }
  }

  async function handleToggleChecklist(index: number) {
    setChecklistItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], checked: !next[index].checked }
      return next
    })
  }

  const skillTasks = useMemo(() => {
    if (!planDay) return []
    return SKILL_TASK_KEYS.map(({ key, label, skillColor, icon }) => {
      const task = planDay[key] as DailyStudyTask | null
      if (!task || !task.title) return null
      return { key, label, skillColor, icon, task }
    }).filter(Boolean) as Array<{
      key: string
      label: string
      skillColor: string
      icon: ReactNode
      task: DailyStudyTask
    }>
  }, [planDay])

  const allPlanTasks = useMemo(() => {
    if (!planDay) return []
    const items: Array<{ task: DailyStudyTask; key: string }> = []
    for (const { key } of SKILL_TASK_KEYS) {
      const t = planDay[key] as DailyStudyTask | null
      if (t && t.title) items.push({ task: t, key })
    }
    for (let i = 0; i < planDay.optionalTasks.length; i++) {
      items.push({ task: planDay.optionalTasks[i], key: `optional-${i}` })
    }
    return items
  }, [planDay])

  const completedPlanTasks = allPlanTasks.filter(t => t.task.isCompleted).length
  const totalPlanTasks = allPlanTasks.length
  const completedLegacyTasks = tasks.filter(t => t.isDone).length
  const totalLegacyTasks = tasks.length
  const totalTasks = Math.max(totalPlanTasks, totalLegacyTasks)
  const completedTasks = Math.max(completedPlanTasks, completedLegacyTasks)
  const completedChecklist = checklistItems.filter(i => i.checked).length
  const allDone = totalTasks > 0 && completedTasks >= totalTasks

  const weekDates = useMemo(() => getWeekDates(todayStr), [todayStr])

  const estimatedTotal = planDay?.estimatedTotalMinutes || tasks.reduce((s, t) => s + (t.timeMinutes || 0), 0)

  function scrollToFirstIncomplete() {
    const el = document.querySelector('[data-task-incomplete]')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (loading) {
    return (
      <PageContainer width="narrow" className="space-y-5 pb-8" role="status" aria-label="Loading today's plan">
        <LoadingSkeleton variant="card" count={1} height="180px" />
        <LoadingSkeleton variant="card" count={1} height="80px" />
        <LoadingSkeleton variant="card" count={1} height="100px" />
        <LoadingSkeleton variant="card" count={3} />
        <LoadingSkeleton variant="card" count={1} height="80px" />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer width="narrow">
        <ErrorState
          title="Couldn't load today's plan"
          message={error}
          onRetry={loadData}
          variant="fullscreen"
        />
        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </PageContainer>
    )
  }

  if (!planDay && !planId && tasks.length === 0) {
    return (
      <PageContainer width="narrow">
        <div
          className="flex flex-col items-center justify-center rounded-2xl p-8 text-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <IconTodayPlan size={32} />
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Nothing planned for today
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            You haven't created a study plan yet. Let's build one to guide your IELTS journey!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate('/plan')}>
              Generate My Study Plan
            </Button>
            <Button variant="outline" onClick={() => goToTutor({ prompt: "I don't have a study plan yet. Can you help me create one?" })}>
              Chat with AI Tutor
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!planDay && tasks.length === 0) {
    return (
      <PageContainer width="narrow">
        <div
          className="flex flex-col items-center justify-center rounded-2xl p-8 text-center"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
          >
            <IconMenu size={32} />
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Today is a rest day
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            There are no tasks scheduled for today in your study plan. Enjoy your break!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/plan')}>
              View Full Plan
            </Button>
            <Button variant="outline" onClick={() => goToTutor({ prompt: "It's a rest day in my study plan. Can you suggest some light IELTS activities to keep practicing?" })}>
              Chat with AI Tutor
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide" className="space-y-5 pb-8 pt-4 sm:pt-6">
      {/* ============================================================ */}
      {/* 1. Today's Goal Header                                       */}
      {/* ============================================================ */}
      <section
        className="relative overflow-hidden rounded-3xl p-5 sm:p-6 lg:p-7"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-tutor-background) 100%)',
        }}
        aria-label="Today's study goal"
      >
        <div className="relative z-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/30" aria-hidden="true">
                  <IconTodayPlan size={22} style={{ color: 'var(--color-primary-dark)' }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight sm:text-2xl" style={{ color: 'var(--color-primary-dark)' }}>
                    {planDay?.mainGoal || 'Today\'s Study Session'}
                  </h1>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span style={{ color: 'var(--color-primary)' }}>
                  {formatDateLabel(todayStr)}
                </span>
                {planDay?.dayNumber && planDay && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                    Day {planDay.dayNumber}
                  </span>
                )}
                {planDay?.phaseName && (
                  <Badge variant="primary" size="sm">
                    {planDay.phaseName}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {planDay?.priority && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    backgroundColor: PRIORITY_CONFIG[planDay.priority]?.color || 'var(--color-surface-alt)',
                    color: '#fff',
                  }}
                >
                  {PRIORITY_CONFIG[planDay.priority]?.label || planDay.priority}
                </span>
              )}
              {planDay?.difficulty && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    backgroundColor: DIFFICULTY_CONFIG[planDay.difficulty]?.color || 'var(--color-surface-alt)',
                    color: '#fff',
                  }}
                >
                  {DIFFICULTY_CONFIG[planDay.difficulty]?.label || planDay.difficulty}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-primary)', opacity: 0.8 }}>
            <span className="inline-flex items-center gap-1">
              <IconClock size={14} />
              {estimatedTotal} min
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium" style={{ color: 'var(--color-primary)' }}>
                {totalTasks > 0 ? `${completedTasks}/${totalTasks} tasks` : 'No tasks'}
              </span>
              {totalTasks > 0 && (
                <span className="text-xs" style={{ color: 'var(--color-primary)', opacity: 0.7 }}>
                  {Math.round((completedTasks / totalTasks) * 100)}%
                </span>
              )}
            </div>
            <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%',
                  backgroundColor: allDone ? 'var(--color-success)' : 'var(--color-primary)',
                }}
                role="progressbar"
                aria-valuenow={completedTasks}
                aria-valuemin={0}
                aria-valuemax={totalTasks || 1}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!allDone && (
              <Button size="sm" onClick={scrollToFirstIncomplete}>
                {completedTasks > 0 ? 'Continue Studying' : 'Start Studying'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => goToTutor({ prompt: `Help me with today's study goal: ${planDay?.mainGoal || "Today's Study Session"}` })}>
              Ask AI Tutor
            </Button>
          </div>
        </div>
      </section>

      {allDone && (
        /* ============================================================ */
        /* 7. Celebration Card                                          */
        /* ============================================================ */
        <section
          className="rounded-3xl p-6 text-center sm:p-8"
          style={{
            background: 'linear-gradient(135deg, var(--color-success-light) 0%, var(--color-tutor-background) 100%)',
            border: '1px solid var(--color-success)',
          }}
          role="status"
          aria-live="assertive"
          aria-label="All tasks complete"
        >
          <div className="mb-3 text-4xl" aria-hidden="true">🎉</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-success-dark)' }}>
            Great job, IELTS Learner!
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            You completed today's study plan! {completedTasks}/{totalTasks} tasks done in ~{estimatedTotal} min.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => navigate('/plan?tab=week')}>
              View Tomorrow's Plan
            </Button>
            <Button variant="outline" onClick={() => goToTutor({ prompt: `I just completed today's IELTS study plan (${completedTasks}/${totalTasks} tasks). Can you help me review what I've learned?` })}>
              Chat with AI Tutor
            </Button>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 2. AI Tutor Note Card                                       */}
      {/* ============================================================ */}
      {planDay?.aiTutorNote && (
        <section
          className="rounded-2xl p-4 sm:p-5"
          style={{
            border: '1px solid var(--color-tutor-border)',
            backgroundColor: 'var(--color-tutor-background)',
          }}
          role="status"
          aria-live="polite"
          aria-label="AI Tutor tip"
        >
          <div className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}
            >
              <IconAITutor size={20} style={{ color: 'var(--color-tutor-accent)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-tutor-accent)' }}>
                Today's Tip
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {planDay.aiTutorNote}
              </p>
              <button
                onClick={() => goToTutor({ prompt: `Tell me more about: "${planDay.aiTutorNote}"` })}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--color-tutor-accent)' }}
              >
                Ask AI about this
                <IconChevronRight size={12} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 3. Completion Checklist                                      */}
      {/* ============================================================ */}
      {checklistItems.length > 0 && (
        <section
          className="rounded-2xl p-4 sm:p-5"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
          aria-label="Today's checklist"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Today's Checklist
            </h3>
            {completedChecklist === checklistItems.length && checklistItems.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                <IconCheckCircle size={14} />
                All checked!
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {completedChecklist}/{checklistItems.length} checked
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {checklistItems.map((item, index) => (
              <li key={index}>
                <label
                  className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: item.checked ? 'var(--color-success-light)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleChecklist(index)}
                    className="h-4 w-4 rounded border-2 transition-colors"
                    style={{
                      accentColor: 'var(--color-success)',
                    }}
                  />
                  <span
                    className={`text-sm transition-all ${
                      item.checked
                        ? 'line-through opacity-60'
                        : ''
                    }`}
                    style={{ color: 'var(--color-text)' }}
                  >
                    {item.text}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ============================================================ */}
      {/* 4. Skill Task Cards                                          */}
      {/* ============================================================ */}
      {planDay && skillTasks.length > 0 && (
        <section aria-label="Today's study tasks">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Today's Tasks
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {skillTasks.map(({ key, label, skillColor, icon, task }) => {
              const isCompleted = task.isCompleted
              return (
                <div
                  key={key}
                  data-task-incomplete={!isCompleted ? '' : undefined}
                  className="rounded-2xl p-4 transition-all"
                  style={{
                    border: `1px solid ${isCompleted ? 'var(--color-success)' : skillColor}`,
                    borderLeft: `3px solid ${skillColor}`,
                    backgroundColor: isCompleted ? 'var(--color-success-light)' : 'var(--color-surface)',
                    opacity: isCompleted ? 0.75 : 1,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  aria-label={`${label} task: ${task.title}, ${task.estimatedMinutes} minutes${isCompleted ? ', completed' : ', not started'}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleDayTask(key, task, planDay)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                      }`}
                      aria-label={isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} done`}
                    >
                      {isCompleted && (
                        <IconCheck size={12} strokeWidth={3} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: skillColor, color: '#fff', opacity: 0.9 }}
                        >
                          {icon} {label}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-semibold leading-snug ${
                          isCompleted ? 'line-through' : ''
                        }`}
                        style={{ color: isCompleted ? 'var(--color-success-dark)' : 'var(--color-text)' }}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p
                          className="mt-1 text-xs leading-relaxed line-clamp-2 sm:line-clamp-none"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-muted)' }}
                        >
                        <IconClock size={12} />
                        {task.estimatedMinutes}m
                      </span>

                      <button
                        onClick={() => goToTutor({ prompt: `Help me with ${label}: ${task.title}${task.description ? '. ' + task.description : ''}`, type: label.toLowerCase(), title: task.title })}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80"
                        style={{ backgroundColor: 'var(--color-tutor-accent-light)', color: 'var(--color-tutor-accent)' }}
                      >
                        <IconAITutor size={12} />
                        Ask AI
                        </button>

                        <button
                          onClick={() => {
                            const month = new Date(todayStr).getMonth()
                            const dayNum = new Date(todayStr).getDate()
                            const tomorrow = new Date(todayStr)
                            tomorrow.setDate(dayNum + 1)
                            navigate('/plan?date=' + tomorrow.toISOString().slice(0, 10))
                          }}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-80"
                          style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-muted)' }}
                        >
                          Open Practice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Legacy tasks (fallback) */}
      {planDay === null && tasks.length > 0 && (
        <section aria-label="Today's tasks (legacy)">
          <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Today's Tasks
          </h2>
          <div className="space-y-2">
            {tasks.map(task => {
              const categoryLower = task.category.toLowerCase()
              let badgeColor = 'var(--color-primary)'
              if (categoryLower.includes('reading')) badgeColor = 'var(--color-skill-reading)'
              else if (categoryLower.includes('listening')) badgeColor = 'var(--color-skill-listening)'
              else if (categoryLower.includes('writing')) badgeColor = 'var(--color-skill-writing)'
              else if (categoryLower.includes('speaking')) badgeColor = 'var(--color-skill-speaking)'
              else if (categoryLower.includes('grammar')) badgeColor = 'var(--color-success)'
              else if (categoryLower.includes('vocabulary')) badgeColor = 'var(--color-info)'

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
                  style={{
                    border: `1px solid ${task.isDone ? 'var(--color-success)' : 'var(--color-border)'}`,
                    backgroundColor: task.isDone ? 'var(--color-success-light)' : 'var(--color-surface)',
                    opacity: task.isDone ? 0.75 : 1,
                  }}
                  data-task-incomplete={!task.isDone ? '' : undefined}
                >
                  <button
                    onClick={() => handleToggleTaskDone(task)}
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
                      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: badgeColor, color: '#fff', opacity: 0.9 }}
                    >
                      {task.category}
                    </span>
                    <h3
                      className={`mt-1 text-sm font-semibold ${
                        task.isDone ? 'line-through' : ''
                      }`}
                      style={{ color: task.isDone ? 'var(--color-success-dark)' : 'var(--color-text)' }}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {task.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                      {task.timeMinutes > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <IconClock size={12} />
                          {task.timeMinutes}m
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* 6. Weekly Context Strip                                     */}
      {/* ============================================================ */}
      {planId && (
        <section
          className="rounded-2xl p-4 sm:p-5"
          style={{
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
          aria-label="Weekly progress"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              This Week
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/plan?tab=week')}>
              View Full Week
            </Button>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 justify-center sm:justify-start overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {weekDates.map((date, idx) => {
              const isToday = date === todayStr
              const dayNum = idx
              return (
                <div key={date} className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0">
                  <span className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>
                    {DAY_LABELS[dayNum]}
                  </span>
                  <div
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isToday ? 'scale-110 shadow-sm' : ''
                    }`}
                    style={{
                      borderColor: isToday ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: isToday ? 'var(--color-primary)' : 'transparent',
                    }}
                    aria-label={isToday ? 'Today' : DAY_LABELS[dayNum]}
                  >
                    <span
                      className={`text-[10px] sm:text-[11px] font-semibold ${
                        isToday ? 'text-white' : ''
                      }`}
                      style={{ color: isToday ? '#fff' : 'var(--color-muted)' }}
                    >
                      {new Date(date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-center sm:text-left text-xs" style={{ color: 'var(--color-muted)' }}>
            {completedTasks}/{totalTasks} tasks done · ~{estimatedTotal} min studied
          </p>
        </section>
      )}
    </PageContainer>
  )
}
