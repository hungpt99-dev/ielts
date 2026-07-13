export { CachedActivityGenerator } from './cached-activity-generator'

export interface CacheEntry<T> {
  key: string
  value: T
  createdAt: number
  ttlMs: number
}

export class InMemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private defaultTtlMs: number

  constructor(defaultTtlMs: number = 5 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      key,
      value,
      createdAt: Date.now(),
      ttlMs: ttlMs ?? this.defaultTtlMs,
    })
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }
}
