import type { ISOString } from '@/types'
import type { CooldownState } from './ProactiveTutorRuleEngine'
import { proactiveTutorSettingsRepository } from './ProactiveTutorSettingsRepository'

const COOLDOWN_STORAGE_KEY = 'ielts-proactive-tutor-cooldown-v1'

export const COOLDOWN_DURATIONS: Record<string, number> = {
  global: 20 * 60 * 1000,
  missed_study: 24 * 60 * 60 * 1000,
  study_reminder: 24 * 60 * 60 * 1000,
  vocabulary_review_due: 12 * 60 * 60 * 1000,
  vocabulary_saved: 4 * 60 * 60 * 1000,
  vocabulary_saved_ext: 4 * 60 * 60 * 1000,
  mistake_saved: 4 * 60 * 60 * 1000,
  repeated_mistake: 24 * 60 * 60 * 1000,
  progress_review: 7 * 24 * 60 * 60 * 1000,
  weekly_review_due: 7 * 24 * 60 * 60 * 1000,
  streak_milestone: 24 * 60 * 60 * 1000,
  exam_countdown: 24 * 60 * 60 * 1000,
  return_after_inactivity: 24 * 60 * 60 * 1000,
  scheduled_check: 60 * 60 * 1000,
}

function createDefaultCooldownState(): CooldownState {
  return {
    global: { lastMessageAt: null },
    byEventType: {},
  }
}

export class CooldownManager {
  private state: CooldownState

  constructor() {
    this.state = this.load()
  }

  getState(): CooldownState {
    return {
      global: { lastMessageAt: this.state.global.lastMessageAt },
      byEventType: { ...this.state.byEventType },
    }
  }

  isOnCooldown(lastMessageAt: ISOString | null, cooldownMs: number): boolean {
    if (!lastMessageAt) return false
    return Date.now() - new Date(lastMessageAt).getTime() < cooldownMs
  }

  isGlobalCooldownActive(): boolean {
    return this.isOnCooldown(this.state.global.lastMessageAt, COOLDOWN_DURATIONS.global)
  }

  isTypeCooldownActive(key: string): boolean {
    const cooldownMs = COOLDOWN_DURATIONS[key] ?? 24 * 60 * 60 * 1000
    const entry = this.state.byEventType[key]
    return this.isOnCooldown(entry?.lastMessageAt ?? null, cooldownMs)
  }

  isDailyLimitReached(): boolean {
    return proactiveTutorSettingsRepository.getDailyRemaining() <= 0
  }

  isInQuietHours(): boolean {
    return proactiveTutorSettingsRepository.isInQuietHours()
  }

  recordMessageShown(cooldownKey: string): void {
    const now = new Date().toISOString()
    this.state.global.lastMessageAt = now
    this.state.byEventType[cooldownKey] = { lastMessageAt: now }
    proactiveTutorSettingsRepository.incrementDailyCount()
    this.save()
  }

  getGlobalLastMessageAt(): ISOString | null {
    return this.state.global.lastMessageAt
  }

  getTypeLastMessageAt(key: string): ISOString | null {
    return this.state.byEventType[key]?.lastMessageAt ?? null
  }

  getRemainingCooldownMs(lastMessageAt: ISOString | null, cooldownMs: number): number {
    if (!lastMessageAt) return 0
    const elapsed = Date.now() - new Date(lastMessageAt).getTime()
    return Math.max(0, cooldownMs - elapsed)
  }

  getGlobalRemainingCooldownMs(): number {
    return this.getRemainingCooldownMs(this.state.global.lastMessageAt, COOLDOWN_DURATIONS.global)
  }

  getTypeRemainingCooldownMs(key: string): number {
    const cooldownMs = COOLDOWN_DURATIONS[key] ?? 24 * 60 * 60 * 1000
    return this.getRemainingCooldownMs(this.state.byEventType[key]?.lastMessageAt ?? null, cooldownMs)
  }

  resetCooldowns(): void {
    this.state = createDefaultCooldownState()
    this.save()
  }

  resetGlobalCooldown(): void {
    this.state.global.lastMessageAt = null
    this.save()
  }

  resetTypeCooldown(key: string): void {
    delete this.state.byEventType[key]
    this.save()
  }

  clearExpiredEntries(): void {
    const now = Date.now()

    if (this.state.global.lastMessageAt) {
      if (now - new Date(this.state.global.lastMessageAt).getTime() >= COOLDOWN_DURATIONS.global) {
        this.state.global.lastMessageAt = null
      }
    }

    for (const key of Object.keys(this.state.byEventType)) {
      const entry = this.state.byEventType[key]
      if (entry?.lastMessageAt) {
        const cooldownMs = COOLDOWN_DURATIONS[key] ?? 24 * 60 * 60 * 1000
        if (now - new Date(entry.lastMessageAt).getTime() >= cooldownMs) {
          delete this.state.byEventType[key]
        }
      }
    }

    this.save()
  }

  getCooldownDuration(key: string): number {
    return COOLDOWN_DURATIONS[key] ?? 24 * 60 * 60 * 1000
  }

  private load(): CooldownState {
    try {
      const raw = localStorage.getItem(COOLDOWN_STORAGE_KEY)
      if (!raw) return createDefaultCooldownState()

      const parsed = JSON.parse(raw) as CooldownState
      if (!parsed || typeof parsed.global !== 'object' || typeof parsed.byEventType !== 'object') {
        return createDefaultCooldownState()
      }

      return parsed
    } catch {
      return createDefaultCooldownState()
    }
  }

  private save(): void {
    try {
      localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(this.state))
    } catch {

    }
  }
}

export const cooldownManager = new CooldownManager()
