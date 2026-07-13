export interface TriggerPolicyResult {
  shouldTrigger: boolean
  score: number
  reason?: string
}

export interface TriggerEvaluationParams {
  inactiveDays: number
  missedTasks: number
  streak: number
  examDaysRemaining: number | null
  dueVocabularyCount: number
  unreviewedMistakes: number
  weeklyTasksCompleted: number
  weeklyTasksTotal: number
  skillDeclines: string[]
  skillImprovements: string[]
  recentAccuracy: number | null
}
