import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { MistakeEntry, MistakeSkill, MistakeStatus } from '../models'
import { DatabaseService } from '../services/storage/Database'
import { emitMistakeSaved } from '../features/websiteActions/eventEmitters'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { EmptyState } from '@ielts/ui/components/EmptyState'
import SearchInput from '../components/ui/SearchInput'
import { generateId } from '../utils'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import { useToast } from '../components/ui/Toast'
import Pagination from '../components/ui/Pagination'
import {
  IconAdd, IconEdit, IconDelete, IconEye, IconRefresh,
  IconMistakeReview, IconMistakes, IconArrowRight,
} from '@ielts/ui'
import PageHeader from '../components/layout/PageHeader'
import { LoadingSkeleton } from '@ielts/ui/components/LoadingSkeleton'

const SKILL_BADGE_VARIANTS: Record<MistakeSkill, 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking'> = {
  vocabulary: 'vocabulary',
  grammar: 'grammar',
  reading: 'reading',
  listening: 'listening',
  writing: 'writing',
  speaking: 'speaking',
}

const STATUS_BADGE_VARIANTS: Record<MistakeStatus, 'danger' | 'warning' | 'success'> = {
  new: 'danger',
  reviewed: 'warning',
  resolved: 'success',
}

const SKILL_ICONS: Record<MistakeSkill, React.ReactNode> = {
  vocabulary: <IconVocabulary size={14} />,
  grammar: <IconGrammar size={14} />,
  reading: <IconReading size={14} />,
  listening: <IconListening size={14} />,
  writing: <IconWriting size={14} />,
  speaking: <IconSpeaking size={14} />,
}

type SortOption = 'newest' | 'oldest' | 'most-repeated' | 'skill'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const MISTAKE_LABELS: Record<MistakeSkill, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
}

const STATUS_LABELS: Record<MistakeStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
}

interface MistakeFormData {
  mistake: string
  correction: string
  explanation: string
  source: string
  date: string
  skill: MistakeSkill
  status: MistakeStatus
}

const emptyForm: MistakeFormData = {
  mistake: '',
  correction: '',
  explanation: '',
  source: '',
  date: new Date().toISOString().slice(0, 10),
  skill: 'grammar',
  status: 'new',
}

