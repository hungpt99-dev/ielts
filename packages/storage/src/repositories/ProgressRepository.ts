import { BaseRepository } from './BaseRepository'
import { progressRecordSchema, topicProgressSchema, mockTestEntrySchema, grammarNoteSchema } from '../schema'
import type { z } from 'zod'

export type ProgressRecord = z.infer<typeof progressRecordSchema>
export type TopicProgress = z.infer<typeof topicProgressSchema>
export type MockTestEntry = z.infer<typeof mockTestEntrySchema>
export type GrammarNote = z.infer<typeof grammarNoteSchema>

export class ProgressRecordRepository extends BaseRepository<ProgressRecord> {
  constructor() {
    super('progressRecords', progressRecordSchema)
  }

  async findByDateRange(start: string, end: string): Promise<ProgressRecord[]> {
    const all = await this.findAll()
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    return all.filter(item => {
      const t = new Date(item.date).getTime()
      return t >= s && t <= e
    })
  }

  async findBySkill(skill: ProgressRecord['skill']): Promise<ProgressRecord[]> {
    return this.queryByIndex('skill', skill)
  }
}

export class TopicProgressRepository extends BaseRepository<TopicProgress> {
  constructor() {
    super('topicsProgress', topicProgressSchema)
  }

  async findByTopicId(topicId: string): Promise<TopicProgress | undefined> {
    const results = await this.queryByIndex('topicId', topicId)
    return results[0]
  }
}

export class MockTestRepository extends BaseRepository<MockTestEntry> {
  constructor() {
    super('mockTests', mockTestEntrySchema)
  }
}

export class GrammarNoteRepository extends BaseRepository<GrammarNote> {
  constructor() {
    super('grammarNotes', grammarNoteSchema)
  }

  async findByTopic(topic: string): Promise<GrammarNote[]> {
    return this.queryByIndex('topic', topic)
  }

  async findByStatus(status: GrammarNote['status']): Promise<GrammarNote[]> {
    return this.queryByIndex('status', status)
  }
}
