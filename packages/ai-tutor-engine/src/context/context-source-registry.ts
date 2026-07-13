import type { TutorContextSource, TutorContextItem } from '../domain/entities/learner-context'

export interface ContextSource<T> {
  source: TutorContextSource
  collect(): Promise<TutorContextItem<T> | null>
  priority: number
}

export class ContextSourceRegistry {
  private sources: Map<TutorContextSource, ContextSource<unknown>> = new Map()

  register<T>(source: ContextSource<T>): void {
    this.sources.set(source.source, source)
  }

  get<T>(source: TutorContextSource): ContextSource<T> | undefined {
    return this.sources.get(source) as ContextSource<T> | undefined
  }

  getAll(): ContextSource<unknown>[] {
    return Array.from(this.sources.values()).sort((a, b) => a.priority - b.priority)
  }

  async collectAll(): Promise<TutorContextItem<unknown>[]> {
    const results: TutorContextItem<unknown>[] = []
    for (const source of this.getAll()) {
      try {
        const item = await source.collect()
        if (item) results.push(item)
      } catch {
        /* source unavailable */
      }
    }
    return results
  }
}
