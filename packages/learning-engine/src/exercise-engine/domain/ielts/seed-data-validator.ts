import type {
  ReadingExerciseQualityReport,
  PassageCoverage,
} from './ielts-types'
import { validateBuiltInReadingActivity } from './validators'
import { profileReadingPassage } from './passage-profiler'

export interface SeedAuditResult {
  exerciseId: string
  title: string
  passageEstimatedBand: number
  averageQuestionBand: number
  directRetrievalRatio: number
  skillDistribution: Record<string, number>
  tfngAnswerDistribution?: { true: number; false: number; notGiven: number }
  passageCoverage: PassageCoverage
  duplicateAnswerLocations: string[]
  malformedTaskTypes: string[]
  missingInstructions: string[]
  status: 'pass' | 'repair' | 'reject'
  issues: string[]
}

export function auditReadingExercise(
  exercise: {
    id: string
    title: string
    passages?: Array<{
      id: string
      content: string
      paragraphs?: Array<{ id: string; content: string }>
      questionGroups: Array<{
        id: string
        type: string
        questions: any[]
        instructions?: string[]
      }>
    }>
  },
): SeedAuditResult {
  const result: SeedAuditResult = {
    exerciseId: exercise.id,
    title: exercise.title,
    passageEstimatedBand: 0,
    averageQuestionBand: 0,
    directRetrievalRatio: 0,
    skillDistribution: {},
    passageCoverage: {
      paragraphIdsUsed: [],
      answerCountByParagraph: {},
      uncoveredImportantParagraphIds: [],
      duplicatedEvidenceLocations: [],
    },
    duplicateAnswerLocations: [],
    malformedTaskTypes: [],
    missingInstructions: [],
    status: 'pass',
    issues: [],
  }

  if (!exercise.passages || exercise.passages.length === 0) {
    result.issues.push('No passages found in exercise')
    result.status = 'reject'
    return result
  }

  let totalBand = 0
  let totalQuestions = 0
  let directCount = 0

  for (const passage of exercise.passages) {
    if (passage.content.length < 50) {
      result.issues.push(`Passage "${passage.id}" is too short`)
      continue
    }

    const paragraphs = passage.paragraphs || []

    // Profile the passage
    const profile = profileReadingPassage(passage.content, paragraphs)
    result.passageEstimatedBand = Math.max(
      result.passageEstimatedBand,
      profile.estimatedBandRange.minimum,
    )

    // Count questions by skill
    for (const group of passage.questionGroups) {
      // Check task type
      const validTypes = [
        'true-false-not-given', 'multiple-choice-single', 'sentence-completion',
        'matching-headings', 'matching-information', 'matching-features',
        'short-answer', 'summary-completion', 'note-completion',
        'multiple_choice', 'true_false_not_given', 'completion', 'matching_headings',
      ]
      if (!validTypes.includes(group.type)) {
        result.malformedTaskTypes.push(`${group.id}: ${group.type}`)
      }

      if (!group.instructions || group.instructions.length === 0) {
        result.missingInstructions.push(group.id)
      }

      for (const q of group.questions) {
        totalQuestions++
        const skill = q.skill || 'specific-detail'
        result.skillDistribution[skill] = (result.skillDistribution[skill] || 0) + 1

        if (skill === 'specific-detail' || skill === 'information-location') {
          directCount++
        }

        if (q.evidence?.paragraphId) {
          const pid = q.evidence.paragraphId
          result.passageCoverage.answerCountByParagraph[pid] =
            (result.passageCoverage.answerCountByParagraph[pid] || 0) + 1
          if (!result.passageCoverage.paragraphIdsUsed.includes(pid)) {
            result.passageCoverage.paragraphIdsUsed.push(pid)
          }
        }

        if (q.correctAnswer === 'not-given' || q.correctAnswer === 'not_given' || q.correctAnswer === 'not given') {
          result.tfngAnswerDistribution = result.tfngAnswerDistribution || { true: 0, false: 0, notGiven: 0 }
          result.tfngAnswerDistribution.notGiven++
        } else if (q.correctAnswer === 'true') {
          result.tfngAnswerDistribution = result.tfngAnswerDistribution || { true: 0, false: 0, notGiven: 0 }
          result.tfngAnswerDistribution.true++
        } else if (q.correctAnswer === 'false') {
          result.tfngAnswerDistribution = result.tfngAnswerDistribution || { true: 0, false: 0, notGiven: 0 }
          result.tfngAnswerDistribution.false++
        }
      }
    }

    // Run quality validation
    try {
      const taskGroups = passage.questionGroups.map(g => ({
        id: g.id,
        type: g.type,
        questions: g.questions || [],
      }))

      const qualityReport = validateBuiltInReadingActivity(
        passage.content,
        paragraphs,
        taskGroups,
        { targetBandMin: 5.0, targetBandMax: 6.5 },
      )

      result.averageQuestionBand = qualityReport.averageQuestionEstimatedBand
      result.directRetrievalRatio = qualityReport.directRetrievalRatio
      result.status = qualityReport.status

      for (const issue of qualityReport.issues) {
        result.issues.push(`[${issue.severity}] ${issue.field}: ${issue.description}`)
      }
    } catch (err) {
      result.issues.push(`Quality validation error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  if (totalQuestions > 0) {
    result.averageQuestionBand = Math.max(result.averageQuestionBand, totalBand / totalQuestions)
    result.directRetrievalRatio = Math.max(result.directRetrievalRatio, directCount / totalQuestions)
  }

  // Compute uncovered paragraphs
  for (const passage of exercise.passages) {
    const paraIds = (passage.paragraphs || []).map(p => p.id)
    for (const pid of paraIds) {
      if (!result.passageCoverage.paragraphIdsUsed.includes(pid)) {
        result.passageCoverage.uncoveredImportantParagraphIds.push(pid)
      }
    }
  }

  return result
}

export function auditAllSeedExercises(
  exercises: Array<{
    id: string
    title: string
    module?: string
    passages?: Array<{
      id: string
      content: string
      paragraphs?: Array<{ id: string; content: string }>
      questionGroups: Array<{
        id: string
        type: string
        questions: any[]
        instructions?: string[]
      }>
    }>
  }>,
): SeedAuditResult[] {
  const results: SeedAuditResult[] = []

  for (const ex of exercises) {
    if (ex.module !== 'reading' && !ex.passages) continue
    if (ex.passages) {
      results.push(auditReadingExercise(ex as any))
    }
  }

  return results
}
