import { useState, useEffect } from 'react'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import ErrorBoundary from '../../components/ui/ErrorBoundary'
import SpeakingPractice from '../../features/speaking/SpeakingPractice'
import MobilePageContainer from '../../components/layout/MobilePageContainer'

export default function SpeakingPracticePage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <MobilePageContainer className="pt-4">
      {!ready ? (
        <div style={{ padding: '0 var(--spacing-sm)' }}>
          <LoadingSkeleton variant="card" count={3} gap="var(--spacing-md)" />
        </div>
      ) : (
        <ErrorBoundary>
          <SpeakingPractice />
        </ErrorBoundary>
      )}
    </MobilePageContainer>
  )
}
