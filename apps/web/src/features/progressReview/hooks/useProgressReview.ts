import { useState, useCallback } from 'react'
import type { ProgressReviewReport } from '../components/ProgressReviewPanel'
import type { DateRange } from '../components/DateRangeSelector'
import { generateProgressReview } from '../services/progressReviewService'

export interface UseProgressReviewState {
  report: ProgressReviewReport | null
  loading: boolean
  error: string | null
  generate: (range: DateRange) => void
}

export function useProgressReview(): UseProgressReviewState {
  const [report, setReport] = useState<ProgressReviewReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (range: DateRange) => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const { report: result, error: resultError } = await generateProgressReview(range)
      if (resultError && !result) {
        setError(resultError)
      } else {
        setReport(result)
        if (resultError) {
          setError(resultError)
        }
      }
    } catch (err) {
      console.error('apps/web/src/features/progressReview/hooks/useProgressReview.ts error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate progress review')
    } finally {
      setLoading(false)
    }
  }, [])

  return { report, loading, error, generate }
}
