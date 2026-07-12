import { useState, useEffect } from 'react'
import { IconCheck, IconLock, IconSearch, IconAITutor, IconFlame } from '@ielts/ui'
import type { RoadmapPhase, RoadmapDay } from '../roadmapService'
import type { RoadmapData } from '../roadmapService'
import WeekSection from './WeekSection'
import EditableText from './EditableText'
import {
  updatePhase, addWeek, removeWeek, moveWeek,
} from '../roadmapCommands'

interface PhaseSectionProps {
  phase: RoadmapPhase
  phaseIndex: number
  isCurrentPhase: boolean
  defaultExpanded: boolean
  currentWeekIndex: number
  onToggleTask: (phaseIndex: number, weekIndex: number, dayIndex: number) => void
  onAskAI: (day: RoadmapDay) => void
  onAskAIPhase: (phase: RoadmapPhase) => void
  isEditMode?: boolean
  applyCommand?: (command: (r: RoadmapData) => RoadmapData) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onRemovePhase?: () => void
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
  isEditMode = false, applyCommand,
  onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false,
  onRemovePhase,
}: PhaseSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || isEditMode)
  const phaseProgress = phase.totalTasks > 0 ? Math.round((phase.completedTasks / phase.totalTasks) * 100) : 0

  useEffect(() => {
    if (isEditMode) setExpanded(true)
  }, [isEditMode])

  const isComplete = phase.isComplete
  const isUpcoming = !isComplete && !isCurrentPhase

  function getStatusBadge() {
    if (isComplete) return { label: <><IconCheck size={12} /> Complete</>, color: 'var(--color-success)', bg: 'var(--color-success-light)' }
    if (isCurrentPhase) return { label: <><IconFlame size={14} /> In Progress</>, color: 'var(--color-primary)', bg: 'var(--color-primary-light)' }
    return { label: <><IconLock size={12} /> Upcoming</>, color: 'var(--color-muted)', bg: 'var(--color-surface-alt)' }
  }

  const status = getStatusBadge()

  const phaseEditControls = isEditMode && (
    <div className="flex items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}
        disabled={!canMoveUp}
        className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-30"
        title="Move phase up"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}
        disabled={!canMoveDown}
        className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-30"
        title="Move phase down"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm(`Delete "${phase.name}" and all its weeks?`)) onRemovePhase?.()
        }}
        className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-[var(--color-danger-light)]"
        title="Delete phase"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-danger)' }}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  )

  return (
    <section
      className={`rounded-2xl border transition-all ${isEditMode ? 'border-primary border-dashed' : ''}`}
      style={{
        borderColor: isEditMode ? 'var(--color-primary)' : isCurrentPhase ? 'var(--color-primary)' : isComplete ? 'var(--color-success)' : 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: isCurrentPhase ? 'var(--shadow-card)' : 'var(--shadow-sm)',
      }}
      aria-label={`Phase ${phaseIndex + 1}: ${phase.name}`}
    >
      <button
        onClick={() => !isEditMode && setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-4 sm:px-5 py-4 text-left transition-colors hover:brightness-95"
        aria-expanded={expanded}
        aria-controls={`phase-${phase.id}-content`}
      >
        {phaseEditControls || (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-all"
            style={{
              backgroundColor: isComplete ? 'var(--color-success)' : isCurrentPhase ? 'var(--color-primary)' : 'var(--color-surface-alt)',
              color: isComplete || isCurrentPhase ? 'var(--color-on-primary)' : 'var(--color-muted)',
            }}
          >
            {isComplete ? '✓' : phase.order + 1}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isEditMode && applyCommand ? (
              <EditableText
                value={phase.name}
                onSave={val => applyCommand(r => updatePhase(r, phaseIndex, { name: val }))}
                isEditing={true}
                className="text-base font-bold"
              />
            ) : (
              <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                {phase.name}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          </div>
          <div className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {isEditMode && applyCommand ? (
              <EditableText
                value={phase.description}
                onSave={val => applyCommand(r => updatePhase(r, phaseIndex, { description: val }))}
                isEditing={true}
                multiline
                className="text-sm"
              />
            ) : phase.description}
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            {isEditMode && applyCommand ? (
              <>
                <EditableText
                  value={phase.targetRange}
                  onSave={val => applyCommand(r => updatePhase(r, phaseIndex, { targetRange: val }))}
                  isEditing={true}
                  className="text-xs"
                />
                {' · '}
              </>
            ) : (
              <>{phase.completedTasks}/{phase.totalTasks} tasks · {phase.targetRange} · </>
            )}
            {getPhaseDateRange(phase)}
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
          {!isEditMode && (
            <svg
              className={`h-5 w-5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: 'var(--color-muted)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {!expanded && !isUpcoming && !isEditMode && (
        <div className="border-t px-4 sm:px-5 py-3" style={{ borderColor: 'var(--color-border)' }}>
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
          {phase.weeks.map((week, wIdx) => (
            <WeekSection
              key={week.id}
              week={week}
              weekIndex={wIdx}
              phaseIndex={phaseIndex}
              isCurrentWeek={isCurrentPhase && wIdx === currentWeekIndex}
              onToggleTask={onToggleTask}
              onAskAI={onAskAI}
              isEditMode={isEditMode}
              applyCommand={applyCommand}
              onMoveUp={isEditMode && applyCommand && wIdx > 0
                ? () => applyCommand(r => moveWeek(r, phaseIndex, wIdx, wIdx - 1))
                : undefined}
              onMoveDown={isEditMode && applyCommand && wIdx < phase.weeks.length - 1
                ? () => applyCommand(r => moveWeek(r, phaseIndex, wIdx, wIdx + 1))
                : undefined}
              canMoveUp={wIdx > 0}
              canMoveDown={wIdx < phase.weeks.length - 1}
              onRemoveWeek={isEditMode && applyCommand
                ? () => applyCommand(r => removeWeek(r, phaseIndex, wIdx))
                : undefined}
            />
          ))}

          {isEditMode && applyCommand && (
            <button
              onClick={() => applyCommand(r => addWeek(r, phaseIndex))}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-medium transition-colors hover:brightness-95"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-primary)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Week
            </button>
          )}

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
            {!isUpcoming && !isEditMode && (
              <button
                onClick={() => setExpanded(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ↑ Collapse Phase
              </button>
            )}
            {isUpcoming && !isEditMode && (
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
