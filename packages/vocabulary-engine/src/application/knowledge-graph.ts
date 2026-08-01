import type { VocabularyEntry } from '@ielts/storage'
import type { WordRelationship, WordRelationshipType } from '../domain/entities/word-relationship'
import type { VocabularyRepository } from '../ports'

export interface KnowledgeGraphDependencies {
  vocabularyRepository: VocabularyRepository
}

export class KnowledgeGraph {
  private readonly vocabularyRepository: VocabularyRepository

  constructor(deps: KnowledgeGraphDependencies) {
    this.vocabularyRepository = deps.vocabularyRepository
  }

  async buildRelationships(): Promise<WordRelationship[]> {
    const all = await this.vocabularyRepository.findAll()
    return this.buildRelationshipsFromEntries(all)
  }

  buildRelationshipsFromEntries(entries: VocabularyEntry[]): WordRelationship[] {
    const relationships: WordRelationship[] = []
    const wordSet = new Set(entries.map(e => e.word.toLowerCase()))

    for (const entry of entries) {
      const source = entry.word

      const link = (targets: string[], relationshipType: WordRelationshipType): void => {
        for (const raw of targets) {
          const target = raw.toLowerCase()
          if (target === source.toLowerCase()) continue
          if (!wordSet.has(target)) continue
          relationships.push({ sourceWord: source, targetWord: raw, relationshipType })
        }
      }

      link(entry.synonyms ?? [], 'synonym')
      link(entry.antonyms ?? [], 'antonym')
      link(entry.collocations ?? [], 'collocation')
      link(entry.wordFamily ?? [], 'word-family')
    }

    return relationships
  }

  async getRelatedWords(word: string): Promise<WordRelationship[]> {
    const relationships = await this.buildRelationships()
    const target = word.toLowerCase()
    return relationships.filter(r => r.sourceWord.toLowerCase() === target)
  }

  async findWordsRelatedByTopic(topic: string): Promise<VocabularyEntry[]> {
    const all = await this.vocabularyRepository.findAll()
    return all.filter(e => e.topic === topic)
  }
}
