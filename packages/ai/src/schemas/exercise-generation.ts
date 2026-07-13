import { z } from 'zod'

export const readingQuestionSchema = z.object({
  question: z.string().min(1),
  type: z.string().default('multiple-choice'),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
  explanation: z.string().min(1),
})
export type ReadingQuestion = z.infer<typeof readingQuestionSchema>

export const readingQuestionsSchema = z.object({
  questions: z.array(readingQuestionSchema).min(1),
})
export type ReadingQuestions = z.infer<typeof readingQuestionsSchema>

export const listeningGapSchema = z.object({
  sentence: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().default(''),
})

export const listeningExerciseSchema = z.object({
  gaps: z.array(listeningGapSchema).min(1),
})
export type ListeningExercise = z.infer<typeof listeningExerciseSchema>

export const speakingPromptSchema = z.object({
  part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  question: z.string().min(1),
  followUp: z.string().optional(),
})

export const speakingPromptsSchema = z.object({
  prompts: z.array(speakingPromptSchema).min(1),
})
export type SpeakingPrompts = z.infer<typeof speakingPromptsSchema>

export const writingIdeaSchema = z.object({
  task: z.union([z.literal(1), z.literal(2)]),
  prompt: z.string().min(1),
  instruction: z.string().min(1),
})

export const writingIdeasSchema = z.object({
  ideas: z.array(writingIdeaSchema).min(1),
})
export type WritingIdeas = z.infer<typeof writingIdeasSchema>

export const grammarExerciseSchema = z.object({
  sentence: z.string().min(1),
  error: z.string().min(1),
  correction: z.string().min(1),
  explanation: z.string().min(1),
})

export const grammarExercisesSchema = z.object({
  exercises: z.array(grammarExerciseSchema).min(1),
})
export type GrammarExercises = z.infer<typeof grammarExercisesSchema>

export const mistakeReviewTaskSchema = z.object({
  type: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  explanation: z.string().min(1),
})

export const mistakeReviewSchema = z.object({
  tasks: z.array(mistakeReviewTaskSchema).min(1),
})
export type MistakeReview = z.infer<typeof mistakeReviewSchema>

export const extractedWordSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1),
  partOfSpeech: z.string().default(''),
  example: z.string().min(1),
  synonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
})

export const vocabularyExtractionSchema = z.object({
  words: z.array(extractedWordSchema).min(1),
})
export type VocabularyExtraction = z.infer<typeof vocabularyExtractionSchema>

export const readingPassageQuestionSchema = z.object({
  type: z.string().default('multiple-choice'),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0).optional(),
  answer: z.string().optional(),
  explanation: z.string().min(1),
})

export const readingPassageSchema = z.object({
  title: z.string().min(1),
  passage: z.string().min(1),
  questions: z.array(readingPassageQuestionSchema).min(1),
})
export type ReadingPassage = z.infer<typeof readingPassageSchema>

export const practiceQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0).optional(),
  answer: z.string().optional(),
  explanation: z.string().min(1),
})

export const practiceQuestionsSchema = z.object({
  title: z.string().min(1),
  questions: z.array(practiceQuestionSchema).min(1),
})
export type PracticeQuestions = z.infer<typeof practiceQuestionsSchema>
