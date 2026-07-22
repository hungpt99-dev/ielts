import type { WritingAssessment, CriterionAssessment } from './ielts-types'

export const WRITING_RUBRIC_CRITERIA = [
  'task-achievement',
  'task-response',
  'coherence-cohesion',
  'lexical-resource',
  'grammatical-range-accuracy',
] as const

export type RubricCriterion = typeof WRITING_RUBRIC_CRITERIA[number]

export function getCriteriaForTaskType(
  taskType: string,
): RubricCriterion[] {
  if (taskType.includes('task-1')) {
    return ['task-achievement', 'coherence-cohesion', 'lexical-resource', 'grammatical-range-accuracy']
  }
  return ['task-response', 'coherence-cohesion', 'lexical-resource', 'grammatical-range-accuracy']
}

export function calculateWritingBand(
  criterionScores: Record<string, number>,
  weights?: Record<string, number>,
): number {
  const criteria = Object.keys(criterionScores)
  if (criteria.length === 0) return 0

  let totalWeight = 0
  let weightedSum = 0

  for (const criterion of criteria) {
    const score = criterionScores[criterion]
    const weight = weights?.[criterion] ?? 1
    weightedSum += score * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 2) / 2 : 0
}

export function calculateFullWritingBand(
  task1Assessment: WritingAssessment,
  task2Assessment: WritingAssessment,
): { overallBand: number; confidence: 'low' | 'medium' | 'high' } {
  const task1Weight = 1
  const task2Weight = 2

  const overallBand = (task1Assessment.estimatedOverallBand * task1Weight + task2Assessment.estimatedOverallBand * task2Weight) / (task1Weight + task2Weight)

  const band = Math.round(overallBand * 2) / 2
  let confidence: 'low' | 'medium' | 'high' = 'medium'
  if (task1Assessment.confidence === 'high' && task2Assessment.confidence === 'high') confidence = 'high'
  else if (task1Assessment.confidence === 'low' || task2Assessment.confidence === 'low') confidence = 'low'

  return { overallBand: band, confidence }
}

export function isOffTopic(content: string, prompt: string): { risk: boolean; reason?: string } {
  const contentWords = new Set(content.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const promptWords = new Set(prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const overlap = [...contentWords].filter(w => promptWords.has(w)).length
  const overlapRatio = promptWords.size > 0 ? overlap / promptWords.size : 0
  return {
    risk: overlapRatio < 0.3,
    reason: overlapRatio < 0.3 ? 'Low lexical overlap with prompt — possible off-topic response' : undefined,
  }
}

export function checkWordCount(text: string, minimum: number): { count: number; underLength: boolean } {
  const count = text.split(/\s+/).filter(Boolean).length
  return { count, underLength: count < minimum }
}

export function createDefaultCriterionAssessment(estimatedBand: number): CriterionAssessment {
  return {
    estimatedBand,
    evidence: '',
    strengths: [],
    problems: [],
    improvement: '',
    uncertainty: 0.5,
  }
}

export function createDefaultWritingAssessment(estimatedBand: number): WritingAssessment {
  return {
    estimatedOverallBand: estimatedBand,
    confidence: 'low',
    criteria: {
      taskAchievementOrResponse: createDefaultCriterionAssessment(estimatedBand),
      coherenceAndCohesion: createDefaultCriterionAssessment(estimatedBand),
      lexicalResource: createDefaultCriterionAssessment(estimatedBand),
      grammaticalRangeAndAccuracy: createDefaultCriterionAssessment(estimatedBand),
    },
    wordCount: 0,
    underLength: false,
    offTopicRisk: false,
    copiedLanguageRisk: false,
    prioritizedImprovements: [],
  }
}

export const DISCLAIMER_AI_SCORING = 'This is an AI-estimated score, not an official IELTS band. Your actual test score may differ.'
