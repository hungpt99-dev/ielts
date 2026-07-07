import { safeDb, getDb, isDbOpen } from '@ielts/storage'
import type { LearningEvent, CreateLearningEventInput, AggregationWindow } from './types'
import { SYNC_STATUSES } from './types'

const TABLE_NAME = 'learningEvents'

interface InMemoryStore {
  items: Map<string, LearningEvent>
}

let inMemoryFallback: InMemoryStore | null = null

function getInMemoryStore(): InMemoryStore {
  if (!inMemoryFallback) {
    inMemoryFallback = { items: new Map() }
  }
  return inMemoryFallback
}

export function resetInMemoryStore(): void {
  inMemoryFallback = null
}

function createEvent(input: CreateLearningEventInput): LearningEvent {
  const now = new Date().toISOString()
  return {
    eventId: crypto.randomUUID(),
    eventType: input.eventType,
    source: input.source,
    timestamp: now,
    page: input.page ?? '/',
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    payload: input.payload,
    metadata: input.metadata ?? {},
    sessionId: crypto.randomUUID(),
    correlationId: input.correlationId ?? null,
    createdAt: now,
    syncStatus: 'local_only',
  }
}

function toTable(item: LearningEvent): Record<string, unknown> {
  return {
    id: item.eventId,
    eventType: item.eventType,
    source: item.source,
    timestamp: item.timestamp,
    page: item.page,
    entityType: item.entityType,
    entityId: item.entityId,
    payload: JSON.stringify(item.payload),
    metadata: JSON.stringify(item.metadata),
    sessionId: item.sessionId,
    correlationId: item.correlationId,
    createdAt: item.createdAt,
    syncStatus: item.syncStatus,
  }
}

function fromTable(row: Record<string, unknown>): LearningEvent {
  return {
    eventId: row.id as string,
    eventType: row.eventType as LearningEvent['eventType'],
    source: row.source as LearningEvent['source'],
    timestamp: row.timestamp as string,
    page: row.page as string,
    entityType: row.entityType as LearningEvent['entityType'],
    entityId: row.entityId as LearningEvent['entityId'],
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload as string) : row.payload,
    metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : (row.metadata as Record<string, string>),
    sessionId: row.sessionId as string,
    correlationId: row.correlationId as LearningEvent['correlationId'],
    createdAt: row.createdAt as string,
    syncStatus: row.syncStatus as LearningEvent['syncStatus'],
  } as LearningEvent
}

async function useIndexedDB(): Promise<boolean> {
  try {
    if (!isDbOpen()) return false
    getDb()
    return true
  } catch {
    return false
  }
}

async function persist<T>(dbFn: () => Promise<T>, memFn: () => T): Promise<T> {
  if (await useIndexedDB()) {
    try {
      return await safeDb(dbFn)
    } catch {
      return memFn()
    }
  }
  return memFn()
}

