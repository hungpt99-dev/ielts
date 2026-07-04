import { callAI } from '@ielts/ai'
import type { ProviderConfig, AICallResult } from '@ielts/ai'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import type { AppSettings, TaskCategory } from '../../models'
import { loadAppSettings } from '../../services/storage/SettingsStorage'
import {
  buildScheduleSystemPrompt,
  buildScheduleUserPrompt,
} from './aiPlannerPrompts'
import type { AiScheduleInput } from './aiPlannerPrompts'

export interface AiScheduleDay {
  date: string
  items: AiScheduleTask[]
}

export interface AiScheduleTask {
  category: TaskCategory
  title: string
  minutes: number
}

export interface AiPhase {
  name: string
  description: string
  targetBandRange: string
  weeks: AiPhaseWeek[]
}

export interface AiPhaseWeek {
  weekNumber: number
  focus: string
  goal: string
  days: AiScheduleDay[]
}

export interface AiScheduleResponse {
  phases: AiPhase[]
}

export interface AiScheduleResult {
  days: AiScheduleDay[]
  phases: AiPhase[]
  usedAi: boolean
  error: string | null
}

export interface ScheduleGenerationParams {
  replaceExisting?: boolean
}

const VALID_CATEGORIES: Set<string> = new Set<TaskCategory>([
  'Vocabulary', 'Reading', 'Listening',
  'Writing Task 1', 'Writing Task 2',
  'Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3',
  'Grammar', 'Mock Test',
])

const FALLBACK_CATEGORIES: TaskCategory[] = [
  'Vocabulary', 'Reading', 'Listening', 'Writing Task 2', 'Grammar',
]

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

function parseScheduleJson(content: string): AiScheduleResponse | null {
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

    return parsed as AiScheduleResponse
  } catch {
    return null
  }
}

function flattenPhasesToDays(response: AiScheduleResponse): AiScheduleDay[] {
  const seen = new Set<string>()
  const days: AiScheduleDay[] = []
  for (const phase of response.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        if (!seen.has(day.date)) {
          seen.add(day.date)
          days.push(day)
        }
      }
    }
  }
  return days
}

function buildScheduleInput(settings: AppSettings): AiScheduleInput {
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
  }
}

function generateFallbackSchedule(settings: AppSettings): AiScheduleDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDays = 90
  const endDate = settings.examDate
    ? new Date(settings.examDate.slice(0, 10) + 'T00:00:00')
    : new Date(today.getTime() + maxDays * 24 * 60 * 60 * 1000)
  if (endDate <= today) endDate.setMonth(endDate.getMonth() + 3)

  const days: AiScheduleDay[] = []
  const current = new Date(today)
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const availableSet = new Set(
    settings.preferredSchedule.length > 0
      ? settings.preferredSchedule
      : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  )
  const weakSet = new Set(
    settings.weakSkills.length > 0
      ? settings.weakSkills.map(s => s.toLowerCase())
      : [],
  )
  const topic = settings.preferredTopics[0] || 'IELTS'

  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10)
    const dayName = dayNames[current.getDay()]
    const isAvailable = availableSet.has(dayName)

    if (isAvailable) {
      const items: AiScheduleTask[] = [
        {
          category: 'Vocabulary',
          title: `Learn new vocabulary words on ${topic}`,
          minutes: 15,
        },
        {
          category: 'Vocabulary',
          title: 'Review vocabulary due today',
          minutes: 10,
        },
      ]

      if (weakSet.has('reading') || items.length < 4) {
        items.push({
          category: 'Reading',
          title: `Read IELTS passage on ${topic}`,
          minutes: 30,
        })
      }
      if (weakSet.has('listening') || items.length < 4) {
        items.push({
          category: 'Listening',
          title: 'Complete a listening section exercise',
          minutes: 25,
        })
      }
      if (weakSet.has('writing') || weakSet.has('grammar') || items.length < 4) {
        items.push({
          category: 'Writing Task 2',
          title: `Write a Task 2 essay on ${topic}`,
          minutes: 30,
        })
      }
      if (weakSet.has('speaking') || items.length < 3) {
        items.push({
          category: 'Speaking Part 2',
          title: 'Practice a cue card topic',
          minutes: 15,
        })
      }

      items.push({
        category: 'Grammar',
        title: 'Review grammar rules and exercises',
        minutes: 15,
      })

      const totalMinutes = items.reduce((s, i) => s + i.minutes, 0)
      const maxMin = settings.dailyStudyMinutes || 60
      if (totalMinutes > maxMin) {
        while (items.reduce((s, i) => s + i.minutes, 0) > maxMin && items.length > 2) {
          items.pop()
        }
      }

      days.push({ date: dateStr, items })
    } else {
      days.push({ date: dateStr, items: [] })
    }

    current.setDate(current.getDate() + 1)
  }

  return days
}

export async function generateAISchedule(
  params?: ScheduleGenerationParams,
): Promise<AiScheduleResult> {
  try {
    const settings = loadAppSettings()
    const config = getAiConfig(settings)

    if (!config) {
      const fallbackDays = generateFallbackSchedule(settings)
      return {
        days: fallbackDays,
        phases: [],
        usedAi: false,
        error: 'AI not configured. Using basic schedule.',
      }
    }

    const input = buildScheduleInput(settings)
    const systemPrompt = buildScheduleSystemPrompt()
    const userPrompt = buildScheduleUserPrompt(input)

    const result: AICallResult = await callAI(
      systemPrompt,
      userPrompt,
      () => config,
      { temperature: 0.7, maxTokens: 4096 },
    )

    if (result.error || !result.content) {
      const fallbackDays = generateFallbackSchedule(settings)
      return {
        days: fallbackDays,
        phases: [],
        usedAi: false,
        error: result.error ?? 'AI returned empty response. Using basic schedule.',
      }
    }

    const parsed = parseScheduleJson(result.content)
    if (!parsed || parsed.phases.length === 0) {
      const fallbackDays = generateFallbackSchedule(settings)
      return {
        days: fallbackDays,
        phases: [],
        usedAi: true,
        error: 'Failed to parse AI response. Using basic schedule.',
      }
    }

    const days = flattenPhasesToDays(parsed)

    return {
      days,
      phases: parsed.phases,
      usedAi: true,
      error: null,
    }
  } catch (err) {
    const settings = loadAppSettings()
    const fallbackDays = generateFallbackSchedule(settings)
    return {
      days: fallbackDays,
      phases: [],
      usedAi: false,
      error: err instanceof Error ? err.message : 'Unknown error generating AI schedule.',
    }
  }
}
