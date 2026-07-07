import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ExtensionMistakeEntry } from '../../storage/mistakeStore'
import { IconAdd, IconInfo } from '@ielts/ui'
import {
  MISTAKE_SKILLS,
  STATUS_OPTIONS,
  extensionMistakeSchema,
  saveMistakeEntry,
  getAllMistakes,
  updateMistakeEntry,
  deleteMistakeEntry,
} from '../../storage/mistakeStore'
import { pushSync } from '../../services/syncManager'

interface MistakeNotebookProps {
  onBack: () => void
}

type SortOption = 'newest' | 'oldest' | 'most-repeated' | 'skill'

interface MistakeFormData {
  mistake: string
  correction: string
  explanation: string
  source: string
  topic: string
  date: string
  skill: ExtensionMistakeEntry['skill']
  status: ExtensionMistakeEntry['status']
}

const emptyForm: MistakeFormData = {
  mistake: '',
  correction: '',
  explanation: '',
  source: '',
  topic: 'general',
  date: new Date().toISOString().slice(0, 10),
  skill: 'grammar',
  status: 'new',
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most-repeated', label: 'Most Repeated' },
  { value: 'skill', label: 'Skill' },
]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MistakeNotebook({ onBack }: MistakeNotebookProps) {
  const [entries, setEntries] = useState<ExtensionMistakeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'daily-review'>('all')

  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState<ExtensionMistakeEntry['skill'] | ''>('')
  const [statusFilter, setStatusFilter] = useState<ExtensionMistakeEntry['status'] | ''>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ExtensionMistakeEntry | null>(null)
  const [form, setForm] = useState<MistakeFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [detailEntry, setDetailEntry] = useState<ExtensionMistakeEntry | null>(null)
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
      const all = await getAllMistakes()
      setEntries(all)
    } catch (err) {
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
      if (e.status === 'fixed') return false
      if (e.status === 'new') return true
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(e.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSinceUpdate >= 1
    })
  }, [entries])

  const displayedEntries = viewMode === 'daily-review' ? dailyReviewEntries : entries

  const filteredEntries = useMemo(() => {
    let filtered = [...displayedEntries]

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(e =>
        e.mistake.toLowerCase().includes(q) ||
        e.correction.toLowerCase().includes(q) ||
        e.explanation.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q)
      )
    }

    if (skillFilter) {
      filtered = filtered.filter(e => e.skill === skillFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter)
    }

    filtered.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortBy === 'most-repeated') return b.repetitionCount - a.repetitionCount
      if (sortBy === 'skill') return a.skill.localeCompare(b.skill)
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return filtered
  }, [displayedEntries, search, skillFilter, statusFilter, sortBy])

  const stats = useMemo(() => {
    const total = entries.length
    const newCount = entries.filter(e => e.status === 'new').length
    const reviewingCount = entries.filter(e => e.status === 'reviewing').length
    const fixedCount = entries.filter(e => e.status === 'fixed').length
    const dailyReviewCount = dailyReviewEntries.length
    const bySkill: Record<string, number> = {}
    for (const e of entries) {
      bySkill[e.skill] = (bySkill[e.skill] ?? 0) + 1
    }
    const mostRepeated = entries.length > 0
      ? [...entries].sort((a, b) => b.repetitionCount - a.repetitionCount)[0]
      : null
    const skillRanking = (Object.entries(bySkill) as [ExtensionMistakeEntry['skill'], number][])
      .sort((a, b) => b[1] - a[1])
    return { total, newCount, reviewingCount, fixedCount, dailyReviewCount, bySkill, mostRepeated, skillRanking }
  }, [entries, dailyReviewEntries])

  function openCreateForm() {
    setEditingEntry(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditForm(entry: ExtensionMistakeEntry) {
    setEditingEntry(entry)
    setForm({
      mistake: entry.mistake,
      correction: entry.correction,
      explanation: entry.explanation,
      source: entry.source,
      topic: entry.topic || 'general',
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

  async function handleDelete(id: string) {
    try {
      await deleteMistakeEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      setDeleteConfirm(null)
      showToast('Mistake deleted')
    } catch {
      showToast('Failed to delete mistake', 'error')
    }
  }

  async function handleStatusChange(entry: ExtensionMistakeEntry, status: ExtensionMistakeEntry['status']) {
    try {
      await updateMistakeEntry(entry.id, { status })
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status, updatedAt: new Date().toISOString() } : e))
      if (status === 'fixed') {
        showToast('Marked as fixed!')
      } else if (status === 'reviewing') {
        showToast('Marked as reviewing')
      }
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  async function handleRepetitionIncrement(entry: ExtensionMistakeEntry) {
    try {
      const updated = { ...entry, repetitionCount: entry.repetitionCount + 1, updatedAt: new Date().toISOString() }
      const parsed = extensionMistakeSchema.parse(updated)
      await saveMistakeEntry(parsed)
      try { pushSync('mistake', 'created', parsed.id, parsed as unknown as Record<string, unknown>) } catch {}
      setEntries(prev => prev.map(e => e.id === parsed.id ? parsed : e))
    } catch {
      showToast('Failed to update', 'error')
    }
  }

  function validateForm(form: MistakeFormData): string | null {
    if (!form.mistake.trim()) return 'Please describe the mistake.'
    if (!form.correction.trim()) return 'Please provide a correction.'
    if (form.mistake.trim().length < 2) return 'Mistake description is too short.'
    if (form.correction.trim().length < 2) return 'Correction is too short.'
    return null
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
          mistake: form.mistake.trim(),
          correction: form.correction.trim(),
          explanation: form.explanation.trim(),
          source: form.source.trim(),
          topic: form.topic,
          date: dateValue,
          skill: form.skill,
          status: form.status,
          updatedAt: now,
        }
        const parsed = extensionMistakeSchema.parse(updated)
        await saveMistakeEntry(parsed)
        try { pushSync('mistake', 'updated', parsed.id, parsed as unknown as Record<string, unknown>) } catch {}
        setEntries(prev => prev.map(e => e.id === parsed.id ? parsed : e))
        showToast('Mistake updated')
      } else {
        const entry = {
          id: crypto.randomUUID(),
          mistake: form.mistake.trim(),
          correction: form.correction.trim(),
          explanation: form.explanation.trim(),
          source: form.source.trim(),
          topic: form.topic,
          date: dateValue,
          skill: form.skill,
          status: form.status,
          repetitionCount: 0,
          createdAt: now,
          updatedAt: now,
        }
        const parsed = extensionMistakeSchema.parse(entry)
        await saveMistakeEntry(parsed)
        try { pushSync('mistake', 'created', parsed.id, parsed as unknown as Record<string, unknown>) } catch {}
        setEntries(prev => [...prev, parsed])
        showToast('Mistake saved')
      }
      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        minHeight: '500px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: '8px' }}>
          <button onClick={onBack} style={backBtnStyle}>← Back</button>
          <h1 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Mistake Notebook
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        minHeight: '500px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: '8px' }}>
          <button onClick={onBack} style={backBtnStyle}>← Back</button>
          <h1 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Mistake Notebook
          </h1>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: 'var(--spacing-sm)',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--color-danger)' }}>{error}</span>
          <button
            onClick={loadEntries}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-sm)',
      padding: 'var(--spacing-md)',
      minHeight: '500px',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '12px',
          right: '12px',
          left: '12px',
          zIndex: 100,
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: 'var(--weight-medium)',
          boxShadow: '0 4px 12px color-mix(in srgb, #000 15%, transparent)',
          background: toast.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          color: 'var(--color-text-inverse)',
          textAlign: 'center',
        }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <button onClick={onBack} style={backBtnStyle}>← Back</button>
          <h1 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Mistake Notebook
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2xs)' }}>
          <button
            onClick={() => setViewMode(viewMode === 'all' ? 'daily-review' : 'all')}
            style={{
              padding: 'var(--spacing-2xs) var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: viewMode === 'daily-review' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: viewMode === 'daily-review' ? 'var(--color-text-inverse)' : 'var(--color-text)',
              fontSize: '11px',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Daily Review
            {stats.dailyReviewCount > 0 && (
              <span style={{
                marginLeft: '4px',
                display: 'inline-flex',
                width: '18px',
                height: '18px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: viewMode === 'daily-review' ? 'color-mix(in srgb, #fff 20%, transparent)' : 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}>
                {stats.dailyReviewCount}
              </span>
            )}
          </button>
          <button
            onClick={openCreateForm}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2xs)',
            }}
          >
            <IconAdd size={14} />
            Add
          </button>
        </div>
      </div>

      {/* Daily Review Banner */}
      {viewMode === 'daily-review' && dailyReviewEntries.length > 0 && (
        <div style={{
          padding: 'var(--spacing-sm)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-warning-light)',
          border: '1px solid var(--color-warning)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--spacing-xs)',
        }}>
          <IconInfo size={18} color="var(--color-warning-dark)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-warning-darker)' }}>
              {dailyReviewEntries.length} mistake{dailyReviewEntries.length > 1 ? 's' : ''} to review today
            </p>
            <p style={{ margin: 'var(--spacing-3xs) 0 0', fontSize: '11px', color: 'var(--color-warning-dark)' }}>
              Review and mark mistakes as fixed to track progress
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--spacing-2xs)',
      }}>
        <StatCard label="New" value={stats.newCount} color="var(--color-danger)" />
        <StatCard label="Reviewing" value={stats.reviewingCount} color="var(--color-warning)" />
        <StatCard label="Fixed" value={stats.fixedCount} color="var(--color-success)" />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-sm) var(--spacing-sm)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search mistakes..."
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-xs)',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--spacing-2xs)', flexWrap: 'wrap' }}>
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value as ExtensionMistakeEntry['skill'] | '')}
            style={filterSelectStyle}
          >
            <option value="">All Skills</option>
            {MISTAKE_SKILLS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExtensionMistakeEntry['status'] | '')}
            style={filterSelectStyle}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            style={filterSelectStyle}
          >
            {SORT_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Entries List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
        {filteredEntries.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-2xl) var(--spacing-md)',
            gap: 'var(--spacing-xs)',
            flex: 1,
          }}>
            <span style={{ fontSize: 'var(--text-4xl)', opacity: 0.3 }}>✓</span>
            <span style={{ fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center' }}>
              {viewMode === 'daily-review'
                ? 'No mistakes to review. Great job!'
                : search || skillFilter || statusFilter
                  ? 'No mistakes match your filters.'
                  : 'No mistakes yet. Start capturing mistakes from webpages!'}
            </span>
            {!search && !skillFilter && !statusFilter && viewMode !== 'daily-review' && (
              <button
                onClick={openCreateForm}
                style={{
                  marginTop: 'var(--spacing-2xs)',
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Add Your First Mistake
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                cursor: 'pointer',
                transition: 'border-color var(--transition-fast)',
              }}
              onClick={() => setDetailEntry(detailEntry?.id === entry.id ? null : entry)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-xs)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--color-text)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {entry.mistake}
                  </p>
                  <p style={{
                    margin: 'var(--spacing-3xs) 0 0',
                    fontSize: '11px',
                    color: 'var(--color-success)',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {entry.correction}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-2xs)', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 'var(--weight-medium)',
                    background: `color-mix(in srgb, ${STATUS_OPTIONS.find(s => s.value === entry.status)?.color ?? 'var(--color-muted)'} 15%, transparent)`,
                    color: STATUS_OPTIONS.find(s => s.value === entry.status)?.color ?? 'var(--color-muted)',
                  }}>
                    {STATUS_OPTIONS.find(s => s.value === entry.status)?.label ?? entry.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-2xs)', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  padding: '1px var(--spacing-2xs)',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 'var(--weight-medium)',
                  background: `color-mix(in srgb, ${MISTAKE_SKILLS.find(s => s.value === entry.skill)?.color ?? 'var(--color-muted)'} 10%, transparent)`,
                  color: MISTAKE_SKILLS.find(s => s.value === entry.skill)?.color ?? 'var(--color-muted)',
                }}>
                  {MISTAKE_SKILLS.find(s => s.value === entry.skill)?.label ?? entry.skill}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                  {formatDate(entry.date)}
                </span>
                {entry.repetitionCount > 0 && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    {entry.repetitionCount}x
                  </span>
                )}
              </div>

              {/* Expanded detail */}
              {detailEntry?.id === entry.id && (
                <div style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  {entry.explanation && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Explanation</span>
                      <p style={{ margin: 'var(--spacing-3xs) 0 0', fontSize: '11px', color: 'var(--color-text)', lineHeight: 1.4 }}>{entry.explanation}</p>
                    </div>
                  )}
                  {entry.source && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source</span>
                      <p style={{ margin: 'var(--spacing-3xs) 0 0', fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{entry.source}</p>
                    </div>
                  )}
                  {entry.topic && (
                    <div style={{ marginBottom: '6px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Topic: <strong>{entry.topic}</strong></span>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 'var(--spacing-2xs)', marginTop: '8px', flexWrap: 'wrap' }}>
                    {entry.status !== 'fixed' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(entry, 'fixed') }}
                        style={actionBtnStyle('var(--color-success)')}
                      >
                        ✓ Fixed
                      </button>
                    )}
                    {entry.status === 'new' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(entry, 'reviewing') }}
                        style={actionBtnStyle('var(--color-warning)')}
                      >
                        Reviewing
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRepetitionIncrement(entry) }}
                      style={actionBtnStyle('var(--color-text-secondary)')}
                    >
                      +1 Repeat
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditForm(entry) }}
                      style={actionBtnStyle('var(--color-primary)')}
                    >
                      Edit
                    </button>
                    {deleteConfirm === entry.id ? (
                      <div style={{ display: 'flex', gap: 'var(--spacing-2xs)', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>Sure?</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                          style={{ ...actionBtnStyle('var(--color-danger)'), padding: '3px 8px', fontSize: '11px' }}
                        >
                          Yes
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null) }}
                          style={{ ...actionBtnStyle('var(--color-text-secondary)'), padding: '3px 8px', fontSize: '11px' }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDelete(entry.id) }}
                        style={actionBtnStyle('var(--color-danger)')}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'color-mix(in srgb, #000 40%, transparent)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--color-bg)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              padding: 'var(--spacing-lg) var(--spacing-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                {editingEntry ? 'Edit Mistake' : 'Add Mistake'}
              </h2>
              <button onClick={handleCloseModal} style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px',
                lineHeight: 1,
              }}>
                ✕
              </button>
            </div>

            {formError && (
              <div style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                fontSize: 'var(--text-xs)',
                border: '1px solid var(--color-danger-light)',
              }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Original Mistake *</label>
              <textarea
                value={form.mistake}
                onChange={(e) => setForm(prev => ({ ...prev, mistake: e.target.value }))}
                rows={2}
                placeholder="The confusing or incorrect sentence/text..."
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Correction *</label>
              <textarea
                value={form.correction}
                onChange={(e) => setForm(prev => ({ ...prev, correction: e.target.value }))}
                rows={2}
                placeholder="The correct version..."
                style={{ ...inputStyle, color: 'var(--color-success)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Explanation</label>
              <textarea
                value={form.explanation}
                onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                rows={2}
                placeholder="Why this mistake happens..."
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Skill</label>
                <select
                  value={form.skill}
                  onChange={(e) => setForm(prev => ({ ...prev, skill: e.target.value as ExtensionMistakeEntry['skill'] }))}
                  style={inputStyle}
                >
                  {MISTAKE_SKILLS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Topic</label>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g. grammar, writing"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as ExtensionMistakeEntry['status'] }))}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Source (URL or context)</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                placeholder="Where did you find this?"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--color-border)' }}>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: saving ? 'var(--color-primary-hover)' : 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  fontSize: '13px',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving...' : editingEntry ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: '10px 8px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      textAlign: 'center',
    }}>
      <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      <p style={{ margin: 'var(--spacing-3xs) 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontWeight: 'var(--weight-medium)' }}>
        {label}
      </p>
    </div>
  )
}

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 'var(--weight-medium)',
  padding: 'var(--spacing-2xs) 0',
}

const filterSelectStyle: React.CSSProperties = {
  padding: 'var(--spacing-2xs) var(--spacing-xs)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '11px',
  cursor: 'pointer',
  flex: 1,
  minWidth: 0,
}

function actionBtnStyle(color: string): React.CSSProperties {
  return {
    padding: 'var(--spacing-2xs) var(--spacing-sm)',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${color}`,
    background: 'transparent',
    color,
    fontSize: '11px',
    fontWeight: 'var(--weight-medium)',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--spacing-xs) var(--spacing-sm)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '13px',
  lineHeight: 1.5,
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
}
