// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — Interaction
// ═══════════════════════════════════════════════════════════════════════

import { createId, nowIso } from './common'

export type InteractionType =
  | 'VIEWED'
  | 'REVIEWED'
  | 'USED_WRITING'
  | 'USED_SPEAKING'
  | 'STUDIED'
  | 'TESTED'

export interface Interaction {
  id: string
  wordId: string
  type: InteractionType
  timestamp: string
  context?: string
}

export function createInteraction(overrides: Partial<Interaction> = {}): Interaction {
  return {
    id: createId(),
    wordId: '',
    type: 'VIEWED',
    timestamp: nowIso(),
    ...overrides,
  }
}
