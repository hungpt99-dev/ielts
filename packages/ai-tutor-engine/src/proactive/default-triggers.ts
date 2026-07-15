import type { TriggerHandler } from './trigger-registry'

export function createDefaultTriggers(): TriggerHandler[] {
  return [
    vocabularyReviewTrigger(),
    mistakeReviewTrigger(),
    inactivityTrigger(),
    examCountdownTrigger(),
    streakTrigger(),
    missedTaskTrigger(),
  ]
}

function vocabularyReviewTrigger(): TriggerHandler {
  return {
    triggerType: 'vocabulary_review_due',
    evaluate(params): { shouldTrigger: boolean; score: number } {
      const count = params.dueVocabularyCount ?? 0
      return {
        shouldTrigger: count > 0,
        score: Math.min(count / 20, 1),
      }
    },
  }
}

function mistakeReviewTrigger(): TriggerHandler {
  return {
    triggerType: 'due_review_not_completed',
    evaluate(params): { shouldTrigger: boolean; score: number } {
      const count = params.unreviewedMistakes ?? 0
      return {
        shouldTrigger: count > 0,
        score: 0.5,
      }
    },
  }
}

function inactivityTrigger(): TriggerHandler {
  return {
    triggerType: 'long_inactivity',
    evaluate(params): { shouldTrigger: boolean; score: number } {
      const days = params.inactiveDays ?? 0
      return {
        shouldTrigger: days >= 2,
        score: Math.min(days / 14, 1),
      }
    },
  }
}

function examCountdownTrigger(): TriggerHandler {
  return {
    triggerType: 'exam_approaching',
    evaluate(params): { shouldTrigger: boolean; score: number } {
      const days = params.examDaysRemaining
      if (days === null || days === undefined || days > 30) {
        return { shouldTrigger: false, score: 0 }
      }
      return {
        shouldTrigger: true,
        score: days <= 7 ? 1 : 0.6,
      }
    },
  }
}

function streakTrigger(): TriggerHandler {
  return {
    triggerType: 'study_streak_achieved',
    evaluate(params): { shouldTrigger: boolean; score: number } {
      const streak = params.streak ?? 0
      return {
        shouldTrigger: streak > 0 && streak % 7 === 0,
        score: 0.3,
      }
    },
  }
}

function missedTaskTrigger(): TriggerHandler {
  return {
    triggerType: 'missed_scheduled_task',
    evaluate(params): { shouldTrigger: boolean; score: number } {
      const missed = params.missedTasks ?? 0
      return {
        shouldTrigger: missed > 0,
        score: 0.4,
      }
    },
  }
}
