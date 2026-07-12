import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorNavigation } from '../../hooks/useTutorNavigation'
import type { VocabularyEntry, VocabDifficulty, VocabStatus } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { Card } from '@ielts/ui/components/Card'
import { Button } from '@ielts/ui/components/Button'
import { Badge } from '@ielts/ui/components/Badge'
import { SearchInput } from '@ielts/ui/components/SearchInput'
import { Select } from '@ielts/ui/components/Select'
import { Tabs } from '@ielts/ui/components/Tabs'
import { EmptyState } from '@ielts/ui/components/EmptyState'
import { LoadingSkeleton } from '@ielts/ui/components/LoadingSkeleton'
import { ErrorState } from '@ielts/ui/components/ErrorState'
import { Modal } from '@ielts/ui/components/Modal'
import { Drawer } from '@ielts/ui/components/Drawer'
import PronounceButton from '../../components/ui/PronounceButton'
import WordForm from '../../features/vocabulary/components/WordForm'
import WordFamilyDisplay from '../../features/vocabulary/components/WordFamilyDisplay'
import { onVocabularyChanged } from '../../features/vocabulary/vocabularyEvents'

import { enrichVocabulary } from '../../features/vocabulary/vocabularyService'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import VocabularyListItem from '../../components/vocabulary/VocabularyListItem'
import { IconRefresh, IconDownload, IconUpload, IconAdd, IconFilter, IconVocabularyBook, IconSearch, IconAITutor, IconChevronLeft, IconChevronRight, IconClose } from '@ielts/ui'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const STATUSES: VocabStatus[] = ['new', 'learning', 'reviewing', 'mastered']
const DIFFICULTIES: VocabDifficulty[] = ['easy', 'medium', 'hard']

const statusVariant: Record<VocabStatus, string> = {
  new: 'primary',
  learning: 'warning',
  reviewing: 'info',
  mastered: 'success',
}

const difficultyVariant: Record<VocabDifficulty, string> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
}

