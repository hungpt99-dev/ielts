import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { SpeakingSession, SpeakingPart } from '../models'
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

const SPEAKING_PARTS: { value: SpeakingPart; label: string }[] = [
  { value: 1, label: 'Part 1 (Intro & Interview)' },
  { value: 2, label: 'Part 2 (Cue Card)' },
  { value: 3, label: 'Part 3 (Discussion)' },
]

const CUE_CARD_PREP_TIME = 60
const CUE_CARD_SPEAK_TIME = 120

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function getRatingColor(rating: number): string {
  if (rating >= 7) return 'text-green-600 dark:text-green-400'
  if (rating >= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getRatingLabel(rating: number): string {
  if (rating >= 9) return 'Excellent'
  if (rating >= 7) return 'Good'
  if (rating >= 5) return 'Average'
  if (rating >= 3) return 'Weak'
  return 'Poor'
}

interface SessionFormData {
  part: SpeakingPart
  question: string
  answerNotes: string
  topic: string
  durationSeconds: number
  selfRating: number
  fluencyNotes: string
  vocabularyNotes: string
  grammarMistakes: string
  pronunciationNotes: string
  betterExpressions: string
  improvedAnswer: string
}

const emptyForm: SessionFormData = {
  part: 1,
  question: '',
  answerNotes: '',
  topic: '',
  durationSeconds: 0,
  selfRating: 5,
  fluencyNotes: '',
  vocabularyNotes: '',
  grammarMistakes: '',
  pronunciationNotes: '',
  betterExpressions: '',
  improvedAnswer: '',
}

export default function SpeakingPractice() {
  const [sessions, setSessions] = useState<SpeakingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [partFilter, setPartFilter] = useState<SpeakingPart | 0>(0)
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'duration'>('date')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<SpeakingSession | null>(null)
  const [form, setForm] = useState<SessionFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailSession, setDetailSession] = useState<SpeakingSession | null>(null)
  const [showMistakes, setShowMistakes] = useState(false)

  const [timerOpen, setTimerOpen] = useState(false)
  const [timerPhase, setTimerPhase] = useState<'prep' | 'speak' | 'done'>('prep')
  const [timerSeconds, setTimerSeconds] = useState(CUE_CARD_PREP_TIME)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await getAll<SpeakingSession>('speakingSessions')
      setSessions(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load speaking sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const filteredSessions = useMemo(() => {
    let filtered = [...sessions]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.question.toLowerCase().includes(q) ||
        s.answerNotes.toLowerCase().includes(q) ||
        s.topic.toLowerCase().includes(q) ||
        s.fluencyNotes.toLowerCase().includes(q) ||
        s.vocabularyNotes.toLowerCase().includes(q)
      )
    }
    if (topicFilter) {
      filtered = filtered.filter(s => s.topic === topicFilter)
    }
    if (partFilter) {
      filtered = filtered.filter(s => s.part === partFilter)
    }
    filtered.sort((a, b) => {
      if (sortBy === 'rating') return b.selfRating - a.selfRating
      if (sortBy === 'duration') return b.durationSeconds - a.durationSeconds
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return filtered
  }, [sessions, search, topicFilter, partFilter, sortBy])

  const stats = useMemo(() => {
    const total = sessions.length
    if (total === 0) {
      return { totalSessions: 0, avgRating: 0, totalTime: 0, skillsTracked: 0 }
    }
    const totalTime = sessions.reduce((s, se) => s + se.durationSeconds, 0)
    const avgRating = Math.round((sessions.reduce((s, se) => s + se.selfRating, 0) / total) * 10) / 10
    const parts = new Set(sessions.map(s => s.part))
    return { totalSessions: total, avgRating, totalTime, skillsTracked: parts.size }
  }, [sessions])

  const ratingChart = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return sorted.slice(-10).map(s => ({
      date: formatDate(s.createdAt),
      rating: s.selfRating,
      part: s.part,
      duration: s.durationSeconds,
    }))
  }, [sessions])

  const commonMistakes = useMemo(() => {
    const grammar: Record<string, number> = {}
    const vocab: Record<string, number> = {}
    sessions.forEach(s => {
      s.grammarMistakes.split(',').map(m => m.trim()).filter(Boolean).forEach(m => {
        grammar[m] = (grammar[m] || 0) + 1
      })
      s.vocabularyNotes.split(',').map(m => m.trim()).filter(Boolean).forEach(m => {
        vocab[m] = (vocab[m] || 0) + 1
      })
    })
    const topGrammar = Object.entries(grammar).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topVocab = Object.entries(vocab).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { grammar: topGrammar, vocabulary: topVocab }
  }, [sessions])

  function openCreateForm() {
    setEditingSession(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditForm(session: SpeakingSession) {
    setEditingSession(session)
    setForm({
      part: session.part,
      question: session.question,
      answerNotes: session.answerNotes,
      topic: session.topic,
      durationSeconds: session.durationSeconds,
      selfRating: session.selfRating,
      fluencyNotes: session.fluencyNotes,
      vocabularyNotes: session.vocabularyNotes,
      grammarMistakes: session.grammarMistakes,
      pronunciationNotes: session.pronunciationNotes,
      betterExpressions: session.betterExpressions,
      improvedAnswer: session.improvedAnswer,
    })
    setModalOpen(true)
  }

  function handleDelete(id: string) {
    remove('speakingSessions', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  async function handleSave() {
    if (!form.question.trim() || !form.answerNotes.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()

      if (editingSession) {
        const updated: SpeakingSession = {
          ...editingSession,
          part: form.part,
          question: form.question.trim(),
          answerNotes: form.answerNotes.trim(),
          topic: form.topic,
          durationSeconds: form.durationSeconds || 0,
          selfRating: form.selfRating || 5,
          fluencyNotes: form.fluencyNotes,
          vocabularyNotes: form.vocabularyNotes,
          grammarMistakes: form.grammarMistakes,
          pronunciationNotes: form.pronunciationNotes,
          betterExpressions: form.betterExpressions,
          improvedAnswer: form.improvedAnswer,
        }
        await put('speakingSessions', updated)
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
      } else {
        const session: SpeakingSession = {
          id: generateId(),
          part: form.part,
          question: form.question.trim(),
          answerNotes: form.answerNotes.trim(),
          topic: form.topic,
          durationSeconds: form.durationSeconds || 0,
          selfRating: form.selfRating || 5,
          fluencyNotes: form.fluencyNotes,
          vocabularyNotes: form.vocabularyNotes,
          grammarMistakes: form.grammarMistakes,
          pronunciationNotes: form.pronunciationNotes,
          betterExpressions: form.betterExpressions,
          improvedAnswer: form.improvedAnswer,
          createdAt: now,
        }
        await add('speakingSessions', session)
        setSessions(prev => [...prev, session])
      }
      setModalOpen(false)
      setEditingSession(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save speaking session')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingSession(null)
  }

  // ── Cue Card Timer ──

  function openTimer() {
    setTimerPhase('prep')
    setTimerSeconds(CUE_CARD_PREP_TIME)
    setTimerRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerOpen(true)
  }

  function toggleTimer() {
    if (timerRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      setTimerRunning(false)
    } else {
      setTimerRunning(true)
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            if (timerPhase === 'prep') {
              setTimerPhase('speak')
              return CUE_CARD_SPEAK_TIME
            } else {
              setTimerPhase('done')
              if (timerRef.current) clearInterval(timerRef.current)
              setTimerRunning(false)
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerPhase('prep')
    setTimerSeconds(CUE_CARD_PREP_TIME)
    setTimerRunning(false)
  }

  function closeTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerRunning(false)
    setTimerOpen(false)
  }

  // ── Render ──

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
            Speaking Practice
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track IELTS Speaking Part 1, Part 2, and Part 3 practice with cue card timer and feedback
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openTimer}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cue Card Timer
          </Button>
          <Button onClick={openCreateForm} size="lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Entry
          </Button>
        </div>
      </div>

      {/* Stats cards */}
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
              Avg Self-Rating
            </p>
            <p className={`mt-1 text-2xl font-bold ${getRatingColor(stats.avgRating)}`}>
              {stats.avgRating}
              <span className="ml-1 text-sm font-normal text-slate-400">/10</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Speaking Time
            </p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatDuration(stats.totalTime)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Parts Practiced
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.skillsTracked}/3
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating trend + Common mistakes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {ratingChart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Self-Rating Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1.5" style={{ height: 100 }}>
                {ratingChart.map((point, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      {point.rating}
                    </span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max(point.rating * 10, 2)}%`,
                        backgroundColor:
                          point.part === 1 ? '#818cf8' :
                          point.part === 2 ? '#34d399' : '#f59e0b',
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
                  Part 1
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" />
                  Part 2
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-amber-400" />
                  Part 3
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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
                placeholder="Search speaking sessions..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                aria-label="Search speaking sessions"
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
              value={partFilter}
              onChange={(e) => setPartFilter(Number(e.target.value) as SpeakingPart | 0)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by part"
            >
              <option value={0}>All Parts</option>
              {SPEAKING_PARTS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'rating' | 'duration')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Sort by"
            >
              <option value="date">Newest First</option>
              <option value="rating">Highest Rating</option>
              <option value="duration">Longest Duration</option>
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {sessions.length === 0
                  ? 'No speaking practice entries yet.'
                  : 'No entries match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {sessions.length === 0
                  ? 'Add your first Speaking practice to start tracking progress.'
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
          {filteredSessions.map(session => (
            <div
              key={session.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      session.part === 1
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                        : session.part === 2
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      Part {session.part}
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
                    <span>{formatDuration(session.durationSeconds)}</span>
                    <span className={`font-medium ${getRatingColor(session.selfRating)}`}>
                      {getRatingLabel(session.selfRating)} ({session.selfRating}/10)
                    </span>
                  </div>
                  {session.fluencyNotes && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {session.fluencyNotes}
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
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detailSession} onClose={() => setDetailSession(null)} title={detailSession?.question ?? ''} size="lg">
        {detailSession && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Speaking Part
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">
                  Part {detailSession.part}
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
                  Duration
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDuration(detailSession.durationSeconds)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Self-Rating
                </span>
                <p className={`mt-0.5 font-semibold ${getRatingColor(detailSession.selfRating)}`}>
                  {getRatingLabel(detailSession.selfRating)} ({detailSession.selfRating}/10)
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
                Answer Notes
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                {detailSession.answerNotes}
              </p>
            </div>
            {detailSession.improvedAnswer && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Improved Answer
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed">
                  {detailSession.improvedAnswer}
                </p>
              </div>
            )}
            {detailSession.fluencyNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Fluency Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.fluencyNotes}
                </p>
              </div>
            )}
            {detailSession.vocabularyNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Vocabulary Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-purple-600 dark:text-purple-400">
                  {detailSession.vocabularyNotes}
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
            {detailSession.pronunciationNotes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pronunciation Notes
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.pronunciationNotes}
                </p>
              </div>
            )}
            {detailSession.betterExpressions && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Better Expressions
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailSession.betterExpressions}
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

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} title={editingSession ? 'Edit Speaking Entry' : 'New Speaking Entry'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="speaking-part" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Speaking Part <span className="text-red-500">*</span>
              </label>
              <select
                id="speaking-part"
                value={form.part}
                onChange={(e) => setForm(prev => ({ ...prev, part: Number(e.target.value) as SpeakingPart }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {SPEAKING_PARTS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="speaking-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                IELTS Topic
              </label>
              <select
                id="speaking-topic"
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
            <label htmlFor="speaking-question" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              id="speaking-question"
              value={form.question}
              onChange={(e) => setForm(prev => ({ ...prev, question: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Paste the speaking question or cue card topic..."
              required
            />
          </div>
          <div>
            <label htmlFor="speaking-answer" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Answer Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="speaking-answer"
              value={form.answerNotes}
              onChange={(e) => setForm(prev => ({ ...prev, answerNotes: e.target.value }))}
              rows={8}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 font-mono"
              placeholder="Write your answer or key points you spoke about..."
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="speaking-duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Duration (seconds)
              </label>
              <input
                id="speaking-duration"
                type="number"
                min="0"
                max="600"
                value={form.durationSeconds}
                onChange={(e) => setForm(prev => ({ ...prev, durationSeconds: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="speaking-rating" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Self-Rating (1-10)
              </label>
              <input
                id="speaking-rating"
                type="number"
                min="1"
                max="10"
                step="1"
                value={form.selfRating}
                onChange={(e) => setForm(prev => ({ ...prev, selfRating: Math.max(1, Math.min(10, parseInt(e.target.value) || 5)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-400">{getRatingLabel(form.selfRating)}</p>
            </div>
          </div>
          <div>
            <label htmlFor="speaking-fluency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Fluency Notes
            </label>
            <textarea
              id="speaking-fluency"
              value={form.fluencyNotes}
              onChange={(e) => setForm(prev => ({ ...prev, fluencyNotes: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="How was your fluency? Pauses, hesitations, speech rate..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="speaking-vocab" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Vocabulary Notes (comma-separated)
              </label>
              <textarea
                id="speaking-vocab"
                value={form.vocabularyNotes}
                onChange={(e) => setForm(prev => ({ ...prev, vocabularyNotes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="e.g., good collocations, limited range, repetition"
              />
            </div>
            <div>
              <label htmlFor="speaking-grammar" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Grammar Mistakes (comma-separated)
              </label>
              <textarea
                id="speaking-grammar"
                value={form.grammarMistakes}
                onChange={(e) => setForm(prev => ({ ...prev, grammarMistakes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="e.g., tense errors, subject-verb agreement"
              />
            </div>
          </div>
          <div>
            <label htmlFor="speaking-pronunciation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Pronunciation Notes
            </label>
            <textarea
              id="speaking-pronunciation"
              value={form.pronunciationNotes}
              onChange={(e) => setForm(prev => ({ ...prev, pronunciationNotes: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Notes on pronunciation, intonation, word stress..."
            />
          </div>
          <div>
            <label htmlFor="speaking-expressions" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Better Expressions
            </label>
            <textarea
              id="speaking-expressions"
              value={form.betterExpressions}
              onChange={(e) => setForm(prev => ({ ...prev, betterExpressions: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Alternative phrases or expressions you could have used..."
            />
          </div>
          <div>
            <label htmlFor="speaking-improved" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Improved Answer (full rewrite)
            </label>
            <textarea
              id="speaking-improved"
              value={form.improvedAnswer}
              onChange={(e) => setForm(prev => ({ ...prev, improvedAnswer: e.target.value }))}
              rows={6}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 font-mono"
              placeholder="Write an improved version of your answer here..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.question.trim() || !form.answerNotes.trim()}>
              {editingSession ? 'Save Changes' : 'Create Entry'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cue Card Timer modal */}
      <Modal open={timerOpen} onClose={closeTimer} title="Part 2 Cue Card Timer" size="sm">
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {timerPhase === 'prep' ? 'Preparation Time' : timerPhase === 'speak' ? 'Speaking Time' : 'Time\'s Up!'}
            </p>
            <p className={`mt-2 text-6xl font-bold tabular-nums ${
              timerSeconds <= 10 && timerRunning
                ? 'text-red-600 dark:text-red-400 animate-pulse'
                : 'text-slate-900 dark:text-slate-100'
            }`}>
              {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
            </p>
          </div>

          {timerPhase === 'prep' && (
            <div className="rounded-lg bg-indigo-50 p-4 text-center dark:bg-indigo-900/20">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Read your cue card carefully.
              </p>
              <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">
                You have 1 minute to prepare your response.
              </p>
            </div>
          )}

          {timerPhase === 'speak' && (
            <div className="rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Start speaking now!
              </p>
              <p className="mt-1 text-xs text-emerald-500 dark:text-emerald-400">
                You have 2 minutes to speak on the topic.
              </p>
            </div>
          )}

          {timerPhase === 'done' && (
            <div className="rounded-lg bg-amber-50 p-4 text-center dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Great effort!
              </p>
              <p className="mt-1 text-xs text-amber-500 dark:text-amber-400">
                Time to write down your notes and evaluate your performance.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {timerPhase !== 'done' && (
              <Button onClick={toggleTimer} variant={timerRunning ? 'secondary' : 'primary'}>
                {timerRunning ? 'Pause' : timerPhase === 'prep' ? 'Start Prep' : 'Start Speaking'}
              </Button>
            )}
            {timerRunning && (
              <Button variant="ghost" onClick={resetTimer}>
                Reset
              </Button>
            )}
            {timerPhase === 'done' && (
              <Button onClick={closeTimer}>
                Close & Log Entry
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
