import { STORAGE_KEYS, DEFAULT_APP_CONFIG, AI_PROVIDER_DEFINITIONS } from '@ielts/config'
import { DatabaseService } from '../services/storage/Database'

export function createDbMessageRepository() {
  return {
    async findSession(sessionId: string) {
      try {
        const msgs = await DatabaseService.queryByIndex('aiContents', 'sessionId', sessionId)
        return msgs.length > 0 ? { id: sessionId, messages: msgs } : null
      } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
    },
    async saveSession(session: any) {
      try {
        await DatabaseService.safePut('aiContents', {
          id: session.id,
          type: 'general',
          prompt: 'chat-session',
          content: JSON.stringify(session),
          title: 'Chat Session',
          topic: 'general',
          model: 'engine',
          tokens: 0,
          tags: [],
          isFavorite: false,
          createdAt: new Date().toISOString(),
        })
      } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
      }
    },
    async appendMessages(sessionId: string, messages: any[]) {
      for (const msg of messages) {
        try {
          await DatabaseService.safePut('aiContents', {
            id: msg.id,
            type: msg.type ?? 'general',
            prompt: msg.prompt ?? 'chat-message',
            content: msg.content ?? '',
            title: msg.title ?? '',
            topic: msg.topic ?? 'general',
            model: msg.model ?? '',
            tokens: msg.tokens ?? 0,
            tags: msg.tags ?? [],
            isFavorite: msg.isFavorite ?? false,
            createdAt: msg.createdAt ?? new Date().toISOString(),
            sessionId,
          })
        } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      }
    },
  }
}

