import type { Register } from './Collocation'

export type UsageExampleSource = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING' | 'GRAMMAR' | 'AI' | 'DICTIONARY'

export interface UsageExample {
  id: string
  wordId: string
  text: string
  source: UsageExampleSource
  sourceId?: string
  timestamp?: string
  register: Register
  context?: string
  isIeltsExample: boolean
}

export function createUsageExample(input: UsageExample): UsageExample {
  return { ...input }
}
