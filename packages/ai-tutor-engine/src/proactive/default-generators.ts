import type { ProactiveInterventionCandidate } from '../domain/entities/proactive-message'
import type { MessageGenerator } from './message-generator-registry'

export function createDefaultGenerators(): MessageGenerator[] {
  return [
    vocabularyReviewGenerator(),
    mistakeReviewGenerator(),
    inactivityGenerator(),
    examCountdownGenerator(),
    streakGenerator(),
    missedTaskGenerator(),
  ]
}

function vocabularyReviewGenerator(): MessageGenerator {
  return {
    triggerType: 'vocabulary_review_due',
    category: 'vocabulary-review',
    generate(state): ProactiveInterventionCandidate | null {
      if (state.vocabularySummary.dueForReview <= 0) return null
      return {
        triggerType: 'vocabulary_review_due',
        category: 'vocabulary-review',
        title: 'Vocabulary Review Due',
        message: `You have ${state.vocabularySummary.dueForReview} vocabulary words waiting for review.`,
        reason: `${state.vocabularySummary.dueForReview} words are due for spaced repetition review`,
        suggestedAction: { type: 'navigate', label: 'Review vocabulary', payload: { path: '/vocabulary' } },
        urgency: Math.min(state.vocabularySummary.dueForReview / 20, 1),
        learningValue: 0.6,
        relevance: 0.7,
        deduplicationKey: `vocabulary-review-${state.vocabularySummary.dueForReview}`,
      }
    },
  }
}

function mistakeReviewGenerator(): MessageGenerator {
  return {
    triggerType: 'due_review_not_completed',
    category: 'mistake-review',
    generate(state): ProactiveInterventionCandidate | null {
      if (state.mistakeSummary.unreviewed <= 0) return null
      return {
        triggerType: 'due_review_not_completed',
        category: 'mistake-review',
        title: 'Mistakes to Review',
        message: `You have ${state.mistakeSummary.unreviewed} unreviewed mistake${state.mistakeSummary.unreviewed === 1 ? '' : 's'}.`,
        reason: 'Reviewing mistakes prevents them from becoming recurring patterns',
        suggestedAction: { type: 'navigate', label: 'Review mistakes', payload: { path: '/mistakes' } },
        urgency: 0.5,
        learningValue: 0.7,
        relevance: 0.6,
        deduplicationKey: `mistake-review-${state.mistakeSummary.unreviewed}`,
      }
    },
  }
}

function inactivityGenerator(): MessageGenerator {
  return {
    triggerType: 'long_inactivity',
    category: 'motivation',
    generate(state): ProactiveInterventionCandidate | null {
      const days = state.progress.inactiveDays
      if (days < 2) return null

      let message: string
      if (days >= 7) {
        message = `It's been ${days} days since your last study session. Let's restart with a short review.`
      } else {
        message = `You haven't studied for ${days} days. A quick session can help maintain your momentum.`
      }

      return {
        triggerType: 'long_inactivity',
        category: 'motivation',
        title: days >= 7 ? 'Welcome Back!' : 'Time to Study',
        message,
        reason: `${days} days since last activity`,
        suggestedAction: { type: 'navigate', label: 'Start learning', payload: { path: '/dashboard' } },
        urgency: Math.min(days / 14, 1),
        learningValue: 0.4,
        relevance: 0.8,
        deduplicationKey: `inactivity-${Math.floor(days / 7)}`,
      }
    },
  }
}

function examCountdownGenerator(): MessageGenerator {
  return {
    triggerType: 'exam_approaching',
    category: 'exam-countdown',
    generate(state): ProactiveInterventionCandidate | null {
      const days = state.exam.daysUntilExam
      if (days === null || days > 30) return null

      let message: string
      if (days <= 7) {
        message = `Your IELTS exam is in ${days} day${days === 1 ? '' : 's'}! Focus on reviewing weak areas and timed practice.`
      } else {
        message = `${days} days until your IELTS exam. Stay consistent with your study plan.`
      }

      return {
        triggerType: 'exam_approaching',
        category: 'exam-countdown',
        title: `Exam Countdown: ${days} Days`,
        message,
        reason: `${days} days remaining until the IELTS exam`,
        suggestedAction: { type: 'navigate', label: 'View exam prep', payload: { path: '/progress' } },
        urgency: days <= 7 ? 1 : 0.6,
        learningValue: 0.8,
        relevance: 1,
        deduplicationKey: `exam-countdown-${Math.ceil(days / 7)}`,
      }
    },
  }
}

function streakGenerator(): MessageGenerator {
  return {
    triggerType: 'study_streak_achieved',
    category: 'motivation',
    generate(state): ProactiveInterventionCandidate | null {
      const streak = state.progress.studyStreak
      if (streak <= 0 || streak % 7 !== 0) return null

      return {
        triggerType: 'study_streak_achieved',
        category: 'motivation',
        title: `🔥 ${streak}-Day Study Streak!`,
        message: `Amazing consistency! You've studied for ${streak} consecutive days. Keep building this momentum!`,
        reason: `${streak} consecutive days of study`,
        urgency: 0.3,
        learningValue: 0.3,
        relevance: 0.5,
        deduplicationKey: `streak-${streak}`,
      }
    },
  }
}

function missedTaskGenerator(): MessageGenerator {
  return {
    triggerType: 'missed_scheduled_task',
    category: 'study-plan',
    generate(state): ProactiveInterventionCandidate | null {
      if (!state.roadmap || state.roadmap.missedTasks <= 0) return null

      return {
        triggerType: 'missed_scheduled_task',
        category: 'study-plan',
        title: 'Missed Tasks',
        message: `You have ${state.roadmap.missedTasks} missed task${state.roadmap.missedTasks === 1 ? '' : 's'}. Would you like to reschedule or proceed with today's plan?`,
        reason: `${state.roadmap.missedTasks} tasks not completed`,
        suggestedAction: { type: 'navigate', label: 'View plan', payload: { path: '/roadmap' } },
        urgency: 0.4,
        learningValue: 0.5,
        relevance: 0.6,
        deduplicationKey: `missed-tasks-${state.roadmap.missedTasks}`,
      }
    },
  }
}
