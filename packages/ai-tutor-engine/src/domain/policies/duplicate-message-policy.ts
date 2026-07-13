import type { ProactiveMessage } from '../entities/proactive-message'

export interface DuplicateCheckConfig {
  keyExpiryMs: number
}

export const DEFAULT_DUPLICATE_CONFIG: DuplicateCheckConfig = {
  keyExpiryMs: 86_400_000,
}

export function isDuplicate(
  candidate: ProactiveMessage,
  existing: ProactiveMessage[],
  config: DuplicateCheckConfig = DEFAULT_DUPLICATE_CONFIG,
): boolean {
  const now = Date.now()
  return existing.some(msg => {
    if (msg.deduplicationKey !== candidate.deduplicationKey) return false
    const age = now - new Date(msg.createdAt).getTime()
    return age < config.keyExpiryMs
  })
}

export function filterDuplicates(
  candidates: ProactiveMessage[],
  existing: ProactiveMessage[],
  config: DuplicateCheckConfig = DEFAULT_DUPLICATE_CONFIG,
): ProactiveMessage[] {
  return candidates.filter(c => !isDuplicate(c, existing, config))
}
