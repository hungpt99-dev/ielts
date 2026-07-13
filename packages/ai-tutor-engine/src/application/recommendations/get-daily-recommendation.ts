import type { DailyRecommendation, TaskRecommendation } from '../../domain/entities/tutor-recommendation'
import type { LearnerStateSnapshot } from '../../domain/entities/learner-context'
import type { IELTSSection } from '../../domain/value-objects'
import { analyzeSkillPriorities } from '../../domain/services/skill-priority-analyzer'
import { getNextBestAction } from './get-next-best-action'

export function getDailyRecommendation(state: LearnerStateSnapshot): DailyRecommendation {
  const analysis = analyzeSkillPriorities(state.skillStates, state.profile.weakSkills)
  const focusSkill = analysis.focusSkill
  const focusReason = analysis.ranked[0]?.reason ?? 'balanced progress'

  const suggestedTasks = buildSuggestedTasks(state, analysis.ranked)

  return {
    date: new Date().toISOString().slice(0, 10),
    focusArea: focusSkill ? `${focusSkill.charAt(0).toUpperCase() + focusSkill.slice(1)} practice` : 'General review',
    reason: focusReason,
    suggestedTasks,
    streakMessage: buildStreakMessage(state.progress.studyStreak),
    weakSkillReminder: buildWeakSkillReminder(state.profile.weakSkills),
    examCountdownMessage: buildExamCountdownMessage(state.exam.daysUntilExam),
  }
}

function buildSuggestedTasks(
  state: LearnerStateSnapshot,
  ranked: Array<{ skill: IELTSSection; priorityScore: number; reason: string }>,
): TaskRecommendation[] {
  const tasks: TaskRecommendation[] = []

  const nextAction = getNextBestAction({
    learnerState: state,
    availableMinutes: 60,
  })

  if (nextAction.action.type !== 'rest') {
    tasks.push({
      title: typeof nextAction.action.type === 'string' ? nextAction.action.type : 'Recommended task',
      description: nextAction.reason,
      skill: nextAction.skill,
      reason: nextAction.reason,
      priority: 'high',
      estimatedMinutes: nextAction.estimatedMinutes,
      actionLabel: 'Start',
    })
  }

  for (const r of ranked.slice(0, 3)) {
    if (tasks.length >= 3) break
    const skill = r.skill
    const label = `Practice ${skill.charAt(0).toUpperCase() + skill.slice(1)}`
    if (tasks.some(t => t.title === label)) continue

    tasks.push({
      title: label,
      description: r.reason,
      skill,
      reason: r.reason,
      priority: r.priorityScore > 30 ? 'high' : r.priorityScore > 15 ? 'medium' : 'low',
      estimatedMinutes: 20,
      actionLabel: 'Practice',
    })
  }

  return tasks
}

function buildStreakMessage(streak: number): string | null {
  if (streak === 0) return 'Start your study streak today!'
  if (streak >= 7) return `🔥 ${streak}-day streak! Keep the momentum!`
  if (streak >= 3) return `${streak}-day streak! You're building good habits.`
  return null
}

function buildWeakSkillReminder(weakSkills: IELTSSection[]): string | null {
  if (weakSkills.length === 0) return null
  return `Focus on improving your ${weakSkills.join(' and ')} skill${weakSkills.length > 1 ? 's' : ''} today.`
}

function buildExamCountdownMessage(days: number | null): string | null {
  if (days === null) return null
  if (days <= 7) return `Only ${days} day${days === 1 ? '' : 's'} until your exam!`
  if (days <= 30) return `${days} days until your IELTS exam. Stay consistent!`
  return null
}
