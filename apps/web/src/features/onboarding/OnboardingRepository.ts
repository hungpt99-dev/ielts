import type { OnboardingProfile } from './types'
import { getDefaultProfile } from './types'
import { STORAGE_KEYS } from '@ielts/config'
import { onboardingPreferences } from './OnboardingPreferencesRepository'

const STORAGE_KEY = STORAGE_KEYS.localStorage.onboardingProfile

export class OnboardingRepository {
  load(): OnboardingProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return getDefaultProfile()
      const parsed = JSON.parse(raw)
      return { ...getDefaultProfile(), ...parsed, createdAt: parsed.createdAt || new Date().toISOString() }
    } catch {
      return getDefaultProfile()
    }
  }

  save(profile: OnboardingProfile): void {
    try {
      const toStore = { ...profile, updatedAt: new Date().toISOString() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch {
      /* non-critical */
    }
  }

  markCompleted(): void {
    localStorage.setItem(STORAGE_KEYS.localStorage.onboardingComplete, 'true')
    onboardingPreferences.complete().catch(() => {})
  }

  async isCompleted(): Promise<boolean> {
    try {
      const status = await onboardingPreferences.getStatus()
      return status.completed
    } catch {
      try {
        return localStorage.getItem(STORAGE_KEYS.localStorage.onboardingComplete) === 'true'
      } catch {
        return false
      }
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_KEYS.localStorage.onboardingComplete)
    } catch {
      /* best effort */
    }
    onboardingPreferences.reset().catch(() => {})
  }
}

export const onboardingRepository = new OnboardingRepository()
