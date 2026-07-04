import { callAI } from '@ielts/ai'
import type { ProviderConfig, AICallResult } from '@ielts/ai'
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

export interface AiScheduleResult {
  days: AiScheduleDay[]
  usedAi: boolean
  error: string | null
}

const VALID_CATEGORIES: Set<string> = new Set<TaskCategory>([
  'Vocabulary', 'Reading', 'Listening',
  'Writing Task 1', 'Writing Task 2',
  'Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3',
  'Grammar', 'Mock Test',
])

function getAiConfig(settings: AppSettings): ProviderConfig | null {
  if (!settings.aiApiKey || !settings.aiEnabled) return null
  return {
    apiKey: settings.aiApiKey,
    baseUrl: settings.aiEndpoint || 'https://api.openai.com/v1',
    model: settings.aiModel || 'gpt-4o-mini',
  }
}

function parseScheduleJson(content: string): AiScheduleDay[] | null {
  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed)) return null
    for (const day of parsed) {
      if (!day.date || !Array.isArray(day.items)) return null
      for (const item of day.items) {
        if (!item.category || !item.title || typeof item.minutes !== 'number') return null
        if (!VALID_CATEGORIES.has(item.category)) return null
      }
    }
    return parsed as AiScheduleDay[]
  } catch {
    return null
  }
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
  const daysToGenerate = Math.max(1, Math.min(examDays, maxDays))

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

export async function generateAISchedule(): Promise<AiScheduleResult> {
  try {
    const settings = loadAppSettings()
    const config = getAiConfig(settings)

    if (!config) {
      return {
        days: [],
        usedAi: false,
        error: 'AI not configured. Enable AI in Settings to use smart scheduling.',
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
      return {
        days: [],
        usedAi: true,
        error: result.error ?? 'AI returned empty response.',
      }
    }

    const parsed = parseScheduleJson(result.content)
    if (!parsed) {
      return {
        days: [],
        usedAi: true,
        error: 'Failed to parse AI response. The response was not valid JSON.',
      }
    }

    return {
      days: parsed,
      usedAi: true,
      error: null,
    }
  } catch (err) {
    return {
      days: [],
      usedAi: true,
      error: err instanceof Error ? err.message : 'Unknown error generating AI schedule.',
    }
  }
}
