// ═══════════════════════════════════════════════════════════════════════
// @ielts/vocabulary-engine — VocabularyState
// ═══════════════════════════════════════════════════════════════════════

import type { Interaction } from './Interaction'
import { createId, nowIso } from './common'

export type VocabularyLifecycle =
  | 'NEW'
  | 'LEARNING'
  | 'REVIEWING'
  | 'RELEARNING'
  | 'MASTERED'
  | 'FORGOTTEN'

export interface VocabularyState {
  id: string
  wordId: string
  lifecycle: VocabularyLifecycle
  masteryScore: number
  confidenceScore: number
  lastInteractionAt: string
  interactions: Interaction[]
  addedAt: string
  discoveredFrom: string
  discoveryContext?: string
  sourceSentence?: string
  personalNotes?: string
  isBookmarked: boolean
  tags: string[]
}

export function createVocabularyState(
  overrides: Partial<VocabularyState> = {},
): VocabularyState {
  return {
    id: createId(),
    wordId: '',
    lifecycle: 'NEW',
    masteryScore: 0,
    confidenceScore: 0,
    lastInteractionAt: nowIso(),
    interactions: [],
    addedAt: nowIso(),
    discoveredFrom: 'manual',
    isBookmarked: false,
    tags: [],
    ...overrides,
  }
}
