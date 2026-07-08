import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TaskEntry } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { today, formatDateLabel, isTodayDate, getWeekDates } from '../../utils'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { EmptyStateCard } from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import CalendarView from '../planner/components/CalendarView'
import { generateStudyPlan, loadPlan, type StudyPlanData } from './studyPlanService'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import {
  IconStudyPlan,
  IconCheck,
  IconCalendar,
  IconClock,
  IconProgress,
  IconTarget,
  IconAward,
  IconFlame,
  IconChevronDown,
  IconAdd,
  IconRefresh,
  IconAlertCircle,
  IconMistakes,
} from '@ielts/ui'

const PHASE_ACCENTS = [
  { border: 'var(--color-skill-listening)', light: 'var(--color-skill-listening-light)', dark: 'var(--color-skill-listening-dark)' },
  { border: 'var(--color-skill-reading)', light: 'var(--color-skill-reading-light)', dark: 'var(--color-skill-reading-dark)' },
  { border: 'var(--color-skill-writing)', light: 'var(--color-skill-writing-light)', dark: 'var(--color-skill-writing-dark)' },
  { border: 'var(--color-skill-speaking)', light: 'var(--color-skill-speaking-light)', dark: 'var(--color-skill-speaking-dark)' },
  { border: 'var(--color-primary)', light: 'var(--color-primary-light)', dark: 'var(--color-primary-dark)' },
]

const CATEGORY_BADGE: Record<string, { variant: 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary' | 'primary' | 'danger' }> = {
  'Vocabulary': { variant: 'vocabulary' },
  'Reading': { variant: 'reading' },
  'Listening': { variant: 'listening' },
  'Writing Task 1': { variant: 'writing' },
  'Writing Task 2': { variant: 'writing' },
  'Speaking Part 1': { variant: 'speaking' },
  'Speaking Part 2': { variant: 'speaking' },
  'Speaking Part 3': { variant: 'speaking' },
  'Grammar': { variant: 'grammar' },
  'Mock Test': { variant: 'danger' },
}

const SKILL_BADGE: Record<string, { variant: 'listening' | 'reading' | 'writing' | 'speaking' | 'vocabulary' | 'grammar' | 'default' }> = {
  reading: { variant: 'reading' },
  listening: { variant: 'listening' },
  writing: { variant: 'writing' },
  speaking: { variant: 'speaking' },
  vocabulary: { variant: 'vocabulary' },
  grammar: { variant: 'grammar' },
  mixed: { variant: 'default' },
}

function PhaseIcon({ index }: { index: number }) {
  const icons = [IconTarget, IconAward, IconFlame, IconProgress, IconCheck]
  const Icon = icons[index % icons.length]
  return <Icon size={18} />
}

function getCategoryBadgeVariant(category: string) {
  return CATEGORY_BADGE[category]?.variant ?? 'primary'
}

function getSkillBadgeVariant(skillFocus: string) {
  return SKILL_BADGE[skillFocus]?.variant ?? 'default'
}

