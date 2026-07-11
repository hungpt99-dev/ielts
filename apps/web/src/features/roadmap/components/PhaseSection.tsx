import { useState } from 'react'
import { IconCheck, IconLock, IconSearch, IconAITutor, IconFlame } from '@ielts/ui'
import type { RoadmapPhase, RoadmapWeek, RoadmapDay } from '../roadmapService'
import WeekSection from './WeekSection'

interface PhaseSectionProps {
  phase: RoadmapPhase
  phaseIndex: number
  isCurrentPhase: boolean
  defaultExpanded: boolean
  currentWeekIndex: number
  onToggleTask: (phaseIndex: number, weekIndex: number, dayIndex: number) => void
  onAskAI: (day: RoadmapDay) => void
  onAskAIPhase: (phase: RoadmapPhase) => void
}

function getPhaseDateRange(phase: RoadmapPhase): string {
  if (phase.weeks.length === 0) return ''
  const firstDate = phase.weeks[0].days[0]?.date
  const lastWeek = phase.weeks[phase.weeks.length - 1]
  const lastDate = lastWeek.days[lastWeek.days.length - 1]?.date
  if (!firstDate || !lastDate) return ''
  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return `${fmt(firstDate)} – ${fmt(lastDate)}`
}

export default function PhaseSection({
  phase, phaseIndex, isCurrentPhase, defaultExpanded,
  currentWeekIndex, onToggleTask, onAskAI, onAskAIPhase,
}: PhaseSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const phaseProgress = phase.totalTasks > 0 ? Math.round((phase.completedTasks / phase.totalTasks) * 100) : 0

  const isComplete = phase.isComplete
  const isUpcoming = !isComplete && !isCurrentPhase

  function getStatusBadge() {
    if (isComplete) return { label: <><IconCheck size={12} /> Complete</>, color: 'var(--color-success)', bg: 'var(--color-success-light)' }
    if (isCurrentPhase) return { label: <><IconFlame size={14} /> In Progress</>, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' }
    return { label: <><IconLock size={12} /> Upcoming</>, color: 'var(--color-muted)', bg: 'var(--color-surface-alt)' }
  }

  const status = getStatusBadge()

  return (
    <section
      className="rounded-2xl border transition-all"
      style={{
        borderColor: isCurrentPhase
          ? 'var(--color-primary)'
          : isComplete
            ? 'var(--color-success)'
            : 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: isCurrentPhase ? 'var(--shadow-card)' : 'var(--shadow-sm)',
      }}
      aria-label={`Phase ${phaseIndex + 1}: ${phase.name}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-4 sm:px-5 py-4 text-left transition-colors hover:brightness-95"
        aria-expanded={expanded}
        aria-controls={`phase-${phase.id}-content`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-all"
          style={{
            backgroundColor: isComplete ? 'var(--color-success)' : isCurrentPhase ? 'var(--color-primary)' : 'var(--color-surface-alt)',
            color: isComplete || isCurrentPhase ? 'var(--color-on-primary)' : 'var(--color-muted)',
          }}
        >
          {isComplete ? '✓' : phase.order + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              {phase.name}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {phase.description}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            {phase.completedTasks}/{phase.totalTasks} tasks · {phase.targetRange} · {getPhaseDateRange(phase)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <div
              className="h-2 w-20 overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--color-surface-alt)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${phaseProgress}%`,
                  backgroundColor: isComplete ? 'var(--color-success)' : 'var(--color-primary)',
                }}
              />
            </div>
            <span className="mt-0.5 text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>
              {phaseProgress}%
            </span>
          </div>
          <svg
            className={`h-5 w-5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ color: 'var(--color-muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!expanded && !isUpcoming && (
        <div           className="border-t px-4 sm:px-5 py-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-wrap gap-2">
            {phase.weeks.map((week) => {
              const wp = week.totalTasks > 0 ? Math.round((week.completedTasks / week.totalTasks) * 100) : 0
              return (
                <div
                  key={week.id}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
                  style={{
                    backgroundColor: 'var(--color-surface-alt)',
                    color: 'var(--color-text-secondary)',
                  }}
                  title={`${week.label}: ${wp}% complete`}
                >
                  <span className="font-medium">{week.label}</span>
                  <div className="h-1.5 w-10 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${wp}%`,
                        backgroundColor: week.isComplete ? 'var(--color-success)' : 'var(--color-primary)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {expanded && (
        <div
          id={`phase-${phase.id}-content`}
          className="border-t px-4 sm:px-5 py-4 space-y-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {phase.description && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {phase.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <span
              className="rounded-lg px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
              }}
            >
              {phase.targetRange}
            </span>
          </div>

          {phase.weeks.map((week, wIdx) => (
            <WeekSection
              key={week.id}
              week={week}
              weekIndex={wIdx}
              phaseIndex={phaseIndex}
              isCurrentWeek={isCurrentPhase && wIdx === currentWeekIndex}
              onToggleTask={onToggleTask}
              onAskAI={onAskAI}
            />
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => onAskAIPhase(phase)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-tutor-accent-light)',
                color: 'var(--color-tutor-accent)',
                border: '1px solid var(--color-tutor-border)',
              }}
            >
<IconAITutor size={12} /> AI Summary of {phase.name}
            </button>
            {!isUpcoming && (
              <button
                onClick={() => setExpanded(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ↑ Collapse Phase
              </button>
            )}
            {isUpcoming && (
              <button
                onClick={() => onAskAIPhase(phase)}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95 active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
<IconSearch size={12} /> Preview Phase
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
