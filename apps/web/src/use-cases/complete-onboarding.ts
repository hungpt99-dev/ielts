import { DailyPlanEngine, buildNormalizedProfile, type SettingsSource } from '@ielts/learning-engine'
import { PlanRepository } from '@ielts/storage'
import { STORAGE_KEYS } from '@ielts/config'
import type { StudyTask } from '@ielts/learning-engine'

export interface CompleteOnboardingInput {
  currentBand: number
  targetBand: number
  examDate: string
  dailyStudyMinutes: number
  weakSkills: string[]
  strongSkills: string[]
  preferredTopics: string[]
  studyGoal: 'academic' | 'general'
  preferredSchedule: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
  preferredLanguage: string
  tutorStyle: 'encouraging' | 'direct' | 'detailed'
}

export interface CompleteOnboardingOutput {
  success: boolean
  planId: string | null
  tasksCreated: number
  isComplete: boolean
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function persistCanonicalSettings(input: CompleteOnboardingInput): void {
  const settings = {
    version: 1,
    study: {
      targetBand: input.targetBand,
      currentBand: input.currentBand,
      examDate: input.examDate || undefined,
      dailyStudyMinutes: input.dailyStudyMinutes,
      weakSkills: input.weakSkills,
      nativeLanguage: input.preferredLanguage || '',
      studyGoal: input.studyGoal,
      preferredSchedule: input.preferredSchedule,
    },
    ai: {
      providerId: 'openai',
      model: undefined,
      customApiUrl: undefined,
      temperature: undefined,
    },
    theme: {
      mode: 'system' as const,
      accentColor: '#2563eb',
    },
    notifications: {
      enabled: true,
      reminderTime: '09:00',
    },
  }

  localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify(settings))
  localStorage.setItem(STORAGE_KEYS.localStorage.onboardingComplete, 'true')
  localStorage.setItem('ielts-preferred-language', input.preferredLanguage || 'en')
  localStorage.setItem('ielts-tutor-style', input.tutorStyle || 'encouraging')
  localStorage.setItem('ielts-strong-skills', JSON.stringify(input.strongSkills || []))
}

function mapEngineTaskToDb(
  task: StudyTask,
  planId: string,
): Record<string, unknown> {
  const now = new Date().toISOString()
  return {
    id: task.id,
    title: task.title || task.description || '',
    description: task.description || '',
    category: task.skill || 'reading',
    date: task.date,
    isDone: task.isDone ?? false,
    isRecurring: false,
    recurringDays: [],
    notes: typeof task.metadata === 'string' ? task.metadata : '',
    timeMinutes: task.estimatedMinutes || 0,
    planId,
    phaseId: task.phaseId || '',
    weekId: task.weekId || '',
    skill: task.skill || '',
    estimatedMinutes: task.estimatedMinutes || 0,
    priority: task.priority || 'normal',
    difficulty: task.difficulty || 'medium',
    sessionOrder: task.sessionOrder || 0,
    createdAt: now,
    updatedAt: now,
    completedAt: task.isDone ? now : null,
  }
}

async function persistPlanTasks(
  tasks: StudyTask[],
  planId: string,
): Promise<number> {
  if (tasks.length === 0) return 0
  try {
    const { DatabaseService } = await import('../services/storage/Database')
    const mappedTasks = tasks.map(t => mapEngineTaskToDb(t, planId))

    const existingTasks = await DatabaseService.getAll<{ id: string }>('tasks').catch(() => [] as { id: string }[])
    const existingIds = new Set(existingTasks.map(t => t.id))
    const newTasks = mappedTasks.filter(t => !existingIds.has(t.id as string))

    if (newTasks.length > 0) {
      await DatabaseService.bulkAdd('tasks', newTasks)
    }
    return tasks.length
  } catch {
    return 0
  }
}

