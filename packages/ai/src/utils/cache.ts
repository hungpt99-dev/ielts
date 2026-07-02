export class AiCache<T = unknown> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private ttl: number

  constructor(ttlMs = 60 * 60 * 1000) {
    this.ttl = ttlMs
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}
