import type { Table } from 'dexie'
import { z } from 'zod'
import { getDb, safeDb } from '../db'
import { EntityNotFoundError, ValidationError } from '../errors'

export interface RepositoryItem {
  id: string
  [key: string]: unknown
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class BaseRepository<T extends RepositoryItem> {
  protected tableName: string
  protected schema: z.ZodType<T>

  constructor(tableName: string, schema: z.ZodType<T>) {
    this.tableName = tableName
    this.schema = schema
  }

  protected getTable(): Table<T, string> {
    const db = getDb()
    return db.table(this.tableName) as Table<T, string>
  }

  protected validate(item: unknown): T {
    const result = this.schema.safeParse(item)
    if (!result.success) {
      const flattened = result.error.flatten()
      const messages = Object.values(flattened.fieldErrors).flat()
      throw new ValidationError(
        `${this.tableName}: ${messages.join('; ')}`,
        result.error,
      )
    }
    return result.data
  }

  async findAll(): Promise<T[]> {
    return safeDb(async () => {
      return (await this.getTable().toArray()) as T[]
    })
  }

  async findAllPaginated(params: PaginationParams = {}): Promise<PaginatedResult<T>> {
    return safeDb(async () => {
      const page = Math.max(1, params.page ?? 1)
      const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20))
      const total = await this.getTable().count()
      const totalPages = Math.ceil(total / pageSize)
      const data = (await this.getTable()
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .toArray()) as T[]
      return { data, total, page, pageSize, totalPages }
    })
  }

  async findById(id: string): Promise<T | undefined> {
    return safeDb(async () => {
      return (await this.getTable().get(id)) as T | undefined
    })
  }

  async findByIdOrThrow(id: string): Promise<T> {
    const item = await this.findById(id)
    if (!item) {
      throw new EntityNotFoundError(this.tableName, id)
    }
    return item
  }

  async create(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    return safeDb(async () => {
      const now = new Date().toISOString()
      const entry = {
        ...item,
        id: item.id || crypto.randomUUID(),
        createdAt: (item as Record<string, unknown>).createdAt || now,
        updatedAt: (item as Record<string, unknown>).updatedAt || now,
      } as unknown as T
      const validated = this.validate(entry)
      await this.getTable().add(validated)
      return validated
    })
  }

  async createReturningId(item: Omit<T, 'id'> & { id?: string }): Promise<string> {
    const created = await this.create(item)
    return created.id
  }

  async update(id: string, changes: Partial<T>): Promise<void> {
    return safeDb(async () => {
      const existing = await this.findById(id)
      if (!existing) {
        throw new EntityNotFoundError(this.tableName, id)
      }
      const updated = {
        ...existing,
        ...changes,
        updatedAt: new Date().toISOString(),
      } as T
      this.validate(updated)
      await this.getTable().put(updated)
    })
  }

  async patch(id: string, changes: Partial<T>): Promise<T | undefined> {
    return safeDb(async () => {
      const existing = await this.findById(id)
      if (!existing) return undefined
      const updated = {
        ...existing,
        ...changes,
        updatedAt: new Date().toISOString(),
      } as T
      this.validate(updated)
      await this.getTable().put(updated)
      return updated
    })
  }

  async delete(id: string): Promise<void> {
    return safeDb(async () => {
      await this.getTable().delete(id)
    })
  }

  async count(): Promise<number> {
    return safeDb(async () => {
      return await this.getTable().count()
    })
  }

  async exists(id: string): Promise<boolean> {
    const item = await this.findById(id)
    return item !== undefined
  }

  async bulkCreate(items: T[]): Promise<number> {
    return safeDb(async () => {
      const validated = items.map(item => this.validate(item))
      await this.getTable().bulkAdd(validated)
      return validated.length
    })
  }

  async bulkUpsert(items: T[]): Promise<number> {
    return safeDb(async () => {
      const validated = items.map(item => this.validate(item))
      await this.getTable().bulkPut(validated)
      return validated.length
    })
  }

  async clear(): Promise<void> {
    return safeDb(async () => {
      await this.getTable().clear()
    })
  }

  async queryByIndex(index: string, value: unknown): Promise<T[]> {
    return safeDb(async () => {
      return (await this.getTable()
        .where(index)
        .equals(value as never)
        .toArray()) as T[]
    })
  }

  async findByDateRange(field: string, start: string, end: string): Promise<T[]> {
    return safeDb(async () => {
      const all = await this.findAll()
      const s = new Date(start).getTime()
      const e = new Date(end).getTime()
      return all.filter(item => {
        const val = (item as Record<string, unknown>)[field]
        if (typeof val !== 'string') return false
        const t = new Date(val).getTime()
        return t >= s && t <= e
      })
    })
  }

  async searchByText(query: string, fields: string[]): Promise<T[]> {
    return safeDb(async () => {
      const all = await this.findAll()
      const lower = query.toLowerCase()
      return all.filter(item => {
        const obj = item as Record<string, unknown>
        return fields.some(field => {
          const val = obj[field]
          return typeof val === 'string' && val.toLowerCase().includes(lower)
        })
      })
    })
  }
}
