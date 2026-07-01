import { useState, useEffect, useCallback, useMemo } from 'react'
import type { WritingSession, WritingTaskType } from '../models'
import { getAll, add, put, remove } from '../lib/db'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const TASK_TYPES: { value: WritingTaskType; label: string }[] = [
  { value: 'task1', label: 'Task 1' },
  { value: 'task2', label: 'Task 2' },
]

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getBandColor(band: number): string {
  if (band >= 7) return 'text-green-600 dark:text-green-400'
  if (band >= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

interface SessionFormData {
  taskType: WritingTaskType
  question: string
  essay: string
  topic: string
  wordCount: number
  timeSpentMinutes: number
  estimatedBand: number
  feedback: string
  grammarMistakes: string
  vocabularyMistakes: string
  coherenceNotes: string
  improvedSentences: string
  betterVersion: string
  personalReflection: string
}

const emptyForm: SessionFormData = {
  taskType: 'task2',
  question: '',
  essay: '',
  topic: '',
  wordCount: 0,
  timeSpentMinutes: 0,
  estimatedBand: 5,
  feedback: '',
  grammarMistakes: '',
  vocabularyMistakes: '',
  coherenceNotes: '',
  improvedSentences: '',
  betterVersion: '',
  personalReflection: '',
}

export default function WritingPractice() {
  const [sessions, setSessions] = useState<WritingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [taskTypeFilter, setTaskTypeFilter] = useState<WritingTaskType | ''>('')
  const [sortBy, setSortBy] = useState<'date' | 'band' | 'wordCount'>('date')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<WritingSession | null>(null)
  const [form, setForm] = useState<SessionFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailSession, setDetailSession] = useState<WritingSession | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareSession, setCompareSession] = useState<WritingSession | null>(null)
  const [showMistakes, setShowMistakes] = useState(false)

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await getAll<WritingSession>('writingSessions')
      setSessions(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load writing sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const filteredSessions = useMemo(() => {
    let filtered = [...sessions]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.question.toLowerCase().includes(q) ||
        s.essay.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q) ||
        s.feedback.toLowerCase().includes(q) ||
        s.grammarMistakes.toLowerCase().includes(q)
      )
    }
    if (topicFilter) {
      filtered = filtered.filter(s => s.topic === topicFilter)
    }
    if (taskTypeFilter) {
      filtered = filtered.filter(s => s.taskType === taskTypeFilter)
    }
    filtered.sort((a, b) => {
      if (sortBy === 'band') return b.estimatedBand - a.estimatedBand
      if (sortBy === 'wordCount') return b.wordCount - a.wordCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return filtered
  }, [sessions, search, topicFilter, taskTypeFilter, sortBy])

  const stats = useMemo(() => {
    const total = sessions.length
    if (total === 0) {
      return { totalSessions: 0, avgBand: 0, totalTime: 0, totalWords: 0 }
    }
    const totalTime = sessions.reduce((s, se) => s + se.timeSpentMinutes, 0)
    const totalWords = sessions.reduce((s, se) => s + se.wordCount, 0)
    const avgBand = Math.round((sessions.reduce((s, se) => s + se.estimatedBand, 0) / total) * 10) / 10
    return { totalSessions: total, avgBand, totalTime, totalWords }
  }, [sessions])

  const bandChart = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return sorted.slice(-10).map(s => ({
      date: formatDate(s.createdAt),
      band: s.estimatedBand,
      type: s.taskType,
      words: s.wordCount,
    }))
  }, [sessions])

  const commonMistakes = useMemo(() => {
    const grammar: Record<string, number> = {}
    const vocabulary: Record<string, number> = {}
    sessions.forEach(s => {
      s.grammarMistakes.split(',').map(m => m.trim()).filter(Boolean).forEach(m => {
        grammar[m] = (grammar[m] || 0) + 1
      })
      s.vocabularyMistakes.split(',').map(m => m.trim()).filter(Boolean).forEach(m => {
        vocabulary[m] = (vocabulary[m] || 0) + 1
      })
    })
    const topGrammar = Object.entries(grammar)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    const topVocab = Object.entries(vocabulary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    return { grammar: topGrammar, vocabulary: topVocab }
  }, [sessions])

  function openCreateForm() {
    setEditingSession(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditForm(session: WritingSession) {
    setEditingSession(session)
    setForm({
      taskType: session.taskType,
      question: session.question,
      essay: session.essay,
      topic: session.topic,
      wordCount: session.wordCount,
      timeSpentMinutes: session.timeSpentMinutes,
      estimatedBand: session.estimatedBand,
      feedback: session.feedback,
      grammarMistakes: session.grammarMistakes,
      vocabularyMistakes: session.vocabularyMistakes,
      coherenceNotes: session.coherenceNotes,
      improvedSentences: session.improvedSentences,
      betterVersion: session.betterVersion,
      personalReflection: session.personalReflection,
    })
    setModalOpen(true)
  }

  function openCompare(session: WritingSession) {
    setCompareSession(session)
    setCompareOpen(true)
  }

  function handleDelete(id: string) {
    remove('writingSessions', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  async function handleSave() {
    if (!form.question.trim() || !form.essay.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const wordCount = form.essay.trim() ? form.essay.trim().split(/\s+/).length : 0

      if (editingSession) {
        const updated: WritingSession = {
          ...editingSession,
          taskType: form.taskType,
          question: form.question.trim(),
          essay: form.essay.trim(),
          topic: form.topic,
          wordCount,
          timeSpentMinutes: form.timeSpentMinutes || 0,
          estimatedBand: form.estimatedBand || 5,
          feedback: form.feedback,
          grammarMistakes: form.grammarMistakes,
          vocabularyMistakes: form.vocabularyMistakes,
          coherenceNotes: form.coherenceNotes,
          improvedSentences: form.improvedSentences,
          betterVersion: form.betterVersion,
          personalReflection: form.personalReflection,
        }
        await put('writingSessions', updated)
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const session: WritingSession = {
          id: generateId(),
          taskType: form.taskType,
          question: form.question.trim(),
          essay: form.essay.trim(),
          topic: form.topic,
          wordCount,
          timeSpentMinutes: form.timeSpentMinutes || 0,
          estimatedBand: form.estimatedBand || 5,
          feedback: form.feedback,
          grammarMistakes: form.grammarMistakes,
          vocabularyMistakes: form.vocabularyMistakes,
          coherenceNotes: form.coherenceNotes,
          improvedSentences: form.improvedSentences,
          betterVersion: form.betterVersion,
          personalReflection: form.personalReflection,
          createdAt: now,
        }
        await add('writingSessions', session)
        setSessions(prev => [...prev, session])
      }
      setModalOpen(false)
      setEditingSession(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save writing session')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingSession(null)
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
            <Button variant="secondary" className="mt-4" onClick={loadSessions}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Writing Practice
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track IELTS Writing Task 1 and Task 2 practice, review feedback, and compare versions
          </p>
        </div>
        <Button onClick={openCreateForm} size="lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Entry
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Essays
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalSessions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Band
            </p>
            <p className={`mt-1 text-2xl font-bold ${getBandColor(stats.avgBand)}`}>
              {stats.avgBand}
              <span className="ml-1 text-sm font-normal text-slate-400">/9</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Writing Time
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatTime(stats.totalTime)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Words Written
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.totalWords.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Band trend + Common mistakes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Band trend */}
        {bandChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Band Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1.5" style={{ height: 100 }}>
                {bandChart.map((point, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      {point.band}
                    </span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(point.band * 11, 2)}%`,
                        backgroundColor: point.type === 'task1' ? '#818cf8' : '#34d399',
                      }}
                    />
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-center">
                      {point.date}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-indigo-400" />
                  Task 1
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" />
                  Task 2
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Common mistakes */}
        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Common Mistakes</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMistakes(!showMistakes)}
                  className="text-xs"
                >
                  {showMistakes ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showMistakes && (
              <CardContent>
                <div className="space-y-3">
                  {commonMistakes.grammar.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Grammar
                      </p>
                      <div className="space-y-1">
                        {commonMistakes.grammar.map(([mistake, count], i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 dark:text-slate-300">{mistake}</span>
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400">
                              {count}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {commonMistakes.vocabulary.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Vocabulary
                      </p>
                      <div className="space-y-1">
                        {commonMistakes.vocabulary.map(([mistake, count], i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700 dark:text-slate-300">{mistake}</span>
                            <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
                              {count}x
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {commonMistakes.grammar.length === 0 && commonMistakes.vocabulary.length === 0 && (
                    <p className="text-sm text-slate-400 dark:text-slate-500">No common mistakes tracked yet.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search essays..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                aria-label="Search writing sessions"
              />
            </div>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by topic"
            >
              <option value="">All Topics</option>
              {TOPICS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={taskTypeFilter}
              onChange={(e) => setTaskTypeFilter(e.target.value as WritingTaskType | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by task type"
            >
              <option value="">All Tasks</option>
              {TASK_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'band' | 'wordCount')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Sort by"
            >
              <option value="date">Newest First</option>
              <option value="band">Highest Band</option>
              <option value="wordCount">Most Words</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {sessions.length === 0
                  ? 'No writing practice entries yet.'
                  : 'No entries match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {sessions.length === 0
                  ? 'Add your first Writing practice to start tracking progress.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {sessions.length === 0 && (
                <Button className="mt-4" size="sm" onClick={openCreateForm}>
                  Add Your First Essay
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => {
            const bandColor = getBandColor(session.estimatedBand)
            return (
              <div
                key={session.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        session.taskType === 'task1'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>
                        {session.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                      </span>
                      {session.topic && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {session.topic}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setDetailSession(session)}
                      className="mt-1 text-left"
                    >
                      <h3 className="text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                        {session.question.length > 80
                          ? session.question.slice(0, 80) + '...'
                          : session.question}
                      </h3>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(session.createdAt)}</span>
                      <span>{session.wordCount} words</span>
                      <span>{formatTime(session.timeSpentMinutes)}</span>
                      <span className={`font-medium ${bandColor}`}>
                        Band {session.estimatedBand}
                      </span>
                    </div>
                    {session.feedback && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {session.feedback}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {session.betterVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCompare(session)}
                        aria-label="Compare versions"
                        className="p-1.5 text-blue-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                        </svg>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailSession(session)}
                      aria-label="View details"
                      className="p-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(session)}
                      aria-label="Edit session"
                      className="p-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                      aria-label="Delete session"
                      className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detailSession} onClose={() => setDetailSession(null)} title={detailSession?.question ?? ''} size="lg">
        {detailSession && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Task Type
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">
                  {detailSession.taskType === 'task1' ? 'Task 1' : 'Task 2'}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Topic
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{detailSession.topic || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDate(detailSession.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Time Spent
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatTime(detailSession.timeSpentMinutes)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Word Count
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{detailSession.wordCount}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estimated Band
                </span>
                <p className={`mt-0.5 font-semibold ${getBandColor(detailSession.estimatedBand)}`}>
                  {detailSession.estimatedBand}/9
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Question
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {detailSession.question}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Essay
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {detailSession.essay}
              </p>
            </div>
            {detailSession.betterVersion && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Improved Version
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed">
                  {detailSession.betterVersion}
                </p>
              </div>
            )}
            {detailSession.feedback && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Feedback
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.feedback}
                </p>
              </div>
            )}
            {detailSession.grammarMistakes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Grammar Mistakes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-red-600 dark:text-red-400">
                  {detailSession.grammarMistakes}
                </p>
              </div>
            )}
            {detailSession.vocabularyMistakes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vocabulary Mistakes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-purple-600 dark:text-purple-400">
                  {detailSession.vocabularyMistakes}
                </p>
              </div>
            )}
            {detailSession.coherenceNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Coherence Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.coherenceNotes}
                </p>
              </div>
            )}
            {detailSession.improvedSentences && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Improved Sentences
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.improvedSentences}
                </p>
              </div>
            )}
            {detailSession.personalReflection && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Personal Reflection
                </span>
                <p className="mt-0.5 whitespace-pre-wrap italic text-slate-600 dark:text-slate-400">
                  {detailSession.personalReflection}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              {detailSession.betterVersion && (
                <Button variant="outline" onClick={() => { setDetailSession(null); openCompare(detailSession) }}>
                  Compare Versions
                </Button>
              )}
              <Button variant="outline" onClick={() => { setDetailSession(null); openEditForm(detailSession) }}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDetailSession(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Version comparison modal */}
      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Version Comparison" size="lg">
        {compareSession && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="mb-4 grid gap-1 text-sm">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Question</span>
                <p className="mt-0.5 text-slate-700 dark:text-slate-300">{compareSession.question}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estimated Band: <span className={getBandColor(compareSession.estimatedBand)}>{compareSession.estimatedBand}/9</span>
                </span>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Original
                </h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {compareSession.essay}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span>{compareSession.wordCount} words</span>
                  <span>{formatTime(compareSession.timeSpentMinutes)}</span>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Improved
                </h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-800 dark:text-emerald-200">
                  {compareSession.betterVersion}
                </p>
                {compareSession.improvedSentences && (
                  <div className="mt-3 border-t border-emerald-200 pt-3 dark:border-emerald-800">
                    <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Key Improvements
                    </span>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-emerald-700 dark:text-emerald-300">
                      {compareSession.improvedSentences}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCompareOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} title={editingSession ? 'Edit Writing Entry' : 'New Writing Entry'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="essay-tasktype" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                id="essay-tasktype"
                value={form.taskType}
                onChange={(e) => setForm(prev => ({ ...prev, taskType: e.target.value as WritingTaskType }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {TASK_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="essay-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                IELTS Topic
              </label>
              <select
                id="essay-topic"
                value={form.topic}
                onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">Select topic</option>
                {TOPICS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="essay-question" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="essay-question"
              value={form.question}
              onChange={(e) => setForm(prev => ({ ...prev, question: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Paste the essay question or prompt..."
              required
            />
          </div>
          <div>
            <label htmlFor="essay-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Your Essay <span className="text-red-500">*</span>
            </label>
            <textarea
              id="essay-content"
              value={form.essay}
              onChange={(e) => setForm(prev => ({ ...prev, essay: e.target.value }))}
              rows={10}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 font-mono"
              placeholder="Write your essay here..."
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              {form.essay.trim() ? `${form.essay.trim().split(/\s+/).length} words` : 'Word count shown when you type'}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="essay-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Time Spent (min)
              </label>
              <input
                id="essay-time"
                type="number"
                min="0"
                max="180"
                value={form.timeSpentMinutes}
                onChange={(e) => setForm(prev => ({ ...prev, timeSpentMinutes: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="essay-band" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Estimated Band (1-9)
              </label>
              <input
                id="essay-band"
                type="number"
                min="1"
                max="9"
                step="0.5"
                value={form.estimatedBand}
                onChange={(e) => setForm(prev => ({ ...prev, estimatedBand: Math.max(1, Math.min(9, parseFloat(e.target.value) || 5)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="essay-feedback" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Feedback
            </label>
            <textarea
              id="essay-feedback"
              value={form.feedback}
              onChange={(e) => setForm(prev => ({ ...prev, feedback: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Overall feedback on this essay..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="essay-grammar" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Grammar Mistakes (comma-separated)
              </label>
              <textarea
                id="essay-grammar"
                value={form.grammarMistakes}
                onChange={(e) => setForm(prev => ({ ...prev, grammarMistakes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="e.g., subject-verb agreement, article usage, tense"
              />
            </div>
            <div>
              <label htmlFor="essay-vocab" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Vocabulary Mistakes (comma-separated)
              </label>
              <textarea
                id="essay-vocab"
                value={form.vocabularyMistakes}
                onChange={(e) => setForm(prev => ({ ...prev, vocabularyMistakes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="e.g., word choice, collocation, formality"
              />
            </div>
          </div>
          <div>
            <label htmlFor="essay-coherence" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Coherence & Cohesion Notes
            </label>
            <textarea
              id="essay-coherence"
              value={form.coherenceNotes}
              onChange={(e) => setForm(prev => ({ ...prev, coherenceNotes: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Notes on paragraph structure, linking words, logical flow..."
            />
          </div>
          <div>
            <label htmlFor="essay-improved-sentences" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Improved Sentences
            </label>
            <textarea
              id="essay-improved-sentences"
              value={form.improvedSentences}
              onChange={(e) => setForm(prev => ({ ...prev, improvedSentences: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Rewrite specific sentences for improvement..."
            />
          </div>
          <div>
            <label htmlFor="essay-better-version" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Improved Version (full essay rewrite)
            </label>
            <textarea
              id="essay-better-version"
              value={form.betterVersion}
              onChange={(e) => setForm(prev => ({ ...prev, betterVersion: e.target.value }))}
              rows={8}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 font-mono"
              placeholder="Write an improved version of the essay here..."
            />
          </div>
          <div>
            <label htmlFor="essay-reflection" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Personal Reflection
            </label>
            <textarea
              id="essay-reflection"
              value={form.personalReflection}
              onChange={(e) => setForm(prev => ({ ...prev, personalReflection: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="What did you learn from this practice? What will you improve next time?"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.question.trim() || !form.essay.trim()}>
              {editingSession ? 'Save Changes' : 'Create Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
