import type { StudyPlan } from '@ielts/learning-engine'
import type { StudyTask } from '@ielts/learning-engine'
import { toNearestOfficialBand, toDisplayBand } from '@ielts/learning-engine'
import { taskRepo } from '../../services/repositories'
import type { RoadmapData, RoadmapPhase, RoadmapWeek, RoadmapDay } from './roadmapService'
import { ENGINE_SKILL_TO_CATEGORY as SKILL_TO_CATEGORY, PHASE_TYPE_TO_NAME, PHASE_STAGE_TO_GOAL_LABEL } from './constants'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function getTargetRange(
  phase: { stage?: string; officialBandGoal?: number; title: string; description: string },
  currentBand: number,
  targetBand: number,
): string {
  const targetOfficial = toNearestOfficialBand(targetBand)

  if (phase.officialBandGoal && phase.officialBandGoal > 0) {
    return `Goal: ${PHASE_STAGE_TO_GOAL_LABEL[phase.stage ?? ''] ?? 'Build toward'} Band ${toDisplayBand(toNearestOfficialBand(phase.officialBandGoal))}`
  }

  if (currentBand >= targetBand) {
    return `Goal: Maintain Band ${toDisplayBand(targetOfficial)}`
  }

  return `Goal: Progress toward Band ${toDisplayBand(targetOfficial)}`
}

export async function studyPlanToRoadmapData(
  plan: StudyPlan,
  currentBand: number,
  targetBand: number,
): Promise<RoadmapData> {
  const taskEntryMap = new Map<string, string>()

  const existingTasks = await taskRepo.findAll()
  const existingByKey = new Map<string, string>()
  for (const t of existingTasks) {
    const key = t.date.slice(0, 10) + '|' + t.title
    if (!existingByKey.has(key)) existingByKey.set(key, t.id)
  }

  for (const task of plan.tasks) {
    const dateKey = task.date + '|' + task.title
    const existingId = existingByKey.get(dateKey)
    if (existingId) {
      taskEntryMap.set(task.id, existingId)
      continue
    }
    const entry = await taskRepo.create({
      title: task.title,
      description: task.description || task.objective,
      category: SKILL_TO_CATEGORY[task.skill] ?? 'Vocabulary',
      date: task.date + 'T00:00:00.000Z',
      isDone: task.status === 'completed',
      isRecurring: false,
      recurringDays: [],
      notes: '',
      timeMinutes: task.estimatedMinutes,
      completedAt: task.status === 'completed' ? (task.completedAt ?? new Date().toISOString()) : null,
    })
    taskEntryMap.set(task.id, entry.id)
    existingByKey.set(dateKey, entry.id)
  }

  const totalPhases = plan.phases.length

  const phases: RoadmapPhase[] = plan.phases.map((phase, index) => {
    const phaseWeeks = plan.weeks.filter(w => w.phaseId === phase.id)
    const weeks: RoadmapWeek[] = phaseWeeks.map(week => {
      const weekTasks = plan.tasks.filter(t => t.weekId === week.id)

      const dateGroups = new Map<string, StudyTask[]>()
      for (const task of weekTasks) {
        const existing = dateGroups.get(task.date) ?? []
        existing.push(task)
        dateGroups.set(task.date, existing)
      }

      const sortedDates = [...dateGroups.keys()].sort()
      const days: RoadmapDay[] = sortedDates.map((date, idx) => {
        const dayTasks = dateGroups.get(date)!
        return {
          id: generateId(),
          date,
          dayNumber: idx + 1,
          taskIds: dayTasks.map(t => taskEntryMap.get(t.id)).filter((id): id is string => !!id),
        }
      })

      const completedTasks = weekTasks.filter(t => t.status === 'completed').length
      const totalTasks = weekTasks.length
      return {
        id: week.id,
        weekNumber: week.weekNumber,
        label: week.title,
        focus: week.focus,
        goal: week.description || (week.objectives[0] ?? week.focus),
        days,
        isComplete: totalTasks > 0 && completedTasks === totalTasks,
        completedTasks,
        totalTasks,
      }
    })

    const phaseCompletedTasks = weeks.reduce((s, w) => s + w.completedTasks, 0)
    const phaseTotalTasks = weeks.reduce((s, w) => s + w.totalTasks, 0)
    return {
      id: phase.id,
      name: phase.title,
      description: phase.description || phase.summary,
      order: phase.order,
      targetRange: getTargetRange(phase, currentBand, targetBand),
      weeks,
      isComplete: weeks.every(w => w.isComplete),
      completedTasks: phaseCompletedTasks,
      totalTasks: phaseTotalTasks,
    }
  })

  let currentPhaseIndex = 0
  let currentWeekIndex = 0
  for (let p = 0; p < phases.length; p++) {
    if (!phases[p].isComplete) {
      currentPhaseIndex = p
      for (let w = 0; w < phases[p].weeks.length; w++) {
        if (!phases[p].weeks[w].isComplete) {
          currentWeekIndex = w
          break
        }
      }
      break
    }
  }

  const totalTasks = phases.reduce((s, p) => s + p.totalTasks, 0)
  const completedTasks = phases.reduce((s, p) => s + p.completedTasks, 0)

  return {
    phases,
    currentPhaseIndex,
    currentWeekIndex,
    overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    totalTasks,
    completedTasks,
    generatedAt: plan.generationMetadata.generatedAt,
    updatedAt: plan.updatedAt,
  }
}
