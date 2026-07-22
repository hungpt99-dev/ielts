export type ExerciseStatus = 'draft' | 'active' | 'archived' | 'deprecated'

export type ExerciseSource =
  | 'built_in'
  | 'ai_generated'
  | 'saved_content'
  | 'imported'
  | 'user_created'
  | 'seed_data'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface LearningObjective {
  id: string
  name: string
  description?: string
  module?: string
  priority?: 'high' | 'medium' | 'low'
}
