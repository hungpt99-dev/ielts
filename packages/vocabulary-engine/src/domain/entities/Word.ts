// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — Word
// ═══════════════════════════════════════════════════════════════════════

import { createId } from './common'

export type PartOfSpeech =
  | 'NOUN'
  | 'VERB'
  | 'ADJECTIVE'
  | 'ADVERB'
  | 'PREPOSITION'
  | 'CONJUNCTION'
  | 'PRONOUN'
  | 'DETERMINER'
  | 'INTERJECTION'
  | 'PHRASE'
  | 'OTHER'

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface Word {
  id: string
  lemma: string
  inflections: string[]
  language: string
  ipa: string
  pronunciation: string
  audioUrl?: string
  partOfSpeech: PartOfSpeech
  cefr: CefrLevel
  ieltsFrequency: number
  awlLevel?: number
  topic: string
  difficulty: number
  definition: string
  simplifiedDefinition: string
  etymology?: string
  aiNotes?: string
}

export function createWord(overrides: Partial<Word> = {}): Word {
  return {
    id: createId(),
    lemma: 'untitled',
    inflections: [],
    language: 'en',
    ipa: '',
    pronunciation: '',
    partOfSpeech: 'NOUN',
    cefr: 'B1',
    ieltsFrequency: 50,
    topic: 'general',
    difficulty: 0.5,
    definition: '',
    simplifiedDefinition: '',
    ...overrides,
  }
}