export class LearningEventRepository {
  async save(input: CreateLearningEventInput): Promise<LearningEvent> {
    const event = createEvent(input)
    await persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        await table.add(toTable(event))
      },
      () => {
        getInMemoryStore().items.set(event.eventId, event)
      },
    )
    return event
  }

  async findById(eventId: string): Promise<LearningEvent | undefined> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        const row = await table.get(eventId)
        return row ? fromTable(row as Record<string, unknown>) : undefined
      },
      () => getInMemoryStore().items.get(eventId),
    )
  }

  async findByEventType(eventType: LearningEvent['eventType'], limit = 100): Promise<LearningEvent[]> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        const rows = await table
          .where('eventType')
          .equals(eventType)
          .reverse()
          .limit(limit)
          .toArray()
        return rows.map(r => fromTable(r as Record<string, unknown>))
      },
      () => {
        const store = getInMemoryStore()
        return Array.from(store.items.values())
          .filter(e => e.eventType === eventType)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      },
    )
  }

  async findBySession(sessionId: string): Promise<LearningEvent[]> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        const rows = await table
          .where('sessionId')
          .equals(sessionId)
          .toArray()
        return rows.map(r => fromTable(r as Record<string, unknown>))
      },
      () => {
        const store = getInMemoryStore()
        return Array.from(store.items.values()).filter(e => e.sessionId === sessionId)
      },
    )
  }

  async findByDateRange(start: string, end: string): Promise<LearningEvent[]> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        const rows = await table
          .where('timestamp')
          .between(start, end, true, true)
          .toArray()
        return rows.map(r => fromTable(r as Record<string, unknown>))
      },
      () => {
        const store = getInMemoryStore()
        const startMs = new Date(start).getTime()
        const endMs = new Date(end).getTime()
        return Array.from(store.items.values()).filter(e => {
          const t = new Date(e.timestamp).getTime()
          return t >= startMs && t <= endMs
        })
      },
    )
  }

  async findBySyncStatus(syncStatus: LearningEvent['syncStatus']): Promise<LearningEvent[]> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        const rows = await table
          .where('syncStatus')
          .equals(syncStatus)
          .toArray()
        return rows.map(r => fromTable(r as Record<string, unknown>))
      },
      () => {
        const store = getInMemoryStore()
        return Array.from(store.items.values()).filter(e => e.syncStatus === syncStatus)
      },
    )
  }

  async findAll(limit = 500): Promise<LearningEvent[]> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        const rows = await table
          .orderBy('createdAt')
          .reverse()
          .limit(limit)
          .toArray()
        return rows.map(r => fromTable(r as Record<string, unknown>))
      },
      () => {
        const store = getInMemoryStore()
        return Array.from(store.items.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      },
    )
  }

  async count(): Promise<number> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        return await table.count()
      },
      () => getInMemoryStore().items.size,
    )
  }

  async countByEventType(eventType: LearningEvent['eventType']): Promise<number> {
    return persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        return await table.where('eventType').equals(eventType).count()
      },
      () => {
        const store = getInMemoryStore()
        return Array.from(store.items.values()).filter(e => e.eventType === eventType).length
      },
    )
  }

  async countInWindow(eventType: LearningEvent['eventType'], window: AggregationWindow): Promise<number> {
    const now = Date.now()
    let startMs: number
    switch (window) {
      case 'current_session':
        return this.countByEventType(eventType)
      case 'last_30_minutes':
        startMs = now - 30 * 60 * 1000
        break
      case 'today': {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        startMs = d.getTime()
        break
      }
      case 'last_7_days':
        startMs = now - 7 * 24 * 60 * 60 * 1000
        break
      default:
        return 0
    }
    const end = new Date(now).toISOString()
    const events = await this.findByDateRange(new Date(startMs).toISOString(), end)
    return events.filter(e => e.eventType === eventType).length
  }

  async updateSyncStatus(eventId: string, syncStatus: LearningEvent['syncStatus']): Promise<void> {
    if (!SYNC_STATUSES.includes(syncStatus as typeof SYNC_STATUSES[number])) return

    await persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        await table.update(eventId, { syncStatus })
      },
      () => {
        const store = getInMemoryStore()
        const event = store.items.get(eventId)
        if (event) {
          store.items.set(eventId, { ...event, syncStatus })
        }
      },
    )
  }

  async bulkSave(inputs: CreateLearningEventInput[]): Promise<LearningEvent[]> {
    const events = inputs.map(input => createEvent(input))

    await persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        await table.bulkAdd(events.map(toTable))
      },
      () => {
        const store = getInMemoryStore()
        for (const event of events) {
          store.items.set(event.eventId, event)
        }
      },
    )

    return events
  }

  async delete(eventId: string): Promise<void> {
    await persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        await table.delete(eventId)
      },
      () => {
        getInMemoryStore().items.delete(eventId)
      },
    )
  }

  async clear(): Promise<void> {
    await persist(
      async () => {
        const table = getDb().table(TABLE_NAME)
        await table.clear()
      },
      () => {
        getInMemoryStore().items.clear()
      },
    )
  }

  async deleteOlderThan(date: string): Promise<number> {
    const events = await this.findByDateRange('1970-01-01T00:00:00.000Z', date)
    let deleted = 0
    for (const event of events) {
      await this.delete(event.eventId)
      deleted++
    }
    return deleted
  }
}

export const learningEventRepository = new LearningEventRepository()
