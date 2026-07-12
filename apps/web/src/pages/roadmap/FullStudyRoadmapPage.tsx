import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { openAITutorChat } from '../../features/ai-tutor/utils/openChat'
import { emitStudyRoadmapViewed } from '../../features/websiteActions/eventEmitters'
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
import { useRoadmapEditor } from '../../features/roadmap/hooks/useRoadmapEditor'
import { addPhase, movePhase, removePhase } from '../../features/roadmap/roadmapCommands'
import RoadmapHeader from '../../features/roadmap/components/RoadmapHeader'
import PhaseMilestoneTimeline from '../../features/roadmap/components/PhaseMilestoneTimeline'
import PhaseSection from '../../features/roadmap/components/PhaseSection'
import RoadmapSummary from '../../features/roadmap/components/RoadmapSummary'
import AITutorRoadmapInsight from '../../features/roadmap/components/AITutorRoadmapInsight'
import { IconAward, IconEdit, IconMap, IconProgress, IconRefresh, IconUndo, IconRedo } from '@ielts/ui'
import PageContent from '../../components/layout/PageContent'

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
  const editor = useRoadmapEditor()
  const [profile, setProfile] = useState<RoadmapUserProfile | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const roadmap = editor.roadmap

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      const data = await ensureRoadmap()
      editor.loadRoadmap(data)
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
  }, [editor])

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

  const handleToggleTask = useCallback(async (phaseIndex: number, weekIndex: number, dayIndex: number) => {
    const current = editor.roadmap
    if (!current) return
    try {
      const updated = await toggleTask(current, phaseIndex, weekIndex, dayIndex)
      editor.loadRoadmap(updated)
    } catch {
      // Revert handled by toggleTask
    }
  }, [editor])

  const handleRegenerate = useCallback(async () => {
    if (!editor.roadmap || regenerating) return
    setRegenerating(true)
    try {
      localStorage.removeItem('ielts-roadmap')
      await loadData(false)
    } finally {
      setRegenerating(false)
    }
  }, [editor, loadData, regenerating])

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
    openAITutorChat(`Help me with my study day: ${day.objective || `Day ${day.id}`}. What should I prioritize?`)
  }, [])

  const handleAskFollowUp = useCallback(() => {
    openAITutorChat('I have a follow-up question about my study roadmap.')
  }, [])

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
              onClick={() => navigate('/plan')}
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
  const todayStr = new Date().toISOString().split('T')[0]
  const bandGap = profile ? profile.targetBand - profile.currentBand : 0

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
              onClick={() => navigate('/mock-tests')}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all hover:brightness-95"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
<IconEdit size={16} /> Take a Mock Test
            </button>
            <button
              onClick={() => navigate('/progress')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all hover:brightness-95"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
<IconProgress size={16} /> View Full Progress
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
        />
      </PageContent>
    )
  }

  // ---- Normal Roadmap View ----
  const { isEditMode, toggleEditMode, applyCommand, undo, redo, canUndo, canRedo } = editor

  return (
    <PageContent className={`space-y-6 ${isEditMode ? 'pb-24' : ''}`}>
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
            />
          </aside>
        )}
      </div>

      {/* Floating edit toolbar */}
      {isEditMode && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={!canUndo}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:brightness-95 disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: canUndo ? 'var(--color-text)' : 'var(--color-muted)',
                }}
              >
                <IconUndo size={14} /> Undo
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:brightness-95 disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--color-surface-alt)',
                  color: canRedo ? 'var(--color-text)' : 'var(--color-muted)',
                }}
              >
                <IconRedo size={14} /> Redo
              </button>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Changes save automatically
            </span>
            <button
              onClick={toggleEditMode}
              className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold transition-all hover:brightness-95 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Done Editing
            </button>
          </div>
        </div>
      )}
    </PageContent>
  )
}
