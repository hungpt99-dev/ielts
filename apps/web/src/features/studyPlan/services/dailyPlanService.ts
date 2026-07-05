import { callAI } from '@ielts/ai'
import type { ProviderConfig, AICallResult } from '@ielts/ai'
import type {
  DailyPlanItem,
  DailyStudyTask,
  PlanChunkRequest,
  PlanPhaseName,
  StudySkill,
  DayPriority,
  DayDifficulty,
  DailyPlanStatus,
} from '../types'
import type { TaskCategory } from '../../../models'
import {
  validateChunkDays,
  VALID_PHASE_NAMES,
  VALID_PRIORITIES,
  VALID_DIFFICULTIES,
  VALID_SKILLS,
  ALLOWED_CATEGORIES,
} from '../utils/validation'

interface GeneratedTaskInput {
  skill: string
  title: string
  description: string
  estimatedMinutes: number
  category: string
}

interface GeneratedDayInput {
  date: string
  dayNumber: number
  weekNumber: number
  phaseName: string
  mainGoal: string
  listeningTask: GeneratedTaskInput | null
  readingTask: GeneratedTaskInput | null
  writingTask: GeneratedTaskInput | null
  speakingTask: GeneratedTaskInput | null
  vocabularyTask: GeneratedTaskInput | null
  grammarTask: GeneratedTaskInput | null
  reviewTask: GeneratedTaskInput | null
  estimatedTotalMinutes: number
  priority: string
  difficulty: string
  aiTutorNote: string
  completionChecklist: string[]
}

interface GeneratedChunkResponse {
  days: GeneratedDayInput[]
}

