import type { ProactiveTriggerType } from '../entities/proactive-message'

export interface TriggerPolicyResult {
  shouldTrigger: boolean
  score: number
  reason?: string
}

export interface TriggerPolicy {
  triggerType: ProactiveTriggerType
  evaluate(params: TriggerEvaluationParams): TriggerPolicyResult
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

export function createDefaultTriggerPolicies(): TriggerPolicy[] {
  return [
    createInactivityPolicy(),
    createMissedTaskPolicy(),
    createExamCountdownPolicy(),
    createVocabularyReviewPolicy(),
    createMistakeReviewPolicy(),
    createStreakPolicy(),
  ]
}

function createInactivityPolicy(): TriggerPolicy {
  return {
    triggerType: 'long_inactivity',
    evaluate(params) {
      if (params.inactiveDays >= 7) return { shouldTrigger: true, score: 0.9, reason: `${params.inactiveDays} days inactive` }
      if (params.inactiveDays >= 3) return { shouldTrigger: true, score: 0.6, reason: `${params.inactiveDays} days inactive` }
      return { shouldTrigger: false, score: 0 }
    },
  }
}

function createMissedTaskPolicy(): TriggerPolicy {
  return {
    triggerType: 'multiple_missed_tasks',
    evaluate(params) {
      if (params.missedTasks >= 3) return { shouldTrigger: true, score: 0.8, reason: `${params.missedTasks} missed tasks` }
      return { shouldTrigger: false, score: 0 }
    },
  }
}

function createExamCountdownPolicy(): TriggerPolicy {
  return {
    triggerType: 'exam_approaching',
    evaluate(params) {
      if (params.examDaysRemaining === null) return { shouldTrigger: false, score: 0 }
      if (params.examDaysRemaining <= 7) return { shouldTrigger: true, score: 1.0, reason: `${params.examDaysRemaining} days until exam` }
      if (params.examDaysRemaining <= 30) return { shouldTrigger: true, score: 0.7, reason: `${params.examDaysRemaining} days until exam` }
      return { shouldTrigger: false, score: 0 }
    },
  }
}

function createVocabularyReviewPolicy(): TriggerPolicy {
  return {
    triggerType: 'vocabulary_review_due',
    evaluate(params) {
      if (params.dueVocabularyCount >= 20) return { shouldTrigger: true, score: 0.7 }
      if (params.dueVocabularyCount >= 10) return { shouldTrigger: true, score: 0.5 }
      return { shouldTrigger: false, score: 0 }
    },
  }
}

function createMistakeReviewPolicy(): TriggerPolicy {
  return {
    triggerType: 'due_review_not_completed',
    evaluate(params) {
      if (params.unreviewedMistakes >= 10) return { shouldTrigger: true, score: 0.6 }
      return { shouldTrigger: false, score: 0 }
    },
  }
}

function createStreakPolicy(): TriggerPolicy {
  return {
    triggerType: 'study_streak_achieved',
    evaluate(params) {
      if (params.streak > 0 && params.streak % 7 === 0) return { shouldTrigger: true, score: 0.5, reason: `${params.streak}-day streak!` }
      return { shouldTrigger: false, score: 0 }
    },
  }
}
