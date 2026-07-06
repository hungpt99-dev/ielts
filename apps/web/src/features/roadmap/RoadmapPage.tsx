import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  ensureRoadmap,
  toggleTask,
  getRecommendations,
  getTodayDay,
  getNextIncompleteTask,
  getRoadmapUserProfile,
  getExamCountdown,
  saveRoadmap,
} from './roadmapService'
import type { RoadmapData, RoadmapPhase, RoadmapWeek, RoadmapDay, RoadmapRecommendation, RoadmapUserProfile } from './roadmapService'
import PageHeader from '../../components/layout/PageHeader'
import { IconStudyPlan } from '@ielts/ui'

const SKILL_COLORS: Record<string, string> = {
  Vocabulary: 'var(--color-info)',
  Reading: 'var(--color-skill-reading)',
  Writing: 'var(--color-skill-writing)',
  Listening: 'var(--color-skill-listening)',
  Speaking: 'var(--color-skill-speaking)',
  Grammar: 'var(--color-success)',
}

function getSkillColor(skill: string): string {
  return SKILL_COLORS[skill] ?? 'var(--color-muted)'
}

function getSkillBg(skill: string): string {
  const colors: Record<string, string> = {
    Vocabulary: 'bg-[var(--color-info-light)] text-[var(--color-info-dark)]',
    Reading: 'bg-[var(--color-skill-reading-light)] text-[var(--color-skill-reading-dark)]',
    Writing: 'bg-[var(--color-skill-writing-light)] text-[var(--color-skill-writing-dark)]',
    Listening: 'bg-[var(--color-skill-listening-light)] text-[var(--color-skill-listening-dark)]',
    Speaking: 'bg-[var(--color-skill-speaking-light)] text-[var(--color-skill-speaking-dark)]',
    Grammar: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)]',
  }
  return colors[skill] ?? 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0]
}

