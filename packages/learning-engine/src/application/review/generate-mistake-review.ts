import type { MistakeEvidence } from '../../domain/entities/mistake-evidence'
import type { Exercise } from '../../domain/entities/exercise'
import type { MistakeRepository } from '../../ports/mistake-repository'

export interface GenerateReviewDependencies {
  mistakeRepository: MistakeRepository
}

export async function generateMistakeReview(
  skill?: string,
  count: number = 5,
  deps?: GenerateReviewDependencies,
): Promise<Exercise> {
  const mistakes = deps
    ? await deps.mistakeRepository.findRecent(skill, count)
    : []

  const exerciseId = crypto.randomUUID?.() ?? `${Date.now()}-review`

  const exercise: Exercise = {
    id: exerciseId,
    sessionId: '',
    skill: (skill as any) ?? 'writing',
    exerciseType: 'error-correction',
    objectiveId: '',
    title: 'Mistake Review',
    instructions: 'Review and correct the following mistakes.',
    questions: mistakes.slice(0, count).map((m: MistakeEvidence) => ({
      type: 'error-correction' as const,
      sentence: m.originalResponse,
      error: m.originalResponse,
      correction: m.correctedResponse,
      explanation: m.explanation,
    })),
    difficulty: 'medium' as const,
    estimatedMinutes: Math.min(count * 3, 20),
    sourceType: 'user-mistakes',
    sourceIds: mistakes.map(m => m.id),
    explanationPolicy: 'after-attempt',
    evaluationPolicy: 'deterministic',
    metadata: {
      focusAreas: ['mistake-review'],
      templateId: 'mistake-review',
      contextSnapshotHash: '',
      schemaVersion: '1.0',
    },
  }

  if (exercise.questions.length === 0) {
    exercise.questions = [
      {
        type: 'error-correction' as const,
        sentence: 'Review your recent mistakes.',
        error: '',
        correction: '',
        explanation: 'No specific mistakes found for review.',
      },
    ]
  }

  return exercise
}
