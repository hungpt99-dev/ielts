import type { LearningSessionRepository, LearningAttemptRepository, LearningOutcomeRepository, ExerciseRepository } from '@ielts/learning-engine'
import { safeStorageGet, safeStorageSet } from '../../utils/safe-chrome'

const SESSIONS_KEY = 'engine-sessions'
const ATTEMPTS_KEY = 'engine-attempts'
const EXERCISES_KEY = 'engine-exercises'
const OUTCOMES_KEY = 'engine-outcomes'

async function getAll<T>(key: string): Promise<T[]> {
  const result = await safeStorageGet<T[]>(key)
  return result[key] ?? []
}

async function saveOne<T extends { id: string }>(key: string, item: T): Promise<void> {
  const items = await getAll<T>(key)
  const idx = items.findIndex(i => i.id === item.id)
  if (idx >= 0) items[idx] = item
  else items.push(item)
  await safeStorageSet({ [key]: items })
}

export const extensionSessionRepository: LearningSessionRepository = {
  async getById(id: string) {
    const sessions = await getAll<any>(SESSIONS_KEY)
    return sessions.find(s => s.id === id) ?? null
  },
  async save(session: any) {
    await saveOne(SESSIONS_KEY, session)
  },
  async findActive() {
    const sessions = await getAll<any>(SESSIONS_KEY)
    return sessions.filter(s => s.status === 'in-progress' || s.status === 'prepared')
  },
}

export const extensionAttemptRepository: LearningAttemptRepository = {
  async getById(id: string) {
    const attempts = await getAll<any>(ATTEMPTS_KEY)
    return attempts.find(a => a.id === id) ?? null
  },
  async save(attempt: any) {
    await saveOne(ATTEMPTS_KEY, attempt)
  },
  async findBySession(sessionId: string) {
    const attempts = await getAll<any>(ATTEMPTS_KEY)
    return attempts.filter(a => a.sessionId === sessionId)
  },
}

export const extensionExerciseRepository: ExerciseRepository = {
  async getById(id: string) {
    const exercises = await getAll<any>(EXERCISES_KEY)
    return exercises.find(e => e.id === id) ?? null
  },
  async save(exercise: any) {
    await saveOne(EXERCISES_KEY, exercise)
  },
}

export const extensionOutcomeRepository: LearningOutcomeRepository = {
  async save(outcome: any) {
    await saveOne(OUTCOMES_KEY, outcome)
  },
  async findRecent(query?: { skill?: string; limit?: number }) {
    let outcomes = await getAll<any>(OUTCOMES_KEY)
    if (query?.skill) outcomes = outcomes.filter(o => o.skill === query.skill)
    outcomes.sort((a, b) => String(b.completedAt ?? '').localeCompare(String(a.completedAt ?? '')))
    return query?.limit ? outcomes.slice(0, query.limit) : outcomes
  },
}
