import { callAI } from '@ielts/ai'
import type { ProviderConfig, AICallResult } from '@ielts/ai'
import type {
  StudyPlanUserProfile,
  StudyPlanCalculatedMeta,
  GlobalStudyStrategy,
  PlanPhaseName,
} from '../types'

const VALID_PHASE_NAMES: PlanPhaseName[] = [
  'Foundation',
  'Skill Improvement',
  'Weakness Fixing',
  'Mock Test',
  'Final Review',
]

export function buildGlobalStrategyPrompt(
  profile: StudyPlanUserProfile,
  calculatedMeta: StudyPlanCalculatedMeta,
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt =
    'You are an expert IELTS study plan strategist. Create a high-level global study strategy based on the user profile. Respond with valid JSON only. No other text.'

  const userPrompt = `Create a comprehensive IELTS study strategy.

## User Profile
- Current Band: ${profile.currentBand}
- Target Band: ${profile.targetBand}
- Exam Date: ${profile.examDate}
- Daily Study Minutes: ${profile.dailyStudyMinutes}
- Goal: ${profile.studyGoal}
- Study Days: ${profile.preferredStudyDays.join(', ')}
- Rest Days: ${profile.restDays.join(', ')}
- Weak Skills: ${profile.weakSkills.join(', ')}
- Strong Skills: ${profile.strongSkills.join(', ')}
- Main Focus: ${profile.mainFocusSkills.join(', ')}
- Intensity: ${profile.studyIntensity}
- Language: ${profile.preferredLanguage}
- Mock Tests: ${profile.includeMockTests}
- Vocabulary Review: ${profile.includeVocabularyReview}
- Grammar Review: ${profile.includeGrammarReview}
- Weekly Review: ${profile.includeWeeklyProgressReview}
- Final Week: ${profile.includeFinalExamPreparationWeek}
- Topics: ${profile.preferredTopics.join(', ')}

## Plan Metrics
- Start: ${calculatedMeta.today}
- Total Days: ${calculatedMeta.totalDays}
- Study Days: ${calculatedMeta.studyDays}
- Rest Days: ${calculatedMeta.restDaysCount}
- Weeks: ${calculatedMeta.totalWeeks}
- Final Review Days: ${calculatedMeta.finalReviewPeriodDays}
- Skill Priority: ${calculatedMeta.skillPriority.join(', ')}

## Phase Distribution
${calculatedMeta.totalDays <= 7 ? 'Short plan: use Skill Improvement + Final Review only.' : ''}
${calculatedMeta.totalDays > 7 && calculatedMeta.totalDays <= 14 ? 'Medium plan: Foundation (brief), Skill Improvement, Mock Test/Final Review.' : ''}
${calculatedMeta.totalDays > 14 && calculatedMeta.totalDays <= 30 ? 'Standard plan: Foundation, Skill Improvement, Weakness Fixing, Mock Test, Final Review.' : ''}
${calculatedMeta.totalDays > 30 ? 'Long plan: all phases with appropriate durations.' : ''}

Respond with JSON only:
{
  "planSummary": "2-3 sentence strategy overview",
  "phaseBreakdown": [
    {
      "phaseName": "Foundation",
      "description": "Phase description",
      "startDate": "${calculatedMeta.today}",
      "endDate": "YYYY-MM-DD",
      "weekCount": 2,
      "mainFocus": "Main focus area",
      "targetSkill": "Reading",
      "weeklyGoals": [
        {
          "weekNumber": 1,
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD",
          "focusArea": "Focus",
          "goal": "Specific goal",
          "keyActivities": ["Activity 1"],
          "mockTestPlanned": false
        }
      ]
    }
  ],
  "weeklyGoals": [
    {
      "weekNumber": 1,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "focusArea": "Focus",
      "goal": "Specific goal",
      "keyActivities": ["Activity 1"],
      "mockTestPlanned": false
    }
  ],
  "mockTestSchedule": [
    {
      "weekNumber": 3,
      "date": "YYYY-MM-DD",
      "focus": "Full Mock Test"
    }
  ],
  "finalWeekStrategy": "Strategy for the final week",
  "adjustmentRules": ["Rule 1", "Rule 2"]
}`

  return { systemPrompt, userPrompt }
}

