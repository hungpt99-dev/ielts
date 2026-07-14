import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { VocabularyEntry, VocabReviewEntry, ReviewRating } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  RATING_BUTTONS,
  REVIEW_MODES,
  buildReviewQueue,
  handleRating,
  type ReviewMode,
  type ReviewItem,
  type ReviewSessionConfig,
  DEFAULT_SESSION_CONFIG,
} from './reviewService'
import { getModeRenderer } from './reviewModes'
import SessionSummary from './SessionSummary'
import PageHeader from '../../components/layout/PageHeader'
import PageContent from '../../components/layout/PageContent'
import { IconVocabularyReview } from '@ielts/ui'

const ALL_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health', 'Work',
  'Business', 'Travel', 'Culture', 'Society', 'Crime',
  'Government', 'Media', 'Globalization', 'Family', 'Housing',
  'Transport', 'Art', 'Sports', 'Science',
]
const ALL_STATUSES = ['new', 'learning', 'reviewing', 'mastered']
const ALL_DIFFICULTIES = ['easy', 'medium', 'hard']

function shufflePool(pool: VocabularyEntry[], current: VocabularyEntry, count: number): string[] {
  const others = pool.filter(v => v.id !== current.id && v.meaning)
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]]
  }
  return others.slice(0, count).map(v => v.meaning)
}

interface ReviewSessionProps {
  onBack: () => void
}

