import type { ExerciseQuestion } from './exercise-question'

export type LearningActivityType =
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'vocabulary'
  | 'grammar'
  | 'mistake-review'

export type ActivityContent =
  | { type: 'passage'; text: string; wordCount: number }
  | { type: 'transcript'; text: string; wordCount: number; audioUrl?: string }
  | { type: 'prompt'; text: string; wordLimit?: number }
  | { type: 'word-list'; words: Array<{ word: string; meaning: string; example?: string }> }
  | { type: 'mistake-review'; mistakes: Array<{ original: string; correction: string; rule: string }> }

export interface LearningActivity {
  id: string
  type: LearningActivityType
  skill: string
  title: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedMinutes: number
  content: ActivityContent
  questions: ExerciseQuestion[]
  metadata: {
    source: 'built-in' | 'ai-generated' | 'user-created'
    generatedById: string
    schemaVersion: string
  }
  createdAt: string
}
