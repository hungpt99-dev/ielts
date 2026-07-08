import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTutorNavigation } from '../../hooks/useTutorNavigation'
import type { Artifact, ArtifactCategory } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { EmptyState, EmptyStateIllustrated, ErrorState } from '../../components/ui/EmptyState'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import { IconSavedContent, IconAITutor } from '@ielts/ui'

const CATEGORIES: ArtifactCategory[] = ['article', 'video', 'reference', 'tool', 'other']

const CATEGORY_LABELS: Record<ArtifactCategory, string> = {
  article: 'Article',
  video: 'Video',
  reference: 'Reference',
  tool: 'Tool',
  other: 'Other',
}

const CATEGORY_COLORS: Record<ArtifactCategory, string> = {
  article: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  video: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  reference: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  tool: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health',
  'Culture', 'Economy', 'Science', 'Society',
  'Politics', 'Media', 'Arts', 'History',
]

const IELTS_SKILLS = ['reading', 'listening', 'writing', 'speaking', 'grammar', 'vocabulary', 'general']

const READING_STATUSES = ['unread', 'in_progress', 'completed', 'saved_for_later']

const CONTENT_TYPES = ['article', 'text', 'note', 'video', 'reference', 'tool', 'other']

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function extractFavicon(url: string): string {
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
    const handler = () => setOpenMenuId(null)
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
      setError(err instanceof Error ? err.message : 'Failed to load saved content')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadArtifacts()
  }, [loadArtifacts])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const a of artifacts) {
      for (const t of a.tags) tagSet.add(t)
    }
    return Array.from(tagSet).sort()
  }, [artifacts])

  const stats = useMemo(() => {
    const total = artifacts.length
    const articles = artifacts.filter(a => a.category === 'article').length
    const text = artifacts.filter(a => (a as Record<string, unknown>).contentType === 'text').length
    const notes = artifacts.filter(a => (a as Record<string, unknown>).contentType === 'note').length
    const reading = artifacts.filter(a => {
      const rs = (a as Record<string, unknown>).readingStatus
      return rs === 'in_progress' || rs === 'completed'
    }).length
    const unread = artifacts.filter(a => {
      const rs = (a as Record<string, unknown>).readingStatus
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
        result = result.filter(a => (a as Record<string, unknown>).contentType === typeFilter)
      } else {
        result = result.filter(a => a.category === typeFilter)
      }
    }

    if (topicFilter) {
      result = result.filter(a => (a as Record<string, unknown>).ieltsTopic === topicFilter)
    }

    if (skillFilter) {
      result = result.filter(a => (a as Record<string, unknown>).skill === skillFilter)
    }

    if (statusFilter) {
      const rs = (a: Artifact) => (a as Record<string, unknown>).readingStatus
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
        const la = (a as Record<string, unknown>).lastOpenedAt as string | undefined
        const lb = (b as Record<string, unknown>).lastOpenedAt as string | undefined
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
    setEditingId(artifact.id)
    setForm({
      url: artifact.url,
      title: artifact.title,
      description: artifact.description,
      contentText: (artifact as Record<string, unknown>).contentText as string || '',
      contentType: (artifact as Record<string, unknown>).contentType as string || artifact.category,
      ieltsTopic: (artifact as Record<string, unknown>).ieltsTopic as string || '',
      skill: (artifact as Record<string, unknown>).skill as string || '',
      difficulty: (artifact as Record<string, unknown>).difficulty as string || '',
      readingStatus: (artifact as Record<string, unknown>).readingStatus as string || 'unread',
      tags: artifact.tags.join(', '),
      personalNote: (artifact as Record<string, unknown>).personalNote as string || '',
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
    showToast(`Marked as ${getStatusLabel(status)}`)
  }

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
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings/extension')}>
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
          <button
            key={stat.label}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-all hover:shadow-sm sm:gap-2 sm:px-4 sm:py-3"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
            aria-label={`${stat.count} ${stat.label}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              <span className="text-sm font-bold">{stat.count}</span>
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {stat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <Card padding="sm">
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--color-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search titles, tags, content..."
                  className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                  }}
                  aria-label="Search saved content"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0 [-webkit-overflow-scrolling:touch]">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="shrink-0 rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-1 sm:px-3"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Filter by type"
              >
                <option value="">All Types</option>
                {CONTENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="shrink-0 rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-1 sm:px-3"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Filter by topic"
              >
                <option value="">All Topics</option>
                {IELTS_TOPICS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="shrink-0 rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-1 sm:px-3"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Filter by skill"
              >
                <option value="">All Skills</option>
                {IELTS_SKILLS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="shrink-0 rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-1 sm:px-3"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                {READING_STATUSES.map(s => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="shrink-0 rounded-lg border px-2.5 py-2 text-xs focus:outline-none focus:ring-1 sm:px-3"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Sort by"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title A-Z</option>
                <option value="lastOpened">Last Opened</option>
              </select>
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
            const ext = artifact as Artifact & { contentType?: string; readingStatus?: string; ieltsTopic?: string; skill?: string; wordCount?: number }
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
                    <Button variant="ghost" size="xs" onClick={() => {
                      showToast('Generate exercise from this content - coming soon')
                    }}>
                      Generate Exercise
                    </Button>
                    <Button variant="ghost" size="xs" onClick={() => {
                      goToTutor({ prompt: 'Explain this: ' + artifact.title, type: 'artifact', title: artifact.title })
                    }}>
                      Explain AI
                    </Button>
                    {ext.contentType === 'article' && (
                      <Button variant="ghost" size="xs" onClick={() => {
                        navigate('/reading')
                      }}>
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
            const ext = artifact as Artifact & { contentType?: string; readingStatus?: string; ieltsTopic?: string; skill?: string }
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
      {detailItem && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          style={{ backgroundColor: 'var(--color-overlay)' }}
          onClick={() => setDetailItem(null)}
        >
          <div
            className="flex h-full w-full flex-col overflow-y-auto sm:max-w-lg lg:max-w-xl"
            style={{ backgroundColor: 'var(--color-background)' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Detail: ${detailItem.title}`}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <button
                onClick={() => setDetailItem(null)}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: 'var(--color-text)' }}
                aria-label="Back to list"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex items-center gap-2">
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
                <Button variant="ghost" size="xs" onClick={() => { setDetailItem(null); openEdit(detailItem) }} aria-label="Edit">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(detailItem.id)} aria-label="Delete">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="flex-1 p-6">
              {/* Metadata */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {(detailItem as Artifact & { ieltsTopic?: string }).ieltsTopic && (
                  <Badge variant="info" size="sm">
                    {(detailItem as Artifact & { ieltsTopic?: string }).ieltsTopic}
                  </Badge>
                )}
                {(detailItem as Artifact & { skill?: string }).skill && (
                  <Badge variant="default" size="sm">
                    {(detailItem as Artifact & { skill?: string }).skill}
                  </Badge>
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
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {detailItem.tags.map((tag, i) => (
                    <span key={i} className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Reading Progress */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Reading Progress</span>
                    <span>{getStatusLabel((detailItem as Artifact & { readingStatus?: string }).readingStatus || 'unread')}</span>
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    {['unread', 'in_progress', 'completed'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(detailItem, status)}
                        className={`flex-1 rounded-md py-1.5 text-[10px] font-medium transition-colors ${
                          (detailItem as Artifact & { readingStatus?: string }).readingStatus === status
                            ? 'bg-[var(--color-primary)] text-white'
                            : ''
                        }`}
                        style={{
                          backgroundColor: (detailItem as Artifact & { readingStatus?: string }).readingStatus !== status ? 'var(--color-surface-alt)' : undefined,
                          color: (detailItem as Artifact & { readingStatus?: string }).readingStatus !== status ? 'var(--color-text-secondary)' : undefined,
                        }}
                        aria-label={`Mark as ${getStatusLabel(status)}`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal Note */}
              {(detailItem as Artifact & { personalNote?: string }).personalNote && (
                <div className="mt-4 rounded-xl border p-3" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Personal Note</p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text)' }}>
                    {(detailItem as Artifact & { personalNote?: string }).personalNote}
                  </p>
                </div>
              )}

              {/* Content Body */}
              {(detailItem as Artifact & { contentText?: string }).contentText && (
                <div className="mt-4">
                  <article className="prose prose-sm max-w-none rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', lineHeight: '1.8' }}>
                    {(detailItem as Artifact & { contentText?: string }).contentText}
                  </article>
                </div>
              )}

              {/* Learning Actions */}
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Learning Actions
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { icon: '📝', label: 'Generate Exercise', desc: 'Create IELTS exercises', action: () => showToast('Exercise generation coming soon') },
                    { icon: '🤖', label: 'Explain with AI', desc: 'AI analysis in IELTS context', action: () => goToTutor({ prompt: 'Explain this: ' + detailItem.title, type: 'artifact', title: detailItem.title }) },
                    { icon: '📖', label: 'Save Vocabulary', desc: 'Extract IELTS words', action: () => navigate('/vocabulary') },
                    { icon: '📚', label: 'Start Reading', desc: 'Use as reading passage', action: () => navigate('/reading'), condition: (detailItem as Artifact & { contentText?: string }).contentText && (detailItem as Artifact & { contentText?: string }).contentText!.split(/\s+/).length >= 100 },
                    { icon: '✏️', label: 'Add Note', desc: 'Attach a learning note', action: () => showToast('Open the edit form to add a note') },
                    { icon: '📤', label: 'Share', desc: 'Share or export', action: () => {
                      if (navigator.share && detailItem.url) {
                        navigator.share({ title: detailItem.title, url: detailItem.url }).catch(() => {})
                      } else if (detailItem.url) {
                        navigator.clipboard.writeText(detailItem.url).then(() => showToast('Link copied to clipboard')).catch(() => showToast('Could not copy link', 'error'))
                      } else {
                        showToast('No URL to share', 'error')
                      }
                    }},
                  ].filter(a => a.condition !== false).map(action => (
                    <button
                      key={action.label}
                      title={action.desc}
                      className="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all hover:shadow-sm"
                      style={{ borderColor: 'var(--color-border)' }}
                      onClick={action.action}
                    >
                      <span className="text-xl">{action.icon}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{action.label}</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{action.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

          <div>
            <label htmlFor="content-url" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>URL</label>
            <input
              id="content-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="https://example.com/article"
            />
          </div>

          <div>
            <label htmlFor="content-title" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Title <span className="text-red-500">*</span></label>
            <input
              id="content-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Content title"
            />
          </div>

          <div>
            <label htmlFor="content-text" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Content Text</label>
            <textarea
              id="content-text"
              value={form.contentText}
              onChange={(e) => setForm(prev => ({ ...prev, contentText: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Paste article text or notes here..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="content-type" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Content Type</label>
              <select
                id="content-type"
                value={form.contentType}
                onChange={(e) => setForm(prev => ({ ...prev, contentType: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                {CONTENT_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="content-topic" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>IELTS Topic</label>
              <select
                id="content-topic"
                value={form.ieltsTopic}
                onChange={(e) => setForm(prev => ({ ...prev, ieltsTopic: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                <option value="">None</option>
                {IELTS_TOPICS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="content-skill" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Skill</label>
              <select
                id="content-skill"
                value={form.skill}
                onChange={(e) => setForm(prev => ({ ...prev, skill: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                <option value="">None</option>
                {IELTS_SKILLS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="content-status" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Reading Status</label>
              <select
                id="content-status"
                value={form.readingStatus}
                onChange={(e) => setForm(prev => ({ ...prev, readingStatus: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                {READING_STATUSES.map(s => (
                  <option key={s} value={s}>{getStatusLabel(s)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="content-tags" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Tags (comma separated)</label>
            <input
              id="content-tags"
              type="text"
              value={form.tags}
              onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="ielts, reading, academic"
            />
          </div>

          <div>
            <label htmlFor="content-note" className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Personal Note</label>
            <textarea
              id="content-note"
              value={form.personalNote}
              onChange={(e) => setForm(prev => ({ ...prev, personalNote: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Add a personal learning note..."
            />
          </div>

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
