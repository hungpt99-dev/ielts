import { useState, useEffect, useCallback, useMemo } from 'react'
import type { VocabularyEntry, VocabDifficulty, VocabStatus, ReviewRating } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import WordForm from './components/WordForm'
import ReviewMode from './components/ReviewMode'
import PronounceButton from '../../components/ui/PronounceButton'
import PageHeader from '../../components/layout/PageHeader'
import { IconVocabulary } from '@ielts/ui'
import {
  computeStats,
  filterVocabulary,
  getAllTags,
  toggleFavorite,
  changeStatus,
  changeDifficulty,
  rateWord,
  generateExercisesFromVocabulary,
  upsertVocabulary,
} from './vocabularyService'
import type { VocabStats, VocabFilter, VocabExercisePrompt } from './vocabularyService'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const STATUSES: VocabStatus[] = ['new', 'learning', 'reviewing', 'mastered']
const DIFFICULTIES: VocabDifficulty[] = ['easy', 'medium', 'hard']

const STATUS_COLORS: Record<VocabStatus, string> = {
  new: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] dark:bg-[var(--color-primary)]/20 dark:text-[var(--color-primary-light)]',
  learning: 'bg-[var(--color-skill-listening-light)] text-[var(--color-skill-listening)] dark:bg-[var(--color-skill-listening)]/20 dark:text-[var(--color-skill-listening-light)]',
  reviewing: 'bg-[var(--color-skill-reading-light)] text-[var(--color-skill-reading)] dark:bg-[var(--color-skill-reading)]/20 dark:text-[var(--color-skill-reading-light)]',
  mastered: 'bg-[var(--color-success-light)] text-[var(--color-success)] dark:bg-[var(--color-success)]/20 dark:text-[var(--color-success-light)]',
}

const DIFFICULTY_COLORS: Record<VocabDifficulty, string> = {
  easy: 'bg-[var(--color-success-light)] text-[var(--color-success)] dark:bg-[var(--color-success)]/20 dark:text-[var(--color-success-light)]',
  medium: 'bg-[var(--color-warning-light)] text-[var(--color-warning)] dark:bg-[var(--color-warning)]/20 dark:text-[var(--color-warning-light)]',
  hard: 'bg-[var(--color-danger-light)] text-[var(--color-danger)] dark:bg-[var(--color-danger)]/20 dark:text-[var(--color-danger-light)]',
}

interface VocabularyManagerProps {
  entries?: VocabularyEntry[]
  onEntriesChange?: (entries: VocabularyEntry[]) => void
  compact?: boolean
}

