import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RoadmapDay } from '../roadmapService'
import type { TaskEntry } from '../../../models'
import EditableText from './EditableText'

interface DayCardProps {
  day: RoadmapDay
  tasks: TaskEntry[]
  isToday: boolean
  isPast: boolean
  onToggleTask: (taskId: string) => void
  onAskAI: (day: RoadmapDay) => void
  isEditMode?: boolean
  onUpdateTask?: (taskIndex: number, fields: { title?: string; category?: string }) => void
  onAddTask?: () => void
  onRemoveTask?: (taskIndex: number) => void
  onMoveTask?: (fromIndex: number, toIndex: number) => void
  onRemoveDay?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  Vocabulary: { color: 'var(--color-info)', bg: 'var(--color-info-light)', label: 'Vocab' },
  Reading: { color: 'var(--color-skill-reading)', bg: 'var(--color-skill-reading-light)', label: 'Reading' },
  'Writing Task 1': { color: 'var(--color-skill-writing)', bg: 'var(--color-skill-writing-light)', label: 'Writing' },
  'Writing Task 2': { color: 'var(--color-skill-writing)', bg: 'var(--color-skill-writing-light)', label: 'Writing' },
  Listening: { color: 'var(--color-skill-listening)', bg: 'var(--color-skill-listening-light)', label: 'Listen' },
  'Speaking Part 1': { color: 'var(--color-skill-speaking)', bg: 'var(--color-skill-speaking-light)', label: 'Speak' },
  'Speaking Part 2': { color: 'var(--color-skill-speaking)', bg: 'var(--color-skill-speaking-light)', label: 'Speak' },
  'Speaking Part 3': { color: 'var(--color-skill-speaking)', bg: 'var(--color-skill-speaking-light)', label: 'Speak' },
  Grammar: { color: 'var(--color-success)', bg: 'var(--color-success-light)', label: 'Grammar' },
  'Mock Test': { color: 'var(--color-danger)', bg: 'var(--color-danger-light)', label: 'Mock' },
}

