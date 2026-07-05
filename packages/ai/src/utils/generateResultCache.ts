export interface GenerateResultCacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface GenerateResultCacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
}

export interface GenerateResultCacheOptions<T = unknown> {
  ttlMs?: number
  maxSize?: number
  serializer?: (data: T) => string
}

export class AiGenerateResultCache<T = unknown> {
  private storage: Map<string, GenerateResultCacheEntry<T>>
  private pending: Map<string, Promise<T>>
  private ttl: number
  private maxSize: number
  private hits: number
  private misses: number
  private evictions: number

  constructor(options: GenerateResultCacheOptions<T> = {}) {
    this.storage = new Map()
    this.pending = new Map()
    this.ttl = options.ttlMs ?? 60 * 60 * 1000
    this.maxSize = options.maxSize ?? 1000
    this.hits = 0
    this.misses = 0
    this.evictions = 0
  }

  get(key: string): T | null {
    const entry = this.storage.get(key)
    if (!entry) {
      this.misses++
      return null
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.storage.delete(key)
      this.evictions++
      this.misses++
      return null
    }
    this.hits++
    return entry.data
  }

  set(key: string, data: T, ttlOverride?: number): void {
    if (this.storage.size >= this.maxSize) {
      this.evictOne()
    }
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlOverride ?? this.ttl,
    })
  }

  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    ttlOverride?: number,
  ): Promise<T> {
    const cached = this.get(key)
    if (cached !== null) return cached

    const inFlight = this.pending.get(key)
    if (inFlight) return inFlight

    const promise = factory()
      .then((data) => {
        this.pending.delete(key)
        this.set(key, data, ttlOverride)
        return data
      })
      .catch((error: unknown) => {
        this.pending.delete(key)
        throw error
      })

    this.pending.set(key, promise)
    return promise
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
    this.pending.clear()
    this.hits = 0
    this.misses = 0
    this.evictions = 0
  }

  size(): number {
    return this.storage.size
  }

  stats(): GenerateResultCacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.storage.size,
    }
  }

  keys(): string[] {
    return Array.from(this.storage.keys())
  }

  static generateKey(...parts: string[]): string {
    return parts.join(':')
  }

  private evictOne(): void {
    const oldest = this.storage.keys().next()
    if (!oldest.done && oldest.value !== undefined) {
      this.storage.delete(oldest.value)
      this.evictions++
    }
  }
}
