import { useState, useEffect, useCallback, useMemo } from 'react'
import type { VocabularyEntry, VocabReviewEntry, ReviewRating, VocabStatus } from '../models'
import { DatabaseService } from '../services/storage/Database'
import { getDailyReviewQueue, calculateNextReview, getInitialReviewEntry } from '../utils/spaced-repetition'
import Card, { CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'

type ReviewMode = 'word-to-meaning' | 'meaning-to-word' | 'gap-fill' | 'collocation'

const REVIEW_MODES: { value: ReviewMode; label: string }[] = [
  { value: 'word-to-meaning', label: 'Word → Meaning' },
  { value: 'meaning-to-word', label: 'Meaning → Word' },
  { value: 'gap-fill', label: 'Gap-fill' },
  { value: 'collocation', label: 'Collocations' },
]

const RATING_BUTTONS: { rating: ReviewRating; label: string; color: string }[] = [
  { rating: 'again', label: 'Again', color: 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-400' },
  { rating: 'hard', label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400' },
  { rating: 'good', label: 'Good', color: 'bg-blue-500 hover:bg-blue-600 focus-visible:ring-blue-400' },
  { rating: 'easy', label: 'Easy', color: 'bg-green-500 hover:bg-green-600 focus-visible:ring-green-400' },
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

export default function VocabularyReview() {
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
        DatabaseService.getAll<VocabularyEntry>('vocabulary'),
        DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
      ])
      const q = getDailyReviewQueue(vocabulary, reviews, getToday())
      setQueue(q)
      setCurrentIndex(0)
      setCompleted(false)
      setStats({ again: 0, hard: 0, good: 0, easy: 0 })
    } catch (err) {
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
        await DatabaseService.put('vocabularyReviews', review)
      }

      const updatedReview = calculateNextReview(review, rating, now)
      await DatabaseService.put('vocabularyReviews', updatedReview)

      const vocabStatus: VocabStatus =
        rating === 'again' ? 'learning' :
        currentItem.vocab.status === 'new' || currentItem.vocab.status === 'learning' ? 'learning' :
        currentItem.vocab.status

      if (currentItem.vocab.status !== vocabStatus) {
        const updatedVocab: VocabularyEntry = { ...currentItem.vocab, status: vocabStatus, updatedAt: now.toISOString() }
        await DatabaseService.put('vocabulary', updatedVocab)
      }

      setStats(prev => ({ ...prev, [rating]: prev[rating] + 1 }))

      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setCompleted(true)
      }
    } catch (err) {
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Review complete!</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">All caught up!</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Vocabulary Review
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Spaced repetition review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="review-mode" className="sr-only">Review mode</label>
          <select
            id="review-mode"
            aria-label="Review mode"
            value={mode}
            onChange={e => setMode(e.target.value as ReviewMode)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {REVIEW_MODES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div data-testid="review-progress" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 font-medium tabular-nums">{currentIndex + 1} / {queue.length}</span>
      </div>

      <Card data-testid="review-card">
        <CardContent className="space-y-6 py-6">
          {mode === 'word-to-meaning' && (
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {currentItem.vocab.word}
              </p>
              {currentItem.vocab.pronunciation && (
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                  /{currentItem.vocab.pronunciation}/
                </p>
              )}
              <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Meaning</p>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">
                  {currentItem.vocab.meaning}
                </p>
                {currentItem.vocab.meaningVi && (
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    {currentItem.vocab.meaningVi}
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === 'meaning-to-word' && (
            <div className="text-center">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {currentItem.vocab.meaning}
              </p>
              {currentItem.vocab.meaningVi && (
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                  {currentItem.vocab.meaningVi}
                </p>
              )}
              <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Word</p>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">
                  {currentItem.vocab.word}
                </p>
                {currentItem.vocab.pronunciation && (
                  <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                    /{currentItem.vocab.pronunciation}/
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === 'gap-fill' && (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Fill in the blank
              </p>
              <p className="mt-4 text-lg leading-relaxed text-slate-900 dark:text-slate-100">
                {gapFill?.before}
                <span className="rounded-md bg-yellow-100 px-1 font-bold text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                  {maskWord(currentItem.vocab.word)}
                </span>
                {gapFill?.after}
              </p>
              <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Answer</p>
                <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">
                  {currentItem.vocab.word}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {currentItem.vocab.meaning}
                </p>
              </div>
            </div>
          )}

          {mode === 'collocation' && (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Recall collocations
              </p>
              <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {currentItem.vocab.word}
              </p>
              {currentItem.vocab.collocations.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Collocations</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {currentItem.vocab.collocations.map((c, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {currentItem.vocab.synonyms.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Synonyms</p>
                  <div className="mt-1 flex flex-wrap justify-center gap-2">
                    {currentItem.vocab.synonyms.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
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
