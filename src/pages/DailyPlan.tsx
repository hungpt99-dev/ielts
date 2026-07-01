import { useState, useEffect, useCallback, useMemo } from 'react'
import type { TaskEntry, TaskCategory } from '../models'
import { getAll, add, put, remove } from '../lib/db'
import Card, { CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

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

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function isToday(dateStr: string): boolean {
  return dateStr === today()
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const next = new Date(d)
    next.setDate(next.getDate() + i)
    dates.push(next.toISOString().slice(0, 10))
  }
  return dates
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

interface TaskFormData {
  title: string
  description: string
  category: TaskCategory
  date: string
  timeMinutes: number
  isRecurring: boolean
  recurringDays: number[]
  notes: string
}

const emptyForm: TaskFormData = {
  title: '',
  description: '',
  category: 'Vocabulary',
  date: today(),
  timeMinutes: 30,
  isRecurring: false,
  recurringDays: [],
  notes: '',
}

export default function DailyPlan() {
  const [tasks, setTasks] = useState<TaskEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(today())
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | ''>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'undone'>('all')
  const [sortBy, setSortBy] = useState<'time' | 'category' | 'title'>('time')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskEntry | null>(null)
  const [form, setForm] = useState<TaskFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [notesTask, setNotesTask] = useState<TaskEntry | null>(null)
  const [notesText, setNotesText] = useState('')

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await getAll<TaskEntry>('tasks')
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

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate])
  const visibleDates = viewMode === 'day' ? [selectedDate] : weekDates

  const visibleTasks = useMemo(() => {
    let filtered = tasks.filter(t => visibleDates.includes(t.date.slice(0, 10)))
    if (categoryFilter) {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }
    if (statusFilter === 'done') {
      filtered = filtered.filter(t => t.isDone)
    } else if (statusFilter === 'undone') {
      filtered = filtered.filter(t => !t.isDone)
    }
    filtered.sort((a, b) => {
      if (sortBy === 'time') return (b.timeMinutes || 0) - (a.timeMinutes || 0)
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return a.title.localeCompare(b.title)
    })
    return filtered
  }, [tasks, visibleDates, categoryFilter, statusFilter, sortBy])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TaskEntry[]> = {}
    for (const t of visibleTasks) {
      const key = t.date.slice(0, 10)
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    return groups
  }, [visibleTasks])

  const doneCount = visibleTasks.filter(t => t.isDone).length
  const totalCount = visibleTasks.length
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  function handleToggleDone(task: TaskEntry) {
    const updated: TaskEntry = {
      ...task,
      isDone: !task.isDone,
      completedAt: !task.isDone ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    }
    put('tasks', updated)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  function handleDelete(id: string) {
    remove('tasks', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function openCreateForm() {
    setEditingTask(null)
    setForm({ ...emptyForm, date: selectedDate })
    setModalOpen(true)
  }

  function openEditForm(task: TaskEntry) {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description,
      category: task.category,
      date: task.date.slice(0, 10),
      timeMinutes: task.timeMinutes,
      isRecurring: task.isRecurring,
      recurringDays: task.recurringDays,
      notes: task.notes,
    })
    setModalOpen(true)
  }

  function openNotes(task: TaskEntry) {
    setNotesTask(task)
    setNotesText(task.notes)
    setNotesModalOpen(true)
  }

  function saveNotes() {
    if (!notesTask) return
    const updated: TaskEntry = {
      ...notesTask,
      notes: notesText,
      updatedAt: new Date().toISOString(),
    }
    put('tasks', updated)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setNotesModalOpen(false)
    setNotesTask(null)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (editingTask) {
        const updated: TaskEntry = {
          ...editingTask,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          date: form.date + 'T00:00:00.000Z',
          timeMinutes: form.timeMinutes,
          isRecurring: form.isRecurring,
          recurringDays: form.recurringDays,
          notes: form.notes,
          updatedAt: now,
        }
        await put('tasks', updated)
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
      } else {
        const task: TaskEntry = {
          id: generateId(),
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          date: form.date + 'T00:00:00.000Z',
          isDone: false,
          isRecurring: form.isRecurring,
          recurringDays: form.recurringDays,
          notes: form.notes,
          timeMinutes: form.timeMinutes,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        }
        await add('tasks', task)
        setTasks(prev => [...prev, task])

        if (form.isRecurring && form.recurringDays.length > 0) {
          for (let i = 1; i <= 7; i++) {
            const nextDate = addDays(form.date, i)
            const nextDay = new Date(nextDate + 'T00:00:00').getDay()
            const adjustedDay = nextDay === 0 ? 6 : nextDay - 1
            if (form.recurringDays.includes(adjustedDay)) {
              const recurringTask: TaskEntry = {
                ...task,
                id: generateId(),
                date: nextDate + 'T00:00:00.000Z',
                createdAt: now,
                updatedAt: now,
              }
              await add('tasks', recurringTask)
              setTasks(prev => [...prev, recurringTask])
            }
          }
        }
      }
      setModalOpen(false)
      setEditingTask(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingTask(null)
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Daily Study Plan
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Plan and track your daily IELTS study tasks
          </p>
        </div>
        <Button onClick={openCreateForm} size="lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))} aria-label="Previous day">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-600">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'day'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                  } ${viewMode === 'day' ? 'rounded-l-lg' : 'rounded-l-lg'}`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                  } rounded-r-lg`}
                >
                  Week
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))} aria-label="Next day">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {!isToday(selectedDate) && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today())}>
                  Today
                </Button>
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {formatDateLabel(selectedDate)}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-400"
                aria-label="Select date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {viewMode === 'day' ? 'Today\'s Tasks' : 'Week\'s Tasks'}
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalCount}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {doneCount} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completion
            </p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {progressPercent}%
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Estimated Study Time
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {visibleTasks.reduce((s, t) => s + (t.timeMinutes || 0), 0)}
              <span className="ml-1 text-sm font-normal text-slate-400">min</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Categories
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {new Set(visibleTasks.map(t => t.category)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="category-filter" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | '')}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'done' | 'undone')}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All</option>
                <option value="undone">Undone</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-by" className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Sort
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'time' | 'category' | 'title')}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="time">Time (high first)</option>
                <option value="category">Category</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {visibleTasks.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {viewMode === 'day'
                  ? 'No tasks planned for this day.'
                  : 'No tasks planned for this week.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Add a task to get started with your IELTS study plan.
              </p>
              <Button className="mt-4" size="sm" onClick={openCreateForm}>
                Add Your First Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {Object.entries(groupedByDate).map(([date, dateTasks]) => (
            <div key={date}>
              {viewMode === 'week' && (
                <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {formatDateLabel(date)}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {dateTasks.filter(t => t.isDone).length}/{dateTasks.length} done
                  </span>
                </h2>
              )}
              <div className="space-y-2">
                {dateTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      task.isDone
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleDone(task)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        task.isDone
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'
                      }`}
                      aria-label={task.isDone ? 'Mark as undone' : 'Mark as done'}
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
                        {task.isRecurring && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Recurring
                          </span>
                        )}
                      </div>
                      <h3 className={`mt-1 text-sm font-medium ${
                        task.isDone
                          ? 'text-slate-400 line-through dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                        {task.timeMinutes > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {task.timeMinutes}m
                          </span>
                        )}
                        {task.notes && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Has notes
                          </span>
                        )}
                        {task.completedAt && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openNotes(task)}
                        aria-label="Edit notes"
                        className="p-1.5"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(task)}
                        aria-label="Edit task"
                        className="p-1.5"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                        aria-label="Delete task"
                        className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingTask ? 'Edit Task' : 'Add Task'} size="lg">
        <div className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="e.g., Practice Reading Passage 1"
              required
            />
          </div>
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="task-description"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Optional description"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                id="task-category"
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as TaskCategory }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </label>
              <input
                id="task-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="task-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Estimated Time (minutes)
            </label>
            <input
              id="task-time"
              type="number"
              min="0"
              max="480"
              value={form.timeMinutes}
              onChange={(e) => setForm(prev => ({ ...prev, timeMinutes: Math.max(0, parseInt(e.target.value) || 0) }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="task-recurring"
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm(prev => ({ ...prev, isRecurring: e.target.checked, recurringDays: e.target.checked ? prev.recurringDays : [] }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
            />
            <label htmlFor="task-recurring" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Recurring task
            </label>
          </div>
          {form.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Repeat on
              </label>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((name, index) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        recurringDays: prev.recurringDays.includes(index)
                          ? prev.recurringDays.filter(d => d !== index)
                          : [...prev.recurringDays, index].sort(),
                      }))
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.recurringDays.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label htmlFor="task-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              id="task-notes"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Add any notes or details about this task"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={notesModalOpen} onClose={() => setNotesModalOpen(false)} title="Task Notes" size="sm">
        <div className="space-y-4">
          {notesTask && (
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {notesTask.category}
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {notesTask.title}
              </p>
            </div>
          )}
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            placeholder="Add your notes here..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setNotesModalOpen(false)}>Cancel</Button>
            <Button onClick={saveNotes}>Save Notes</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
