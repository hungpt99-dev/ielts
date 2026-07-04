export interface AiScheduleInput {
  targetBand: number
  currentBand: number
  bandGap: number
  dailyMinutes: number
  examDate: string | null
  daysToGenerate: number
  weakSkills: string[]
  preferredTopics: string[]
  studyGoal: 'academic' | 'general'
  preferredSchedule: string[]
  startDate: string
}

export function buildScheduleSystemPrompt(): string {
  return `You are an expert IELTS study planner. Your role is to create personalised daily study schedules that help learners improve their IELTS band score efficiently.

Key principles:
- Design daily tasks that match the learner's current level, target score, and available study time
- Prioritise their weak skill areas while maintaining balanced coverage across all skills
- Suggest realistic, actionable tasks that fit within their daily study budget
- Align tasks with their study goal (academic or general training)
- Vary task types across days to maintain engagement
- Use only the allowed task categories

Your output must be valid JSON following the specified format exactly. Do not include any text outside the JSON array.`
}

export function buildScheduleUserPrompt(input: AiScheduleInput): string {
  return `Generate a personalised daily IELTS study schedule.

## Learner Profile
- Target Band: ${input.targetBand}
- Current Band: ${input.currentBand}
- Band Gap: ${input.bandGap} bands
- Study Goal: ${input.studyGoal === 'academic' ? 'Academic' : 'General Training'}
- Daily Study Time: ${input.dailyMinutes} minutes${input.examDate ? `\n- Exam Date: ${input.examDate}` : '\n- Exam Date: Not set (design a long-term plan)'}
- Days to schedule: ${input.daysToGenerate} days starting from ${input.startDate}
- Weak Areas (prioritise these): ${input.weakSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
- Preferred Topics: ${input.preferredTopics.length > 0 ? input.preferredTopics.join(', ') : 'Any IELTS topics'}
- Available Study Days: ${input.preferredSchedule.length === 7 ? 'All days' : input.preferredSchedule.join(', ')}

## Allowed Task Categories
Vocabulary, Reading, Listening, Writing Task 1, Writing Task 2, Speaking Part 1, Speaking Part 2, Speaking Part 3, Grammar, Mock Test

## Requirements
1. Generate exactly ${input.daysToGenerate} consecutive days of tasks starting from ${input.startDate}
2. For each day, provide a list of tasks. Total minutes across all tasks on a day must not exceed ${input.dailyMinutes}
3. Only assign tasks on days matching the learner's available study days
4. If a day is not an available study day, set items to an empty array
5. On available study days, include 2-4 tasks covering different skill areas
6. Weight weak areas more heavily across the week
7. Include varied task types — exercises, practice tests, review, and self-study
8. ${input.studyGoal === 'academic' ? 'Use Academic IELTS task types' : 'Use General Training IELTS task types'}
9. Make task titles specific and actionable (e.g. "Read IELTS passage on Education" not just "Reading practice")
10. Category must be exactly one of the allowed categories listed above

Respond with a JSON array only. No markdown, no explanation.

Format:
[
  {
    "date": "YYYY-MM-DD",
    "items": [
      {
        "category": "Reading",
        "title": "Specific task title",
        "minutes": 30
      }
    ]
  }
]`
}
