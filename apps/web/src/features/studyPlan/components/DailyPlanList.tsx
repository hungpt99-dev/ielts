import { useState, useMemo } from 'react'
import { useStudyPlan } from '../hooks/useStudyPlan'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDateLabel, isTodayDate, formatShortDate } from '@/utils'
import { getTaskExplanation } from '../services/dailyPlanService'
import type {
  DailyPlanItem,
  DailyPlanStatus,
  PlanPhaseName,
  DailyStudyTask,
  StudyPlanData,
} from '../types'
import type { ProviderConfig } from '@ielts/ai'

const PHASE_ORDER: PlanPhaseName[] = [
  'Foundation',
  'Skill Improvement',
  'Weakness Fixing',
  'Mock Test',
  'Final Review',
]

const STATUS_OPTIONS: Array<{ value: DailyPlanStatus; label: string }> = [
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'partially-completed', label: 'Partially completed' },
]

const STATUS_VARIANT: Record<DailyPlanStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  'not-started': 'default',
  'in-progress': 'primary',
  'completed': 'success',
  'skipped': 'warning',
  'partially-completed': 'info',
}

const PRIORITY_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  low: 'default',
  medium: 'primary',
  high: 'warning',
  critical: 'danger',
}

const DIFFICULTY_VARIANT: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  easy: 'success',
  medium: 'default',
  hard: 'warning',
}

