import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import { callAI } from '@ielts/ai'
import type { ProviderConfig, AICallResult } from '@ielts/ai'
import type { AppSettings } from '../../models'
import {
  extractAiPlanInput,
  enrichWithLearningData,
  buildPlanSystemPrompt,
  buildPlanUserPrompt,
} from './aiPlanPrompts'
import type { AiPlanInput, AiRoadmapPhase, AiRoadmapDay, AiRoadmapResult } from './aiPlanPrompts'
import {
  generateRoadmap,
  saveRoadmap,
} from './roadmapService'
import type { RoadmapData, RoadmapPhase, RoadmapWeek, RoadmapDay } from './roadmapService'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function getWeekDates(startDate: Date, weekIndex: number): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  start.setDate(start.getDate() + weekIndex * 7)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export interface AiRoadmapGenerationResult {
  roadmap: RoadmapData | null
  usedAi: boolean
  error: string | null
  rawResponse: string | null
}

export interface LearningExtras {
  studyStreak?: number
  lastStudyDate?: string | null
  completedTaskCount?: number
  recentMockBands?: number[]
  weakSkillAccuracy?: Record<string, number>
}

function getAiConfig(settings: AppSettings): ProviderConfig | null {
  if (!settings.aiApiKey || !settings.aiEnabled) return null
  return {
    apiKey: settings.aiApiKey,
    baseUrl: settings.aiEndpoint || OPENAI_BASE_URL,
    model: settings.aiModel || DEFAULT_MODEL,
  }
}

function tryParseAiResponse(content: string): AiRoadmapResult | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.phases || !Array.isArray(parsed.phases)) return null
    return parsed as AiRoadmapResult
  } catch {
    return null
  }
}

function aiDayToRoadmapDay(
  aiDay: AiRoadmapDay,
  dateStr: string,
): RoadmapDay {
  return {
    id: generateId(),
    date: dateStr,
    dayNumber: aiDay.dayNumber,
    skillFocus: aiDay.skillFocus,
    taskId: null,
    isComplete: false,
    objective: aiDay.objective,
  }
}

function aiPhaseToRoadmapPhase(
  aiPhase: AiRoadmapPhase,
  startDate: Date,
  phaseOffset: number,
): RoadmapPhase {
  const weeks: RoadmapWeek[] = []
  let weekOffset = 0

  for (const aiWeek of aiPhase.weeks) {
    const dates = getWeekDates(startDate, phaseOffset + weekOffset)
    const days: RoadmapDay[] = aiWeek.days.map((aiDay, i) =>
      aiDayToRoadmapDay(aiDay, dates[i] ?? dates[dates.length - 1]),
    )

    const completedTasks = days.filter(d => d.isComplete).length
    weeks.push({
      id: generateId(),
      weekNumber: phaseOffset + weekOffset + 1,
      label: `Week ${phaseOffset + weekOffset + 1}`,
      focus: aiWeek.focus,
      goal: aiWeek.goal,
      days,
      isComplete: days.every(d => d.isComplete),
      completedTasks,
      totalTasks: days.length,
    })
    weekOffset++
  }

  const phaseCompleted = weeks.every(w => w.isComplete)
  const phaseDone = weeks.reduce((s, w) => s + w.completedTasks, 0)
  const phaseTotal = weeks.reduce((s, w) => s + w.totalTasks, 0)

  return {
    id: generateId(),
    name: aiPhase.name,
    description: aiPhase.description,
    order: aiPhase.order,
    targetRange: aiPhase.targetRange,
    weeks,
    isComplete: phaseCompleted,
    completedTasks: phaseDone,
    totalTasks: phaseTotal,
  }
}

function aiRoadmapResultToRoadmapData(result: AiRoadmapResult): RoadmapData {
  const today = new Date()
  const phases: RoadmapPhase[] = []
  let phaseOffset = 0

  for (const aiPhase of result.phases) {
    phases.push(aiPhaseToRoadmapPhase(aiPhase, today, phaseOffset))
    phaseOffset += aiPhase.weeks.length
  }

  const totalTasks = phases.reduce((s, p) => s + p.totalTasks, 0)
  const completedTasks = phases.reduce((s, p) => s + p.completedTasks, 0)
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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

  const now = new Date().toISOString()
  return {
    phases,
    currentPhaseIndex,
    currentWeekIndex,
    overallProgress,
    totalTasks,
    completedTasks,
    generatedAt: now,
    updatedAt: now,
  }
}

export async function generatePlanWithAI(
  settings: AppSettings,
  extras?: LearningExtras,
): Promise<AiRoadmapGenerationResult> {
  try {
    const config = getAiConfig(settings)
    if (!config) {
      const roadmap = generateFallbackRoadmap(settings)
      return {
        roadmap,
        usedAi: false,
        error: 'AI not configured. Using template-based roadmap.',
        rawResponse: null,
      }
    }

    let input: AiPlanInput = extractAiPlanInput(settings)

    if (extras) {
      input = enrichWithLearningData(input, {
        studyStreak: extras.studyStreak ?? 0,
        lastStudyDate: extras.lastStudyDate ?? null,
        completedTaskCount: extras.completedTaskCount,
        recentMockBands: extras.recentMockBands,
        weakSkillAccuracy: extras.weakSkillAccuracy,
      })
    }

    const systemPrompt = buildPlanSystemPrompt()
    const userPrompt = buildPlanUserPrompt(input)

    const result: AICallResult = await callAI(
      systemPrompt,
      userPrompt,
      () => config,
      { temperature: 0.7, maxTokens: 4096 },
    )

    if (result.error || !result.content) {
      const roadmap = generateFallbackRoadmap(settings)
      return {
        roadmap,
        usedAi: false,
        error: result.error ?? 'AI returned empty response. Using fallback roadmap.',
        rawResponse: result.content,
      }
    }

    const parsed = tryParseAiResponse(result.content)
    if (!parsed) {
      const roadmap = generateFallbackRoadmap(settings)
      return {
        roadmap,
        usedAi: true,
        error: 'Failed to parse AI response. Using fallback roadmap.',
        rawResponse: result.content,
      }
    }

    const roadmap = aiRoadmapResultToRoadmapData(parsed)
    saveRoadmap(roadmap)

    return {
      roadmap,
      usedAi: true,
      error: null,
      rawResponse: result.content,
    }
  } catch (err) {
    const roadmap = generateFallbackRoadmap(settings)
    return {
      roadmap,
      usedAi: false,
      error: err instanceof Error ? err.message : 'Unknown error generating AI roadmap.',
      rawResponse: null,
    }
  }
}

function generateFallbackRoadmap(settings: AppSettings): RoadmapData {
  return generateRoadmap(settings, [])
}
