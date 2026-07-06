import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ensureRoadmap,
  toggleTask,
  getRecommendations,
  getTodayDay,
  getNextIncompleteTask,
  getRoadmapUserProfile,
  getExamCountdown,
} from '../../features/roadmap/roadmapService'
import type {
  RoadmapData,
  RoadmapPhase,
  RoadmapWeek,
  RoadmapDay,
  RoadmapUserProfile,
} from '../../features/roadmap/roadmapService'
import RoadmapHeader from '../../features/roadmap/components/RoadmapHeader'
import PhaseMilestoneTimeline from '../../features/roadmap/components/PhaseMilestoneTimeline'
import PhaseSection from '../../features/roadmap/components/PhaseSection'
import RoadmapSummary from '../../features/roadmap/components/RoadmapSummary'
import AITutorRoadmapInsight from '../../features/roadmap/components/AITutorRoadmapInsight'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function FullStudyRoadmapPage() {
  const navigate = useNavigate()
  const todayRef = useRef<HTMLDivElement>(null)
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [profile, setProfile] = useState<RoadmapUserProfile | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      const data = await ensureRoadmap()
      setRoadmap(data)
      const userProfile = getRoadmapUserProfile()
      setProfile(userProfile)

      const initialExpand = new Set<number>()
      if (data.currentPhaseIndex !== undefined) {
        initialExpand.add(data.currentPhaseIndex)
      }
      if (initialExpand.size === 0) initialExpand.add(0)
      setExpandedPhases(initialExpand)

      const settingsStr = localStorage.getItem('ielts-app-settings')
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr)
          setAiEnabled(!!(settings.aiApiKey && settings.aiEnabled !== false))
        } catch { /* ignore */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!loading && roadmap) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [loading, roadmap])

  const handleToggleTask = useCallback(async (phaseIndex: number, weekIndex: number, dayIndex: number) => {
    if (!roadmap) return
    try {
      const updated = await toggleTask(roadmap, phaseIndex, weekIndex, dayIndex)
      setRoadmap(updated)
    } catch {
      // Revert handled by toggleTask
    }
  }, [roadmap])

  const handleRegenerate = useCallback(async () => {
    if (!roadmap || regenerating) return
    setRegenerating(true)
    try {
      localStorage.removeItem('ielts-roadmap')
      await loadData(false)
    } finally {
      setRegenerating(false)
    }
  }, [roadmap, loadData, regenerating])

  const handleScrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleAskAITutor = useCallback(() => {
    navigate('/tutor', { state: { context: 'roadmap-plan', roadmapData: roadmap } })
  }, [navigate, roadmap])

  const handleAskAIPhase = useCallback((phase: RoadmapPhase) => {
    navigate('/tutor', { state: { context: 'roadmap-phase', phaseName: phase.name, phaseId: phase.id } })
  }, [navigate])

  const handleAskAIDay = useCallback((day: RoadmapDay) => {
    navigate('/tutor', { state: { context: 'roadmap-day', dayId: day.id, date: day.date, objective: day.objective } })
  }, [navigate])

  const handleAskFollowUp = useCallback(() => {
    navigate('/tutor', { state: { context: 'roadmap-insight' } })
  }, [navigate])

  const handleAdjustPlan = useCallback(() => {
    navigate('/plan')
  }, [navigate])

  const handlePhaseClick = useCallback((index: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6" role="status" aria-label="Loading your IELTS roadmap">
        <div className="space-y-4" aria-hidden="true">
          <div className="h-5 w-32 animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          <div className="h-40 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          <div className="h-16 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          ))}
          <div className="h-24 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
        </div>
      </div>
    )
  }

  // ---- Error State ----
  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-md items-center justify-center p-8" role="alert">
        <div className="w-full space-y-4 text-center">
          <div className="text-5xl">🗺️</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Couldn't load your roadmap
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {error}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Please complete the onboarding first to set up your IELTS goals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
            >
              Go to Onboarding
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Null state ----
  if (!roadmap) {
    return (
      <div className="mx-auto flex w-full max-w-lg items-center justify-center p-8">
        <div className="w-full space-y-4 text-center">
          <div className="text-5xl">🗺️</div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Your IELTS journey hasn't started yet
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Generate your personalized study roadmap to see your complete path from today to exam day.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate('/plan')}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
            >
              Create My Study Plan
            </button>
            <button
              onClick={() => navigate('/tutor')}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ borderColor: 'var(--color-tutor-border)', color: 'var(--color-tutor-accent)' }}
            >
              Talk to AI Tutor
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- All Complete! Celebration State ----
  const isAllComplete = roadmap.overallProgress >= 100
  const todayStr = new Date().toISOString().split('T')[0]
  const bandGap = profile ? profile.targetBand - profile.currentBand : 0

  if (isAllComplete) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6">
        <RoadmapHeader
          roadmap={roadmap}
          profile={profile}
          onScrollToToday={handleScrollToToday}
          onAskAITutor={handleAskAITutor}
        />

        <div className="space-y-4 text-center">
          <div className="text-6xl">🏆</div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {getGreeting()}, Champion!
          </h2>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
            You completed your entire IELTS roadmap! {profile ? `From Band ${profile.currentBand} to Band ${profile.targetBand} — incredible progress.` : ''}
          </p>

          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
            <button
              onClick={() => navigate('/mock-tests')}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              📝 Take a Mock Test
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all hover:brightness-95"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              📊 View Full Progress
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all hover:brightness-95"
              style={{
                borderColor: 'var(--color-border)',
                color: regenerating ? 'var(--color-muted)' : 'var(--color-text-secondary)',
                cursor: regenerating ? 'not-allowed' : 'pointer',
                opacity: regenerating ? 0.6 : 1,
              }}
            >
              {regenerating ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              ) : (
                '🔄 Start a New Journey'
              )}
            </button>
          </div>
        </div>

        <RoadmapSummary
          roadmap={roadmap}
          profile={profile}
          onRegenerate={handleRegenerate}
          onAskAIReview={handleAskFollowUp}
          regenerating={regenerating}
        />
      </div>
    )
  }

  // ---- Normal Roadmap View ----
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Skip link for keyboard users */}
      <a
        href="#today-section"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
      >
        Skip to today's tasks
      </a>

      <RoadmapHeader
        roadmap={roadmap}
        profile={profile}
        onScrollToToday={handleScrollToToday}
        onAskAITutor={handleAskAITutor}
      />

      <PhaseMilestoneTimeline
        phases={roadmap.phases}
        currentPhaseIndex={roadmap.currentPhaseIndex}
        onPhaseClick={handlePhaseClick}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main content: phase list */}
        <div className="min-w-0 flex-1 space-y-5" id="phase-list">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Learning Phases
            </h2>
            <button
              onClick={() => {
                if (expandedPhases.size === roadmap.phases.length) {
                  setExpandedPhases(new Set())
                } else {
                  setExpandedPhases(new Set(roadmap.phases.map((_, i) => i)))
                }
              }}
              className="text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
            >
              {expandedPhases.size === roadmap.phases.length ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          {roadmap.phases.map((phase, pIdx) => (
            <div key={phase.id} ref={pIdx === roadmap.currentPhaseIndex ? todayRef : undefined}>
              <PhaseSection
                phase={phase}
                phaseIndex={pIdx}
                isCurrentPhase={pIdx === roadmap.currentPhaseIndex}
                defaultExpanded={expandedPhases.has(pIdx)}
                currentWeekIndex={roadmap.currentWeekIndex}
                onToggleTask={handleToggleTask}
                onAskAI={handleAskAIDay}
                onAskAIPhase={handleAskAIPhase}
              />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="w-full space-y-5 lg:w-80 lg:sticky lg:top-24 lg:shrink-0" aria-label="Roadmap sidebar">
          <AITutorRoadmapInsight
            roadmap={roadmap}
            profile={profile}
            aiEnabled={aiEnabled}
            onAskFollowUp={handleAskFollowUp}
            onAdjustPlan={handleAdjustPlan}
          />

          <RoadmapSummary
            roadmap={roadmap}
            profile={profile}
            onRegenerate={handleRegenerate}
            onAskAIReview={handleAskFollowUp}
            regenerating={regenerating}
          />
        </aside>
      </div>
    </div>
  )
}
