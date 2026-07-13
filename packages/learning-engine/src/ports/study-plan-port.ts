import type { IELTSSection } from '../domain/value-objects'
import type { ExerciseDifficulty } from '../domain/value-objects'
import type { TaskPriority } from '../domain/entities/learning-objective'

export interface RoadmapLearningTask {
  roadmapId: string
  phaseId: string
  weekId: string
  taskId: string
  skill: IELTSSection
  taskType: string
  objective: string
  reason: string
  scheduledDate: string
  estimatedMinutes: number
  difficulty?: ExerciseDifficulty
  priority: TaskPriority
  sourceType?: string
  sourceIds?: string[]
  successCriteria?: Array<{ type: string; threshold: number; description: string }>
}

export interface StudyPlanPort {
  getCurrentTask(): Promise<RoadmapLearningTask | null>
  getTaskById(taskId: string): Promise<RoadmapLearningTask | null>
  markTaskFulfilled(taskId: string, accuracy: number): Promise<void>
}
