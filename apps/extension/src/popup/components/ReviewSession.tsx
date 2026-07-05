import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { buildReviewQueue, handleRating, type ReviewItem, type ReviewRating } from '../services/reviewService'

interface ReviewSessionProps {
  onComplete: () => void
  onBack: () => void
}

const RATING_BUTTONS: { rating: ReviewRating; label: string; color: string }[] = [
  { rating: 'again', label: 'Again', color: '#ef4444' },
  { rating: 'hard', label: 'Hard', color: '#f97316' },
  { rating: 'good', label: 'Good', color: '#3b82f6' },
  { rating: 'easy', label: 'Easy', color: '#22c55e' },
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
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
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
          padding: '16px',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '32px' }} role="img" aria-label="error">⚠️</span>
        <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{error}</span>
        <button
          onClick={loadQueue}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '13px',
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
            fontSize: '13px',
            padding: '4px',
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
          padding: '24px 16px',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-primary-light, #dbeafe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          🎉
        </div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Review Complete!
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0 }}>
          Reviewed {queue.length} word{queue.length !== 1 ? 's' : ''} in {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            width: '100%',
            maxWidth: '280px',
          }}
        >
          {(Object.entries(ratings) as [ReviewRating, number][]).map(([rating, count]) => {
            const btn = RATING_BUTTONS.find(b => b.rating === rating)!
            return (
              <div
                key={rating}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: `${btn.color}10`,
                  border: `1px solid ${btn.color}30`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>{btn.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: btn.color }}>{count}</div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={loadQueue}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
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
              fontSize: '14px',
              fontWeight: 500,
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
          padding: '24px 16px',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--color-primary-light, #dbeafe)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          ✅
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
          No words to review
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
          All vocabulary is up to date.
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '13px',
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
        padding: '16px',
        gap: '16px',
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
            fontSize: '13px',
            fontWeight: 500,
            padding: '4px',
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: '12px', color: 'var(--color-muted)', fontWeight: 500 }}>
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      <div
        style={{
          height: '4px',
          borderRadius: '2px',
          background: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            borderRadius: '2px',
            background: 'var(--color-primary)',
            transition: 'width 0.3s ease',
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
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '100%',
            padding: '24px 16px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '22px',
              fontWeight: 700,
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
                fontSize: '13px',
                color: 'var(--color-muted)',
                marginTop: '4px',
                fontStyle: 'italic',
              }}
            >
              {currentItem.vocab.pronunciation}
            </div>
          )}

          {currentItem?.vocab.partOfSpeech && (
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-primary)',
                marginTop: '4px',
                fontWeight: 500,
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
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid var(--color-border)',
                fontSize: '15px',
                color: 'var(--color-text)',
                lineHeight: '1.5',
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
              fontSize: '13px',
              fontWeight: 500,
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
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  transition: 'opacity 0.15s',
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
            fontSize: '11px',
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
  fontSize: '10px',
  fontFamily: 'monospace',
  lineHeight: '1.4',
  color: 'var(--color-text)',
  background: 'var(--color-surface-alt, #f1f5f9)',
  border: '1px solid var(--color-border)',
  borderRadius: '3px',
  margin: '0 1px',
}
