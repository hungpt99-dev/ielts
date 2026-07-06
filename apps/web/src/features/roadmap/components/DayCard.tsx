import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RoadmapDay } from '../roadmapService'

interface DayCardProps {
  day: RoadmapDay
  isToday: boolean
  isPast: boolean
  onToggle: () => void
  onAskAI: (day: RoadmapDay) => void
}

const SKILL_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Vocabulary: { color: 'var(--color-info)', bg: 'var(--color-info-light)', label: 'Vocab' },
  Reading: { color: 'var(--color-skill-reading)', bg: 'var(--color-skill-reading-light)', label: 'Reading' },
  Writing: { color: 'var(--color-skill-writing)', bg: 'var(--color-skill-writing-light)', label: 'Writing' },
  Listening: { color: 'var(--color-skill-listening)', bg: 'var(--color-skill-listening-light)', label: 'Listen' },
  Speaking: { color: 'var(--color-skill-speaking)', bg: 'var(--color-skill-speaking-light)', label: 'Speak' },
  Grammar: { color: 'var(--color-success)', bg: 'var(--color-success-light)', label: 'Grammar' },
}

function getSkillConfig(skill: string) {
  return SKILL_CONFIG[skill] ?? { color: 'var(--color-muted)', bg: 'var(--color-surface-alt)', label: skill.slice(0, 4) }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function DayCard({ day, isToday, isPast, onToggle, onAskAI }: DayCardProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(isToday)
  const skillCfg = getSkillConfig(day.skillFocus)

  function getStatusIndicator() {
    if (day.isComplete) return { icon: '✓', color: 'var(--color-success)', bg: 'var(--color-success-light)' }
    if (isPast) return { icon: '○', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' }
    if (isToday) return { icon: '◉', color: 'var(--color-primary)', bg: 'var(--color-primary-light)' }
    return { icon: '○', color: 'var(--color-muted)', bg: 'transparent' }
  }

  const status = getStatusIndicator()
  const dayOfWeek = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })

  if (isPast && day.isComplete) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-70"
        style={{
          backgroundColor: 'transparent',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: status.bg, color: status.color }}>
          <span className="text-xs font-bold">{status.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
              {dayOfWeek} · Day {day.dayNumber}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: skillCfg.bg, color: skillCfg.color }}
            >
              {skillCfg.label}
            </span>
          </div>
          <p className="mt-0.5 text-sm line-through" style={{ color: 'var(--color-muted)' }}>
            {day.objective}
          </p>
        </div>
        <span className="shrink-0 text-[10px]" style={{ color: 'var(--color-muted)' }}>
          {formatDate(day.date)}
        </span>
      </div>
    )
  }

  const todayStyle = isToday ? {
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 2px var(--color-primary-light)',
    backgroundColor: 'var(--color-primary-light)',
  } : {
    borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  }

  return (
    <div
      className="rounded-xl border px-4 py-3 transition-all"
      style={{
        ...todayStyle,
        opacity: isPast && !day.isComplete ? 0.7 : 1,
        animation: isToday && !day.isComplete ? 'pulse 2s ease-in-out infinite' : 'none',
      }}
      aria-current={isToday ? 'date' : undefined}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={expanded}
        aria-label={`Day ${day.dayNumber}, ${dayOfWeek} ${formatDate(day.date)}, ${day.isComplete ? 'completed' : isToday ? 'today — not started' : 'pending'}`}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          <span className="text-xs font-bold">{status.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
              {dayOfWeek} · Day {day.dayNumber}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: skillCfg.bg, color: skillCfg.color }}
            >
              {skillCfg.label}
            </span>
            {isToday && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                Today
              </span>
            )}
          </div>
          <p
            className="mt-0.5 text-sm"
            style={{
              color: day.isComplete ? 'var(--color-muted)' : isToday ? 'var(--color-text)' : 'var(--color-text-secondary)',
              textDecoration: day.isComplete ? 'line-through' : 'none',
            }}
          >
            {day.objective}
          </p>
        </div>

        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          style={{ color: 'var(--color-muted)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95 active:scale-[0.98]"
              style={{
                backgroundColor: day.isComplete ? 'var(--color-warning-light)' : 'var(--color-success-light)',
                color: day.isComplete ? 'var(--color-warning)' : 'var(--color-success)',
              }}
            >
              {day.isComplete ? '↩ Undo' : '✓ Mark Complete'}
            </button>
            <button
              onClick={() => onAskAI(day)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-tutor-accent-light)',
                color: 'var(--color-tutor-accent)',
                border: '1px solid var(--color-tutor-border)',
              }}
            >
              🧠 Ask AI
            </button>
            {isToday && (
              <button
                onClick={() => navigate('/today-plan')}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:brightness-95 active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                }}
              >
                Go to Today's Plan →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
