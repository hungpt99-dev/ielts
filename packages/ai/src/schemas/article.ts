import { z } from 'zod'

export const articleQuestionSchema = z.object({
  questions: z.array(z.object({
    type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'gap-fill', 'matching']),
    question: z.string().min(1),
    passage: z.string().optional(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
    skill: z.enum(['reading', 'listening', 'writing', 'speaking']).default('reading'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    bandScore: z.string().optional(),
  })),
})
export type ArticleQuestion = z.infer<typeof articleQuestionSchema>['questions'][number]
export type ArticleQuestionSet = z.infer<typeof articleQuestionSchema>
