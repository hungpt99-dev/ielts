import { useState, useEffect } from 'react'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import ErrorBoundary from '../../components/ui/ErrorBoundary'
import ListeningPractice from '../../features/listening/ListeningPractice'

export default function ListeningPracticePage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        paddingTop: 'var(--spacing-md)',
      }}
    >
      {!ready ? (
        <div style={{ padding: '0 var(--spacing-sm)' }}>
          <LoadingSkeleton variant="card" count={3} gap="var(--spacing-md)" />
        </div>
      ) : (
        <ErrorBoundary>
          <ListeningPractice />
        </ErrorBoundary>
      )}
    </div>
  )
}
