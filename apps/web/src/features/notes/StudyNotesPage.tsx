import { useState, useEffect, useCallback, useMemo } from 'react'
import type { StudyNote } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { useAutosave } from '../../hooks/useAutosave'
import { generateId } from '../../utils'
import PageHeader from '../../components/layout/PageHeader'
import { IconBookText } from '@ielts/ui'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]

const SKILL_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
  { value: 'writing', label: 'Writing' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'general', label: 'General' },
]

const NOTE_COLORS = [
  { value: 'default', label: 'Default', bg: 'bg-slate-100 dark:bg-slate-700', border: 'border-slate-200 dark:border-slate-600' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { value: 'green', label: 'Green', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
]

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface NoteFormData {
  title: string
  content: string
  topic: string
  skill: string
  tags: string
  isDraft: boolean
}

const emptyForm: NoteFormData = {
  title: '',
  content: '',
  topic: '',
  skill: '',
  tags: '',
  isDraft: false,
}

export default function StudyNotesPage() {
  const { showToast } = useToast()

  const [entries, setEntries] = useState<StudyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [view, setView] = useState<'all' | 'favorites' | 'drafts'>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<StudyNote | null>(null)
  const [form, setForm] = useState<NoteFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<StudyNote>('studyNotes')
      setEntries(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const e of entries) {
      for (const t of e.tags) tags.add(t)
    }
    return Array.from(tags).sort()
  }, [entries])

  const favorites = useMemo(() => entries.filter(e => e.isFavorite), [entries])
  const draftEntries = useMemo(() => entries.filter(e => e.isDraft), [entries])

  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (view === 'favorites') {
      filtered = filtered.filter(e => e.isFavorite)
    } else if (view === 'drafts') {
      filtered = filtered.filter(e => e.isDraft)
    }

    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.title.toLowerCase().includes(query) ||
          e.content.toLowerCase().includes(query) ||
          e.topic.toLowerCase().includes(query) ||
          e.skill.toLowerCase().includes(query)
      )
    }

    if (topicFilter) {
      filtered = filtered.filter(e => e.topic === topicFilter)
    }

    if (skillFilter) {
      filtered = filtered.filter(e => e.skill === skillFilter)
    }

    if (tagFilter) {
      filtered = filtered.filter(e => e.tags.includes(tagFilter))
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [entries, search, topicFilter, skillFilter, tagFilter, view])

  const stats = useMemo(() => {
    const total = entries.length
    const drafted = entries.filter(e => e.isDraft).length
    const favorited = entries.filter(e => e.isFavorite).length
    const topics = new Set(entries.map(e => e.topic).filter(Boolean)).size
    return { total, drafted, favorited, topics }
  }, [entries])

  function validateForm(data: NoteFormData): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!data.title.trim()) errors.title = 'Title is required'
    return errors
  }

  function openCreateForm() {
    setEditingEntry(null)
    setForm(emptyForm)
    setFormErrors({})
    setModalOpen(true)
  }

  function openEditForm(entry: StudyNote) {
    setEditingEntry(entry)
    setForm({
      title: entry.title,
      content: entry.content,
      topic: entry.topic,
      skill: entry.skill,
      tags: entry.tags.join(', '),
      isDraft: entry.isDraft,
    })
    setFormErrors({})
    setModalOpen(true)
  }

  async function handleSave() {
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const entry: StudyNote = {
        id: editingEntry?.id ?? generateId(),
        title: form.title.trim(),
        content: form.content.trim(),
        topic: form.topic,
        skill: form.skill,
        tags: parseList(form.tags),
        isFavorite: editingEntry?.isFavorite ?? false,
        isDraft: form.isDraft,
        createdAt: editingEntry?.createdAt ?? now,
        updatedAt: now,
      }

      const table = 'studyNotes' as const
      if (editingEntry) {
        await DatabaseService.put(table, entry)
        setEntries(prev => prev.map(e => e.id === entry.id ? entry : e))
        showToast('success', 'Study note updated')
      } else {
        await DatabaseService.add(table, entry)
        setEntries(prev => [...prev, entry])
        showToast('success', 'Study note added')
      }

      setModalOpen(false)
      setEditingEntry(null)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save study note')
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: string) {
    DatabaseService.remove('studyNotes', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    showToast('info', 'Study note deleted')
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingEntry(null)
    setFormErrors({})
  }

  async function toggleFavorite(entry: StudyNote) {
    const updated: StudyNote = { ...entry, isFavorite: !entry.isFavorite, updatedAt: new Date().toISOString() }
    await DatabaseService.put('studyNotes', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  async function toggleDraft(entry: StudyNote) {
    const updated: StudyNote = { ...entry, isDraft: !entry.isDraft, updatedAt: new Date().toISOString() }
    await DatabaseService.put('studyNotes', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    showToast('info', updated.isDraft ? 'Marked as draft' : 'Published')
  }

  const autosaveContent = useCallback(async (content: string) => {
    const now = new Date().toISOString()
    if (editingEntry) {
      const updated: StudyNote = { ...editingEntry, content, updatedAt: now }
      await DatabaseService.put('studyNotes', updated)
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      setEditingEntry(updated)
      showToast('info', 'Draft autosaved')
    } else if (form.title.trim()) {
      const note: StudyNote = {
        id: generateId(),
        title: form.title.trim(),
        content,
        topic: form.topic,
        skill: form.skill,
        tags: parseList(form.tags),
        isFavorite: false,
        isDraft: true,
        createdAt: now,
        updatedAt: now,
      }
      await DatabaseService.add('studyNotes', note)
      setEntries(prev => [...prev, note])
      setEditingEntry(note)
      showToast('info', 'Draft autosaved')
    }
  }, [editingEntry, form.title, form.topic, form.skill, form.tags, showToast])

  const autosaveTitle = useCallback(async (title: string) => {
    if (!editingEntry || !title.trim()) return
    const updated: StudyNote = { ...editingEntry, title: title.trim(), updatedAt: new Date().toISOString() }
    await DatabaseService.put('studyNotes', updated)
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingEntry(updated)
  }, [editingEntry])

  useAutosave(form.content, autosaveContent)
  useAutosave(form.title, autosaveTitle)

  function parseList(value: string): string[] {
    return value
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean)
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
            <Button variant="secondary" className="mt-4" onClick={loadEntries}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        icon={<IconBookText size={22} />}
        title="Study Notes"
        description="Write and organize your IELTS study notes, drafts, and ideas"
        actions={
          <Button onClick={openCreateForm} size="lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Notes</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Topics</p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.topics}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Drafts</p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.drafted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Favorites</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.favorited}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
        {[
          { key: 'all' as const, label: 'All Notes', count: entries.length },
          { key: 'favorites' as const, label: 'Favorites', count: favorites.length },
          { key: 'drafts' as const, label: 'Drafts', count: draftEntries.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setView(t.key); setTopicFilter(''); setSkillFilter(''); setTagFilter(''); setSearch('') }}
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
              <label htmlFor="notes-search" className="sr-only">Search</label>
              <input
                id="notes-search"
                type="text"
                placeholder="Search notes by title, content, topic..."
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
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by skill"
            >
              {SKILL_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
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
            {(search || topicFilter || skillFilter || tagFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setTopicFilter('')
                  setSkillFilter('')
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          }
          title={entries.length === 0 ? 'No study notes yet.' : 'No notes match your filters.'}
          description={entries.length === 0 ? 'Create your first study note to organize your IELTS learning.' : 'Try adjusting your search or filters.'}
          action={entries.length === 0 ? { label: 'Create Your First Note', onClick: openCreateForm } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredEntries.map(entry => {
            const colorStyle = NOTE_COLORS.find(c => c.value === 'default')
            return (
              <div
                key={entry.id}
                className={`rounded-lg border p-4 transition-colors hover:border-slate-300 dark:hover:border-slate-500 ${colorStyle?.bg} ${colorStyle?.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.isDraft && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Draft
                        </span>
                      )}
                      {entry.skill && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {SKILL_OPTIONS.find(s => s.value === entry.skill)?.label}
                        </span>
                      )}
                      {entry.topic && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          {entry.topic}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {entry.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {entry.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      {formatDateTime(entry.updatedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => toggleFavorite(entry)}
                        className={`rounded p-1 transition-colors hover:scale-110 ${
                          entry.isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'
                        }`}
                        aria-label={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        title={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg className="h-4 w-4" fill={entry.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleDraft(entry)}
                        className={`rounded p-1 transition-colors hover:scale-110 ${
                          entry.isDraft ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                        }`}
                        aria-label={entry.isDraft ? 'Publish note' : 'Mark as draft'}
                        title={entry.isDraft ? 'Publish note' : 'Mark as draft'}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(entry)}
                        aria-label="Edit note"
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
                        aria-label="Delete note"
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
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingEntry ? 'Edit Study Note' : 'New Study Note'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="note-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="note-title"
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 ${formErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600'}`}
                placeholder="e.g., IELTS Writing Task 2 Structure"
              />
              {formErrors.title && <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>}
              {editingEntry && (
                <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  Title is autosaved when editing
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="note-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                IELTS Topic
              </label>
              <select
                id="note-topic"
                value={form.topic}
                onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="">None</option>
                {IELTS_TOPICS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="note-skill" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Related Skill
              </label>
              <select
                id="note-skill"
                value={form.skill}
                onChange={e => setForm(prev => ({ ...prev, skill: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {SKILL_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="note-tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tags (comma-separated)
            </label>
            <input
              id="note-tags"
              type="text"
              value={form.tags}
              onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="structure, tips, task2"
            />
          </div>

          <div>
            <label htmlFor="note-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Content (autosaved)
            </label>
            <textarea
              id="note-content"
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              rows={10}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 font-mono"
              placeholder="Write your study notes here... Content is automatically saved as you type."
            />
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
              Content is automatically saved as a draft while you type
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="note-draft"
              type="checkbox"
              checked={form.isDraft}
              onChange={e => setForm(prev => ({ ...prev, isDraft: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="note-draft" className="text-sm text-slate-700 dark:text-slate-300">
              Save as draft
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
              {editingEntry ? 'Save Changes' : 'Save Note'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
