import type { OnboardingProfile } from './types'
import { getDefaultProfile } from './types'

const STORAGE_KEY = 'ielts-onboarding-profile'
const COMPLETED_KEY = 'ielts-onboarding-complete'

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
    } catch (e) {
      console.error('[OnboardingRepository] Failed to save profile', e)
    }
  }

  markCompleted(): void {
    try {
      localStorage.setItem(COMPLETED_KEY, 'true')
    } catch (e) {
      console.error('[OnboardingRepository] Failed to mark onboarding complete', e)
    }
  }

  isCompleted(): boolean {
    try {
      return localStorage.getItem(COMPLETED_KEY) === 'true'
    } catch {
      return false
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(COMPLETED_KEY)
    } catch (e) {
      console.error('[OnboardingRepository] Failed to clear onboarding data', e)
    }
  }
}

export const onboardingRepository = new OnboardingRepository()
