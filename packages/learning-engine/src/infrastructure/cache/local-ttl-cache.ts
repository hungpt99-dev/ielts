export interface CachePort<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
  getOrSet(key: string, factory: () => Promise<T>): Promise<T>
  delete(key: string): void
  clear(): void
  keys(): string[]
}

export function generateCacheKey(...parts: string[]): string {
  return parts.join(':')
}

export class LocalCache<T> implements CachePort<T> {
  private store = new Map<string, { value: T; expiresAt: number }>()
  private readonly ttlMs: number
  private readonly maxSize: number

  constructor(opts: { ttlMs?: number; maxSize?: number } = {}) {
    this.ttlMs = opts.ttlMs ?? 120_000
    this.maxSize = opts.maxSize ?? 30
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value
      if (firstKey !== undefined) this.store.delete(firstKey)
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }

  async getOrSet(key: string, factory: () => Promise<T>): Promise<T> {
    const cached = this.get(key)
    if (cached !== undefined) return cached
    const value = await factory()
    this.set(key, value)
    return value
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  keys(): string[] {
    this.evictExpired()
    return Array.from(this.store.keys())
  }

  private evictExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }
}
