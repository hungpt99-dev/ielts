import type { TaskEntry } from '../../models'
import { taskRepo } from '../../services/repositories'
import type { RoadmapData, RoadmapPhase, RoadmapWeek, RoadmapDay } from './roadmapService'
import { recalculateProgress } from './roadmapService'
import { SKILL_TO_CATEGORY } from './constants'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export async function addTask(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  dayIndex: number,
): Promise<RoadmapData> {
  const cloned = deepClone(roadmap)
  const day = cloned.phases[phaseIndex].weeks[weekIndex].days[dayIndex]
  const entry = await taskRepo.create({
    title: 'New task',
    description: '',
    category: 'Vocabulary',
    date: day.date + 'T00:00:00.000Z',
    isDone: false,
    isRecurring: false,
    recurringDays: [],
    notes: '',
    timeMinutes: 25,
    completedAt: null,
  })
  day.taskIds.push(entry.id)
  const tasks = await taskRepo.findAll()
  return recalculateProgress(cloned, tasks)
}

export async function removeTask(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  dayIndex: number,
  taskIndex: number,
): Promise<RoadmapData> {
  const cloned = deepClone(roadmap)
  const day = cloned.phases[phaseIndex].weeks[weekIndex].days[dayIndex]
  const taskId = day.taskIds[taskIndex]
  day.taskIds.splice(taskIndex, 1)
  try {
    await taskRepo.delete(taskId)
  } catch (error) {
    console.error('apps/web/src/features/roadmap/roadmapCommands.ts error:', error);
    // ignore if already deleted
  }
  const tasks = await taskRepo.findAll()
  return recalculateProgress(cloned, tasks)
}

export async function updateTask(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  dayIndex: number,
  taskIndex: number,
  fields: { title?: string; category?: string },
): Promise<RoadmapData> {
  const taskId = roadmap.phases[phaseIndex].weeks[weekIndex].days[dayIndex].taskIds[taskIndex]
  const updates: Partial<TaskEntry> = {}
  if (fields.title !== undefined) updates.title = fields.title
  if (fields.category !== undefined) updates.category = SKILL_TO_CATEGORY[fields.category] ?? fields.category as TaskCategory
  if (Object.keys(updates).length > 0) {
    try {
      await taskRepo.update(taskId, updates)
    } catch (error) {
      console.error('apps/web/src/features/roadmap/roadmapCommands.ts error:', error);
      // ignore update failures
    }
  }
  const tasks = await taskRepo.findAll()
  return recalculateProgress(deepClone(roadmap), tasks)
}

export function moveTask(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  dayIndex: number,
  fromIndex: number,
  toIndex: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  const tasks = cloned.phases[phaseIndex].weeks[weekIndex].days[dayIndex].taskIds
  const [task] = tasks.splice(fromIndex, 1)
  tasks.splice(toIndex, 0, task)
  return recalculateProgress(cloned, [])
}

export async function addDay(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  afterIndex?: number,
): Promise<RoadmapData> {
  const cloned = deepClone(roadmap)
  const days = cloned.phases[phaseIndex].weeks[weekIndex].days
  const insertAt = afterIndex !== undefined ? afterIndex + 1 : days.length
  const entry = await taskRepo.create({
    title: 'New task',
    description: '',
    category: 'Vocabulary',
    date: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
    isDone: false,
    isRecurring: false,
    recurringDays: [],
    notes: '',
    timeMinutes: 25,
    completedAt: null,
  })
  const newDay: RoadmapDay = {
    id: generateId(),
    date: new Date().toISOString().split('T')[0],
    dayNumber: days.length + 1,
    taskIds: [entry.id],
  }
  days.splice(insertAt, 0, newDay)
  days.forEach((day, idx) => { day.dayNumber = idx + 1 })
  const tasks = await taskRepo.findAll()
  return recalculateProgress(cloned, tasks)
}

export function removeDay(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  dayIndex: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  const days = cloned.phases[phaseIndex].weeks[weekIndex].days
  days.splice(dayIndex, 1)
  days.forEach((day, idx) => { day.dayNumber = idx + 1 })
  return recalculateProgress(cloned, [])
}

