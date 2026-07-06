import { useState } from 'react'
import type { RoadmapWeek, RoadmapDay } from '../roadmapService'
import DayCard from './DayCard'

interface WeekSectionProps {
  week: RoadmapWeek
  weekIndex: number
  isCurrentWeek: boolean
  phaseIndex: number
  onToggleTask: (phaseIndex: number, weekIndex: number, dayIndex: number) => void
  onAskAI: (day: RoadmapDay) => void
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0]
}

function isPast(dateStr: string): boolean {
  return dateStr < new Date().toISOString().split('T')[0]
}

export default function WeekSection({ week, weekIndex, isCurrentWeek, phaseIndex, onToggleTask, onAskAI }: WeekSectionProps) {
  const [expanded, setExpanded] = useState(isCurrentWeek)
  const weekProgress = week.totalTasks > 0 ? Math.round((week.completedTasks / week.totalTasks) * 100) : 0

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: isCurrentWeek
          ? 'var(--color-primary)'
          : week.isComplete
            ? 'var(--color-success)'
            : 'var(--color-border)',
        backgroundColor: isCurrentWeek
          ? 'var(--color-primary-light)'
          : 'var(--color-surface)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-95"
        aria-expanded={expanded}
        aria-controls={`week-${week.id}-content`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
          style={{
            backgroundColor: week.isComplete ? 'var(--color-success)' : isCurrentWeek ? 'var(--color-primary)' : 'var(--color-surface-alt)',
            color: week.isComplete || isCurrentWeek ? 'var(--color-on-primary)' : 'var(--color-text-secondary)',
          }}
        >
          {week.weekNumber}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              {week.label}: {week.focus}
            </span>
            {week.isComplete ? (
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                ✅ Done
              </span>
            ) : isCurrentWeek ? (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                🔥 In Progress
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            {week.goal}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {week.completedTasks}/{week.totalTasks}
          </span>
          <div
            className="h-2 w-16 overflow-hidden rounded-full sm:w-20"
            style={{ backgroundColor: 'var(--color-surface-alt)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${weekProgress}%`,
                backgroundColor: week.isComplete ? 'var(--color-success)' : 'var(--color-primary)',
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
        <div
          id={`week-${week.id}-content`}
          className="border-t px-4 py-3 space-y-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {week.days.map((day, dIdx) => (
            <DayCard
              key={day.id}
              day={day}
              isToday={isToday(day.date)}
              isPast={isPast(day.date)}
              onToggle={() => onToggleTask(phaseIndex, weekIndex, dIdx)}
              onAskAI={onAskAI}
            />
          ))}
        </div>
      )}
    </div>
  )
}
