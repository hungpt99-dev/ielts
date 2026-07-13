import type { LearningObjective, LearningObjectiveType, LearningObjectiveSource, TaskPriority, LearningSuccessCriterion } from '../entities/learning-objective'
import type { IELTSSection } from '../value-objects'

export interface ObjectiveAnalysisInput {
  skill: IELTSSection
  availableMinutes: number
  currentBand?: number
  targetBand?: number
  recentAccuracy?: number
  isReview: boolean
  isMistakeReview: boolean
  isVocabularyReview: boolean
  source: LearningObjectiveSource
  sourceId?: string
}

export function analyzeObjective(input: ObjectiveAnalysisInput): LearningObjective {
  const type = selectObjectiveType(input)
  const priority = determinePriority(input)
  const subskill = determineSubskill(input)
  const successCriteria = buildSuccessCriteria(input, type)

  return {
    id: `obj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    skill: input.skill,
    subskill,
    type,
    description: buildDescription(input, type),
    source: input.source,
    sourceId: input.sourceId,
    estimatedMinutes: input.availableMinutes,
    priority,
    successCriteria,
  }
}

function selectObjectiveType(input: ObjectiveAnalysisInput): LearningObjectiveType {
  if (input.isMistakeReview) return 'review'
  if (input.isVocabularyReview) return 'review'
  if (input.isReview) return 'reflect'
  if (input.recentAccuracy !== undefined && input.recentAccuracy < 50) return 'learn'
  if (input.currentBand && input.targetBand && (input.targetBand - input.currentBand) >= 2) return 'learn'
  return 'practice'
}

function determinePriority(input: ObjectiveAnalysisInput): TaskPriority {
  if (input.isMistakeReview) return 'high'
  if (input.currentBand && input.targetBand && (input.targetBand - input.currentBand) >= 2.5) return 'high'
  if (input.recentAccuracy !== undefined && input.recentAccuracy < 40) return 'high'
  return 'normal'
}

function determineSubskill(input: ObjectiveAnalysisInput): string | undefined {
  if (input.isMistakeReview) return 'error-correction'
  if (input.isVocabularyReview) return 'vocabulary'
  return undefined
}

function buildSuccessCriteria(input: ObjectiveAnalysisInput, type: LearningObjectiveType): LearningSuccessCriterion[] {
  const criteria: LearningSuccessCriterion[] = []
  if (input.recentAccuracy !== undefined) {
    criteria.push({ type: 'accuracy', threshold: Math.min(input.recentAccuracy + 10, 100), description: `Achieve accuracy of at least ${Math.min(input.recentAccuracy + 10, 100)}%` })
  }
  if (type === 'learn') {
    criteria.push({ type: 'completion', threshold: 80, description: 'Complete at least 80% of the learning activity' })
  }
  if (criteria.length === 0) {
    criteria.push({ type: 'completion', threshold: 100, description: 'Complete the activity' })
  }
  return criteria
}

function buildDescription(input: ObjectiveAnalysisInput, type: LearningObjectiveType): string {
  if (type === 'review') return `Review ${input.skill} concepts and address previous mistakes`
  if (type === 'learn') return `Learn new ${input.skill} techniques and strategies`
  if (type === 'reflect') return `Reflect on recent ${input.skill} performance and identify areas for improvement`
  return `Practice and improve ${input.skill} skills through targeted exercises`
}
