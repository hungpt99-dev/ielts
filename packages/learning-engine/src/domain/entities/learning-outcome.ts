import type { MistakeEvidence } from './mistake-evidence'
import type { SkillEvidence } from './skill-evidence'

export interface VocabularyEvidence {
  wordId: string
  word: string
  correct: boolean
  context: string
}

export interface LearningOutcome {
  sessionId: string
  exerciseId: string
  attemptId: string
  skill: string
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
