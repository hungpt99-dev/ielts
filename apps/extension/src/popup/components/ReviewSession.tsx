import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { buildReviewQueue, handleRating, type ReviewItem, type ReviewRating } from '../services/reviewService'
import { IconCheckCircle, IconBack, IconAlertCircle } from '@ielts/ui'
import { emitExtensionVocabularyReviewStarted } from '../../background/eventEmitters'

interface ReviewSessionProps {
  onComplete: () => void
  onBack: () => void
}

const RATING_BUTTONS: { rating: ReviewRating; label: string; color: string }[] = [
  { rating: 'again', label: 'Again', color: 'var(--color-danger)' },
  { rating: 'hard', label: 'Hard', color: 'var(--color-warning)' },
  { rating: 'good', label: 'Good', color: 'var(--color-primary)' },
  { rating: 'easy', label: 'Easy', color: 'var(--color-success)' },
]

export default function ReviewSession({ onComplete, onBack }: ReviewSessionProps) {
  const [queue, setQueue] = useState<ReviewItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [ratings, setRatings] = useState<Record<ReviewRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 })
  const startTimeRef = useRef(Date.now())

  const currentItem = useMemo(() => queue[currentIndex] ?? null, [queue, currentIndex])
  const progressPct = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0

  const loadQueue = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = await buildReviewQueue(20)
      setQueue(q)
      setCurrentIndex(0)
      setCompleted(false)
      setRatings({ again: 0, hard: 0, good: 0, easy: 0 })
      setRevealed(false)
      startTimeRef.current = Date.now()
      emitExtensionVocabularyReviewStarted(q.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const rateCurrent = useCallback(async (rating: ReviewRating) => {
    if (!currentItem || saving) return
    setSaving(true)
    try {
      await handleRating(currentItem, rating)
      setRatings(prev => ({ ...prev, [rating]: prev[rating] + 1 }))
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setRevealed(false)
      } else {
        setCompleted(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review')
    } finally {
      setSaving(false)
    }
  }, [currentItem, saving, currentIndex, queue.length])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (completed) return

      if (e.key === ' ' || e.key === 'r') {
        e.preventDefault()
        setRevealed(prev => !prev)
        return
      }

      const keyMap: Record<string, ReviewRating> = {
        '1': 'again', '2': 'hard', '3': 'good', '4': 'easy',
      }
      const rating = keyMap[e.key]
      if (rating) {
        e.preventDefault()
        rateCurrent(rating)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [completed, rateCurrent])

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading review"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: 'var(--spacing-sm)',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
          Loading review queue…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: 'var(--spacing-md)',
          gap: 'var(--spacing-sm)',
          textAlign: 'center',
        }}
      >
        <div style={{ width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', borderRadius: 'var(--radius-full)', background: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconAlertCircle size={24} style={{ color: 'var(--color-danger)' }} />
        </div>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }}>{error}</span>
        <button
          onClick={loadQueue}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
          }}
        >
          Retry
        </button>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            padding: 'var(--spacing-2xs)',
          }}
        >
          Back
        </button>
      </div>
    )
  }

  if (completed) {
    const totalTime = Math.round((Date.now() - startTimeRef.current) / 1000)
    const minutes = Math.floor(totalTime / 60)
    const seconds = totalTime % 60
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: 'var(--spacing-lg) var(--spacing-md)',
          gap: 'var(--spacing-md)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-light, #dbeafe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          <IconCheckCircle size={28} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Review Complete!
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', margin: 0 }}>
          Reviewed {queue.length} word{queue.length !== 1 ? 's' : ''} in {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-xs)',
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {(Object.entries(ratings) as [ReviewRating, number][]).map(([rating, count]) => {
            const btn = RATING_BUTTONS.find(b => b.rating === rating)!
            return (
              <div
                key={rating}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  background: `color-mix(in srgb, ${btn.color} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${btn.color} 30%, transparent)`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontWeight: 'var(--weight-medium)' }}>{btn.label}</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: btn.color }}>{count}</div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
          <button
            onClick={loadQueue}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Review Again
          </button>
          <button
            onClick={onComplete}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: 'var(--spacing-lg) var(--spacing-md)',
          gap: 'var(--spacing-sm)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary-light, #dbeafe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          <IconCheckCircle size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>
          No words to review
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
          All vocabulary is up to date.
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: 'var(--spacing-xs)',
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px',
        padding: 'var(--spacing-md)',
        gap: 'var(--spacing-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            padding: 'var(--spacing-2xs)',
          }}
        >
          <IconBack size={14} /> Back
        </button>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontWeight: 'var(--weight-medium)' }}>
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      <div
        style={{
          height: '4px',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            borderRadius: 'var(--radius-xs)',
            background: 'var(--color-primary)',
            transition: 'var(--transition-slow)',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-sm)',
        }}
      >
        <div
          style={{
            width: '100%',
            padding: 'var(--spacing-lg) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '22px',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text)',
              lineHeight: '1.3',
              wordBreak: 'break-word',
            }}
          >
            {currentItem?.vocab.word}
          </div>

          {currentItem?.vocab.pronunciation && (
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-muted)',
                marginTop: 'var(--spacing-2xs)',
                fontStyle: 'italic',
              }}
            >
              {currentItem.vocab.pronunciation}
            </div>
          )}

          {currentItem?.vocab.partOfSpeech && (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-primary)',
                marginTop: 'var(--spacing-2xs)',
                fontWeight: 'var(--weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {currentItem.vocab.partOfSpeech}
            </div>
          )}

          {revealed && currentItem?.vocab.meaning && (
            <div
              style={{
                marginTop: 'var(--spacing-md)',
                paddingTop: 'var(--spacing-md)',
                borderTop: '1px solid var(--color-border)',
                fontSize: '15px',
                color: 'var(--color-text)',
                lineHeight: 'var(--leading-normal)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {currentItem.vocab.meaning}
            </div>
          )}
        </div>

        {!revealed && (
          <button
            onClick={() => setRevealed(true)}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              cursor: 'pointer',
            }}
          >
            Reveal Answer
          </button>
        )}

        {revealed && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              width: '100%',
            }}
          >
            {RATING_BUTTONS.map(({ rating, label, color }) => (
              <button
                key={rating}
                onClick={() => rateCurrent(rating)}
                disabled={saving}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: color,
                  color: 'var(--color-text-inverse)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  transition: 'var(--transition-fast)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '6px',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span>Press <kbd style={kbdStyle}>Space</kbd> to reveal</span>
          <span>·</span>
          <span><kbd style={kbdStyle}>1</kbd>-<kbd style={kbdStyle}>4</kbd> to rate</span>
        </div>
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 5px',
  fontSize: 'var(--text-xs)',
  fontFamily: 'var(--font-mono)',
  lineHeight: '1.4',
  color: 'var(--color-text)',
  background: 'var(--color-surface-alt, #f1f5f9)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xs)',
  margin: '0 1px',
}
