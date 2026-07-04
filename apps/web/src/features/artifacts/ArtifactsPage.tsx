import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Artifact, ArtifactCategory } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

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
  reference: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  tool: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

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

interface ArtifactFormData {
  url: string
  title: string
  description: string
  tags: string
  category: ArtifactCategory
}

const emptyForm: ArtifactFormData = { url: '', title: '', description: '', tags: '', category: 'article' }

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ArtifactCategory | ''>('')
  const [tagFilter, setTagFilter] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [sortBy, setSortBy] = useState<'createdAt' | 'title'>('createdAt')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ArtifactFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadArtifacts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const all = await DatabaseService.getAll<Artifact>('artifacts')
      setArtifacts(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artifacts')
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

  const filtered = useMemo(() => {
    let result = artifacts

    if (showFavorites) result = result.filter(a => a.isFavorite)
    if (categoryFilter) result = result.filter(a => a.category === categoryFilter)
    if (tagFilter) result = result.filter(a => a.tags.includes(tagFilter))
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.url.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q)),
      )
    }

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return b.createdAt.localeCompare(a.createdAt)
    })

    return result
  }, [artifacts, search, categoryFilter, tagFilter, showFavorites, sortBy])

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
      tags: artifact.tags.join(', '),
      category: artifact.category,
    })
    setFormError(null)
    setShowForm(true)
  }

  async function handleSave() {
    setFormError(null)
    if (!form.url.trim()) { setFormError('URL is required'); return }
    if (!form.title.trim()) { setFormError('Title is required'); return }

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

      if (editingId) {
        const existing = artifacts.find(a => a.id === editingId)
        if (!existing) return
        const updated: Artifact = {
          ...existing,
          url: form.url.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          tags,
          category: form.category,
          favicon: extractFavicon(form.url.trim()) || existing.favicon,
          updatedAt: now,
        }
        await DatabaseService.put('artifacts', updated)
        setArtifacts(prev => prev.map(a => a.id === editingId ? updated : a))
      } else {
        const artifact: Artifact = {
          id: generateId(),
          url: form.url.trim(),
          title: form.title.trim(),
          description: form.description.trim(),
          favicon: extractFavicon(form.url.trim()),
          tags,
          isFavorite: false,
          category: form.category,
          source: 'manual',
          createdAt: now,
          updatedAt: now,
        }
        await DatabaseService.add('artifacts', artifact)
        setArtifacts(prev => [artifact, ...prev])
      }

      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save artifact')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await DatabaseService.remove('artifacts', id)
    setArtifacts(prev => prev.filter(a => a.id !== id))
  }

  async function handleToggleFavorite(id: string) {
    const artifact = artifacts.find(a => a.id === id)
    if (!artifact) return
    const updated: Artifact = { ...artifact, isFavorite: !artifact.isFavorite, updatedAt: new Date().toISOString() }
    await DatabaseService.put('artifacts', updated)
    setArtifacts(prev => prev.map(a => a.id === id ? updated : a))
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div role="status" className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadArtifacts}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Artifacts</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Save and organise web links, articles, videos, and resources
          </p>
        </div>
        <Button onClick={openCreate}>Add Artifact</Button>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search artifacts..."
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                aria-label="Search artifacts"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as ArtifactCategory | '')}
              className="rounded-lg border px-2 py-2 text-xs"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <select
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              className="rounded-lg border px-2 py-2 text-xs"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Filter by tag"
            >
              <option value="">All Tags</option>
              {allTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'createdAt' | 'title')}
              className="rounded-lg border px-2 py-2 text-xs"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              aria-label="Sort by"
            >
              <option value="createdAt">Newest</option>
              <option value="title">Title A-Z</option>
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showFavorites}
                onChange={e => setShowFavorites(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-600 dark:text-slate-400">Favorites only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <svg className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {search || categoryFilter || tagFilter || showFavorites
                ? 'No artifacts match your filters.'
                : 'No artifacts yet. Save your first link!'}
            </p>
            <Button className="mt-4" onClick={openCreate}>Add Artifact</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(artifact => (
            <Card key={artifact.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {artifact.favicon ? (
                      <img src={artifact.favicon} alt="" className="h-5 w-5 shrink-0 rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <svg className="h-5 w-5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[artifact.category]}`}>
                      {CATEGORY_LABELS[artifact.category]}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(artifact.id)}
                    className={`shrink-0 rounded-lg p-1 transition-colors ${artifact.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400 dark:text-slate-600'}`}
                    aria-label={artifact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className="h-5 w-5" fill={artifact.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>

                <a
                  href={artifact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 break-words"
                >
                  {artifact.title}
                </a>

                {artifact.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {artifact.description}
                  </p>
                )}

                {artifact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {artifact.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(artifact.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(artifact)} className="p-1" aria-label="Edit">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(artifact.id)} className="p-1" style={{ color: 'var(--color-danger)' }} aria-label="Delete">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Artifact' : 'Add Artifact'} size="md">
        <div className="space-y-4">
          <div>
            <label htmlFor="artifact-url" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">URL</label>
            <input
              id="artifact-url"
              type="url"
              value={form.url}
              onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="https://example.com/article"
            />
          </div>
          <div>
            <label htmlFor="artifact-title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              id="artifact-title"
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Article title"
            />
          </div>
          <div>
            <label htmlFor="artifact-desc" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              id="artifact-desc"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Optional notes about this link"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="artifact-category" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
              <select
                id="artifact-category"
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value as ArtifactCategory }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="artifact-tags" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tags (comma separated)</label>
              <input
                id="artifact-tags"
                type="text"
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                placeholder="ielts, reading, academic"
              />
            </div>
          </div>
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? 'Save Changes' : 'Add Artifact'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
