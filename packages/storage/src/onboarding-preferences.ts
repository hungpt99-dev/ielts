import { getDb } from './db'
import { STORAGE_KEYS } from '@ielts/config'

const LEGACY_COMPLETED_KEY = STORAGE_KEYS.localStorage.onboardingComplete
const LEGACY_PROFILE_KEY = STORAGE_KEYS.localStorage.onboardingProfile

interface OnboardingStatus {
  completed: boolean
  completedAt?: string
  migratedFrom?: string
}

export interface OnboardingPreferences {
  targetBand: number
  currentBand: number
  examDate: string
  studyGoal: string
  dailyStudyMinutes: number
  weakSkills: string[]
  preferredSchedule: string[]
  preferredLanguage: string
  tutorStyle: string
}

const STATUS_KEY = 'app:onboarding:status'
const PROFILE_KEY = 'app:onboarding:profile'

async function getDbOrNull() {
  try {
    const db = getDb()
    if (!db.isOpen()) await db.open()
    return db
  } catch {
    return null
  }
}

function readMeta<T>(db: any, key: string): Promise<{ value: string } | undefined> {
  return db.table('contentMeta').where('id').equals(key).first()
}

function writeMeta(db: any, key: string, value: unknown): Promise<void> {
  return db.table('contentMeta').put({
    id: key, key, value: JSON.stringify(value), updatedAt: new Date().toISOString(),
  } as any)
}

function readLegacyProfile(): Record<string, unknown> | null {
  try { const r = localStorage.getItem(LEGACY_PROFILE_KEY); return r ? JSON.parse(r) : null }
  catch { return null }
}

function readLegacyCompleted(): boolean {
  try { return localStorage.getItem(LEGACY_COMPLETED_KEY) === 'true' }
  catch { return false }
}

function clearLegacyKeys(): void {
  try { localStorage.removeItem(LEGACY_COMPLETED_KEY) } catch {}
  try { localStorage.removeItem(LEGACY_PROFILE_KEY) } catch {}
}

export const onboardingPreferences = {
  async getStatus(): Promise<OnboardingStatus> {
    const db = await getDbOrNull()
    if (db) {
      try {
        const stored = await readMeta(db, STATUS_KEY)
        if (stored && stored.value) return JSON.parse(stored.value) as OnboardingStatus
      } catch {}
    }
    return this.migrateFromLegacy()
  },

  async getProfile(): Promise<OnboardingPreferences | null> {
    const db = await getDbOrNull()
    if (db) {
      try {
        const stored = await readMeta(db, PROFILE_KEY)
        if (stored && stored.value) return JSON.parse(stored.value) as OnboardingPreferences
      } catch {}
    }
    const legacy = readLegacyProfile()
    if (!legacy) return null
    const prefs: OnboardingPreferences = {
      targetBand: (legacy.targetBand as number) ?? 7,
      currentBand: (legacy.currentBand as number) ?? 5.5,
      examDate: (legacy.examDate as string) ?? '',
      studyGoal: (legacy.studyGoal as string) ?? 'academic',
      dailyStudyMinutes: (legacy.studyMinutesPerDay as number) ?? 60,
      weakSkills: Array.isArray(legacy.weakSkills) ? legacy.weakSkills as string[] : [],
      preferredSchedule: Array.isArray(legacy.preferredSchedule) ? legacy.preferredSchedule as string[] : [],
      preferredLanguage: (legacy.preferredLanguage as string) ?? 'en',
      tutorStyle: (legacy.tutorStyle as string) ?? 'encouraging',
    }
    if (db) { try { await writeMeta(db, PROFILE_KEY, prefs) } catch {} }
    return prefs
  },

  async saveProfile(profile: OnboardingPreferences): Promise<void> {
    const db = await getDbOrNull()
    if (db) { try { await writeMeta(db, PROFILE_KEY, profile) } catch {} }
  },

  async migrateFromLegacy(): Promise<OnboardingStatus> {
    const completed = readLegacyCompleted()
    const legacy = readLegacyProfile()
    const status: OnboardingStatus = {
      completed: completed || !!(legacy?.onboardingCompleted),
      migratedFrom: 'localStorage',
    }
    const db = await getDbOrNull()
    if (db) {
      try { await writeMeta(db, STATUS_KEY, status) } catch {}
      if (legacy) {
        try {
          await writeMeta(db, PROFILE_KEY, {
            targetBand: (legacy.targetBand as number) ?? 7,
            currentBand: (legacy.currentBand as number) ?? 5.5,
            examDate: (legacy.examDate as string) ?? '',
            studyGoal: (legacy.studyGoal as string) ?? 'academic',
            dailyStudyMinutes: (legacy.studyMinutesPerDay as number) ?? 60,
            weakSkills: Array.isArray(legacy.weakSkills) ? legacy.weakSkills as string[] : [],
            preferredSchedule: Array.isArray(legacy.preferredSchedule) ? legacy.preferredSchedule as string[] : [],
            preferredLanguage: (legacy.preferredLanguage as string) ?? 'en',
            tutorStyle: (legacy.tutorStyle as string) ?? 'encouraging',
          })
        } catch {}
      }
      if (completed || legacy?.onboardingCompleted) clearLegacyKeys()
    }
    return status
  },

  async complete(): Promise<void> {
    const status: OnboardingStatus = { completed: true, completedAt: new Date().toISOString() }
    const db = await getDbOrNull()
    if (db) { try { await writeMeta(db, STATUS_KEY, status) } catch {} }
    clearLegacyKeys()
  },

  async reset(): Promise<void> {
    const db = await getDbOrNull()
    if (db) {
      try { await db.table('contentMeta').delete(STATUS_KEY) } catch {}
      try { await db.table('contentMeta').delete(PROFILE_KEY) } catch {}
    }
    clearLegacyKeys()
  },
}
