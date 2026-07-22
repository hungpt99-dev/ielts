import type { Exercise } from '../domain/types'
import type { ExerciseBlueprint } from '../domain/blueprints'
import type { ExerciseGenerationContext, GenerationRepairResult } from '../domain/ports'
import { validateExercise, validateExerciseAgainstBlueprint } from '../domain/validators'
import { assessReadingQualityExpanded } from '../domain/ielts/validators'
import type { ReadingExerciseQualityReport } from '../domain/ielts/ielts-types'

const MAX_REPAIR_ATTEMPTS = 3

interface RepairTarget {
  type: 'regenerate-group' | 'fix-distributions' | 'strengthen-paraphrase' | 'add-ng' | 'widen-coverage'
  description: string
  details: Record<string, unknown>
}

export async function generateWithRepair(
  generate: (blueprint: ExerciseBlueprint, context: ExerciseGenerationContext) => Promise<Exercise>,
  blueprint: ExerciseBlueprint,
  context: ExerciseGenerationContext,
): Promise<GenerationRepairResult> {
  let lastExercise: Exercise | null = null
  let lastErrors: string[] = []

  for (let attempt = 0; attempt < MAX_REPAIR_ATTEMPTS; attempt++) {
    try {
      const exercise = await generate(blueprint, context)
      lastExercise = exercise

      const blueprintValidation = validateExerciseAgainstBlueprint(exercise, blueprint)
      const exerciseValidation = validateExercise(exercise)

      const allErrors = [...blueprintValidation.errors, ...exerciseValidation.errors]

      let qualityResult: ReadingExerciseQualityReport | null = null

      // Only run quality validation for non-seed reading exercises with meaningful passage content
      if (blueprint.module === 'reading' && exercise.module === 'reading') {
        const readingEx = exercise as any
        const isSeedData = readingEx.source === 'seed_data'
        try {
          const passages = readingEx.passages || []
          for (const passage of passages) {
            const passageText = passage.content || ''
            if (!passageText || passageText.length < 200) continue

            if (passage.questionGroups) {
              const paragraphs = passage.paragraphs || readingEx.paragraphs || []

              const taskGroups = passage.questionGroups.map((g: any) => ({
                id: g.id,
                type: g.type,
                questions: g.questions || [],
              }))

              qualityResult = assessReadingQualityExpanded({
                passage: passage.content,
                paragraphs: paragraphs.length > 0 ? paragraphs : [],
                taskGroups,
                bandMin: (context.targetBand as number) ?? 5.0,
                bandMax: ((context.targetBand as number) ?? 5.0) + 1.0,
              })

              if (qualityResult && !isSeedData) {
                if (qualityResult.status === 'reject') {
                  const criticalIssues = qualityResult.issues.filter(i => i.severity === 'critical')
                  allErrors.push(
                    ...criticalIssues.map(i => `[Quality-${i.severity}] ${i.field}: ${i.description}`)
                  )
                }

                const repairTargets = identifyRepairTargets(qualityResult)
                if (repairTargets.length > 0 && attempt < MAX_REPAIR_ATTEMPTS - 1) {
                  console.warn(
                    `[GenerationRepair] Attempt ${attempt + 1}: Targeted repair needed for ${repairTargets.length} issue(s): ` +
                    repairTargets.map(t => t.description).join('; ')
                  )
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[GenerationRepair] Quality check error (non-fatal): ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      if (allErrors.length === 0) {
        return {
          exercise,
          repaired: attempt > 0,
          attemptCount: attempt + 1,
          errors: [],
        }
      }

      lastErrors = allErrors
    } catch (error) {
      lastErrors = [error instanceof Error ? error.message : String(error)]
    }
  }

  return {
    exercise: lastErrors.length === 0 ? lastExercise : null,
    repaired: false,
    attemptCount: MAX_REPAIR_ATTEMPTS,
    errors: lastErrors,
  }
}

function identifyRepairTargets(report: ReadingExerciseQualityReport): RepairTarget[] {
  const targets: RepairTarget[] = []

  const tfngIssues = report.issues.filter(i =>
    i.field === 'distribution' && i.description.includes('Not Given')
  )
  if (tfngIssues.length > 0) {
    targets.push({
      type: 'add-ng',
      description: 'TFNG group missing Not Given answer',
      details: { issueCount: tfngIssues.length },
    })
  }

  const directRatioIssue = report.issues.find(i =>
    i.field === 'skill-distribution' && i.description.includes('Direct retrieval')
  )
  if (directRatioIssue) {
    targets.push({
      type: 'regenerate-group',
      description: 'Too many direct retrieval questions - need inference/paragraph-purpose/reference items',
      details: { directRatio: report.directRetrievalRatio },
    })
  }

  const coverageIssue = report.issues.find(i =>
    i.field === 'coverage' && i.severity === 'critical'
  )
  if (coverageIssue) {
    targets.push({
      type: 'widen-coverage',
      description: 'Questions only cover a few paragraphs - need to spread across the passage',
      details: { passageCoverage: report.passageCoverage },
    })
  }

  const paraphraseIssue = report.issues.find(i =>
    i.field === 'questions' && (i.description.includes('copy') || i.description.includes('paraphrase'))
  )
  if (paraphraseIssue) {
    targets.push({
      type: 'strengthen-paraphrase',
      description: 'Questions copy passage wording too closely',
      details: { paraphraseQuality: report.paraphraseQuality },
    })
  }

  const difficultyIssue = report.issues.find(i =>
    i.field === 'difficulty-alignment'
  )
  if (difficultyIssue) {
    targets.push({
      type: 'regenerate-group',
      description: 'Question difficulty too low for passage difficulty',
      details: { bandGap: difficultyIssue.description },
    })
  }

  return targets
}
