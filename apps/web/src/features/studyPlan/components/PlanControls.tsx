import { useCallback, useState } from 'react'
import { useStudyPlan } from '../hooks/useStudyPlan'
import Button from '@/components/ui/Button'

export default function PlanControls() {
  const { state, actions } = useStudyPlan()
  const { plan, isGenerating, generationState } = state
  const [regenerating, setRegenerating] = useState(false)

  const hasFailedChunks = (generationState?.failedChunks?.length ?? 0) > 0
  const needsResume = plan != null && (plan.status === 'partial' || plan.status === 'cancelled')
  const hasPlan = plan != null

  const handleRegenerate = useCallback(async () => {
    if (!plan?.profileSnapshot) return
    setRegenerating(true)
    try {
      await actions.regenerateFullPlan(plan.profileSnapshot)
    } finally {
      setRegenerating(false)
    }
  }, [plan?.profileSnapshot, actions])

  const handleResume = useCallback(async () => {
    if (!plan) return
    await actions.resumeGeneration(plan.id)
  }, [plan, actions])

  if (!isGenerating && !hasPlan) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isGenerating && (
        <Button
          variant="danger"
          size="sm"
          onClick={actions.cancelGeneration}
        >
          Cancel
        </Button>
      )}

      {!isGenerating && needsResume && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleResume}
        >
          Resume
        </Button>
      )}

      {!isGenerating && hasPlan && hasFailedChunks && (
        <Button
          variant="secondary"
          size="sm"
          onClick={actions.retryFailedChunk}
        >
          Retry Failed
        </Button>
      )}

      {!isGenerating && hasPlan && (
        <Button
          variant="outline"
          size="sm"
          loading={regenerating}
          disabled={regenerating}
          onClick={handleRegenerate}
        >
          Regenerate
        </Button>
      )}
    </div>
  )
}