export function createDbMemoryRepository() {
  const store = new Map<string, any>()
  return {
    async get(learnerId: string) {
      if (store.has(learnerId)) return store.get(learnerId)
      try {
        const raw = localStorage.getItem(`${STORAGE_KEYS.localStorage.tutorMemoryPrefix}${learnerId}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          store.set(learnerId, parsed)
          return parsed
        }
      } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
      }
      return null
    },
    async save(memory: any) {
      store.set(memory.learnerId, memory)
      try { localStorage.setItem(`${STORAGE_KEYS.localStorage.tutorMemoryPrefix}${memory.learnerId}`, JSON.stringify(memory)) } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
      }
    },
  }
}

export function tryParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return raw as any }
  }
  return raw as T
}

export function extractText(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  if (!raw || raw === '""' || raw === '{}') return ''
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string') return parsed
    return parsed?.passage || parsed?.text || parsed?.transcript || ''
  } catch {
    return raw
  }
}

export function normalizeEntry(entry: any, sourceTable: string): any {
  const id = entry.id || ''
  const title = entry.title || 'Untitled'
  const content = extractText(entry.content)
  const topic = entry.topic || 'General'
  const rawDiff = String(entry.difficulty || '').toLowerCase()
  const difficulty = rawDiff === 'beginner' || rawDiff === 'easy' ? 'beginner' : rawDiff === 'advanced' || rawDiff === 'hard' ? 'advanced' : 'intermediate'

  let questions = entry.questions
  if (!questions || (typeof questions === 'string' && questions === '[]')) {
    try {
      const notes = typeof entry.notes === 'string' ? JSON.parse(entry.notes) : entry.notes
      questions = JSON.stringify(notes?.questions || [])
    } catch { questions = '[]' }
  }
  if (!Array.isArray(questions) && typeof questions !== 'string') questions = '[]'
  if (Array.isArray(questions)) questions = JSON.stringify(questions)

  const estimatedMinutes = entry.estimatedMinutes || Math.max(1, Math.ceil((content.split(/\s+/).filter(Boolean).length || 1) / 80))
  const skill = (entry.skill as string) || 'reading'
  const source = entry.source === 'built-in' || sourceTable === 'readingPassages' ? 'built-in' : entry.source === 'user-created' || sourceTable === 'passages' ? 'user-created' : 'ai-generated'
  const metadata = tryParse(entry.metadata, {})

  if (skill === 'speaking') {
    console.log('[normalizeEntry] speaking:', JSON.stringify({ id: id.slice(0, 25), title: title.slice(0, 30), source, hasPhrases: !!(metadata as any)?.phrases }))
  }

  return { id, title, content, topic, difficulty, questions, estimatedMinutes, skill, source, metadata }
}

export function createDependencyRepos() {
  return {
    sessionRepository: {
      async getById(id: string) {
        try {
          const all = await DatabaseService.safeGetAll('aiContents')
          const found = all.find((a: any) => a.id === id)
          if (!found) return null
          if (found.prompt === 'learning-session' && found.content) {
            return JSON.parse(found.content)
          }
          return found
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
      },
      async save(session: any) {
        try {
          await DatabaseService.safePut('aiContents', {
            id: session.id,
            type: 'general' as const,
            prompt: 'learning-session',
            content: JSON.stringify(session),
            title: 'Session',
            topic: 'general',
            model: 'engine',
            tokens: 0,
            tags: [],
            isFavorite: false,
            createdAt: new Date().toISOString(),
          })
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findActive() {
        try {
          const all = await DatabaseService.safeGetAll('aiContents')
          return all
            .filter((a: any) => a.prompt === 'learning-session' && a.content)
            .map((a: any) => JSON.parse(a.content))
            .filter((s: any) => s.status === 'in-progress' || s.status === 'prepared')
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
    },
    attemptRepository: {
      async getById(id: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingPracticeSessions')
          return all.find((a: any) => a.id === id) ?? null
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
      },
      async save(attempt: any) {
        try {
          await DatabaseService.safePut('readingPracticeSessions', {
            id: attempt.id,
            passageId: attempt.passageId ?? attempt.exerciseId ?? '',
            title: attempt.title ?? 'Practice Session',
            topic: attempt.topic ?? 'general',
            passageText: attempt.passageText ?? '',
            questions: attempt.questions ?? [],
            answers: Array.isArray(attempt.answers) ? Object.fromEntries(attempt.answers.map((a: any, i: number) => [`${i}`, a])) : (attempt.answers ?? {}),
            score: attempt.score ?? 0,
            totalQuestions: attempt.totalQuestions ?? 0,
            accuracy: attempt.accuracy ?? 0,
            timeSpentSeconds: attempt.timeSpentSeconds ?? 0,
            mistakes: attempt.mistakes ?? [],
            createdAt: attempt.createdAt ?? new Date().toISOString(),
          })
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findBySession(sessionId: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingPracticeSessions')
          return all.filter((a: any) => a.sessionId === sessionId)
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
    },
    outcomeRepository: {
      async save(outcome: any) {
        try {
          const { getDb } = await import('@ielts/storage')
          const db = getDb()
          await db.progressRecords.put({
            id: outcome.sessionId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: outcome.completedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            metric: `skill.${outcome.skill}.score`,
            value: outcome.maximumScore > 0 ? Math.round((outcome.score / outcome.maximumScore) * 100) : 0,
            unit: 'percent',
            createdAt: outcome.completedAt || new Date().toISOString(),
          })
        } catch { /* outcome persistence is non-critical */ }
      },
      async findRecent(query?: any) {
        try {
          const all = await DatabaseService.safeGetAll('progressRecords')
          let filtered = all.filter((o: any) => o.metric?.startsWith('skill.'))
          if (query?.skill) filtered = filtered.filter((o: any) => o.metric?.includes(`skill.${query.skill}`))
          filtered.sort((a: any, b: any) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
          return query?.limit ? filtered.slice(0, query.limit) : filtered
        } catch { return [] }
      },
    },
    exerciseRepository: {
      async getById(id: string) {
        try {
          const tables = ['readingExercises', 'listeningExercises', 'readingPassages', 'passages'] as const
          for (const table of tables) {
            const item = await DatabaseService.safeGetById<any>(table, id).catch(() => undefined)
            if (item) return normalizeEntry(item, table)
          }
          return null
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
      },
      async save(exercise: any) {
        try {
          const { exerciseToEntry } = await import('../services/learning/adapters/exercise-to-entry')
          await DatabaseService.safePut('readingExercises', exerciseToEntry(exercise))
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async delete(id: string) {
        try {
          await Promise.all([
            DatabaseService.safeRemove('readingExercises', id).catch(() => {}),
            DatabaseService.safeRemove('listeningExercises', id).catch(() => {}),
            DatabaseService.safeRemove('passages', id).catch(() => {}),
          ])
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findAll(skill?: string) {
        try {
          const [reading, listening, seeded, userContent] = await Promise.all([
            DatabaseService.safeGetAll<any>('readingExercises').catch(() => []),
            DatabaseService.safeGetAll<any>('listeningExercises').catch(() => []),
            DatabaseService.safeGetAll<any>('readingPassages').catch(() => []),
            DatabaseService.safeGetAll<any>('passages').catch(() => []),
          ])
          const seen = new Set<string>()
          const all: any[] = []
          for (const entry of [
            ...reading.map((e: any) => normalizeEntry(e, 'readingExercises')),
            ...listening.map((e: any) => normalizeEntry(e, 'listeningExercises')),
            ...seeded.map((e: any) => normalizeEntry(e, 'readingPassages')),
            ...userContent.map((e: any) => normalizeEntry(e, 'passages')),
          ]) {
            if (!seen.has(entry.id)) {
              seen.add(entry.id)
              all.push(entry)
            }
          }
          return skill ? all.filter((e: any) => e.skill === skill) : all
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
    },
    progressRepository: {
      async getSkillProgress() {
        try {
          const records = await DatabaseService.safeGetAll('progressRecords')
          const bySkill: Record<string, { totalValue: number; count: number }> = {}
          for (const r of records as any[]) {
            const skill = r.category || 'general'
            if (!bySkill[skill]) bySkill[skill] = { totalValue: 0, count: 0 }
            bySkill[skill].totalValue += (r.value ?? 0)
            bySkill[skill].count++
          }
          const result: Record<string, number> = {}
          for (const [skill, data] of Object.entries(bySkill)) {
            result[skill] = data.count > 0 ? Math.round(data.totalValue / data.count) : 0
          }
          return result
        } catch {
          return {}
        }
      },
      async updateSkillProgress(skill: string, accuracy: number) {
        try {
          await DatabaseService.safePut('progressRecords', {
            id: `skill-progress-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'skill-progress' as const,
            value: accuracy,
            date: new Date().toISOString().slice(0, 10),
            category: skill,
            label: `${skill} progress update`,
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* non-critical */
        }
      },
      async getOverallProgress() {
        try {
          const records = await DatabaseService.safeGetAll('progressRecords')
          const outcomes = (records as any[]).filter(
            (r: any) => r.type === 'learning-outcome' || r.type === 'learning_session_completed',
          )
          if (outcomes.length === 0) return 0
          const total = outcomes.reduce((s: number, r: any) => s + (r.value ?? 0), 0)
          return Math.round(total / outcomes.length)
        } catch {
          return 0
        }
      },
      async updateOverallProgress() {
        try {
          const overall = await this.getOverallProgress()
          await DatabaseService.safePut('progressRecords', {
            id: `overall-progress-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'overall-progress' as const,
            value: overall,
            date: new Date().toISOString().slice(0, 10),
            category: 'overall',
            label: 'Overall progress snapshot',
            createdAt: new Date().toISOString(),
          })
        } catch {
          /* non-critical */
        }
      },
    },
    mistakeRepository: {
      async save(mistake: any) {
        try { await DatabaseService.safePut('mistakes', mistake) } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findRecent(skill: string, limit = 10) {
        try {
          const all = await DatabaseService.safeGetAll('mistakes')
          const filtered = all.filter((m: any) => !skill || m.skill === skill)
          filtered.sort((a: any, b: any) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
          return filtered.slice(0, limit)
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
      async findByPattern() { return [] },
      async getRecurringPatterns() { return [] },
    },
    vocabularyRepository: {
      async getDueForReview(limit = 10) {
        try {
          const all = await DatabaseService.safeGetAll('vocabulary')
          const now = new Date().toISOString()
          return all.filter((v: any) => v.nextReviewAt && v.nextReviewAt <= now).slice(0, limit)
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
      return [] }
      },
      async getByTopic(topic: string) {
        try {
          const all = await DatabaseService.safeGetAll('vocabulary')
          return all.filter((v: any) => v.topic === topic)
        } catch {
          return []
        }
      },
      async updateMastery(wordId: string, mastery: number) {
        try {
          const all = await DatabaseService.safeGetAll('vocabulary')
          const entry = all.find((v: any) => v.id === wordId || v.word === wordId)
          if (entry) {
            await DatabaseService.safePut('vocabulary', { ...entry, mastery, updatedAt: new Date().toISOString() })
          }
        } catch {
          /* non-critical */
        }
      },
      async markReviewed(wordId: string) {
        try {
          const all = await DatabaseService.safeGetAll('vocabulary')
          const entry = all.find((v: any) => v.id === wordId || v.word === wordId)
          if (entry) {
            const now = new Date().toISOString()
            const nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            await DatabaseService.safePut('vocabulary', { ...entry, lastReviewedAt: now, nextReviewAt: nextReview, updatedAt: now })
          }
        } catch {
          /* non-critical */
        }
      },
    },
    eventPublisher: {
      async publish(event: any) {
        try {
          await DatabaseService.safePut('aiContents', {
            id: event.id ?? `evt-${Date.now()}`,
            type: event.type === 'learning_session_completed' || event.type === 'roadmap_task_fulfilled' ? 'general' : 'general',
            prompt: event.type ?? 'learning-event',
            content: JSON.stringify(event),
            title: event.type ?? 'Event',
            topic: event.skill ?? 'general',
            model: 'engine',
            tokens: 0,
            tags: [],
            isFavorite: false,
            createdAt: event.occurredAt ?? new Date().toISOString(),
          })
          if (event.type === 'learning_session_completed' || event.type === 'roadmap_task_fulfilled') {
            await DatabaseService.safePut('progressRecords', {
              id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: event.type as any,
              value: event.accuracy ?? event.score ?? 0,
              date: new Date().toISOString().slice(0, 10),
              category: event.skill ?? 'general',
              label: event.type,
              createdAt: new Date().toISOString(),
              metadata: JSON.stringify(event),
            })
          }
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async publishMany(events: any[]) {
        for (const event of events) {
          try {
            await this.publish(event)
          } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
          }
        }
      },
    },
  }
}
