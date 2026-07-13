import type { TutorContextItem, LearnerStateSnapshot, MistakeSummary, VocabularySummary } from '../domain/entities/learner-context'
import type { LearnerProfile } from '../domain/entities/learner-profile'

export interface ContextSummary {
  profileSummary: string
  progressSummary: string
  mistakeSummary: string
  vocabularySummary: string
  recommendationCount: number
}

export function summarizeForPrompt(
  items: TutorContextItem<unknown>[],
  _scope: string,
): string {
  const parts: string[] = []

  for (const item of items) {
    switch (item.source) {
      case 'user-profile': {
        const profile = item.data as LearnerProfile
        parts.push(`Current IELTS level: ${profile.currentOverallBand ?? 'unknown'}, target: ${profile.targetOverallBand ?? 'unknown'}`)
        if (profile.examDate) {
          parts.push(`Exam date: ${profile.examDate}`)
        }
        break
      }
      case 'progress': {
        const progress = item.data as LearnerStateSnapshot['progress']
        parts.push(`Study streak: ${progress.studyStreak} days`)
        parts.push(`Weekly completion: ${progress.weeklyCompletionPercent}%`)
        break
      }
      case 'mistakes': {
        const mistakes = item.data as MistakeSummary
        if (mistakes.recurringPatterns.length > 0) {
          parts.push(`Repeated patterns: ${mistakes.recurringPatterns.map(p => p.pattern).join(', ')}`)
        }
        break
      }
      case 'vocabulary': {
        const vocab = item.data as VocabularySummary
        if (vocab.dueForReview > 0) {
          parts.push(`Vocabulary due for review: ${vocab.dueForReview}`)
        }
        break
      }
    }
  }

  return parts.join('. ') || 'No relevant context available.'
}

export function summarizeState(state: LearnerStateSnapshot): ContextSummary {
  return {
    profileSummary: `Band ${state.profile.currentOverallBand ?? '?'} → ${state.profile.targetOverallBand ?? '?'}`,
    progressSummary: `Streak: ${state.progress.studyStreak}d, ${state.progress.weeklyCompletionPercent}% weekly`,
    mistakeSummary: `${state.mistakeSummary.recurringPatterns.length} recurring patterns`,
    vocabularySummary: `${state.vocabularySummary.dueForReview} due review`,
    recommendationCount: analyzeSkillPriorities(state).length,
  }
}

function analyzeSkillPriorities(state: LearnerStateSnapshot): Array<{ skill: string; score: number }> {
  return Object.entries(state.skillStates)
    .map(([skill, s]) => ({ skill, score: (s.targetBand ?? 0) - (s.currentBand ?? 0) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
}
