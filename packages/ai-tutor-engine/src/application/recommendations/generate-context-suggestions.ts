import type { LearnerStateSnapshot } from '../../domain/entities/learner-context'

export interface ContextSuggestion {
  title: string
  message: string
  action?: string
  actionLabel: string
}

export function generateContextSuggestions(state: LearnerStateSnapshot): ContextSuggestion[] {
  const suggestions: ContextSuggestion[] = []

  if (state.vocabularySummary.dueForReview > 0) {
    suggestions.push({
      title: 'Words waiting for review',
      message: `You have ${state.vocabularySummary.dueForReview} vocabulary words due for review.`,
      action: 'quiz-me',
      actionLabel: 'Review vocabulary',
    })
  }

  if (state.mistakeSummary.unreviewed > 0) {
    suggestions.push({
      title: 'Mistakes to revisit',
      message: `Review your ${state.mistakeSummary.unreviewed} pending mistake${state.mistakeSummary.unreviewed === 1 ? '' : 's'} to avoid repeating them.`,
      action: 'correct-english',
      actionLabel: 'Review mistakes',
    })
  }

  const weakSkills = state.profile.weakSkills
  if (weakSkills.length > 0) {
    suggestions.push({
      title: 'Focus on weak skills',
      message: `Spend some time improving your ${weakSkills.slice(0, 2).join(' and ')} skill${weakSkills.length > 1 ? 's' : ''} today.`,
      action: 'practice-with-me',
      actionLabel: 'Practice now',
    })
  }

  if (!state.profile.examDate) {
    suggestions.push({
      title: 'Set your exam date',
      message: 'Setting your IELTS exam date helps me create a more targeted study plan for you.',
      actionLabel: 'Set date',
    })
  }

  return suggestions.slice(0, 3)
}
