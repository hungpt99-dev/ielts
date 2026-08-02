export interface WordConnection {
  fromWordId: string
  toWordId: string
  relationship: string
  weight: number
  metadata?: Record<string, unknown>
}

export function createWordConnection(input: WordConnection): WordConnection {
  return { ...input }
}
