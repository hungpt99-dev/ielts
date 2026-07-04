import type { AppSettings, StudyGoal } from '../../models'

export interface AiPlanInput {
  targetBand: number
  currentBand: number
  bandGap: number
  examDate: string | null
  examCountdownDays: number | null
  dailyStudyMinutes: number
  weakSkills: string[]
  preferredTopics: string[]
  studyGoal: StudyGoal
  preferredSchedule: string[]
  studyStreak: number
  lastStudyDate: string | null
}

export interface AiRoadmapPhase {
  name: string
  description: string
  order: number
  targetRange: string
  weeks: AiRoadmapWeek[]
}

export interface AiRoadmapWeek {
  weekNumber: number
  label: string
  focus: string
  goal: string
  days: AiRoadmapDay[]
}

export interface AiRoadmapDay {
  dayNumber: number
  skillFocus: string
  objective: string
  task: {
    title: string
    description: string
    estimatedMinutes: number
  }
}

export interface AiRoadmapResult {
  phases: AiRoadmapPhase[]
}

export function extractAiPlanInput(settings: AppSettings): AiPlanInput {
  const examDate = settings.examDate || null
  const examCountdownDays = examDate
    ? calculateExamCountdown(examDate)
    : null

  return {
    targetBand: settings.targetBand,
    currentBand: settings.currentBand,
    bandGap: Math.max(0, settings.targetBand - settings.currentBand),
    examDate,
    examCountdownDays,
    dailyStudyMinutes: settings.dailyStudyMinutes,
    weakSkills: settings.weakSkills.length > 0
      ? settings.weakSkills
      : ['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar'],
    preferredTopics: settings.preferredTopics,
    studyGoal: settings.studyGoal,
    preferredSchedule: settings.preferredSchedule,
    studyStreak: 0,
    lastStudyDate: null,
  }
}

export function enrichWithLearningData(
  input: AiPlanInput,
  extras: {
    studyStreak: number
    lastStudyDate: string | null
    completedTaskCount?: number
    recentMockBands?: number[]
    weakSkillAccuracy?: Record<string, number>
  },
): AiPlanInput {
  return {
    ...input,
    studyStreak: extras.studyStreak,
    lastStudyDate: extras.lastStudyDate,
  }
}

function calculateExamCountdown(examDate: string): number {
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  if (isNaN(exam.getTime())) return 0
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diff = exam.getTime() - today.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function buildPlanSystemPrompt(): string {
  return `You are an expert IELTS study plan advisor. Your role is to create personalized, structured study roadmaps that help learners improve their IELTS band score efficiently.

Key principles:
- Design the roadmap to match the learner's current level, target score, and available study time
- Prioritize their weak skill areas while maintaining balanced coverage across all skills
- Adapt the plan duration and intensity based on how far the exam is
- Suggest realistic, actionable daily tasks that fit within their daily study budget
- Align with their study goal (academic or general training)

Your output must be valid JSON following the specified format exactly.`
}

export function buildPlanUserPrompt(input: AiPlanInput): string {
  const timeContext = buildTimeContext(input)
  const skillContext = buildSkillContext(input)
  const preferenceContext = buildPreferenceContext(input)

  return `Create a personalized IELTS study roadmap based on the following learner profile.

## Learner Profile
- Target Band: ${input.targetBand}
- Current Band: ${input.currentBand}
- Band Gap: ${input.bandGap} bands
- Study Goal: ${input.studyGoal === 'academic' ? 'Academic' : 'General Training'}
${timeContext}
${skillContext}
${preferenceContext}

## Requirements

Design a multi-phase roadmap that takes the learner from their current level to their target score. Each phase should have a clear focus and progression. Within each phase, break the work into weekly chunks with specific weekly goals.

For each week, provide 7 days of tasks. Each day must include:
1. A skill focus area (one of: reading, listening, writing, speaking, vocabulary, grammar)
2. A specific, measurable objective
3. A task with a clear title, description, and realistic time estimate in minutes

Guidelines:
- Distribute skill focus across the week, weighting weak areas more heavily
- Total daily task minutes should not exceed ${input.dailyStudyMinutes}
- Vary task types to maintain engagement (exercises, practice tests, review, self-study)
- For Academic goal, include task types relevant to Academic IELTS; for General Training, use GT-appropriate tasks
- If exam date is far away, include more foundation work. If close, focus on test readiness and mock tests

Respond with valid JSON in this exact format:
{
  "phases": [
    {
      "name": "Phase name",
      "description": "Phase description",
      "order": 0,
      "targetRange": "Band X-Y",
      "weeks": [
        {
          "weekNumber": 1,
          "label": "Week 1",
          "focus": "Weekly focus area",
          "goal": "Weekly goal statement",
          "days": [
            {
              "dayNumber": 1,
              "skillFocus": "skill-name",
              "objective": "Specific objective for this day",
              "task": {
                "title": "Task title",
                "description": "Task description with details",
                "estimatedMinutes": 30
              }
            }
          ]
        }
      ]
    }
  ]
}`
}

function buildTimeContext(input: AiPlanInput): string {
  const parts: string[] = [
    `- Daily Study Time: ${input.dailyStudyMinutes} minutes`,
  ]

  if (input.examDate && input.examCountdownDays !== null) {
    parts.push(`- Exam Date: ${input.examDate}`)
    parts.push(`- Days Until Exam: ${input.examCountdownDays}`)
  } else {
    parts.push('- Exam Date: Not set (design a comprehensive long-term plan)')
  }

  if (input.studyStreak > 0) {
    parts.push(`- Current Study Streak: ${input.studyStreak} days`)
  }

  if (input.lastStudyDate) {
    parts.push(`- Last Study Date: ${input.lastStudyDate}`)
  }

  return parts.join('\n')
}

function buildSkillContext(input: AiPlanInput): string {
  const weakList = input.weakSkills.map(s => `    - ${s}`).join('\n')
  return `- Weak Areas (prioritize these):\n${weakList}`
}

function buildPreferenceContext(input: AiPlanInput): string {
  const parts: string[] = []

  if (input.preferredTopics.length > 0) {
    parts.push(`- Preferred Topics: ${input.preferredTopics.join(', ')}`)
  }

  const activeDays = input.preferredSchedule.length
  const allDays = 7
  if (activeDays < allDays) {
    parts.push(`- Available Study Days: ${input.preferredSchedule.join(', ')} (${activeDays} of ${allDays} days)`)
  }

  return parts.join('\n')
}
