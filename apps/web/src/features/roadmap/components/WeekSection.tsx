import { useState, useEffect } from 'react'
import { IconCheck, IconFlame } from '@ielts/ui'
import type { TaskEntry } from '../../../models'
import { DatabaseService } from '../../../services/storage/Database'
import type { RoadmapWeek, RoadmapDay } from '../roadmapService'
import DayCard from './DayCard'
import EditableText from './EditableText'
import {
  updateWeek, addDay, removeDay, moveDay, addTask, removeTask, updateTask, moveTask,
} from '../roadmapCommands'
import type { RoadmapData } from '../roadmapService'

interface WeekSectionProps {
  week: RoadmapWeek
  weekIndex: number
  isCurrentWeek: boolean
  phaseIndex: number
  onToggleTask: (phaseIndex: number, weekIndex: number, dayIndex: number, taskIndex: number) => void
  onAskAI: (day: RoadmapDay) => void
  focusedWeekIdx?: number | null
  taskRefreshKey?: number
  isEditMode?: boolean
  applyCommand?: (command: (r: RoadmapData) => RoadmapData | Promise<RoadmapData>) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  onRemoveWeek?: () => void
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0]
}

function isPast(dateStr: string): boolean {
  return dateStr < new Date().toISOString().split('T')[0]
}

export default function WeekSection({
  week, weekIndex, isCurrentWeek, phaseIndex, onToggleTask, onAskAI,
  focusedWeekIdx = null, taskRefreshKey, isEditMode = false, applyCommand,
  onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false,
  onRemoveWeek,
}: WeekSectionProps) {
  const [expanded, setExpanded] = useState(isCurrentWeek || isEditMode)
  const [taskMap, setTaskMap] = useState<Map<string, TaskEntry>>(new Map())
  const weekProgress = week.totalTasks > 0 ? Math.round((week.completedTasks / week.totalTasks) * 100) : 0

  useEffect(() => {
    DatabaseService.getAll<TaskEntry>('tasks').then(allTasks => {
      setTaskMap(new Map(allTasks.map(t => [t.id, t])))
    })
  }, [week, taskRefreshKey])

  useEffect(() => {
    if (isEditMode) setExpanded(true)
  }, [isEditMode])

  useEffect(() => {
    if (focusedWeekIdx === weekIndex) {
      setExpanded(true)
    } else if (focusedWeekIdx !== null) {
      setExpanded(false)
    }
  }, [focusedWeekIdx, weekIndex])

  const weekEditControls = isEditMode && (
    <div className="flex items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onMoveUp?.() }}
        disabled={!canMoveUp}
        className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-30"
        title="Move week up"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onMoveDown?.() }}
        disabled={!canMoveDown}
        className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-30"
        title="Move week down"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (window.confirm(`Delete "${week.label}" and all its tasks?`)) onRemoveWeek?.()
        }}
        className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--color-danger-light)]"
        title="Delete week"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-danger)' }}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  )

  return (
    <div
      className={`rounded-xl border transition-all ${isEditMode ? 'border-dashed' : ''}`}
      style={{
        borderColor: isEditMode ? 'var(--color-primary)' : isCurrentWeek ? 'var(--color-primary)' : week.isComplete ? 'var(--color-success)' : 'var(--color-border)',
        backgroundColor: isCurrentWeek
          ? 'var(--color-primary-light)'
          : 'var(--color-surface)',
      }}
    >
      {isEditMode ? (
        <div className="flex w-full items-center gap-3 px-3 sm:px-4 py-3">
          {weekEditControls}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex flex-wrap items-center gap-1 text-sm font-semibold break-words min-w-0" style={{ color: 'var(--color-text)' }}>
                <EditableText
                  value={week.label}
                  onSave={val => applyCommand?.(r => updateWeek(r, phaseIndex, weekIndex, { label: val }))}
                  isEditing={true}
                  className="text-sm font-semibold"
                />
                :
                <EditableText
                  value={week.focus}
                  onSave={val => applyCommand?.(r => updateWeek(r, phaseIndex, weekIndex, { focus: val }))}
                  isEditing={true}
                  className="text-sm font-semibold"
                />
              </span>
            </div>
            <div className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
              <EditableText
                value={week.goal}
                onSave={val => applyCommand?.(r => updateWeek(r, phaseIndex, weekIndex, { goal: val }))}
                isEditing={true}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 px-3 sm:px-4 py-3 text-left transition-colors hover:brightness-95"
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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold break-words min-w-0" style={{ color: 'var(--color-text)' }}>
                {week.label}: {week.focus}
              </span>
              {week.isComplete ? (
<span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <IconCheck size={10} /> Done
                </span>
              ) : isCurrentWeek ? (
<span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <IconFlame size={10} /> In Progress
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
      )}

      {(expanded || isEditMode) && (
        <div
          id={`week-${week.id}-content`}
          className="border-t px-3 sm:px-4 py-3 space-y-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
        {week.days.map((day, dIdx) => {
          const dayTasks = day.taskIds.map(id => taskMap.get(id)).filter((t): t is TaskEntry => !!t)
          return (
            <DayCard
              key={day.id}
              day={day}
              tasks={dayTasks}
              isToday={isToday(day.date)}
              isPast={isPast(day.date)}
              onToggleTask={(taskId) => {
                const tIdx = day.taskIds.indexOf(taskId)
                if (tIdx !== -1) {
                  onToggleTask(phaseIndex, weekIndex, dIdx, tIdx)
                } else {
                  console.warn('Task ID not found in day.taskIds:', taskId, day.taskIds)
                }
              }}
              onAskAI={onAskAI}
              isEditMode={isEditMode}
              onUpdateTask={isEditMode && applyCommand
                ? (tIdx, fields) => applyCommand(r => updateTask(r, phaseIndex, weekIndex, dIdx, tIdx, fields))
                : undefined}
              onAddTask={isEditMode && applyCommand
                ? () => applyCommand(r => addTask(r, phaseIndex, weekIndex, dIdx))
                : undefined}
              onRemoveTask={isEditMode && applyCommand
                ? (tIdx) => applyCommand(r => removeTask(r, phaseIndex, weekIndex, dIdx, tIdx))
                : undefined}
              onMoveTask={isEditMode && applyCommand
                ? (fromIdx, toIdx) => applyCommand(r => moveTask(r, phaseIndex, weekIndex, dIdx, fromIdx, toIdx))
                : undefined}
              onRemoveDay={isEditMode && applyCommand
                ? () => applyCommand(r => removeDay(r, phaseIndex, weekIndex, dIdx))
                : undefined}
              onMoveUp={isEditMode && applyCommand && dIdx > 0
                ? () => applyCommand(r => moveDay(r, phaseIndex, weekIndex, dIdx, dIdx - 1))
                : undefined}
              onMoveDown={isEditMode && applyCommand && dIdx < week.days.length - 1
                ? () => applyCommand(r => moveDay(r, phaseIndex, weekIndex, dIdx, dIdx + 1))
                : undefined}
              canMoveUp={dIdx > 0}
              canMoveDown={dIdx < week.days.length - 1}
            />
          )
        })}
          {isEditMode && applyCommand && (
            <button
              onClick={() => applyCommand(r => addDay(r, phaseIndex, weekIndex))}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-2.5 text-xs font-medium transition-colors hover:brightness-95"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-primary)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Day
            </button>
          )}
        </div>
      )}
    </div>
  )
}
