export interface TtlCache<T> {
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
