export interface CacheEntry<T> {
  data: T
  generatedAt: string
}

export interface CacheRepositoryConfig {
  ttlMs: number
  storageKey: string
}

export class CacheRepository<T> {
  private readonly config: CacheRepositoryConfig

  constructor(config: CacheRepositoryConfig) {
    this.config = config
  }

  get(): CacheEntry<T> | null {
    try {
      const raw = localStorage.getItem(this.config.storageKey)
      if (!raw) return null

      const entry = JSON.parse(raw) as CacheEntry<T>
      if (typeof entry !== 'object' || entry === null) return null
      if (typeof entry.data !== 'object' || typeof entry.generatedAt !== 'string') {
        this.invalidate()
        return null
      }

      if (Date.now() - new Date(entry.generatedAt).getTime() > this.config.ttlMs) {
        this.invalidate()
        return null
      }

      return entry
    } catch {
      return null
    }
  }

  set(data: T): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        generatedAt: new Date().toISOString(),
      }
      localStorage.setItem(this.config.storageKey, JSON.stringify(entry))
    } catch {
      /* quota exceeded or storage unavailable */
    }
  }

  invalidate(): void {
    try {
      localStorage.removeItem(this.config.storageKey)
    } catch {
      /* ignore */
    }
  }
}
