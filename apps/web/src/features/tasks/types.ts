import type { TaskEntry, TaskCategory } from '../../models'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type StudySkill =
  | 'Vocabulary'
  | 'Reading'
  | 'Listening'
  | 'Writing'
  | 'Speaking'
  | 'Grammar'

export interface TaskContentSection {
  heading: string
  body: string
  type?: 'text' | 'list' | 'example' | 'tip' | 'instruction'
}

export interface TaskPracticeQuestion {
  id: string
  question: string
  options?: string[]
  correctAnswer?: string
  type: 'multiple-choice' | 'fill-blank' | 'short-answer' | 'open-ended' | 'writing' | 'speaking'
}

export interface TaskDetail {
  taskId: string
  skill: StudySkill
  title: string
  objective: string
  difficulty: Difficulty
  estimatedMinutes: number
  learningContent: TaskContentSection[]
  practiceQuestions: TaskPracticeQuestion[]
  tips: string[]
  whyItMatters: string
  relatedTopic: string
}

export interface ReviewEntry {
  id: string
  taskId: string
  content: string
  type: 'note' | 'mistake' | 'vocabulary'
  createdAt: string
}

export function getSkillCategory(skill: StudySkill): TaskCategory {
  const map: Record<StudySkill, TaskCategory> = {
    Vocabulary: 'Vocabulary',
    Reading: 'Reading',
    Listening: 'Listening',
    Writing: 'Writing Task 2',
    Speaking: 'Speaking Part 1',
    Grammar: 'Grammar',
  }
  return map[skill]
}
