import { useState, useEffect, useCallback } from 'react'
import ProgressTracker from '../features/progress/ProgressTracker'
import MobilePageContainer from '../components/layout/MobilePageContainer'
import PageHeader from '../components/layout/PageHeader'
import { IconProgress } from '@ielts/ui'
import { emitProgressViewed } from '../features/websiteActions/eventEmitters'
import { computeProgressSnapshot, loadProgressSnapshot, saveProgressSnapshot } from '../features/progress/progressService'
import type { ProgressSnapshot } from '../features/progress/progressService'

export default function Progress() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const cached = loadProgressSnapshot()
      if (cached) {
        const today = new Date().toISOString().slice(0, 10)
        if (cached.generatedAt.slice(0, 10) === today) {
          setSnapshot(cached)
          setLoading(false)
          return
        }
      }
      const fresh = await computeProgressSnapshot()
      saveProgressSnapshot(fresh)
      setSnapshot(fresh)
    } catch (err) {
      console.error('apps/web/src/pages/Progress.tsx error:', err);
      const cached = loadProgressSnapshot()
      if (cached) {
        setSnapshot(cached)
        setError('Showing data from earlier today. Some data may not be up to date.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load progress data')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().then(() => {}).catch(() => {})
  }, [load])

  useEffect(() => {
    if (!loading) {
      emitProgressViewed('all')
    }
  }, [loading])

  const handleRetry = useCallback(() => {
    load()
  }, [load])

  return (
    <MobilePageContainer className="pt-4 pb-8">
      <PageHeader icon={<IconProgress size={20} />} title="Learning Progress" description="Track your study progress across all IELTS skills" />
      <ProgressTracker snapshot={snapshot} loading={loading} error={error} onRetry={handleRetry} />
    </MobilePageContainer>
  )
}
