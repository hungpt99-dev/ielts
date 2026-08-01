import type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'
import type { RelatedWord } from '../domain/entities/word'
import type { WordRelationship } from '../domain/entities/word-relationship'
import type { VocabularyRepository, VocabReviewRepository } from '../ports'

export interface WordDetailDependencies {
  vocabularyRepository: VocabularyRepository
  vocabReviewRepository: VocabReviewRepository
}

export class WordDetailService {
  private readonly vocabularyRepository: VocabularyRepository
  private readonly vocabReviewRepository: VocabReviewRepository

  constructor(deps: WordDetailDependencies) {
    this.vocabularyRepository = deps.vocabularyRepository
    this.vocabReviewRepository = deps.vocabReviewRepository
  }

  async getWordDetail(
    id: string,
    relationships: WordRelationship[],
  ): Promise<{
    word: VocabularyEntry
    review: VocabReviewEntry | null
    relatedWords: RelatedWord[]
  } | undefined> {
    const word = await this.vocabularyRepository.findById(id)
    if (!word) return undefined

    const review = (await this.vocabReviewRepository.findByVocabularyId(id)) ?? null
    const relatedWords = this.resolveRelatedWords(word, relationships)

    return { word, review, relatedWords }
  }

  private resolveRelatedWords(word: VocabularyEntry, relationships: WordRelationship[]): RelatedWord[] {
    const target = word.word.toLowerCase()
    const seen = new Map<string, RelatedWord>()

    for (const rel of relationships) {
      if (rel.sourceWord.toLowerCase() !== target) continue
      const existing = seen.get(rel.targetWord.toLowerCase())
      if (existing) continue
      seen.set(rel.targetWord.toLowerCase(), {
        word: rel.targetWord,
        relationshipType: rel.relationshipType,
      })
    }

    return Array.from(seen.values())
  }
}
