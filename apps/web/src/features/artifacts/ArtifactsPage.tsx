import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorNavigation } from '../../hooks/useTutorNavigation'
import { ROUTES } from '@ielts/config'
import type { Artifact, ArtifactCategory, VocabularyEntry } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { EmptyStateIllustrated, ErrorState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { SearchInput } from '../../components/ui/SearchInput'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import { generateQuestionsForPassage } from '../../services/ai/AIService'
import { extractVocabulary, getStoredAiConfig } from '../../features/publicApiIntegration/ai'
import { IconSavedContent, IconAITutor, IconEdit, IconRefresh, IconVocabulary, IconReading, IconUpload } from '@ielts/ui'

const CATEGORY_LABELS: Record<ArtifactCategory, string> = {
  article: 'Article',
  video: 'Video',
  reference: 'Reference',
  tool: 'Tool',
  other: 'Other',
  note: 'Note',
}

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health',
  'Culture', 'Economy', 'Science', 'Society',
  'Politics', 'Media', 'Arts', 'History',
]

const IELTS_SKILLS = ['reading', 'listening', 'writing', 'speaking', 'grammar', 'vocabulary', 'general']

const READING_STATUSES = ['unread', 'in_progress', 'completed', 'saved_for_later']

const CONTENT_TYPES = ['article', 'text', 'note', 'video', 'reference', 'tool', 'other']

interface ArtifactWithDetails extends Artifact {
  contentType?: string
  contentText?: string
  ieltsTopic?: string
  skill?: string
  difficulty?: string
  readingStatus?: string
  personalNote?: string
  wordCount?: number
  lastOpenedAt?: string
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function extractFavicon(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return `${u.protocol}//${u.hostname}/favicon.ico`
  } catch {
    return ''
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    article: 'var(--color-primary)',
    text: 'var(--color-success)',
    note: 'var(--color-warning)',
    video: 'var(--color-skill-reading)',
    reference: 'var(--color-skill-listening)',
    tool: 'var(--color-skill-writing)',
  }
  return map[type] || 'var(--color-muted)'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    unread: 'Unread',
    in_progress: 'In Progress',
    completed: 'Completed',
    saved_for_later: 'Saved for Later',
  }
  return map[status] || status
}

interface ContentFormData {
  url: string
  title: string
  description: string
  contentText: string
  contentType: string
  ieltsTopic: string
  skill: string
  difficulty: string
  readingStatus: string
  tags: string
  personalNote: string
}

const emptyForm: ContentFormData = {
  url: '',
  title: '',
  description: '',
  contentText: '',
  contentType: 'article',
  ieltsTopic: '',
  skill: '',
  difficulty: '',
  readingStatus: 'unread',
  tags: '',
  personalNote: '',
}

type ViewMode = 'grid' | 'list'

