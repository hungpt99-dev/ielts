import type { CefrLevel, LifecyclePhase } from '../domain/constants'
import type { Word } from '../domain/entities'
import type { PartOfSpeech } from '../domain/value-objects'

export interface SearchFilters {
  topics?: string[]
  cefrLevels?: CefrLevel[]
  lifecyclePhases?: LifecyclePhase[]
  partOfSpeech?: PartOfSpeech
}

export interface SearchOptions {
  query: string
  filters?: SearchFilters
  limit?: number
  offset?: number
}

export interface SearchHit {
  word: Word
  score: number
}

export interface IndexStats {
  totalIndexed: number
  lastIndexedAt: Date | null
}

export interface SearchIndexRepository {
  indexWord(word: Word): Promise<void>
  indexWords(words: Word[]): Promise<void>
  deindexWord(wordId: string): Promise<void>
  reindexWord(word: Word): Promise<void>
  search(options: SearchOptions): Promise<SearchHit[]>
  getIndexStats(): Promise<IndexStats>
}
