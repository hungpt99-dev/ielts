export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'pronoun'
  | 'interjection'

export interface VerbConjugation {
  present: string
  past: string
  pastParticiple: string
  presentParticiple: string
  thirdSingular: string
}

export interface WordFamilyMember {
  id: string
  rootId: string
  word: string
  partOfSpeech: PartOfSpeech
  suffix: string
  definition: string
  pronunciation?: string
  verbConjugation?: VerbConjugation
}

export function createWordFamilyMember(input: WordFamilyMember): WordFamilyMember {
  return { ...input }
}
