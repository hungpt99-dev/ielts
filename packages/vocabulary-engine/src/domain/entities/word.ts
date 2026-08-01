import type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'
import type { WordRelationshipType } from './word-relationship'

export type { VocabularyEntry, VocabReviewEntry } from '@ielts/storage'

export interface VocabReviewState {
  entry: VocabReviewEntry | null
  isDue: boolean
}

export interface WordDetail {
  word: VocabularyEntry
  review: VocabReviewEntry | null
  relatedWords: RelatedWord[]
}

export interface RelatedWord {
  word: string
  relationshipType: WordRelationshipType
}
