import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { openAITutorChat } from '../../features/ai-tutor/utils/openChat'
import { emitStudyRoadmapViewed } from '../../features/websiteActions/eventEmitters'
import { ROUTES, STORAGE_KEYS } from '@ielts/config'
import {
  ensureRoadmap,
  toggleTask,
  getRoadmapUserProfile,
  generateRoadmapWithEngine,
} from '../../features/roadmap/roadmapService'
import type {
  RoadmapPhase,
  RoadmapDay,
  RoadmapUserProfile,
} from '../../features/roadmap/roadmapService'
import { useRoadmapEditor } from '../../features/roadmap/hooks/useRoadmapEditor'
import { addPhase, movePhase, removePhase } from '../../features/roadmap/roadmapCommands'
import RoadmapHeader from '../../features/roadmap/components/RoadmapHeader'
import PhaseMilestoneTimeline from '../../features/roadmap/components/PhaseMilestoneTimeline'
import PhaseSection from '../../features/roadmap/components/PhaseSection'
import RoadmapSummary from '../../features/roadmap/components/RoadmapSummary'
import AITutorRoadmapInsight from '../../features/roadmap/components/AITutorRoadmapInsight'
import { IconAward, IconEdit, IconMap, IconProgress, IconRefresh } from '@ielts/ui'
import PageContent from '../../components/layout/PageContent'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function FullStudyRoadmapPage() {
  const navigate = useNavigate()
  const todayRef = useRef<HTMLDivElement>(null)
  const { roadmap, loadRoadmap, isEditMode, toggleEditMode, applyCommand } = useRoadmapEditor()
  const roadmapRef = useRef(roadmap)
  roadmapRef.current = roadmap
  const [profile, setProfile] = useState<RoadmapUserProfile | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState<{ phase: string; current: number; total: number } | null>(null)
  const [taskRefreshKey, setTaskRefreshKey] = useState(0)

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      const data = await ensureRoadmap()
      loadRoadmap(data)
      const userProfile = getRoadmapUserProfile()
      setProfile(userProfile)

      const initialExpand = new Set<number>()
      if (data.currentPhaseIndex !== undefined) {
        initialExpand.add(data.currentPhaseIndex)
      }
      if (initialExpand.size === 0) initialExpand.add(0)
      setExpandedPhases(initialExpand)

      const settingsStr = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr)
          const hasKey = !!(settings.aiApiKey || settings.ai?.apiKey)
          setAiEnabled(hasKey)
        } catch (error) {
 console.error('apps/web/src/pages/roadmap/FullStudyRoadmapPage.tsx error:', error);
 /* ignore */ }
      }
    } catch (err) {
      console.error('apps/web/src/pages/roadmap/FullStudyRoadmapPage.tsx error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roadmap')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [loadRoadmap])

  useEffect(() => {
    loadData()
  }, [loadData])

  const roadmapEmitted = useRef(false)

  useEffect(() => {
    if (!loading && roadmap && !roadmapEmitted.current) {
      roadmapEmitted.current = true
      const weekCount = roadmap.phases.reduce((sum, p) => sum + p.weeks.length, 0)
      emitStudyRoadmapViewed(roadmap.userProfile?.id || 'roadmap', weekCount)
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [loading, roadmap])

  useEffect(() => {
    function handleProgress(e: Event) {
      const detail = (e as CustomEvent).detail as { phase: string; current: number; total: number }
      setEnrichProgress(detail)
    }
    window.addEventListener('plan-enrich-progress', handleProgress)
    return () => window.removeEventListener('plan-enrich-progress', handleProgress)
  }, [])

  const handleToggleTask = useCallback(async (phaseIndex: number, weekIndex: number, dayIndex: number, taskIndex: number) => {
    const r = roadmapRef.current
    if (!r) return
    try {
      const updated = await toggleTask(r, phaseIndex, weekIndex, dayIndex, taskIndex)
      loadRoadmap(updated)
      setTaskRefreshKey(k => k + 1)
    } catch (err) {
      console.error('toggleTask failed:', err)
    }
  }, [loadRoadmap])

  const handleRegenerate = useCallback(async () => {
    if (!roadmap || regenerating) return
    setRegenerating(true)
    setEnrichProgress(null)
    try {
      console.log('[Regenerate] Starting regeneration...')
      const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      const settings = raw ? JSON.parse(raw) : null
      console.log('[Regenerate] Settings loaded:', settings ? 'yes' : 'no')
      if (!settings) throw new Error('Settings not found')
      const { DatabaseService } = await import('../../services/storage/Database')
      const dates = new Set<string>()
      for (const phase of roadmap.phases) {
        for (const week of phase.weeks) {
          for (const day of week.days) {
            dates.add(day.date)
          }
        }
      }
      console.log('[Regenerate] Deleting', dates.size, 'dates of old tasks...')
      const allTasks = await DatabaseService.getAll<import('../../models').TaskEntry>('tasks')
      for (const t of allTasks) {
        if (dates.has(t.date.slice(0, 10))) {
          try { await DatabaseService.remove('tasks', t.id) } catch (error) {
      console.error('apps/web/src/pages/roadmap/FullStudyRoadmapPage.tsx error:', error);
          }
        }
      }
      console.log('[Regenerate] Calling generateRoadmapWithEngine...')
      const newRoadmap = await generateRoadmapWithEngine(settings)
      console.log('[Regenerate] New roadmap generated, saving...')
      loadRoadmap(newRoadmap)
      console.log('[Regenerate] Done!')
    } catch (err) {
      console.error('[Regenerate] Engine generation failed, falling back:', err)
      localStorage.removeItem(STORAGE_KEYS.localStorage.roadmap)
      await loadData(false)
    } finally {
      setRegenerating(false)
      setEnrichProgress(null)
    }
  }, [roadmap, loadRoadmap, loadData, regenerating])

  const handleScrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const handleAskAITutor = useCallback(() => {
    openAITutorChat('Help me review my study roadmap and suggest what I should focus on.')
  }, [])

  const handleAskAIPhase = useCallback((phase: RoadmapPhase) => {
    openAITutorChat(`Tell me more about the "${phase.name}" phase and what I should focus on.`)
  }, [])

  const handleAskAIDay = useCallback((day: RoadmapDay) => {
    openAITutorChat(`Help me with my study day (Day ${day.dayNumber}, ${day.date}). What should I prioritize?`)
  }, [])

  const handleAskFollowUp = useCallback(() => {
    openAITutorChat('I have a follow-up question about my study roadmap.')
  }, [])

  const handleAdjustPlan = useCallback(() => {
    loadData(false)
  }, [loadData])

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
      <PageContent className="space-y-6" role="status" aria-label="Loading your IELTS roadmap">
        <div className="space-y-4" aria-hidden="true">
          <div className="h-5 w-32 animate-pulse rounded" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          <div className="h-40 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          <div className="h-16 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
          ))}
          <div className="h-24 w-full animate-pulse rounded-2xl" style={{ backgroundColor: 'var(--color-surface-alt)' }} />
        </div>
      </PageContent>
    )
  }

  // ---- Error State ----
  if (error) {
    return (
      <PageContent className="flex items-center justify-center" role="alert">
        <div className="w-full space-y-4 text-center">
          <IconMap size={32} />
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
              onClick={() => navigate(ROUTES.dashboard)}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(ROUTES.onboarding)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
            >
              Go to Onboarding
            </button>
          </div>
        </div>
      </PageContent>
    )
  }

  // ---- Null state ----
  if (!roadmap) {
    return (
      <PageContent className="flex items-center justify-center">
        <div className="w-full space-y-4 text-center">
          <IconMap size={48} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Your IELTS journey hasn't started yet
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Generate your personalized study roadmap to see your complete path from today to exam day.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
            >
              Create My Study Plan
            </button>
            <button
              onClick={() => openAITutorChat()}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ borderColor: 'var(--color-tutor-border)', color: 'var(--color-tutor-accent)' }}
            >
              Talk to AI Tutor
            </button>
          </div>
        </div>
      </PageContent>
    )
  }

  // ---- All Complete! Celebration State ----
  const isAllComplete = roadmap.overallProgress >= 100

  if (isAllComplete) {
    return (
    <PageContent className="space-y-4 sm:space-y-6">
        <RoadmapHeader
          roadmap={roadmap}
          profile={profile}
          onScrollToToday={handleScrollToToday}
          onAskAITutor={handleAskAITutor}
        />

        <div className="space-y-4 text-center">
          <IconAward size={32} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {getGreeting()}, Champion!
          </h2>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
            You completed your entire IELTS roadmap! {profile ? `From Band ${profile.currentBand} to Band ${profile.targetBand} — incredible progress.` : ''}
          </p>

          <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3">
            <button
              onClick={() => navigate(ROUTES.mockTests)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
<IconEdit size={16} /> Take a Mock Test
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
                <><IconRefresh size={16} /> Start a New Journey</>
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
          enrichProgress={enrichProgress}
        />
      </PageContent>
    )
  }

  // ---- Normal Roadmap View ----
  return (
    <PageContent className="space-y-6">
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
        isEditMode={isEditMode}
        onToggleEditMode={toggleEditMode}
      />

      {!isEditMode && (
        <PhaseMilestoneTimeline
          phases={roadmap.phases}
          currentPhaseIndex={roadmap.currentPhaseIndex}
          onPhaseClick={handlePhaseClick}
        />
      )}

      {isEditMode && (
        <div
          className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            borderColor: 'var(--color-primary)',
            color: 'var(--color-primary)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span className="font-medium">Edit Mode</span>
          <span className="text-xs opacity-75">Click any text to edit · Use arrows to reorder · Add new items with the + buttons</span>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:gap-6 lg:flex-row lg:items-start">
        {/* Main content: phase list */}
        <div className="min-w-0 flex-1 space-y-5" id="phase-list">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Learning Phases
            </h2>
            {!isEditMode && (
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
            )}
          </div>

          {roadmap.phases.map((phase, pIdx) => (
            <div key={phase.id} ref={pIdx === roadmap.currentPhaseIndex ? todayRef : undefined}>
              <PhaseSection
                phase={phase}
                phaseIndex={pIdx}
                isCurrentPhase={pIdx === roadmap.currentPhaseIndex}
                defaultExpanded={expandedPhases.has(pIdx) || isEditMode}
                currentWeekIndex={roadmap.currentWeekIndex}
                onToggleTask={handleToggleTask}
                onAskAI={handleAskAIDay}
                onAskAIPhase={handleAskAIPhase}
                isEditMode={isEditMode}
                taskRefreshKey={taskRefreshKey}
                applyCommand={applyCommand}
                onMoveUp={isEditMode && pIdx > 0
                  ? () => applyCommand(r => movePhase(r, pIdx, pIdx - 1))
                  : undefined}
                onMoveDown={isEditMode && pIdx < roadmap.phases.length - 1
                  ? () => applyCommand(r => movePhase(r, pIdx, pIdx + 1))
                  : undefined}
                canMoveUp={pIdx > 0}
                canMoveDown={pIdx < roadmap.phases.length - 1}
                onRemovePhase={isEditMode
                  ? () => applyCommand(r => removePhase(r, pIdx))
                  : undefined}
              />
            </div>
          ))}

          {isEditMode && (
            <button
              onClick={() => applyCommand(r => addPhase(r))}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-medium transition-colors hover:brightness-95"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-primary)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Phase
            </button>
          )}
        </div>

        {/* Sidebar */}
        {!isEditMode && (
          <aside className="w-full space-y-4 sm:space-y-5 lg:w-80 lg:sticky lg:top-24 lg:shrink-0" aria-label="Roadmap sidebar">
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
              enrichProgress={enrichProgress}
            />
          </aside>
        )}
      </div>

    </PageContent>
  )
}
