import { z } from 'zod'

export const isoStringSchema = z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid ISO date string' })

export const exerciseSkillSchema = z.enum(['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking'])

export const exerciseSourceSchema = z.enum([
  'built-in', 'user-created', 'ai-generated', 'web-content', 'mistake-review', 'vocabulary-practice',
])

export const exerciseDifficultySchema = z.enum(['beginner', 'intermediate', 'advanced'])

export const questionTypeSchema = z.enum([
  'multiple-choice', 'gap-fill', 'true-false', 'error-correction', 'matching', 'short-answer', 'rewrite',
])

export const exerciseStatusSchema = z.enum(['draft', 'published', 'archived'])

export const attemptStatusSchema = z.enum(['in-progress', 'completed', 'abandoned'])

export const reviewRatingSchema = z.enum(['again', 'hard', 'good', 'easy'])

export const matchingPairSchema = z.object({
  left: z.string().min(1),
  right: z.string().min(1),
})

export const fillInBlankSchema = z.object({
  position: z.number().int().min(0),
  correctAnswer: z.string().min(1),
  acceptableAnswers: z.array(z.string()).optional(),
  hint: z.string().optional(),
})

export const answerExplanationSchema = z.object({
  correctAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.array(matchingPairSchema)]),
  explanation: z.string().min(1),
  tips: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
})

export const exerciseQuestionSchema = z.object({
  id: z.string().min(1),
  type: questionTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.array(matchingPairSchema)]),
  explanation: answerExplanationSchema,
  blanks: z.array(fillInBlankSchema).optional(),
  matchingPairs: z.array(matchingPairSchema).optional(),
  points: z.number().int().positive().optional(),
  difficulty: exerciseDifficultySchema.optional(),
  tags: z.array(z.string()).optional(),
})

export const exerciseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  skill: exerciseSkillSchema,
  topic: z.string().min(1),
  source: exerciseSourceSchema,
  difficulty: exerciseDifficultySchema,
  questions: z.array(exerciseQuestionSchema).min(1),
  totalPoints: z.number().int().nonnegative(),
  estimatedMinutes: z.number().int().nonnegative(),
  status: exerciseStatusSchema,
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  sourceId: z.string().optional(),
  contentVersion: z.number().int().optional(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const exerciseAttemptAnswerSchema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.array(matchingPairSchema)]),
  isCorrect: z.boolean(),
  timeSpentSeconds: z.number().nonnegative(),
  score: z.number().nonnegative(),
  maxScore: z.number().positive(),
})

export const exerciseAttemptSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  skill: exerciseSkillSchema,
  status: attemptStatusSchema,
  answers: z.array(exerciseAttemptAnswerSchema),
  totalScore: z.number().nonnegative(),
  maxScore: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  timeSpentSeconds: z.number().nonnegative(),
  startedAt: isoStringSchema,
  completedAt: isoStringSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const exerciseResultSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  attemptId: z.string().min(1),
  skill: exerciseSkillSchema,
  topic: z.string(),
  score: z.number().nonnegative(),
  total: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
  timeSpentSeconds: z.number().nonnegative(),
  questions: z.array(exerciseAttemptAnswerSchema),
  mistakes: z.array(z.object({
    questionId: z.string(),
    question: z.string(),
    userAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.boolean(), z.array(matchingPairSchema)]),
    correctAnswer: z.union([z.string(), z.array(z.string()), z.number(), z.array(matchingPairSchema)]),
    explanation: z.string(),
    skill: exerciseSkillSchema,
  })),
  review: z.object({
    nextReviewAt: isoStringSchema,
    interval: z.number().nonnegative(),
    easeFactor: z.number().min(1.3),
    repetitions: z.number().int().nonnegative(),
  }),
  createdAt: isoStringSchema,
})

export const exerciseReviewRecordSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  resultId: z.string().min(1),
  lastReviewedAt: isoStringSchema,
  nextReviewAt: isoStringSchema,
  interval: z.number().nonnegative(),
  easeFactor: z.number().min(1.3),
  repetitions: z.number().int().nonnegative(),
  history: z.array(z.object({
    date: isoStringSchema,
    rating: reviewRatingSchema,
    score: z.number(),
  })),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})
