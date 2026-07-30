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
  loadRegenerationState,
  clearRegenerationState,
  loadRoadmap as loadRoadmapFromStorage,
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
  const [persistedRegen, setPersistedRegen] = useState(loadRegenerationState())

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
    const existing = loadRoadmapFromStorage()
    if (existing && existing.phases.length > 0) {
      loadRoadmap(existing)
      const userProfile = getRoadmapUserProfile()
      setProfile(userProfile)
      const initialExpand = new Set<number>()
      if (existing.currentPhaseIndex !== undefined) {
        initialExpand.add(existing.currentPhaseIndex)
      }
      if (initialExpand.size === 0) initialExpand.add(0)
      setExpandedPhases(initialExpand)

      const settingsStr = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      if (settingsStr) {
        try {
          const settings = JSON.parse(settingsStr)
          const hasKey = !!(settings.aiApiKey || settings.ai?.apiKey)
          setAiEnabled(hasKey)
        } catch { /* ignore */ }
      }
    }
    setLoading(false)
  }, [loadRoadmap])

  useEffect(() => {
    const current = loadRegenerationState()
    if (current && current.status !== 'idle' && current.status !== 'completed') {
      const age = Date.now() - new Date(current.startedAt).getTime()
      if (age > 10 * 60 * 1000) {
        clearRegenerationState()
        return
      }
      setPersistedRegen(current)
      setEnrichProgress({ phase: current.phase, current: current.current, total: current.total })
    }
  }, [])

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
      setPersistedRegen({
        status: 'enriching-tasks',
        startedAt: new Date().toISOString(),
        phase: detail.phase,
        current: detail.current,
        total: detail.total,
      })
    }
    window.addEventListener('plan-enrich-progress', handleProgress)
    return () => window.removeEventListener('plan-enrich-progress', handleProgress)
  }, [])

  useEffect(() => {
    if (enrichProgress && enrichProgress.current >= enrichProgress.total) {
      const timer = setTimeout(() => {
        setEnrichProgress(null)
        setPersistedRegen(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [enrichProgress])

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
    console.log('[Regenerate] Called, roadmap:', !!roadmap, 'regenerating:', regenerating)
    if (!roadmap || regenerating) return
    const saved = loadRegenerationState()
    console.log('[Regenerate] isResume:', !!saved?.planData, 'hasEnriched:', !!saved?.enrichedPlanData)
    setRegenerating(true)
    setPersistedRegen(null)
    const isResume = !!loadRegenerationState()?.planData
    if (!isResume) {
      setEnrichProgress(null)
    }
    try {
      console.log('[Regenerate] Starting regeneration...')
      const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      const settings = raw ? JSON.parse(raw) : null
      console.log('[Regenerate] Settings loaded:', settings ? 'yes' : 'no')
      if (!settings) throw new Error('Settings not found')
      const { taskRepo } = await import('../../services/repositories')
      const dates = new Set<string>()
      for (const phase of roadmap.phases) {
        for (const week of phase.weeks) {
          for (const day of week.days) {
            dates.add(day.date)
          }
        }
      }
      console.log('[Regenerate] Deleting', dates.size, 'dates of old tasks...')
      const allTasks = await taskRepo.findAll()
      for (const t of allTasks) {
        if (dates.has(t.date.slice(0, 10))) {
          try { await taskRepo.delete(t.id) } catch (error) {
      console.error('apps/web/src/pages/roadmap/FullStudyRoadmapPage.tsx error:', error);
          }
        }
      }
      console.log('[Regenerate] Calling generateRoadmapWithEngine...')
      const newRoadmap = await generateRoadmapWithEngine(settings)
      console.log('[Regenerate] New roadmap generated, saving...')
      loadRoadmap(newRoadmap)
      setPersistedRegen(null)
      console.log('[Regenerate] Done!')
    } catch (err) {
      console.error('[Regenerate] Engine generation failed, falling back:', err)
      localStorage.removeItem(STORAGE_KEYS.localStorage.roadmap)
      clearRegenerationState()
      setPersistedRegen(null)
      await loadData(false)
    } finally {
      setRegenerating(false)
      setEnrichProgress(null)
    }
  }, [roadmap, loadRoadmap, loadData, regenerating])

  useEffect(() => {
    const saved = loadRegenerationState()
    console.log('[AutoResume] checking:', { loading, hasRoadmap: !!roadmap, hasPlanData: !!saved?.planData, hasEnrichedPlan: !!saved?.enrichedPlanData, regenerating })
    if (!loading && roadmap && (saved?.enrichedPlanData || saved?.planData) && !regenerating) {
      console.log('[AutoResume] triggering handleRegenerate')
      handleRegenerate()
    }
  }, [loading, roadmap, regenerating, handleRegenerate])

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

  // ---- Loading / Generating State ----
  if (loading) {
    const progressPercent = enrichProgress?.total
      ? Math.round((enrichProgress.current / enrichProgress.total) * 100)
      : 0

    return (
      <PageContent className="flex items-center justify-center" role="status" aria-label="Generating your IELTS roadmap">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Generating Your Study Plan
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {enrichProgress?.phase
                ? `${enrichProgress.phase} (${enrichProgress.current} of ${enrichProgress.total})`
                : 'Building your personalized IELTS roadmap...'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--color-muted)' }}>Progress</span>
              <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), #4f46e5)',
                }}
              />
            </div>
          </div>

          {enrichProgress?.phase && (
            <div className="space-y-2">
              {['Analyzing your goals', 'Creating study phases', 'Building weekly schedules', 'Generating daily tasks', 'Finalizing your plan'].map((step, i) => {
                const totalSteps = 5
                const stepProgress = enrichProgress.total > 0 ? enrichProgress.current / enrichProgress.total : 0
                const completed = stepProgress >= (i + 1) / totalSteps
                return (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        completed ? 'text-white' : 'text-[var(--color-muted)]'
                      }`}
                      style={{
                        backgroundColor: completed ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                      }}
                    >
                      {completed ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span style={{ color: completed ? 'var(--color-text)' : 'var(--color-muted)' }}>{step}</span>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
            This may take a moment — we're creating your personalized study plan.
          </p>
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
            Set up your IELTS goals to build your study plan.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
            >
              Try Again
            </button>
            {error.includes('settings') && (
              <button
                onClick={() => navigate(ROUTES.settings)}
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                Configure Settings
              </button>
            )}
            <button
              onClick={() => navigate(ROUTES.dashboard)}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all hover:brightness-95"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Go to Dashboard
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
        <div className="w-full max-w-md space-y-6 text-center">
          <IconMap size={48} className="mx-auto" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              No Study Plan Yet
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Create a personalized IELTS study roadmap based on your target band score, exam date, and available study time.
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Generate My Study Plan
          </button>
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
      <a
        href="#today-section"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-xl focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
      >
        Skip to today's tasks
      </a>

      {(regenerating || persistedRegen) && enrichProgress && (() => {
        const isComplete = enrichProgress.current >= enrichProgress.total
        return (
        <div
          className="rounded-xl border p-4 transition-all duration-500"
          style={{
            borderColor: isComplete ? 'var(--color-success)' : 'var(--color-primary)',
            backgroundColor: isComplete ? 'var(--color-success-light)' : 'var(--color-primary-light)',
          }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            {isComplete ? (
              <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-success)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                </svg>
              </div>
            ) : (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: isComplete ? 'var(--color-success)' : 'var(--color-primary)' }}>
                {isComplete ? 'Plan generation complete' : 'Regenerating plan with AI...'}
              </p>
              {enrichProgress.phase && (
                <p className="text-xs mt-0.5" style={{ color: isComplete ? 'var(--color-success-dark)' : 'var(--color-text-secondary)' }}>
                  {enrichProgress.phase} ({enrichProgress.current}/{enrichProgress.total})
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: enrichProgress.total > 0 ? `${Math.round((enrichProgress.current / enrichProgress.total) * 100)}%` : '0%',
                backgroundColor: isComplete ? 'var(--color-success)' : 'var(--color-primary)',
              }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            {isComplete ? 'Plan ready — loading your roadmap...' : 'You can leave this page and come back — progress will be saved.'}
          </p>
        </div>
        )
      })()}

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
