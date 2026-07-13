export interface CooldownEntry {
  triggerType: string
  lastFiredAt: string
}

export interface CooldownPolicyConfig {
  globalCooldownMs: number
  perTriggerCooldownMs: Record<string, number>
}

export const DEFAULT_COOLDOWN_CONFIG: CooldownPolicyConfig = {
  globalCooldownMs: 60_000,
  perTriggerCooldownMs: {
    long_inactivity: 86_400_000,
    exam_approaching: 86_400_000,
    study_streak_achieved: 86_400_000,
    vocabulary_review_due: 43_200_000,
    due_review_not_completed: 43_200_000,
  },
}

export function evaluateCooldown(
  triggerType: string,
  cooldownState: CooldownEntry[],
  config: CooldownPolicyConfig = DEFAULT_COOLDOWN_CONFIG,
): { isOnCooldown: boolean; remainingMs: number } {
  const now = Date.now()

  const globalEntry = cooldownState.find(e => e.triggerType === '__global__')
  if (globalEntry) {
    const elapsed = now - new Date(globalEntry.lastFiredAt).getTime()
    if (elapsed < config.globalCooldownMs) {
      return { isOnCooldown: true, remainingMs: config.globalCooldownMs - elapsed }
    }
  }

  const entry = cooldownState.find(e => e.triggerType === triggerType)
  if (!entry) return { isOnCooldown: false, remainingMs: 0 }

  const cooldownMs = config.perTriggerCooldownMs[triggerType] ?? config.globalCooldownMs
  const elapsed = now - new Date(entry.lastFiredAt).getTime()
  if (elapsed < cooldownMs) {
    return { isOnCooldown: true, remainingMs: cooldownMs - elapsed }
  }

  return { isOnCooldown: false, remainingMs: 0 }
}

export function updateCooldown(
  triggerType: string,
  cooldownState: CooldownEntry[],
): CooldownEntry[] {
  const filtered = cooldownState.filter(e => e.triggerType !== triggerType)
  return [...filtered, { triggerType, lastFiredAt: new Date().toISOString() }]
}
