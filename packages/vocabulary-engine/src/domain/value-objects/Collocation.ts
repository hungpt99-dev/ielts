export type Register = 'FORMAL' | 'INFORMAL' | 'ACADEMIC' | 'NEUTRAL'

export interface Collocation {
  id: string
  pattern: string
  wordId: string
  frequency: number
  register: Register
  examples: string[]
}

export function createCollocation(input: Collocation): Collocation {
  return { ...input }
}
