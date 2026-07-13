import type { NextBestActionRequest, NextBestActionResult } from '../../domain/entities/tutor-recommendation'
import type { LearnerStateSnapshot } from '../../domain/entities/learner-context'
import { analyzeSkillPriorities } from '../../domain/services/skill-priority-analyzer'

export function getNextBestAction(request: NextBestActionRequest): NextBestActionResult {
  const { learnerState, availableMinutes } = request

  const taskAction = evaluateRoadmapTask(learnerState, availableMinutes)
  if (taskAction) return taskAction

  const mistakeAction = evaluateMistakeReview(learnerState, availableMinutes)
  if (mistakeAction) return mistakeAction

  const vocabAction = evaluateVocabularyReview(learnerState, availableMinutes)
  if (vocabAction) return vocabAction

  const skillAction = evaluateSkillPractice(learnerState, availableMinutes)
  if (skillAction) return skillAction

  return {
    action: { type: 'rest' },
    estimatedMinutes: 0,
    skill: 'reading',
    priority: 0,
    reason: 'No pending tasks or reviews. Take a break or explore new content.',
    alternatives: [],
    aiUsed: false,
  }
}

function evaluateRoadmapTask(state: LearnerStateSnapshot, availableMinutes: number): NextBestActionResult | null {
  if (!state.roadmap || !state.roadmap.active) return null

  const todayTasks = state.roadmap.todayTasks.filter(t => !t.isCompleted)
  if (todayTasks.length === 0) return null

  const suitable = todayTasks.find(t => t.estimatedMinutes <= availableMinutes)
  if (!suitable) return null

  return {
    action: { type: 'study-roadmap-task', taskId: suitable.id },
    estimatedMinutes: suitable.estimatedMinutes,
    skill: suitable.skill,
    priority: 1,
    reason: `Complete your scheduled task: "${suitable.title}"`,
    relatedDataIds: [suitable.id],
    alternatives: [],
    aiUsed: false,
  }
}

function evaluateMistakeReview(state: LearnerStateSnapshot, _availableMinutes: number): NextBestActionResult | null {
  if (state.mistakeSummary.unreviewed <= 0) return null

  return {
    action: { type: 'review-mistakes', count: state.mistakeSummary.unreviewed },
    estimatedMinutes: Math.min(state.mistakeSummary.unreviewed * 2, 20),
    skill: state.mistakeSummary.recurringPatterns[0]?.skill ?? 'writing',
    priority: 0.8,
    reason: `${state.mistakeSummary.unreviewed} mistakes waiting for review`,
    relatedDataIds: [],
    alternatives: [],
    aiUsed: false,
  }
}

function evaluateVocabularyReview(state: LearnerStateSnapshot, _availableMinutes: number): NextBestActionResult | null {
  if (state.vocabularySummary.dueForReview <= 0) return null

  return {
    action: { type: 'review-vocabulary', count: state.vocabularySummary.dueForReview },
    estimatedMinutes: Math.min(state.vocabularySummary.dueForReview, 15),
    skill: 'writing',
    priority: 0.7,
    reason: `${state.vocabularySummary.dueForReview} vocabulary items due for review`,
    relatedDataIds: [],
    alternatives: [],
    aiUsed: false,
  }
}

function evaluateSkillPractice(state: LearnerStateSnapshot, availableMinutes: number): NextBestActionResult | null {
  const analysis = analyzeSkillPriorities(
    state.skillStates,
    state.profile.weakSkills,
  )

  const weakest = analysis.ranked[0]
  if (!weakest || weakest.priorityScore <= 0) return null

  return {
    action: { type: 'practice-skill', skill: weakest.skill },
    estimatedMinutes: Math.min(availableMinutes, 25),
    skill: weakest.skill,
    priority: weakest.priorityScore / 100,
    reason: weakest.reason ? `${weakest.skill}: ${weakest.reason}` : `${weakest.skill} needs practice`,
    relatedDataIds: [],
    alternatives: [],
    aiUsed: false,
  }
}
