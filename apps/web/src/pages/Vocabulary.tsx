import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { VocabularyEntry, VocabDifficulty, VocabStatus } from '../models'
import { generateId } from '../utils'
import { DatabaseService } from '../services/storage/Database'
import { useToast } from '../components/ui/Toast'
import {
  emitVocabularySaved,
  emitVocabularyMastered,
} from '../features/websiteActions/eventEmitters'
import Card, { CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import Pagination from '../components/ui/Pagination'
import PageHeader from '../components/layout/PageHeader'
import { IconVocabularyBook } from '@ielts/ui'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const PARTS_OF_SPEECH = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition',
  'conjunction', 'pronoun', 'determiner', 'phrasal verb', 'idiom',
]

const DIFFICULTIES: VocabDifficulty[] = ['easy', 'medium', 'hard']

const STATUSES: VocabStatus[] = ['new', 'learning', 'reviewing', 'mastered']

const STATUS_COLORS: Record<VocabStatus, string> = {
  new: 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]',
  learning: 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]',
  reviewing: 'bg-[var(--color-info-light)] text-[var(--color-info-dark)]',
  mastered: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]',
}

const DIFFICULTY_COLORS: Record<VocabDifficulty, string> = {
  easy: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]',
  medium: 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)]',
  hard: 'bg-[var(--color-danger-light)] text-[var(--color-danger-dark)]',
}

interface VocabFormData {
  word: string
  meaning: string
  meaningVi: string
  pronunciation: string
  partOfSpeech: string
  topic: string
  exampleSentence: string
  collocations: string
  synonyms: string
  antonyms: string
  wordFamily: string
  personalNote: string
  difficulty: VocabDifficulty
  status: VocabStatus
  tags: string
}

const emptyForm: VocabFormData = {
  word: '',
  meaning: '',
  meaningVi: '',
  pronunciation: '',
  partOfSpeech: 'noun',
  topic: 'Education',
  exampleSentence: '',
  collocations: '',
  synonyms: '',
  antonyms: '',
  wordFamily: '',
  personalNote: '',
  difficulty: 'medium',
  status: 'new',
  tags: '',
}

function parseList(value: string): string[] {
  return value
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
}

