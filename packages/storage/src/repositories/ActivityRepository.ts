import { z } from 'zod'
import { BaseRepository } from './BaseRepository'

export const activitySchema = z.object({
  id: z.string(),
  type: z.enum(['reading', 'listening', 'writing', 'speaking', 'vocabulary', 'grammar', 'mistake-review']),
  skill: z.string(),
  title: z.string(),
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  estimatedMinutes: z.number(),
  content: z.string(),
  questions: z.string(),
  source: z.string(),
  generatedById: z.string(),
  schemaVersion: z.string(),
  createdAt: z.string(),
})

export interface ActivityEntry {
  id: string
  type: string
  skill: string
  title: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedMinutes: number
  content: string
  questions: string
  source: string
  generatedById: string
  schemaVersion: string
  createdAt: string
  [key: string]: unknown
}

export class ActivityRepository {
  private repo: BaseRepository<ActivityEntry>

  constructor() {
    this.repo = new BaseRepository<ActivityEntry>('activities', activitySchema)
  }

  async save(activity: ActivityEntry): Promise<ActivityEntry> {
    const entry: Omit<ActivityEntry, 'id'> & { id?: string } = { ...activity }
    return this.repo.create(entry)
  }

  async getById(id: string): Promise<ActivityEntry | undefined> {
    return this.repo.findById(id)
  }

  async findBySkill(skill: string): Promise<ActivityEntry[]> {
    return this.repo.queryByIndex('skill', skill)
  }

  async findByTopic(topic: string): Promise<ActivityEntry[]> {
    return this.repo.queryByIndex('topic', topic)
  }

  async findAll(): Promise<ActivityEntry[]> {
    return this.repo.findAll()
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
