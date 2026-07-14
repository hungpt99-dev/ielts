import { useState, useEffect, useCallback } from 'react'
import { getDueCount } from '../services/reviewService'
import { IconCheckCircle, IconRefresh, IconAlertCircle } from '@ielts/ui'

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
      console.error('apps/extension/src/popup/components/PendingReviews.tsx error:', err);
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
          gap: 'var(--spacing-sm)',
        }}
      >
        <div
          style={{
            width: 'var(--spacing-lg)',
            height: 'var(--spacing-lg)',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
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
          padding: 'var(--spacing-md)',
          gap: 'var(--spacing-sm)',
          textAlign: 'center',
        }}
      >
        <div style={{ width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', borderRadius: 'var(--radius-full)', background: 'var(--color-danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconAlertCircle size={24} style={{ color: 'var(--color-danger)' }} />
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{error}</span>
        <button
          onClick={loadDueCount}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
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
            fontSize: 'var(--text-xs)',
            padding: 'var(--spacing-2xs)',
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
          padding: 'var(--spacing-lg) var(--spacing-md)',
          gap: 'var(--spacing-sm)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 'var(--spacing-2xl)',
            height: 'var(--spacing-2xl)',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-2xl)',
          }}
        >
          <IconCheckCircle size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          All caught up!
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', margin: 0, maxWidth: '400px' }}>
          No vocabulary due for review. Add new words or check back later.
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
            fontSize: 'var(--text-xs)',
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
        padding: 'var(--spacing-lg) var(--spacing-md)',
        gap: 'var(--spacing-md)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 'var(--spacing-3xl)',
          height: 'var(--spacing-3xl)',
          borderRadius: '50%',
          background: 'var(--color-warning-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-3xl)',
        }}
      >
          <IconRefresh size={24} style={{ color: 'var(--color-warning)' }} />
        </div>

        <div>
          <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {dueCount} Review{dueCount !== 1 ? 's' : ''} Due
        </h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 'var(--spacing-2xs)', marginBottom: 0 }}>
          You have {dueCount} word{dueCount !== 1 ? 's' : ''} ready to review.
          Regular review helps you remember vocabulary long-term.
        </p>
      </div>

      <button
        onClick={onStartReview}
        style={{
          width: '100%',
          maxWidth: '240px',
          padding: 'var(--spacing-sm) var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          border: 'none',
          background: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-semibold)',
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
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
          fontSize: 'var(--text-xs)',
          padding: 'var(--spacing-2xs)',
        }}
      >
        Back to Dashboard
      </button>
    </div>
  )
}