export default function Vocabulary() {
  const { showToast } = useToast()

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
  const [form, setForm] = useState<VocabFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [detailEntry, setDetailEntry] = useState<VocabularyEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
      setEntries(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary')
      showToast('error', err instanceof Error ? err.message : 'Failed to load vocabulary')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const sessionWordCount = useRef(0)

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

  const totalFilteredPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, topicFilter, statusFilter, difficultyFilter, tagFilter, view])

  const stats = useMemo(() => {
    const total = entries.length
    const newCount = entries.filter(e => e.status === 'new').length
    const learning = entries.filter(e => e.status === 'learning').length
    const reviewing = entries.filter(e => e.status === 'reviewing').length
    const mastered = entries.filter(e => e.status === 'mastered').length
    const hard = entries.filter(e => e.difficulty === 'hard').length
    return { total, newCount, learning, reviewing, mastered, hard }
  }, [entries])

  function validateForm(data: VocabFormData): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!data.word.trim()) errors.word = 'Word is required'
    if (!data.meaning.trim()) errors.meaning = 'Meaning is required'
    return errors
  }

  function openCreateForm() {
    setEditingEntry(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEditForm(entry: VocabularyEntry) {
    setEditingEntry(entry)
    setForm({
      word: entry.word,
      meaning: entry.meaning,
      meaningVi: entry.meaningVi,
      pronunciation: entry.pronunciation,
      partOfSpeech: entry.partOfSpeech,
      topic: entry.topic,
      exampleSentence: entry.exampleSentence,
      collocations: entry.collocations.join(', '),
      synonyms: entry.synonyms.join(', '),
      antonyms: entry.antonyms.join(', '),
      wordFamily: entry.wordFamily.join(', '),
      personalNote: entry.personalNote,
      difficulty: entry.difficulty,
      status: entry.status,
      tags: entry.tags.join(', '),
    })
    setFormErrors({})
    setModalOpen(true)
  }

  function openDetail(entry: VocabularyEntry) {
    setDetailEntry(entry)
    setDetailOpen(true)
  }

  async function handleSave() {
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const entry: VocabularyEntry = {
        id: editingEntry?.id ?? generateId(),
        word: form.word.trim(),
        meaning: form.meaning.trim(),
        meaningVi: form.meaningVi.trim(),
        pronunciation: form.pronunciation.trim(),
        partOfSpeech: form.partOfSpeech,
        topic: form.topic,
        exampleSentence: form.exampleSentence.trim(),
        collocations: parseList(form.collocations),
        synonyms: parseList(form.synonyms),
        antonyms: parseList(form.antonyms),
        wordFamily: parseList(form.wordFamily),
        personalNote: form.personalNote.trim(),
        difficulty: form.difficulty,
        status: form.status,
        tags: parseList(form.tags),
        createdAt: editingEntry?.createdAt ?? now,
        updatedAt: now,
      }

      const label = form.word.trim()
      if (editingEntry) {
        await DatabaseService.put('vocabulary', entry)
        setEntries(prev => prev.map(e => e.id === entry.id ? entry : e))
        showToast('success', `"${label}" updated`)
      } else {
        await DatabaseService.add('vocabulary', entry)
        setEntries(prev => [...prev, entry])
        sessionWordCount.current += 1
        emitVocabularySaved(entry.id, entry.word, entry.topic, sessionWordCount.current)
        showToast('success', `"${label}" added`)
      }

      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save word')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: string) {
    const entry = entries.find(e => e.id === id)
    DatabaseService.remove('vocabulary', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    showToast('info', entry ? `"${entry.word}" deleted` : 'Word deleted')
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingEntry(null)
    setFormErrors({})
  }

  async function handleStatusChange(entry: VocabularyEntry, status: VocabStatus) {
    const updated: VocabularyEntry = { ...entry, status, updatedAt: new Date().toISOString() }
    await DatabaseService.put('vocabulary', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    showToast('success', `"${entry.word}" marked as ${status}`)

    if (status === 'mastered') {
      const totalMastered = entries.filter(e => e.status === 'mastered' || (e.id === entry.id && status === 'mastered')).length
      emitVocabularyMastered(entry.id, entry.word, totalMastered + 1)
    }
  }

  async function toggleFavorite(entry: VocabularyEntry) {
    const tags = entry.tags.includes('favorite')
      ? entry.tags.filter(t => t !== 'favorite')
      : [...entry.tags, 'favorite']
    const updated: VocabularyEntry = { ...entry, tags, updatedAt: new Date().toISOString() }
    await DatabaseService.put('vocabulary', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    showToast('info', tags.includes('favorite') ? `"${entry.word}" favorited` : `"${entry.word}" unfavorited`)
  }

  async function toggleTag(entry: VocabularyEntry, tag: string) {
    const tags = entry.tags.includes(tag)
      ? entry.tags.filter(t => t !== tag)
      : [...entry.tags, tag]
    const updated: VocabularyEntry = { ...entry, tags, updatedAt: new Date().toISOString() }
    await DatabaseService.put('vocabulary', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadEntries} />
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-4 sm:pt-6">
      <PageHeader
        icon={<IconVocabularyBook size={20} />}
        title="Vocabulary Notebook"
        description="Build your IELTS vocabulary with words, meanings, and examples"
        actions={
          <Button onClick={openCreateForm} size="lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Word
          </Button>
        }
      />

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
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.hard}</p>
          </CardContent>
        </Card>
      </div>

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
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {entries.length === 0
                  ? 'Your vocabulary notebook is empty.'
                  : 'No words match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {entries.length === 0
                  ? 'Add your first word to start building your IELTS vocabulary.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {entries.length === 0 && (
                <Button className="mt-4" size="sm" onClick={openCreateForm}>
                  Add Your First Word
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
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
                        className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-1">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => toggleFavorite(entry)}
                      className={`rounded p-1 transition-colors hover:scale-110 ${
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
                        const updated: VocabularyEntry = { ...entry, difficulty: newDiff, updatedAt: new Date().toISOString() }
                        DatabaseService.put('vocabulary', updated)
                        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
                        showToast('info', `Difficulty set to ${newDiff}`)
                      }}
                      className={`rounded p-1 transition-colors hover:scale-110 ${
                        entry.difficulty === 'hard' ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
                      }`}
                      aria-label={entry.difficulty === 'hard' ? 'Remove difficult mark' : 'Mark as difficult'}
                      title={entry.difficulty === 'hard' ? 'Remove difficult mark' : 'Mark as difficult'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleTag(entry, 'needs-review')}
                      className={`rounded p-1 transition-colors hover:scale-110 ${
                        entry.tags.includes('needs-review') ? 'text-orange-500' : 'text-slate-400 hover:text-orange-500'
                      }`}
                      aria-label={entry.tags.includes('needs-review') ? 'Remove needs-review mark' : 'Mark as needs review'}
                      title={entry.tags.includes('needs-review') ? 'Remove needs-review mark' : 'Mark as needs review'}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
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
                  <div className="flex flex-col gap-0.5">
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
            </div>
          ))}
        </div>
      )}

      {filteredEntries.length > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredEntries.length)} of {filteredEntries.length}
          </p>
          <Pagination page={page} totalPages={totalFilteredPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingEntry ? 'Edit Word' : 'Add Word'} size="lg">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vocab-word" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Word <span className="text-red-500">*</span>
              </label>
              <input
                id="vocab-word"
                type="text"
                value={form.word}
                onChange={e => setForm(prev => ({ ...prev, word: e.target.value }))}
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 ${formErrors.word ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'}`}
                placeholder="e.g., ubiquitous"
              />
              {formErrors.word && <p className="mt-1 text-xs text-red-500">{formErrors.word}</p>}
            </div>
            <div>
              <label htmlFor="vocab-pronunciation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pronunciation
              </label>
              <input
                id="vocab-pronunciation"
                type="text"
                value={form.pronunciation}
                onChange={e => setForm(prev => ({ ...prev, pronunciation: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="/juːˈbɪk.wɪ.təs/"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vocab-meaning" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Meaning <span className="text-red-500">*</span>
              </label>
              <textarea
                id="vocab-meaning"
                value={form.meaning}
                onChange={e => setForm(prev => ({ ...prev, meaning: e.target.value }))}
                rows={2}
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 ${formErrors.meaning ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'}`}
                placeholder="Existing everywhere, widespread"
              />
              {formErrors.meaning && <p className="mt-1 text-xs text-red-500">{formErrors.meaning}</p>}
            </div>
            <div>
              <label htmlFor="vocab-meaning-vi" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Translation
              </label>
              <textarea
                id="vocab-meaning-vi"
                value={form.meaningVi}
                onChange={e => setForm(prev => ({ ...prev, meaningVi: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="vocab-pos" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Part of Speech
              </label>
              <select
                id="vocab-pos"
                value={form.partOfSpeech}
                onChange={e => setForm(prev => ({ ...prev, partOfSpeech: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {PARTS_OF_SPEECH.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vocab-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                IELTS Topic
              </label>
              <select
                id="vocab-topic"
                value={form.topic}
                onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                {IELTS_TOPICS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="vocab-difficulty" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Difficulty
                </label>
                <select
                  id="vocab-difficulty"
                  value={form.difficulty}
                  onChange={e => setForm(prev => ({ ...prev, difficulty: e.target.value as VocabDifficulty }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vocab-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  id="vocab-status"
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as VocabStatus }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="vocab-example" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Example Sentence
            </label>
            <textarea
              id="vocab-example"
              value={form.exampleSentence}
              onChange={e => setForm(prev => ({ ...prev, exampleSentence: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Smartphones have become ubiquitous in modern society."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vocab-collocations" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Collocations (comma-separated)
              </label>
              <textarea
                id="vocab-collocations"
                value={form.collocations}
                onChange={e => setForm(prev => ({ ...prev, collocations: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="ubiquitous computing, ubiquitous presence, become ubiquitous"
              />
            </div>
            <div>
              <label htmlFor="vocab-synonyms" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Synonyms (comma-separated)
              </label>
              <textarea
                id="vocab-synonyms"
                value={form.synonyms}
                onChange={e => setForm(prev => ({ ...prev, synonyms: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="widespread, pervasive, omnipresent"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vocab-antonyms" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Antonyms (comma-separated)
              </label>
              <textarea
                id="vocab-antonyms"
                value={form.antonyms}
                onChange={e => setForm(prev => ({ ...prev, antonyms: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="rare, scarce, uncommon"
              />
            </div>
            <div>
              <label htmlFor="vocab-family" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Word Family (comma-separated)
              </label>
              <textarea
                id="vocab-family"
                value={form.wordFamily}
                onChange={e => setForm(prev => ({ ...prev, wordFamily: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="ubiquity (noun), ubiquitously (adv)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vocab-tags-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tags (comma-separated)
            </label>
            <input
              id="vocab-tags-input"
              type="text"
              value={form.tags}
              onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="academic, technology, essay-writing"
            />
          </div>

          <div>
            <label htmlFor="vocab-note" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Personal Note
            </label>
            <textarea
              id="vocab-note"
              value={form.personalNote}
              onChange={e => setForm(prev => ({ ...prev, personalNote: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="Remember: this word is often used in Technology essays"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.word.trim() || !form.meaning.trim()}>
              {editingEntry ? 'Save Changes' : 'Add Word'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={detailEntry?.word ?? ''} size="lg">
        {detailEntry && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[detailEntry.status]}`}>
                {detailEntry.status}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[detailEntry.difficulty]}`}>
                {detailEntry.difficulty}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                {detailEntry.topic}
              </span>
              <span className="text-xs italic text-slate-400 dark:text-slate-500">
                {detailEntry.partOfSpeech}
              </span>
              {detailEntry.pronunciation && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  /{detailEntry.pronunciation}/
                </span>
              )}
            </div>

            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Meaning</h4>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{detailEntry.meaning}</p>
              {detailEntry.meaningVi && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{detailEntry.meaningVi}</p>
              )}
            </div>

            {detailEntry.exampleSentence && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Example Sentence</h4>
                <p className="mt-1 text-sm italic text-slate-900 dark:text-slate-100">"{detailEntry.exampleSentence}"</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {detailEntry.collocations.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Collocations</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {detailEntry.collocations.map((c, i) => (
                      <span key={i} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detailEntry.synonyms.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Synonyms</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {detailEntry.synonyms.map((s, i) => (
                      <span key={i} className="rounded-md bg-green-50 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detailEntry.antonyms.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Antonyms</h4>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {detailEntry.antonyms.map((a, i) => (
                      <span key={i} className="rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {detailEntry.wordFamily.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Word Family</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {detailEntry.wordFamily.map((w, i) => (
                    <span key={i} className="rounded-md bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {detailEntry.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Tags</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {detailEntry.tags.map((t, i) => (
                    <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {detailEntry.personalNote && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Personal Note</h4>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{detailEntry.personalNote}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailOpen(false)
                  openEditForm(detailEntry)
                }}
              >
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDetailOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
