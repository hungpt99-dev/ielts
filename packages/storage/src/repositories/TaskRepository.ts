import { BaseRepository } from './BaseRepository'
import { taskEntrySchema } from '../schema'
import type { z } from 'zod'

export type TaskEntry = z.infer<typeof taskEntrySchema>

export class TaskRepository extends BaseRepository<TaskEntry> {
  constructor() {
    super('tasks', taskEntrySchema)
  }

  async findByDate(date: string): Promise<TaskEntry[]> {
    const target = date.slice(0, 10)
    const all = await this.findAll()
    return all.filter(t => t.date.slice(0, 10) === target)
  }

  async findByCategory(category: TaskEntry['category']): Promise<TaskEntry[]> {
    return this.queryByIndex('category', category)
  }

  async findPending(): Promise<TaskEntry[]> {
    const all = await this.findAll()
    return all.filter(t => !t.isDone)
  }

  async markAsDone(id: string): Promise<void> {
    await this.update(id, { isDone: true, completedAt: new Date().toISOString() } as Partial<TaskEntry>)
  }

  async markAsNotDone(id: string): Promise<void> {
    await this.update(id, { isDone: false, completedAt: null } as unknown as Partial<TaskEntry>)
  }

  async getStats(): Promise<{ total: number; done: number; pending: number }> {
    const all = await this.findAll()
    const done = all.filter(t => t.isDone).length
    return { total: all.length, done, pending: all.length - done }
  }
}
