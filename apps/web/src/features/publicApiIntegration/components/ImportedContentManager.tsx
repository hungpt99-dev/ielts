import { useState, useEffect, useMemo } from 'react'
import type { PublicApiImportedContent, StudyNote } from '../../../models'
import { DatabaseService } from '../../../services/storage/Database'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import Textarea from '../../../components/ui/Textarea'
import Select from '../../../components/ui/Select'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import EmptyState from '../../../components/ui/EmptyState'
import Input from '../../../components/ui/Input'
import {
  getStoredAiConfig,
  generateReadingQuestions,
  generateListeningExercise,
  generateSpeakingPrompts,
  generateWritingIdeas,
  generateGrammarExercises,
  generateMistakeReviewTasks,
} from '../ai'
import type { PublicApiSourceName } from '../types'

// ── Constants ──────────────────────────────────────────────────

type ExerciseType = 'reading' | 'listening' | 'speaking' | 'writing' | 'grammar' | 'mistake-review'

const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'reading', label: 'Reading Questions' },
  { value: 'listening', label: 'Listening Gap-Fill' },
  { value: 'speaking', label: 'Speaking Prompts' },
  { value: 'writing', label: 'Writing Ideas' },
  { value: 'grammar', label: 'Grammar Exercises' },
  { value: 'mistake-review', label: 'Mistake Review' },
]

const CONTENT_TYPE_INFO: Record<string, { label: string; color: string }> = {
  dictionary: { label: 'Dictionary', color: 'info' },
  'vocabulary-list': { label: 'Vocabulary', color: 'primary' },
  reading: { label: 'Reading', color: 'success' },
  listening: { label: 'Listening', color: 'warning' },
  article: { label: 'Article', color: 'info' },
  video: { label: 'Video', color: 'warning' },
  exercise: { label: 'Exercise', color: 'success' },
  'writing-prompt': { label: 'Writing', color: 'primary' },
  'speaking-topic': { label: 'Speaking', color: 'warning' },
  reference: { label: 'Reference', color: 'default' },
}

function sourceBadgeVariant(source: PublicApiSourceName): string {
  const map: Record<string, string> = {
    wiktionary: 'info',
    datamuse: 'primary',
    tatoeba: 'info',
    'oer-commons': 'success',
    wikipedia: 'info',
    gutendex: 'success',
    youtube: 'danger',
  }
  return map[source] ?? 'default'
}

