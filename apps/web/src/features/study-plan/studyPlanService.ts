import { callAI } from '@ielts/ai'
import type { ProviderConfig, AICallResult } from '@ielts/ai'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import type { AppSettings, TaskEntry, TaskCategory, VocabularyEntry, VocabReviewEntry } from '../../models'
import { loadAppSettings } from '../../services/storage/SettingsStorage'
import { DatabaseService } from '../../services/storage/Database'
import {
  buildStudyPlanSystemPrompt,
  buildStudyPlanUserPrompt,
} from './studyPlanPrompts'
import type { StudyPlanInput } from './studyPlanPrompts'

export interface StudyPlanTask {
  category: TaskCategory
  title: string
  minutes: number
}

export interface StudyPlanDay {
  date: string
  skillFocus: string
  objective: string
  items: StudyPlanTask[]
}

export interface StudyPlanWeek {
  weekNumber: number
  focus: string
  goal: string
  days: StudyPlanDay[]
}

export interface StudyPlanPhase {
  name: string
  description: string
  targetBandRange: string
  weeks: StudyPlanWeek[]
}

export interface StudyPlanData {
  phases: StudyPlanPhase[]
  generatedAt: string
}

export interface StudyPlannerState {
  phases: StudyPlanPhase[]
  tasks: TaskEntry[]
  usedAi: boolean
  error: string | null
}

const VALID_CATEGORIES: Set<string> = new Set<TaskCategory>([
  'Vocabulary', 'Reading', 'Listening',
  'Writing Task 1', 'Writing Task 2',
  'Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3',
  'Grammar', 'Mock Test',
])

const PLAN_STORAGE_KEY = 'ielts-study-plan'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function getAiConfig(settings: AppSettings): ProviderConfig | null {
  if (!settings.aiApiKey || !settings.aiEnabled) return null
  return {
    apiKey: settings.aiApiKey,
    baseUrl: settings.aiEndpoint || OPENAI_BASE_URL,
    model: settings.aiModel || DEFAULT_MODEL,
  }
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function calculateStreak(tasks: TaskEntry[]): number {
  const doneDates = tasks
    .filter(t => t.isDone && t.completedAt)
    .map(t => t.completedAt!.slice(0, 10))
    .sort()
  if (doneDates.length === 0) return 0

  const uniqueDates = [...new Set(doneDates)].sort().reverse()
  let streak = 0
  const today = getToday()
  let check = today

  for (const date of uniqueDates) {
    if (date === check) {
      streak++
      const d = new Date(check)
      d.setDate(d.getDate() - 1)
      check = d.toISOString().slice(0, 10)
    } else if (date < check) {
      break
    }
  }
  return streak
}

function calculateCompletionRate(tasks: TaskEntry[]): number {
  const now = getToday()
  const missed = tasks.filter(t => !t.isDone && t.date.slice(0, 10) < now).length
  const done = tasks.filter(t => t.isDone).length
  const total = done + missed
  return total > 0 ? Math.round((done / total) * 100) : 100
}

async function loadEnrichedInput(settings: AppSettings): Promise<StudyPlanInput> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = today.toISOString().slice(0, 10)
  const maxDays = 90
  const examDays = settings.examDate
    ? Math.floor(
        (new Date(settings.examDate.slice(0, 10) + 'T00:00:00').getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : maxDays
  const daysToGenerate = Math.max(7, Math.min(examDays, maxDays))

  const [vocabulary, reviews, tasks] = await Promise.all([
    DatabaseService.getAll<VocabularyEntry>('vocabulary'),
    DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
    DatabaseService.getAll<TaskEntry>('tasks'),
  ])

  const now = getToday()
  const dueReviews = reviews.filter(r => r.nextReviewDate.slice(0, 10) <= now)
  const masteredVocab = vocabulary.filter(v => v.status === 'mastered')
  const streak = calculateStreak(tasks)
  const completionRate = calculateCompletionRate(tasks)

  const sessionAccuracies: number[] = []
  for (const task of tasks) {
    if (task.isDone) sessionAccuracies.push(100)
  }
  const recentAccuracy = sessionAccuracies.length > 0
    ? Math.round(sessionAccuracies.reduce((s, v) => s + v, 0) / sessionAccuracies.length)
    : 100

  return {
    targetBand: settings.targetBand,
    currentBand: settings.currentBand,
    bandGap: Math.max(0, settings.targetBand - settings.currentBand),
    dailyMinutes: settings.dailyStudyMinutes,
    examDate: settings.examDate || null,
    daysToGenerate,
    weakSkills:
      settings.weakSkills.length > 0
        ? settings.weakSkills
        : ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar'],
    preferredTopics: settings.preferredTopics,
    studyGoal: settings.studyGoal,
    preferredSchedule:
      settings.preferredSchedule.length > 0
        ? settings.preferredSchedule
        : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    startDate,
    vocabularyCount: vocabulary.length,
    masteredCount: masteredVocab.length,
    dueReviewCount: dueReviews.length,
    taskCompletionRate: completionRate,
    studyStreak: streak,
    recentAccuracy,
  }
}

function parsePlanResponse(content: string): StudyPlanData | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.phases || !Array.isArray(parsed.phases)) return null

    for (const phase of parsed.phases) {
      if (!phase.name || !Array.isArray(phase.weeks)) return null
      for (const week of phase.weeks) {
        if (!Array.isArray(week.days)) return null
        for (const day of week.days) {
          if (!day.date || !Array.isArray(day.items)) return null
          for (const item of day.items) {
            if (!item.category || !item.title || typeof item.minutes !== 'number') return null
            if (!VALID_CATEGORIES.has(item.category)) return null
          }
        }
      }
    }

    return {
      phases: parsed.phases as StudyPlanPhase[],
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function fallbackSchedule(input: StudyPlanInput): StudyPlanData {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(today.getTime() + input.daysToGenerate * 24 * 60 * 60 * 1000)

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const availableSet = new Set(input.preferredSchedule)
  const topic = input.preferredTopics[0] || 'IELTS'

  const focusVocab = input.vocabularyCount < 50
  const reduceTasks = input.taskCompletionRate < 50

  const days: StudyPlanDay[] = []
  const current = new Date(today)
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10)
    const dayName = dayNames[current.getDay()]

    if (availableSet.has(dayName)) {
      const items: StudyPlanTask[] = []

      if (focusVocab) {
        items.push({ category: 'Vocabulary', title: `Learn new vocabulary on ${topic}`, minutes: 15 })
      }
      items.push({ category: 'Vocabulary', title: 'Review due vocabulary', minutes: 10 })

      if (input.weakSkills.includes('reading') || !reduceTasks) {
        items.push({ category: 'Reading', title: `Read IELTS passage on ${topic}`, minutes: 30 })
      }
      if (input.weakSkills.includes('listening') && !reduceTasks) {
        items.push({ category: 'Listening', title: 'Complete a listening exercise', minutes: 25 })
      }
      if (input.weakSkills.includes('writing') || items.length < 3) {
        items.push({ category: 'Writing Task 2', title: `Write Task 2 essay on ${topic}`, minutes: 30 })
      }
      if (input.weakSkills.includes('speaking') && !reduceTasks) {
        items.push({ category: 'Speaking Part 2', title: 'Practice cue card topic', minutes: 15 })
      }
      items.push({ category: 'Grammar', title: 'Review grammar rules', minutes: 15 })

      const totalMin = items.reduce((s, i) => s + i.minutes, 0)
      if (totalMin > input.dailyMinutes) {
        while (items.reduce((s, i) => s + i.minutes, 0) > input.dailyMinutes && items.length > 2) {
          items.pop()
        }
      }

      days.push({
        date: dateStr,
        skillFocus: 'mixed',
        objective: `Study session (${items.map(i => i.category).join(', ')})`,
        items,
      })
    } else {
      days.push({ date: dateStr, skillFocus: 'rest', objective: 'Rest day', items: [] })
    }
    current.setDate(current.getDate() + 1)
  }

  const phase: StudyPlanPhase = {
    name: 'Study Plan',
    description: 'Personalised IELTS study schedule',
    targetBandRange: `${input.currentBand}-${input.targetBand}`,
    weeks: [],
  }

  for (let w = 0; w < Math.ceil(days.length / 7); w++) {
    const weekDays = days.slice(w * 7, (w + 1) * 7)
    phase.weeks.push({
      weekNumber: w + 1,
      focus: w === 0 ? 'Getting Started' : w < 4 ? 'Building Skills' : w < 8 ? 'Intensive Practice' : 'Test Readiness',
      goal: `Complete ${weekDays.filter(d => d.items.length > 0).length} study days this week`,
      days: weekDays,
    })
  }

  return { phases: [phase], generatedAt: new Date().toISOString() }
}

