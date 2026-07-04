import { useState, useEffect, useCallback, useMemo } from 'react'
import type { VocabularyEntry, VocabDifficulty, VocabStatus } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import WordForm from './components/WordForm'
import ReviewMode from './components/ReviewMode'
import VocabularyImport from './VocabularyImport'
import { onVocabularyChanged } from './vocabularyEvents'
import { onVocabSavedFromExtension, notifyExtensionVocabSaved } from '../../services/storage/VocabularySync'
import PronounceButton from '../../components/ui/PronounceButton'
import WordFamilyDisplay from './components/WordFamilyDisplay'
import { generateWordFamily } from './vocabularyService'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const STATUSES: VocabStatus[] = ['new', 'learning', 'reviewing', 'mastered']
const DIFFICULTIES: VocabDifficulty[] = ['easy', 'medium', 'hard']

const STATUS_COLORS: Record<VocabStatus, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  learning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  reviewing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  mastered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

const DIFFICULTY_COLORS: Record<VocabDifficulty, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function Vocabulary() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [loading, setLoading] = useState(true)
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
  const [generatingFamily, setGeneratingFamily] = useState(false)
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null)

  const [tab, setTab] = useState<'browse' | 'review'>('browse')

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
      setEntries(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  useEffect(() => {
    return onVocabularyChanged(loadEntries)
  }, [loadEntries])

  useEffect(() => {
    return onVocabSavedFromExtension(loadEntries)
  }, [loadEntries])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const e of entries) {
      for (const t of e.tags) tags.add(t)
    }
    return Array.from(tags).sort()
  }, [entries])

  const favorites = useMemo(() => entries.filter(e => e.tags.includes('favorite')), [entries])
  const hardWords = useMemo(() => entries.filter(e => e.difficulty === 'hard'), [entries])

  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (view === 'favorites') {
      filtered = filtered.filter(e => e.tags.includes('favorite'))
    } else if (view === 'difficult') {
      filtered = filtered.filter(e => e.difficulty === 'hard')
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.word.toLowerCase().includes(q) ||
          e.meaning.toLowerCase().includes(q) ||
          e.meaningVi.toLowerCase().includes(q) ||
          e.exampleSentence.toLowerCase().includes(q)
      )
    }

    if (topicFilter) {
      filtered = filtered.filter(e => e.topic === topicFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    if (difficultyFilter) {
      filtered = filtered.filter(e => e.difficulty === difficultyFilter)
    }

    if (tagFilter) {
      filtered = filtered.filter(e => e.tags.includes(tagFilter))
    }

    return filtered.sort((a, b) => a.word.localeCompare(b.word))
  }, [entries, search, topicFilter, statusFilter, difficultyFilter, tagFilter, view])

  const stats = useMemo(() => {
    const total = entries.length
    const newCount = entries.filter(e => e.status === 'new').length
    const learning = entries.filter(e => e.status === 'learning').length
    const reviewing = entries.filter(e => e.status === 'reviewing').length
    const mastered = entries.filter(e => e.status === 'mastered').length
    const hard = hardWords.length
    return { total, newCount, learning, reviewing, mastered, hard }
  }, [entries, hardWords])

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
      if (editingEntry) {
        await DatabaseService.put('vocabulary', entry)
        setEntries(prev => prev.map(e => e.id === entry.id ? entry : e))
      } else {
        await DatabaseService.add('vocabulary', entry)
        setEntries(prev => [...prev, entry])
      }
      notifyExtensionVocabSaved(entry)
      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save word')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: string) {
    DatabaseService.remove('vocabulary', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingEntry(null)
  }

  async function handleStatusChange(entry: VocabularyEntry, status: VocabStatus) {
    const updated: VocabularyEntry = { ...entry, status, updatedAt: new Date().toISOString() }
    await DatabaseService.put('vocabulary', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function toggleFavorite(entry: VocabularyEntry) {
    const tags = entry.tags.includes('favorite')
      ? entry.tags.filter(t => t !== 'favorite')
      : [...entry.tags, 'favorite']
    const updated: VocabularyEntry = { ...entry, tags, updatedAt: new Date().toISOString() }
    await DatabaseService.put('vocabulary', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  function handleExport() {
    const data = JSON.stringify(entries, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ielts-vocabulary-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportComplete(count: number) {
    loadEntries()
  }

  const handleGenerateFamily = useCallback(async () => {
    if (!detailEntry) return
    setGeneratingFamily(true)
    const result = await generateWordFamily(detailEntry.word, detailEntry.meaning)
    if (result.wordFamily.length > 0) {
      const updated: VocabularyEntry = {
        ...detailEntry,
        wordFamily: [...new Set([...detailEntry.wordFamily, ...result.wordFamily])],
        updatedAt: new Date().toISOString(),
      }
      await DatabaseService.put('vocabulary', updated)
      setDetailEntry(updated)
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    }
    setGeneratingFamily(false)
  }, [detailEntry])

  const handleGenerateFamilyFor = useCallback(async (entry: VocabularyEntry) => {
    const result = await generateWordFamily(entry.word, entry.meaning)
    if (result.wordFamily.length > 0) {
      const updated: VocabularyEntry = {
        ...entry,
        wordFamily: [...new Set([...entry.wordFamily, ...result.wordFamily])],
        updatedAt: new Date().toISOString(),
      }
      await DatabaseService.put('vocabulary', updated)
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      if (detailEntry?.id === updated.id) {
        setDetailEntry(updated)
      }
    }
    return result
  }, [detailEntry])

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
            <Button variant="secondary" className="mt-4" onClick={loadEntries}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {tab === 'review' ? (
        <ReviewMode onComplete={() => setTab('browse')} />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                Vocabulary Notebook
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                Build your IELTS vocabulary with words, meanings, and examples
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setTab('review')} variant="secondary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Review
              </Button>
              <Button onClick={handleExport} variant="secondary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </Button>
              <VocabularyImport
                onImportComplete={handleImportComplete}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              />
              <Button onClick={openCreateForm}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Word
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Total</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>New</p>
                <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.newCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Learning</p>
                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.learning}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Reviewing</p>
                <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.reviewing}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Mastered</p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.mastered}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>Hard Words</p>
                <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.hard}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border p-1"
            style={{
              backgroundColor: 'var(--color-surface-alt)',
              borderColor: 'var(--color-border)',
            }}
          >
            {[
              { key: 'all', label: 'All Words', count: entries.length },
              { key: 'favorites', label: 'Favorites', count: favorites.length },
              { key: 'difficult', label: 'Difficult', count: hardWords.length },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => { setView(t.key as typeof view); setStatusFilter(''); setDifficultyFilter(''); setTopicFilter(''); setTagFilter(''); setSearch('') }}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  view === t.key
                    ? 'text-white shadow-sm'
                    : 'hover:bg-[var(--color-surface)]'
                }`}
                style={{
                  backgroundColor: view === t.key ? 'var(--color-primary)' : 'transparent',
                  color: view === t.key ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                {t.label}
                <span className="rounded-full px-2 py-0.5 text-xs"
                  style={{
                    backgroundColor: view === t.key ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-alt)',
                  }}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

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
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={topicFilter}
                  onChange={e => setTopicFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-300"
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
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-300"
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
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-300"
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
                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs text-slate-700 dark:text-slate-300"
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
              {filteredEntries.map(entry => (
                <div
                  key={entry.id}
                  className="rounded-lg border p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openDetail(entry)}
                          className="text-left"
                        >
                          <h3 className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400"
                            style={{ color: 'var(--color-text)' }}>
                            {entry.word}
                          </h3>
                        </button>
                        <button
                          onClick={() => setExpandedWordId(expandedWordId === entry.id ? null : entry.id)}
                          className="flex items-center justify-center rounded-lg transition-colors"
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '1px solid var(--color-border)',
                            background: expandedWordId === entry.id ? 'var(--color-primary-light)' : 'var(--color-surface-alt)',
                            color: expandedWordId === entry.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            flexShrink: 0,
                            fontSize: '13px',
                            lineHeight: 1,
                          }}
                          title={expandedWordId === entry.id ? 'Hide word forms' : 'Show word forms'}
                          aria-label={expandedWordId === entry.id ? 'Hide word forms' : 'Show word forms'}
                        >
                          <span className={`inline-block transition-transform duration-200 ${expandedWordId === entry.id ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                        </button>
                        <PronounceButton word={entry.word} />
                        {entry.pronunciation && (
                          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                            /{entry.pronunciation}/
                          </span>
                        )}
                        <span className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
                          {entry.partOfSpeech}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {entry.meaning}
                      </p>
                      {entry.meaningVi && (
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
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
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: 'var(--color-surface-alt)',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          {entry.topic}
                        </span>
                        {entry.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(entry)}
                        aria-label={entry.tags.includes('favorite') ? 'Remove from favorites' : 'Add to favorites'}
                        className="p-1.5"
                        style={{
                          color: entry.tags.includes('favorite') ? '#eab308' : 'var(--color-muted)',
                        }}
                        title={entry.tags.includes('favorite') ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg className="h-4 w-4" fill={entry.tags.includes('favorite') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </Button>
                      {entry.status !== 'mastered' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(entry, 'mastered')}
                          aria-label="Mark as mastered"
                          className="p-1.5"
                          style={{ color: 'var(--color-success)' }}
                          title="Mark as mastered"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </Button>
                      )}
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
                        className="p-1.5"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {expandedWordId === entry.id && (
                    <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                      <InlineWordFamily entry={entry} onGenerate={handleGenerateFamilyFor} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
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
        {detailEntry && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[detailEntry.status]}`}>
                {detailEntry.status}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[detailEntry.difficulty]}`}>
                {detailEntry.difficulty}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {detailEntry.topic}
              </span>
              {detailEntry.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {detailEntry.pronunciation && (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                Pronunciation: /{detailEntry.pronunciation}/
              </p>
            )}
            <div className="flex items-center gap-2">
              <PronounceButton word={detailEntry.word} />
              <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
                {detailEntry.partOfSpeech}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Meaning</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {detailEntry.meaning}
              </p>
              {detailEntry.meaningVi && (
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  {detailEntry.meaningVi}
                </p>
              )}
            </div>

            {detailEntry.exampleSentence && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Example</p>
                <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>
                  "{detailEntry.exampleSentence}"
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {detailEntry.collocations.length > 0 && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Collocations</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {detailEntry.collocations.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detailEntry.synonyms.length > 0 && (
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Synonyms</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {detailEntry.synonyms.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--color-success-light)',
                          color: 'var(--color-success)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {detailEntry.antonyms.length > 0 && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Antonyms</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {detailEntry.antonyms.map((a, i) => (
                    <span
                      key={i}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--color-danger-light)',
                        color: 'var(--color-danger)',
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <WordFamilyDisplay
              wordFamily={detailEntry.wordFamily}
              onGenerate={handleGenerateFamily}
              generating={generatingFamily}
            />

            {detailEntry.personalNote && (
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Personal Note</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {detailEntry.personalNote}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4"
              style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Added: {new Date(detailEntry.createdAt).toLocaleDateString()}
                {detailEntry.updatedAt !== detailEntry.createdAt && ` · Updated: ${new Date(detailEntry.updatedAt).toLocaleDateString()}`}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setDetailOpen(false); openEditForm(detailEntry) }}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function InlineWordFamily({ entry, onGenerate }: {
  entry: VocabularyEntry
  onGenerate: (entry: VocabularyEntry) => Promise<{ wordFamily: string[]; error: string | null }>
}) {
  const [generating, setGenerating] = useState(false)
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false)

  useEffect(() => {
    if (entry.wordFamily.length === 0 && !hasAutoGenerated && !generating) {
      setHasAutoGenerated(true)
      setGenerating(true)
      onGenerate(entry).finally(() => setGenerating(false))
    }
  }, [entry.wordFamily.length, hasAutoGenerated, generating, onGenerate, entry])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    await onGenerate(entry)
    setGenerating(false)
  }, [entry, onGenerate])

  return (
    <WordFamilyDisplay
      wordFamily={entry.wordFamily}
      onGenerate={handleGenerate}
      generating={generating}
    />
  )
}
