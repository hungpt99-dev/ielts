import type { UserConfiguration } from './types'

function readStudy(
  legacy: Record<string, unknown>,
  key: string,
): unknown {
  const study = legacy.study as Record<string, unknown> | undefined
  return study?.[key] ?? legacy[key]
}

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
      targetBand: (readStudy(legacy, 'targetBand') as number) ?? 6.5,
      currentBand: (readStudy(legacy, 'currentBand') as number) ?? 5.5,
      examDate: (readStudy(legacy, 'examDate') as string) || undefined,
      dailyStudyMinutes: (readStudy(legacy, 'dailyStudyMinutes') as number) ?? 60,
      weakSkills: (readStudy(legacy, 'weakSkills') as string[]) ?? [],
      nativeLanguage: (readStudy(legacy, 'nativeLanguage') as string) ?? '',
      studyGoal: (readStudy(legacy, 'studyGoal') as 'academic' | 'general') ?? 'academic',
      preferredSchedule: (readStudy(legacy, 'preferredSchedule') as string[]) ?? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
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
