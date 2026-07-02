import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ListeningSession } from '../models'
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

const LISTENING_SECTIONS = [1, 2, 3, 4] as const

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function computeAccuracy(score: number, maxScore: number): number {
  if (maxScore <= 0) return 0
  return Math.round((score / maxScore) * 100)
}

function getScoreColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-green-600 dark:text-green-400'
  if (accuracy >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getRatingLabel(rating: number): string {
  if (rating >= 9) return 'Excellent'
  if (rating >= 7) return 'Good'
  if (rating >= 5) return 'Average'
  if (rating >= 3) return 'Weak'
  return 'Poor'
}

function getRatingColor(rating: number): string {
  if (rating >= 7) return 'text-green-600 dark:text-green-400'
  if (rating >= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
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
  durationMinutes: number
  section: number
  score: number
  maxScore: number
  transcriptNotes: string
  newVocabulary: string
  difficultSentences: string
  mistakes: string
  shadowingNotes: string
  selfRating: number
}

const emptyForm: SessionFormData = {
  title: '',
  topic: '',
  sourceUrl: '',
  durationMinutes: 0,
  section: 1,
  score: 0,
  maxScore: 40,
  transcriptNotes: '',
  newVocabulary: '',
  difficultSentences: '',
  mistakes: '',
  shadowingNotes: '',
  selfRating: 5,
}

export default function ListeningJournal() {
  const [sessions, setSessions] = useState<ListeningSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [sectionFilter, setSectionFilter] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'rating'>('date')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<ListeningSession | null>(null)
  const [form, setForm] = useState<SessionFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailSession, setDetailSession] = useState<ListeningSession | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<ListeningSession>('listeningSessions')
      setSessions(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listening sessions')
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
        s.transcriptNotes.toLowerCase().includes(q) ||
        s.mistakes.toLowerCase().includes(q) ||
        s.difficultSentences.toLowerCase().includes(q)
      )
    }
    if (topicFilter) {
      filtered = filtered.filter(s => s.topic === topicFilter)
    }
    if (sectionFilter !== '') {
      filtered = filtered.filter(s => s.section === sectionFilter)
    }
    filtered.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score
      if (sortBy === 'rating') return b.selfRating - a.selfRating
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return filtered
  }, [sessions, search, topicFilter, sectionFilter, sortBy])

  const stats = useMemo(() => {
    const total = sessions.length
    if (total === 0) {
      return { totalSessions: 0, avgAccuracy: 0, totalTime: 0, avgRating: 0 }
    }
    const totalTime = sessions.reduce((s, se) => s + se.durationMinutes, 0)
    const totalRating = sessions.reduce((s, se) => s + se.selfRating, 0)
    const scoredSessions = sessions.filter(s => s.score > 0)
    const avgAccuracy = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((s, se) => s + computeAccuracy(se.score, 40), 0) / scoredSessions.length)
      : 0
    return {
      totalSessions: total,
      avgAccuracy,
      totalTime,
      avgRating: Math.round((totalRating / total) * 10) / 10,
    }
  }, [sessions])

  const scoreChart = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return sorted.slice(-10).map(s => ({
      date: formatDate(s.createdAt),
      score: s.score,
      accuracy: computeAccuracy(s.score, 40),
      rating: s.selfRating,
    }))
  }, [sessions])

  function openCreateForm() {
    setEditingSession(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditForm(session: ListeningSession) {
    setEditingSession(session)
    setForm({
      title: session.title,
      topic: session.topic,
      sourceUrl: session.sourceUrl,
      durationMinutes: session.durationMinutes,
      section: session.section,
      score: session.score,
      maxScore: 40,
      transcriptNotes: session.transcriptNotes,
      newVocabulary: session.newVocabulary.join(', '),
      difficultSentences: session.difficultSentences,
      mistakes: session.mistakes,
      shadowingNotes: session.shadowingNotes,
      selfRating: session.selfRating,
    })
    setModalOpen(true)
  }

  function handleDelete(id: string) {
    DatabaseService.remove('listeningSessions', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()

      if (editingSession) {
        const updated: ListeningSession = {
          ...editingSession,
          title: form.title.trim(),
          topic: form.topic,
          sourceUrl: form.sourceUrl,
          durationMinutes: form.durationMinutes || 0,
          section: form.section,
          score: form.score || 0,
          transcriptNotes: form.transcriptNotes,
          newVocabulary: form.newVocabulary.split(',').map(v => v.trim()).filter(Boolean),
          difficultSentences: form.difficultSentences,
          mistakes: form.mistakes,
          shadowingNotes: form.shadowingNotes,
          selfRating: form.selfRating,
        }
        await DatabaseService.put('listeningSessions', updated)
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const session: ListeningSession = {
          id: generateId(),
          title: form.title.trim(),
          topic: form.topic,
          sourceUrl: form.sourceUrl,
          durationMinutes: form.durationMinutes || 0,
          section: form.section,
          score: form.score || 0,
          transcriptNotes: form.transcriptNotes,
          newVocabulary: form.newVocabulary.split(',').map(v => v.trim()).filter(Boolean),
          difficultSentences: form.difficultSentences,
          mistakes: form.mistakes,
          shadowingNotes: form.shadowingNotes,
          selfRating: form.selfRating,
          createdAt: now,
        }
        await DatabaseService.add('listeningSessions', session)
        setSessions(prev => [...prev, session])
      }
      setModalOpen(false)
      setEditingSession(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listening session')
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
            Listening Journal
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your IELTS Listening practice sessions and monitor progress
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
              Total Listening Time
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatTime(stats.totalTime)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Self Rating
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.avgRating}
              <span className="ml-1 text-sm font-normal text-slate-400">/10</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {scoreChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Listening Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Score Over Time
                </p>
                <div className="flex items-end gap-1.5" style={{ height: 100 }}>
                  {scoreChart.map((point, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        {point.score}
                      </span>
                      <div
                        className="w-full rounded-t bg-blue-400 transition-all"
                        style={{ height: `${Math.max(point.score * 2.5, 2)}%` }}
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
                  Accuracy Over Time
                </p>
                <div className="flex items-end gap-1.5" style={{ height: 100 }}>
                  {scoreChart.map((point, i) => (
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
                aria-label="Search listening sessions"
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
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value ? Number(e.target.value) : '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by section"
            >
              <option value="">All Sections</option>
              {LISTENING_SECTIONS.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'rating')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Sort by"
            >
              <option value="date">Newest First</option>
              <option value="score">Highest Score</option>
              <option value="rating">Best Rating</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {sessions.length === 0
                  ? 'No listening sessions yet.'
                  : 'No sessions match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {sessions.length === 0
                  ? 'Add your first Listening practice session to start tracking progress.'
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
            const accuracy = computeAccuracy(session.score, 40)
            const scoreColor = getScoreColor(accuracy)
            const ratingColor = getRatingColor(session.selfRating)
            return (
              <div
                key={session.id}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        Section {session.section}
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
                      <span>{session.durationMinutes}m</span>
                      {session.score > 0 && (
                        <span className={`font-medium ${scoreColor}`}>
                          {session.score}/40 ({accuracy}%)
                        </span>
                      )}
                      <span className={`font-medium ${ratingColor}`}>
                        {getRatingLabel(session.selfRating)} ({session.selfRating}/10)
                      </span>
                    </div>
                    {session.transcriptNotes && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {session.transcriptNotes}
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
                  Section
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">Section {detailSession.section}</p>
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
                  Duration
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatTime(detailSession.durationMinutes)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Score
                </span>
                <p className={`mt-0.5 font-semibold ${getScoreColor(computeAccuracy(detailSession.score, 40))}`}>
                  {detailSession.score}/40 ({computeAccuracy(detailSession.score, 40)}%)
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Self Rating
                </span>
                <p className={`mt-0.5 font-semibold ${getRatingColor(detailSession.selfRating)}`}>
                  {detailSession.selfRating}/10 — {getRatingLabel(detailSession.selfRating)}
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
            {detailSession.transcriptNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Transcript Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.transcriptNotes}
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
            {detailSession.difficultSentences && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Difficult Sentences
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.difficultSentences}
                </p>
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
            {detailSession.shadowingNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Shadowing Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.shadowingNotes}
                </p>
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

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingSession ? 'Edit Listening Session' : 'New Listening Session'} size="lg">
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
              placeholder="e.g., Cambridge IELTS 18 Test 1 Section 2"
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
              <label htmlFor="session-section" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Listening Section
              </label>
              <select
                id="session-section"
                value={form.section}
                onChange={(e) => setForm(prev => ({ ...prev, section: parseInt(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {LISTENING_SECTIONS.map(s => (
                  <option key={s} value={s}>Section {s}</option>
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
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="session-duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Duration (min)
              </label>
              <input
                id="session-duration"
                type="number"
                min="0"
                max="180"
                value={form.durationMinutes}
                onChange={(e) => setForm(prev => ({ ...prev, durationMinutes: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="session-score" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Score
              </label>
              <input
                id="session-score"
                type="number"
                min="0"
                max="40"
                value={form.score}
                onChange={(e) => setForm(prev => ({ ...prev, score: Math.max(0, Math.min(40, parseInt(e.target.value) || 0)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="session-max" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Max Score
              </label>
              <input
                id="session-max"
                type="number"
                min="1"
                max="40"
                value={form.maxScore}
                onChange={(e) => setForm(prev => ({ ...prev, maxScore: Math.max(1, Math.min(40, parseInt(e.target.value) || 40)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="session-rating" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Self Rating (1-10)
              </label>
              <input
                id="session-rating"
                type="number"
                min="1"
                max="10"
                value={form.selfRating}
                onChange={(e) => setForm(prev => ({ ...prev, selfRating: Math.max(1, Math.min(10, parseInt(e.target.value) || 5)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>
          {form.score > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accuracy: {computeAccuracy(form.score, form.maxScore)}%
            </p>
          )}
          <div>
            <label htmlFor="session-transcript" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Transcript Notes
            </label>
            <textarea
              id="session-transcript"
              value={form.transcriptNotes}
              onChange={(e) => setForm(prev => ({ ...prev, transcriptNotes: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Key parts of the transcript, what was discussed..."
            />
          </div>
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
              placeholder="e.g., accommodation, itinerary, reservation"
            />
          </div>
          <div>
            <label htmlFor="session-difficult" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Difficult Sentences
            </label>
            <textarea
              id="session-difficult"
              value={form.difficultSentences}
              onChange={(e) => setForm(prev => ({ ...prev, difficultSentences: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Sentences you found hard to catch or understand..."
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
              placeholder="What mistakes did you make during this listening?"
            />
          </div>
          <div>
            <label htmlFor="session-shadowing" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Shadowing Notes
            </label>
            <textarea
              id="session-shadowing"
              value={form.shadowingNotes}
              onChange={(e) => setForm(prev => ({ ...prev, shadowingNotes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Notes on pronunciation, intonation, and shadowing practice..."
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