export function buildDailyPlanChunkPrompt(
  request: PlanChunkRequest,
): { systemPrompt: string; userPrompt: string } {
  const {
    userProfile,
    calculatedMeta,
    globalStrategy,
    alreadyGeneratedDays,
    chunkStartDate,
    chunkEndDate,
    chunkDayNumbers,
    chunkIndex,
    totalChunks,
    previousChunkSummary,
  } = request

  const systemPrompt = `You are an expert IELTS daily study plan generator. Generate structured daily plans for a specific date range.

Key principles:
- Follow the global study strategy precisely
- Each day must have tasks covering the required skills
- Task categories must match the allowed list exactly
- Total estimated minutes should match the user's daily study time budget
- Progress naturally from previous days
- Vary task types across days to maintain engagement
- Assign appropriate priority and difficulty based on the phase and proximity to exam

Your output must be valid JSON following the specified format exactly. Do not include any text outside the JSON object.`

  const generatedDaysContext =
    alreadyGeneratedDays.length > 0
      ? alreadyGeneratedDays
          .map(d => `  - Day ${d.dayNumber} (${d.date}): ${d.phase} phase`)
          .join('\n')
      : '  - None yet'

  const previousChunkContext = previousChunkSummary
    ? `\n- Previous chunk summary: ${previousChunkSummary}`
    : ''

  const phaseMap = globalStrategy.phaseBreakdown
    .map(p => `  - ${p.phaseName}: ${p.startDate} to ${p.endDate}`)
    .join('\n')

  const mockTestContext =
    globalStrategy.mockTestSchedule.length > 0
      ? globalStrategy.mockTestSchedule
          .map(m => `  - Week ${m.weekNumber}: ${m.date} - ${m.focus}`)
          .join('\n')
      : '  - None'

  const userPrompt = `Generate daily study plans for Day ${chunkDayNumbers[0]} to Day ${chunkDayNumbers[chunkDayNumbers.length - 1]}.

## User Profile
- Current Band: ${userProfile.currentBand}
- Target Band: ${userProfile.targetBand}
- Exam Date: ${userProfile.examDate}
- Daily Study Minutes: ${userProfile.dailyStudyMinutes}
- Goal: ${userProfile.studyGoal}
- Study Days: ${userProfile.preferredStudyDays.join(', ')}
- Weak Skills: ${userProfile.weakSkills.join(', ')}
- Strong Skills: ${userProfile.strongSkills.join(', ')}
- Main Focus: ${userProfile.mainFocusSkills.join(', ')}
- Study Intensity: ${userProfile.studyIntensity}
- Preferred Language: ${userProfile.preferredLanguage}
- Include Mock Tests: ${userProfile.includeMockTests}
- Include Vocabulary Review: ${userProfile.includeVocabularyReview}
- Include Grammar Review: ${userProfile.includeGrammarReview}
- Include Weekly Progress Review: ${userProfile.includeWeeklyProgressReview}

## Plan Metrics
- Start Date: ${calculatedMeta.today}
- Total Days: ${calculatedMeta.totalDays}
- Study Days: ${calculatedMeta.studyDays}
- Total Weeks: ${calculatedMeta.totalWeeks}
- Skill Priority: ${calculatedMeta.skillPriority.join(' > ')}

## Global Strategy
- Summary: ${globalStrategy.planSummary}
- Phases:
${phaseMap}
- Mock Test Schedule:
${mockTestContext}
- Final Week: ${globalStrategy.finalWeekStrategy}
- Adjustment Rules: ${globalStrategy.adjustmentRules.join('; ')}

## Already Generated Days
${generatedDaysContext}

## Current Chunk Request
- Chunk: ${chunkIndex} of ${totalChunks}
- Start Date: ${chunkStartDate}
- End Date: ${chunkEndDate}
- Required Day Numbers: ${chunkDayNumbers.join(', ')}${previousChunkContext}

## Critical Rules
1. Generate EXACTLY and ONLY these day numbers: ${chunkDayNumbers.join(', ')}
2. Each date must be exactly one calendar day after the previous date
3. The date for Day ${chunkDayNumbers[0]} is ${chunkStartDate}
4. Do NOT generate days that are already in the "Already Generated Days" list
5. Do NOT generate days before ${chunkStartDate} or after ${chunkEndDate}
6. Total estimated minutes per day should be close to ${userProfile.dailyStudyMinutes} minutes
7. Use the phase schedule from the global strategy to assign correct phaseName to each day
8. Calculate weekNumber correctly: Day 1 is week 1, Day 8 is week 2, etc.
9. For rest days (${userProfile.restDays.join(', ')}), set tasks to null and estimatedTotalMinutes to 0, priority to "low", difficulty to "easy"

## Allowed Task Categories
${ALLOWED_CATEGORIES.join(', ')}

## Skill to Category Mapping
- Listening skill → Listening category
- Reading skill → Reading category
- Writing skill → Writing Task 1 or Writing Task 2 category
- Speaking skill → Speaking Part 1, Speaking Part 2, or Speaking Part 3 category
- Vocabulary skill → Vocabulary category
- Grammar skill → Grammar category

Respond with a JSON object only. No markdown, no explanation.

Format:
{
  "days": [
    {
      "date": "${chunkStartDate}",
      "dayNumber": ${chunkDayNumbers[0]},
      "weekNumber": 1,
      "phaseName": "Foundation",
      "mainGoal": "Specific daily objective that aligns with the global strategy phase",
      "listeningTask": { "skill": "Listening", "title": "Specific task title", "description": "What the learner should do", "estimatedMinutes": 30, "category": "Listening" },
      "readingTask": null,
      "writingTask": null,
      "speakingTask": null,
      "vocabularyTask": { "skill": "Vocabulary", "title": "Vocabulary task title", "description": "What the learner should do", "estimatedMinutes": 15, "category": "Vocabulary" },
      "grammarTask": null,
      "reviewTask": null,
      "estimatedTotalMinutes": 60,
      "priority": "medium",
      "difficulty": "medium",
      "aiTutorNote": "Brief AI tutor note explaining why these tasks matter today",
      "completionChecklist": ["Checklist item 1", "Checklist item 2"]
    }
  ]
}`

  return { systemPrompt, userPrompt }
}

