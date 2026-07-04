export interface StudyPlanInput {
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
  vocabularyCount: number
  masteredCount: number
  dueReviewCount: number
  taskCompletionRate: number
  studyStreak: number
  recentAccuracy: number
}

export function buildStudyPlanSystemPrompt(): string {
  return `You are an expert IELTS study planner. Your role is to create structured, phase-based study plans that help learners improve their IELTS band score efficiently.

Key principles:
- Organise the plan into clear learning phases based on the learner's current level and time to exam
- Within each phase, break work into weekly blocks with a specific weekly focus and goal
- Design daily tasks that match the learner's current level, target score, and available study time
- Prioritise their weak skill areas while maintaining balanced coverage across all skills
- Factor in their existing vocabulary knowledge and study habits
- Suggest realistic, actionable tasks that fit within their daily study budget
- Align tasks with their study goal (academic or general training)
- Vary task types across days to maintain engagement
- Progress from foundational work to more advanced practice over the weeks
- Use only the allowed task categories
- Allocate more vocabulary tasks when the learner has few words saved; shift toward review when they have many
- Recommend more review/mock tests when the learner has low task completion

Your output must be valid JSON following the specified format exactly. Do not include any text outside the JSON object.`
}

export function buildStudyPlanUserPrompt(input: StudyPlanInput): string {
  const weekCount = Math.ceil(input.daysToGenerate / 7)
  const availableDays = input.preferredSchedule.length === 7
    ? 'All days'
    : input.preferredSchedule.join(', ')

  const vocabContext = input.vocabularyCount > 0
    ? `- Vocabulary saved: ${input.vocabularyCount} words (${input.masteredCount} mastered, ${input.dueReviewCount} due for review)`
    : '- Vocabulary: No words saved yet — plan should focus on building vocabulary'

  return `Generate a structured IELTS study plan organised into learning phases with daily tasks.

## Learner Profile
- Target Band: ${input.targetBand}
- Current Band: ${input.currentBand}
- Band Gap: ${input.bandGap} bands
- Study Goal: ${input.studyGoal === 'academic' ? 'Academic' : 'General Training'}
- Daily Study Time: ${input.dailyMinutes} minutes${input.examDate ? `\n- Exam Date: ${input.examDate}` : '\n- Exam Date: Not set (design a long-term plan)'}
- Days to schedule: ${input.daysToGenerate} days (${weekCount} weeks) starting from ${input.startDate}
- Weak Areas (prioritise these): ${input.weakSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
- Preferred Topics: ${input.preferredTopics.length > 0 ? input.preferredTopics.join(', ') : 'Any IELTS topics'}
- Available Study Days: ${availableDays}

## Learning History
${vocabContext}
- Task completion rate: ${input.taskCompletionRate}% of tasks completed on time
- Current study streak: ${input.studyStreak} days
- Recent practice accuracy: ${input.recentAccuracy}%${input.taskCompletionRate < 50 ? '\n- Note: Low task completion — reduce daily task count and focus on consistency' : ''}${input.studyStreak < 3 ? '\n- Note: New or inconsistent learner — keep tasks short and achievable' : ''}

## Allowed Task Categories
Vocabulary, Reading, Listening, Writing Task 1, Writing Task 2, Speaking Part 1, Speaking Part 2, Speaking Part 3, Grammar, Mock Test

## Requirements
1. Organise the schedule into logical learning phases based on the band gap and time available
2. Split the total days into ${weekCount} weeks, grouped into phases
3. For each day, provide a list of tasks; total minutes must not exceed ${input.dailyMinutes}
4. Only assign tasks on days matching the learner's available study days; use empty array for off-days
5. On study days include 2-4 tasks covering different skill areas
6. Weight weak areas more heavily — weaker skills appear more often across the week
7. Progress from foundation → skill-building → intensive practice → mock tests
8. ${input.studyGoal === 'academic' ? 'Use Academic IELTS task types' : 'Use General Training IELTS task types'}
9. Make task titles specific and actionable (e.g. "Read IELTS passage on Education" not just "Reading practice")
10. Category must be exactly one of the allowed categories
11. If vocabulary count is low, include daily vocab-building tasks. If high, focus more on review and application
12. If task completion rate is below 50%, schedule fewer tasks per day to build consistency

Respond with a JSON object only. No markdown, no explanation.

Format:
{
  "phases": [
    {
      "name": "Phase name",
      "description": "What this phase focuses on",
      "targetBandRange": "e.g. 5.5-6.0",
      "weeks": [
        {
          "weekNumber": 1,
          "focus": "Weekly focus area",
          "goal": "Weekly goal",
          "days": [
            {
              "date": "YYYY-MM-DD",
              "skillFocus": "reading",
              "objective": "Specific objective for this day",
              "items": [
                {
                  "category": "Reading",
                  "title": "Specific task title",
                  "minutes": 30
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`
}
