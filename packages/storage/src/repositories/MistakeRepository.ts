import { BaseRepository } from './BaseRepository'
import { mistakeEntrySchema } from '../schema'
import type { z } from 'zod'

export type MistakeEntry = z.infer<typeof mistakeEntrySchema>

export class MistakeRepository extends BaseRepository<MistakeEntry> {
  constructor() {
    super('mistakes', mistakeEntrySchema)
  }

  async findBySkill(skill: MistakeEntry['skill']): Promise<MistakeEntry[]> {
    return this.queryByIndex('skill', skill)
  }

  async findByStatus(status: MistakeEntry['status']): Promise<MistakeEntry[]> {
    return this.queryByIndex('status', status)
  }

  async search(query: string): Promise<MistakeEntry[]> {
    return this.searchByText(query, ['mistake', 'correction', 'explanation', 'source', 'topic'])
  }

  async getStats(): Promise<{
    total: number
    newCount: number
    reviewingCount: number
    fixedCount: number
    bySkill: Record<string, number>
    dueForReview: number
  }> {
    const all = await this.findAll()
    const bySkill: Record<string, number> = {}
    let newCount = 0
    let reviewingCount = 0
    let fixedCount = 0
    for (const e of all) {
      if (e.status === 'new') newCount++
      else if (e.status === 'reviewed') reviewingCount++
      else if (e.status === 'resolved') fixedCount++
      bySkill[e.skill] = (bySkill[e.skill] || 0) + 1
    }
    const dueForReview = all.filter(e => {
      if (e.status === 'resolved') return false
      if (e.status === 'new') return true
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(e.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysSinceUpdate >= 1
    }).length
    return { total: all.length, newCount, reviewingCount, fixedCount, bySkill, dueForReview }
  }
}
