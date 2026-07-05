import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TaskEntry } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { today, formatDateLabel, isTodayDate, addDays, getWeekDates } from '../../utils'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CalendarView from '../planner/components/CalendarView'
import { generateStudyPlan, loadPlan, type StudyPlanData, type StudyPlanPhase, type StudyPlanWeek } from './studyPlanService'

const CATEGORY_COLORS: Record<string, string> = {
  'Vocabulary': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Reading': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Listening': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Writing Task 1': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Writing Task 2': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Speaking Part 1': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Speaking Part 2': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'Speaking Part 3': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Grammar': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'Mock Test': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const SKILL_COLORS: Record<string, string> = {
  reading: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  listening: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  writing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  speaking: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  vocabulary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  grammar: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  mixed: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
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
      <div className="flex h-full items-center justify-center">
        <div role="status" className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Study Plan</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {plan ? 'Learning phases with daily tasks' : 'Generate a personalised study plan'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowGenerateModal(true)} loading={generating}>
            {plan ? 'Regenerate' : 'Generate Plan'}
          </Button>
        </div>
      </div>

      {generating && totalPhases > 0 && (
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Generating phase {generatingPhase} of {totalPhases}...
        </div>
      )}

      {generatedCount > 0 && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Plan generated with {generatedCount} tasks across {plan?.phases.length ?? 0} phases
        </div>
      )}

      <div className="flex gap-1 rounded-lg border p-1" style={{ backgroundColor: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
        {[
          { key: 'phases', label: 'Phases' },
          { key: 'calendar', label: 'Calendar' },
          { key: 'week', label: 'This Week' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!plan && !generating && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              No study plan yet. Generate a personalised plan with AI or start adding tasks manually.
            </p>
            <Button onClick={() => setShowGenerateModal(true)}>Generate Plan</Button>
          </CardContent>
        </Card>
      )}

      {tab === 'phases' && plan && (
        <div className="space-y-6">
          {phaseStats && (
            <div className="grid gap-4 sm:grid-cols-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{phaseStats.progress}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Overall Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{phaseStats.completedTasks}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{phaseStats.totalTasks}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Tasks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{missedTasks.length}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Missed</p>
                </CardContent>
              </Card>
            </div>
          )}

          {plan.phases.map((phase, pIdx) => {
            const isExpanded = expandedPhase === pIdx
            const phaseTasks = tasks.filter(t => {
              const weekDates = phase.weeks.flatMap(w => w.days.map(d => d.date))
              return weekDates.includes(t.date.slice(0, 10))
            })
            const phaseDone = phaseTasks.filter(t => t.isDone).length
            const phaseTotal = phaseTasks.length
            const phasePct = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0

            return (
              <Card key={pIdx}>
                <CardHeader>
                  <button
                    onClick={() => setExpandedPhase(isExpanded ? null : pIdx)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <CardTitle>{phase.name}</CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {phase.description} — {phase.targetBandRange}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{phasePct}%</p>
                        <p className="text-xs text-slate-400">{phaseDone}/{phaseTotal}</p>
                      </div>
                      <svg className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${phasePct}%` }} />
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {phase.weeks.map((week, wIdx) => {
                      const weekDates = week.days.map(d => d.date)
                      const weekTaskList = tasks.filter(t => weekDates.includes(t.date.slice(0, 10)))
                      const weekDone = weekTaskList.filter(t => t.isDone).length
                      const weekTotal = weekTaskList.length
                      const weekPct = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0

                      return (
                        <div key={wIdx} className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Week {week.weekNumber}: {week.focus}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{week.goal}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{weekDone}/{weekTotal}</span>
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${weekPct}%` }} />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {week.days.map((day, dIdx) => {
                              const dayTaskList = tasks.filter(t => t.date.slice(0, 10) === day.date)
                              if (dayTaskList.length === 0 && day.items.length === 0) return null

                              return (
                                <div key={dIdx} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <div className="w-16 shrink-0 text-xs text-slate-400">
                                    {formatDateLabel(day.date)}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${SKILL_COLORS[day.skillFocus] || SKILL_COLORS.mixed}`}>
                                        {day.skillFocus}
                                      </span>
                                      {day.objective && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{day.objective}</span>
                                      )}
                                    </div>
                                    {dayTaskList.map(task => (
                                      <div key={task.id} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={task.isDone}
                                          onChange={() => handleToggleDone(task)}
                                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className={`text-xs ${task.isDone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                          {task.title}
                                        </span>
                                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium ${CATEGORY_COLORS[task.category] || ''}`}>
                                          {task.category}
                                        </span>
                                        {task.timeMinutes > 0 && (
                                          <span className="text-[10px] text-slate-400">{task.timeMinutes}m</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'calendar' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
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
            <Card>
              <CardHeader>
                <CardTitle>{formatDateLabel(selectedDate)}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayTasks.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">No tasks for this day</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={task.isDone}
                          onChange={() => handleToggleDone(task)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className={`text-sm ${task.isDone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {task.title}
                          </p>
                          <div className="flex gap-2 text-[10px] text-slate-400">
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
              <Card>
                <CardHeader>
                  <CardTitle>Missed</CardTitle>
                  <span className="text-sm font-medium text-red-600">{missedTasks.length}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reschedule missed tasks from the Phase view</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'week' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weekStats.percent}%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">This Week</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${weekStats.percent}%` }} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{weekStats.done}/{weekStats.total}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tasks Done</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{weekStats.minutes}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Minutes Studied</p>
              </CardContent>
            </Card>
          </div>

          {allWeekDates.map(date => {
            const dayTasks = tasks.filter(t => t.date.slice(0, 10) === date)
            if (dayTasks.length === 0) return null
            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <CardTitle>{formatDateLabel(date)}</CardTitle>
                    <span className={`text-xs font-medium ${isTodayDate(date) ? 'text-blue-600' : 'text-slate-400'}`}>
                      {isTodayDate(date) ? 'Today' : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayTasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: task.isDone ? 'var(--color-success)' : 'var(--color-border)', backgroundColor: task.isDone ? 'var(--color-success-light)' : 'var(--color-surface)' }}>
                        <button
                          onClick={() => handleToggleDone(task)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            task.isDone ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 hover:border-slate-400'
                          }`}
                          aria-label={task.isDone ? 'Mark undone' : 'Mark done'}
                        >
                          {task.isDone && (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[task.category] || ''}`}>
                              {task.category}
                            </span>
                          </div>
                          <p className={`mt-0.5 text-sm ${task.isDone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {task.title}
                          </p>
                          {task.timeMinutes > 0 && (
                            <p className="mt-0.5 text-xs text-slate-400">{task.timeMinutes}m</p>
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

      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Study Plan" size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            AI will generate a structured study plan with learning phases and daily tasks tailored to your level, weak areas, and available study time.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            This will replace your existing plan and tasks on the scheduled dates.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button onClick={handleGenerate} loading={generating}>
              Generate Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
