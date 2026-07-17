import { useState, useEffect, useCallback, useMemo } from 'react'
import type { VocabularyEntry, VocabReviewEntry, ReviewRating, VocabStatus } from '../../../models'
import { vocabularyRepo, vocabReviewRepo } from '../../../services/repositories'
import { getDailyReviewQueue, calculateNextReview, getInitialReviewEntry } from '../../../utils/spaced-repetition'
import Card, { CardContent } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PageHeader from '../../../components/layout/PageHeader'
import { IconVocabularyReview } from '@ielts/ui'

type ReviewMode = 'word-to-meaning' | 'meaning-to-word' | 'gap-fill' | 'collocation'

const REVIEW_MODES: { value: ReviewMode; label: string }[] = [
  { value: 'word-to-meaning', label: 'Word → Meaning' },
  { value: 'meaning-to-word', label: 'Meaning → Word' },
  { value: 'gap-fill', label: 'Gap-fill' },
  { value: 'collocation', label: 'Collocations' },
]

const RATING_BUTTONS: { rating: ReviewRating; label: string; color: string }[] = [
  { rating: 'again', label: 'Again', color: 'bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/80 focus-visible:ring-[var(--color-danger)]/50 dark:bg-[var(--color-danger)]/80 dark:hover:bg-[var(--color-danger)]' },
  { rating: 'hard', label: 'Hard', color: 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/80 focus-visible:ring-[var(--color-warning)]/50 dark:bg-[var(--color-warning)]/80 dark:hover:bg-[var(--color-warning)]' },
  { rating: 'good', label: 'Good', color: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 focus-visible:ring-[var(--color-primary)]/50 dark:bg-[var(--color-primary)]/80 dark:hover:bg-[var(--color-primary)]' },
  { rating: 'easy', label: 'Easy', color: 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/80 focus-visible:ring-[var(--color-success)]/50 dark:bg-[var(--color-success)]/80 dark:hover:bg-[var(--color-success)]' },
]

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function maskWord(word: string): string {
  if (word.length <= 2) return '_ '.repeat(word.length).trim()
  return word[0] + '_ '.repeat(word.length - 2).trim() + word[word.length - 1]
}

function generateGapFill(sentence: string, word: string): { before: string; blank: string; after: string } {
  const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$')})`, 'gi')
  const match = regex.exec(sentence)
  if (!match) return { before: sentence, blank: '', after: '' }

  const idx = match.index
  return {
    before: sentence.slice(0, idx),
    blank: sentence.slice(idx, idx + word.length),
    after: sentence.slice(idx + word.length),
  }
}

export default function ReviewMode({ onComplete }: { onComplete?: () => void }) {
  const [queue, setQueue] = useState<Array<{ vocab: VocabularyEntry; review: VocabReviewEntry | null }>>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<ReviewMode>('word-to-meaning')
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 })

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [vocabulary, reviews] = await Promise.all([
        vocabularyRepo.findAll(),
        vocabReviewRepo.findAll(),
      ])
      const q = getDailyReviewQueue(vocabulary, reviews, getToday())
      setQueue(q)
      setCurrentIndex(0)
      setCompleted(false)
      setStats({ again: 0, hard: 0, good: 0, easy: 0 })
    } catch (err) {
      console.error('apps/web/src/features/vocabulary/components/ReviewMode.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const currentItem = useMemo(() => queue[currentIndex], [queue, currentIndex])

  async function handleRate(rating: ReviewRating) {
    if (!currentItem || saving) return

    setSaving(true)
    try {
      const now = new Date()

      let review = currentItem.review
      if (!review) {
        review = getInitialReviewEntry(currentItem.vocab.id, now)
        await vocabReviewRepo.bulkUpsert([review])
      }

      const updatedReview = calculateNextReview(review, rating, now)
      await vocabReviewRepo.bulkUpsert([updatedReview])

      const vocabStatus: VocabStatus =
        rating === 'again' ? 'learning' :
        (rating === 'good' || rating === 'easy') && currentItem.vocab.status === 'reviewing' ? 'mastered' :
        currentItem.vocab.status === 'new' || currentItem.vocab.status === 'learning' ? 'learning' :
        currentItem.vocab.status

      if (currentItem.vocab.status !== vocabStatus) {
        const updatedVocab: VocabularyEntry = { ...currentItem.vocab, status: vocabStatus, updatedAt: now.toISOString() }
        await vocabularyRepo.bulkUpsert([updatedVocab])
      }

      setStats(prev => ({ ...prev, [rating]: prev[rating] + 1 }))

      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setCompleted(true)
        onComplete?.()
      }
    } catch (err) {
      console.error('apps/web/src/features/vocabulary/components/ReviewMode.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  const gapFill = useMemo(() => {
    if (!currentItem || mode !== 'gap-fill') return null
    return generateGapFill(currentItem.vocab.exampleSentence, currentItem.vocab.word)
  }, [currentItem, mode])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          role="status"
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent>
            <p style={{ color: 'var(--color-danger)' }}>{error}</p>
            <Button variant="secondary" className="mt-4" onClick={loadQueue}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (completed || queue.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        {completed && (
          <Card className="mb-6 text-center">
            <CardContent className="py-8">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--color-success-light)' }}
              >
                <svg className="h-8 w-8" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Review complete!</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                {stats.again > 0 && `${stats.again} again, `}
                {stats.hard > 0 && `${stats.hard} hard, `}
                {stats.good > 0 && `${stats.good} good, `}
                {stats.easy > 0 && `${stats.easy} easy`}
              </p>
              <Button className="mt-6" onClick={loadQueue}>Start New Review</Button>
            </CardContent>
          </Card>
        )}

        {queue.length === 0 && !completed && (
          <Card className="text-center">
            <CardContent className="py-12">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--color-primary-light)' }}
              >
                <svg className="h-8 w-8" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>All caught up!</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                No vocabulary due for review. Add new words or check back later.
              </p>
              <Button className="mt-6" variant="secondary" onClick={loadQueue}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        icon={<IconVocabularyReview size={22} />}
        title="Vocabulary Review"
        description="Spaced repetition review"
        actions={
          <div className="flex items-center gap-3">
            <label htmlFor="review-mode" className="sr-only">Review mode</label>
            <select
              id="review-mode"
              aria-label="Review mode"
              value={mode}
              onChange={e => setMode(e.target.value as ReviewMode)}
              className="rounded-lg border px-3 py-2 text-xs focus:outline-none focus:ring-1"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {REVIEW_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%`, backgroundColor: 'var(--color-primary)' }}
          />
        </div>
        <span className="shrink-0 font-medium tabular-nums">{currentIndex + 1} / {queue.length}</span>
      </div>

      <Card data-testid="review-card">
        <CardContent className="space-y-6 py-6">
          {mode === 'word-to-meaning' && (
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                {currentItem.vocab.word}
              </p>
              {currentItem.vocab.pronunciation && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                  /{currentItem.vocab.pronunciation}/
                </p>
              )}
              {currentItem.vocab.verbConjugation?.base && (
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {[
                    { label: 'V1', value: currentItem.vocab.verbConjugation.base },
                    { label: 'V2', value: currentItem.vocab.verbConjugation.pastSimple },
                    { label: 'V3', value: currentItem.vocab.verbConjugation.pastParticiple },
                    { label: '-ing', value: currentItem.vocab.verbConjugation.presentParticiple },
                    { label: '-s', value: currentItem.vocab.verbConjugation.thirdPersonSingular },
                  ].filter(f => f.value).map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}
                    >
                      <span style={{ opacity: 0.7 }}>{f.label}</span>
                      {f.value}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Meaning</p>
                <p className="mt-1 text-lg" style={{ color: 'var(--color-text)' }}>
                  {currentItem.vocab.meaning}
                </p>
                {currentItem.vocab.meaningVi && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                    {currentItem.vocab.meaningVi}
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === 'meaning-to-word' && (
            <div className="text-center">
              <p className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                {currentItem.vocab.meaning}
              </p>
              {currentItem.vocab.meaningVi && (
                <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                  {currentItem.vocab.meaningVi}
                </p>
              )}
              <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Word</p>
                <p className="mt-1 text-lg" style={{ color: 'var(--color-text)' }}>
                  {currentItem.vocab.word}
                </p>
                {currentItem.vocab.pronunciation && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                    /{currentItem.vocab.pronunciation}/
                  </p>
                )}
                {currentItem.vocab.verbConjugation?.base && (
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {[
                      { label: 'V1', value: currentItem.vocab.verbConjugation.base },
                      { label: 'V2', value: currentItem.vocab.verbConjugation.pastSimple },
                      { label: 'V3', value: currentItem.vocab.verbConjugation.pastParticiple },
                      { label: '-ing', value: currentItem.vocab.verbConjugation.presentParticiple },
                      { label: '-s', value: currentItem.vocab.verbConjugation.thirdPersonSingular },
                    ].filter(f => f.value).map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success-dark)' }}
                      >
                        <span style={{ opacity: 0.7 }}>{f.label}</span>
                        {f.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'gap-fill' && (
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                Fill in the blank
              </p>
              <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {gapFill?.before}
                <span className="rounded-md px-1 font-bold"
                  style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}
                >
                  {maskWord(currentItem.vocab.word)}
                </span>
                {gapFill?.after}
              </p>
              <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Answer</p>
                <p className="mt-1 text-lg" style={{ color: 'var(--color-text)' }}>
                  {currentItem.vocab.word}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                  {currentItem.vocab.meaning}
                </p>
              </div>
            </div>
          )}

          {mode === 'collocation' && (
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                Recall collocations
              </p>
              <p className="mt-4 text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
                {currentItem.vocab.word}
              </p>
              {currentItem.vocab.collocations.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Collocations</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {currentItem.vocab.collocations.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentItem.vocab.synonyms.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Synonyms</p>
                  <div className="mt-1 flex flex-wrap justify-center gap-2">
                    {currentItem.vocab.synonyms.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--color-success-light)',
                          color: 'var(--color-success)',
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 border-t pt-4"
            style={{ borderColor: 'var(--color-border)' }}>
            {RATING_BUTTONS.map(({ rating, label, color }) => (
              <Button
                key={rating}
                onClick={() => handleRate(rating)}
                disabled={saving}
                loading={saving}
                className={`${color} text-white`}
                size="sm"
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
