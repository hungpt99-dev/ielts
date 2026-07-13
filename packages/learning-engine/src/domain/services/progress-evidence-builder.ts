import type { SkillEvidence } from '../entities/skill-evidence'
import type { SkillProgress } from '../entities/skill-evidence'
import type { ProgressTrend } from '../value-objects'
import type { IELTSSection } from '../value-objects'

export interface BuildProgressEvidenceInput {
  skill: IELTSSection
  score: number
  maximumScore: number
  previousAccuracy?: number
  sourceExerciseId: string
  sourceSessionId: string
}

export function buildProgressEvidence(input: BuildProgressEvidenceInput): SkillEvidence {
  const accuracy = input.maximumScore > 0 ? input.score / input.maximumScore : 0
  const type = determineEvidenceType(accuracy, input.previousAccuracy)

  return {
    skill: input.skill,
    type,
    description: buildDescription(input, accuracy, type),
    score: input.score,
    maximumScore: input.maximumScore,
    accuracy,
    sourceExerciseId: input.sourceExerciseId,
    sourceSessionId: input.sourceSessionId,
    occurredAt: new Date().toISOString(),
    confidence: calculateConfidence(input),
  }
}

function determineEvidenceType(accuracy: number, previousAccuracy?: number): SkillEvidence['type'] {
  if (previousAccuracy === undefined) {
    return accuracy >= 0.7 ? 'strength' : 'weakness'
  }
  if (accuracy > previousAccuracy) return 'improvement'
  if (accuracy < previousAccuracy) return 'weakness'
  return 'plateau'
}

function buildDescription(input: BuildProgressEvidenceInput, accuracy: number, type: SkillEvidence['type']): string {
  const accuracyPct = Math.round(accuracy * 100)
  if (type === 'improvement') return `Improved ${input.skill} accuracy to ${accuracyPct}%`
  if (type === 'weakness') return `${input.skill} accuracy is ${accuracyPct}% — needs attention`
  if (type === 'plateau') return `${input.skill} performance stable at ${accuracyPct}%`
  return `${input.skill} initial accuracy: ${accuracyPct}%`
}

function calculateConfidence(input: BuildProgressEvidenceInput): number {
  let confidence = 0.6
  if (input.maximumScore > 0) confidence += 0.1
  if (input.previousAccuracy !== undefined) confidence += 0.2
  return Math.min(confidence, 1)
}

export function aggregateSkillProgress(existing: SkillProgress | undefined, evidence: SkillEvidence): SkillProgress {
  return {
    currentBand: existing?.currentBand,
    targetBand: existing?.targetBand,
    recentAccuracy: evidence.accuracy,
    exercisesCompleted: (existing?.exercisesCompleted ?? 0) + 1,
    trend: calculateTrend(existing, evidence),
  }
}

function calculateTrend(existing: SkillProgress | undefined, evidence: SkillEvidence): ProgressTrend {
  if (!existing || existing.recentAccuracy === undefined) return 'unknown'
  if (evidence.accuracy > existing.recentAccuracy + 0.05) return 'improving'
  if (evidence.accuracy < existing.recentAccuracy - 0.05) return 'declining'
  return 'stable'
}
