import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { TaskEntry, TaskCategory } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { today, formatDateLabel, isTodayDate, addDays, getWeekDates, generateId } from '../../utils'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CalendarView from './components/CalendarView'
import { taskFormSchema, type TaskFormData } from './validation'
import { generateAISchedule } from './aiPlannerService'

const CATEGORIES: TaskCategory[] = [
  'Vocabulary', 'Reading', 'Listening',
  'Writing Task 1', 'Writing Task 2',
  'Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3',
  'Grammar', 'Mock Test',
]

const CATEGORY_COLORS: Record<TaskCategory, string> = {
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

const SCHEDULE_TEMPLATES: Array<{
  category: TaskCategory
  title: string
  description: string
  minutesDaily: number
  minutesWeekly: number
}> = [
  { category: 'Vocabulary', title: 'Learn new vocabulary words', description: 'Study new words using the Vocabulary Notebook', minutesDaily: 15, minutesWeekly: 105 },
  { category: 'Vocabulary', title: 'Review vocabulary due today', description: 'Use spaced repetition to review due words', minutesDaily: 10, minutesWeekly: 70 },
  { category: 'Reading', title: 'Read IELTS passage', description: 'Read and answer questions for one IELTS Reading passage', minutesDaily: 0, minutesWeekly: 60 },
  { category: 'Listening', title: 'Listening practice', description: 'Complete one Listening section exercise', minutesDaily: 0, minutesWeekly: 50 },
  { category: 'Writing Task 2', title: 'Write a Task 2 essay', description: 'Practice writing a 250-word essay', minutesDaily: 0, minutesWeekly: 40 },
  { category: 'Writing Task 1', title: 'Writing Task 1 practice', description: 'Describe a chart or graph', minutesDaily: 0, minutesWeekly: 30 },
  { category: 'Speaking Part 2', title: 'Speaking Part 2 practice', description: 'Practice a cue card topic for 2 minutes', minutesDaily: 0, minutesWeekly: 30 },
  { category: 'Speaking Part 3', title: 'Speaking Part 3 discussion', description: 'Practice answering abstract questions', minutesDaily: 0, minutesWeekly: 20 },
  { category: 'Grammar', title: 'Review grammar topic', description: 'Study grammar rules and practice exercises', minutesDaily: 0, minutesWeekly: 40 },
  { category: 'Mock Test', title: 'Full Mock Test', description: 'Complete one full IELTS mock test', minutesDaily: 0, minutesWeekly: 0 },
]

interface ScheduleConfig {
  targetBand: number
  dailyMinutes: number
  examDate: string
}

function generateSchedule(config: ScheduleConfig): Array<{
  date: string
  items: Array<{ category: TaskCategory; title: string; description: string; minutes: number }>
}> {
  const { targetBand, dailyMinutes, examDate } = config
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = examDate ? new Date(examDate + 'T00:00:00') : new Date(start)
  if (!examDate) end.setMonth(end.getMonth() + 3)
  if (end <= start) end.setMonth(end.getMonth() + 3)

  const intensityMultiplier = Math.min(targetBand / 5, 2)
  const dailyTarget = Math.round(dailyMinutes * intensityMultiplier)

  const weeklyTasks = SCHEDULE_TEMPLATES.filter(t => t.minutesWeekly > 0 || t.minutesDaily > 0)
  const dailyTasks = weeklyTasks.filter(t => t.minutesDaily > 0)

  const days: Array<{
    date: string
    items: Array<{ category: TaskCategory; title: string; description: string; minutes: number }>
  }> = []

  const current = new Date(start)
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10)
    const dayOfWeek = current.getDay()
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    const items: Array<{ category: TaskCategory; title: string; description: string; minutes: number }> = []

    let totalMin = 0

    for (const t of dailyTasks) {
      items.push({
        category: t.category,
        title: t.title,
        description: t.description,
        minutes: t.minutesDaily,
      })
      totalMin += t.minutesDaily
    }

    if (adjustedDay < 5) {
      const weeklyOnWeekdays = weeklyTasks.filter(
        t => t.minutesWeekly > 0 && t.minutesDaily === 0
      )
      const perDay = Math.ceil(weeklyOnWeekdays.length / 5)
      const startIdx = adjustedDay * perDay % weeklyOnWeekdays.length
      for (let i = 0; i < perDay && startIdx + i < weeklyOnWeekdays.length; i++) {
        const t = weeklyOnWeekdays[startIdx + i]
        const allocMinutes = Math.min(
          t.minutesWeekly > 50 ? 40 : t.minutesWeekly,
          Math.max(15, Math.round(t.minutesWeekly / 5))
        )
        items.push({ category: t.category, title: t.title, description: t.description, minutes: allocMinutes })
        totalMin += allocMinutes
      }
    } else {
      const weekendTasks = weeklyTasks.filter(
        t => t.minutesWeekly > 0 && !dailyTasks.includes(t)
      )
      const remaining = Math.max(dailyTarget - totalMin, 30)
      let allocated = 0
      for (const t of weekendTasks) {
        if (allocated >= remaining) break
        const m = Math.min(t.minutesWeekly > 50 ? 40 : t.minutesWeekly, remaining - allocated)
        items.push({ category: t.category, title: t.title, description: t.description, minutes: m })
        allocated += m
        totalMin += m
      }
    }

    if (totalMin > 0) {
      days.push({ date: dateStr, items })
    }

    current.setDate(current.getDate() + 1)
  }

  return days
}