export function moveDay(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  fromIndex: number,
  toIndex: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  const days = cloned.phases[phaseIndex].weeks[weekIndex].days
  const [day] = days.splice(fromIndex, 1)
  days.splice(toIndex, 0, day)
  days.forEach((d, idx) => { d.dayNumber = idx + 1 })
  return recalculateProgress(cloned, [])
}

export function updateWeek(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
  fields: Partial<Pick<RoadmapWeek, 'label' | 'focus' | 'goal'>>,
): RoadmapData {
  const cloned = deepClone(roadmap)
  Object.assign(cloned.phases[phaseIndex].weeks[weekIndex], fields)
  return recalculateProgress(cloned, [])
}

export function addWeek(
  roadmap: RoadmapData,
  phaseIndex: number,
  afterIndex?: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  const weeks = cloned.phases[phaseIndex].weeks
  const insertAt = afterIndex !== undefined ? afterIndex + 1 : weeks.length
  const newWeek: RoadmapWeek = {
    id: generateId(),
    weekNumber: insertAt + 1,
    label: `Week ${insertAt + 1}`,
    focus: 'New focus area',
    goal: 'Complete this week\'s tasks',
    days: [],
    isComplete: false,
    completedTasks: 0,
    totalTasks: 0,
  }
  weeks.splice(insertAt, 0, newWeek)
  weeks.forEach((w, idx) => { w.weekNumber = idx + 1 })
  return recalculateProgress(cloned, [])
}

export function removeWeek(
  roadmap: RoadmapData,
  phaseIndex: number,
  weekIndex: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  cloned.phases[phaseIndex].weeks.splice(weekIndex, 1)
  cloned.phases[phaseIndex].weeks.forEach((w, idx) => { w.weekNumber = idx + 1 })
  return recalculateProgress(cloned, [])
}

export function moveWeek(
  roadmap: RoadmapData,
  phaseIndex: number,
  fromIndex: number,
  toIndex: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  const weeks = cloned.phases[phaseIndex].weeks
  const [week] = weeks.splice(fromIndex, 1)
  weeks.splice(toIndex, 0, week)
  weeks.forEach((w, idx) => { w.weekNumber = idx + 1 })
  return recalculateProgress(cloned, [])
}

export function updatePhase(
  roadmap: RoadmapData,
  phaseIndex: number,
  fields: Partial<Pick<RoadmapPhase, 'name' | 'description' | 'targetRange'>>,
): RoadmapData {
  const cloned = deepClone(roadmap)
  Object.assign(cloned.phases[phaseIndex], fields)
  cloned.phases.forEach((p, idx) => { p.order = idx })
  return recalculateProgress(cloned, [])
}

export function addPhase(
  roadmap: RoadmapData,
  afterIndex?: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  const phases = cloned.phases
  const insertAt = afterIndex !== undefined ? afterIndex + 1 : phases.length
  const newPhase: RoadmapPhase = {
    id: generateId(),
    name: `Phase ${insertAt + 1}`,
    description: 'New learning phase',
    order: insertAt,
    targetRange: 'New Phase',
    weeks: [],
    isComplete: false,
    completedTasks: 0,
    totalTasks: 0,
  }
  phases.splice(insertAt, 0, newPhase)
  phases.forEach((p, idx) => { p.order = idx })
  return recalculateProgress(cloned, [])
}

export function removePhase(
  roadmap: RoadmapData,
  phaseIndex: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  cloned.phases.splice(phaseIndex, 1)
  cloned.phases.forEach((p, idx) => { p.order = idx })
  return recalculateProgress(cloned, [])
}

export function movePhase(
  roadmap: RoadmapData,
  fromIndex: number,
  toIndex: number,
): RoadmapData {
  const cloned = deepClone(roadmap)
  const phases = cloned.phases
  const [phase] = phases.splice(fromIndex, 1)
  phases.splice(toIndex, 0, phase)
  phases.forEach((p, idx) => { p.order = idx })
  return recalculateProgress(cloned, [])
}