function parseDailyPlanChunkResponse(
  content: string,
  planId: string,
): { days: DailyPlanItem[]; error: string | null } {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { days: [], error: 'No JSON object found in AI response.' }
  }

  let parsed: GeneratedChunkResponse
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    return { days: [], error: 'AI response could not be parsed as valid JSON.' }
  }

  if (!parsed || !Array.isArray(parsed.days)) {
    return { days: [], error: 'AI response is missing the "days" array.' }
  }

  if (parsed.days.length === 0) {
    return { days: [], error: 'AI returned an empty days array.' }
  }

  const now = new Date().toISOString()
  const days: DailyPlanItem[] = []

  for (const input of parsed.days) {
    if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      return { days: [], error: `Invalid date format: "${input.date}". Expected YYYY-MM-DD.` }
    }

    if (typeof input.dayNumber !== 'number' || input.dayNumber < 1) {
      return {
        days: [],
        error: `Invalid or missing dayNumber for date ${input.date}. Expected a positive number.`,
      }
    }

    if (typeof input.weekNumber !== 'number' || input.weekNumber < 1) {
      return {
        days: [],
        error: `Invalid or missing weekNumber for Day ${input.dayNumber}. Expected a positive number.`,
      }
    }

    if (!VALID_PHASE_NAMES.includes(input.phaseName as PlanPhaseName)) {
      return {
        days: [],
        error: `Invalid phaseName for Day ${input.dayNumber}: "${input.phaseName}". Must be one of: ${VALID_PHASE_NAMES.join(', ')}`,
      }
    }

    if (!input.mainGoal || input.mainGoal.length < 5) {
      return {
        days: [],
        error: `Missing or too short mainGoal for Day ${input.dayNumber}.`,
      }
    }

    if (!VALID_PRIORITIES.includes(input.priority as DayPriority)) {
      return {
        days: [],
        error: `Invalid priority for Day ${input.dayNumber}: "${input.priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}`,
      }
    }

    if (!VALID_DIFFICULTIES.includes(input.difficulty as DayDifficulty)) {
      return {
        days: [],
        error: `Invalid difficulty for Day ${input.dayNumber}: "${input.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      }
    }

    if (typeof input.estimatedTotalMinutes !== 'number' || input.estimatedTotalMinutes < 0) {
      return {
        days: [],
        error: `Invalid estimatedTotalMinutes for Day ${input.dayNumber}: must be a non-negative number.`,
      }
    }

    const dayTasksHaveContent =
      input.listeningTask !== null ||
      input.readingTask !== null ||
      input.writingTask !== null ||
      input.speakingTask !== null ||
      input.vocabularyTask !== null ||
      input.grammarTask !== null ||
      input.reviewTask !== null

    if (input.estimatedTotalMinutes > 0 && !dayTasksHaveContent) {
      return {
        days: [],
        error: `Day ${input.dayNumber} has estimatedTotalMinutes > 0 but no tasks assigned.`,
      }
    }

    const taskFields = [
      'listeningTask',
      'readingTask',
      'writingTask',
      'speakingTask',
      'vocabularyTask',
      'grammarTask',
      'reviewTask',
    ] as const

    for (const field of taskFields) {
      const task = input[field]
      if (task !== null) {
        if (!task.title || task.title.length < 3) {
          return {
            days: [],
            error: `Missing or too short title in ${field} for Day ${input.dayNumber}.`,
          }
        }
        if (!VALID_SKILLS.includes(task.skill as StudySkill)) {
          return {
            days: [],
            error: `Invalid skill "${task.skill}" in ${field} for Day ${input.dayNumber}. Must be one of: ${VALID_SKILLS.join(', ')}`,
          }
        }
        if (typeof task.estimatedMinutes !== 'number' || task.estimatedMinutes < 1) {
          return {
            days: [],
            error: `Invalid estimatedMinutes in ${field} for Day ${input.dayNumber}: must be a positive number.`,
          }
        }
        if (!ALLOWED_CATEGORIES.includes(task.category as TaskCategory)) {
          return {
            days: [],
            error: `Invalid category "${task.category}" in ${field} for Day ${input.dayNumber}. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
          }
        }
      }
    }

    const buildTask = (task: GeneratedTaskInput | null): DailyStudyTask | null => {
      if (!task) return null
      return {
        id: crypto.randomUUID(),
        skill: task.skill as StudySkill,
        title: task.title,
        description: task.description || '',
        estimatedMinutes: task.estimatedMinutes,
        category: task.category as TaskCategory,
        isCompleted: false,
        notes: '',
      }
    }

    days.push({
      id: crypto.randomUUID(),
      planId,
      date: input.date,
      dayNumber: input.dayNumber,
      weekNumber: input.weekNumber,
      phaseName: input.phaseName as PlanPhaseName,
      mainGoal: input.mainGoal,
      listeningTask: buildTask(input.listeningTask),
      readingTask: buildTask(input.readingTask),
      writingTask: buildTask(input.writingTask),
      speakingTask: buildTask(input.speakingTask),
      vocabularyTask: buildTask(input.vocabularyTask),
      grammarTask: buildTask(input.grammarTask),
      reviewTask: buildTask(input.reviewTask),
      optionalTasks: [],
      estimatedTotalMinutes: input.estimatedTotalMinutes,
      priority: input.priority as DayPriority,
      difficulty: input.difficulty as DayDifficulty,
      status: 'not-started' as DailyPlanStatus,
      aiTutorNote: input.aiTutorNote || '',
      completionChecklist: Array.isArray(input.completionChecklist)
        ? input.completionChecklist
        : [],
      createdAt: now,
      updatedAt: now,
    })
  }

  return { days, error: null }
}

