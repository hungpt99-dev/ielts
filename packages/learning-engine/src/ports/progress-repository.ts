import type { SkillProgress } from '../domain/entities/skill-evidence'

export interface ProgressRepository {
  getSkillProgress(skill: string): Promise<SkillProgress | null>
  updateSkillProgress(skill: string, progress: SkillProgress): Promise<void>
  getOverallProgress(): Promise<number>
  updateOverallProgress(percent: number): Promise<void>
}
