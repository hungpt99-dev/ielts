import { z } from 'zod'

export const ieltsSectionSchema = z.enum(['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary'])

export const mistakeSeveritySchema = z.enum(['minor', 'moderate', 'severe', 'critical'])
export const mistakeReviewStatusSchema = z.enum(['unreviewed', 'reviewed', 'mastered'])
export const skillEvidenceTypeSchema = z.enum(['strength', 'weakness', 'improvement', 'plateau'])
export const progressTrendSchema = z.enum(['improving', 'stable', 'declining', 'unknown'])
export const evaluationStatusSchema = z.enum(['correct', 'partially-correct', 'incorrect', 'not-evaluable'])
export const evaluationMethodSchema = z.enum(['deterministic', 'ai-assisted', 'ai-only', 'hybrid', 'self-evaluated'])
export const learningAttemptStatusSchema = z.enum(['not-started', 'in-progress', 'submitted', 'evaluated', 'completed', 'abandoned'])
export const exerciseDifficultySchema = z.enum(['easy', 'medium', 'hard', 'adaptive'])

export const mistakeEvidenceSchema = z.object({
  id: z.string().min(1),
  skill: ieltsSectionSchema,
  category: z.string().min(1),
  subcategory: z.string().optional(),
  originalResponse: z.string(),
  correctedResponse: z.string(),
  explanation: z.string(),
  sourceExerciseId: z.string().min(1),
  sourceQuestionId: z.string().min(1),
  occurredAt: z.string(),
  recurrenceCount: z.number().int().min(0),
  severity: mistakeSeveritySchema,
  confidence: z.number().min(0).max(1),
  reviewStatus: mistakeReviewStatusSchema,
  relatedGrammarItem: z.string().optional(),
  relatedVocabularyItem: z.string().optional(),
})

export const skillEvidenceSchema = z.object({
  skill: ieltsSectionSchema,
  type: skillEvidenceTypeSchema,
  description: z.string().min(1),
  score: z.number().min(0),
  maximumScore: z.number().min(0),
  accuracy: z.number().min(0).max(100),
  sourceExerciseId: z.string().min(1),
  sourceSessionId: z.string().min(1),
  occurredAt: z.string(),
  confidence: z.number().min(0).max(1),
})

export const vocabularyEvidenceSchema = z.object({
  wordId: z.string().min(1),
  word: z.string().min(1),
  correct: z.boolean(),
  context: z.string(),
})

export const learningOutcomeSchema = z.object({
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  attemptId: z.string().min(1),
  skill: ieltsSectionSchema,
  objectiveId: z.string().min(1),
  score: z.number().min(0),
  maximumScore: z.number().min(0),
  accuracy: z.number().min(0).max(100).optional(),
  estimatedBand: z.number().min(0).max(9).optional(),
  difficulty: z.string(),
  actualMinutes: z.number().min(0),
  hintsUsed: z.number().int().min(0),
  strengths: z.array(skillEvidenceSchema),
  weaknesses: z.array(skillEvidenceSchema),
  mistakes: z.array(mistakeEvidenceSchema),
  vocabularyEvidence: z.array(vocabularyEvidenceSchema),
  completedAt: z.string(),
})

export type MistakeEvidence = z.infer<typeof mistakeEvidenceSchema>
export type SkillEvidence = z.infer<typeof skillEvidenceSchema>
export type VocabularyEvidence = z.infer<typeof vocabularyEvidenceSchema>
export type LearningOutcome = z.infer<typeof learningOutcomeSchema>