export async function generateDailyPlanChunk(
  request: PlanChunkRequest,
  planId: string,
  getConfig: () => ProviderConfig | null,
  options?: { temperature?: number; maxTokens?: number },
): Promise<{ data: DailyPlanItem[] | null; error: string | null }> {
  const config = getConfig()
  if (!config) {
    return {
      data: null,
      error: 'AI provider not configured. Please check your API settings.',
    }
  }

  const { systemPrompt, userPrompt } = buildDailyPlanChunkPrompt(request)

  try {
    const result: AICallResult = await callAI(
      systemPrompt,
      userPrompt,
      () => config,
      {
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 4096,
      },
    )

    if (result.error) {
      return { data: null, error: result.error }
    }

    if (!result.content) {
      return { data: null, error: 'AI returned empty response.' }
    }

    const { days, error: parseError } = parseDailyPlanChunkResponse(
      result.content,
      planId,
    )

    if (parseError) {
      return { data: null, error: parseError }
    }

    const validation = validateChunkDays(days, request)

    if (!validation.isValid) {
      const errorParts: string[] = []

      for (const err of validation.errors) {
        errorParts.push(err.message)
      }
      for (const d of validation.missingDates) {
        errorParts.push(`Missing date: ${d}`)
      }
      for (const d of validation.duplicateDates) {
        errorParts.push(`Duplicate date: ${d}`)
      }

      return {
        data: null,
        error: `Chunk validation failed: ${errorParts.join('; ')}`,
      }
    }

    return { data: days, error: null }
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : 'Unknown error generating daily plan chunk.',
    }
  }
}

interface TaskExplanationInput {
  taskTitle: string
  taskDescription: string
  taskMinutes: number
  taskLabel: string
  dayNumber: number
  date: string
  phaseName: string
  mainGoal: string
  estimatedTotalMinutes: number
}

export async function getTaskExplanation(
  input: TaskExplanationInput,
  getConfig: () => ProviderConfig | null,
): Promise<{ explanation: string; error: string | null }> {
  const config = getConfig()
  if (!config) {
    return { explanation: '', error: 'AI provider not configured. Please check your API settings.' }
  }

  const systemPrompt = `You are an expert IELTS tutor. Explain to a student why a specific study task was recommended for a particular day in their personalized IELTS study plan.

Your explanation must be:
- Concise (2-4 sentences)
- Encouraging and supportive
- Specific to the student's current phase and daily goal
- Focused on how this task builds skills toward their target band score

Respond with a JSON object only. No markdown, no explanation outside the JSON.

{
  "explanation": "Your explanation here"
}`

  const userPrompt = `Explain why this task was recommended:

Task: ${input.taskLabel}
Title: ${input.taskTitle}
Description: ${input.taskDescription}
Estimated minutes: ${input.taskMinutes}

Day context:
- Day ${input.dayNumber} (${input.date})
- Phase: ${input.phaseName}
- Daily goal: ${input.mainGoal}
- Total daily study time: ${input.estimatedTotalMinutes} minutes`

  try {
    const result: AICallResult = await callAI(
      systemPrompt,
      userPrompt,
      () => config,
      { temperature: 0.5, maxTokens: 512 },
    )

    if (result.error) {
      return { explanation: '', error: result.error }
    }

    if (!result.content) {
      return { explanation: '', error: 'AI returned an empty response.' }
    }

    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { explanation: '', error: 'AI response was not valid JSON.' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.explanation || typeof parsed.explanation !== 'string') {
      return { explanation: '', error: 'AI response missing explanation field.' }
    }

    return { explanation: parsed.explanation, error: null }
  } catch (err) {
    return {
      explanation: '',
      error: err instanceof Error ? err.message : 'Unknown error getting task explanation.',
    }
  }
}
