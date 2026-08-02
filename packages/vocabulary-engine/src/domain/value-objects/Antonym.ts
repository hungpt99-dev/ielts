export type AntonymType = 'GRADABLE' | 'COMPLEMENTARY' | 'RELATIONAL'

export interface Antonym {
  id: string
  wordId: string
  antonymOf: string
  type: AntonymType
}

export function createAntonym(input: Antonym): Antonym {
  return { ...input }
}
