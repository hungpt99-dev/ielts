import { useState, useEffect } from 'react'
import ProgressTracker from '../features/progress/ProgressTracker'
import { computeProgressSnapshot, loadProgressSnapshot, saveProgressSnapshot } from '../features/progress/progressService'
import type { ProgressSnapshot } from '../features/progress/progressService'

export default function Progress() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const cached = loadProgressSnapshot()
        if (cached) {
          const today = new Date().toISOString().slice(0, 10)
          if (cached.generatedAt.slice(0, 10) === today) {
            if (mounted) {
              setSnapshot(cached)
              setLoading(false)
            }
            return
          }
        }
        const fresh = await computeProgressSnapshot()
        saveProgressSnapshot(fresh)
        if (mounted) {
          setSnapshot(fresh)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load progress data')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return <ProgressTracker snapshot={snapshot} loading={loading} error={error} />
}
