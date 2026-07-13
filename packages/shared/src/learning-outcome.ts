import type { MistakeEvidence, SkillEvidence, VocabularyEvidence } from './mistake-evidence'
import type { IELTSSection } from './ielts-section'

export interface LearningOutcome {
  sessionId: string
  exerciseId: string
  attemptId: string
  skill: IELTSSection
  objectiveId: string
  score: number
  maximumScore: number
  accuracy?: number
  estimatedBand?: number
  difficulty: string
  actualMinutes: number
  hintsUsed: number
  strengths: SkillEvidence[]
  weaknesses: SkillEvidence[]
  mistakes: MistakeEvidence[]
  vocabularyEvidence: VocabularyEvidence[]
  completedAt: string
}
