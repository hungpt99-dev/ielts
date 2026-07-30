// ═══════════════════════════════════════════════════════════════════════
// Strategies — Public API
// ═══════════════════════════════════════════════════════════════════════

export type { ListeningPartStrategy, PartScenarioInput, PartTranscriptInput, PartQuestionInput, PartDistractorInput, PartValidationInput } from './part-strategy'
export { part1Strategy } from './part1-strategy'
export { part2Strategy } from './part2-strategy'
export { part3Strategy } from './part3-strategy'
export { part4Strategy } from './part4-strategy'

import type { ListeningPartStrategy } from './part-strategy'
import { part1Strategy } from './part1-strategy'
import { part2Strategy } from './part2-strategy'
import { part3Strategy } from './part3-strategy'
import { part4Strategy } from './part4-strategy'
import type { ListeningPart } from '../types'

const strategyMap: Record<string, ListeningPartStrategy> = {
  part1: part1Strategy,
  part2: part2Strategy,
  part3: part3Strategy,
  part4: part4Strategy,
}

export function getStrategy(part: ListeningPart): ListeningPartStrategy {
  const strategy = strategyMap[part]
  if (!strategy) throw new Error(`No strategy for part: ${part}`)
  return strategy
}

export function listStrategies(): ListeningPartStrategy[] {
  return [part1Strategy, part2Strategy, part3Strategy, part4Strategy]
}
