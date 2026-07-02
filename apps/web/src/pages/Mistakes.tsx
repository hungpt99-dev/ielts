import { useState, useEffect, useCallback, useMemo } from 'react'
import type { MistakeEntry, MistakeSkill, MistakeStatus } from '../models'
import { DatabaseService } from '../services/storage/Database'
import Card, { CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { generateId } from '../utils'
import ErrorDisplay from '../components/ui/ErrorDisplay'
import { useToast } from '../components/ui/Toast'

const MISTAKE_SKILLS: { value: MistakeSkill; label: string; color: string }[] = [
  { value: 'vocabulary', label: 'Vocabulary', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { value: 'grammar', label: 'Grammar', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'reading', label: 'Reading', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  { value: 'listening', label: 'Listening', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'writing', label: 'Writing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'speaking', label: 'Speaking', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
]

const STATUS_OPTIONS: { value: MistakeStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
]

const SORT_OPTIONS = ['newest', 'oldest', 'most-repeated', 'skill'] as const
type SortOption = typeof SORT_OPTIONS[number]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getSkillStyle(skill: MistakeSkill): string {
  return MISTAKE_SKILLS.find(s => s.value === skill)?.color ?? ''
}

function getStatusStyle(status: MistakeStatus): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.color ?? ''
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
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={loadEntries} />
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Mistake Notebook
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track, review, and resolve mistakes across all IELTS skills
          </p>
        </div>
        <Button onClick={openCreateForm} size="lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Mistake
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">New</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.newCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Reviewed</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.reviewed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Most Repeated
            </p>
            <p className="mt-1 text-lg font-bold text-violet-600 dark:text-violet-400 truncate">
              {stats.mostRepeated
                ? stats.mostRepeated.mistake.length > 20
                  ? stats.mostRepeated.mistake.slice(0, 20) + '...'
                  : stats.mostRepeated.mistake
                : '—'}
            </p>
            {stats.mostRepeated && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {stats.mostRepeated.repetitionCount}x repeated
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.skillRanking.length > 0 && (
        <Card>
          <CardContent>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mistakes by Skill
            </p>
            <div className="grid gap-2 sm:grid-cols-6">
              {MISTAKE_SKILLS.map(skill => {
                const count = stats.bySkill[skill.value] ?? 0
                const maxCount = stats.skillRanking[0]?.[1] ?? 1
                const width = maxCount > 0 ? (count / maxCount) * 100 : 0
                return (
                  <div key={skill.value} className="text-center">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{skill.label}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-2 rounded-full transition-all ${skill.color.split(' ')[0]}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{count}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mistakes, corrections, explanations..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                aria-label="Search mistakes"
              />
            </div>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value as MistakeSkill | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by skill"
            >
              <option value="">All Skills</option>
              {MISTAKE_SKILLS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MistakeStatus | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {entries.length === 0 ? 'No mistakes recorded yet.' : 'No mistakes match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {entries.length === 0
                  ? 'Start tracking your mistakes to identify weak points and improve.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {entries.length === 0 && (
                <Button className="mt-4" size="sm" onClick={openCreateForm}>
                  Add Your First Mistake
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getSkillStyle(entry.skill)}`}>
                      {MISTAKE_SKILLS.find(s => s.value === entry.skill)?.label}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(entry.status)}`}>
                      {STATUS_OPTIONS.find(s => s.value === entry.status)?.label}
                    </span>
                    {entry.repetitionCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {entry.repetitionCount}x repeated
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setDetailEntry(entry)}
                    className="mt-1 text-left"
                  >
                    <p className="text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                      {entry.mistake}
                    </p>
                  </button>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    → {entry.correction}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatDate(entry.date)}</span>
                    {entry.source && <span>Source: {entry.source}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex flex-col gap-0.5">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusChange(entry, s.value)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          entry.status === s.value
                            ? s.color
                            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                        aria-label={`Mark as ${s.label}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleRepetitionIncrement(entry)}
                    className="rounded p-1.5 text-slate-400 transition-colors hover:text-violet-600 dark:text-slate-500 dark:hover:text-violet-400"
                    aria-label="Mark as repeated"
                    title="Mark this mistake as repeated"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailEntry(entry)}
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
                    onClick={() => openEditForm(entry)}
                    aria-label="Edit mistake"
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
                    aria-label="Delete mistake"
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

      <Modal open={!!detailEntry} onClose={() => setDetailEntry(null)} title="Mistake Details" size="lg">
        {detailEntry && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Skill
                </span>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getSkillStyle(detailEntry.skill)}`}>
                    {MISTAKE_SKILLS.find(s => s.value === detailEntry.skill)?.label}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </span>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(detailEntry.status)}`}>
                    {STATUS_OPTIONS.find(s => s.value === detailEntry.status)?.label}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Date
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDate(detailEntry.date)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Times Repeated
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{detailEntry.repetitionCount}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-red-500 dark:text-red-400">
                Mistake
              </span>
              <div className="mt-1 rounded-lg bg-red-50 px-4 py-3 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {detailEntry.mistake}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                Correction
              </span>
              <div className="mt-1 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                {detailEntry.correction}
              </div>
            </div>

            {detailEntry.explanation && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Explanation
                </span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {detailEntry.explanation}
                </p>
              </div>
            )}

            {detailEntry.source && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Source
                </span>
                <p className="mt-0.5 text-slate-700 dark:text-slate-300">
                  {detailEntry.source}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setDetailEntry(null); openEditForm(detailEntry) }}>
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mistake-skill" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Skill <span className="text-red-500">*</span>
              </label>
              <select
                id="mistake-skill"
                value={form.skill}
                onChange={(e) => setForm(prev => ({ ...prev, skill: e.target.value as MistakeSkill }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {MISTAKE_SKILLS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mistake-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                id="mistake-status"
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as MistakeStatus }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mistake-mistake" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Mistake <span className="text-red-500">*</span>
            </label>
            <textarea
              id="mistake-mistake"
              value={form.mistake}
              onChange={(e) => setForm(prev => ({ ...prev, mistake: e.target.value }))}
              rows={2}
              placeholder="What was the mistake?"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label htmlFor="mistake-correction" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Correction <span className="text-red-500">*</span>
            </label>
            <textarea
              id="mistake-correction"
              value={form.correction}
              onChange={(e) => setForm(prev => ({ ...prev, correction: e.target.value }))}
              rows={2}
              placeholder="What is the correct version?"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label htmlFor="mistake-explanation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Explanation
            </label>
            <textarea
              id="mistake-explanation"
              value={form.explanation}
              onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
              rows={2}
              placeholder="Why was this a mistake? How to avoid it next time..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mistake-source" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Source
              </label>
              <input
                id="mistake-source"
                type="text"
                value={form.source}
                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                placeholder="e.g. Reading test 3, Writing task"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
              />
            </div>
            <div>
              <label htmlFor="mistake-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
              </label>
              <input
                id="mistake-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>
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
    </div>
  )
}
