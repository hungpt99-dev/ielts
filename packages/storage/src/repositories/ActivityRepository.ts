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
  topicMetadata: z
    .object({
      requestedTopic: z.string(),
      generatedTopic: z.string(),
      title: z.string(),
      source: z.enum(['ai-generated', 'curated', 'imported']),
    })
    .optional(),
  topicAlignment: z.enum(['matched', 'related', 'mismatched', 'unknown']).optional(),
})

export interface TopicMetadataEntry {
  requestedTopic: string
  generatedTopic: string
  title: string
  source: 'ai-generated' | 'curated' | 'imported'
}

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
  topicMetadata?: TopicMetadataEntry
  topicAlignment?: 'matched' | 'related' | 'mismatched' | 'unknown'
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
