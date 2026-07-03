import { useState, useEffect, useCallback, useMemo } from 'react'
import type { WritingPrompt, WritingTaskType, LearningStatus } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { useAutosave } from '../../hooks/useAutosave'
import { generateId } from '../../utils'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const

const TASK_TYPES: { value: WritingTaskType; label: string }[] = [
  { value: 'task1', label: 'Task 1' },
  { value: 'task2', label: 'Task 2' },
]

const STATUS_OPTIONS: { value: LearningStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'learning', label: 'Learning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'mastered', label: 'Mastered', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { value: 'needs-review', label: 'Needs Review', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function parseList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
}

interface PromptFormData {
  taskType: WritingTaskType
  question: string
  topic: string
  instructions: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string
  notes: string
}

const emptyForm: PromptFormData = {
  taskType: 'task2',
  question: '',
  topic: 'Education',
  instructions: '',
  difficulty: 'medium',
  tags: '',
  notes: '',
}

export default function WritingPromptsPage() {
  const { showToast } = useToast()

  const [entries, setEntries] = useState<WritingPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState<WritingTaskType | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<LearningStatus | ''>('')
  const [tagFilter, setTagFilter] = useState('')
  const [view, setView] = useState<'all' | 'favorites' | 'done'>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WritingPrompt | null>(null)
  const [form, setForm] = useState<PromptFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<WritingPrompt>('writingPrompts')
      setEntries(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load writing prompts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const e of entries) {
      for (const t of e.tags) tags.add(t)
    }
    return Array.from(tags).sort()
  }, [entries])

  const favorites = useMemo(() => entries.filter(e => e.isFavorite), [entries])
  const doneEntries = useMemo(() => entries.filter(e => e.isDone), [entries])

  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (view === 'favorites') {
      filtered = filtered.filter(e => e.isFavorite)
    } else if (view === 'done') {
      filtered = filtered.filter(e => e.isDone)
    }

    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.question.toLowerCase().includes(query) ||
          e.topic.toLowerCase().includes(query) ||
          e.instructions.toLowerCase().includes(query) ||
          e.notes.toLowerCase().includes(query)
      )
    }

    if (topicFilter) {
      filtered = filtered.filter(e => e.topic === topicFilter)
    }

    if (taskTypeFilter) {
      filtered = filtered.filter(e => e.taskType === taskTypeFilter)
    }

    if (difficultyFilter) {
      filtered = filtered.filter(e => e.difficulty === difficultyFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    if (tagFilter) {
      filtered = filtered.filter(e => e.tags.includes(tagFilter))
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [entries, search, topicFilter, taskTypeFilter, difficultyFilter, statusFilter, tagFilter, view])

  const stats = useMemo(() => {
    const total = entries.length
    const newCount = entries.filter(e => e.status === 'new').length
    const mastering = entries.filter(e => e.status === 'mastered').length
    const hard = entries.filter(e => e.difficulty === 'hard').length
    const done = entries.filter(e => e.isDone).length
    return { total, newCount, mastering, hard, done }
  }, [entries])

  function validateForm(data: PromptFormData): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!data.question.trim()) errors.question = 'Question is required'
    if (!data.instructions.trim()) errors.instructions = 'Instructions are required'
    return errors
  }

  function openCreateForm() {
    setEditingEntry(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEditForm(entry: WritingPrompt) {
    setEditingEntry(entry)
    setForm({
      taskType: entry.taskType,
      question: entry.question,
      topic: entry.topic,
      instructions: entry.instructions,
      difficulty: entry.difficulty,
      tags: entry.tags.join(', '),
      notes: entry.notes,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  async function handleSave() {
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const entry: WritingPrompt = {
        id: editingEntry?.id ?? generateId(),
        taskType: form.taskType,
        question: form.question.trim(),
        topic: form.topic,
        instructions: form.instructions.trim(),
        tags: parseList(form.tags),
        difficulty: form.difficulty,
        isFavorite: editingEntry?.isFavorite ?? false,
        status: editingEntry?.status ?? 'new',
        isDone: editingEntry?.isDone ?? false,
        notes: form.notes.trim(),
        createdAt: editingEntry?.createdAt ?? now,
        updatedAt: now,
      }

      const table = 'writingPrompts' as const
      if (editingEntry) {
        await DatabaseService.put(table, entry)
        setEntries(prev => prev.map(e => e.id === entry.id ? entry : e))
        showToast('success', 'Writing prompt updated')
      } else {
        await DatabaseService.add(table, entry)
        setEntries(prev => [...prev, entry])
        showToast('success', 'Writing prompt added')
      }

      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save writing prompt')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await DatabaseService.remove('writingPrompts', id)
      setEntries(prev => prev.filter(e => e.id !== id))
      showToast('info', 'Writing prompt deleted')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingEntry(null)
    setFormErrors({})
  }

  async function handleStatusChange(entry: WritingPrompt, status: LearningStatus) {
    const updated: WritingPrompt = { ...entry, status, updatedAt: new Date().toISOString() }
    await DatabaseService.put('writingPrompts', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    showToast('success', `Status changed to ${status}`)
  }

  async function toggleFavorite(entry: WritingPrompt) {
    const updated: WritingPrompt = { ...entry, isFavorite: !entry.isFavorite, updatedAt: new Date().toISOString() }
    await DatabaseService.put('writingPrompts', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function toggleDone(entry: WritingPrompt) {
    const updated: WritingPrompt = { ...entry, isDone: !entry.isDone, updatedAt: new Date().toISOString() }
    await DatabaseService.put('writingPrompts', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const autosaveNotes = useCallback(async (notes: string) => {
    if (!editingEntry) return
    const updated: WritingPrompt = { ...editingEntry, notes, updatedAt: new Date().toISOString() }
    await DatabaseService.put('writingPrompts', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingEntry(updated)
    showToast('info', 'Notes autosaved')
  }, [editingEntry, showToast])

  const autosaveInstructions = useCallback(async (instructions: string) => {
    if (!editingEntry) return
    const updated: WritingPrompt = { ...editingEntry, instructions, updatedAt: new Date().toISOString() }
    await DatabaseService.put('writingPrompts', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingEntry(updated)
  }, [editingEntry, showToast])

  useAutosave(form.notes, autosaveNotes)
  useAutosave(form.instructions, autosaveInstructions)

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
            <Button variant="secondary" className="mt-4" onClick={loadEntries}>Retry</Button>
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
            Writing Prompts
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Collect and manage IELTS Writing Task 1 & Task 2 prompts
          </p>
        </div>
        <Button onClick={openCreateForm} size="lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Prompt
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">New</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.newCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Mastered</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.mastering}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Done</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.done}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Hard</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.hard}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
        {[
          { key: 'all' as const, label: 'All Prompts', count: entries.length },
          { key: 'favorites' as const, label: 'Favorites', count: favorites.length },
          { key: 'done' as const, label: 'Done', count: doneEntries.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setView(t.key); setStatusFilter(''); setDifficultyFilter(''); setTopicFilter(''); setTagFilter(''); setSearch(''); setTaskTypeFilter('') }}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              view === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${
              view === t.key
                ? 'bg-white/20'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="prompt-search" className="sr-only">Search</label>
              <input
                id="prompt-search"
                type="text"
                placeholder="Search prompts, topics, instructions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
            <select
              value={taskTypeFilter}
              onChange={e => setTaskTypeFilter(e.target.value as WritingTaskType | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by task type"
            >
              <option value="">All Tasks</option>
              {TASK_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={topicFilter}
              onChange={e => setTopicFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by topic"
            >
              <option value="">All Topics</option>
              {IELTS_TOPICS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by difficulty"
            >
              <option value="">All Difficulty</option>
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as LearningStatus | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {allTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Filter by tag"
              >
                <option value="">All Tags</option>
                {allTags.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            {(search || topicFilter || statusFilter || difficultyFilter || tagFilter || taskTypeFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setTopicFilter('')
                  setStatusFilter('')
                  setDifficultyFilter('')
                  setTagFilter('')
                  setTaskTypeFilter('')
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
          title={entries.length === 0 ? 'No writing prompts yet.' : 'No prompts match your filters.'}
          description={entries.length === 0 ? 'Add your first writing prompt to start practicing.' : 'Try adjusting your search or filters.'}
          action={entries.length === 0 ? { label: 'Add Your First Prompt', onClick: openCreateForm } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {TASK_TYPES.find(t => t.value === entry.taskType)?.label}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[entry.difficulty]}`}>
                      {entry.difficulty}
                    </span>
                    {entry.status && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_OPTIONS.find(s => s.value === entry.status)?.color}`}>
                        {STATUS_OPTIONS.find(s => s.value === entry.status)?.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {entry.question}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {entry.instructions}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      {entry.topic}
                    </span>
                    {entry.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                    <span>{formatDate(entry.updatedAt)}</span>
                    {entry.notes && <span>Has notes</span>}
                    {entry.isDone && <span className="text-green-500">✓ Done</span>}
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-1">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => toggleFavorite(entry)}
                      className={`rounded p-1 transition-colors hover:scale-110 ${
                        entry.isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'
                      }`}
                      aria-label={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg className="h-4 w-4" fill={entry.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleDone(entry)}
                      className={`rounded p-1 transition-colors hover:scale-110 ${
                        entry.isDone ? 'text-green-500' : 'text-slate-400 hover:text-green-500'
                      }`}
                      aria-label={entry.isDone ? 'Mark as not done' : 'Mark as done'}
                      title={entry.isDone ? 'Mark as not done' : 'Mark as done'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusChange(entry, s.value)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          entry.status === s.value
                            ? s.color
                            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                        aria-label={`Mark as ${s.label}`}
                      >
                        {s.label === 'needs-review' ? 'Review' : s.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(entry)}
                      aria-label="Edit prompt"
                      className="p-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Delete prompt"
                      className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingEntry ? 'Edit Writing Prompt' : 'Add Writing Prompt'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prompt-tasktype" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                id="prompt-tasktype"
                value={form.taskType}
                onChange={e => setForm(prev => ({ ...prev, taskType: e.target.value as WritingTaskType }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {TASK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prompt-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                IELTS Topic
              </label>
              <select
                id="prompt-topic"
                value={form.topic}
                onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {IELTS_TOPICS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="prompt-difficulty" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Difficulty
              </label>
              <select
                id="prompt-difficulty"
                value={form.difficulty}
                onChange={e => setForm(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prompt-tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tags (comma-separated)
              </label>
              <input
                id="prompt-tags"
                type="text"
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="academic, chart, opinion"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prompt-question" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="prompt-question"
              value={form.question}
              onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
              rows={3}
              className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 ${formErrors.question ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'}`}
              placeholder="The chart below shows..."
            />
            {formErrors.question && <p className="mt-1 text-xs text-red-500">{formErrors.question}</p>}
          </div>

          <div>
            <label htmlFor="prompt-instructions" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Instructions <span className="text-red-500">*</span>
            </label>
            <textarea
              id="prompt-instructions"
              value={form.instructions}
              onChange={e => setForm(prev => ({ ...prev, instructions: e.target.value }))}
              rows={4}
              className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 ${formErrors.instructions ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'}`}
              placeholder="Summarize the information by selecting and reporting the main features..."
            />
            {formErrors.instructions && <p className="mt-1 text-xs text-red-500">{formErrors.instructions}</p>}
            {editingEntry && (
              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                Instructions are autosaved when editing
              </p>
            )}
          </div>

          <div>
            <label htmlFor="prompt-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes (autosaved)
            </label>
            <textarea
              id="prompt-notes"
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Your strategy notes, outline ideas, or tips for this prompt..."
            />
            {editingEntry && (
              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                Notes are automatically saved as you type
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.question.trim() || !form.instructions.trim()}>
              {editingEntry ? 'Save Changes' : 'Add Prompt'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
