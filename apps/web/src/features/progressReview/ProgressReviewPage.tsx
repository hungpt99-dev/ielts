import { useCallback } from 'react'
import ProgressReviewPanel from './components/ProgressReviewPanel'
import { useProgressReview } from './hooks/useProgressReview'

export default function ProgressReviewPage() {
  const { report, loading, error, generate } = useProgressReview()

  const handleGenerate = useCallback((range: { start: string; end: string }) => {
    generate(range)
  }, [generate])

  return (
    <ProgressReviewPanel
      report={report}
      loading={loading}
      error={error}
      onGenerate={handleGenerate}
    />
  )
}
