import type { ProgressReviewRequest, ProgressReviewResult } from '../../domain/entities/progress-review'
import type { LearnerStateSnapshot } from '../../domain/entities/learner-context'
import { analyzeLearnerProgress } from '../../domain/services/progress-analyzer'
import { analyzeSkillPriorities } from '../../domain/services/skill-priority-analyzer'
import type { TutorAIClient } from '../../ai/tutor-ai-client'

export interface GenerateProgressReviewDeps {
  aiClient?: TutorAIClient
}

export async function generateProgressReview(
  request: ProgressReviewRequest,
  deps?: GenerateProgressReviewDeps,
): Promise<ProgressReviewResult> {
  const progress = analyzeLearnerProgress(request.learnerState)
  const skillAnalysis = analyzeSkillPriorities(
    request.learnerState.skillStates,
    request.learnerState.profile.weakSkills,
  )

  const result: ProgressReviewResult = {
    summary: buildSummary(request.learnerState, progress),
    improvements: progress.strengths,
    weaknesses: progress.weaknesses,
    repeatedMistakes: mapRepeatedMistakes(request.learnerState),
    studyConsistency: {
      weeklyCompletionRate: request.learnerState.progress.weeklyCompletionPercent,
      plannedVsActual: request.learnerState.progress.consistency,
      streakDays: request.learnerState.progress.studyStreak,
      inactiveDays: request.learnerState.progress.inactiveDays,
    },
    roadmapCompletion: {
      overall: request.learnerState.progress.overallCompletionPercent,
      phaseProgress: [],
    },
    skillPriorityChanges: skillAnalysis.ranked.slice(0, 5).map((r, i) => ({
      skill: r.skill,
      previousPriority: i + 1,
      currentPriority: skillAnalysis.ranked.indexOf(r) + 1,
      reason: r.reason,
    })),
    recommendedFocus: skillAnalysis.focusSkill
      ? `Focus on ${skillAnalysis.focusSkill} — ${skillAnalysis.ranked[0]?.reason ?? 'highest priority'}`
      : 'Continue with your current balanced approach',
    realisticNextActions: buildNextActions(request.learnerState),
    examRisk: buildExamRisk(request.learnerState),
    generatedAt: new Date().toISOString(),
  }

  if (deps?.aiClient) {
    const aiResult = await deps.aiClient.generateStructured<{ enrichedSummary: string }>({
      systemPrompt: 'You are an IELTS tutor generating a progress review. Use the provided data to create a personalized summary.',
      userMessage: JSON.stringify(result),
      schema: { enrichedSummary: '' },
    })

    if (aiResult.success && aiResult.data) {
      result.summary = aiResult.data.enrichedSummary
    }
  }

  return result
}

function buildSummary(state: LearnerStateSnapshot, _progress: ReturnType<typeof analyzeLearnerProgress>): string {
  const parts: string[] = []
  parts.push(`You are currently at band ${state.profile.currentOverallBand ?? '?'}, targeting band ${state.profile.targetOverallBand ?? '?'}.`)

  if (state.progress.studyStreak > 0) {
    parts.push(`You have a ${state.progress.studyStreak}-day study streak.`)
  }

  if (state.exam.daysUntilExam !== null) {
    parts.push(`${state.exam.daysUntilExam} days until your exam.`)
  }

  return parts.join(' ')
}

function mapRepeatedMistakes(state: LearnerStateSnapshot) {
  return state.mistakeSummary.recurringPatterns.map(p => ({
    pattern: p.pattern,
    skill: p.skill,
    frequency: p.frequency,
    lastOccurrence: new Date().toISOString(),
  }))
}

function buildNextActions(state: LearnerStateSnapshot): string[] {
  const actions: string[] = []

  if (state.mistakeSummary.unreviewed > 0) {
    actions.push(`Review ${state.mistakeSummary.unreviewed} pending mistakes`)
  }

  if (state.vocabularySummary.dueForReview > 0) {
    actions.push(`Review ${state.vocabularySummary.dueForReview} vocabulary items`)
  }

  const weakSkills = state.profile.weakSkills
  if (weakSkills.length > 0) {
    actions.push(`Practice ${weakSkills[0]} — your weakest skill`)
  }

  return actions
}

function buildExamRisk(state: LearnerStateSnapshot): string | null {
  if (state.exam.daysUntilExam === null) return null
  if (state.exam.daysUntilExam <= 7) {
    return `Your exam is in ${state.exam.daysUntilExam} days. Focus on review and timed practice.`
  }
  if (state.exam.daysUntilExam <= 30) {
    return `${state.exam.daysUntilExam} days until exam. Stay consistent.`
  }
  return null
}