export default function ReviewSession({ onBack }: ReviewSessionProps) {
  const [config, setConfig] = useState<ReviewSessionConfig>(DEFAULT_SESSION_CONFIG)
  const [showConfig, setShowConfig] = useState(true)

  const [queue, setQueue] = useState<ReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [ratings, setRatings] = useState<Record<ReviewRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 })
  const startTimeRef = useRef(Date.now())
  const [revealed, setRevealed] = useState(false)
  const [mcAnswered, setMcAnswered] = useState(false)
  const [mcSelected, setMcSelected] = useState<string | null>(null)
  const [allVocabulary, setAllVocabulary] = useState<VocabularyEntry[]>([])
  const [modeOffset, setModeOffset] = useState(0)

  const currentItem = useMemo(() => queue[currentIndex] ?? null, [queue, currentIndex])

  function cycleMode() {
    setModeOffset(prev => prev + 1)
    setRevealed(false)
    setMcAnswered(false)
    setMcSelected(null)
  }

  const currentMode: ReviewMode = useMemo(() => {
    const modes = config.modes
    if (modes.length === 0) return 'word-to-meaning'
    return modes[(currentIndex + modeOffset) % modes.length]
  }, [config.modes, currentIndex, modeOffset])

  const ModeRenderer = useMemo(() => getModeRenderer(currentMode), [currentMode])

  const loadQueue = useCallback(async (cfg: ReviewSessionConfig) => {
    try {
      setLoading(true)
      setError(null)
      const [vocabulary, reviews] = await Promise.all([
        DatabaseService.getAll<VocabularyEntry>('vocabulary'),
        DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
      ])
      setAllVocabulary(vocabulary)
      const q = buildReviewQueue(vocabulary, reviews, cfg)
      setQueue(q)
      setCurrentIndex(0)
      setCompleted(false)
      setRatings({ again: 0, hard: 0, good: 0, easy: 0 })
      startTimeRef.current = Date.now()
      setRevealed(false)
      setMcAnswered(false)
      setMcSelected(null)
    } catch (err) {
      console.error('apps/web/src/features/vocabulary-review/ReviewSession.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }, [])

  const startSession = useCallback(async () => {
    setShowConfig(false)
    await loadQueue(config)
  }, [config, loadQueue])

  const handleRate = useCallback(async (rating: ReviewRating) => {
    if (!currentItem || saving) return
    setSaving(true)
    try {
      await handleRating(currentItem, rating)
      setRatings(prev => ({ ...prev, [rating]: prev[rating] + 1 }))
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setRevealed(false)
        setMcAnswered(false)
        setMcSelected(null)
      } else {
        setCompleted(true)
      }
    } catch (err) {
      console.error('apps/web/src/features/vocabulary-review/ReviewSession.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save review')
    } finally {
      setSaving(false)
    }
  }, [currentItem, saving, currentIndex, queue.length])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (showConfig || completed) return
      if (currentMode === 'typing') return

      if (e.key === 'r' || e.key === ' ') {
        e.preventDefault()
        setRevealed(prev => !prev)
        return
      }

      if (currentMode === 'multiple-choice' && !mcAnswered) return

      const keyMap: Record<string, ReviewRating> = {
        '1': 'again', '2': 'hard', '3': 'good', '4': 'easy',
      }
      const rating = keyMap[e.key]
      if (rating) {
        e.preventDefault()
        handleRate(rating)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showConfig, completed, currentMode, mcAnswered, handleRate])

  const distractors = useMemo(() => {
    if (currentMode !== 'multiple-choice' || !currentItem) return []
    return shufflePool(allVocabulary, currentItem.vocab, 3)
  }, [currentMode, currentItem, allVocabulary])

  if (showConfig) {
    return (
      <PageContent>
        <PageHeader
          icon={<IconVocabularyReview size={22} />}
          title="Review Settings"
          description="Configure your review session"
        />

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Topics</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map(t => {
                  const selected = config.topics.includes(t)
                  return (
                    <button
                      key={t}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        topics: selected ? prev.topics.filter(x => x !== t) : [...prev.topics, t],
                      }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setConfig(prev => ({ ...prev, topics: prev.topics.length === ALL_TOPICS.length ? [] : [...ALL_TOPICS] }))}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {config.topics.length === ALL_TOPICS.length ? 'Clear all' : 'Select all'}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty</p>
              <div className="flex gap-2">
                {ALL_DIFFICULTIES.map(d => {
                  const selected = config.difficulties.includes(d)
                  return (
                    <button
                      key={d}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        difficulties: selected ? prev.difficulties.filter(x => x !== d) : [...prev.difficulties, d],
                      }))}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        selected
                          ? d === 'easy' ? 'bg-green-600 text-white' : d === 'medium' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map(s => {
                  const selected = config.statuses.includes(s)
                  return (
                    <button
                      key={s}
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        statuses: selected ? prev.statuses.filter(x => x !== s) : [...prev.statuses, s],
                      }))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Review Modes</p>
              <div className="space-y-2">
                {REVIEW_MODES.map(m => {
                  const selected = config.modes.includes(m.value)
                  return (
                    <label key={m.value} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selected ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600'
                    }`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => setConfig(prev => ({
                          ...prev,
                          modes: selected
                            ? prev.modes.filter(x => x !== m.value)
                            : [...prev.modes, m.value],
                        }))}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{m.description}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Session Size
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={config.sessionSize}
                onChange={(e) => setConfig(prev => ({ ...prev, sessionSize: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>5</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{config.sessionSize} words</span>
                <span>50</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={startSession} className="w-full">
            Start Review
          </Button>
        </div>
      </PageContent>
    )
  }

  if (loading && queue.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          role="status"
          className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={() => loadQueue(config)}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed) {
    return (
      <SessionSummary
        ratings={ratings}
        totalTimeMs={Date.now() - startTimeRef.current}
        onRestart={() => setShowConfig(true)}
        onBack={onBack}
      />
    )
  }

  if (queue.length === 0) {
    return (
      <PageContent>
        <Card className="text-center">
          <CardContent className="py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">All caught up!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              No vocabulary due for review with the current filters.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => setShowConfig(true)}>Change Filters</Button>
              <Button variant="secondary" onClick={onBack}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </PageContent>
    )
  }

  return (
    <PageContent className="space-y-6">
      <PageHeader
        icon={<IconVocabularyReview size={22} />}
        title="Vocabulary Review"
        description={`${REVIEW_MODES.find(m => m.value === currentMode)?.label ?? currentMode} · Press Space to reveal`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={cycleMode}>
              Cycle Mode
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowConfig(true)}>
              Settings
            </Button>
          </div>
        }
      />

      <div data-testid="review-progress" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 font-medium tabular-nums">{currentIndex + 1} / {queue.length}</span>
      </div>

      {currentItem && (
        <Card data-testid="review-card">
          <CardContent className="space-y-6 py-6">
            <ModeRenderer
              vocab={currentItem.vocab}
              onReveal={() => setRevealed(prev => !prev)}
              revealed={revealed}
              {...(currentMode === 'multiple-choice' ? {
                distractors,
                onAnswer: (selected: string) => { setMcAnswered(true); setMcSelected(selected) },
                answered: mcAnswered,
                selected: mcSelected,
              } : {})}
            />

            <div className="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {RATING_BUTTONS.map(({ rating, label, shortcut, color }) => (
                  <Button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    disabled={saving || (currentMode === 'multiple-choice' && !mcAnswered) || (currentMode === 'typing' && !revealed)}
                    loading={saving}
                    className={`${color} text-white`}
                    size="sm"
                  >
                    {label}
                    <span className="ml-1 opacity-60">({shortcut})</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <span>
                {currentItem.vocab.difficulty.charAt(0).toUpperCase() + currentItem.vocab.difficulty.slice(1)}
                {' · '}
                {currentItem.vocab.topic || 'General'}
                {' · '}
                {currentItem.vocab.status}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </PageContent>
  )
}
