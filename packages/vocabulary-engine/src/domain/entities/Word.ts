import type { CefrLevel } from '../constants'
import type {
  Antonym,
  Collocation,
  CommonMistake,
  Inflection,
  PartOfSpeech,
  Synonym,
  UsageExample,
  WordFamilyMember,
} from '../value-objects'

export interface Word {
  id: string
  text: string
  normalizedWord: string
  lemma: string
  partOfSpeech: PartOfSpeech
  definition: string
  simplifiedMeaning?: string
  pronunciation?: string
  translation?: string
  cefrLevel?: CefrLevel
  ieltsRelevance?: 'low' | 'medium' | 'high'
  collocations: Collocation[]
  synonyms: Synonym[]
  antonyms: Antonym[]
  wordFamily: WordFamilyMember[]
  commonMistakes: CommonMistake[]
  usageExamples: UsageExample[]
  inflections: Inflection[]
  tags: string[]
  topics: string[]
  createdAt: Date
  updatedAt: Date
}
