import type { LearnerStateSnapshot } from '../../domain/entities/learner-context'

export interface RoadmapTaskExplanation {
  taskId: string
  title: string
  purpose: string
  relevanceToExam: string
  estimatedEffort: string
  prerequisites: string[]
  tips: string[]
}

export function explainRoadmapTask(
  taskId: string,
  state: LearnerStateSnapshot,
): RoadmapTaskExplanation | null {
  if (!state.roadmap) return null

  const allTasks = [
    ...state.roadmap.todayTasks,
    ...state.roadmap.nextTasks,
  ]

  const task = allTasks.find(t => t.id === taskId)
  if (!task) return null

  return {
    taskId: task.id,
    title: task.title,
    purpose: `This task focuses on ${task.skill}, which ${getSkillRelevance(task.skill, state)}`,
    relevanceToExam: getExamRelevance(task.skill, state),
    estimatedEffort: `${task.estimatedMinutes} minutes`,
    prerequisites: [],
    tips: [
      `Focus on accuracy over speed for ${task.skill}`,
      'Review any related mistakes before starting',
    ],
  }
}

function getSkillRelevance(skill: string, state: LearnerStateSnapshot): string {
  const skillState = state.skillStates[skill as keyof typeof state.skillStates]
  if (!skillState) return 'needs attention'

  if (skillState.gap && skillState.gap > 0) {
    return `has a ${skillState.gap}-band gap to your target`
  }
  return 'is part of your balanced study plan'
}

function getExamRelevance(skill: string, state: LearnerStateSnapshot): string {
  if (state.exam.daysUntilExam === null) return 'Builds foundational skills for the IELTS exam'
  if (state.exam.daysUntilExam <= 7) return `Critical for last-minute ${skill} preparation`
  return `Essential for achieving your target ${skill} band by the exam date`
}