export default function Mistakes() {
  const { showToast } = useToast()
  const [entries, setEntries] = useState<MistakeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState<MistakeSkill | ''>('')
  const [statusFilter, setStatusFilter] = useState<MistakeStatus | ''>('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<MistakeEntry | null>(null)
  const [form, setForm] = useState<MistakeFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [detailEntry, setDetailEntry] = useState<MistakeEntry | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<MistakeEntry>('mistakes')
      setEntries(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mistakes')
      showToast('error', err instanceof Error ? err.message : 'Failed to load mistakes')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const filteredEntries = useMemo(() => {
    let filtered = [...entries]

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
  }, [entries, search, skillFilter, statusFilter, sortBy])

  const totalFilteredPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, skillFilter, statusFilter, sortBy])

  const stats = useMemo(() => {
    const total = entries.length
    const newCount = entries.filter(e => e.status === 'new').length
    const reviewed = entries.filter(e => e.status === 'reviewed').length
    const resolved = entries.filter(e => e.status === 'resolved').length
    const bySkill = {} as Record<MistakeSkill, number>
    for (const e of entries) {
      bySkill[e.skill] = (bySkill[e.skill] ?? 0) + 1
    }
    const mostRepeated = entries.length > 0
      ? [...entries].sort((a, b) => b.repetitionCount - a.repetitionCount)[0]
      : null
    const skillRanking = (Object.entries(bySkill) as [MistakeSkill, number][])
      .sort((a, b) => b[1] - a[1])
    return { total, newCount, reviewed, resolved, bySkill, mostRepeated, skillRanking }
  }, [entries])

  function openCreateForm() {
    setEditingEntry(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditForm(entry: MistakeEntry) {
    setEditingEntry(entry)
    setForm({
      mistake: entry.mistake,
      correction: entry.correction,
      explanation: entry.explanation,
      source: entry.source,
      date: entry.date.slice(0, 10),
      skill: entry.skill,
      status: entry.status,
    })
    setModalOpen(true)
  }

  function handleDelete(id: string) {
    DatabaseService.remove('mistakes', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function handleStatusChange(entry: MistakeEntry, status: MistakeStatus) {
    const updated: MistakeEntry = {
      ...entry,
      status,
      updatedAt: new Date().toISOString(),
    }
    DatabaseService.put('mistakes', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  function handleRepetitionIncrement(entry: MistakeEntry) {
    const updated: MistakeEntry = {
      ...entry,
      repetitionCount: entry.repetitionCount + 1,
      updatedAt: new Date().toISOString(),
    }
    DatabaseService.put('mistakes', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const sessionMistakeCount = useRef(0)

  async function handleSave() {
    if (!form.mistake.trim() || !form.correction.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const dateValue = form.date ? new Date(form.date).toISOString() : now

      if (editingEntry) {
        const updated: MistakeEntry = {
          ...editingEntry,
          mistake: form.mistake.trim(),
          correction: form.correction.trim(),
          explanation: form.explanation.trim(),
          source: form.source.trim(),
          date: dateValue,
          skill: form.skill,
          status: form.status,
          updatedAt: now,
        }
        await DatabaseService.put('mistakes', updated)
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      } else {
        const entry: MistakeEntry = {
          id: generateId(),
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
        await DatabaseService.add('mistakes', entry)
        setEntries(prev => [...prev, entry])
        sessionMistakeCount.current += 1
        emitMistakeSaved(entry.id, entry.mistake, entry.skill, sessionMistakeCount.current)
      }
      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mistake')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingEntry(null)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--spacing-md)' }}>
        <LoadingSkeleton variant="text" width="200px" height="24px" />
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <LoadingSkeleton variant="card" height="80px" count={4} gap="var(--spacing-sm)" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--spacing-md)' }}>
        <ErrorDisplay title="Couldn't Load Mistakes" message={error} onRetry={loadEntries} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)' }}>
      <PageHeader
        icon={<IconMistakeReview size={22} />}
        title="Mistake Notebook"
        description="Track, review, and resolve mistakes across all IELTS skills"
        actions={
          <Button onClick={openCreateForm} size="lg">
            <IconAdd size={18} />
            Add Mistake
          </Button>
        }
      />

      <div style={{ display: 'grid', gap: 'var(--spacing-sm)', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        <Card padding="md">
          <CardContent>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>Total</p>
              <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>New</p>
              <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-danger)' }}>{stats.newCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>Reviewed</p>
              <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-warning)' }}>{stats.reviewed}</p>
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>Resolved</p>
              <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-success)' }}>{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
        <Card padding="md" tint="vocabulary">
          <CardContent>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                Most Repeated
              </p>
              <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: 'var(--color-info)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stats.mostRepeated
                  ? stats.mostRepeated.mistake.length > 20
                    ? stats.mostRepeated.mistake.slice(0, 20) + '...'
                    : stats.mostRepeated.mistake
                  : '—'}
              </p>
              {stats.mostRepeated && (
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--color-muted)' }}>
                  {stats.mostRepeated.repetitionCount}x repeated
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.skillRanking.length > 0 && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Mistakes by Skill</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gap: 'var(--spacing-sm)', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}>
              {(Object.keys(MISTAKE_LABELS) as MistakeSkill[]).map(skill => {
                const count = stats.bySkill[skill] ?? 0
                const maxCount = stats.skillRanking[0]?.[1] ?? 1
                const width = maxCount > 0 ? (count / maxCount) * 100 : 0
                const variant = SKILL_BADGE_VARIANTS[skill]
                return (
                  <div key={skill} style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{MISTAKE_LABELS[skill]}</p>
                    <div style={{ marginTop: 'var(--spacing-xs)', height: '8px', width: '100%', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-alt)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 'var(--radius-full)', background: `var(--color-skill-${variant})`, width: `${width}%`, transition: 'width var(--transition-slow)' }} />
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-muted)' }}>{count}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card padding="md">
        <CardContent>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div style={{ minWidth: '200px', flex: 1 }}>
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mistakes, corrections, explanations..."
                aria-label="Search mistakes"
              />
            </div>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value as MistakeSkill | '')}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '6px 12px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
              }}
              aria-label="Filter by skill"
            >
              <option value="">All Skills</option>
              {(Object.keys(MISTAKE_LABELS) as MistakeSkill[]).map(s => (
                <option key={s} value={s}>{MISTAKE_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MistakeStatus | '')}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '6px 12px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
              }}
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              {(Object.keys(STATUS_LABELS) as MistakeStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '6px 12px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
              }}
              aria-label="Sort by"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-repeated">Most Repeated</option>
              <option value="skill">Skill A-Z</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={<IconMistakes size={48} />}
          title={entries.length === 0 ? 'No mistakes recorded yet.' : 'No mistakes match your filters.'}
          description={entries.length === 0
            ? 'Start tracking your mistakes to identify weak points and improve.'
            : 'Try adjusting your search or filters.'}
          action={entries.length === 0 ? { label: 'Add Your First Mistake', onClick: openCreateForm } : undefined}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          {paginatedEntries.map(entry => (
            <Card key={entry.id} padding="md" hoverable>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--spacing-md)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Badge variant={SKILL_BADGE_VARIANTS[entry.skill]} size="xs" icon={SKILL_ICONS[entry.skill]}>
                      {MISTAKE_LABELS[entry.skill]}
                    </Badge>
                    <Badge variant={STATUS_BADGE_VARIANTS[entry.status]} size="xs">
                      {STATUS_LABELS[entry.status]}
                    </Badge>
                    {entry.repetitionCount > 0 && (
                      <Badge variant="default" size="xs">{entry.repetitionCount}x repeated</Badge>
                    )}
                  </div>
                  <button
                    onClick={() => setDetailEntry(entry)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 'var(--spacing-xs)', textAlign: 'left', display: 'block', width: '100%' }}
                  >
                    <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)' }}>
                      {entry.mistake}
                    </p>
                  </button>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <IconArrowRight size={12} style={{ display: 'inline', marginRight: '2px' }} />
                    {entry.correction}
                  </p>
                  <div style={{ marginTop: 'var(--spacing-xs)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    <span>{formatDate(entry.date)}</span>
                    {entry.source && <span>Source: {entry.source}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 'var(--spacing-2xs)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {(Object.keys(STATUS_LABELS) as MistakeStatus[]).map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(entry, s)}
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          padding: '1px 6px',
                          fontSize: '10px',
                          fontWeight: 'var(--weight-medium)',
                          border: 'none',
                          cursor: 'pointer',
                          background: entry.status === s ? `var(--color-${STATUS_BADGE_VARIANTS[s]}-light)` : 'transparent',
                          color: entry.status === s ? `var(--color-${STATUS_BADGE_VARIANTS[s]})` : 'var(--color-muted)',
                        }}
                        aria-label={`Mark as ${STATUS_LABELS[s]}`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleRepetitionIncrement(entry)}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-muted)',
                    }}
                    aria-label="Mark as repeated"
                    title="Mark this mistake as repeated"
                  >
                    <IconRefresh size={14} />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailEntry(entry)}
                    aria-label="View details"
                  >
                    <IconEye size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(entry)}
                    aria-label="Edit mistake"
                  >
                    <IconEdit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    aria-label="Delete mistake"
                  >
                    <IconDelete size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredEntries.length > pageSize && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', margin: 0 }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredEntries.length)} of {filteredEntries.length}
          </p>
          <Pagination page={page} totalPages={totalFilteredPages} onPageChange={setPage} />
        </div>
      )}

      <Modal open={!!detailEntry} onClose={() => setDetailEntry(null)} title="Mistake Details" size="lg">
        {detailEntry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxHeight: '70vh', overflowY: 'auto', paddingRight: 'var(--spacing-xs)' }}>
            <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                  Skill
                </p>
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                  <Badge variant={SKILL_BADGE_VARIANTS[detailEntry.skill]} size="sm">
                    {MISTAKE_LABELS[detailEntry.skill]}
                  </Badge>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                  Status
                </p>
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                  <Badge variant={STATUS_BADGE_VARIANTS[detailEntry.status]} size="sm">
                    {STATUS_LABELS[detailEntry.status]}
                  </Badge>
                </div>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                  Date
                </p>
                <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{formatDate(detailEntry.date)}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                  Times Repeated
                </p>
                <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{detailEntry.repetitionCount}</p>
              </div>
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-danger)' }}>
                Mistake
              </p>
              <div style={{ marginTop: 'var(--spacing-xs)', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                {detailEntry.mistake}
              </div>
            </div>

            <div>
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-success)' }}>
                Correction
              </p>
              <div style={{ marginTop: 'var(--spacing-xs)', padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-lg)', background: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}>
                {detailEntry.correction}
              </div>
            </div>

            {detailEntry.explanation && (
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                  Explanation
                </p>
                <p style={{ margin: 'var(--spacing-xs) 0 0', whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {detailEntry.explanation}
                </p>
              </div>
            )}

            {detailEntry.source && (
              <div>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
                  Source
                </p>
                <p style={{ margin: 'var(--spacing-xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {detailEntry.source}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', paddingTop: 'var(--spacing-xs)' }}>
              <Button variant="outline" onClick={() => { setDetailEntry(null); openEditForm(detailEntry) }}>
                <IconEdit size={14} />
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDetailEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
        </Modal>

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingEntry ? 'Edit Mistake' : 'New Mistake'} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', maxHeight: '70vh', overflowY: 'auto', paddingRight: 'var(--spacing-xs)' }}>
          <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label htmlFor="mistake-skill" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
                Skill <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <select
                id="mistake-skill"
                value={form.skill}
                onChange={(e) => setForm(prev => ({ ...prev, skill: e.target.value as MistakeSkill }))}
                style={{
                  marginTop: 'var(--spacing-xs)',
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  padding: '8px 12px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                }}
              >
                {(Object.keys(MISTAKE_LABELS) as MistakeSkill[]).map(s => (
                  <option key={s} value={s}>{MISTAKE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mistake-status" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
                Status
              </label>
              <select
                id="mistake-status"
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as MistakeStatus }))}
                style={{
                  marginTop: 'var(--spacing-xs)',
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  padding: '8px 12px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                }}
              >
                {(Object.keys(STATUS_LABELS) as MistakeStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mistake-mistake" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
              Mistake <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              id="mistake-mistake"
              value={form.mistake}
              onChange={(e) => setForm(prev => ({ ...prev, mistake: e.target.value }))}
              rows={2}
              placeholder="What was the mistake?"
              style={{
                marginTop: 'var(--spacing-xs)',
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '8px 12px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label htmlFor="mistake-correction" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
              Correction <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              id="mistake-correction"
              value={form.correction}
              onChange={(e) => setForm(prev => ({ ...prev, correction: e.target.value }))}
              rows={2}
              placeholder="What is the correct version?"
              style={{
                marginTop: 'var(--spacing-xs)',
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '8px 12px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label htmlFor="mistake-explanation" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
              Explanation
            </label>
            <textarea
              id="mistake-explanation"
              value={form.explanation}
              onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
              rows={2}
              placeholder="Why was this a mistake? How to avoid it next time..."
              style={{
                marginTop: 'var(--spacing-xs)',
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                padding: '8px 12px',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 'var(--spacing-md)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <label htmlFor="mistake-source" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
                Source
              </label>
              <input
                id="mistake-source"
                type="text"
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                placeholder="e.g. Reading test 3, Writing task"
                style={{
                  marginTop: 'var(--spacing-xs)',
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  padding: '8px 12px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
            <div>
              <label htmlFor="mistake-date" style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
                Date
              </label>
              <input
                id="mistake-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                style={{
                  marginTop: 'var(--spacing-xs)',
                  width: '100%',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  padding: '8px 12px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', paddingTop: 'var(--spacing-xs)' }}>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingEntry ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
