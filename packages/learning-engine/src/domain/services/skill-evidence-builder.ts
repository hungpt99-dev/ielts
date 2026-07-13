import type { SkillEvidence, SkillEvidenceType, SkillEvidenceBuilderInput } from '../entities/skill-evidence'
import type { IELTSSection } from '../value-objects'

export function buildSkillEvidence(input: SkillEvidenceBuilderInput): SkillEvidence {
  const accuracy = input.maximumScore > 0 ? input.score / input.maximumScore : 0
  const type = determineType(accuracy, input.previousAccuracy)

  return {
    skill: input.skill,
    type,
    description: buildDescription(input.skill, type, accuracy),
    score: input.score,
    maximumScore: input.maximumScore,
    accuracy,
    sourceExerciseId: input.sourceExerciseId,
    sourceSessionId: input.sourceSessionId,
    occurredAt: new Date().toISOString(),
    confidence: calculateConfidence(input),
  }
}

function determineType(accuracy: number, previousAccuracy?: number): SkillEvidenceType {
  if (previousAccuracy === undefined) {
    return accuracy >= 0.7 ? 'strength' : 'weakness'
  }
  if (accuracy > previousAccuracy + 0.05) return 'improvement'
  if (Math.abs(accuracy - previousAccuracy) <= 0.05) return 'plateau'
  return 'weakness'
}

function buildDescription(skill: IELTSSection, type: SkillEvidenceType, accuracy: number): string {
  const pct = Math.round(accuracy * 100)
  switch (type) {
    case 'strength': return `${skill}: demonstrated strength (${pct}%)`
    case 'weakness': return `${skill}: area for improvement (${pct}%)`
    case 'improvement': return `${skill}: improving (${pct}%)`
    case 'plateau': return `${skill}: stable at ${pct}%`
  }
}

function calculateConfidence(input: SkillEvidenceBuilderInput): number {
  let confidence = 0.7
  if (input.maximumScore > 3) confidence += 0.1
  if (input.previousAccuracy !== undefined) confidence += 0.1
  return Math.min(confidence, 1)
}

export function aggregateSkillEvidence(existing: SkillEvidence[], evidence: SkillEvidence): SkillEvidence[] {
  return [...existing.filter(e => e.skill !== evidence.skill), evidence]
}

export function getWeakestSkills(evidence: SkillEvidence[], count: number = 3): IELTSSection[] {
  return evidence
    .filter(e => e.type === 'weakness')
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, count)
    .map(e => e.skill)
}