function difficultyBadgeVariant(d: string): string {
  if (d === 'hard') return 'danger'
  if (d === 'medium') return 'warning'
  return 'success'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

// ── Component ──────────────────────────────────────────────────

export default function ImportedContentManager() {
  // Data
  const [items, setItems] = useState<PublicApiImportedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterTopic, setFilterTopic] = useState('')
  const [filterSkill, setFilterSkill] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterTags, setFilterTags] = useState('')

  // Detail modal
  const [selectedItem, setSelectedItem] = useState<PublicApiImportedContent | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // Exercise generation
  const [exerciseType, setExerciseType] = useState<ExerciseType>('reading')
  const [generating, setGenerating] = useState(false)
  const [exerciseResult, setExerciseResult] = useState<string | null>(null)
  const [exerciseError, setExerciseError] = useState<string | null>(null)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // ── Load ──

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await DatabaseService.safeGetAll<PublicApiImportedContent>('publicApiContent')
        if (!cancelled) {
          setItems(data ?? [])
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load imported content')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Derived filter options ──

  const uniqueTopics = useMemo(() => {
    return Array.from(new Set(items.map(i => i.topic).filter(Boolean))).sort()
  }, [items])

  const uniqueSkills = useMemo(() => {
    return Array.from(new Set(items.map(i => i.skill).filter(Boolean))).sort()
  }, [items])

  const uniqueDifficulties = useMemo(() => {
    return Array.from(new Set(items.map(i => i.difficulty).filter(Boolean))).sort()
  }, [items])

  // ── Filtered items ──

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (filterTopic && item.topic !== filterTopic) return false
      if (filterSkill && item.skill !== filterSkill) return false
      if (filterDifficulty && item.difficulty !== filterDifficulty) return false
      if (filterTags) {
        const searchTags = filterTags
          .toLowerCase()
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
        if (searchTags.length > 0) {
          const itemTags = (item.tags ?? []).map(t => t.toLowerCase())
          const matchesTag = searchTags.some(st => itemTags.some(it => it.includes(st)))
          if (!matchesTag) return false
        }
      }
      return true
    })
  }, [items, filterTopic, filterSkill, filterDifficulty, filterTags])

  // ── Handlers ──

  function openDetail(item: PublicApiImportedContent) {
    setSelectedItem(item)
    setEditingNotes(item.userNotes ?? '')
    setNotesSaved(false)
    setExerciseResult(null)
    setExerciseError(null)
  }

  async function saveNotes() {
    if (!selectedItem) return
    setSavingNotes(true)
    try {
      await DatabaseService.updatePublicApiContent(selectedItem.id, {
        userNotes: editingNotes,
      })
      setItems(prev =>
        prev.map(i =>
          i.id === selectedItem.id ? { ...i, userNotes: editingNotes } : i,
        ),
      )
      setSelectedItem(prev => (prev ? { ...prev, userNotes: editingNotes } : null))
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  async function deleteItem(id: string) {
    try {
      await DatabaseService.safeRemove('publicApiContent', id)
      setItems(prev => prev.filter(i => i.id !== id))
      setConfirmDeleteId(null)
      if (selectedItem?.id === id) setSelectedItem(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content')
    }
  }

  async function generateExercises(content: string, title: string, type: ExerciseType) {
    const config = getStoredAiConfig()
    if (!config.apiKey) {
      setExerciseError(
        'AI API key not configured. Add your AI API key in Settings to generate exercises.',
      )
      return
    }

    setGenerating(true)
    setExerciseError(null)
    setExerciseResult(null)

    try {
      let result: string | null = null

      switch (type) {
        case 'reading': {
          const { data, error } = await generateReadingQuestions(content, title, config)
          if (error) throw new Error(error)
          result = JSON.stringify(data, null, 2)
          break
        }
        case 'listening': {
          const { data, error } = await generateListeningExercise(content, config)
          if (error) throw new Error(error)
          result = JSON.stringify(data, null, 2)
          break
        }
        case 'speaking': {
          const { data, error } = await generateSpeakingPrompts(content, config)
          if (error) throw new Error(error)
          result = JSON.stringify(data, null, 2)
          break
        }
        case 'writing': {
          const { data, error } = await generateWritingIdeas(content, config)
          if (error) throw new Error(error)
          result = JSON.stringify(data, null, 2)
          break
        }
        case 'grammar': {
          const { data, error } = await generateGrammarExercises(content, config)
          if (error) throw new Error(error)
          result = JSON.stringify(data, null, 2)
          break
        }
        case 'mistake-review': {
          const { data, error } = await generateMistakeReviewTasks(content, config)
          if (error) throw new Error(error)
          result = JSON.stringify(data, null, 2)
          break
        }
      }

      setExerciseResult(result)

      // Save generated exercises as a study note for persistence
      if (result) {
        try {
          const note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
            title: `AI Exercises: ${title} (${type})`,
            content: result,
            topic: selectedItem?.topic || '',
            skill: type === 'reading' ? 'Reading' : type === 'listening' ? 'Listening' : type === 'speaking' ? 'Speaking' : type === 'writing' ? 'Writing' : 'Grammar',
            tags: ['ai-generated', 'exercises', type],
            isFavorite: false,
            isDraft: false,
          }
          await DatabaseService.addStudyNote(note)
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      setExerciseError(
        err instanceof Error ? err.message : 'Failed to generate exercises',
      )
    } finally {
      setGenerating(false)
    }
  }

  function clearFilters() {
    setFilterTopic('')
    setFilterSkill('')
    setFilterDifficulty('')
    setFilterTags('')
  }

  const hasActiveFilters = !!(filterTopic || filterSkill || filterDifficulty || filterTags)

  // ── Loading state ──

  if (loading) {
    return <LoadingSpinner size="lg" fullPage message="Loading imported content..." />
  }

  // ── Error state (no items loaded) ──

  if (error && items.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <CardContent className="py-6">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Error loading content
          </p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Imported API Content
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({items.length} item{items.length !== 1 ? 's' : ''})
            </span>
          )}
        </h2>
      </div>

      {/* Filters */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label="Topic"
                options={[
                  { value: '', label: 'All Topics' },
                  ...uniqueTopics.map(t => ({ value: t, label: t })),
                ]}
                value={filterTopic}
                onChange={e => setFilterTopic(e.target.value)}
              />
              <Select
                label="Skill"
                options={[
                  { value: '', label: 'All Skills' },
                  ...uniqueSkills.map(s => ({ value: s, label: s })),
                ]}
                value={filterSkill}
                onChange={e => setFilterSkill(e.target.value)}
              />
              <Select
                label="Difficulty"
                options={[
                  { value: '', label: 'All Difficulties' },
                  ...uniqueDifficulties.map(d => ({ value: d, label: d })),
                ]}
                value={filterDifficulty}
                onChange={e => setFilterDifficulty(e.target.value)}
              />
              <Input
                label="Tags"
                placeholder="e.g. environment, vocab"
                value={filterTags}
                onChange={e => setFilterTags(e.target.value)}
              />
            </div>
            {filterTags && (
              <p className="mt-1 text-xs text-slate-400">
                Comma-separated; matches items with any matching tag
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state — no items at all */}
      {items.length === 0 && (
        <EmptyState
          icon={
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          }
          title="No imported API content yet"
          description="Search and import content using the Public Content Search to see it here."
        />
      )}

      {/* Empty state — filtered out */}
      {items.length > 0 && filteredItems.length === 0 && (
        <EmptyState
          title="No items match the current filters"
          description="Try adjusting your filter criteria or clear all filters."
        />
      )}

      {/* Items list */}
      {filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <Card key={item.id} padding={false}>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={sourceBadgeVariant(item.sourceName) as never}
                      >
                        {item.sourceName}
                      </Badge>
                      <Badge
                        variant={
                          (CONTENT_TYPE_INFO[item.contentType]
                            ?.color as never) ?? 'default'
                        }
                      >
                        {CONTENT_TYPE_INFO[item.contentType]?.label ??
                          item.contentType}
                      </Badge>
                      <Badge variant="default">{item.licenseName}</Badge>
                      {item.difficulty && (
                        <Badge
                          variant={
                            difficultyBadgeVariant(item.difficulty) as never
                          }
                        >
                          {item.difficulty}
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>

                    {/* Content preview */}
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {item.content?.slice(0, 200) || 'No content preview.'}
                    </p>

                    {/* Classification info */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.topic && <span>Topic: {item.topic}</span>}
                      {item.skill && <span>Skill: {item.skill}</span>}
                      {item.tags && item.tags.length > 0 && (
                        <span>
                          Tags:{' '}
                          {item.tags
                            .slice(0, 3)
                            .join(', ')
                            .concat(item.tags.length > 3 ? '…' : '')}
                        </span>
                      )}
                      <span>Imported: {formatDate(item.importedAt)}</span>
                    </div>

                    {/* Attribution */}
                    <div className="mt-2 rounded bg-slate-50 px-2 py-1.5 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      Source: {item.sourceName} &middot; License:{' '}
                      {item.licenseName}
                      {item.attribution && (
                        <>
                          {' '}&middot; {item.attribution}
                        </>
                      )}
                    </div>

                    {/* User notes preview */}
                    {item.userNotes && (
                      <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400 line-clamp-1">
                        Notes: {item.userNotes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetail(item)}
                    >
                      View
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setConfirmDeleteId(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Imported Content"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this imported content? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteItem(confirmDeleteId!)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title ?? 'Content Details'}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={sourceBadgeVariant(selectedItem.sourceName) as never}
              >
                {selectedItem.sourceName}
              </Badge>
              <Badge
                variant={
                  (CONTENT_TYPE_INFO[selectedItem.contentType]
                    ?.color as never) ?? 'default'
                }
              >
                {CONTENT_TYPE_INFO[selectedItem.contentType]?.label ??
                  selectedItem.contentType}
              </Badge>
              <Badge variant="default">{selectedItem.licenseName}</Badge>
              {selectedItem.difficulty && (
                <Badge
                  variant={
                    difficultyBadgeVariant(selectedItem.difficulty) as never
                  }
                >
                  {selectedItem.difficulty}
                </Badge>
              )}
            </div>

            {/* Classification */}
            {(selectedItem.topic ||
              selectedItem.skill ||
              (selectedItem.tags && selectedItem.tags.length > 0)) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {selectedItem.topic && (
                  <span>
                    Topic: <strong>{selectedItem.topic}</strong>
                  </span>
                )}
                {selectedItem.skill && (
                  <span>
                    Skill: <strong>{selectedItem.skill}</strong>
                  </span>
                )}
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    Tags:{' '}
                    {selectedItem.tags.map(t => (
                      <Badge key={t} variant="default" size="sm">
                        {t}
                      </Badge>
                    ))}
                  </span>
                )}
              </div>
            )}

            {/* Content body */}
            <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {selectedItem.content || 'No content available.'}
            </div>

            {/* Attribution — prominently displayed per requirements */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <p className="mb-1.5 font-medium text-slate-700 dark:text-slate-300">
                Source & Attribution
              </p>
              <p>
                <strong>Source:</strong> {selectedItem.sourceName}
              </p>
              <p>
                <strong>URL:</strong>{' '}
                <a
                  href={selectedItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  {selectedItem.sourceUrl}
                </a>
              </p>
              <p>
                <strong>License:</strong> {selectedItem.licenseName}
              </p>
              {selectedItem.attribution && (
                <p>
                  <strong>Attribution:</strong> {selectedItem.attribution}
                </p>
              )}
              <p>
                <strong>Imported:</strong> {formatDate(selectedItem.importedAt)}
              </p>
            </div>

            {/* User notes */}
            <div>
              <label
                htmlFor="item-notes"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Your Notes
              </label>
              <Textarea
                id="item-notes"
                value={editingNotes}
                onChange={e => setEditingNotes(e.target.value)}
                placeholder="Add your personal notes about this content..."
                rows={3}
              />
              <div className="mt-2 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={saveNotes}
                  loading={savingNotes}
                >
                  Save Notes
                </Button>
                {notesSaved && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Saved &check;
                  </span>
                )}
              </div>
            </div>

            {/* AI Exercise Generation */}
            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <label
                htmlFor="exercise-type"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Generate Exercises with AI
              </label>
              <div className="flex flex-wrap gap-2">
                <select
                  id="exercise-type"
                  value={exerciseType}
                  onChange={e =>
                    setExerciseType(e.target.value as ExerciseType)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {EXERCISE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    generateExercises(
                      selectedItem.content,
                      selectedItem.title,
                      exerciseType,
                    )
                  }
                  loading={generating}
                >
                  Generate
                </Button>
              </div>

              {exerciseError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {exerciseError}
                </p>
              )}

              {generating && exerciseResult === null && !exerciseError && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Generating exercises... This may take a moment.
                </p>
              )}

              {exerciseResult && (
                <div className="mt-3 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {exerciseResult}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