const SKILL_TASK_KEYS: Array<{
  key: keyof Pick<DailyPlanItem, 'listeningTask' | 'readingTask' | 'writingTask' | 'speakingTask' | 'vocabularyTask' | 'grammarTask' | 'reviewTask'>
  label: string
  color: string
}> = [
  { key: 'listeningTask', label: 'Listening', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { key: 'readingTask', label: 'Reading', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { key: 'writingTask', label: 'Writing', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { key: 'speakingTask', label: 'Speaking', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  { key: 'vocabularyTask', label: 'Vocabulary', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { key: 'grammarTask', label: 'Grammar', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { key: 'reviewTask', label: 'Review', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
]

function getConfig(): ProviderConfig | null {
  try {
    const raw = localStorage.getItem('ielts-ai-config')
    if (!raw) return null
    return JSON.parse(raw) as ProviderConfig
  } catch {
    return null
  }
}

function getDaysByPhase(plan: StudyPlanData): Map<PlanPhaseName, DailyPlanItem[]> {
  const map = new Map<PlanPhaseName, DailyPlanItem[]>()
  for (const day of plan.dailyPlans) {
    const existing = map.get(day.phaseName) ?? []
    existing.push(day)
    map.set(day.phaseName, existing)
  }
  return map
}

function getDaysByWeek(days: DailyPlanItem[]): Map<number, DailyPlanItem[]> {
  const map = new Map<number, DailyPlanItem[]>()
  for (const day of days) {
    const existing = map.get(day.weekNumber) ?? []
    existing.push(day)
    map.set(day.weekNumber, existing)
  }
  return map
}

function calculatePlanStats(plan: StudyPlanData) {
  const total = plan.dailyPlans.length
  const statusCounts: Record<DailyPlanStatus, number> = {
    'not-started': 0,
    'in-progress': 0,
    'completed': 0,
    'skipped': 0,
    'partially-completed': 0,
  }
  let totalMinutes = 0
  for (const day of plan.dailyPlans) {
    statusCounts[day.status] = (statusCounts[day.status] ?? 0) + 1
    totalMinutes += day.estimatedTotalMinutes
  }
  const completedPct = total > 0 ? Math.round(((statusCounts.completed + statusCounts['partially-completed']) / total) * 100) : 0
  return { total, statusCounts, totalMinutes, completedPct }
}

function taskTitle(task: DailyStudyTask | null): string {
  return task?.title ?? ''
}

function taskMinutes(task: DailyStudyTask | null): number {
  return task?.estimatedMinutes ?? 0
}

function hasTask(task: DailyStudyTask | null): boolean {
  return task !== null && task.title.length > 0
}

function allDayTasks(day: DailyPlanItem): DailyStudyTask[] {
  const tasks: DailyStudyTask[] = []
  for (const { key } of SKILL_TASK_KEYS) {
    const task = day[key]
    if (hasTask(task)) tasks.push(task!)
  }
  for (const opt of day.optionalTasks) {
    tasks.push(opt)
  }
  return tasks
}

interface DayCardProps {
  day: DailyPlanItem
  planId: string
  onStatusChange: (date: string, status: DailyPlanStatus) => void
  onTaskToggle: (planId: string, date: string, taskKey: string, taskId: string, completed: boolean) => void
}

function DayCard({ day, planId, onStatusChange, onTaskToggle }: DayCardProps) {
  const [showTutorNote, setShowTutorNote] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [explainingTaskKey, setExplainingTaskKey] = useState<string | null>(null)
  const { actions } = useStudyPlan()
  const tasks = allDayTasks(day)
  const completedTasks = tasks.filter(t => t.isCompleted).length
  const todayStr = new Date().toISOString().slice(0, 10)
  const isPast = day.date < todayStr

  async function handleAskAiTutor(taskKey: string, task: DailyStudyTask) {
    setExplainingTaskKey(taskKey)
    try {
      const codeTaskKey = taskKey.startsWith('optional-') ? 'optionalTasks' : taskKey
      const label = SKILL_TASK_KEYS.find(k => k.key === codeTaskKey)?.label ?? 'Optional'

      const { explanation, error } = await getTaskExplanation(
        {
          taskTitle: task.title,
          taskDescription: task.description,
          taskMinutes: task.estimatedMinutes,
          taskLabel: label,
          dayNumber: day.dayNumber,
          date: day.date,
          phaseName: day.phaseName,
          mainGoal: day.mainGoal,
          estimatedTotalMinutes: day.estimatedTotalMinutes,
        },
        getConfig,
      )

      if (error) return
      if (!explanation) return

      const updatedTask = { ...task, notes: explanation }
      const changes = buildTaskChanges(taskKey, updatedTask, day)
      changes.updatedAt = new Date().toISOString()
      await actions.updateDailyPlan(planId, day.date, changes)
    } finally {
      setExplainingTaskKey(null)
    }
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${isTodayDate(day.date) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
              {isTodayDate(day.date) ? 'Today' : formatShortDate(day.date)}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              Day {day.dayNumber}
            </span>
            <Badge variant={STATUS_VARIANT[day.status]} size="sm">
              {STATUS_OPTIONS.find(s => s.value === day.status)?.label ?? day.status}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[day.priority]}>
              {day.priority}
            </Badge>
            <Badge variant={DIFFICULTY_VARIANT[day.difficulty]}>
              {day.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted)]">
              {day.estimatedTotalMinutes}m
            </span>
            {tasks.length > 0 && (
              <span className="text-xs text-[var(--color-muted)]">
                {completedTasks}/{tasks.length}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-[var(--color-text)] leading-relaxed">
          {day.mainGoal}
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {SKILL_TASK_KEYS.map(({ key, label, color }) => {
            const task = day[key]
            if (!hasTask(task)) return null
            return (
              <TaskRow
                key={key}
                task={task!}
                label={label}
                color={color}
                dayDate={day.date}
                planId={planId}
                taskKey={key}
                onToggle={onTaskToggle}
                onAskAiTutor={handleAskAiTutor}
                isExplaining={explainingTaskKey === key}
              />
            )
          })}
        </div>

        {day.optionalTasks.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {day.optionalTasks.map((task, idx) => (
              <TaskRow
                key={`opt-${task.id ?? idx}`}
                task={task}
                label="Optional"
                color="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                dayDate={day.date}
                planId={planId}
                taskKey={`optional-${idx}`}
                onToggle={onTaskToggle}
                onAskAiTutor={handleAskAiTutor}
                isExplaining={explainingTaskKey === `optional-${idx}`}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select
              value={day.status}
              onChange={(e) => onStatusChange(day.date, e.target.value as DailyPlanStatus)}
              options={STATUS_OPTIONS}
              aria-label="Day status"
            />
          </div>

          {day.completionChecklist.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChecklist(!showChecklist)}
            >
              {showChecklist ? 'Hide' : 'Show'} checklist ({day.completionChecklist.length})
            </Button>
          )}

          {day.aiTutorNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTutorNote(!showTutorNote)}
            >
              {showTutorNote ? 'Hide' : 'Show'} AI note
            </Button>
          )}
        </div>

        {showChecklist && day.completionChecklist.length > 0 && (
          <div className="space-y-1 rounded-lg bg-[var(--color-surface-alt)] p-3">
            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">Checklist</p>
            {day.completionChecklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="text-[var(--color-muted)]">•</span>
                {item}
              </div>
            ))}
          </div>
        )}

        {showTutorNote && day.aiTutorNote && (
          <div className="rounded-lg bg-[var(--color-primary-light)] p-3 text-sm text-[var(--color-primary)]">
            {day.aiTutorNote}
          </div>
        )}
      </div>
    </div>
  )
}

interface TaskRowProps {
  task: DailyStudyTask
  label: string
  color: string
  dayDate: string
  planId: string
  taskKey: string
  onToggle: (planId: string, date: string, taskKey: string, taskId: string, completed: boolean) => void
  onAskAiTutor: (taskKey: string, task: DailyStudyTask) => Promise<void>
  isExplaining: boolean
}

function TaskRow({ task, label, color, dayDate, planId, taskKey, onToggle, onAskAiTutor, isExplaining }: TaskRowProps) {
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="flex items-start gap-2 rounded-md p-2 hover:bg-[var(--color-surface-alt)]">
      <input
        type="checkbox"
        checked={task.isCompleted}
        onChange={() => onToggle(planId, dayDate, taskKey, task.id, !task.isCompleted)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
            {label}
          </span>
          {task.notes && (
            <span className="text-[10px] text-[var(--color-primary)] font-medium">
              Explained
            </span>
          )}
        </div>
        <p className={`mt-0.5 text-xs leading-relaxed ${task.isCompleted ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {task.estimatedMinutes > 0 && (
            <span className="text-[10px] text-[var(--color-muted)]">
              {task.estimatedMinutes}m
            </span>
          )}
          {task.notes ? (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-[10px] text-[var(--color-primary)] hover:underline"
            >
              {showNotes ? 'Hide tutor note' : 'View tutor note'}
            </button>
          ) : (
            <button
              onClick={() => onAskAiTutor(taskKey, task)}
              disabled={isExplaining}
              className="text-[10px] text-[var(--color-primary)] hover:underline disabled:opacity-50"
            >
              {isExplaining ? 'Asking AI tutor...' : 'Ask AI tutor'}
            </button>
          )}
        </div>
        {showNotes && task.notes && (
          <div className="mt-2 rounded-md bg-[var(--color-primary-light)] p-2 text-xs text-[var(--color-primary)]">
            {task.notes}
          </div>
        )}
      </div>
    </div>
  )
}

interface WeekGroupProps {
  weekNumber: number
  days: DailyPlanItem[]
  planId: string
  onStatusChange: (date: string, status: DailyPlanStatus) => void
  onTaskToggle: (planId: string, date: string, taskKey: string, taskId: string, completed: boolean) => void
}

function WeekGroup({ weekNumber, days, planId, onStatusChange, onTaskToggle }: WeekGroupProps) {
  const [collapsed, setCollapsed] = useState(false)
  const completed = days.filter(d => d.status === 'completed').length
  const total = days.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-[var(--color-surface-alt)]"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            Week {weekNumber}
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            {completed}/{total} days
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-[var(--color-muted)] transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && (
        <div className="space-y-2 pl-4">
          {days.map(day => (
            <DayCard
              key={day.date}
              day={day}
              planId={planId}
              onStatusChange={onStatusChange}
              onTaskToggle={onTaskToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PhaseAccordionProps {
  phaseName: PlanPhaseName
  days: DailyPlanItem[]
  planId: string
  onStatusChange: (date: string, status: DailyPlanStatus) => void
  onTaskToggle: (planId: string, date: string, taskKey: string, taskId: string, completed: boolean) => void
  defaultExpanded?: boolean
}

function PhaseAccordion({ phaseName, days, planId, onStatusChange, onTaskToggle, defaultExpanded = false }: PhaseAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const weeks = getDaysByWeek(days)
  const weekNumbers = [...weeks.keys()].sort((a, b) => a - b)
  const completed = days.filter(d => d.status === 'completed').length
  const total = days.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  if (days.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <CardTitle>{phaseName}</CardTitle>
            <Badge variant={pct === 100 ? 'success' : pct > 0 ? 'primary' : 'default'} size="sm">
              {completed}/{total}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <svg
              className={`h-5 w-5 text-[var(--color-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="space-y-3">
            {weekNumbers.map(weekNum => {
              const weekDays = weeks.get(weekNum)!
              const sorted = [...weekDays].sort((a, b) => a.dayNumber - b.dayNumber)
              return (
                <WeekGroup
                  key={weekNum}
                  weekNumber={weekNum}
                  days={sorted}
                  planId={planId}
                  onStatusChange={onStatusChange}
                  onTaskToggle={onTaskToggle}
                />
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

interface DailyPlanListProps {
  planId?: string
}

export default function DailyPlanList({ planId }: DailyPlanListProps) {
  const { state, actions } = useStudyPlan()
  const plan = planId
    ? state.planList.find(p => p.id === planId) ?? state.plan
    : state.plan

  const stats = useMemo(() => plan ? calculatePlanStats(plan) : null, [plan])

  if (state.isGenerating && !plan) {
    return <LoadingSpinner size="lg" message="Generating your study plan..." />
  }

  if (!plan) {
    return (
      <EmptyState
        title="No study plan yet"
        description="Generate a personalised IELTS study plan to see your daily schedule."
      />
    )
  }

  const phaseMap = getDaysByPhase(plan)
  const orderedPhases = PHASE_ORDER.filter(p => phaseMap.has(p) && (phaseMap.get(p)?.length ?? 0) > 0)

  async function handleStatusChange(date: string, status: DailyPlanStatus) {
    try {
      await actions.updateDailyPlanStatus(plan.id, date, status)
    } catch {
      // Error handled by context
    }
  }

  async function handleTaskToggle(
    planId: string,
    date: string,
    taskKey: string,
    taskId: string,
    completed: boolean,
  ) {
    const day = plan.dailyPlans.find(d => d.date === date)
    if (!day) return

    const task = findTaskByKey(day, taskKey, taskId)
    if (!task) return

    const updatedTask = { ...task, isCompleted: completed }
    const changes = buildTaskChanges(taskKey, updatedTask, day)
    changes.updatedAt = new Date().toISOString()

    try {
      await actions.updateDailyPlan(planId, date, changes)
    } catch {
      // Error handled by context
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text)]">{stats!.total}</p>
            <p className="text-xs text-[var(--color-muted)]">Total days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-success)]">{stats!.completedPct}%</p>
            <p className="text-xs text-[var(--color-muted)]">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text)]">{stats!.statusCounts['in-progress']}</p>
            <p className="text-xs text-[var(--color-muted)]">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text)]">{stats!.totalMinutes}</p>
            <p className="text-xs text-[var(--color-muted)]">Total minutes</p>
          </CardContent>
        </Card>
      </div>

      {plan.dailyPlans.length === 0 && (
        <EmptyState
          title="No daily plans yet"
          description="Daily plans are being generated. Check back shortly."
        />
      )}

      {plan.dailyPlans.length > 0 && (
        <div className="space-y-4">
          {orderedPhases.map((phaseName, idx) => {
            const days = phaseMap.get(phaseName)!
            const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber)
            return (
              <PhaseAccordion
                key={phaseName}
                phaseName={phaseName}
                days={sorted}
                planId={plan.id}
                onStatusChange={handleStatusChange}
                onTaskToggle={handleTaskToggle}
                defaultExpanded={idx === 0}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function findTaskByKey(day: DailyPlanItem, taskKey: string, taskId: string): DailyStudyTask | null {
  for (const { key } of SKILL_TASK_KEYS) {
    if (key === taskKey) {
      return day[key]
    }
  }
  if (taskKey.startsWith('optional-')) {
    const idx = parseInt(taskKey.replace('optional-', ''), 10)
    return day.optionalTasks[idx] ?? null
  }
  return null
}

function buildTaskChanges(
  taskKey: string,
  updatedTask: DailyStudyTask,
  day: DailyPlanItem,
): Partial<DailyPlanItem> {
  if (taskKey.startsWith('optional-')) {
    const idx = parseInt(taskKey.replace('optional-', ''), 10)
    const optionalTasks = [...day.optionalTasks]
    optionalTasks[idx] = updatedTask
    return { optionalTasks }
  }
  return { [taskKey]: updatedTask } as Partial<DailyPlanItem>
}