export default function Planner() {
  const [tasks, setTasks] = useState<TaskEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(today())
  const [tab, setTab] = useState<'calendar' | 'schedule' | 'settings'>('calendar')

  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)

  const [editingTask, setEditingTask] = useState<TaskEntry | null>(null)
  const [notesTask, setNotesTask] = useState<TaskEntry | null>(null)
  const [notesText, setNotesText] = useState('')

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(() => {
    const raw = localStorage.getItem('ielts-settings')
    if (raw) {
      try {
        const s = JSON.parse(raw)
        return {
          targetBand: s.targetBand ?? 7.0,
          dailyMinutes: s.dailyStudyMinutes ?? 60,
          examDate: s.examDate ?? '',
        }
      } catch { /* ignore */ }
    }
    return { targetBand: 7.0, dailyMinutes: 60, examDate: '' }
  })

  const [generating, setGenerating] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  const [saving, setSaving] = useState(false)

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<TaskEntry>('tasks')
      setTasks(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const selectedWeekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])
  const selectedDayTasks = useMemo(
    () => tasks.filter(t => t.date.slice(0, 10) === selectedDate),
    [tasks, selectedDate]
  )

  const weekTasks = useMemo(
    () => tasks.filter(t => selectedWeekDates.includes(t.date.slice(0, 10))),
    [tasks, selectedWeekDates]
  )

  const monthTasks = useMemo(
    () => tasks.filter(t => {
      const d = t.date.slice(0, 10)
      return d.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`)
    }),
    [tasks, calendarYear, calendarMonth]
  )

  const missedTasks = useMemo(() => {
    const now = today()
    return tasks.filter(t => {
      if (t.isDone) return false
      return t.date.slice(0, 10) < now
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [tasks])

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

  const missedCount = missedTasks.length

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

  async function handleDelete(id: string) {
    await DatabaseService.remove('tasks', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function openCreateTask() {
    setEditingTask(null)
    setShowTaskModal(true)
  }

  function openEditTask(task: TaskEntry) {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  function openNotes(task: TaskEntry) {
    setNotesTask(task)
    setNotesText(task.notes)
    setShowNotesModal(true)
  }

  async function saveNotes() {
    if (!notesTask) return
    const updated: TaskEntry = {
      ...notesTask,
      notes: notesText,
      updatedAt: new Date().toISOString(),
    }
    await DatabaseService.put('tasks', updated)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setShowNotesModal(false)
    setNotesTask(null)
  }

  function handlePrevMonth() {
    if (calendarMonth === 0) {
      setCalendarYear(y => y - 1)
      setCalendarMonth(11)
    } else {
      setCalendarMonth(m => m - 1)
    }
  }

  function handleNextMonth() {
    if (calendarMonth === 11) {
      setCalendarYear(y => y + 1)
      setCalendarMonth(0)
    } else {
      setCalendarMonth(m => m + 1)
    }
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

  function handleGenerateSchedule() {
    setShowGenerateModal(true)
  }

  async function confirmGenerateSchedule() {
    setGenerating(true)
    setGeneratedCount(0)
    setError(null)
    try {
      let schedule: Array<{
        date: string
        items: Array<{ category: TaskCategory; title: string; minutes: number; description?: string }>
      }>

      const aiResult = await generateAISchedule()
      if (aiResult.usedAi && !aiResult.error) {
        schedule = aiResult.days
      } else {
        const template = generateSchedule(scheduleConfig)
        schedule = template.map(d => ({
          date: d.date,
          items: d.items.map(i => ({
            category: i.category,
            title: i.title,
            minutes: i.minutes,
            description: i.description,
          })),
        }))
      }

      const existingTasks = await DatabaseService.getAll<TaskEntry>('tasks')
      const now = new Date().toISOString()
      let count = 0
      for (const day of schedule) {
        const dateHasTasks = existingTasks.some(t => t.date.slice(0, 10) === day.date)
        if (dateHasTasks) continue
        for (const item of day.items) {
          const task: TaskEntry = {
            id: generateId(),
            title: item.title,
            description: item.description ?? '',
            category: item.category,
            date: day.date + 'T00:00:00.000Z',
            isDone: false,
            isRecurring: false,
            recurringDays: [],
            notes: '',
            timeMinutes: item.minutes,
            createdAt: now,
            updatedAt: now,
            completedAt: null,
          }
          await DatabaseService.add('tasks', task)
          count++
        }
      }
      setTasks(await DatabaseService.getAll<TaskEntry>('tasks'))
      setGeneratedCount(count)
      setShowGenerateModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule')
    } finally {
      setGenerating(false)
    }
  }

  async function handleResetMissed(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const updated: TaskEntry = {
      ...task,
      date: today() + 'T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }
    await DatabaseService.put('tasks', updated)
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function handleRescheduleMissed(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const tomorrow = addDays(today(), 1)
    const updated: TaskEntry = {
      ...task,
      date: tomorrow + 'T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }
    await DatabaseService.put('tasks', updated)
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
  }

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
            <Button variant="secondary" className="mt-4" onClick={loadTasks}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Study Planner
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
            Plan, track, and manage your IELTS study schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateSchedule}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Auto Schedule
          </Button>
          <Button onClick={openCreateTask} variant="secondary">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </Button>
        </div>
      </div>

      <div
        className="flex gap-1 rounded-lg border p-1"
        style={{
          backgroundColor: 'var(--color-surface-alt)',
          borderColor: 'var(--color-border)',
        }}
      >
        {[
          { key: 'calendar', label: 'Calendar', icon: 'M3 3h18v18H3V3z M21 9H3' },
          { key: 'schedule', label: 'Schedule', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { key: 'settings', label: 'Schedule Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  This Week
                </p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {weekStats.percent}%
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${weekStats.percent}%`, backgroundColor: 'var(--color-success)' }}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                  {weekStats.done}/{weekStats.total} tasks
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Week Study Time
                </p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>
                  {weekStats.minutes}
                  <span className="ml-1 text-sm font-normal" style={{ color: 'var(--color-muted)' }}>min</span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Total Tasks
                </p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {tasks.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Missed Tasks
                </p>
                <p
                  className="mt-1 text-2xl font-bold"
                  style={{ color: missedCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
                >
                  {missedCount}
                </p>
              </CardContent>
            </Card>
          </div>

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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                      aria-label="Previous day"
                      className="p-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                      aria-label="Next day"
                      className="p-1"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDayTasks.length === 0 ? (
                    <p className="py-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                      No tasks for this day.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-start gap-2 rounded-lg border p-2.5"
                          style={{
                            borderColor: 'var(--color-border)',
                            backgroundColor: task.isDone ? 'var(--color-success-light)' : 'var(--color-surface)',
                          }}
                        >
                          <button
                            onClick={() => handleToggleDone(task)}
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              task.isDone
                                ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                                : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
                            }`}
                            aria-label={task.isDone ? 'Mark undone' : 'Mark done'}
                          >
                            {task.isDone && (
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[task.category]}`}>
                              {task.category}
                            </span>
                            <p
                              className="mt-0.5 text-sm"
                              style={{
                                color: task.isDone ? 'var(--color-muted)' : 'var(--color-text-secondary)',
                                textDecoration: task.isDone ? 'line-through' : 'none',
                              }}
                            >
                              {task.title}
                            </p>
                            {task.timeMinutes > 0 && (
                              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                                {task.timeMinutes}m
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button variant="ghost" size="sm" onClick={() => openNotes(task)} className="p-1" aria-label="Edit notes">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditTask(task)} className="p-1" aria-label="Edit task">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)} className="p-1" style={{ color: 'var(--color-danger)' }} aria-label="Delete task">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
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
                    <CardTitle>Missed Tasks</CardTitle>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                      {missedTasks.length}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {missedTasks.slice(0, 10).map(task => (
                        <div
                          key={task.id}
                          className="rounded-lg border p-2.5 text-xs"
                          style={{
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                {task.title}
                              </p>
                              <p style={{ color: 'var(--color-muted)' }}>
                                {formatDateLabel(task.date.slice(0, 10))}
                                {' · '}{task.timeMinutes}m
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetMissed(task.id)}
                                className="px-2 py-1 text-xs"
                                title="Move to today"
                              >
                                Today
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRescheduleMissed(task.id)}
                                className="px-2 py-1 text-xs"
                                title="Move to tomorrow"
                              >
                                Tomorrow
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'schedule' && (
        <div className="space-y-4">
          {weekTasks.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="mb-4 h-12 w-12" style={{ color: 'var(--color-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                    No tasks this week
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Generate a schedule or add tasks manually.
                  </p>
                  <Button className="mt-4" size="sm" onClick={handleGenerateSchedule}>
                    Auto-Generate Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            selectedWeekDates.map(date => {
              const dayTasks = tasks.filter(t => t.date.slice(0, 10) === date)
              if (dayTasks.length === 0) return null
              const done = dayTasks.filter(t => t.isDone).length
              return (
                <Card key={date}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CardTitle>{formatDateLabel(date)}</CardTitle>
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {done}/{dayTasks.length} done
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: isTodayDate(date) ? 'var(--color-primary)' : 'var(--color-muted)' }}
                      >
                        {isTodayDate(date) ? 'Today' : ''}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dayTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 rounded-lg border p-3"
                          style={{
                            borderColor: task.isDone ? 'var(--color-success)' : 'var(--color-border)',
                            backgroundColor: task.isDone ? 'var(--color-success-light)' : 'var(--color-surface)',
                          }}
                        >
                          <button
                            onClick={() => handleToggleDone(task)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              task.isDone
                                ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                                : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
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
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[task.category]}`}>
                                {task.category}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                                {task.description}
                              </p>
                            )}
                            <div className="mt-1 flex gap-3 text-xs" style={{ color: 'var(--color-muted)' }}>
                              {task.timeMinutes > 0 && <span>{task.timeMinutes}m</span>}
                              {task.completedAt && (
                                <span style={{ color: 'var(--color-success)' }}>Completed</span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditTask(task)} className="p-1" aria-label="Edit">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)} className="p-1" style={{ color: 'var(--color-danger)' }} aria-label="Delete">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {tab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Generation Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateSchedule() }} className="space-y-4 max-w-lg">
              <div>
                <label htmlFor="target-band" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Target IELTS Band
                </label>
                <input
                  id="target-band"
                  type="number"
                  min="1"
                  max="9"
                  step="0.5"
                  value={scheduleConfig.targetBand}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, targetBand: Math.min(9, Math.max(1, parseFloat(e.target.value) || 1)) }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                  Higher target = more intensive study schedule
                </p>
              </div>
              <div>
                <label htmlFor="daily-minutes" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Daily Study Time (minutes)
                </label>
                <input
                  id="daily-minutes"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={scheduleConfig.dailyMinutes}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, dailyMinutes: Math.min(480, Math.max(15, parseInt(e.target.value) || 15)) }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              <div>
                <label htmlFor="exam-date" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Exam Date (optional)
                </label>
                <input
                  id="exam-date"
                  type="date"
                  value={scheduleConfig.examDate}
                  onChange={(e) => setScheduleConfig(prev => ({ ...prev, examDate: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                  Schedule will be generated from today until this date
                </p>
              </div>
              <div className="pt-2">
                <Button type="submit">
                  Generate Schedule
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Modal open={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Study Schedule" size="md">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            AI will generate a personalised daily study schedule based on your target band, current level, weak areas, and available study time. Falls back to template-based scheduling if AI is not configured.
          </p>
          <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-alt)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Target Band</span>
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{scheduleConfig.targetBand}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Daily Study Time</span>
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{scheduleConfig.dailyMinutes} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-muted)' }}>Exam Date</span>
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                {scheduleConfig.examDate ? formatDateLabel(scheduleConfig.examDate) : 'Not set (3 month plan)'}
              </span>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-warning)' }}>
            Only days without existing tasks will receive new tasks. Existing tasks will not be modified.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button onClick={confirmGenerateSchedule} loading={generating}>
              {generating ? 'Generating...' : 'Generate Schedule'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showTaskModal} onClose={() => { setShowTaskModal(false); setEditingTask(null) }} title={editingTask ? 'Edit Task' : 'Add Task'} size="md">
        <TaskForm
          task={editingTask}
          defaultDate={selectedDate}
          onSave={async (formData) => {
            setSaving(true)
            try {
              const now = new Date().toISOString()
              if (editingTask) {
                const updated: TaskEntry = {
                  ...editingTask,
                  title: formData.title,
                  description: formData.description,
                  category: formData.category,
                  date: formData.date + 'T00:00:00.000Z',
                  timeMinutes: formData.timeMinutes,
                  notes: formData.notes,
                  updatedAt: now,
                }
                await DatabaseService.put('tasks', updated)
                setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
              } else {
                const task: TaskEntry = {
                  id: generateId(),
                  title: formData.title,
                  description: formData.description,
                  category: formData.category,
                  date: formData.date + 'T00:00:00.000Z',
                  isDone: false,
                  isRecurring: false,
                  recurringDays: [],
                  notes: formData.notes,
                  timeMinutes: formData.timeMinutes,
                  createdAt: now,
                  updatedAt: now,
                  completedAt: null,
                }
                await DatabaseService.add('tasks', task)
                setTasks(prev => [...prev, task])
              }
              setShowTaskModal(false)
              setEditingTask(null)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to save task')
            } finally {
              setSaving(false)
            }
          }}
          saving={saving}
          onCancel={() => { setShowTaskModal(false); setEditingTask(null) }}
        />
      </Modal>

      <Modal open={showNotesModal} onClose={() => { setShowNotesModal(false); setNotesTask(null) }} title="Task Notes" size="sm">
        <div className="space-y-4">
          {notesTask && (
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                {notesTask.category}
              </p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {notesTask.title}
              </p>
            </div>
          )}
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
            placeholder="Add your notes here..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowNotesModal(false); setNotesTask(null) }}>Cancel</Button>
            <Button onClick={saveNotes}>Save Notes</Button>
          </div>
        </div>
      </Modal>

      {generatedCount > 0 && (
        <div
          className="fixed bottom-6 right-6 rounded-lg px-4 py-3 shadow-lg"
          style={{
            backgroundColor: 'var(--color-success)',
            color: 'white',
          }}
        >
          <p className="text-sm font-medium">
            Generated {generatedCount} tasks!
          </p>
        </div>
      )}
    </div>
  )
}

function TaskForm({
  task,
  defaultDate,
  onSave,
  saving,
  onCancel,
}: {
  task: TaskEntry | null
  defaultDate: string
  onSave: (data: TaskFormData) => void
  saving: boolean
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(taskFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      category: (task?.category as TaskFormData['category']) ?? 'Vocabulary',
      date: task?.date.slice(0, 10) ?? defaultDate,
      timeMinutes: task?.timeMinutes ?? 30,
      notes: task?.notes ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <label htmlFor="planner-title" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Title <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <input
          id="planner-title"
          type="text"
          {...register('title')}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: errors.title ? 'var(--color-danger)' : 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          placeholder="e.g., Practice Reading Passage 1"
        />
        {errors.title && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>{errors.title.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="planner-desc" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Description
        </label>
        <textarea
          id="planner-desc"
          {...register('description')}
          rows={2}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          placeholder="Optional description"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="planner-category" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Category
          </label>
          <select
            id="planner-category"
            {...register('category')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="planner-date" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Date
          </label>
          <input
            id="planner-date"
            type="date"
            {...register('date')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: errors.date ? 'var(--color-danger)' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
          {errors.date && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>{errors.date.message}</p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="planner-time" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Estimated Time (minutes)
        </label>
        <input
          id="planner-time"
          type="number"
          {...register('timeMinutes')}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />
      </div>
      <div>
        <label htmlFor="planner-notes" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Notes
        </label>
        <textarea
          id="planner-notes"
          {...register('notes')}
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          placeholder="Add any notes or details"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving} disabled={!isValid}>
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
