import { useState, useEffect, useCallback, useMemo } from 'react'
import type { GrammarNote, GrammarStatus } from '../models'
import { generateId } from '../utils'
import { DatabaseService } from '../services/storage/Database'
import { useToast } from '../components/ui/Toast'
import Card, { CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const RELATED_SKILLS = ['reading', 'listening', 'writing', 'speaking'] as const

const GRAMMAR_TOPICS = [
  'Tenses', 'Articles', 'Prepositions', 'Conditionals', 'Modal Verbs',
  'Passive Voice', 'Relative Clauses', 'Reported Speech', 'Gerunds & Infinitives',
  'Subject-Verb Agreement', 'Comparatives & Superlatives', 'Quantifiers',
  'Linking Words', 'Punctuation', 'Word Order', 'Phrasal Verbs',
  'Collocations', 'Sentence Structure', 'Pronouns', 'Adjectives & Adverbs',
]

const STATUS_OPTIONS: { value: GrammarStatus; label: string; color: string }[] = [
  { value: 'weak', label: 'Weak', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'reviewing', label: 'Reviewing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'mastered', label: 'Mastered', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
]

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getStatusStyle(status: GrammarStatus): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.color ?? ''
}

interface NoteFormData {
  topic: string
  explanation: string
  exampleSentences: string
  commonMistakes: string
  correctedExamples: string
  personalNote: string
  relatedSkill: string
  status: GrammarStatus
}

const emptyForm: NoteFormData = {
  topic: '',
  explanation: '',
  exampleSentences: '',
  commonMistakes: '',
  correctedExamples: '',
  personalNote: '',
  relatedSkill: '',
  status: 'weak',
}

export default function GrammarNotes() {
  const { showToast } = useToast()

  const [notes, setNotes] = useState<GrammarNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<GrammarStatus | ''>('')
  const [skillFilter, setSkillFilter] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'topic' | 'status'>('date')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<GrammarNote | null>(null)
  const [form, setForm] = useState<NoteFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailNote, setDetailNote] = useState<GrammarNote | null>(null)

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<GrammarNote>('grammarNotes')
      setNotes(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grammar notes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const filteredNotes = useMemo(() => {
    let filtered = [...notes]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(n =>
        n.topic.toLowerCase().includes(q) ||
        n.explanation.toLowerCase().includes(q) ||
        n.exampleSentences.some(s => s.toLowerCase().includes(q)) ||
        n.commonMistakes.some(s => s.toLowerCase().includes(q)) ||
        n.personalNote.toLowerCase().includes(q)
      )
    }
    if (statusFilter) {
      filtered = filtered.filter(n => n.status === statusFilter)
    }
    if (skillFilter) {
      filtered = filtered.filter(n => n.relatedSkill === skillFilter)
    }
    filtered.sort((a, b) => {
      if (sortBy === 'topic') return a.topic.localeCompare(b.topic)
      if (sortBy === 'status') {
        const order = ['weak', 'reviewing', 'mastered']
        return order.indexOf(a.status) - order.indexOf(b.status)
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
    return filtered
  }, [notes, search, statusFilter, skillFilter, sortBy])

  const stats = useMemo(() => {
    const total = notes.length
    const mastered = notes.filter(n => n.status === 'mastered').length
    const reviewing = notes.filter(n => n.status === 'reviewing').length
    const weak = notes.filter(n => n.status === 'weak').length
    const topicsLearned = new Set(notes.map(n => n.topic)).size
    return { total, mastered, reviewing, weak, topicsLearned }
  }, [notes])

  function openCreateForm() {
    setEditingNote(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditForm(note: GrammarNote) {
    setEditingNote(note)
    setForm({
      topic: note.topic,
      explanation: note.explanation,
      exampleSentences: note.exampleSentences.join('\n---\n'),
      commonMistakes: note.commonMistakes.join('\n---\n'),
      correctedExamples: note.correctedExamples.join('\n---\n'),
      personalNote: note.personalNote,
      relatedSkill: note.relatedSkill,
      status: note.status,
    })
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    const note = notes.find(n => n.id === id)
    await DatabaseService.remove('grammarNotes', id)
    setNotes(prev => prev.filter(n => n.id !== id))
    showToast('info', note ? `"${note.topic}" deleted` : 'Grammar note deleted')
  }

  async function handleStatusChange(note: GrammarNote, status: GrammarStatus) {
    const updated: GrammarNote = {
      ...note,
      status,
      updatedAt: new Date().toISOString(),
    }
    await DatabaseService.put('grammarNotes', updated)
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
    showToast('success', `"${note.topic}" marked as ${status}`)
  }

  function parseLines(value: string): string[] {
    return value.split('\n---\n').map(s => s.trim()).filter(Boolean)
  }

  async function handleSave() {
    if (!form.topic.trim() || !form.explanation.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const exampleSentences = parseLines(form.exampleSentences)
      const commonMistakes = parseLines(form.commonMistakes)
      const correctedExamples = parseLines(form.correctedExamples)

      const label = form.topic.trim()
      if (editingNote) {
        const updated: GrammarNote = {
          ...editingNote,
          topic: label,
          explanation: form.explanation.trim(),
          exampleSentences,
          commonMistakes,
          correctedExamples,
          personalNote: form.personalNote,
          relatedSkill: form.relatedSkill,
          status: form.status,
          updatedAt: now,
        }
        await DatabaseService.put('grammarNotes', updated)
        setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
        showToast('success', `"${label}" updated`)
      } else {
        const note: GrammarNote = {
          id: generateId(),
          topic: label,
          explanation: form.explanation.trim(),
          exampleSentences,
          commonMistakes,
          correctedExamples,
          personalNote: form.personalNote,
          relatedSkill: form.relatedSkill,
          status: form.status,
          createdAt: now,
          updatedAt: now,
        }
        await DatabaseService.add('grammarNotes', note)
        setNotes(prev => [...prev, note])
        showToast('success', `"${label}" added`)
      }
      setModalOpen(false)
      setEditingNote(null)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save grammar note')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingNote(null)
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
            <Button variant="secondary" className="mt-4" onClick={loadNotes}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Grammar Notebook
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track grammar topics, explanations, example sentences, and common mistakes
          </p>
        </div>
        <Button onClick={openCreateForm} size="lg">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Note
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Topics
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.topicsLearned}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mastered
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.mastered}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Reviewing
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.reviewing}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Weak Areas
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.weak}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search grammar notes..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                aria-label="Search grammar notes"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as GrammarStatus | '')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Filter by skill"
            >
              <option value="">All Skills</option>
              {RELATED_SKILLS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'topic' | 'status')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Sort by"
            >
              <option value="date">Last Updated</option>
              <option value="topic">Topic A-Z</option>
              <option value="status">Status</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {notes.length === 0
                  ? 'No grammar notes yet.'
                  : 'No notes match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {notes.length === 0
                  ? 'Add your first grammar note to start building your knowledge.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {notes.length === 0 && (
                <Button className="mt-4" size="sm" onClick={openCreateForm}>
                  Add Your First Note
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(note.status)}`}>
                      {STATUS_OPTIONS.find(s => s.value === note.status)?.label}
                    </span>
                    {note.relatedSkill && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {note.relatedSkill.charAt(0).toUpperCase() + note.relatedSkill.slice(1)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setDetailNote(note)}
                    className="mt-1 text-left"
                  >
                    <h3 className="text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                      {note.topic}
                    </h3>
                  </button>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {note.explanation}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatDate(note.updatedAt)}</span>
                    <span>{note.exampleSentences.length} example{note.exampleSentences.length !== 1 ? 's' : ''}</span>
                    {note.commonMistakes.length > 0 && (
                      <span className="text-red-500">{note.commonMistakes.length} mistake{note.commonMistakes.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex flex-col gap-0.5">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => handleStatusChange(note, s.value)}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                          note.status === s.value
                            ? s.color
                            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                        }`}
                        aria-label={`Mark as ${s.label}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailNote(note)}
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
                    onClick={() => openEditForm(note)}
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
                    onClick={() => handleDelete(note.id)}
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
          ))}
        </div>
      )}

      <Modal open={!!detailNote} onClose={() => setDetailNote(null)} title={detailNote?.topic ?? ''} size="lg">
        {detailNote && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </span>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(detailNote.status)}`}>
                    {STATUS_OPTIONS.find(s => s.value === detailNote.status)?.label}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Related Skill
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{detailNote.relatedSkill || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Created
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDate(detailNote.createdAt)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Last Updated
                </span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDate(detailNote.updatedAt)}</p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Explanation
              </span>
              <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {detailNote.explanation}
              </p>
            </div>
            {detailNote.exampleSentences.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Example Sentences
                </span>
                <ul className="mt-1 space-y-1.5">
                  {detailNote.exampleSentences.map((s, i) => (
                    <li key={i} className="rounded-lg bg-blue-50 px-3 py-2 text-slate-700 dark:bg-blue-900/20 dark:text-slate-300">
                      "{s}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailNote.commonMistakes.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Common Mistakes
                </span>
                <ul className="mt-1 space-y-1.5">
                  {detailNote.commonMistakes.map((m, i) => (
                    <li key={i} className="rounded-lg bg-red-50 px-3 py-2 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                      ✗ {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailNote.correctedExamples.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Corrected Examples
                </span>
                <ul className="mt-1 space-y-1.5">
                  {detailNote.correctedExamples.map((c, i) => (
                    <li key={i} className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      ✓ {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detailNote.personalNote && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Personal Note
                </span>
                <p className="mt-0.5 whitespace-pre-wrap italic text-slate-600 dark:text-slate-400">
                  {detailNote.personalNote}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setDetailNote(null); openEditForm(detailNote) }}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDetailNote(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingNote ? 'Edit Grammar Note' : 'New Grammar Note'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="grammar-topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Grammar Topic <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  id="grammar-topic-select"
                  value={GRAMMAR_TOPICS.includes(form.topic) ? form.topic : ''}
                  onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <option value="">Select a topic...</option>
                  {GRAMMAR_TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  id="grammar-topic"
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Or type custom topic..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="grammar-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Status
              </label>
              <select
                id="grammar-status"
                value={form.status}
                onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as GrammarStatus }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="grammar-skill" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Related IELTS Skill
              </label>
              <select
                id="grammar-skill"
                value={form.relatedSkill}
                onChange={(e) => setForm(prev => ({ ...prev, relatedSkill: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="">None</option>
                {RELATED_SKILLS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="grammar-explanation" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              id="grammar-explanation"
              value={form.explanation}
              onChange={(e) => setForm(prev => ({ ...prev, explanation: e.target.value }))}
              rows={4}
              placeholder="Explain this grammar rule clearly..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
          </div>
          <div>
            <label htmlFor="grammar-examples" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Example Sentences
            </label>
            <textarea
              id="grammar-examples"
              value={form.exampleSentences}
              onChange={(e) => setForm(prev => ({ ...prev, exampleSentences: e.target.value }))}
              rows={3}
              placeholder="Each on its own line. Use --- to separate examples."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Separate each example with --- on its own line
            </p>
          </div>
          <div>
            <label htmlFor="grammar-mistakes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Common Mistakes
            </label>
            <textarea
              id="grammar-mistakes"
              value={form.commonMistakes}
              onChange={(e) => setForm(prev => ({ ...prev, commonMistakes: e.target.value }))}
              rows={2}
              placeholder="Separate each mistake with --- on its own line"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
          </div>
          <div>
            <label htmlFor="grammar-corrected" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Corrected Examples
            </label>
            <textarea
              id="grammar-corrected"
              value={form.correctedExamples}
              onChange={(e) => setForm(prev => ({ ...prev, correctedExamples: e.target.value }))}
              rows={2}
              placeholder="Separate each corrected example with --- on its own line"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
          </div>
          <div>
            <label htmlFor="grammar-note" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Personal Note
            </label>
            <textarea
              id="grammar-note"
              value={form.personalNote}
              onChange={(e) => setForm(prev => ({ ...prev, personalNote: e.target.value }))}
              rows={2}
              placeholder="Your personal notes or quiz notes about this grammar topic..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingNote ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
