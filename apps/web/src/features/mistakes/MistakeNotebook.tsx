import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorNavigation } from '../../hooks/useTutorNavigation'
import type { MistakeEntry, MistakeSkill, MistakeStatus } from '../../models'
import { mistakeRepo } from '../../services/repositories'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { ErrorState, EmptyStateIllustrated } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import { IconMistakeReview, IconAdd } from '@ielts/ui'
import { generateId } from '../../utils'
import { ROUTES } from '@ielts/config'

const MISTAKE_SKILLS: { value: MistakeSkill; label: string; color: string }[] = [
  { value: 'vocabulary', label: 'Vocabulary', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { value: 'grammar', label: 'Grammar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'reading', label: 'Reading', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  { value: 'listening', label: 'Listening', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'writing', label: 'Writing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'speaking', label: 'Speaking', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
]

const MISTAKE_TOPICS: string[] = [
  'Grammar Rules', 'Spelling', 'Pronunciation', 'Word Choice',
  'Sentence Structure', 'Punctuation', 'Collocation', 'Tense',
  'Preposition', 'Article', 'Vocabulary', 'Comprehension',
  'Fluency', 'Coherence', 'Task Response', 'Other',
]

const STATUS_OPTIONS: { value: MistakeStatus; label: string; color: string }[] = [
  { value: 'new', label: 'Just Logged', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'reviewed', label: 'Got It', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'resolved', label: 'Mastered', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
]

const SORT_OPTIONS = ['newest', 'oldest', 'most-repeated', 'skill'] as const
type SortOption = typeof SORT_OPTIONS[number]

type ViewMode = 'all' | 'daily-review'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getSkillColor(skill: MistakeSkill): string {
  return MISTAKE_SKILLS.find(s => s.value === skill)?.color ?? ''
}

function getStatusColor(status: MistakeStatus): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.color ?? ''
}

function getStatusBadgeVariant(status: MistakeStatus): 'danger' | 'warning' | 'success' {
  if (status === 'new') return 'danger'
  if (status === 'reviewed') return 'warning'
  return 'success'
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function getSkillBadgeVariant(skill: MistakeSkill): 'danger' | 'warning' | 'success' | 'info' | 'primary' | 'default' {
  const map: Record<MistakeSkill, 'danger' | 'warning' | 'success' | 'info' | 'primary' | 'default'> = {
    grammar: 'primary',
    reading: 'info',
    writing: 'warning',
    speaking: 'danger',
    listening: 'success',
    vocabulary: 'default',
  }
  return map[skill] || 'default'
}

interface MistakeFormData {
  mistake: string
  correction: string
  explanation: string
  source: string
  topic: string
  date: string
  skill: MistakeSkill
  status: MistakeStatus
}

const emptyForm: MistakeFormData = {
  mistake: '',
  correction: '',
  explanation: '',
  source: '',
  topic: 'Other',
  date: new Date().toISOString().slice(0, 10),
  skill: 'grammar',
  status: 'new',
}

function validateForm(form: MistakeFormData): string | null {
  if (!form.mistake.trim()) return 'Please describe the mistake.'
  if (!form.correction.trim()) return 'Please provide a correction.'
  if (form.mistake.trim().length < 2) return 'Mistake description is too short.'
  if (form.correction.trim().length < 2) return 'Correction is too short.'
  return null
}

export default function MistakeNotebook() {
  const navigate = useNavigate()
  const goToTutor = useTutorNavigation()
  const [entries, setEntries] = useState<MistakeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState<MistakeSkill | ''>('')
  const [statusFilter, setStatusFilter] = useState<MistakeStatus | ''>('')
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [minRepetition, setMinRepetition] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MistakeEntry | null>(null)
  const [form, setForm] = useState<MistakeFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [detailEntry, setDetailEntry] = useState<MistakeEntry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await mistakeRepo.findAll()
      setEntries(all)
    } catch (err) {
      console.error('apps/web/src/features/mistakes/MistakeNotebook.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load mistakes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const dailyReviewEntries = useMemo(() => {
    return entries.filter(e => {
      if (e.status === 'resolved') return false
      if (e.status === 'new') return true
      if (e.status === 'reviewed') {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(e.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysSinceUpdate >= 1
      }
      return false
    })
  }, [entries])

  const displayedEntries = viewMode === 'daily-review' ? dailyReviewEntries : entries

  const filteredEntries = useMemo(() => {
    let filtered = [...displayedEntries]

    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter(e =>
        e.mistake.toLowerCase().includes(query) ||
        e.correction.toLowerCase().includes(query) ||
        e.explanation.toLowerCase().includes(query) ||
        e.source.toLowerCase().includes(query)
      )
    }

    if (skillFilter) {
      filtered = filtered.filter(e => e.skill === skillFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    if (topicFilter) {
      filtered = filtered.filter(e => {
        const entry = e as MistakeEntry & { topic?: string }
        return entry.topic === topicFilter
      })
    }

    if (minRepetition > 0) {
      filtered = filtered.filter(e => e.repetitionCount >= minRepetition)
    }

    filtered.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === 'most-repeated') return b.repetitionCount - a.repetitionCount
      if (sortBy === 'skill') return a.skill.localeCompare(b.skill)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return filtered
  }, [displayedEntries, search, skillFilter, statusFilter, topicFilter, sortBy, minRepetition])

  const topics = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) {
      const entry = e as MistakeEntry & { topic?: string }
      if (entry.topic) set.add(entry.topic)
    }
    return [...set].sort()
  }, [entries])

  const stats = useMemo(() => {
    const total = entries.length
    const newCount = entries.filter(e => e.status === 'new').length
    const reviewed = entries.filter(e => e.status === 'reviewed').length
    const resolved = entries.filter(e => e.status === 'resolved').length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0
    const dailyReviewCount = dailyReviewEntries.length
    const bySkill = {} as Record<MistakeSkill, number>
    for (const e of entries) {
      bySkill[e.skill] = (bySkill[e.skill] ?? 0) + 1
    }
    const skillRanking = (Object.entries(bySkill) as [MistakeSkill, number][])
      .sort((a, b) => b[1] - a[1])
    const byTopic = {} as Record<string, number>
    for (const e of entries) {
      const entry = e as MistakeEntry & { topic?: string }
      const t = entry.topic || 'Other'
      byTopic[t] = (byTopic[t] ?? 0) + 1
    }
    const topicRanking = Object.entries(byTopic).sort((a, b) => b[1] - a[1])
    return { total, newCount, reviewed, resolved, resolutionRate, dailyReviewCount, bySkill, skillRanking, byTopic, topicRanking }
  }, [entries, dailyReviewEntries])

  const hasActiveFilters = search || skillFilter || statusFilter || topicFilter || minRepetition > 0

  function clearFilters() {
    setSearch('')
    setSkillFilter('')
    setStatusFilter('')
    setTopicFilter('')
    setSortBy('newest')
    setMinRepetition(0)
  }

  function openCreateForm() {
    setEditingEntry(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditForm(entry: MistakeEntry) {
    const entryWithTopic = entry as MistakeEntry & { topic?: string }
    setEditingEntry(entry)
    setForm({
      mistake: entry.mistake,
      correction: entry.correction,
      explanation: entry.explanation,
      source: entry.source,
      topic: entryWithTopic.topic || 'Other',
      date: entry.date.slice(0, 10),
      skill: entry.skill,
      status: entry.status,
    })
    setFormError(null)
    setModalOpen(true)
  }

  function confirmDelete(id: string) {
    setDeleteConfirm(id)
  }

  function handleDelete(id: string) {
    mistakeRepo.delete(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeleteConfirm(null)
    if (detailEntry?.id === id) setDetailEntry(null)
    showToast('Mistake deleted')
  }

  function handleStatusChange(entry: MistakeEntry, status: MistakeStatus) {
    const updated: MistakeEntry = {
      ...entry,
      status,
      updatedAt: new Date().toISOString(),
    }
    mistakeRepo.bulkUpsert([updated])
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    if (detailEntry?.id === entry.id) setDetailEntry(updated)
    if (status === 'resolved') {
      showToast('Marked as mastered!')
    }
  }

  function handleMarkFixed(entry: MistakeEntry) {
    handleStatusChange(entry, 'resolved')
  }

  function handleRepetitionIncrement(entry: MistakeEntry) {
    const updated: MistakeEntry = {
      ...entry,
      repetitionCount: entry.repetitionCount + 1,
      updatedAt: new Date().toISOString(),
    }
    mistakeRepo.bulkUpsert([updated])
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    if (detailEntry?.id === entry.id) setDetailEntry(updated)
  }

  async function handleSave() {
    const validationError = validateForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const now = new Date().toISOString()
      const dateValue = form.date ? new Date(form.date).toISOString() : now

      if (editingEntry) {
        const updated = {
          ...editingEntry,
          topic: form.topic,
          mistake: form.mistake.trim(),
          correction: form.correction.trim(),
          explanation: form.explanation.trim(),
          source: form.source.trim(),
          date: dateValue,
          skill: form.skill,
          status: form.status,
          updatedAt: now,
        }
        await mistakeRepo.bulkUpsert([updated])
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
        showToast('Mistake updated')
      } else {
        const entry = {
          id: generateId(),
          topic: form.topic,
          mistake: form.mistake.trim(),
          correction: form.correction.trim(),
          explanation: form.explanation.trim(),
          source: form.source.trim(),
          date: dateValue,
          skill: form.skill,
          status: form.status,
          repetitionCount: 0,
          createdAt: now,
          updatedAt: now,
        }
        await mistakeRepo.create(entry)
        setEntries(prev => [...prev, entry as MistakeEntry])
        showToast('Mistake saved')
      }
      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
      console.error('apps/web/src/features/mistakes/MistakeNotebook.tsx error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save mistake')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingEntry(null)
    setFormError(null)
  }

  if (loading) {
    return (
      <PageContent className="space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width="40%" />
          <LoadingSkeleton variant="text" width="25%" />
        </div>
        <div className="flex gap-3">
          <LoadingSkeleton variant="rect" width="140px" height="90px" />
          <LoadingSkeleton variant="rect" width="140px" height="90px" />
          <LoadingSkeleton variant="rect" width="140px" height="90px" />
          <LoadingSkeleton variant="rect" width="140px" height="90px" />
          <LoadingSkeleton variant="rect" width="140px" height="90px" />
        </div>
        <LoadingSkeleton variant="rect" height="160px" />
        <LoadingSkeleton variant="rect" />
        <div className="space-y-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      </PageContent>
    )
  }

  if (error) {
    return (
      <PageContent>
        <ErrorState message={error} onRetry={loadEntries} title="Could not load your mistakes" />
      </PageContent>
    )
  }

  return (
    <PageContent className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500 text-white'
            : 'bg-red-500 text-white'
        }`} role="alert">
          {toast.message}
        </div>
      )}

      {/* Section 1: Header */}
      <PageHeader
        icon={<IconMistakeReview size={22} />}
        title="Mistake Review"
        description="Track, analyze, and resolve mistakes across all IELTS skills"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('all')}
            >
              All Mistakes
            </Button>
            <Button
              variant={viewMode === 'daily-review' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('daily-review')}
            >
              Today's Error Check
              {stats.dailyReviewCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                  {stats.dailyReviewCount}
                </span>
              )}
            </Button>
            <Button onClick={openCreateForm} size="sm">
              <IconAdd size={16} />
              Log a Mistake
            </Button>
          </div>
        }
      />

      {/* Daily Review Banner */}
      {viewMode === 'daily-review' && dailyReviewEntries.length > 0 && (
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                You have {dailyReviewEntries.length} mistake{dailyReviewEntries.length > 1 ? 's' : ''} to review today
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Estimated time: {Math.ceil(dailyReviewEntries.length * 1.5)} minutes
              </p>
            </div>
            <Badge variant="warning" size="md">
              {dailyReviewEntries.length} pending
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Summary Cards Dashboard */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div
              className={`rounded-xl border p-4 text-center transition-all ${!statusFilter || statusFilter === '' ? 'cursor-pointer hover:shadow-sm' : ''}`}
              style={{ borderColor: statusFilter === '' ? 'var(--color-primary)' : 'var(--color-border)' }}
              onClick={() => { if (!statusFilter || statusFilter !== '') setStatusFilter(''); else setStatusFilter('') }}
              role="button"
              aria-label={`Filter by all: ${stats.total} mistakes`}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{stats.total}</p>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Total</p>
            </div>
            <div
              className={`rounded-xl border p-4 text-center transition-all cursor-pointer hover:shadow-sm`}
              style={{ borderColor: statusFilter === 'new' ? 'var(--color-danger)' : 'var(--color-border)' }}
              onClick={() => setStatusFilter(statusFilter === 'new' ? '' : 'new')}
              role="button"
              aria-label={`Filter by new: ${stats.newCount} mistakes`}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--color-danger)' }}>{stats.newCount}</p>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Just Logged</p>
            </div>
            <div
              className={`rounded-xl border p-4 text-center transition-all cursor-pointer hover:shadow-sm`}
              style={{ borderColor: statusFilter === 'reviewed' ? 'var(--color-warning)' : 'var(--color-border)' }}
              onClick={() => setStatusFilter(statusFilter === 'reviewed' ? '' : 'reviewed')}
              role="button"
              aria-label={`Filter by reviewed: ${stats.reviewed} mistakes`}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{stats.reviewed}</p>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Got It</p>
            </div>
            <div
              className={`rounded-xl border p-4 text-center transition-all cursor-pointer hover:shadow-sm`}
              style={{ borderColor: statusFilter === 'resolved' ? 'var(--color-success)' : 'var(--color-border)' }}
              onClick={() => setStatusFilter(statusFilter === 'resolved' ? '' : 'resolved')}
              role="button"
              aria-label={`Filter by resolved: ${stats.resolved} mistakes`}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{stats.resolved}</p>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Mastered</p>
            </div>
            <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'var(--color-border)' }}>
              <div className="relative mx-auto flex h-10 w-10 items-center justify-center">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke="url(#resolutionGradient)"
                    strokeWidth="3"
                    strokeDasharray={`${stats.resolutionRate * 0.97} ${100 - stats.resolutionRate * 0.97}`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="resolutionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-success)" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                  {stats.resolutionRate}%
                </span>
              </div>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Mastery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Breakdown + Repeated Patterns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Mistakes by Skill</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.skillRanking.length > 0 ? (
              <div className="space-y-2.5">
                {MISTAKE_SKILLS.map(skill => {
                  const count = stats.bySkill[skill.value] ?? 0
                  const maxCount = stats.skillRanking[0]?.[1] ?? 1
                  const width = maxCount > 0 ? (count / maxCount) * 100 : 0
                  const isActive = skillFilter === skill.value
                  return (
                    <button
                      key={skill.value}
                      onClick={() => setSkillFilter(isActive ? '' : skill.value)}
                      className={`flex w-full items-center gap-3 rounded-lg p-2 transition-all hover:bg-[var(--color-surface-alt)] ${isActive ? 'ring-1' : ''}`}
                      style={isActive ? { ringColor: 'var(--color-primary)' } : undefined}
                      aria-label={`Filter by ${skill.label}: ${count} mistakes`}
                    >
                      <span className="w-20 text-right text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                        {skill.label}
                      </span>
                      <div className="flex-1">
                        <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${width}%`, backgroundColor: `var(--color-skill-${skill.value === 'vocabulary' ? 'reading' : skill.value === 'grammar' ? 'writing' : skill.value})` }}
                          />
                        </div>
                      </div>
                      <span className="w-8 text-right text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  No mistakes recorded yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repeated Mistake Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                Your Learning Patterns
                <span className="text-sm" style={{ color: 'var(--color-warning)' }}>✨</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.skillRanking.length > 0 ? (
              <div className="space-y-2">
                {stats.topicRanking.slice(0, 5).map(([topic, count]) => {
                  const skillWithTopic = entries.find(e => (e as MistakeEntry & { topic?: string }).topic === topic)
                  const skillLabel = skillWithTopic ? MISTAKE_SKILLS.find(s => s.value === skillWithTopic.skill)?.label : 'General'
                  return (
                    <div
                      key={topic}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-sm"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                          {topic}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {skillLabel}
                        </p>
                      </div>
                      <Badge variant="warning" size="sm">
                        {count}×
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  No patterns detected yet. As you log more mistakes, patterns will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Mistake List with Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[180px] flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search mistakes, corrections, explanations..."
                  className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 dark:placeholder-slate-500"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Search mistakes"
                />
              </div>
            </div>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value as MistakeSkill | '')}
              className="rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Filter by skill"
            >
              <option value="">All Skills</option>
              {MISTAKE_SKILLS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Filter by topic"
            >
              <option value="">All Topics</option>
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MistakeStatus | '')}
              className="rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={minRepetition}
              onChange={(e) => setMinRepetition(Number(e.target.value))}
              className="rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Filter by repetition count"
            >
              <option value={0}>Any Repetitions</option>
              <option value={1}>1+ times</option>
              <option value={3}>3+ times</option>
              <option value={5}>5+ times</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Sort by"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-repeated">Most Repeated</option>
              <option value="skill">Skill A-Z</option>
            </select>
            {hasActiveFilters && (
              <Button variant="ghost" size="xs" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skillFilter && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                  Skill: {MISTAKE_SKILLS.find(s => s.value === skillFilter)?.label}
                  <button onClick={() => setSkillFilter('')} className="ml-0.5">&times;</button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                  Status: {STATUS_OPTIONS.find(s => s.value === statusFilter)?.label}
                  <button onClick={() => setStatusFilter('')} className="ml-0.5">&times;</button>
                </span>
              )}
              {topicFilter && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
                  Topic: {topicFilter}
                  <button onClick={() => setTopicFilter('')} className="ml-0.5">&times;</button>
                </span>
              )}
              {minRepetition > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
                  Repeated: {minRepetition}+
                  <button onClick={() => setMinRepetition(0)} className="ml-0.5">&times;</button>
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mistakes list */}
      {filteredEntries.length === 0 ? (
        viewMode === 'daily-review' ? (
          <EmptyStateIllustrated
            variant="success"
            title={dailyReviewEntries.length > 0 ? 'All caught up!' : 'No mistakes to review today'}
            description={
              dailyReviewEntries.length > 0
                ? "You've reviewed all your unresolved mistakes. Great work staying on top of your errors!"
                : "You're on a roll! Check back after your next practice session."
            }
            action={dailyReviewEntries.length > 0 ? { label: 'Back to All Mistakes', onClick: () => setViewMode('all') } : undefined}
            secondaryAction={dailyReviewEntries.length > 0 ? { label: 'View Progress', onClick: () => {} } : undefined}
          />
        ) : hasActiveFilters ? (
          <EmptyStateIllustrated
            variant="search"
            title="No mistakes match your filters"
            description="Try adjusting your search terms, selecting different skills or topics, or clearing all filters."
            action={{ label: 'Clear All Filters', onClick: clearFilters }}
            secondaryAction={{ label: 'View All Mistakes', onClick: clearFilters }}
          />
        ) : (
          <EmptyStateIllustrated
            variant="default"
            title="No mistakes recorded yet"
            description="Start tracking your mistakes to identify weak points and improve. Mistakes are automatically saved when you practice, or you can add them manually."
            action={{ label: 'Add Your First Mistake', onClick: openCreateForm }}
            secondaryAction={{ label: 'Take a Practice Test', onClick: () => {} }}
          />
        )
      ) : (
        <div className="space-y-3">
          {filteredEntries.map(entry => {
            const entryWithTopic = entry as MistakeEntry & { topic?: string }
            const isDue = viewMode === 'daily-review'
            return (
              <div
                key={entry.id}
                className="rounded-xl border p-4 transition-all hover:shadow-sm"
                style={{
                  borderColor: isDue ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={getSkillBadgeVariant(entry.skill)} size="sm">
                        {MISTAKE_SKILLS.find(s => s.value === entry.skill)?.label}
                      </Badge>
                      {entryWithTopic.topic && entryWithTopic.topic !== 'Other' && (
                        <Badge variant="default" size="sm">
                          {entryWithTopic.topic}
                        </Badge>
                      )}
                      <Badge variant={getStatusBadgeVariant(entry.status)} size="sm">
                        {STATUS_OPTIONS.find(s => s.value === entry.status)?.label}
                      </Badge>
                      {entry.repetitionCount > 0 && (
                        <Badge variant="warning" size="sm">
                          {entry.repetitionCount}× repeated
                        </Badge>
                      )}
                      {isToday(entry.date) && (
                        <Badge variant="info" size="sm">
                          Today
                        </Badge>
                      )}
                    </div>

                    {/* Mistake */}
                    <button
                      onClick={() => setDetailEntry(entry)}
                      className="mt-2 block text-left"
                    >
                      <p className="rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                        {entry.mistake}
                      </p>
                    </button>

                    {/* Correction */}
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs" style={{ color: 'var(--color-success)' }}>
                      <span className="mt-0.5">&rarr;</span>
                      <span className="flex-1">{entry.correction}</span>
                    </p>

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      <span>{formatDate(entry.date)}</span>
                      {entry.source && <span>Source: {entry.source}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    {/* Status quick actions */}
                    <div className="flex gap-0.5">
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s.value}
                          onClick={() => handleStatusChange(entry, s.value)}
                          className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                            entry.status === s.value
                              ? s.color
                              : ''
                          }`}
                          style={{
                            backgroundColor: entry.status !== s.value ? 'var(--color-surface-alt)' : undefined,
                            color: entry.status !== s.value ? 'var(--color-muted)' : undefined,
                          }}
                          aria-label={`Mark as ${s.label}`}
                        >
                          {s.value === 'new' ? 'New' : s.value === 'reviewed' ? 'Got' : 'Done'}
                        </button>
                      ))}
                    </div>

                    {/* Icon actions */}
                    <div className="mt-1 flex items-center gap-0.5">
                      <button
                        onClick={() => handleRepetitionIncrement(entry)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{ color: 'var(--color-muted)' }}
                        aria-label="Mark as repeated"
                        title="Mark this mistake as repeated"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDetailEntry(entry)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{ color: 'var(--color-muted)' }}
                        aria-label="View details"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditForm(entry)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{ color: 'var(--color-muted)' }}
                        aria-label="Edit mistake"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(entry.id)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{ color: 'var(--color-muted)' }}
                        aria-label="Delete mistake"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {viewMode === 'daily-review' && entry.status !== 'resolved' && (
                      <Button
                        size="xs"
                        variant="success"
                        onClick={() => handleMarkFixed(entry)}
                        className="mt-1"
                      >
                        Mark Fixed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Section 3: Detail Panel */}
      <Modal
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        title=""
        size="lg"
      >
        {detailEntry && (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
            {/* Status action buttons */}
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(detailEntry, s.value)}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                    detailEntry.status === s.value
                      ? s.color + ' shadow-sm'
                      : ''
                  }`}
                  style={{
                    backgroundColor: detailEntry.status !== s.value ? 'var(--color-surface-alt)' : undefined,
                    color: detailEntry.status !== s.value ? 'var(--color-text-secondary)' : undefined,
                    border: `1px solid ${detailEntry.status === s.value ? 'transparent' : 'var(--color-border)'}`,
                  }}
                  aria-label={`Mark as ${s.label}`}
                  aria-pressed={detailEntry.status === s.value}
                >
                  {s.value === 'new' ? '📝 Just Logged' : s.value === 'reviewed' ? '👀 Got It' : '✅ Mastered'}
                </button>
              ))}
            </div>

            {/* Mistake & Correction */}
            <div className="space-y-3">
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-danger-light)' }}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-danger)' }}>
                  Mistake
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-danger-dark)' }}>
                  {detailEntry.mistake}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-success-light)' }}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-success)' }}>
                  Correction
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-success-dark)' }}>
                  {detailEntry.correction}
                </p>
              </div>
            </div>

            {/* Explanation */}
            {detailEntry.explanation ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Explanation
                </p>
                <div className="rounded-xl border p-4 text-sm leading-relaxed" style={{ borderColor: 'var(--color-border)' }}>
                  {detailEntry.explanation}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-center" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Add an explanation to help remember why this was wrong
                </p>
              </div>
            )}

            {/* Source & Context */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Skill
                </p>
                <Badge variant={getSkillBadgeVariant(detailEntry.skill)} size="md">
                  {MISTAKE_SKILLS.find(s => s.value === detailEntry.skill)?.label}
                </Badge>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Status
                </p>
                <Badge variant={getStatusBadgeVariant(detailEntry.status)} size="md">
                  {STATUS_OPTIONS.find(s => s.value === detailEntry.status)?.label}
                </Badge>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Date
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>{formatDate(detailEntry.date)}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Times Repeated
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{detailEntry.repetitionCount}</p>
                  <button
                    onClick={() => handleRepetitionIncrement(detailEntry)}
                    className="rounded-lg px-2 py-1 text-[10px] font-medium transition-colors"
                    style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}
                    aria-label="Mark as repeated"
                  >
                    +1 Repeat
                  </button>
                </div>
              </div>
            </div>

            {/* Topic */}
            {(detailEntry as MistakeEntry & { topic?: string }).topic && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Topic
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {(detailEntry as MistakeEntry & { topic?: string }).topic}
                </p>
              </div>
            )}

            {/* Source */}
            {detailEntry.source && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  Source
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                  {detailEntry.source}
                </p>
              </div>
            )}

            {/* AI Tutor Insight Section */}
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-tutor-background, #f0f9ff)', border: '1px solid var(--color-tutor-border, #bae6fd)' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-tutor-text, #0c4a6e)' }}>
                  Coach's Notes
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-tutor-text, #0c4a6e)' }}>
                Ask the AI Tutor to analyze this mistake and provide personalized insights, explanations, and practice questions.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="xs" variant="tutor" onClick={() => goToTutor({ prompt: 'Analyze this IELTS mistake and help me correct it: ' + detailEntry.text, type: 'mistake', title: detailEntry.text })}>
                  Ask AI Tutor
                </Button>
                <Button size="xs" variant="ghost" onClick={() => {
                  const skill = (detailEntry as MistakeEntry).skill
                  const route = skill === 'reading' ? ROUTES.reading
                    : skill === 'listening' ? ROUTES.listening
                    : skill === 'writing' ? ROUTES.writing
                    : skill === 'speaking' ? ROUTES.speaking
                    : skill === 'grammar' ? ROUTES.grammar
                    : ROUTES.reading
                  navigate(route)
                }}>
                  Generate Practice
                </Button>
              </div>
            </div>

            {/* Mistake Timeline */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Mistake History
              </p>
              <div className="relative flex items-start gap-4 pl-4">
                <div className="absolute left-0 top-1 h-full w-0.5" style={{ backgroundColor: 'var(--color-border)' }} />
                {[
                  { date: detailEntry.createdAt, label: 'Created', status: 'new' as const },
                  ...(detailEntry.updatedAt !== detailEntry.createdAt
                    ? [{ date: detailEntry.updatedAt, label: detailEntry.status === 'reviewed' ? 'Reviewed' : detailEntry.status === 'resolved' ? 'Resolved' : 'Updated', status: detailEntry.status as MistakeStatus }]
                    : []),
                ].map((event, i) => (
                  <div key={i} className="relative flex items-center gap-3 pb-3">
                    <div
                      className="absolute -left-4 h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: event.status === 'new' ? 'var(--color-danger)' : event.status === 'reviewed' ? 'var(--color-warning)' : 'var(--color-success)',
                        top: '4px',
                      }}
                    />
                    <div className="ml-2">
                      <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{event.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <Button variant="secondary" size="sm" onClick={() => { setDetailEntry(null); openEditForm(detailEntry) }}>
                Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setDetailEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Mistake"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            Are you sure you want to delete this mistake? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={handleCloseModal} title={editingEntry ? 'Edit Mistake' : 'Log a Mistake'} size="lg">
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mistake-skill" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Skill <span className="text-red-500">*</span>
              </label>
              <select
                id="mistake-skill"
                value={form.skill}
                onChange={(e) => setForm(prev => ({ ...prev, skill: e.target.value as MistakeSkill }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                {MISTAKE_SKILLS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mistake-topic" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Topic
              </label>
              <select
                id="mistake-topic"
                value={form.topic}
                onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                {MISTAKE_TOPICS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mistake-status" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Status
              </label>
              <select
                id="mistake-status"
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as MistakeStatus }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mistake-date" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Date
              </label>
              <input
                id="mistake-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="mistake-text" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Mistake <span className="text-red-500">*</span>
            </label>
            <textarea
              id="mistake-text"
              value={form.mistake}
              onChange={(e) => setForm(prev => ({ ...prev, mistake: e.target.value }))}
              rows={2}
              placeholder="What was the mistake?"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 dark:placeholder-slate-500"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>

          <div>
            <label htmlFor="mistake-correction" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Correction <span className="text-red-500">*</span>
            </label>
            <textarea
              id="mistake-correction"
              value={form.correction}
              onChange={(e) => setForm(prev => ({ ...prev, correction: e.target.value }))}
              rows={2}
              placeholder="What is the correct version?"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 dark:placeholder-slate-500"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>

          <div>
            <label htmlFor="mistake-explanation" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Explanation
            </label>
            <textarea
              id="mistake-explanation"
              value={form.explanation}
              onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
              rows={2}
              placeholder="Why was this a mistake? How to avoid it next time..."
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 dark:placeholder-slate-500"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>

          <div>
            <label htmlFor="mistake-source" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Source
            </label>
            <input
              id="mistake-source"
              type="text"
              value={form.source}
              onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
              placeholder="e.g. Reading test 3, Writing task"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 dark:placeholder-slate-500"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingEntry ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContent>
  )
}
