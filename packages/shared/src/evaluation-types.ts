import type { MistakeEvidence, SkillEvidence } from './mistake-evidence'

export type EvaluationStatus = 'correct' | 'partially-correct' | 'incorrect' | 'not-evaluable'
export type EvaluationMethod = 'deterministic' | 'ai-assisted' | 'ai-only' | 'hybrid' | 'self-evaluated'

export interface AnswerEvaluation {
  questionId: string
  status: EvaluationStatus
  score: number
  maximumScore: number
  feedback: string
  explanation?: string
  suggestedImprovement?: string
  mistakes: MistakeEvidence[]
  skillEvidence: SkillEvidence[]
  evaluatedBy: EvaluationMethod
  confidence: number
}

export interface RubricScore {
  dimension: string
  score: number
  maximumScore: number
  feedback: string
  evidence: string
}

export interface WritingEvaluation {
  overallBand: number
  taskAchievement: RubricScore
  coherenceAndCohesion: RubricScore
  lexicalResource: RubricScore
  grammaticalRange: RubricScore
  strengths: string[]
  weaknesses: string[]
  corrections: Array<{ original: string; corrected: string; explanation: string }>
  improvementPriorities: string[]
  practiceRecommendation: string
  confidence: number
  limitations: string[]
}

export interface SpeakingEvaluation {
  overallBand: number
  fluencyAndCoherence: RubricScore
  lexicalResource: RubricScore
  grammaticalRange: RubricScore
  pronunciationNotes?: string
  strengths: string[]
  weaknesses: string[]
  corrections: Array<{ original: string; corrected: string; explanation: string }>
  improvementPriorities: string[]
  practiceRecommendation: string
  confidence: number
  limitations: string[]
}
