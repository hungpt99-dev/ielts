export const PROACTIVE_TUTOR_DEFAULTS = {
  enabled: true,
  browserNotifications: false,
  extensionNotifications: false,
  aiEnhanced: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  maxMessagesPerDay: 5,
  minIntervalMinutes: 60,
  categories: {},
  examReminders: true,
  inactivityReminders: true,
  vocabularyReminders: true,
  roadmapReminders: true,
  motivationMessages: true,
  preferredTone: 'friendly',
  preferredMessageLength: 'medium',
} as const

export type ProactiveTutorDefaults = typeof PROACTIVE_TUTOR_DEFAULTS