export async function generateStudyPlan(): Promise<StudyPlannerState> {
  try {
    const settings = loadAppSettings()
    const config = getAiConfig(settings)
    const input = await loadEnrichedInput(settings)

    let planData: StudyPlanData

    if (config) {
      const systemPrompt = buildStudyPlanSystemPrompt()
      const userPrompt = buildStudyPlanUserPrompt(input)

      const result: AICallResult = await callAI(
        systemPrompt,
        userPrompt,
        () => config,
        { temperature: 0.7, maxTokens: 4096 },
      )

      if (result.error || !result.content) {
        planData = fallbackSchedule(input)
      } else {
        const parsed = parsePlanResponse(result.content)
        planData = parsed ?? fallbackSchedule(input)
      }
    } else {
      planData = fallbackSchedule(input)
    }

    savePlan(planData)

    const tasks = await createTasksFromPlan(planData)

    return {
      phases: planData.phases,
      tasks,
      usedAi: !!config,
      error: null,
    }
  } catch (err) {
    const settings = loadAppSettings()
    const input = await loadEnrichedInput(settings)
    const planData = fallbackSchedule(input)
    savePlan(planData)
    const tasks = await createTasksFromPlan(planData)
    return {
      phases: planData.phases,
      tasks,
      usedAi: false,
      error: err instanceof Error ? err.message : 'Failed to generate study plan',
    }
  }
}

export async function createTasksFromPlan(plan: StudyPlanData): Promise<TaskEntry[]> {
  const now = new Date().toISOString()
  const newTasks: TaskEntry[] = []

  for (const phase of plan.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        for (const item of day.items) {
          const task: TaskEntry = {
            id: generateId(),
            title: item.title,
            description: day.objective,
            category: item.category,
            date: day.date + 'T00:00:00.000Z',
            isDone: false,
            isRecurring: false,
            recurringDays: [],
            notes: '',
            timeMinutes: item.minutes,
            createdAt: now,
            updatedAt: now,
            completedAt: null,
          }
          await DatabaseService.add('tasks', task)
          newTasks.push(task)
        }
      }
    }
  }

  return newTasks
}

export function loadPlan(): StudyPlanData | null {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StudyPlanData
  } catch { /* ignore */ }
  return null
}

export function savePlan(plan: StudyPlanData): void {
  try {
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan))
  } catch { /* ignore */ }
}

export function clearPlan(): void {
  try {
    localStorage.removeItem(PLAN_STORAGE_KEY)
  } catch { /* ignore */ }
}
