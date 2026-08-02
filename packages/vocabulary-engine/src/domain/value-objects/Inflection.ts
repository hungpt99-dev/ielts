export type InflectionType =
  | 'PLURAL'
  | 'PAST'
  | 'PAST_PARTICIPLE'
  | 'PRESENT_PARTICIPLE'
  | 'THIRD_SINGULAR'
  | 'COMPARATIVE'
  | 'SUPERLATIVE'

export interface Inflection {
  id: string
  wordId: string
  form: string
  type: InflectionType
}

export function createInflection(input: Inflection): Inflection {
  return { ...input }
}
