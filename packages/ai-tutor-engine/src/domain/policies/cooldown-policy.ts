const GLOBAL_COOLDOWN_MS = 60_000
const DAILY_COOLDOWN_MS = 86_400_000
const HALF_DAY_COOLDOWN_MS = 43_200_000

export interface CooldownEntry {
  triggerType: string
  lastFiredAt: string
}

export interface CooldownPolicyConfig {
  globalCooldownMs: number
  perTriggerCooldownMs: Record<string, number>
}

export const DEFAULT_COOLDOWN_CONFIG: CooldownPolicyConfig = {
  globalCooldownMs: GLOBAL_COOLDOWN_MS,
  perTriggerCooldownMs: {
    long_inactivity: DAILY_COOLDOWN_MS,
    exam_approaching: DAILY_COOLDOWN_MS,
    study_streak_achieved: DAILY_COOLDOWN_MS,
    vocabulary_review_due: HALF_DAY_COOLDOWN_MS,
    due_review_not_completed: HALF_DAY_COOLDOWN_MS,
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
