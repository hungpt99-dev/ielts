import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import type { RoadmapData } from '../roadmapService'

interface RoadmapSummaryProps {
  roadmap: RoadmapData
  profile: {
    targetBand: number
    currentBand: number
    examDate: string
    dailyStudyMinutes: number
    weakSkills: string[]
    studyGoal: string
  } | null
  onRegenerate: () => void
  onAskAIReview: () => void
  regenerating?: boolean
}

function getTotalDays(roadmap: RoadmapData): number {
  return roadmap.phases.reduce((sum, p) => sum + p.weeks.reduce((s, w) => s + w.days.length, 0), 0)
}

function getTotalWeeks(roadmap: RoadmapData): number {
  return roadmap.phases.reduce((sum, p) => sum + p.weeks.length, 0)
}

function getTotalStudyHours(roadmap: RoadmapData, avgMinutesPerTask: number = 25): number {
  return Math.round((roadmap.totalTasks * avgMinutesPerTask) / 60)
}

function getSkillDistribution(roadmap: RoadmapData): Record<string, number> {
  const counts: Record<string, number> = {}
  let total = 0
  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        const skill = day.skillFocus
        counts[skill] = (counts[skill] || 0) + 1
        total++
      }
    }
  }
  if (total === 0) return {}
  const result: Record<string, number> = {}
  for (const [skill, count] of Object.entries(counts)) {
    result[skill] = Math.round((count / total) * 100)
  }
  return result
}

const SKILL_COLORS: Record<string, string> = {
  Vocabulary: 'var(--color-info)',
  Reading: 'var(--color-skill-reading)',
  Writing: 'var(--color-skill-writing)',
  Listening: 'var(--color-skill-listening)',
  Speaking: 'var(--color-skill-speaking)',
  Grammar: 'var(--color-success)',
}

export default function RoadmapSummary({ roadmap, profile, onRegenerate, onAskAIReview, regenerating }: RoadmapSummaryProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const totalDays = getTotalDays(roadmap)
  const totalWeeks = getTotalWeeks(roadmap)
  const totalHours = getTotalStudyHours(roadmap)
  const distribution = getSkillDistribution(roadmap)
  const restDays = totalDays > 0 ? Math.round(totalDays * 0.2) : 0
  const studyDays = totalDays - restDays
  const isComplete = roadmap.overallProgress >= 100
  const currentPhase = roadmap.phases[roadmap.currentPhaseIndex]

  const bandProgression = roadmap.phases
    .filter(p => p.targetRange)
    .map((p, i) => ({
      label: `Phase ${i + 1}`,
      range: p.targetRange,
      isCurrent: i === roadmap.currentPhaseIndex,
      isComplete: p.isComplete,
    }))

  useEffect(() => {
    if (!regenerating) setShowConfirm(false)
  }, [regenerating])

  return (
    <section className="space-y-4" aria-label="Plan overview">
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            📊 Plan Overview
          </h2>
          {isComplete && (
            <span
              className="rounded-xl px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
            >
              ✅ All Phases Complete
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Duration
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {totalDays}d
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {totalWeeks} weeks
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Study Days
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {studyDays}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {restDays} rest days
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Study Hours
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              ~{totalHours}h
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {roadmap.totalTasks} tasks total
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Completed
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-success)' }}>
              {roadmap.completedTasks}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {roadmap.overallProgress}% done
            </p>
          </div>
        </div>

        {Object.keys(distribution).length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Skill Focus Distribution
            </p>
            <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
              {Object.entries(distribution).map(([skill, pct]) => (
                <div
                  key={skill}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: SKILL_COLORS[skill] || 'var(--color-muted)',
                    minWidth: pct > 0 ? '4px' : '0',
                  }}
                  title={`${skill}: ${pct}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {Object.entries(distribution).map(([skill, pct]) => (
                <span key={skill} className="inline-flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SKILL_COLORS[skill] || 'var(--color-muted)' }}
                  />
                  {skill} {pct}%
                </span>
              ))}
            </div>
          </div>
        )}

        {bandProgression.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Predicted Band Progression
            </p>
            <div className="space-y-1">
              {bandProgression.map((bp, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: bp.isComplete ? 'var(--color-success-light)' : bp.isCurrent ? 'var(--color-primary-light)' : 'var(--color-surface-alt)',
                      color: bp.isComplete ? 'var(--color-success)' : bp.isCurrent ? 'var(--color-primary)' : 'var(--color-muted)',
                    }}
                  >
                    {bp.label}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: bp.isCurrent ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                    {bp.range}
                  </span>
                  {bp.isCurrent && <span className="text-xs" style={{ color: 'var(--color-primary)' }}>← You are here</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:brightness-95 active:scale-[0.98]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-surface)',
              cursor: regenerating ? 'not-allowed' : 'pointer',
              opacity: regenerating ? 0.6 : 1,
            }}
          >
            🔄 Regenerate Plan
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:brightness-95 active:scale-[0.98]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            📥 Export Plan
          </button>
          <button
            onClick={onAskAIReview}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:brightness-95 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--color-tutor-accent-light)',
              color: 'var(--color-tutor-accent)',
              border: '1px solid var(--color-tutor-border)',
            }}
          >
            🤖 Ask AI to Review Plan
          </button>
        </div>
      </div>

      <Modal open={showConfirm || regenerating} onClose={() => regenerating ? null : setShowConfirm(false)} title="Regenerate Study Plan" size="sm">
        {regenerating ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              <svg className="h-5 w-5 animate-spin" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Generating your new study plan...
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              This may take a moment depending on your plan duration.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl p-3 sm:p-4" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              <svg className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                AI will generate a new structured study plan tailored to your level, weak areas, and available study time.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning-dark)' }}>
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Your current progress and completed tasks will be reset.</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={onRegenerate} icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }>
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