const CATEGORY_OPTIONS = Object.keys(CATEGORY_CONFIG)

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? { color: 'var(--color-muted)', bg: 'var(--color-surface-alt)', label: category.slice(0, 4) }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function DayCard({
  day, tasks, isToday, isPast, onToggleTask, onAskAI,
  isEditMode = false, onUpdateTask, onAddTask, onRemoveTask, onMoveTask,
  onRemoveDay, onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false,
}: DayCardProps) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(isToday)
  const allComplete = tasks.length > 0 && tasks.every(t => t.isDone)
  const someComplete = tasks.some(t => t.isDone)

  function getDayStatus() {
    if (allComplete) return { icon: '✓', color: 'var(--color-success)', bg: 'var(--color-success-light)' }
    if (isPast && someComplete) return { icon: '◐', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' }
    if (isPast) return { icon: '○', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' }
    if (isToday && someComplete) return { icon: '◐', color: 'var(--color-primary)', bg: 'var(--color-primary-light)' }
    if (isToday) return { icon: '◉', color: 'var(--color-primary)', bg: 'var(--color-primary-light)' }
    return { icon: '○', color: 'var(--color-muted)', bg: 'transparent' }
  }

  const status = getDayStatus()
  const dayOfWeek = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })
  const taskCount = tasks.length
  const completeCount = tasks.filter(t => t.isDone).length
  const uniqueCategories = [...new Set(tasks.map(t => t.category))]

  const todayStyle = isToday ? {
    borderColor: 'var(--color-primary)',
    boxShadow: '0 0 0 2px var(--color-primary-light)',
    backgroundColor: 'var(--color-primary-light)',
  } : {
    borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  }

  if (isPast && allComplete && !isEditMode) {
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
            <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {completeCount}/{taskCount}
            </span>
          </div>
          <p className="mt-0.5 text-sm line-through" style={{ color: 'var(--color-muted)' }}>
            {tasks.map(t => t.title).join(', ')}
          </p>
        </div>
        <span className="shrink-0 text-[10px]" style={{ color: 'var(--color-muted)' }}>
          {formatDate(day.date)}
        </span>
      </div>
    )
  }

  if (isEditMode) {
    return (
      <div
        className="rounded-xl border border-dashed px-4 py-3 transition-all space-y-3"
        style={{
          borderColor: 'var(--color-primary)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-30"
                title="Move day up"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              </button>
              <button
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-30"
                title="Move day down"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            </div>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              <span className="text-xs font-bold">{status.icon}</span>
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Day {day.dayNumber}
              </span>
              <span className="ml-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                {dayOfWeek}, {formatDate(day.date)}
              </span>
            </div>
          </div>
          <button
            onClick={() => { if (window.confirm('Delete this day and all its tasks?')) onRemoveDay?.() }}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-danger-light)] shrink-0"
            title="Delete day"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>

        <div className="space-y-2">
          {tasks.map((task, tIdx) => {
            const catCfg = getCategoryConfig(task.category)
            return (
              <div key={task.id} className="flex items-start gap-2 rounded-lg px-3 py-3 transition-colors" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                  <button onClick={() => onMoveTask?.(tIdx, tIdx - 1)} disabled={tIdx === 0} className="flex h-4 w-4 items-center justify-center rounded hover:bg-[var(--color-border)] disabled:opacity-20">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>
                  </button>
                  <button onClick={() => onMoveTask?.(tIdx, tIdx + 1)} disabled={tIdx === tasks.length - 1} className="flex h-4 w-4 items-center justify-center rounded hover:bg-[var(--color-border)] disabled:opacity-20">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                </div>
                <div
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all mt-0.5"
                  style={{ backgroundColor: task.isDone ? 'var(--color-success)' : 'transparent', border: task.isDone ? 'none' : '2px solid var(--color-border)', color: task.isDone ? 'white' : 'transparent' }}
                  onClick={() => onToggleTask(task.id)}
                >
                  {task.isDone && <span className="text-[9px] font-bold">✓</span>}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <select
                      value={task.category}
                      onChange={e => onUpdateTask?.(tIdx, { category: e.target.value })}
                      className="rounded-md px-2 py-1 text-xs font-medium border-0 cursor-pointer"
                      style={{ backgroundColor: catCfg.bg, color: catCfg.color }}
                    >
                      {CATEGORY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => onRemoveTask?.(tIdx)} className="ml-auto flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-danger-light)]" title="Remove task">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                  <EditableText
                    value={task.title}
                    onSave={val => onUpdateTask?.(tIdx, { title: val })}
                    isEditing={true}
                    multiline
                    placeholder="Enter task description..."
                    className="text-sm leading-relaxed"
                    style={{ color: task.isDone ? 'var(--color-muted)' : 'var(--color-text)', textDecoration: task.isDone ? 'line-through' : 'none' }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {onAddTask && (
          <button
            onClick={onAddTask}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:brightness-95"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Task
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border px-3 sm:px-4 py-3 transition-all"
      style={{
        ...todayStyle,
        opacity: isPast && !someComplete ? 0.7 : 1,
      }}
      aria-current={isToday ? 'date' : undefined}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left"
        aria-expanded={expanded}
        aria-label={`Day ${day.dayNumber}, ${dayOfWeek} ${formatDate(day.date)}, ${completeCount}/${taskCount} tasks`}
      >
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          <span className="text-xs font-bold">{status.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="text-xs font-medium" style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
              {dayOfWeek} · Day {day.dayNumber}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
              {completeCount}/{taskCount}
            </span>
            {uniqueCategories.map(cat => {
              const cfg = getCategoryConfig(cat)
              return (
                <span key={cat} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              )
            })}
            {isToday && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                Today
              </span>
            )}
          </div>
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
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
          {tasks.map(task => {
            const catCfg = getCategoryConfig(task.category)
            return (
              <div key={task.id} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-alt)]/50" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                <div
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all mt-0.5"
                  style={{ backgroundColor: task.isDone ? 'var(--color-success)' : 'var(--color-border)', color: task.isDone ? 'white' : 'transparent' }}
                  onClick={() => onToggleTask(task.id)}
                >
                  <span className="text-[10px] font-bold">{task.isDone ? '✓' : '○'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0" style={{ backgroundColor: catCfg.bg, color: catCfg.color }}>
                      {catCfg.label}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--color-muted)' }}>
                      {task.timeMinutes}m
                    </span>
                    <span className="text-sm" style={{ color: task.isDone ? 'var(--color-muted)' : 'var(--color-text)', textDecoration: task.isDone ? 'line-through' : 'none' }}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => onToggleTask(task.id)} className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors hover:brightness-90 active:scale-[0.97]" style={{ color: task.isDone ? 'var(--color-text-secondary)' : 'white', backgroundColor: task.isDone ? 'var(--color-surface-alt)' : 'var(--color-primary)' }}>
                      {task.isDone ? '↩ Undo' : 'Mark done'}
                    </button>
                    <button onClick={() => onAskAI(day)} className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors hover:brightness-90 active:scale-[0.97]" style={{ color: 'var(--color-tutor-accent)', backgroundColor: 'var(--color-tutor-accent-light)' }}>
                      Ask AI
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {!isEditMode && (
            <div className="flex items-center gap-1 pt-1">
              {!allComplete && (
                <button onClick={() => tasks.forEach(task => onToggleTask(task.id))} className="text-xs font-medium transition-colors hover:brightness-95 px-2 py-1 rounded-lg" style={{ color: 'var(--color-success)' }}>
                  ✓ Complete all
                </button>
              )}
              <button onClick={() => onAskAI(day)} className="text-xs font-medium transition-colors hover:brightness-95 px-2 py-1 rounded-lg" style={{ color: 'var(--color-tutor-accent)' }}>
                Ask AI for help
              </button>
              {isToday && (
                <button onClick={() => navigate('/roadmap')} className="text-xs font-medium transition-colors hover:brightness-95 px-2 py-1 rounded-lg" style={{ color: 'var(--color-primary)' }}>
                  View roadmap →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
