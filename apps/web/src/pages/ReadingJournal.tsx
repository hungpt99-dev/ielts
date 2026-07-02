import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ReadingSession, QuestionType } from '../models'
import { generateId } from '../utils'
import { DatabaseService } from '../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const QUESTION_TYPES: QuestionType[] = [
  'True / False / Not Given',
  'Matching Headings',
  'Multiple Choice',
  'Sentence Completion',
  'Summary Completion',
  'Matching Information',
]

function computeAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

function computeReadingSpeed(text: string, minutes: number): number {
  if (!text || minutes <= 0) return 0
  const words = text.trim().split(/\s+/).length
  return Math.round(words / minutes)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

interface SessionFormData {
  title: string
  topic: string
  sourceUrl: string
  passageText: string
  questionType: QuestionType
  totalQuestions: number
  correctAnswers: number
  timeSpentMinutes: number
  newVocabulary: string
  summary: string
  mistakes: string
  notes: string
}

const emptyForm: SessionFormData = {
  title: '',
  topic: '',
  sourceUrl: '',
  passageText: '',
  questionType: 'True / False / Not Given',
  totalQuestions: 0,
  correctAnswers: 0,
  timeSpentMinutes: 0,
  newVocabulary: '',
  summary: '',
  mistakes: '',
  notes: '',
}

export default function ReadingJournal() {
  const [sessions, setSessions] = useState<ReadingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'accuracy' | 'speed'>('date')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<ReadingSession | null>(null)
  const [form, setForm] = useState<SessionFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailSession, setDetailSession] = useState<ReadingSession | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<ReadingSession>('readingSessions')
      setSessions(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reading sessions')
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
        s.title.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.mistakes.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q)
      )
    }
    if (topicFilter) {
      filtered = filtered.filter(s => s.topic === topicFilter)
    }
    if (typeFilter) {
      filtered = filtered.filter(s => s.questionType === typeFilter)
    }
    filtered.sort((a, b) => {
      if (sortBy === 'accuracy') return b.accuracy - a.accuracy
      if (sortBy === 'speed') {
        const speedA = computeReadingSpeed(a.passageText, a.timeSpentMinutes)
        const speedB = computeReadingSpeed(b.passageText, b.timeSpentMinutes)
        return speedB - speedA
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return filtered
  }, [sessions, search, topicFilter, typeFilter, sortBy])

  const stats = useMemo(() => {
    const total = sessions.length
    if (total === 0) {
      return { totalSessions: 0, avgAccuracy: 0, totalTime: 0, avgSpeed: 0 }
    }
    const totalAccuracy = sessions.reduce((s, se) => s + se.accuracy, 0)
    const totalTime = sessions.reduce((s, se) => s + se.timeSpentMinutes, 0)
    const totalSpeed = sessions.reduce((s, se) => s + computeReadingSpeed(se.passageText, se.timeSpentMinutes), 0)
    return {
      totalSessions: total,
      avgAccuracy: Math.round(totalAccuracy / total),
      totalTime,
      avgSpeed: Math.round(totalSpeed / total),
    }
  }, [sessions])

  const accuracyChart = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return sorted.slice(-10).map(s => ({
      date: formatDate(s.createdAt),
      accuracy: s.accuracy,
      speed: computeReadingSpeed(s.passageText, s.timeSpentMinutes),
    }))
  }, [sessions])

  function openCreateForm() {
    setEditingSession(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditForm(session: ReadingSession) {
    setEditingSession(session)
    setForm({
      title: session.title,
      topic: session.topic,
      sourceUrl: session.sourceUrl,
      passageText: session.passageText,
      questionType: session.questionType,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      timeSpentMinutes: session.timeSpentMinutes,
      newVocabulary: session.newVocabulary.join(', '),
      summary: session.summary,
      mistakes: session.mistakes,
      notes: session.notes,
    })
    setModalOpen(true)
  }

  function handleDelete(id: string) {
    DatabaseService.remove('readingSessions', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const questions = form.totalQuestions || 0
      const correct = form.correctAnswers || 0
      const accuracy = computeAccuracy(correct, questions)

      if (editingSession) {
        const updated: ReadingSession = {
          ...editingSession,
          title: form.title.trim(),
          topic: form.topic,
          sourceUrl: form.sourceUrl,
          passageText: form.passageText,
          questionType: form.questionType,
          totalQuestions: questions,
          correctAnswers: correct,
          accuracy,
          timeSpentMinutes: form.timeSpentMinutes || 0,
          newVocabulary: form.newVocabulary.split(',').map(v => v.trim()).filter(Boolean),
          summary: form.summary,
          mistakes: form.mistakes,
          notes: form.notes,
        }
        await DatabaseService.put('readingSessions', updated)
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const session: ReadingSession = {
          id: generateId(),
          title: form.title.trim(),
          topic: form.topic,
          sourceUrl: form.sourceUrl,
          passageText: form.passageText,
          questionType: form.questionType,
          totalQuestions: questions,
          correctAnswers: correct,
          accuracy,
          timeSpentMinutes: form.timeSpentMinutes || 0,
          newVocabulary: form.newVocabulary.split(',').map(v => v.trim()).filter(Boolean),
          summary: form.summary,
          mistakes: form.mistakes,
          notes: form.notes,
          createdAt: now,
        }
        await DatabaseService.add('readingSessions', session)
        setSessions(prev => [...prev, session])
      }
      setModalOpen(false)
      setEditingSession(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reading session')
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Reading Journal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your IELTS Reading practice sessions and monitor progress
          </p>
        </div>
        <Button onClick={openCreateForm} size="lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Session
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Sessions
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalSessions}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Accuracy
            </p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.avgAccuracy}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Time
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatTime(stats.totalTime)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Reading Speed
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.avgSpeed}
              <span className="ml-1 text-sm font-normal text-slate-400">wpm</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {accuracyChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reading Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Accuracy Over Time
                </p>
                <div className="flex items-end gap-1.5" style={{ height: 100 }}>
                  {accuracyChart.map((point, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {point.accuracy}%
                      </span>
                      <div
                        className="w-full rounded-t bg-green-400 transition-all"
                        style={{ height: `${Math.max(point.accuracy, 2)}%` }}
                      />
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-center">
                        {point.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Reading Speed Over Time (wpm)
                </p>
                <div className="flex items-end gap-1.5" style={{ height: 100 }}>
                  {accuracyChart.map((point, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {point.speed}
                      </span>
                      <div
                        className="w-full rounded-t bg-blue-400 transition-all"
                        style={{ height: `${Math.min(Math.max(point.speed, 2), 100)}%` }}
                      />
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-center">
                        {point.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                aria-label="Search reading sessions"
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by question type"
            >
              <option value="">All Types</option>
              {QUESTION_TYPES.map(qt => (
                <option key={qt} value={qt}>{qt}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'accuracy' | 'speed')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Sort by"
            >
              <option value="date">Newest First</option>
              <option value="accuracy">Highest Accuracy</option>
              <option value="speed">Fastest Speed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {sessions.length === 0
                  ? 'No reading sessions yet.'
                  : 'No sessions match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {sessions.length === 0
                  ? 'Add your first Reading practice session to start tracking progress.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {sessions.length === 0 && (
                <Button className="mt-4" size="sm" onClick={openCreateForm}>
                  Add Your First Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => {
            const speed = computeReadingSpeed(session.passageText, session.timeSpentMinutes)
            const accuracyColor = session.accuracy >= 80 ? 'text-green-600' : session.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'
            return (
              <div
                key={session.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {session.questionType}
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
                        {session.title}
                      </h3>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(session.createdAt)}</span>
                      <span>{session.timeSpentMinutes}m</span>
                      {speed > 0 && <span>{speed} wpm</span>}
                      <span className={`font-medium ${accuracyColor}`}>
                        {session.accuracy}% ({session.correctAnswers}/{session.totalQuestions})
                      </span>
                    </div>
                    {session.summary && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {session.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
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

      <Modal open={!!detailSession} onClose={() => setDetailSession(null)} title={detailSession?.title ?? ''} size="lg">
        {detailSession && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Question Type
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{detailSession.questionType}</p>
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
                  Accuracy
                </span>
                <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                  {detailSession.accuracy}% ({detailSession.correctAnswers}/{detailSession.totalQuestions})
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Reading Speed
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">
                  {computeReadingSpeed(detailSession.passageText, detailSession.timeSpentMinutes)} wpm
                </p>
              </div>
            </div>
            {detailSession.sourceUrl && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Source URL
                </span>
                <p className="mt-0.5 break-all text-blue-600 dark:text-blue-400">{detailSession.sourceUrl}</p>
              </div>
            )}
            {detailSession.passageText && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Passage
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.passageText}
                </p>
              </div>
            )}
            {detailSession.newVocabulary.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  New Vocabulary
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {detailSession.newVocabulary.map((w, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {detailSession.summary && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Summary
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{detailSession.summary}</p>
              </div>
            )}
            {detailSession.mistakes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Mistakes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-red-600 dark:text-red-400">{detailSession.mistakes}</p>
              </div>
            )}
            {detailSession.notes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{detailSession.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
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

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingSession ? 'Edit Reading Session' : 'New Reading Session'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label htmlFor="session-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="session-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="e.g., Cambridge IELTS 18 Test 1 Passage 1"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="session-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                IELTS Topic
              </label>
              <select
                id="session-topic"
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
            <div>
              <label htmlFor="session-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Question Type
              </label>
              <select
                id="session-type"
                value={form.questionType}
                onChange={(e) => setForm(prev => ({ ...prev, questionType: e.target.value as QuestionType }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {QUESTION_TYPES.map(qt => (
                  <option key={qt} value={qt}>{qt}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="session-source" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Source URL
            </label>
            <input
              id="session-source"
              type="url"
              value={form.sourceUrl}
              onChange={(e) => setForm(prev => ({ ...prev, sourceUrl: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label htmlFor="session-passage" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Passage Text
            </label>
            <textarea
              id="session-passage"
              value={form.passageText}
              onChange={(e) => setForm(prev => ({ ...prev, passageText: e.target.value }))}
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Paste the reading passage here..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="session-total" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Total Questions
              </label>
              <input
                id="session-total"
                type="number"
                min="0"
                value={form.totalQuestions}
                onChange={(e) => setForm(prev => ({ ...prev, totalQuestions: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="session-correct" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Correct Answers
              </label>
              <input
                id="session-correct"
                type="number"
                min="0"
                value={form.correctAnswers}
                onChange={(e) => setForm(prev => ({ ...prev, correctAnswers: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="session-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Time (minutes)
              </label>
              <input
                id="session-time"
                type="number"
                min="0"
                max="180"
                value={form.timeSpentMinutes}
                onChange={(e) => setForm(prev => ({ ...prev, timeSpentMinutes: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
          {form.totalQuestions > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accuracy: {computeAccuracy(form.correctAnswers, form.totalQuestions)}%
            </p>
          )}
          <div>
            <label htmlFor="session-vocab" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              New Vocabulary (comma-separated)
            </label>
            <input
              id="session-vocab"
              type="text"
              value={form.newVocabulary}
              onChange={(e) => setForm(prev => ({ ...prev, newVocabulary: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="e.g., biodiversity, ecosystem, conservation"
            />
          </div>
          <div>
            <label htmlFor="session-summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Summary
            </label>
            <textarea
              id="session-summary"
              value={form.summary}
              onChange={(e) => setForm(prev => ({ ...prev, summary: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Brief summary of the passage..."
            />
          </div>
          <div>
            <label htmlFor="session-mistakes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mistakes
            </label>
            <textarea
              id="session-mistakes"
              value={form.mistakes}
              onChange={(e) => setForm(prev => ({ ...prev, mistakes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="What went wrong? Which questions did you miss?"
            />
          </div>
          <div>
            <label htmlFor="session-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              id="session-notes"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
              {editingSession ? 'Save Changes' : 'Create Session'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
