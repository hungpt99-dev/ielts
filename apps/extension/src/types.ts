import { z } from 'zod'

export const SAVE_CATEGORIES = [
  'vocabulary',
  'phrase',
  'sentence',
  'grammar',
  'reading',
  'writing',
  'speaking',
  'mistake',
] as const

export type SaveCategory = typeof SAVE_CATEGORIES[number]

export const SKILL_OPTIONS = [
  'vocabulary',
  'grammar',
  'reading',
  'listening',
  'writing',
  'speaking',
  'general',
] as const

export type SkillOption = typeof SKILL_OPTIONS[number]

export const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard', '' as const] as const
export type DifficultyOption = typeof DIFFICULTY_OPTIONS[number]

export const MISTAKE_STATUS_OPTIONS = ['new', 'reviewing', 'fixed'] as const
export type MistakeStatus = typeof MISTAKE_STATUS_OPTIONS[number]

export const LEARNING_STATUS_OPTIONS = ['new', 'learning', 'reviewing', 'mastered'] as const
export type LearningStatus = typeof LEARNING_STATUS_OPTIONS[number]

export const entrySchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Text is required'),
  category: z.enum(SAVE_CATEGORIES),
  topic: z.string().default(''),
  skill: z.enum(SKILL_OPTIONS).default('general'),
  difficulty: z.enum(['easy', 'medium', 'hard', '']).default(''),
  tags: z.array(z.string()).default([]),
  personalNote: z.string().default(''),
  pageTitle: z.string().default(''),
  pageUrl: z.string().default(''),
  status: z.enum(['new', 'learning', 'reviewing', 'mastered', 'reviewing', 'fixed']).default('new'),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type LearningEntry = z.infer<typeof entrySchema>

export const entryFormSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  category: z.enum(SAVE_CATEGORIES),
  topic: z.string().max(100, 'Topic too long').default(''),
  skill: z.enum(SKILL_OPTIONS).default('general'),
  difficulty: z.enum(['easy', 'medium', 'hard', '']).default(''),
  tags: z.string().default(''),
  personalNote: z.string().max(500, 'Note too long').default(''),
})

export type EntryFormData = z.infer<typeof entryFormSchema>

export const CATEGORY_LABELS: Record<SaveCategory, string> = {
  vocabulary: 'Vocabulary',
  phrase: 'Useful Phrase',
  sentence: 'Example Sentence',
  grammar: 'Grammar Note',
  reading: 'Reading Material',
  writing: 'Writing Idea',
  speaking: 'Speaking Idea',
  mistake: 'Mistake Note',
}

// Use <CategoryIcon> component from '../components/CategoryIcon' instead
export const CATEGORY_ICONS: Record<SaveCategory, string> = {
  vocabulary: '',
  phrase: '',
  sentence: '',
  grammar: '',
  reading: '',
  writing: '',
  speaking: '',
  mistake: '',
}

export const CATEGORY_COLORS: Record<SaveCategory, string> = {
  vocabulary: '#3b82f6',
  phrase: '#8b5cf6',
  sentence: '#06b6d4',
  grammar: '#f59e0b',
  reading: '#10b981',
  writing: '#f97316',
  speaking: '#ec4899',
  mistake: '#ef4444',
}

export const SKILL_LABELS: Record<SkillOption, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
  writing: 'Writing',
  speaking: 'Speaking',
  general: 'General',
}
