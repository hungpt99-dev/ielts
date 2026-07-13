import type { IELTSSection } from '../domain/value-objects'
import type { GenerateExerciseRequest } from '../domain/entities/exercise'
import type { Exercise } from '../domain/entities/exercise'
import type { AnswerEvaluation } from '../domain/entities/evaluation'
import type { MistakeEvidence } from '../domain/entities/mistake-evidence'
import type { SkillEvidence } from '../domain/entities/skill-evidence'

export interface SkillActivityGenerationRequest {
  skill: IELTSSection
  objectiveId: string
  availableMinutes: number
  difficulty: string
  targetBand?: number
  currentBand?: number
  recentMistakes: MistakeEvidence[]
  focusAreas: string[]
  correlationId: string
}

export interface SkillActivityGenerationResult {
  exercise: Exercise
  aiUsed: boolean
  cacheHit: boolean
}

export interface SkillEvaluationRequest {
  exercise: Exercise
  answers: Record<string, unknown>
  skill: IELTSSection
}

export interface SkillEvaluationResult {
  evaluations: AnswerEvaluation[]
  mistakes: MistakeEvidence[]
  skillEvidence: SkillEvidence[]
  confidence: number
}

export interface SkillReviewRequest {
  skill: IELTSSection
  mistakes: MistakeEvidence[]
  count: number
}

export interface SkillReviewResult {
  exercise: Exercise
}

export interface LearningSkillModule {
  readonly skill: IELTSSection
  supports(request: GenerateExerciseRequest): boolean
  generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult>
  evaluate(request: SkillEvaluationRequest): Promise<SkillEvaluationResult>
  createReview(request: SkillReviewRequest): Promise<SkillReviewResult>
}
