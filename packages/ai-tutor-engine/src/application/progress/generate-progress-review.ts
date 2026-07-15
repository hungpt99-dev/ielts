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
    const aiResult = await deps.aiClient.generateStructured<{
      teacherSummary: string
      teacherFeedback: string
    }>({
      systemPrompt: `You are an experienced IELTS teacher writing a data-driven progress review for your student. Your tone should be direct, specific, and insightful — like a teacher who has actually looked at their work.

MANDATORY — include specific numbers and data in every response:
- Reference their actual band, streak, completion rate, study hours, mistakes count, vocabulary saved
- Mention specific skill names (Listening, Reading, Writing, Speaking) with what's working and what isn't
- If they have weak skills, name them and say WHY they matter for IELTS
- Give concrete, actionable steps — not generic advice

Structure the teacherSummary as:
1. One sentence with their current status (band, streak, exam timeline)
2. One sentence with skill-specific observation (reference a number)
3. One sentence with a specific actionable recommendation
4. One sentence of honest encouragement tied to their effort

The teacherFeedback should be shorter — 2-3 sentences with a specific observation the student can act on today.

Do NOT:
- Just say "keep going" or "you're doing great" without data to back it up
- Be vague — every statement must reference something from their actual data
- Use filler — every sentence should carry information

The teacherSummary will be shown as the main message. The teacherFeedback will be shown as a "Tutor's Note" sidebar.`,
      userMessage: JSON.stringify(result),
      schema: { teacherSummary: '', teacherFeedback: '' },
      temperature: 0.7,
      maxTokens: 1024,
    })

    if (aiResult.success && aiResult.data) {
      const data = aiResult.data as Record<string, unknown>
      if (data.teacherSummary && typeof data.teacherSummary === 'string') {
        result.summary = data.teacherSummary
      }
      if (data.teacherFeedback && typeof data.teacherFeedback === 'string') {
        result.examRisk = data.teacherFeedback
      }
    }
  }

  return result
}

function buildSummary(state: LearnerStateSnapshot, progress: ReturnType<typeof analyzeLearnerProgress>): string {
  const band = state.profile.currentOverallBand ?? '?'
  const target = state.profile.targetOverallBand ?? '?'
  const daysUntil = state.exam.daysUntilExam

  const gap = state.profile.weakSkills.length > 0
    ? `I can see ${state.profile.weakSkills.join(', ')} need some extra attention right now`
    : 'every skill has room to grow'

  const streakNote = state.progress.studyStreak > 0
    ? `Great to see you've built a ${state.progress.studyStreak}-day study streak — that kind of consistency makes a real difference.`
    : null

  const examNote = daysUntil !== null
    ? daysUntil <= 30
      ? `With ${daysUntil} days until your exam, let's make every session count.`
      : `You've got ${daysUntil} days until your exam — plenty of time to make meaningful progress if we stay focused.`
    : null

  const improvements = progress.strengths.length > 0
    ? progress.strengths.map(s => `${s.area} is looking stronger — ${s.evidence}.`).join(' ')
    : null

  const parts = [
    `Hi there! Here's how your IELTS preparation is going.`,
    `You're currently working at band ${band}, with a target of band ${target}.`,
    improvements,
    streakNote,
    examNote,
    gap ? `${gap}, but I've seen you make progress before and I know you can do it again.` : null,
  ].filter(Boolean)

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
  const d = state.exam.daysUntilExam
  if (d <= 7) {
    return `Your exam is in ${d} days — you're in the final stretch. Focus on reviewing your notes, doing timed practice tests, and getting plenty of rest. Trust the work you've put in.`
  }
  if (d <= 30) {
    return `${d} days until your exam. This is a great time to intensify your practice — focus on your weaker areas and do at least one full mock test per week. You're building toward something important, so stay consistent.`
  }
  return `You've got ${d} days until your exam — a solid runway to make real progress. The key is steady, consistent effort. Focus on one skill at a time and don't forget to review your mistakes regularly. You've got this.`
}
