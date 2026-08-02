export interface Synonym {
  id: string
  wordId: string
  synonymOf: string
  nuance?: string
  similarityScore: number
}

export function createSynonym(input: Synonym): Synonym {
  return { ...input }
}
