import type { VocabularyEntry } from '@ielts/storage'
import type { VocabularyRepository } from '../ports'

export interface VocabularyFilter {
  search?: string
  topic?: string
  status?: VocabularyEntry['status'] | ''
  difficulty?: VocabularyEntry['difficulty'] | ''
  tag?: string
  view?: 'all' | 'favorites' | 'difficult'
}

export interface SearchEngineDependencies {
  vocabularyRepository: VocabularyRepository
}

export class SearchEngine {
  private readonly vocabularyRepository: VocabularyRepository

  constructor(deps: SearchEngineDependencies) {
    this.vocabularyRepository = deps.vocabularyRepository
  }

  filterVocabulary(entries: VocabularyEntry[], filter: VocabularyFilter): VocabularyEntry[] {
    let filtered = entries

    if (filter.view === 'favorites') {
      filtered = filtered.filter(e => e.tags.includes('favorite'))
    } else if (filter.view === 'difficult') {
      filtered = filtered.filter(e => e.difficulty === 'hard')
    }

    if (filter.search) {
      const q = filter.search.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.word.toLowerCase().includes(q) ||
          e.meaning.toLowerCase().includes(q) ||
          e.translation.toLowerCase().includes(q) ||
          e.exampleSentence.toLowerCase().includes(q),
      )
    }

    if (filter.topic) {
      filtered = filtered.filter(e => e.topic === filter.topic)
    }

    if (filter.status) {
      filtered = filtered.filter(e => e.status === filter.status)
    }

    if (filter.difficulty) {
      filtered = filtered.filter(e => e.difficulty === filter.difficulty)
    }

    if (filter.tag) {
      const tag = filter.tag
      filtered = filtered.filter(e => e.tags.includes(tag))
    }

    return filtered.sort((a, b) => a.word.localeCompare(b.word))
  }

  async search(filter: VocabularyFilter = {}): Promise<VocabularyEntry[]> {
    const all = await this.vocabularyRepository.findAll()
    return this.filterVocabulary(all, filter)
  }

  async searchByWord(query: string): Promise<VocabularyEntry[]> {
    const all = await this.vocabularyRepository.findAll()
    const q = query.toLowerCase()
    return all.filter(
      e =>
        e.word.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.translation.toLowerCase().includes(q) ||
        e.exampleSentence.toLowerCase().includes(q),
    )
  }
}
