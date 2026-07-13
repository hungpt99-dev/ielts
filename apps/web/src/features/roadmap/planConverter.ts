import type { StudyPlan } from '@ielts/learning-engine'
import type { StudyTask } from '@ielts/learning-engine'
import { DatabaseService } from '../../services/storage/Database'
import type { RoadmapData, RoadmapPhase, RoadmapWeek, RoadmapDay } from './roadmapService'
import { ENGINE_SKILL_TO_CATEGORY as SKILL_TO_CATEGORY, PHASE_TYPE_TO_NAME } from './constants'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function getTargetRange(
  phaseOrder: number,
  totalPhases: number,
  currentBand: number,
  targetBand: number,
): string {
  const bandGap = Math.max(targetBand - currentBand, 0.5)
  const bandPerPhase = bandGap / Math.max(totalPhases, 1)
  const low = currentBand + phaseOrder * bandPerPhase
  const high = Math.min(low + bandPerPhase, 9)
  return `Band ${low.toFixed(1)}-${high.toFixed(1)}`
}

export async function studyPlanToRoadmapData(
  plan: StudyPlan,
  currentBand: number,
  targetBand: number,
): Promise<RoadmapData> {
  const taskEntryMap = new Map<string, string>()

  for (const task of plan.tasks) {
    const entry = await DatabaseService.addTask({
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
  }

  const totalPhases = plan.phases.length

  const phases: RoadmapPhase[] = plan.phases.map(phase => {
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
      name: PHASE_TYPE_TO_NAME[phase.type] ?? phase.title,
      description: phase.description,
      order: phase.order,
      targetRange: getTargetRange(phase.order, totalPhases, currentBand, targetBand),
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