async function generateAndPersistPlan(
  input: CompleteOnboardingInput,
): Promise<{ planId: string; taskCount: number } | null> {
  const settingsSource: SettingsSource = {
    targetBand: input.targetBand,
    currentBand: input.currentBand,
    examDate: input.examDate,
    dailyStudyMinutes: input.dailyStudyMinutes,
    weakSkills: input.weakSkills,
    studyGoal: input.studyGoal,
    preferredSchedule: input.preferredSchedule,
    aiEnabled: false,
  }

  try {
    const normalizedProfile = buildNormalizedProfile({
      settings: settingsSource,
      overrides: {
        planStartDate: new Date().toISOString().slice(0, 10),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })

    const planEngine = new DailyPlanEngine()
    const result = planEngine.generatePlan(normalizedProfile)

    if (result.status !== 'success' || !result.plan) {
      return null
    }

    const plan = result.plan
    const planId = plan.id || generateId()
    const now = new Date().toISOString()
    const planRepo = new PlanRepository()

    const engineTasks = plan.tasks || []

    const weekOrderMap = new Map<string, number>()
    ;(plan.weeks || []).forEach((w, i) => weekOrderMap.set(w.id, i ?? 0))

    const phaseOrderMap = new Map<string, number>()
    ;(plan.phases || []).forEach((p, i) => phaseOrderMap.set(p.id, p.order ?? i))

    const weekPhaseMap = new Map((plan.weeks || []).map(w => [w.id, w.phaseId || '']))

    await planRepo.savePlan({
      id: planId,
      version: plan.version || 1,
      profileSnapshot: JSON.stringify(normalizedProfile),
      planningWindowSnapshot: JSON.stringify(plan.planningWindow),
      feasibilityStatus: plan.feasibility?.status || 'comfortable',
      overallProgress: 0,
      totalTasks: engineTasks.length,
      completedTasks: 0,
      createdAt: now,
      updatedAt: now,
    })

    for (const phase of plan.phases || []) {
      const phaseId = phase.id || generateId()
      await planRepo.savePhase({
        id: phaseId,
        planId,
        name: phase.title || '',
        description: phase.description || '',
        order: phase.order || 0,
        targetRange: '',
        createdAt: now,
      })
    }

    const weeksByPhase = new Map<string, typeof plan.weeks>()
    for (const week of plan.weeks || []) {
      const phaseId = week.phaseId || ''
      const list = weeksByPhase.get(phaseId) || []
      list.push(week)
      weeksByPhase.set(phaseId, list)
    }

    for (const phase of plan.phases || []) {
      const weeks = weeksByPhase.get(phase.id) || []
      for (let wIdx = 0; wIdx < weeks.length; wIdx++) {
        const week = weeks[wIdx]
        const weekId = week.id || generateId()
        await planRepo.saveWeek({
          id: weekId,
          phaseId: phase.id,
          weekNumber: week.weekNumber || wIdx + 1,
          label: week.title || `Week ${week.weekNumber || wIdx + 1}`,
          focus: week.focus || '',
          goal: '',
          createdAt: now,
        })

        const weekTasks = engineTasks
          .filter(t => (t.weekId === week.id) || (t.weekId === undefined && t.phaseId === phase.id))
          .sort((a, b) => (a.sessionOrder ?? 0) - (b.sessionOrder ?? 0))

        const datesWithTasks = new Set(weekTasks.map(t => t.date?.slice(0, 10)))
        const sortedDates = Array.from(datesWithTasks).sort()

        for (let di = 0; di < sortedDates.length; di++) {
          const dayDate = sortedDates[di]
          await planRepo.saveDay({
            id: generateId(),
            weekId,
            date: dayDate,
            dayNumber: di + 1,
            createdAt: now,
          })
        }
      }
    }

    const taskCount = await persistPlanTasks(engineTasks, planId)

    return { planId, taskCount }
  } catch {
    return null
  }
}

export async function completeOnboardingUseCase(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingOutput> {
  persistCanonicalSettings(input)

  const planResult = await generateAndPersistPlan(input)

  return {
    success: true,
    planId: planResult?.planId ?? null,
    tasksCreated: planResult?.taskCount ?? 0,
    isComplete: true,
  }
}
