import { useState, useEffect, useCallback, useMemo } from 'react'
import type { MockTestEntry } from '../models'
import { generateId } from '../utils'
import { DatabaseService } from '../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import PageHeader from '../components/layout/PageHeader'
import { IconTarget } from '@ielts/ui'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getBandColor(band: number): string {
  if (band >= 7) return 'text-green-600 dark:text-green-400'
  if (band >= 5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getSkillColor(skill: string): string {
  const colors: Record<string, string> = {
    listening: 'var(--color-primary)',
    reading: 'var(--color-success)',
    writing: 'var(--color-warning)',
    speaking: 'var(--color-danger)',
    overall: 'var(--color-primary)',
  }
  return colors[skill] ?? 'var(--color-muted)'
}

interface FormData {
  date: string
  listeningScore: number
  readingScore: number
  writingBand: number
  speakingBand: number
  overallBand: number
  notes: string
  weakAreas: string
  improvementPlan: string
}

const emptyForm: FormData = {
  date: new Date().toISOString().slice(0, 10),
  listeningScore: 0,
  readingScore: 0,
  writingBand: 0,
  speakingBand: 0,
  overallBand: 0,
  notes: '',
  weakAreas: '',
  improvementPlan: '',
}

export default function MockTests() {
  const [tests, setTests] = useState<MockTestEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'overall' | 'listening' | 'reading'>('date')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<MockTestEntry | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [detailTest, setDetailTest] = useState<MockTestEntry | null>(null)

  const loadTests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<MockTestEntry>('mockTests')
      setTests(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mock tests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTests()
  }, [loadTests])

  const filteredTests = useMemo(() => {
    let filtered = [...tests]
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(t =>
        t.notes.toLowerCase().includes(q) ||
        t.weakAreas.some(w => w.toLowerCase().includes(q)) ||
        t.improvementPlan.toLowerCase().includes(q)
      )
    }
    filtered.sort((a, b) => {
      if (sortBy === 'overall') return b.overallBand - a.overallBand
      if (sortBy === 'listening') return b.listeningScore - a.listeningScore
      if (sortBy === 'reading') return b.readingScore - a.readingScore
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    return filtered
  }, [tests, search, sortBy])

  const stats = useMemo(() => {
    const total = tests.length
    if (total === 0) return { total, avgOverall: 0, avgListening: 0, avgReading: 0, avgWriting: 0, avgSpeaking: 0, latest: null as MockTestEntry | null }
    const avgOverall = Math.round((tests.reduce((s, t) => s + t.overallBand, 0) / total) * 10) / 10
    const avgListening = Math.round((tests.reduce((s, t) => s + t.listeningScore, 0) / total) * 10) / 10
    const avgReading = Math.round((tests.reduce((s, t) => s + t.readingScore, 0) / total) * 10) / 10
    const avgWriting = Math.round((tests.reduce((s, t) => s + t.writingBand, 0) / total) * 10) / 10
    const avgSpeaking = Math.round((tests.reduce((s, t) => s + t.speakingBand, 0) / total) * 10) / 10
    const sorted = [...tests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return { total, avgOverall, avgListening, avgReading, avgWriting, avgSpeaking, latest: sorted[0] }
  }, [tests])

  const bandChart = useMemo(() => {
    const sorted = [...tests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sorted.map(t => ({
      date: formatDate(t.date),
      overall: t.overallBand,
      listening: t.listeningScore,
      reading: t.readingScore,
      writing: t.writingBand,
      speaking: t.speakingBand,
    }))
  }, [tests])

  function openCreateForm() {
    setEditingTest(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEditForm(test: MockTestEntry) {
    setEditingTest(test)
    setForm({
      date: test.date.slice(0, 10),
      listeningScore: test.listeningScore,
      readingScore: test.readingScore,
      writingBand: test.writingBand,
      speakingBand: test.speakingBand,
      overallBand: test.overallBand,
      notes: test.notes,
      weakAreas: test.weakAreas.join(', '),
      improvementPlan: test.improvementPlan,
    })
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await DatabaseService.remove('mockTests', id)
      setTests(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mock test')
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const dateValue = form.date ? new Date(form.date).toISOString() : now
      const weakAreas = form.weakAreas
        .split(',')
        .map(w => w.trim())
        .filter(Boolean)

      if (editingTest) {
        const updated: MockTestEntry = {
          ...editingTest,
          date: dateValue,
          listeningScore: form.listeningScore || 0,
          readingScore: form.readingScore || 0,
          writingBand: form.writingBand || 0,
          speakingBand: form.speakingBand || 0,
          overallBand: form.overallBand || 0,
          notes: form.notes.trim(),
          weakAreas,
          improvementPlan: form.improvementPlan.trim(),
        }
        await DatabaseService.put('mockTests', updated)
        setTests(prev => prev.map(t => t.id === updated.id ? updated : t))
      } else {
        const entry: MockTestEntry = {
          id: generateId(),
          date: dateValue,
          listeningScore: form.listeningScore || 0,
          readingScore: form.readingScore || 0,
          writingBand: form.writingBand || 0,
          speakingBand: form.speakingBand || 0,
          overallBand: form.overallBand || 0,
          notes: form.notes.trim(),
          weakAreas,
          improvementPlan: form.improvementPlan.trim(),
          createdAt: now,
        }
        await DatabaseService.add('mockTests', entry)
        setTests(prev => [...prev, entry])
      }
      setModalOpen(false)
      setEditingTest(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mock test')
    } finally {
      setSaving(false)
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingTest(null)
  }

  function calculateOverall(listening: number, reading: number, writing: number, speaking: number): number {
    return (listening + reading + writing + speaking) / 4
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
            <Button variant="secondary" className="mt-4" onClick={loadTests}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pt-4 sm:pt-6">
      <PageHeader
        icon={<IconTarget size={20} />}
        title="Mock Test Tracker"
        description="Track IELTS mock test results and monitor band progress over time"
        actions={
          <Button onClick={openCreateForm} size="lg">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Test Result
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Tests Taken</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Overall</p>
            <p className={`mt-1 text-2xl font-bold ${getBandColor(stats.avgOverall)}`}>
              {stats.avgOverall}
              <span className="ml-1 text-sm font-normal text-slate-400">/9</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Listening</p>
            <p className={`mt-1 text-2xl font-bold ${getBandColor(stats.avgListening)}`}>
              {stats.avgListening}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Reading</p>
            <p className={`mt-1 text-2xl font-bold ${getBandColor(stats.avgReading)}`}>
              {stats.avgReading}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Writing</p>
            <p className={`mt-1 text-2xl font-bold ${getBandColor(stats.avgWriting)}`}>
              {stats.avgWriting}
            </p>
          </CardContent>
        </Card>
      </div>

      {bandChart.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Band Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2" style={{ minHeight: 180, minWidth: bandChart.length * 50 }}>
                {bandChart.map((point, i) => (
                  <div key={i} className="flex flex-col items-center gap-1" style={{ minWidth: 48 }}>
                    <div className="flex items-end gap-0.5" style={{ height: 130 }}>
                      {(['overall', 'listening', 'reading', 'writing', 'speaking'] as const).map(skill => (
                        <div
                          key={skill}
                          className="w-2 rounded-t transition-all"
                          title={`${skill}: ${point[skill]}`}
                          style={{
                            height: `${Math.max(point[skill] * 13, 2)}%`,
                            backgroundColor: getSkillColor(skill),
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[48px] text-center leading-tight">
                      {point.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: getSkillColor('overall') }} />
                Overall
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: getSkillColor('listening') }} />
                Listening
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: getSkillColor('reading') }} />
                Reading
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: getSkillColor('writing') }} />
                Writing
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: getSkillColor('speaking') }} />
                Speaking
              </span>
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
                placeholder="Search notes, weak areas, improvement plans..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                aria-label="Search mock tests"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'overall' | 'listening' | 'reading')}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Sort by"
            >
              <option value="date">Newest First</option>
              <option value="overall">Highest Overall</option>
              <option value="listening">Highest Listening</option>
              <option value="reading">Highest Reading</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredTests.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {tests.length === 0 ? 'No mock test results yet.' : 'No tests match your filters.'}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {tests.length === 0
                  ? 'Add your first mock test result to start tracking band progress.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {tests.length === 0 && (
                <Button className="mt-4" size="sm" onClick={openCreateForm}>
                  Add Your First Test
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => setDetailTest(test)}
                    className="text-left"
                  >
                    <h3 className="text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
                      Mock Test — {formatDate(test.date)}
                    </h3>
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {([
                      { key: 'overall', label: 'Overall', value: test.overallBand },
                      { key: 'listening', label: 'L', value: test.listeningScore },
                      { key: 'reading', label: 'R', value: test.readingScore },
                      { key: 'writing', label: 'W', value: test.writingBand },
                      { key: 'speaking', label: 'S', value: test.speakingBand },
                    ] as const).map(s => (
                      <span
                        key={s.key}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          s.value >= 7
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : s.value >= 5
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {s.label} {s.value}
                      </span>
                    ))}
                  </div>
                  {test.weakAreas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {test.weakAreas.map((area, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                  {test.notes && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {test.notes}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailTest(test)}
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
                    onClick={() => openEditForm(test)}
                    aria-label="Edit test"
                    className="p-1.5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(test.id)}
                    aria-label="Delete test"
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

      <Modal open={!!detailTest} onClose={() => setDetailTest(null)} title="Mock Test Details" size="lg">
        {detailTest && (
          <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</span>
                <p className="mt-0.5 text-slate-900 dark:text-slate-100">{formatDate(detailTest.date)}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Overall Band</span>
                <p className={`mt-0.5 font-semibold ${getBandColor(detailTest.overallBand)}`}>
                  {detailTest.overallBand}/9
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Listening</span>
                <p className={`mt-0.5 font-medium ${getBandColor(detailTest.listeningScore)}`}>
                  {detailTest.listeningScore}/9
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Reading</span>
                <p className={`mt-0.5 font-medium ${getBandColor(detailTest.readingScore)}`}>
                  {detailTest.readingScore}/9
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Writing</span>
                <p className={`mt-0.5 font-medium ${getBandColor(detailTest.writingBand)}`}>
                  {detailTest.writingBand}/9
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Speaking</span>
                <p className={`mt-0.5 font-medium ${getBandColor(detailTest.speakingBand)}`}>
                  {detailTest.speakingBand}/9
                </p>
              </div>
            </div>
            {detailTest.weakAreas.length > 0 && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Weak Areas</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {detailTest.weakAreas.map((area, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {detailTest.notes && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</span>
                <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{detailTest.notes}</p>
              </div>
            )}
            {detailTest.improvementPlan && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Improvement Plan</span>
                <div className="mt-1 rounded-lg bg-blue-50 px-4 py-3 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  {detailTest.improvementPlan}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setDetailTest(null); openEditForm(detailTest) }}>
                Edit
              </Button>
              <Button variant="secondary" onClick={() => setDetailTest(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={handleCloseModal} title={editingTest ? 'Edit Mock Test' : 'New Mock Test'} size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="test-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Test Date <span className="text-red-500">*</span>
              </label>
              <input
                id="test-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label htmlFor="test-overall" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Overall Band <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="test-overall"
                  type="number"
                  min="0"
                  max="9"
                  step="0.5"
                  value={form.overallBand}
                  onChange={(e) => setForm(prev => ({ ...prev, overallBand: Math.max(0, Math.min(9, parseFloat(e.target.value) || 0)) }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
                <span className="mt-1 text-xs text-slate-400 shrink-0">/9</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="test-listening" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Listening
              </label>
              <input
                id="test-listening"
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={form.listeningScore}
                onChange={(e) => setForm(prev => ({ ...prev, listeningScore: Math.max(0, Math.min(9, parseFloat(e.target.value) || 0)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="test-reading" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Reading
              </label>
              <input
                id="test-reading"
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={form.readingScore}
                onChange={(e) => setForm(prev => ({ ...prev, readingScore: Math.max(0, Math.min(9, parseFloat(e.target.value) || 0)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="test-writing" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Writing
              </label>
              <input
                id="test-writing"
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={form.writingBand}
                onChange={(e) => setForm(prev => ({ ...prev, writingBand: Math.max(0, Math.min(9, parseFloat(e.target.value) || 0)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="test-speaking" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Speaking
              </label>
              <input
                id="test-speaking"
                type="number"
                min="0"
                max="9"
                step="0.5"
                value={form.speakingBand}
                onChange={(e) => setForm(prev => ({ ...prev, speakingBand: Math.max(0, Math.min(9, parseFloat(e.target.value) || 0)) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Calculated Overall: <span className={`font-bold ${getBandColor(
                (form.listeningScore + form.readingScore + form.writingBand + form.speakingBand) / 4
              )}`}>
                {calculateOverall(form.listeningScore, form.readingScore, form.writingBand, form.speakingBand)}
              </span> /9
            </label>
          </div>

          <div>
            <label htmlFor="test-weak-areas" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Weak Areas (comma-separated)
            </label>
            <input
              id="test-weak-areas"
              type="text"
              value={form.weakAreas}
              onChange={(e) => setForm(prev => ({ ...prev, weakAreas: e.target.value }))}
              placeholder="e.g. Matching Headings, Multiple Choice, Task 1"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label htmlFor="test-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              id="test-notes"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="General notes about this test..."
            />
          </div>

          <div>
            <label htmlFor="test-plan" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Improvement Plan
            </label>
            <textarea
              id="test-plan"
              value={form.improvementPlan}
              onChange={(e) => setForm(prev => ({ ...prev, improvementPlan: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
              placeholder="What to focus on for next test..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.date || form.overallBand === 0}>
              {editingTest ? 'Save Changes' : 'Create Entry'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