export default function StudyPlan() {
  const [plan, setPlan] = useState<StudyPlanData | null>(null)
  const [tasks, setTasks] = useState<TaskEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generatingPhase, setGeneratingPhase] = useState(0)
  const [totalPhases, setTotalPhases] = useState(0)

  const [selectedDate, setSelectedDate] = useState(today())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [tab, setTab] = useState<'phases' | 'calendar' | 'week'>('phases')

  const [expandedPhase, setExpandedPhase] = useState<number | null>(0)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [allTasks, existingPlan] = await Promise.all([
        DatabaseService.getAll<TaskEntry>('tasks'),
        Promise.resolve(loadPlan()),
      ])
      setTasks(allTasks)
      setPlan(existingPlan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const weekTasks = useMemo(
    () => tasks.filter(t => getWeekDates(selectedDate).includes(t.date.slice(0, 10))),
    [tasks, selectedDate],
  )

  const monthTasks = useMemo(
    () => tasks.filter(t => {
      const d = t.date.slice(0, 10)
      return d.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`)
    }),
    [tasks, calendarYear, calendarMonth],
  )

  const selectedDayTasks = useMemo(
    () => tasks.filter(t => t.date.slice(0, 10) === selectedDate),
    [tasks, selectedDate],
  )

  const weekStats = useMemo(() => {
    const done = weekTasks.filter(t => t.isDone).length
    const total = weekTasks.length
    return {
      done,
      total,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
      minutes: weekTasks.reduce((s, t) => s + (t.timeMinutes || 0), 0),
    }
  }, [weekTasks])

  const missedTasks = useMemo(() => {
    const now = today()
    return tasks.filter(t => {
      if (t.isDone) return false
      return t.date.slice(0, 10) < now
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [tasks])

  const phaseStats = useMemo(() => {
    if (!plan) return null
    let totalTasks = 0
    let completedTasks = 0
    for (const phase of plan.phases) {
      for (const week of phase.weeks) {
        for (const day of week.days) {
          for (const _ of day.items) {
            totalTasks++
            const task = tasks.find(t => t.date.slice(0, 10) === day.date && t.title === _.title)
            if (task?.isDone) completedTasks++
          }
        }
      }
    }
    return { totalTasks, completedTasks, progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 }
  }, [plan, tasks])

  async function handleGenerate() {
    setGenerating(true)
    setGeneratedCount(0)
    setError(null)
    setGeneratingPhase(0)
    setTotalPhases(0)
    try {
      const result = await generateStudyPlan((current, total) => {
        setGeneratingPhase(current)
        setTotalPhases(total)
      })
      setPlan({ phases: result.phases, generatedAt: new Date().toISOString() })
      setTasks(result.tasks)
      setGeneratedCount(result.tasks.length)
      setShowGenerateModal(false)
      setExpandedPhase(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setGenerating(false)
      setGeneratingPhase(0)
      setTotalPhases(0)
    }
  }

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

  function handlePrevMonth() {
    if (calendarMonth === 0) { setCalendarYear(y => y - 1); setCalendarMonth(11) }
    else { setCalendarMonth(m => m - 1) }
  }

  function handleNextMonth() {
    if (calendarMonth === 11) { setCalendarYear(y => y + 1); setCalendarMonth(0) }
    else { setCalendarMonth(m => m + 1) }
  }

  function handleToday() {
    const now = new Date()
    setCalendarYear(now.getFullYear())
    setCalendarMonth(now.getMonth())
    setSelectedDate(today())
  }

  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr)
    setTab('calendar')
  }

  const allWeekDates = getWeekDates(selectedDate)

  if (loading) {
    return (
      <div className="flex h-full min-h-[50dvh] items-center justify-center">
        <LoadingSpinner size="lg" message="Loading study plan..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[50dvh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-3 py-6 sm:py-8">
            <IconAlertCircle size={32} style={{ color: 'var(--color-danger)' }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
            <Button variant="primary" size="sm" onClick={loadData} icon={<IconRefresh size={14} />}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageContent style={{ paddingBottom: 'var(--spacing-3xl)' }}>
      <PageHeader
        icon={<IconStudyPlan size={22} />}
        title="Study Plan"
        description={plan ? 'Track your learning journey phase by phase' : 'Create your personalised IELTS study roadmap'}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShowGenerateModal(true)} loading={generating} icon={<IconAdd size={16} />}>
              {plan ? 'Regenerate' : 'Generate Plan'}
            </Button>
          </div>
        }
      />

      {generatedCount > 0 && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}>
          <IconCheck size={16} />
          <span>Plan generated with <strong>{generatedCount}</strong> tasks across <strong>{plan?.phases.length ?? 0}</strong> phases</span>
        </div>
      )}

      <div className="mb-6 flex gap-1 rounded-2xl p-1.5" style={{ backgroundColor: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>
        {[
          { key: 'phases' as const, label: 'Phases', icon: <IconStudyPlan size={16} /> },
          { key: 'calendar' as const, label: 'Calendar', icon: <IconCalendar size={16} /> },
          { key: 'week' as const, label: 'This Week', icon: <IconClock size={16} /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {!plan && !generating && (
        <EmptyStateCard
          variant="plan"
          title="No study plan yet"
          description="Generate a personalised roadmap from today to your exam day. AI will craft daily tasks for each phase."
          action={{ label: 'Generate Plan', onClick: () => setShowGenerateModal(true) }}
        />
      )}

      {tab === 'phases' && plan && (
        <div className="space-y-6">
          {phaseStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card variant="elevated" padding="sm" className="text-center">
                <CardContent className="flex flex-col items-center gap-1 py-3">
                  <IconTarget size={20} style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{phaseStats.progress}%</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Overall Progress</p>
                </CardContent>
              </Card>
              <Card variant="elevated" padding="sm" className="text-center">
                <CardContent className="flex flex-col items-center gap-1 py-3">
                  <IconCheck size={20} style={{ color: 'var(--color-success)' }} />
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{phaseStats.completedTasks}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Completed</p>
                </CardContent>
              </Card>
              <Card variant="elevated" padding="sm" className="text-center">
                <CardContent className="flex flex-col items-center gap-1 py-3">
                  <IconProgress size={20} style={{ color: 'var(--color-text)' }} />
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{phaseStats.totalTasks}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Total Tasks</p>
                </CardContent>
              </Card>
              <Card variant="elevated" padding="sm" className="text-center">
                <CardContent className="flex flex-col items-center gap-1 py-3">
                  <IconMistakes size={20} style={{ color: 'var(--color-danger)' }} />
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>{missedTasks.length}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Missed</p>
                </CardContent>
              </Card>
            </div>
          )}

          {plan.phases.map((phase, pIdx) => {
            const isExpanded = expandedPhase === pIdx
            const accent = PHASE_ACCENTS[pIdx % PHASE_ACCENTS.length]
            const phaseTasks = tasks.filter(t => {
              const weekDates = phase.weeks.flatMap(w => w.days.map(d => d.date))
              return weekDates.includes(t.date.slice(0, 10))
            })
            const phaseDone = phaseTasks.filter(t => t.isDone).length
            const phaseTotal = phaseTasks.length
            const phasePct = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0

            return (
              <Card
                key={pIdx}
                variant="elevated"
                padding="none"
                className="overflow-hidden"
                style={{ borderLeft: `4px solid ${accent.border}` }}
              >
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : pIdx)}
                  className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left transition-colors hover:bg-[var(--color-surface-alt)]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: accent.light, color: accent.dark }}
                    >
                      <PhaseIcon index={pIdx} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                          {phase.name}
                        </h3>
                        <Badge variant="default" size="xs">{phase.targetBandRange}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {phase.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-semibold" style={{ color: accent.border }}>{phasePct}%</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{phaseDone}/{phaseTotal}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 sm:w-20 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${phasePct}%`, backgroundColor: accent.border }} />
                      </div>
                      <IconChevronDown
                        size={18}
                        style={{ color: 'var(--color-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }}
                      />
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-5" style={{ borderColor: 'var(--color-border)' }}>
                    {phase.weeks.map((week, wIdx) => {
                      const weekDates = week.days.map(d => d.date)
                      const weekTaskList = tasks.filter(t => weekDates.includes(t.date.slice(0, 10)))
                      const weekDone = weekTaskList.filter(t => t.isDone).length
                      const weekTotal = weekTaskList.length
                      const weekPct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0

                      return (
                        <div key={wIdx}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                Week {week.weekNumber}: {week.focus}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{week.goal}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{weekDone}/{weekTotal}</span>
                              <div className="h-2 w-16 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${weekPct}%`, backgroundColor: 'var(--color-primary)' }} />
                              </div>
                            </div>
                          </div>

                          {week.days.length > 0 && (
                            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                              {week.days.map((day, dIdx) => {
                                const dayTaskList = tasks.filter(t => t.date.slice(0, 10) === day.date)
                                if (dayTaskList.length === 0 && day.items.length === 0) return null
                                const isToday = isTodayDate(day.date)

                                return (
                                  <div
                                    key={dIdx}
                                    className={`flex items-start gap-3 px-3 sm:px-4 py-3 transition-colors hover:bg-[var(--color-surface-alt)] ${
                                      dIdx < week.days.length - 1 ? 'border-b' : ''
                                    }`}
                                    style={{ borderColor: 'var(--color-border)', backgroundColor: isToday ? 'var(--color-primary-light)' : 'transparent' }}
                                  >
                                    <div className="flex w-14 sm:w-20 shrink-0 flex-col pt-0.5">
                                      <span className="text-xs font-medium" style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                                        {formatDateLabel(day.date)}
                                      </span>
                                      {isToday && (
                                        <div className="mt-0.5 w-fit"><Badge variant="primary" size="xs">Today</Badge></div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <Badge variant={getSkillBadgeVariant(day.skillFocus)} size="xs">
                                          {day.skillFocus}
                                        </Badge>
                                        {day.objective && (
                                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{day.objective}</span>
                                        )}
                                      </div>
                                      {dayTaskList.length === 0 && day.items.map((item, iIdx) => (
                                        <div key={iIdx} className="flex items-center gap-2 py-0.5">
                                          <div className="h-4 w-4 shrink-0 rounded border-2" style={{ borderColor: 'var(--color-border)' }} />
                                          <span className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            {item.title}
                                          </span>
                                          {item.minutes > 0 && (
                                            <span className="text-[10px] shrink-0" style={{ color: 'var(--color-muted)' }}>{item.minutes}m</span>
                                          )}
                                        </div>
                                      ))}
                                      {dayTaskList.map(task => (
                                        <div key={task.id} className="flex items-center gap-2 py-0.5">
                                          <button
                                            onClick={() => handleToggleDone(task)}
                                            className="flex items-center justify-center h-5 w-5 shrink-0 rounded-md border-2 transition-all"
                                            style={{
                                              borderColor: task.isDone ? 'var(--color-success)' : 'var(--color-border)',
                                              backgroundColor: task.isDone ? 'var(--color-success)' : 'transparent',
                                            }}
                                            aria-label={task.isDone ? 'Mark task as not done' : 'Mark task as done'}
                                          >
                                            {task.isDone && <IconCheck size={12} style={{ color: 'white' }} />}
                                          </button>
                                          <span
                                            className={`text-xs sm:text-sm min-w-0 ${task.isDone ? 'line-through' : ''}`}
                                            style={{ color: task.isDone ? 'var(--color-muted)' : 'var(--color-text)' }}
                                          >
                                            {task.title}
                                          </span>
                                          <Badge variant={getCategoryBadgeVariant(task.category)} size="xs">
                                            {task.category}
                                          </Badge>
                                          {task.timeMinutes > 0 && (
                                            <span className="text-[10px] shrink-0" style={{ color: 'var(--color-muted)' }}>{task.timeMinutes}m</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'calendar' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-x-auto -mx-4 px-4">
            <CalendarView
              tasks={monthTasks}
              year={calendarYear}
              month={calendarMonth}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
              onDayClick={handleDayClick}
            />
          </div>
          <div className="space-y-4">
            <Card variant="elevated" padding="sm">
              <CardHeader className="mb-2">
                <div className="flex items-center gap-2">
                  <IconCalendar size={16} style={{ color: 'var(--color-primary)' }} />
                  <CardTitle>{formatDateLabel(selectedDate)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDayTasks.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <IconCheck size={24} style={{ color: 'var(--color-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No tasks for this day</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-[var(--color-surface-alt)]">
                        <button
                          onClick={() => handleToggleDone(task)}
                          className="flex items-center justify-center h-5 w-5 shrink-0 mt-0.5 rounded-md border-2 transition-all"
                          style={{
                            borderColor: task.isDone ? 'var(--color-success)' : 'var(--color-border)',
                            backgroundColor: task.isDone ? 'var(--color-success)' : 'transparent',
                          }}
                          aria-label={task.isDone ? 'Mark task as not done' : 'Mark task as done'}
                        >
                          {task.isDone && <IconCheck size={12} style={{ color: 'white' }} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${task.isDone ? 'line-through' : ''}`}
                            style={{ color: task.isDone ? 'var(--color-muted)' : 'var(--color-text)' }}
                          >
                            {task.title}
                          </p>
                          <div className="mt-0.5 flex gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                            <span>{task.category}</span>
                            {task.timeMinutes > 0 && <span>{task.timeMinutes}m</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {missedTasks.length > 0 && (
              <Card variant="elevated" padding="sm">
                <CardHeader className="mb-2">
                  <div className="flex items-center gap-2">
                    <IconMistakes size={16} style={{ color: 'var(--color-danger)' }} />
                    <CardTitle>
                      <span className="flex items-center justify-between gap-2">
                        Missed Tasks
                        <span className="text-sm font-bold" style={{ color: 'var(--color-danger)' }}>{missedTasks.length}</span>
                      </span>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Reschedule missed tasks from the Phase view to stay on track.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'week' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card variant="elevated" padding="sm" className="text-center">
              <CardContent className="flex flex-col items-center gap-1 py-3">
                <IconTarget size={20} style={{ color: 'var(--color-primary)' }} />
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{weekStats.percent}%</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>This Week Complete</p>
                <div className="mt-1.5 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${weekStats.percent}%`, backgroundColor: 'var(--color-success)' }} />
                </div>
              </CardContent>
            </Card>
            <Card variant="elevated" padding="sm" className="text-center">
              <CardContent className="flex flex-col items-center gap-1 py-3">
                <IconCheck size={20} style={{ color: 'var(--color-success)' }} />
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{weekStats.done}/{weekStats.total}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Tasks Done</p>
              </CardContent>
            </Card>
            <Card variant="elevated" padding="sm" className="text-center">
              <CardContent className="flex flex-col items-center gap-1 py-3">
                <IconClock size={20} style={{ color: 'var(--color-text)' }} />
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{weekStats.minutes}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Minutes Studied</p>
              </CardContent>
            </Card>
          </div>

          {allWeekDates.map(date => {
            const dayTasks = tasks.filter(t => t.date.slice(0, 10) === date)
            if (dayTasks.length === 0) return null
            const isToday = isTodayDate(date)

            return (
              <Card
                key={date}
                variant={isToday ? 'elevated' : 'default'}
                padding="sm"
                className={isToday ? 'ring-2 ring-[var(--color-primary)]' : ''}
              >
                <CardHeader className="mb-2">
                  <div className="flex items-center gap-2">
                    <IconCalendar size={16} style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-muted)' }} />
                    <CardTitle>{formatDateLabel(date)}</CardTitle>
                    {isToday && (
                      <Badge variant="primary" size="xs">Today</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-[var(--color-surface-alt)]"
                      >
                        <button
                          onClick={() => handleToggleDone(task)}
                          className="flex items-center justify-center h-6 w-6 shrink-0 mt-0.5 rounded-lg border-2 transition-all"
                          style={{
                            borderColor: task.isDone ? 'var(--color-success)' : 'var(--color-border)',
                            backgroundColor: task.isDone ? 'var(--color-success)' : 'transparent',
                          }}
                          aria-label={task.isDone ? 'Mark undone' : 'Mark done'}
                        >
                          {task.isDone && <IconCheck size={14} style={{ color: 'white' }} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                            <Badge variant={getCategoryBadgeVariant(task.category)} size="xs">
                              {task.category}
                            </Badge>
                          </div>
                          <p className={`text-sm ${task.isDone ? 'line-through' : ''}`}
                            style={{ color: task.isDone ? 'var(--color-muted)' : 'var(--color-text)' }}
                          >
                            {task.title}
                          </p>
                          {task.timeMinutes > 0 && (
                            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>{task.timeMinutes}m</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={showGenerateModal} onClose={() => generating ? null : setShowGenerateModal(false)} title="Generate Study Plan" size="md">
        <div className="space-y-4">
          {generating ? (
            <div className="flex flex-col items-center gap-5 py-6">
              {totalPhases > 0 ? (
                <div className="flex w-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      {generatingPhase}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
                        {generatingPhase === 1
                          ? 'Analyzing your goals and timeline'
                          : generatingPhase === totalPhases
                            ? 'Finalizing your study roadmap'
                            : `Building phase ${generatingPhase} of your plan`}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Phase {generatingPhase} of {totalPhases}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-xs font-semibold tabular-nums"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {Math.round((generatingPhase / totalPhases) * 100)}%
                    </span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(generatingPhase / totalPhases) * 100}%`,
                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-hover))',
                        boxShadow: '0 0 8px color-mix(in srgb, var(--color-primary) 40%, transparent)',
                      }}
                    />
                  </div>
                  <div className="flex w-full items-center justify-between px-0.5">
                    {Array.from({ length: totalPhases }, (_, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-1.5"
                        style={{ width: `${100 / totalPhases}%` }}
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: i < generatingPhase
                              ? 'var(--color-primary)'
                              : i === generatingPhase
                                ? 'var(--color-primary)'
                                : 'var(--color-border)',
                            opacity: i < generatingPhase ? 1 : i === generatingPhase ? 0.9 : 0.3,
                            transform: i === generatingPhase ? 'scale(1.3)' : 'scale(1)',
                          }}
                        />
                        <span
                          className="text-[10px] leading-none transition-all duration-300"
                          style={{
                            color: i <= generatingPhase ? 'var(--color-primary)' : 'var(--color-muted)',
                            fontWeight: i <= generatingPhase ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                          }}
                        >
                          {totalPhases <= 6 ? `Phase ${i + 1}` : `${(i + 1) * Math.round(100 / totalPhases)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {generatingPhase < totalPhases
                        ? `Generating next phase...`
                        : 'Saving your plan...'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex h-2 w-64 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                    <div
                      className="h-full w-1/3 animate-pulse rounded-full"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      Preparing your study plan
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      Analyzing your IELTS level and study preferences...
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-2xl p-3 sm:p-4" style={{ backgroundColor: 'var(--color-primary-light)' }}>
                <IconStudyPlan size={20} style={{ color: 'var(--color-primary)', marginTop: '2px' }} />
                <div>
                  <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                    AI will generate a structured study plan with learning phases and daily tasks tailored to your level, weak areas, and available study time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' }}>
                <IconAlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>This will replace your existing plan and tasks on the scheduled dates.</span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
                <Button onClick={handleGenerate} loading={generating} icon={<IconAdd size={16} />}>
                  Generate Plan
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </PageContent>
  )
}
