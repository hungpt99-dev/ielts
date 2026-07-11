import { useState, useEffect, useCallback } from 'react'
import { IconAITutor, IconMessageSquare, IconSettings } from '@ielts/ui'
import type { RoadmapData } from '../roadmapService'

interface AITutorRoadmapInsightProps {
  roadmap: RoadmapData
  profile: {
    targetBand: number
    currentBand: number
    examDate: string
    dailyStudyMinutes: number
    weakSkills: string[]
    studyGoal: string
  } | null
  aiEnabled: boolean
  onAskFollowUp: () => void
  onAdjustPlan: () => void
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function generateLocalInsight(roadmap: RoadmapData, profile: AITutorRoadmapInsightProps['profile']): string {
  const currentPhase = roadmap.phases[roadmap.currentPhaseIndex]
  const weekRemaining = roadmap.phases.slice(roadmap.currentPhaseIndex)
    .reduce((sum, p) => sum + p.weeks.filter(w => !w.isComplete).length, 0)

  const parts: string[] = []

  if (currentPhase) {
    parts.push(`You're in the **${currentPhase.name}** phase, `)
    parts.push(`with **${roadmap.overallProgress}%** of your overall roadmap complete. `)
    parts.push(`This phase focuses on ${currentPhase.description.toLowerCase()} `)
    parts.push(`(targeting ${currentPhase.targetRange}).`)
  }

  if (profile?.weakSkills && profile.weakSkills.length > 0) {
    const weakSkills = profile.weakSkills.slice(0, 2)
    parts.push(` Your weak areas — **${weakSkills.join(' and ')}** — are being prioritized `)
    parts.push(`in the current week's tasks.`)
  }

  if (weekRemaining > 0) {
    parts.push(` You have **${weekRemaining} week${weekRemaining > 1 ? 's' : ''} remaining** `)
    parts.push(`in this phase.`)
  }

  if (profile) {
    const bandGap = profile.targetBand - profile.currentBand
    if (bandGap > 0) {
      parts.push(` Your journey from Band ${profile.currentBand} to Band ${profile.targetBand} `)
      parts.push(`is ${bandGap.toFixed(1)} bands away.`)
    }
  }

  parts.push(` ${getGreeting()}! Keep up the consistent effort — every task brings you closer to your target.`)

  return parts.join('')
}

export default function AITutorRoadmapInsight({ roadmap, profile, aiEnabled, onAskFollowUp, onAdjustPlan }: AITutorRoadmapInsightProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const generateInsight = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      if (aiEnabled) {
        const message = generateLocalInsight(roadmap, profile)
        setInsight(message)
      } else {
        setInsight(null)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [roadmap, profile, aiEnabled])

  useEffect(() => {
    generateInsight()
  }, [generateInsight])

  if (loading) {
    return (
      <section aria-label="AI Roadmap insight loading" className="space-y-3">
        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 animate-pulse rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
            <div className="h-4 w-48 animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
            <div className="h-3 w-5/6 animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
            <div className="h-3 w-4/6 animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          </div>
        </div>
      </section>
    )
  }

  if (!aiEnabled) {
    return (
      <section aria-label="AI Tutor insight" className="space-y-4">
        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            backgroundColor: 'var(--color-tutor-accent-light)',
            borderColor: 'var(--color-tutor-border)',
          }}
        >
          <div className="flex items-center gap-3">
<IconAITutor size={24} />
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--color-tutor-accent)' }}>
                AI Roadmap Insights
              </h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-tutor-text)' }}>
                Connect an AI provider in Settings to get personalized roadmap insights and recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={onAskFollowUp}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95"
            style={{
              backgroundColor: 'var(--color-tutor-accent)',
              color: 'white',
            }}
          >
            Go to Settings →
          </button>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="AI insight error" className="space-y-4">
        <div
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Unable to generate insight right now.
          </p>
          <button
            onClick={generateInsight}
            className="mt-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            Try Again
          </button>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="AI Tutor roadmap insight" className="space-y-4">
      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          backgroundColor: 'var(--color-tutor-accent-light)',
          borderColor: 'var(--color-tutor-border)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
<span className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-tutor-accent)', color: 'white' }}>
            <IconAITutor size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-tutor-accent)' }}>
              Your Roadmap at a Glance
            </h3>
          </div>
        </div>

        {insight && (
          <div className="text-sm leading-relaxed" style={{ color: 'var(--color-tutor-text)' }}>
            {insight.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={onAskFollowUp}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-tutor-accent)',
              color: 'white',
            }}
          >
<IconMessageSquare size={14} /> Ask Follow-up Question
          </button>
          <button
            onClick={onAdjustPlan}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95 active:scale-[0.98]"
            style={{
              borderColor: 'var(--color-tutor-border)',
              color: 'var(--color-tutor-accent)',
              backgroundColor: 'transparent',
            }}
          >
<IconSettings size={14} /> Adjust Plan Based on This
          </button>
        </div>
      </div>
    </section>
  )
}
