import type { MistakeEvidence, MistakeSeverity } from '../entities/mistake-evidence'
import type { IELTSSection } from '../value-objects'

export interface BuildMistakeEvidenceInput {
  skill: IELTSSection
  category: string
  subcategory?: string
  originalResponse: string
  correctedResponse: string
  explanation: string
  sourceExerciseId: string
  sourceQuestionId: string
  existingMistakes: MistakeEvidence[]
  relatedGrammarItem?: string
  relatedVocabularyItem?: string
}

export function buildMistakeEvidence(input: BuildMistakeEvidenceInput): MistakeEvidence {
  const existing = findSimilar(input)
  const recurrenceCount = existing ? existing.recurrenceCount + 1 : 0

  return {
    id: `mistake-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    skill: input.skill,
    category: input.category,
    subcategory: input.subcategory,
    originalResponse: input.originalResponse,
    correctedResponse: input.correctedResponse,
    explanation: input.explanation,
    sourceExerciseId: input.sourceExerciseId,
    sourceQuestionId: input.sourceQuestionId,
    occurredAt: new Date().toISOString(),
    recurrenceCount,
    severity: calculateSeverity(recurrenceCount),
    confidence: 0.9,
    reviewStatus: 'unreviewed',
    relatedGrammarItem: input.relatedGrammarItem,
    relatedVocabularyItem: input.relatedVocabularyItem,
  }
}

function findSimilar(input: BuildMistakeEvidenceInput): MistakeEvidence | undefined {
  return input.existingMistakes.find(m =>
    m.skill === input.skill &&
    m.category === input.category &&
    m.originalResponse.toLowerCase().trim() === input.originalResponse.toLowerCase().trim()
  )
}

function calculateSeverity(recurrenceCount: number): MistakeSeverity {
  if (recurrenceCount >= 5) return 'critical'
  if (recurrenceCount >= 3) return 'severe'
  if (recurrenceCount >= 1) return 'moderate'
  return 'minor'
}

export function detectRecurrencePattern(mistakes: MistakeEvidence[]): Array<{ category: string; count: number; skills: IELTSSection[] }> {
  const grouped = new Map<string, { count: number; skills: Set<IELTSSection> }>()

  for (const m of mistakes) {
    const key = `${m.skill}:${m.category}`
    const existing = grouped.get(key) ?? { count: 0, skills: new Set<IELTSSection>() }
    existing.count++
    existing.skills.add(m.skill)
    grouped.set(key, existing)
  }

  return Array.from(grouped.entries())
    .filter(([_, v]) => v.count >= 2)
    .map(([_, v]) => ({
      category: Array.from(v.skills)[0] + ':' + 'recurring',
      count: v.count,
      skills: Array.from(v.skills),
    }))
}