function isPast(dateStr: string): boolean {
  return dateStr < new Date().toISOString().split('T')[0]
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

interface PhaseSectionProps {
  phase: RoadmapPhase
  phaseIndex: number
  isCurrentPhase: boolean
  defaultExpanded: boolean
  currentWeekIndex: number
  onToggleTask: (phaseIndex: number, weekIndex: number, dayIndex: number) => void
}

function PhaseSection({ phase, phaseIndex, isCurrentPhase, defaultExpanded, currentWeekIndex, onToggleTask }: PhaseSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const phaseProgress = phase.totalTasks > 0 ? Math.round((phase.completedTasks / phase.totalTasks) * 100) : 0

  return (
    <div
      className={`rounded-xl border transition-all ${
        isCurrentPhase
          ? 'border-blue-300 dark:border-blue-700 shadow-sm'
          : phase.isComplete
            ? 'border-green-200 dark:border-green-800'
            : 'border-[var(--color-border)]'
      }`}
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-95"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: phase.isComplete ? 'var(--color-success)' : isCurrentPhase ? 'var(--color-primary)' : 'var(--color-muted)' }}
        >
          {phase.order + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {phase.name}
            </span>
            {phase.isComplete && (
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Complete
              </span>
            )}
            {isCurrentPhase && !phase.isComplete && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Current
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            {phase.description} &middot; {phase.targetRange}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {phase.completedTasks}/{phase.totalTasks}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>tasks</p>
          </div>
          <div className="h-2 w-16 overflow-hidden rounded-full sm:w-20" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${phaseProgress}%`,
                backgroundColor: phase.isComplete ? 'var(--color-success)' : 'var(--color-primary)',
              }}
            />
          </div>
          <svg
            className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ color: 'var(--color-muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
          {phase.weeks.map((week, wIdx) => (
            <WeekSection
              key={week.id}
              week={week}
              weekIndex={wIdx}
              phaseIndex={phaseIndex}
              isCurrentWeek={isCurrentPhase && wIdx === currentWeekIndex}
              onToggleTask={onToggleTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface WeekSectionProps {
  week: RoadmapWeek
  weekIndex: number
  phaseIndex: number
  isCurrentWeek: boolean
  onToggleTask: (phaseIndex: number, weekIndex: number, dayIndex: number) => void
}

function WeekSection({ week, weekIndex, phaseIndex, isCurrentWeek, onToggleTask }: WeekSectionProps) {
  const [expanded, setExpanded] = useState(isCurrentWeek)
  const weekProgress = week.totalTasks > 0 ? Math.round((week.completedTasks / week.totalTasks) * 100) : 0

  return (
    <div
      className={`rounded-lg border ${
        isCurrentWeek
          ? 'border-blue-200 dark:border-blue-800'
          : week.isComplete
            ? 'border-green-200 dark:border-green-800'
            : 'border-[var(--color-border)]'
      }`}
      style={{ backgroundColor: isCurrentWeek ? 'var(--color-primary-light)' : 'var(--color-surface)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:brightness-95"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {week.label}: {week.focus}
            </span>
            {week.isComplete && (
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Done
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            {week.goal}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {week.completedTasks}/{week.totalTasks}
          </span>
          <div className="h-1.5 w-12 overflow-hidden rounded-full sm:w-16" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${weekProgress}%`,
                backgroundColor: week.isComplete ? 'var(--color-success)' : 'var(--color-primary)',
              }}
            />
          </div>
          <svg
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ color: 'var(--color-muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3 py-2 space-y-1.5" style={{ borderColor: 'var(--color-border)' }}>
          {week.days.map((day, dIdx) => (
            <DayRow
              key={day.id}
              day={day}
              onToggle={() => onToggleTask(phaseIndex, weekIndex, dIdx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface DayRowProps {
  day: RoadmapDay
  onToggle: () => void
}

function DayRow({ day, onToggle }: DayRowProps) {
  const today = isToday(day.date)
  const past = isPast(day.date)
  const dayOfWeek = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        today ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''
      } ${day.isComplete ? 'opacity-70' : ''}`}
      style={{
        backgroundColor: today ? 'var(--color-surface)' : 'transparent',
      }}
    >
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          day.isComplete
            ? 'border-green-500 bg-green-500 text-white'
            : past
              ? 'border-slate-300 text-slate-300 dark:border-slate-600'
              : 'border-[var(--color-border)] hover:border-blue-400'
        }`}
        aria-label={day.isComplete ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {day.isComplete && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span className="w-8 shrink-0 text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>
        {dayOfWeek}
      </span>

      <span
        className={`min-w-[3rem] rounded px-1.5 py-0.5 text-[10px] font-medium ${getSkillBg(day.skillFocus)}`}
      >
        {day.skillFocus.slice(0, 4)}
      </span>

      <span
        className="flex-1 truncate text-sm"
        style={{
          color: day.isComplete ? 'var(--color-muted)' : 'var(--color-text-secondary)',
          textDecoration: day.isComplete ? 'line-through' : 'none',
        }}
      >
        {day.objective}
      </span>

      <span className="shrink-0 text-[10px]" style={{ color: 'var(--color-muted)' }}>
        {formatDate(day.date)}
      </span>
    </div>
  )
}

interface RecommendationCardProps {
  rec: RoadmapRecommendation
}

function RecommendationCard({ rec }: RecommendationCardProps) {
  const navigate = useNavigate()
  const borderColor =
    rec.type === 'next_task' ? 'var(--color-primary)' :
    rec.type === 'weak_skill' ? 'var(--color-danger)' :
    rec.type === 'milestone' ? 'var(--color-success)' :
    'var(--color-warning)'

  const icon =
    rec.type === 'next_task' ? '→' :
    rec.type === 'weak_skill' ? '!' :
    rec.type === 'milestone' ? '★' :
    '●'

  return (
    <div
      className="rounded-lg border-l-4 p-3 text-sm"
      style={{
        borderLeftColor: borderColor,
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-base shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p style={{ color: 'var(--color-text-secondary)' }}>{rec.message}</p>
          <button
            onClick={() => {
              if (rec.route) navigate(rec.route)
            }}
            className="mt-1.5 text-xs font-medium transition-colors"
            style={{ color: 'var(--color-primary)' }}
          >
            {rec.action} →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [profile, setProfile] = useState<RoadmapUserProfile | null>(null)
  const [recommendations, setRecommendations] = useState<RoadmapRecommendation[]>([])
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ensureRoadmap()
      setRoadmap(data)
      setProfile(getRoadmapUserProfile())

      const todayDay = getTodayDay(data)
      const initialExpand = new Set<number>()
      if (data.currentPhaseIndex !== undefined) {
        initialExpand.add(data.currentPhaseIndex)
      } else if (todayDay) {
        for (let p = 0; p < data.phases.length; p++) {
          for (const w of data.phases[p].weeks) {
            if (w.days.some(d => d.id === todayDay.day.id)) {
              initialExpand.add(p)
              break
            }
          }
        }
      }
      if (initialExpand.size === 0) initialExpand.add(0)
      setExpandedPhases(initialExpand)

      const recs = getRecommendations(data)
      setRecommendations(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleToggleTask = useCallback(async (phaseIndex: number, weekIndex: number, dayIndex: number) => {
    if (!roadmap) return
    try {
      const updated = await toggleTask(roadmap, phaseIndex, weekIndex, dayIndex)
      setRoadmap(updated)
      setRecommendations(getRecommendations(updated))
    } catch {
      // Revert handled by toggleTask
    }
  }, [roadmap])

  const handleRegenerate = useCallback(async () => {
    if (!roadmap) return
    localStorage.removeItem('ielts-roadmap')
    await loadData()
  }, [roadmap, loadData])

  if (loading) {
    return <LoadingSpinner size="lg" fullPage message="Building your personalized IELTS roadmap..." />
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="space-y-4">
            <p style={{ color: 'var(--color-danger)' }}>{error}</p>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Please complete the onboarding first to set up your IELTS goals.
            </p>
            <button
              onClick={() => navigate('/onboarding')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Go to Onboarding
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!roadmap) return null

  const todayStr = new Date().toISOString().split('T')[0]
  const examCountdown = profile?.examDate ? getExamCountdown(profile.examDate) : 0
  const nextTask = getNextIncompleteTask(roadmap)
  const todayDay = roadmap.phases.flatMap(p => p.weeks).flatMap(w => w.days).find(d => d.date === todayStr)
  const bandGap = profile ? profile.targetBand - profile.currentBand : 0

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        icon={<IconStudyPlan size={22} />}
        title={`${getGreeting()}, IELTS Learner`}
        description="Your personalized IELTS learning roadmap"
        actions={
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: 'var(--color-border)' }}>
                <span style={{ color: 'var(--color-muted)' }}>Goal:</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {profile.studyGoal === 'academic' ? 'IELTS Academic' : 'IELTS General'}
                </span>
              </div>
          )}
          <button
            onClick={handleRegenerate}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            Regenerate
          </button>
          </div>
        }
      />

        {/* Overall Progress */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Overall Progress
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              {roadmap.overallProgress}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${roadmap.overallProgress}%`,
                background: roadmap.overallProgress === 100
                  ? 'var(--color-success)'
                  : `linear-gradient(90deg, var(--color-primary), var(--color-primary-light))`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
            <span>{roadmap.completedTasks} of {roadmap.totalTasks} tasks completed</span>
            {bandGap > 0 && (
              <span>{profile?.currentBand} → {profile?.targetBand} target</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Current Phase
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {roadmap.phases[roadmap.currentPhaseIndex]?.name ?? 'N/A'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Phase {roadmap.currentPhaseIndex + 1} of {roadmap.phases.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Weekly Progress
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Week {roadmap.currentWeekIndex + 1}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {roadmap.phases[roadmap.currentPhaseIndex]?.weeks[roadmap.currentWeekIndex]?.completedTasks ?? 0}/
              {roadmap.phases[roadmap.currentPhaseIndex]?.weeks[roadmap.currentWeekIndex]?.totalTasks ?? 0} done
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Your Level
            </p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              Band {profile?.currentBand ?? '?'}
              {bandGap > 0 && <span className="ml-1 font-normal" style={{ color: 'var(--color-muted)' }}>→ {profile?.targetBand}</span>}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {bandGap > 0 ? `${bandGap.toFixed(1)} bands to go` : 'Target reached!'}
            </p>
          </CardContent>
        </Card>
        {examCountdown > 0 && (
          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Exam Countdown
              </p>
              <p className={`mt-1 text-sm font-semibold ${examCountdown <= 30 ? 'text-red-500' : ''}`}>
                {examCountdown} days
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {examCountdown <= 30 ? 'Getting close!' : 'On track'}
              </p>
            </CardContent>
          </Card>
        )}
        {!examCountdown && (
          <Card>
            <CardContent>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Weak Skills
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {profile?.weakSkills && profile.weakSkills.length > 0 ? (
                  profile.weakSkills.slice(0, 3).map(s => (
                    <span key={s} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>None set</span>
                )}
                {(profile?.weakSkills.length ?? 0) > 3 && (
                  <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>+{profile!.weakSkills.length - 3}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Phase List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
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
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              {expandedPhases.size === roadmap.phases.length ? 'Collapse all' : 'Expand all'}
            </button>
          </div>

          {roadmap.phases.map((phase, pIdx) => (
            <PhaseSection
              key={phase.id}
              phase={phase}
              phaseIndex={pIdx}
              isCurrentPhase={pIdx === roadmap.currentPhaseIndex}
              defaultExpanded={expandedPhases.has(pIdx)}
              currentWeekIndex={roadmap.currentWeekIndex}
              onToggleTask={handleToggleTask}
            />
          ))}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Today's Task */}
          <Card>
            <CardHeader>
              <CardTitle>
                {todayDay ? 'Today\'s Task' : 'Next Task'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextTask ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${getSkillBg(nextTask.skillFocus)}`}>
                      {nextTask.skillFocus}
                    </span>
                    {isToday(nextTask.date) && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {nextTask.objective}
                  </p>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                    <span>{formatDate(nextTask.date)}</span>
                    <span>&middot;</span>
                    <span>Day {nextTask.dayNumber}</span>
                  </div>
                  <button
                    onClick={() => {
                      const skillPath = nextTask.skillFocus.toLowerCase()
                      if (skillPath === 'vocabulary') navigate('/vocabulary')
                      else if (skillPath === 'grammar') navigate('/grammar')
                      else if (skillPath === 'reading') navigate('/reading')
                      else if (skillPath === 'listening') navigate('/listening')
                      else if (skillPath === 'writing') navigate('/writing')
                      else if (skillPath === 'speaking') navigate('/speaking')
                      else navigate('/plan')
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Go to {nextTask.skillFocus} practice →
                  </button>
                </div>
              ) : (
                <p className="py-4 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                  {roadmap.totalTasks > 0 && roadmap.completedTasks === roadmap.totalTasks
                    ? 'All tasks completed! Great job!'
                    : 'No pending tasks found.'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Profile Summary */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Target Band</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{profile.targetBand}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Current Level</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{profile.currentBand}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-muted)' }}>Study Time</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{profile.dailyStudyMinutes} min/day</span>
                </div>
                {profile.examDate && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-muted)' }}>Exam Date</span>
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                      {new Date(profile.examDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {profile.weakSkills.length > 0 && (
                  <div>
                    <p className="mb-1" style={{ color: 'var(--color-muted)' }}>Weak Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.weakSkills.map(s => (
                        <span key={s} className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(SKILL_COLORS).map(([skill, color]) => (
                  <div key={skill} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {skill}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