export default function VocabularyManager({
  entries: externalEntries,
  onEntriesChange,
  compact,
}: VocabularyManagerProps) {
  const [entries, setEntries] = useState<VocabularyEntry[]>(externalEntries ?? [])
  const [loading, setLoading] = useState(!externalEntries)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<VocabStatus | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<VocabDifficulty | ''>('')
  const [tagFilter, setTagFilter] = useState('')
  const [view, setView] = useState<'all' | 'favorites' | 'difficult'>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<VocabularyEntry | null>(null)
  const [saving, setSaving] = useState(false)

  const [detailEntry, setDetailEntry] = useState<VocabularyEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [tab, setTab] = useState<'browse' | 'review' | 'exercises'>('browse')
  const [stats, setStats] = useState<VocabStats | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = compact ? 5 : 20

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
      setEntries(all)
      const s = await computeStats(all)
      setStats(s)
      onEntriesChange?.(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary')
    } finally {
      setLoading(false)
    }
  }, [onEntriesChange])

  useEffect(() => {
    if (!externalEntries) {
      loadEntries()
    } else {
      setEntries(externalEntries)
      computeStats(externalEntries).then(setStats)
    }
  }, [externalEntries, loadEntries])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const e of entries) {
      for (const t of e.tags) tags.add(t)
    }
    return Array.from(tags).sort()
  }, [entries])

  const favorites = useMemo(() => entries.filter(e => e.tags.includes('favorite')), [entries])
  const hardWords = useMemo(() => entries.filter(e => e.difficulty === 'hard'), [entries])

  const filter: VocabFilter = useMemo(() => ({
    search: search || undefined,
    topic: topicFilter || undefined,
    status: statusFilter || undefined,
    difficulty: difficultyFilter || undefined,
    tag: tagFilter || undefined,
    view,
  }), [search, topicFilter, statusFilter, difficultyFilter, tagFilter, view])

  const filteredEntries = useMemo(() => filterVocabulary(entries, filter), [entries, filter])

  const totalFilteredPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))
  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, page, pageSize])

  useEffect(() => { setPage(1) }, [search, topicFilter, statusFilter, difficultyFilter, tagFilter, view])

  function openCreateForm() {
    setEditingEntry(null)
    setModalOpen(true)
  }

  function openEditForm(entry: VocabularyEntry) {
    setEditingEntry(entry)
    setModalOpen(true)
  }

  function openDetail(entry: VocabularyEntry) {
    setDetailEntry(entry)
    setDetailOpen(true)
  }

  async function handleSave(entry: VocabularyEntry) {
    setSaving(true)
    try {
      await upsertVocabulary(entry)
      setEntries(prev => {
        const exists = prev.find(e => e.id === entry.id)
        if (exists) {
          return prev.map(e => e.id === entry.id ? entry : e)
        }
        return [...prev, entry]
      })
      setModalOpen(false)
      setEditingEntry(null)
      if (stats) {
        const s = await computeStats()
        setStats(s)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save word')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: string) {
    DatabaseService.remove('vocabulary', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    computeStats().then(s => setStats(s))
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingEntry(null)
  }

  async function handleToggleFavorite(entry: VocabularyEntry) {
    const updated = await toggleFavorite(entry)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function handleStatusChange(entry: VocabularyEntry, status: VocabStatus) {
    const updated = await changeStatus(entry, status)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    if (stats) {
      const s = await computeStats()
      setStats(s)
    }
  }

  async function handleToggleTag(entry: VocabularyEntry, tag: string) {
    const updated = await toggleTag(entry, tag)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function handleQuickRate(entry: VocabularyEntry, rating: ReviewRating) {
    await rateWord(entry, rating)
    if (stats) {
      const s = await computeStats()
      setStats(s)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading vocabulary..." fullPage />
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadEntries}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tab === 'review') {
    return <ReviewMode onComplete={() => setTab('browse')} />
  }

  if (tab === 'exercises') {
    return (
      <ExerciseMode
        entries={entries}
        onBack={() => setTab('browse')}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        icon={<IconVocabulary size={22} />}
        title="Vocabulary Notebook"
        description="Build your IELTS vocabulary with words, meanings, and examples"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setTab('exercises')} variant="secondary" disabled={entries.length === 0}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Exercises
            </Button>
            <Button onClick={() => setTab('review')} variant="secondary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Review
            </Button>
            <Button onClick={openCreateForm}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Word
            </Button>
          </div>
        }
      />

      {stats && !compact && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Learning</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.learning}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Reviewing</p>
              <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.reviewing}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Mastered</p>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.mastered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Hard Words</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.hardCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
          {[
            { key: 'all' as const, label: 'All Words', count: entries.length },
            { key: 'favorites' as const, label: 'Favorites', count: favorites.length },
            { key: 'difficult' as const, label: 'Difficult', count: hardWords.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setView(t.key); setStatusFilter(''); setDifficultyFilter(''); setTopicFilter(''); setTagFilter(''); setSearch('') }}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                view === t.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                view === t.key ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="vocab-search" className="sr-only">Search</label>
              <input
                id="vocab-search"
                type="text"
                placeholder="Search words, meanings, examples..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
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
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as VocabStatus | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value as VocabDifficulty | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by difficulty"
            >
              <option value="">All Difficulty</option>
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
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
            {(search || topicFilter || statusFilter || difficultyFilter || tagFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setTopicFilter('')
                  setStatusFilter('')
                  setDifficultyFilter('')
                  setTagFilter('')
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          title={entries.length === 0 ? 'Your vocabulary notebook is empty.' : 'No words match your filters.'}
          description={entries.length === 0 ? 'Add your first word to start building your IELTS vocabulary.' : 'Try adjusting your search or filters.'}
          action={entries.length === 0 ? { label: 'Add Your First Word', onClick: openCreateForm } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {paginatedEntries.map(entry => (
            <div
              key={entry.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openDetail(entry)}
                      className="text-left"
                    >
                      <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                        {entry.word}
                      </h3>
                    </button>
                    <PronounceButton word={entry.word} />
                    {entry.pronunciation && (
                      <span className="text-sm text-slate-400 dark:text-slate-500">
                        /{entry.pronunciation}/
                      </span>
                    )}
                    <span className="text-xs italic text-slate-400 dark:text-slate-500">
                      {entry.partOfSpeech}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
                    {entry.meaning}
                  </p>
                  {entry.meaningVi && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {entry.meaningVi}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[entry.status]}`}>
                      {entry.status}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[entry.difficulty]}`}>
                      {entry.difficulty}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      {entry.topic}
                    </span>
                    {entry.tags.map(tag => (
                      <span
                        key={tag}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      {tag}
                    </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleFavorite(entry)}
                      className={`rounded p-1.5 transition-colors hover:scale-110 ${
                        entry.tags.includes('favorite') ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'
                      }`}
                      aria-label={entry.tags.includes('favorite') ? 'Remove from favorites' : 'Add to favorites'}
                      title={entry.tags.includes('favorite') ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg className="h-4 w-4" fill={entry.tags.includes('favorite') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const newDiff = entry.difficulty === 'hard' ? 'medium' : 'hard'
                        changeDifficulty(entry, newDiff).then(updated => {
                          setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
                        })
                      }}
                      className={`rounded p-1.5 transition-colors hover:scale-110 ${
                        entry.difficulty === 'hard' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                      }`}
                      aria-label={entry.difficulty === 'hard' ? 'Remove difficult mark' : 'Mark as difficult'}
                      title={entry.difficulty === 'hard' ? 'Remove difficult mark' : 'Mark as difficult'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(entry, s)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          entry.status === s
                            ? STATUS_COLORS[s]
                            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                        aria-label={`Mark as ${s}`}
                      >
                        {s === 'new' ? 'New' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(entry)}
                      aria-label="Edit word"
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
                      aria-label="Delete word"
                      className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Quick rate:</span>
                {(['again', 'hard', 'good', 'easy'] as ReviewRating[]).map(rating => (
                  <button
                    key={rating}
                    onClick={() => handleQuickRate(entry, rating)}
                    className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      rating === 'again' ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 dark:bg-[var(--color-danger)]/30 dark:text-[var(--color-danger-light)]' :
                      rating === 'hard' ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 dark:bg-[var(--color-warning)]/30 dark:text-[var(--color-warning-light)]' :
                      rating === 'good' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 dark:bg-[var(--color-primary)]/30 dark:text-[var(--color-primary-light)]' :
                      'bg-[var(--color-success-light)] text-[var(--color-success)] hover:bg-[var(--color-success)]/10 dark:bg-[var(--color-success)]/30 dark:text-[var(--color-success-light)]'
                    }`}
                    title={`Rate as ${rating}`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredEntries.length > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredEntries.length)} of {filteredEntries.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalFilteredPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingEntry ? 'Edit Word' : 'Add Word'} size="lg">
        <WordForm
          initialValues={editingEntry}
          onSave={handleSave}
          onCancel={handleCloseModal}
          saving={saving}
        />
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={detailEntry?.word || ''} size="lg">
        {detailEntry && <WordDetail entry={detailEntry} onEdit={() => { setDetailOpen(false); openEditForm(detailEntry) }} onClose={() => setDetailOpen(false)} />}
      </Modal>
    </div>
  )
}

function WordDetail({ entry, onEdit, onClose }: { entry: VocabularyEntry; onEdit: () => void; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
          {entry.status}
        </span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[entry.difficulty]}`}>
          {entry.difficulty}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
          {entry.topic}
        </span>
        {entry.tags.map(tag => (
          <span
            key={tag}
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          {tag}
        </span>
        ))}
      </div>

      {entry.pronunciation && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Pronunciation: /{entry.pronunciation}/
        </p>
      )}
      <p className="text-xs italic text-slate-400 dark:text-slate-500">
        {entry.partOfSpeech}
      </p>

      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Meaning</p>
        <p className="text-sm text-slate-700 dark:text-slate-300">{entry.meaning}</p>
        {entry.meaningVi && (
          <p className="text-sm text-slate-400 dark:text-slate-500">{entry.meaningVi}</p>
        )}
      </div>

      {entry.exampleSentence && (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Example</p>
          <p className="text-sm italic text-slate-700 dark:text-slate-300">
            &ldquo;{entry.exampleSentence}&rdquo;
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {entry.collocations.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Collocations</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {entry.collocations.map((c, i) => (
                <span
                  key={i}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
        {entry.synonyms.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Synonyms</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {entry.synonyms.map((s, i) => (
                <span
                  key={i}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {entry.antonyms.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Antonyms</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {entry.antonyms.map((a, i) => (
              <span
                key={i}
                className="rounded-lg px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {entry.wordFamily.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Word Family</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {entry.wordFamily.map((wf, i) => (
              <span
                key={i}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400"
              >
                {wf}
              </span>
            ))}
          </div>
        </div>
      )}

      {entry.verbConjugation && entry.verbConjugation.base && (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Verb Conjugation</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[
              { label: 'V1', value: entry.verbConjugation.base },
              { label: 'V2', value: entry.verbConjugation.pastSimple },
              { label: 'V3', value: entry.verbConjugation.pastParticiple },
              { label: '-ing', value: entry.verbConjugation.presentParticiple },
              { label: '-s', value: entry.verbConjugation.thirdPersonSingular },
            ].filter(f => f.value).map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}
              >
                <span style={{ opacity: 0.7 }}>{f.label}</span>
                {f.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {entry.personalNote && (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Personal Note</p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{entry.personalNote}</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Added: {new Date(entry.createdAt).toLocaleDateString()}
          {entry.updatedAt !== entry.createdAt && ` · Updated: ${new Date(entry.updatedAt).toLocaleDateString()}`}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

function ExerciseMode({ entries, onBack }: { entries: VocabularyEntry[]; onBack: () => void }) {
  const [exercises, setExercises] = useState<VocabExercisePrompt[]>([])
  const [selectedWords, setSelectedWords] = useState<VocabularyEntry[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)

  function toggleSelect(entry: VocabularyEntry) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(entry.id)) {
        next.delete(entry.id)
      } else {
        next.add(entry.id)
      }
      return next
    })
  }

  function selectAll() {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)))
    }
  }

  async function generate() {
    setGenerating(true)
    const words = entries.filter(e => selectedIds.has(e.id))
    const result = await generateExercisesFromVocabulary(words.length > 0 ? words : entries, 3)
    setExercises(result)
    setGenerating(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        icon={<IconVocabulary size={22} />}
        title="Vocabulary Exercises"
        description="Generate practice exercises from your saved words"
        actions={
          <Button variant="ghost" onClick={onBack}>
            Back to Vocabulary
          </Button>
        }
      />

      <Card>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Select words to practice ({selectedIds.size} selected)
              </p>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedIds.size === entries.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {entries.slice(0, 50).map(entry => (
                <button
                  key={entry.id}
                  onClick={() => toggleSelect(entry)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    selectedIds.has(entry.id)
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {entry.word}
                </button>
              ))}
            </div>
            <Button onClick={generate} disabled={generating} loading={generating} className="w-full">
              Generate Exercises
            </Button>
          </div>
        </CardContent>
      </Card>

      {exercises.length > 0 && (
        <div className="space-y-4">
          {exercises.map((ex, i) => (
            <Card key={i}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Exercise {i + 1}: {ex.topic}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {ex.estimatedMinutes} min &middot; {ex.wordsToUse.length} words
                    </p>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                    {ex.skill}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{ex.prompt}</p>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Instructions</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                    {ex.instructions}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ex.wordsToUse.map((w, j) => (
                    <span
                      key={j}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
