import type { UserConfiguration } from './types'

export function migrateFromLegacySettings(legacy: Record<string, unknown>): UserConfiguration | null {
  if (!legacy || Object.keys(legacy).length === 0) return null

  return {
    version: 1,
    ai: {
      providerId: 'openai',
      model: (legacy.aiModel as string) || undefined,
      customApiUrl: (legacy.aiBaseUrl as string) || (legacy.aiEndpoint as string) || undefined,
    },
    study: {
      targetBand: (legacy.targetBand as number) ?? 6.5,
      currentBand: (legacy.currentBand as number) ?? 5.5,
      examDate: (legacy.examDate as string) || undefined,
      dailyStudyMinutes: (legacy.dailyStudyMinutes as number) ?? 60,
      weakSkills: (legacy.weakSkills as string[]) ?? [],
      nativeLanguage: (legacy.nativeLanguage as string) ?? '',
      studyGoal: (legacy.studyGoal as 'academic' | 'general') ?? 'academic',
      preferredSchedule: (legacy.preferredSchedule as string[]) ?? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    },
    theme: {
      mode: (legacy.themeMode as 'light' | 'dark' | 'system') || 'system',
      accentColor: (legacy.accentColor as string) || '#2563eb',
    },
    notifications: {
      enabled: true,
      reminderTime: '09:00',
    },
  }
}