const PAGE_SIZES = [10, 20, 50]

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        minWidth: 0,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      <span
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 'var(--weight-bold)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-tight)',
          color,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)',
          whiteSpace: 'nowrap',
          marginTop: 'var(--spacing-2xs)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default function NotebookPage() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<VocabStatus | ''>('')
  const [difficultyFilter, setDifficultyFilter] = useState<VocabDifficulty | ''>('')
  const [tagFilter, setTagFilter] = useState('')
  const [view, setView] = useState<'all' | 'favorites' | 'difficult'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<VocabularyEntry | null>(null)
  const [saving, setSaving] = useState(false)

  const [detailEntry, setDetailEntry] = useState<VocabularyEntry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const navigate = useNavigate()
  const goToTutor = useTutorNavigation()

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

  useEffect(() => { loadEntries() }, [loadEntries])
  useEffect(() => onVocabularyChanged(loadEntries), [loadEntries])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const e of entries) { for (const t of e.tags) tags.add(t) }
    return Array.from(tags).sort()
  }, [entries])

  const favorites = useMemo(() => entries.filter(e => e.tags.includes('favorite')), [entries])
  const hardWords = useMemo(() => entries.filter(e => e.difficulty === 'hard'), [entries])

  const filteredEntries = useMemo(() => {
    let filtered = entries
    if (view === 'favorites') filtered = filtered.filter(e => e.tags.includes('favorite'))
    else if (view === 'difficult') filtered = filtered.filter(e => e.difficulty === 'hard')
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(e =>
        e.word.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.meaningVi.toLowerCase().includes(q) ||
        e.exampleSentence.toLowerCase().includes(q)
      )
    }
    if (topicFilter) filtered = filtered.filter(e => e.topic === topicFilter)
    if (statusFilter) filtered = filtered.filter(e => e.status === statusFilter)
    if (difficultyFilter) filtered = filtered.filter(e => e.difficulty === difficultyFilter)
    if (tagFilter) filtered = filtered.filter(e => e.tags.includes(tagFilter))
    return filtered.sort((a, b) => a.word.localeCompare(b.word))
  }, [entries, search, topicFilter, statusFilter, difficultyFilter, tagFilter, view])

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, page, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))

  useEffect(() => { setPage(1) }, [search, topicFilter, statusFilter, difficultyFilter, tagFilter, view])

  const hasActiveFilters = !!(search || topicFilter || statusFilter || difficultyFilter || tagFilter || view !== 'all')

  const stats = useMemo(() => {
    const total = entries.length
    const newCount = entries.filter(e => e.status === 'new').length
    const learning = entries.filter(e => e.status === 'learning').length
    const reviewing = entries.filter(e => e.status === 'reviewing').length
    const mastered = entries.filter(e => e.status === 'mastered').length
    const hard = hardWords.length
    const dueForReview = entries.filter(e => e.status === 'new' || e.status === 'learning').length
    return { total, newCount, learning, reviewing, mastered, hard, dueForReview }
  }, [entries, hardWords])

  function openCreateForm() { setEditingEntry(null); setModalOpen(true) }

  function openEditForm(entry: VocabularyEntry) { setEditingEntry(entry); setModalOpen(true) }

  function openDetail(entry: VocabularyEntry) { setDetailEntry(entry); setDetailOpen(true) }

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
      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save word')
    } finally { setSaving(false) }
  }

  function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this word?')) {
      DatabaseService.remove('vocabulary', id)
      setEntries(prev => prev.filter(e => e.id !== id))
    }
  }

  function handleCloseModal() { setModalOpen(false); setEditingEntry(null) }

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

  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const items = Array.isArray(data) ? data : (data.vocabulary || [])
      let count = 0
      for (const item of items) {
        if (item.word && item.meaning) {
          await DatabaseService.add('vocabulary', item)
          count++
        }
      }
      loadEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import vocabulary')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleEnrich = useCallback(async () => {
    if (!detailEntry) return
    setEnriching(true)
    const { data, error } = await enrichVocabulary(detailEntry.word, detailEntry.topic)
    if (error || !data) { setEnriching(false); return }
    const mergedWordFamily = [...new Set([...detailEntry.wordFamily, ...(data.wordFamily || [])])]
    const updated: VocabularyEntry = {
      ...detailEntry,
      meaning: data.meaning || detailEntry.meaning,
      pronunciation: data.pronunciation || detailEntry.pronunciation,
      partOfSpeech: data.partOfSpeech || detailEntry.partOfSpeech,
      exampleSentence: data.exampleSentence || detailEntry.exampleSentence,
      collocations: [...new Set([...detailEntry.collocations, ...(data.collocations || [])])],
      synonyms: [...new Set([...detailEntry.synonyms, ...(data.synonyms || [])])],
      antonyms: [...new Set([...detailEntry.antonyms, ...(data.antonyms || [])])],
      wordFamily: mergedWordFamily,
      cefrLevel: (data.cefrLevel || detailEntry.cefrLevel) as VocabularyEntry['cefrLevel'],
      ieltsRelevance: (data.ieltsRelevance || detailEntry.ieltsRelevance) as VocabularyEntry['ieltsRelevance'],
      updatedAt: new Date().toISOString(),
    }
    await DatabaseService.put('vocabulary', updated)
    setDetailEntry(updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEnriching(false)
  }, [detailEntry])

  function handleClearFilters() {
    setSearch('')
    setTopicFilter('')
    setStatusFilter('')
    setDifficultyFilter('')
    setTagFilter('')
    setView('all')
  }

  function handleAskAITutor(word: string, meaning: string) {
    goToTutor({ prompt: `Explain the word "${word}" (${meaning}) and show me how to use it in IELTS Writing Task 2`, type: 'vocabulary-word', title: word })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', padding: 'var(--spacing-md) 0' }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <LoadingSkeleton variant="text" width="200px" height="24px" />
          <LoadingSkeleton variant="text" width="120px" height="36px" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" height="80px" />
          ))}
        </div>
        <LoadingSkeleton variant="rect" height="48px" />
        <LoadingSkeleton variant="vocabulary" count={5} />
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div style={{ padding: 'var(--spacing-2xl) 0' }}>
        <ErrorState
          title="Failed to load vocabulary"
          message={error}
          onRetry={loadEntries}
        />
      </div>
    )
  }

  return (
    <PageContent
      className="flex flex-col"
      style={{ gap: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-2xl)' }}
    >
      {error && (
        <div
          role="alert"
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-danger-dark)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-sm)',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
            aria-label="Dismiss error"
          >
            <IconClose size={20} />
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
        }}
      >
        <PageHeader
          icon={<IconVocabularyBook size={22} />}
          title="Vocabulary Notebook"
          description="Build your IELTS vocabulary with words, meanings, and examples"
          actions={
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/review')}>
                <IconRefresh size={16} style={{ marginRight: 'var(--spacing-2xs)' }} />
                Review
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <IconDownload size={16} style={{ marginRight: 'var(--spacing-2xs)' }} />
                Export
              </Button>
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  style={{ display: 'none' }}
                />
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <IconUpload size={16} style={{ marginRight: 'var(--spacing-2xs)' }} />
                  Import
                </Button>
              </>
              <Button size="sm" onClick={openCreateForm}>
                <IconAdd size={16} style={{ marginRight: 'var(--spacing-2xs)' }} />
                Add Word
              </Button>
            </div>
          }
        />
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total" count={stats.total} color="var(--color-primary)" />
          <StatCard label="New" count={stats.newCount} color="var(--color-status-info)" />
          <StatCard label="Learning" count={stats.learning} color="var(--color-warning)" />
          <StatCard label="Reviewing" count={stats.reviewing} color="var(--color-skill-reading)" />
          <StatCard label="Mastered" count={stats.mastered} color="var(--color-success)" />
          <StatCard label="Hard" count={stats.hard} color="var(--color-danger)" />
          <StatCard label="Due" count={stats.dueForReview} color="var(--color-warning)" />
        </div>
      )}

      <Card variant="outlined" padding="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SearchInput
                inputSize="sm"
                placeholder="Search words, meanings, examples..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                aria-label="Search vocabulary"
              />
            </div>
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
              <Tabs
                tabs={[
                  { id: 'all', label: 'All', badge: filteredEntries.length },
                  { id: 'favorites', label: 'Favorites', badge: favorites.length },
                  { id: 'difficult', label: 'Difficult', badge: hardWords.length },
                ]}
                activeTab={view}
                onChange={t => { setView(t as typeof view); setPage(1) }}
                variant="pills"
                size="sm"
              />
              <button
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2xs)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  fontFamily: 'var(--font-sans)',
                  background: 'var(--color-surface-alt)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
                aria-label="Toggle filters"
              >
                <IconFilter size={14} />
                Filters
                {hasActiveFilters && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2xs)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-medium)',
                    fontFamily: 'var(--font-sans)',
                    background: 'none',
                    color: 'var(--color-danger)',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <IconClose size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {(filtersExpanded || hasActiveFilters) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-xs)',
                paddingTop: 'var(--spacing-xs)',
                borderTop: '1px solid var(--color-border-light)',
                animation: 'fadeIn var(--transition-fast)',
              }}
            >
              <div style={{ minWidth: '140px', flex: 1 }}>
                <Select
                  selectSize="sm"
                  value={topicFilter}
                  onChange={e => setTopicFilter(e.target.value)}
                  aria-label="Filter by topic"
                  options={[
                    { value: '', label: 'All Topics' },
                    ...IELTS_TOPICS.map(t => ({ value: t, label: t })),
                  ]}
                />
              </div>
              <div style={{ minWidth: '120px', flex: 1 }}>
                <Select
                  selectSize="sm"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as VocabStatus | '')}
                  aria-label="Filter by status"
                  options={[
                    { value: '', label: 'All Status' },
                    ...STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
                  ]}
                />
              </div>
              <div style={{ minWidth: '120px', flex: 1 }}>
                <Select
                  selectSize="sm"
                  value={difficultyFilter}
                  onChange={e => setDifficultyFilter(e.target.value as VocabDifficulty | '')}
                  aria-label="Filter by difficulty"
                  options={[
                    { value: '', label: 'All Difficulty' },
                    ...DIFFICULTIES.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) })),
                  ]}
                />
              </div>
              {allTags.length > 0 && (
                <div style={{ minWidth: '120px', flex: 1 }}>
                  <Select
                    selectSize="sm"
                    value={tagFilter}
                    onChange={e => setTagFilter(e.target.value)}
                    aria-label="Filter by tag"
                    options={[
                      { value: '', label: 'All Tags' },
                      ...allTags.map(t => ({ value: t, label: t })),
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {filteredEntries.length === 0 ? (
        entries.length === 0 ? (
          <EmptyState
            icon={<IconVocabularyBook size={48} />}
            title="Your vocabulary notebook is empty"
            description="Start building your IELTS vocabulary by adding your first word. You can also save words from articles, reading passages, or ask the AI Tutor to explain new vocabulary."
            action={<Button size="sm" onClick={openCreateForm}>Add Your First Word</Button>}
            tip="Tip: Use the browser extension to save words while browsing the web."
          />
        ) : (
          <EmptyState
            icon={<IconSearch size={48} />}
            title={view === 'favorites' ? 'No favorite words yet' : view === 'difficult' ? 'No difficult words marked' : 'No words match your filters'}
            description={
              view === 'favorites'
                ? 'Tap the star icon on any word card to add it to your favorites for quick access.'
                : view === 'difficult'
                  ? 'You haven\'t marked any words as difficult yet. As you learn, mark challenging words so you can focus on them.'
                  : 'Try adjusting your search terms or clearing some filters to see more results.'
            }
            action={
              view !== 'all' ? (
                <Button variant="secondary" size="sm" onClick={() => setView('all')}>
                  Browse All Words
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
              )
            }
          />
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {paginatedEntries.map(entry => (
            <VocabularyListItem
              key={entry.id}
              entry={entry}
              onDetail={openDetail}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onToggleFavorite={toggleFavorite}
              onStatusChange={handleStatusChange}
              bottomContent={
                <div style={{ display: 'flex', gap: 'var(--spacing-2xs)' }}>
                  {(['again', 'hard', 'good', 'easy'] as const).map(rating => {
                    const ratingColors: Record<string, { bg: string; color: string; border: string }> = {
                      again: { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', border: 'var(--color-danger)' },
                      hard: { bg: 'var(--color-warning-light)', color: 'var(--color-warning)', border: 'var(--color-warning)' },
                      good: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'var(--color-primary)' },
                      easy: { bg: 'var(--color-success-light)', color: 'var(--color-success)', border: 'var(--color-success)' },
                    }
                    const c = ratingColors[rating]
                    return (
                      <button
                        key={rating}
                        onClick={() => handleStatusChange(entry, rating === 'again' || rating === 'hard' ? 'learning' : rating === 'good' ? 'reviewing' : 'mastered')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-2xs)',
                          padding: 'var(--spacing-2xs) var(--spacing-sm)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--weight-semibold)',
                          fontFamily: 'var(--font-sans)',
                          background: c.bg,
                          color: c.color,
                          border: `1px solid ${c.border}`,
                          borderRadius: 'var(--radius-full)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          textTransform: 'capitalize',
                        }}
                        aria-label={`Quick rate as ${rating}`}
                      >
                        {rating}
                      </button>
                    )
                  })}
                </div>
              }
            />
          ))}
        </div>
      )}

      {filteredEntries.length > pageSize && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-sm)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredEntries.length)} of {filteredEntries.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Select
              selectSize="sm"
              value={String(pageSize)}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              aria-label="Page size"
              options={PAGE_SIZES.map(s => ({ value: String(s), label: `${s} per page` }))}
              style={{ width: '120px' }}
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-2xs)' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                aria-label="Previous page"
              >
                <IconChevronLeft size={14} />
              </Button>
              <div style={{ display: 'flex', gap: 'var(--spacing-2xs)', alignItems: 'center' }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                  if (pageNum > totalPages) return null
                  const isActive = pageNum === page
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      aria-current={isActive ? 'page' : undefined}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px',
                        padding: '0 var(--spacing-xs)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: isActive ? 'var(--weight-bold)' : 'var(--weight-medium)',
                        fontFamily: 'var(--font-sans)',
                        background: isActive ? 'var(--color-primary)' : 'none',
                        color: isActive ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
                        border: isActive ? 'none' : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                aria-label="Next page"
              >
                <IconChevronRight size={14} />
              </Button>
            </div>
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

      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailEntry?.word || ''}
        side="right"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {detailEntry && (
              <Button variant="secondary" size="sm" onClick={() => { setDetailOpen(false); openEditForm(detailEntry) }}>
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {detailEntry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
              <Badge variant={statusVariant[detailEntry.status] as any} size="sm">
                {detailEntry.status}
              </Badge>
              <Badge variant={difficultyVariant[detailEntry.difficulty] as any} size="sm">
                {detailEntry.difficulty}
              </Badge>
              <Badge variant="default" size="sm">
                {detailEntry.topic}
              </Badge>
              {detailEntry.cefrLevel && (
                <Badge variant={detailEntry.cefrLevel >= 'B2' ? 'success' : detailEntry.cefrLevel >= 'B1' ? 'warning' : 'primary'} size="sm">
                  {detailEntry.cefrLevel}
                </Badge>
              )}
              {detailEntry.ieltsRelevance && (
                <Badge variant={detailEntry.ieltsRelevance === 'high' ? 'success' : detailEntry.ieltsRelevance === 'medium' ? 'warning' : 'default'} size="sm">
                  IELTS: {detailEntry.ieltsRelevance}
                </Badge>
              )}
              {detailEntry.tags.map(tag => (
                <Badge key={tag} variant="primary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <PronounceButton word={detailEntry.word} />
              {detailEntry.pronunciation && (
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  /{detailEntry.pronunciation}/
                </span>
              )}
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                {detailEntry.partOfSpeech}
              </span>
            </div>

            <div>
              <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                Meaning
              </h4>
              <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {detailEntry.meaning}
              </p>
              {detailEntry.meaningVi && (
                <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
                  {detailEntry.meaningVi}
                </p>
              )}
            </div>

            {detailEntry.exampleSentence && (
              <div>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                  Example
                </h4>
                <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                  &ldquo;{detailEntry.exampleSentence}&rdquo;
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
              {detailEntry.collocations.length > 0 && (
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                    Collocations
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
                    {detailEntry.collocations.map((c, i) => (
                      <Badge key={i} variant="primary" size="xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {detailEntry.synonyms.length > 0 && (
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                    Synonyms
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
                    {detailEntry.synonyms.map((s, i) => (
                      <Badge key={i} variant="success" size="xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {detailEntry.antonyms.length > 0 && (
              <div>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                  Antonyms
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
                  {detailEntry.antonyms.map((a, i) => (
                    <Badge key={i} variant="danger" size="xs">{a}</Badge>
                  ))}
                </div>
              </div>
            )}

            <WordFamilyDisplay
              wordFamily={detailEntry.wordFamily}
            />

            {detailEntry.personalNote && (
              <div>
                <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>
                  Personal Note
                </h4>
                <p style={{ margin: 'var(--spacing-2xs) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {detailEntry.personalNote}
                </p>
              </div>
            )}

            <div
              style={{
                padding: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, var(--color-tutor-accentLight), var(--color-tutor-background))',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                border: '1px solid var(--color-tutor-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <IconAITutor size={20} style={{ color: 'var(--color-tutor-accent)' }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-tutor-accent)' }}>
                  Learn more with AI Tutor
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-tutor-text)', lineHeight: 'var(--leading-relaxed)' }}>
                Get example sentences, synonyms, collocations, and IELTS writing tips for &ldquo;{detailEntry.word}&rdquo;.
              </p>
              <Button
                variant="tutor"
                size="sm"
                onClick={() => handleAskAITutor(detailEntry.word, detailEntry.meaning)}
                style={{ alignSelf: 'flex-start' }}
              >
                <IconAITutor size={14} style={{ marginRight: 'var(--spacing-2xs)' }} />
                Ask AI Tutor
              </Button>
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
              Added: {new Date(detailEntry.createdAt).toLocaleDateString()}
              {detailEntry.updatedAt !== detailEntry.createdAt && ` · Updated: ${new Date(detailEntry.updatedAt).toLocaleDateString()}`}
            </div>
          </div>
        )}
      </Drawer>
    </PageContent>
  )
}
