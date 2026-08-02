export type CommonMistakeType = 'SPELLING' | 'PRONUNCIATION' | 'GRAMMAR' | 'USAGE' | 'COLLOCATION'

export interface CommonMistake {
  id: string
  wordId: string
  mistake: string
  correction: string
  explanation: string
  type: CommonMistakeType
}

export function createCommonMistake(input: CommonMistake): CommonMistake {
  return { ...input }
}