function parseGlobalStrategy(content: string): GlobalStudyStrategy | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0])

    if (typeof parsed.planSummary !== 'string' || parsed.planSummary.length < 10) return null
    if (!Array.isArray(parsed.phaseBreakdown) || parsed.phaseBreakdown.length === 0) return null
    if (!Array.isArray(parsed.weeklyGoals) || parsed.weeklyGoals.length === 0) return null
    if (!Array.isArray(parsed.mockTestSchedule)) return null
    if (typeof parsed.finalWeekStrategy !== 'string' || parsed.finalWeekStrategy.length < 10) return null
    if (!Array.isArray(parsed.adjustmentRules) || parsed.adjustmentRules.length === 0) return null

    for (const phase of parsed.phaseBreakdown) {
      if (!VALID_PHASE_NAMES.includes(phase.phaseName)) return null
      if (typeof phase.description !== 'string' || phase.description.length < 5) return null
      if (typeof phase.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(phase.startDate)) return null
      if (typeof phase.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(phase.endDate)) return null
      if (typeof phase.weekCount !== 'number' || phase.weekCount < 1) return null
      if (typeof phase.mainFocus !== 'string' || phase.mainFocus.length < 5) return null
      if (!['Vocabulary', 'Reading', 'Listening', 'Writing', 'Speaking', 'Grammar', 'all'].includes(phase.targetSkill)) return null
      if (!Array.isArray(phase.weeklyGoals) || phase.weeklyGoals.length === 0) return null

      for (const goal of phase.weeklyGoals) {
        if (typeof goal.weekNumber !== 'number' || goal.weekNumber < 1) return null
        if (typeof goal.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(goal.startDate)) return null
        if (typeof goal.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(goal.endDate)) return null
        if (typeof goal.focusArea !== 'string' || goal.focusArea.length < 3) return null
        if (typeof goal.goal !== 'string' || goal.goal.length < 5) return null
        if (!Array.isArray(goal.keyActivities) || goal.keyActivities.length === 0) return null
        if (typeof goal.mockTestPlanned !== 'boolean') return null
      }
    }

    for (const goal of parsed.weeklyGoals) {
      if (typeof goal.weekNumber !== 'number' || goal.weekNumber < 1) return null
      if (typeof goal.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(goal.startDate)) return null
      if (typeof goal.endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(goal.endDate)) return null
      if (typeof goal.focusArea !== 'string' || goal.focusArea.length < 3) return null
      if (typeof goal.goal !== 'string' || goal.goal.length < 5) return null
      if (!Array.isArray(goal.keyActivities) || goal.keyActivities.length === 0) return null
      if (typeof goal.mockTestPlanned !== 'boolean') return null
    }

    for (const mock of parsed.mockTestSchedule) {
      if (typeof mock.weekNumber !== 'number' || mock.weekNumber < 1) return null
      if (typeof mock.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(mock.date)) return null
      if (typeof mock.focus !== 'string' || mock.focus.length < 3) return null
    }

    for (const rule of parsed.adjustmentRules) {
      if (typeof rule !== 'string' || rule.length < 5) return null
    }

    const strategy: GlobalStudyStrategy = {
      planSummary: parsed.planSummary,
      phaseBreakdown: parsed.phaseBreakdown,
      weeklyGoals: parsed.weeklyGoals,
      mockTestSchedule: parsed.mockTestSchedule,
      finalWeekStrategy: parsed.finalWeekStrategy,
      adjustmentRules: parsed.adjustmentRules,
      createdAt: new Date().toISOString(),
    }

    return strategy
  } catch {
    return null
  }
}

export async function generateGlobalStudyStrategy(
  profile: StudyPlanUserProfile,
  calculatedMeta: StudyPlanCalculatedMeta,
  getConfig: () => ProviderConfig | null,
): Promise<{ data: GlobalStudyStrategy | null; error: string | null }> {
  const config = getConfig()
  if (!config) {
    return { data: null, error: 'AI provider not configured. Please check your API settings.' }
  }

  const { systemPrompt, userPrompt } = buildGlobalStrategyPrompt(profile, calculatedMeta)

  try {
    const result: AICallResult = await callAI(
      systemPrompt,
      userPrompt,
      () => config,
      { temperature: 0.7, maxTokens: 2048 },
    )

    if (result.error) {
      return { data: null, error: result.error }
    }

    if (!result.content) {
      return { data: null, error: 'AI returned empty response.' }
    }

    const strategy = parseGlobalStrategy(result.content)
    if (!strategy) {
      return {
        data: null,
        error: 'AI response could not be parsed. The response did not match the expected format.',
      }
    }

    return { data: strategy, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error generating study strategy.',
    }
  }
}
