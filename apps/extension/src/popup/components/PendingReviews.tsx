import { useState, useEffect, useCallback } from 'react'
import { getDueCount } from '../services/reviewService'

interface PendingReviewsProps {
  onStartReview: () => void
  onBack: () => void
}

export default function PendingReviews({ onStartReview, onBack }: PendingReviewsProps) {
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDueCount = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const count = await getDueCount()
      setDueCount(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending reviews')
      setDueCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDueCount()
  }, [loadDueCount])

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
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
          Checking vocabulary…
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
          minHeight: '300px',
          padding: '16px',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '32px' }} role="img" aria-label="error">⚠️</span>
        <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>{error}</span>
        <button
          onClick={loadDueCount}
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
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (dueCount === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
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
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          All caught up!
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', margin: 0, maxWidth: '280px' }}>
          No vocabulary due for review. Add new words or check back later.
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
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
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
          background: 'var(--color-warning-light, #fef3c7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}
      >
        🔄
      </div>

      <div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {dueCount} Review{dueCount !== 1 ? 's' : ''} Due
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px', marginBottom: 0 }}>
          You have {dueCount} word{dueCount !== 1 ? 's' : ''} ready to review.
          Regular review helps you remember vocabulary long-term.
        </p>
      </div>

      <button
        onClick={onStartReview}
        style={{
          width: '100%',
          maxWidth: '240px',
          padding: '12px 24px',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        Start Review
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
        Back to Dashboard
      </button>
    </div>
  )
}
