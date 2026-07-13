import type { MistakeRepository } from '@ielts/learning-engine'
import { safeStorageGet, safeStorageSet } from '../../utils/safe-chrome'

const MISTAKES_KEY = 'engine-mistakes'

async function getAll(): Promise<any[]> {
  const result = await safeStorageGet<any[]>(MISTAKES_KEY)
  return result[MISTAKES_KEY] ?? []
}

export const extensionMistakeRepository: MistakeRepository = {
  async save(mistake: any) {
    const mistakes = await getAll()
    const idx = mistakes.findIndex(m => m.id === mistake.id)
    if (idx >= 0) mistakes[idx] = mistake
    else mistakes.push(mistake)
    await safeStorageSet({ [MISTAKES_KEY]: mistakes })
  },

  async findRecent(skill?: string, limit = 10) {
    let mistakes = await getAll()
    if (skill) mistakes = mistakes.filter(m => m.skill === skill)
    mistakes.sort((a, b) => String(b.occurredAt ?? '').localeCompare(String(a.occurredAt ?? '')))
    return mistakes.slice(0, limit)
  },

  async findByPattern(skill: string, pattern: string) {
    const mistakes = await getAll()
    return mistakes.filter(m => m.skill === skill && m.category === pattern)
  },

  async getRecurringPatterns(skill?: string) {
    const mistakes = await getAll()
    const filtered = skill ? mistakes.filter(m => m.skill === skill) : mistakes
    const patterns = new Map<string, { pattern: string; skill: string; frequency: number }>()
    for (const m of filtered) {
      const key = `${m.skill}:${m.category}`
      const existing = patterns.get(key)
      if (existing) existing.frequency++
      else patterns.set(key, { pattern: m.category, skill: m.skill, frequency: 1 })
    }
    return Array.from(patterns.values())
  },
}