export default function ArtifactsPage() {
  const navigate = useNavigate()
  const goToTutor = useTutorNavigation()
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [topicFilter, setTopicFilter] = useState<string>('')
  const [skillFilter, setSkillFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'lastOpened'>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ContentFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [detailItem, setDetailItem] = useState<Artifact | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!openMenuId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const trigger = target.closest('[aria-label="More options"]')
      const menu = target.closest('[role="menu"]')
      if (trigger || menu) return
      setOpenMenuId(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openMenuId])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadArtifacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<Artifact>('artifacts')
      setArtifacts(all)
    } catch (err) {
      console.error('apps/web/src/features/artifacts/ArtifactsPage.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load saved content')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArtifacts()
  }, [loadArtifacts])

  const stats = useMemo(() => {
    const total = artifacts.length
    const articles = artifacts.filter(a => a.category === 'article').length
    const text = artifacts.filter(a => {
      const ct = (a as ArtifactWithDetails).contentType
      return ct === 'text' || (!ct && a.category === 'text')
    }).length
    const notes = artifacts.filter(a => {
      const ct = (a as ArtifactWithDetails).contentType
      return ct === 'note' || (!ct && a.category === 'note')
    }).length
    const reading = artifacts.filter(a => {
      const rs = (a as ArtifactWithDetails).readingStatus
      return rs === 'in_progress' || rs === 'completed'
    }).length
    const unread = artifacts.filter(a => {
      const rs = (a as ArtifactWithDetails).readingStatus
      return !rs || rs === 'unread'
    }).length
    return { total, articles, text, notes, reading, unread }
  }, [artifacts])

  const filtered = useMemo(() => {
    let result = [...artifacts]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      )
    }

    if (typeFilter) {
      if (typeFilter === 'text' || typeFilter === 'note') {
        result = result.filter(a => (a as ArtifactWithDetails).contentType === typeFilter)
      } else {
        result = result.filter(a => a.category === typeFilter)
      }
    }

    if (topicFilter) {
      result = result.filter(a => (a as ArtifactWithDetails).ieltsTopic === topicFilter)
    }

    if (skillFilter) {
      result = result.filter(a => (a as ArtifactWithDetails).skill === skillFilter)
    }

    if (statusFilter) {
      const rs = (a: Artifact) => (a as ArtifactWithDetails).readingStatus
      if (statusFilter === 'unread') {
        result = result.filter(a => !rs(a) || rs(a) === 'unread')
      } else {
        result = result.filter(a => rs(a) === statusFilter)
      }
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'lastOpened') {
        const la = (a as ArtifactWithDetails).lastOpenedAt
        const lb = (b as ArtifactWithDetails).lastOpenedAt
        return (lb || '').localeCompare(la || '')
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [artifacts, search, typeFilter, topicFilter, skillFilter, statusFilter, sortBy])

  const hasActiveFilters = search || typeFilter || topicFilter || skillFilter || statusFilter

  function clearFilters() {
    setSearch('')
    setTypeFilter('')
    setTopicFilter('')
    setSkillFilter('')
    setStatusFilter('')
    setSortBy('newest')
  }

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(artifact: Artifact) {
    const a = artifact as ArtifactWithDetails
    setEditingId(artifact.id)
    setForm({
      url: artifact.url,
      title: artifact.title,
      description: artifact.description,
      contentText: a.contentText || '',
      contentType: a.contentType || artifact.category,
      ieltsTopic: a.ieltsTopic || '',
      skill: a.skill || '',
      difficulty: a.difficulty || '',
      readingStatus: a.readingStatus || 'unread',
      tags: artifact.tags.join(', '),
      personalNote: a.personalNote || '',
    })
    setFormError(null)
    setShowForm(true)
  }

  async function handleSave() {
    setFormError(null)
    if (!form.title.trim()) { setFormError('Title is required'); return }

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

      if (editingId) {
        const existing = artifacts.find(a => a.id === editingId)
        if (!existing) return
        const updated = {
          ...existing,
          url: form.url.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          tags,
          category: form.contentType as ArtifactCategory,
          favicon: extractFavicon(form.url.trim()) || existing.favicon,
          updatedAt: now,
          contentType: form.contentType,
          ieltsTopic: form.ieltsTopic,
          skill: form.skill,
          difficulty: form.difficulty,
          readingStatus: form.readingStatus,
          contentText: form.contentText,
          personalNote: form.personalNote,
        }
        await DatabaseService.put('artifacts', updated)
        setArtifacts(prev => prev.map(a => a.id === editingId ? updated : a))
        showToast('Content updated')
      } else {
        const artifact = {
          id: generateId(),
          url: form.url.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          favicon: extractFavicon(form.url.trim()),
          tags,
          isFavorite: false,
          category: form.contentType as ArtifactCategory,
          source: 'manual',
          createdAt: now,
          updatedAt: now,
          contentType: form.contentType,
          ieltsTopic: form.ieltsTopic,
          skill: form.skill,
          difficulty: form.difficulty,
          readingStatus: form.readingStatus,
          contentText: form.contentText,
          personalNote: form.personalNote,
          wordCount: form.contentText ? form.contentText.split(/\s+/).length : 0,
        }
        await DatabaseService.add('artifacts', artifact)
        setArtifacts(prev => [artifact, ...prev])
        showToast('Content saved')
      }

      setShowForm(false)
    } catch (err) {
      console.error('apps/web/src/features/artifacts/ArtifactsPage.tsx error:', err);
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await DatabaseService.remove('artifacts', id)
    setArtifacts(prev => prev.filter(a => a.id !== id))
    setDeleteConfirm(null)
    showToast('Content deleted')
  }

  async function handleToggleFavorite(id: string) {
    const artifact = artifacts.find(a => a.id === id)
    if (!artifact) return
    const updated = { ...artifact, isFavorite: !artifact.isFavorite, updatedAt: new Date().toISOString() }
    await DatabaseService.put('artifacts', updated)
    setArtifacts(prev => prev.map(a => a.id === id ? updated : a))
  }

  async function handleStatusUpdate(artifact: Artifact, status: string) {
    const updated = { ...artifact, readingStatus: status, updatedAt: new Date().toISOString() }
    await DatabaseService.put('artifacts', updated)
    setArtifacts(prev => prev.map(a => a.id === artifact.id ? updated : a))
    if (detailItem?.id === artifact.id) setDetailItem(updated)
    showToast(`Marked as ${getStatusLabel(status)}`)
  }

  const [generatingExercise, setGeneratingExercise] = useState(false)

  const handleGenerateExercise = useCallback(async () => {
    if (!detailItem) return
    const a = detailItem as ArtifactWithDetails
    const text = a.contentText || ''
    if (!text || text.split(/\s+/).length < 50) {
      showToast('Content too short for exercise generation (min 50 words)', 'error')
      return
    }
    setGeneratingExercise(true)
    try {
      const { content, error } = await generateQuestionsForPassage({
        title: detailItem.title,
        text,
        difficulty: (a.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      })
      if (error) throw new Error(error)
      if (!content) throw new Error('AI returned an empty response')

      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      const jsonStr = jsonStart >= 0 && jsonEnd >= 0 ? content.slice(jsonStart, jsonEnd + 1) : content
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>
      const questions = parsed.questions as Record<string, unknown>[]
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('No questions generated')

      const now = new Date().toISOString()
      await DatabaseService.add('passages', {
        id: crypto.randomUUID(),
        title: `${detailItem.title} (Exercises)`,
        content: text,
        source: 'user-created',
        topic: a.ieltsTopic || 'General',
        difficulty: a.difficulty || 'medium',
        wordCount: text.split(/\s+/).length,
        tags: detailItem.tags,
        isFavorite: false,
        status: 'new',
        notes: JSON.stringify({ questions, generatedAt: now, artifactId: detailItem.id }),
        createdAt: now,
        updatedAt: now,
      } as never)

      setDetailItem(null)
      showToast('Exercise generated! Find it in Reading Practice')
    } catch (err) {
      console.error('apps/web/src/features/artifacts/ArtifactsPage.tsx error:', err);
      showToast(err instanceof Error ? err.message : 'Failed to generate exercise', 'error')
    } finally {
      setGeneratingExercise(false)
    }
  }, [detailItem, showToast])

  const handleStartReading = useCallback(async () => {
    if (!detailItem) return
    const a = detailItem as ArtifactWithDetails
    const text = a.contentText || ''
    if (!text || text.split(/\s+/).length < 50) {
      showToast('Content too short for reading practice', 'error')
      return
    }
    const now = new Date().toISOString()
    await DatabaseService.add('passages', {
      id: crypto.randomUUID(),
      title: detailItem.title,
      content: text,
      source: 'user-created',
      topic: a.ieltsTopic || 'General',
      difficulty: a.difficulty || 'medium',
      wordCount: text.split(/\s+/).length,
      tags: detailItem.tags,
      isFavorite: false,
      status: 'new',
      notes: '',
      createdAt: now,
      updatedAt: now,
    } as never)
    setDetailItem(null)
    navigate(ROUTES.reading)
  }, [detailItem, navigate, showToast])

  const [savingVocab, setSavingVocab] = useState(false)

  const handleSaveVocabulary = useCallback(async () => {
    if (!detailItem) return
    const a = detailItem as ArtifactWithDetails
    const text = a.contentText || ''
    if (!text) {
      navigate(ROUTES.vocabulary)
      return
    }
    setSavingVocab(true)
    try {
      const config = getStoredAiConfig()
      if (!config.apiKey) {
        navigate(ROUTES.vocabulary, { state: { contentText: text, source: detailItem.title } })
        return
      }
      const { data, error } = await extractVocabulary(text, config)
      if (error || !data) {
        navigate(ROUTES.vocabulary, { state: { contentText: text, source: detailItem.title } })
        return
      }
      const saved: VocabularyEntry[] = []
      for (const w of data.words) {
        const entry = await DatabaseService.addVocabulary({
          word: w.word,
          meaning: w.meaning,
          meaningVi: '',
          pronunciation: '',
          partOfSpeech: w.partOfSpeech,
          topic: a.ieltsTopic || 'General',
          exampleSentence: w.example || '',
          collocations: w.collocations || [],
          synonyms: w.synonyms || [],
          antonyms: [],
          wordFamily: [],
          personalNote: '',
          difficulty: 'intermediate',
          status: 'new',
          tags: ['extracted', ...detailItem.tags],
        })
        saved.push(entry)
      }
      showToast(`Saved ${saved.length} vocabulary words from "${detailItem.title}"`)
      navigate(ROUTES.vocabulary)
    } catch (error) {
      console.error('apps/web/src/features/artifacts/ArtifactsPage.tsx error:', error);
      navigate(ROUTES.vocabulary, { state: { contentText: a.contentText, source: detailItem.title } })
    } finally {
      setSavingVocab(false)
    }
  }, [detailItem, navigate, showToast])

  const handleOpenEdit = useCallback(() => {
    if (!detailItem) return
    const item = detailItem
    setDetailItem(null)
    openEdit(item)
  }, [detailItem])

  if (loading) {
    return (
      <PageContent className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width="40%" />
          <LoadingSkeleton variant="text" width="25%" />
        </div>
        <div className="flex gap-3 overflow-x-auto">
          <LoadingSkeleton variant="rect" width="120px" height="80px" />
          <LoadingSkeleton variant="rect" width="120px" height="80px" />
          <LoadingSkeleton variant="rect" width="120px" height="80px" />
          <LoadingSkeleton variant="rect" width="120px" height="80px" />
          <LoadingSkeleton variant="rect" width="120px" height="80px" />
        </div>
        <LoadingSkeleton variant="rect" />
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
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
        <ErrorState message={error} onRetry={loadArtifacts} title="Could not load your saved content" />
      </PageContent>
    )
  }

  return (
    <PageContent className="space-y-4 sm:space-y-6">
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

      <PageHeader
        icon={<IconSavedContent size={22} />}
        title="Saved Content"
        description={`Your IELTS learning library from the web · ${stats.total} item${stats.total !== 1 ? 's' : ''}`}
        className="!mb-4 sm:!mb-6"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.settingsExtension)}>
              Extension Guide
            </Button>
            <Button onClick={openCreate}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Manually
            </Button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3">
        {[
          { label: 'Articles', count: stats.articles, color: 'var(--color-primary)' },
          { label: 'Text', count: stats.text, color: 'var(--color-success)' },
          { label: 'Notes', count: stats.notes, color: 'var(--color-warning)' },
          { label: 'Reading', count: stats.reading, color: 'var(--color-skill-reading)' },
          { label: 'Unread', count: stats.unread, color: 'var(--color-muted)' },
        ].map(stat => (
          <Card key={stat.label} padding="sm" hoverable>
            <CardContent>
              <div className="flex items-center gap-1.5 sm:gap-2" aria-label={`${stat.count} ${stat.label}`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <span className="text-sm font-bold">{stat.count}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {stat.label}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card padding="sm">
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:flex-1">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                placeholder="Search titles, tags, content..."
                aria-label="Search saved content"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={CONTENT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
                placeholder="All Types"
                aria-label="Filter by type"
                selectSize="sm"
              />
              <Select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                options={IELTS_TOPICS.map(t => ({ value: t, label: t }))}
                placeholder="All Topics"
                aria-label="Filter by topic"
                selectSize="sm"
              />
              <Select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                options={IELTS_SKILLS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                placeholder="All Skills"
                aria-label="Filter by skill"
                selectSize="sm"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={READING_STATUSES.map(s => ({ value: s, label: getStatusLabel(s) }))}
                placeholder="All Status"
                aria-label="Filter by status"
                selectSize="sm"
              />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'title', label: 'Title A-Z' },
                  { value: 'lastOpened', label: 'Last Opened' },
                ]}
                aria-label="Sort by"
                selectSize="sm"
              />
              <div className="flex shrink-0 gap-1 rounded-lg border p-0.5" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : ''}`}
                  style={{ color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-muted)' }}
                  aria-label="Grid view"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : ''}`}
                  style={{ color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-muted)' }}
                  aria-label="List view"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filtered.length === 0 ? (
        hasActiveFilters ? (
          <EmptyStateIllustrated
            variant="search"
            title="No saved content matches your filters"
            description="Try adjusting your search terms or clearing some filters to see more items."
            action={{ label: 'Clear All Filters', onClick: clearFilters }}
          />
        ) : (
          <EmptyStateIllustrated
            variant="default"
            title="Your content library is empty"
            description="Save articles, text passages, and web content to build your personal IELTS learning library. Use the browser extension to save content while browsing, or add URLs manually."
            action={{ label: 'Add Your First Content', onClick: openCreate }}
            secondaryAction={{ label: 'Browser extension guide', onClick: () => {} }}
          />
        )
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {filtered.map(artifact => {
            const ext = artifact as ArtifactWithDetails
            const typeColor = getTypeColor(ext.contentType || artifact.category)
            return (
              <div
                key={artifact.id}
                className="group relative overflow-hidden rounded-xl border transition-all hover:shadow-md"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                {/* Top accent bar */}
                <div style={{ height: '3px', backgroundColor: typeColor }} />

                <div className="p-3 sm:p-4">
                  {/* Top row: favicon + badges + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {artifact.favicon ? (
                        <img src={artifact.favicon} alt="" className="h-5 w-5 shrink-0 rounded" loading="lazy" decoding="async" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded" style={{ backgroundColor: `${typeColor}20`, color: typeColor }}>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                      )}
                      <Badge variant={artifact.category === 'article' ? 'primary' : artifact.category === 'video' ? 'info' : 'default'} size="sm">
                        {CATEGORY_LABELS[artifact.category]}
                      </Badge>
                      {ext.readingStatus && ext.readingStatus !== 'unread' && (
                        <Badge variant={ext.readingStatus === 'completed' ? 'success' : 'warning'} size="sm">
                          {getStatusLabel(ext.readingStatus)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => handleToggleFavorite(artifact.id)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{ color: artifact.isFavorite ? 'var(--color-warning)' : 'var(--color-muted)' }}
                        aria-label={artifact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <svg className="h-4 w-4" fill={artifact.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === artifact.id ? null : artifact.id)}
                          className="rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-alt)]"
                          style={{ color: 'var(--color-muted)' }}
                          aria-label="More options"
                          aria-expanded={openMenuId === artifact.id}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        {openMenuId === artifact.id && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border py-1 shadow-lg"
                            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                          >
                            <button
                              onClick={() => { setOpenMenuId(null); openEdit(artifact) }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--color-surface-alt)]"
                              style={{ color: 'var(--color-text)' }}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Edit
                            </button>
                            <button
                              onClick={() => { setOpenMenuId(null); setDeleteConfirm(artifact.id) }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--color-surface-alt)]"
                              style={{ color: 'var(--color-danger)' }}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <button
                    onClick={() => setDetailItem(artifact)}
                    className="mt-2 w-full text-left sm:mt-3"
                  >
                    <p className="break-words text-sm font-semibold leading-snug transition-colors hover:text-[var(--color-primary)]" style={{ color: 'var(--color-text)' }}>
                      {artifact.title}
                    </p>
                  </button>

                  {/* Description */}
                  {artifact.description && (
                    <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {artifact.description}
                    </p>
                  )}

                  {/* Topic/Skill/Tags */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3">
                    {ext.ieltsTopic && (
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                        {ext.ieltsTopic}
                      </span>
                    )}
                    {ext.skill && (
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
                        {ext.skill.charAt(0).toUpperCase() + ext.skill.slice(1)}
                      </span>
                    )}
                    {artifact.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-muted)' }}>
                        {tag}
                      </span>
                    ))}
                    {artifact.tags.length > 3 && (
                      <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                        +{artifact.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Source + Date */}
                  <div className="mt-2 flex items-center gap-2 text-[10px] sm:mt-3" style={{ color: 'var(--color-muted)' }}>
                    <span>Via {artifact.source === 'manual' ? 'Manual' : artifact.source || 'Extension'}</span>
                    <span>·</span>
                    <span>{formatDate(artifact.createdAt)}</span>
                    {ext.wordCount && (
                      <>
                        <span>·</span>
                        <span>{ext.wordCount} words</span>
                      </>
                    )}
                  </div>

                  {/* Quick actions */}
                  <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <Button variant="ghost" size="xs" onClick={() => setDetailItem(artifact)}>
                      Generate Exercise
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => {
                      goToTutor({ prompt: 'Explain this: ' + artifact.title, type: 'artifact', title: artifact.title })
                    }}>
                      Explain AI
                    </Button>
                    {ext.contentType === 'article' && ext.contentText && ext.contentText.split(/\s+/).length >= 50 && (
                      <Button variant="ghost" size="xs" onClick={() => setDetailItem(artifact)}>
                        Read Practice
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filtered.map(artifact => {
            const ext = artifact as ArtifactWithDetails
            return (
              <div
                key={artifact.id}
                className="flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm sm:gap-4"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <button
                  onClick={() => handleToggleFavorite(artifact.id)}
                  className="shrink-0"
                  style={{ color: artifact.isFavorite ? 'var(--color-warning)' : 'var(--color-border)' }}
                  aria-label={artifact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg className="h-4 w-4" fill={artifact.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <button onClick={() => setDetailItem(artifact)} className="w-full text-left">
                    <p className="break-words text-sm font-medium hover:text-[var(--color-primary)]" style={{ color: 'var(--color-text)' }}>
                      {artifact.title}
                    </p>
                  </button>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    <Badge variant={artifact.category === 'article' ? 'primary' : 'default'} size="sm">
                      {CATEGORY_LABELS[artifact.category]}
                    </Badge>
                    {ext.readingStatus && ext.readingStatus !== 'unread' && (
                      <Badge variant={ext.readingStatus === 'completed' ? 'success' : 'warning'} size="sm">
                        {getStatusLabel(ext.readingStatus)}
                      </Badge>
                    )}
                    <span>{formatDate(artifact.createdAt)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="xs" onClick={() => openEdit(artifact)} aria-label="Edit">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(artifact.id)} aria-label="Delete">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Panel Overlay */}
      {/* Detail Modal */}
      <Modal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={detailItem?.title || ''}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleOpenEdit}>
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => { if (detailItem) setDeleteConfirm(detailItem.id) }}>
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        }
      >
        {detailItem && (() => {
          const a = detailItem as ArtifactWithDetails
          return (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                {CATEGORY_LABELS[detailItem.category]}
              </Badge>
              <button
                onClick={() => handleToggleFavorite(detailItem.id)}
                style={{ color: detailItem.isFavorite ? 'var(--color-warning)' : 'var(--color-muted)' }}
                aria-label={detailItem.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg className="h-5 w-5" fill={detailItem.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              {a.ieltsTopic && (
                <Badge variant="info" size="sm">{a.ieltsTopic}</Badge>
              )}
              {a.skill && (
                <Badge variant="default" size="sm">{a.skill}</Badge>
              )}
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Saved {formatDate(detailItem.createdAt)}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
              {detailItem.title}
            </h2>

            {/* Tags */}
            {detailItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detailItem.tags.map((tag, i) => (
                  <Badge key={i} variant="default" size="xs">#{tag}</Badge>
                ))}
              </div>
            )}

            {/* Reading Progress */}
            <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Reading Progress</span>
                  <span>{getStatusLabel(a.readingStatus || 'unread')}</span>
                </div>
                <div className="mt-1.5 flex gap-1">
                  {['unread', 'in_progress', 'completed'].map(status => (
                    <Button
                      key={status}
                      size="xs"
                      variant={a.readingStatus === status ? 'primary' : 'secondary'}
                      onClick={() => handleStatusUpdate(detailItem, status)}
                      aria-label={`Mark as ${getStatusLabel(status)}`}
                    >
                      {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Personal Note */}
            {a.personalNote && (
              <Card padding="sm">
                <CardContent>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Personal Note</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>{a.personalNote}</p>
                </CardContent>
              </Card>
            )}

            {/* Content Body */}
            {a.contentText && (
              <article className="prose prose-sm max-w-none rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', lineHeight: '1.8' }}>
                {a.contentText}
              </article>
            )}

            {/* Learning Actions */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Learning Actions
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { icon: <IconRefresh size={20} />, label: 'Generate Exercise', desc: 'Create IELTS exercises', loading: generatingExercise, action: handleGenerateExercise, condition: ((detailItem as ArtifactWithDetails).contentText?.split(/\s+/).length ?? 0) >= 50 },
                  { icon: <IconAITutor size={20} />, label: 'Explain with AI', desc: 'AI analysis in IELTS context', action: () => goToTutor({ prompt: 'Explain this: ' + detailItem.title, type: 'artifact', title: detailItem.title }) },
                  { icon: <IconVocabulary size={20} />, label: 'Save Vocabulary', desc: 'Extract IELTS words', loading: savingVocab, action: handleSaveVocabulary },
                  { icon: <IconReading size={20} />, label: 'Start Reading', desc: 'Use as reading passage', action: handleStartReading, condition: ((detailItem as ArtifactWithDetails).contentText?.split(/\s+/).length ?? 0) >= 50 },
                  { icon: <IconEdit size={20} />, label: 'Add Note', desc: 'Attach a learning note', action: handleOpenEdit },
                  { icon: <IconUpload size={20} />, label: 'Share', desc: 'Share or export', action: () => {
                    const a = detailItem as ArtifactWithDetails
                    const shareTitle = detailItem.title
                    const shareUrl = detailItem.url
                    const shareText = a.contentText || shareTitle
                    if (navigator.share) {
                      navigator.share({ title: shareTitle, text: shareText, url: shareUrl || undefined }).catch(() => {})
                    } else {
                      const copyContent = shareUrl || shareText
                      navigator.clipboard.writeText(copyContent)
                        .then(() => showToast(shareUrl ? 'Link copied to clipboard' : 'Content copied to clipboard'))
                        .catch(() => showToast('Could not copy', 'error'))
                    }
                  }},
                ].filter(a => a.condition !== false).map((action: Record<string, unknown>) => (
                  <Card key={action.label as string} padding="sm" hoverable>
                    <button
                      title={action.desc as string}
                      disabled={!!action.loading}
                      className="flex w-full flex-col items-center gap-1.5 text-center disabled:opacity-50"
                      onClick={action.action as () => void}
                    >
                      <span className="flex items-center justify-center" style={{ color: 'var(--color-primary)' }}>
                        {action.loading ? (
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
                        ) : (
                          action.icon as React.ReactNode
                        )}
                      </span>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                        {action.loading ? 'Generating...' : action.label as string}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{action.desc as string}</span>
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          )
        })()}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Content"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text)' }}>
            Are you sure you want to delete this saved content? This action cannot be undone.
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

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Content' : 'Add Content'} size="lg">
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {formError && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
              {formError}
            </div>
          )}

          <Input
            id="content-url"
            label="URL"
            type="url"
            value={form.url}
            onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com/article"
          />

          <Input
            id="content-title"
            label="Title *"
            type="text"
            value={form.title}
            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Content title"
          />

          <Textarea
            id="content-text"
            label="Content Text"
            value={form.contentText}
            onChange={(e) => setForm(prev => ({ ...prev, contentText: e.target.value }))}
            rows={4}
            placeholder="Paste article text or notes here..."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="content-type"
              label="Content Type"
              value={form.contentType}
              onChange={(e) => setForm(prev => ({ ...prev, contentType: e.target.value }))}
              options={CONTENT_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            />
            <Select
              id="content-topic"
              label="IELTS Topic"
              value={form.ieltsTopic}
              onChange={(e) => setForm(prev => ({ ...prev, ieltsTopic: e.target.value }))}
              options={IELTS_TOPICS.map(t => ({ value: t, label: t }))}
              placeholder="None"
            />
            <Select
              id="content-skill"
              label="Skill"
              value={form.skill}
              onChange={(e) => setForm(prev => ({ ...prev, skill: e.target.value }))}
              options={IELTS_SKILLS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              placeholder="None"
            />
            <Select
              id="content-status"
              label="Reading Status"
              value={form.readingStatus}
              onChange={(e) => setForm(prev => ({ ...prev, readingStatus: e.target.value }))}
              options={READING_STATUSES.map(s => ({ value: s, label: getStatusLabel(s) }))}
              placeholder="Unread"
            />
          </div>

          <Input
            id="content-tags"
            label="Tags (comma separated)"
            type="text"
            value={form.tags}
            onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="ielts, reading, academic"
          />

          <Textarea
            id="content-note"
            label="Personal Note"
            value={form.personalNote}
            onChange={(e) => setForm(prev => ({ ...prev, personalNote: e.target.value }))}
            rows={2}
            placeholder="Add a personal learning note..."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Save Content'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContent>
  )
}
