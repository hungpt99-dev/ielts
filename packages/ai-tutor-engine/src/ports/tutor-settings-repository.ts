import type { ProactiveMessageSettings } from '../domain/entities/proactive-message'
import type { TutorPreferences } from '../domain/entities/learner-context'

export interface TutorSettingsRepository {
  getProactiveSettings(): Promise<ProactiveMessageSettings>
  saveProactiveSettings(settings: ProactiveMessageSettings): Promise<void>
  getTutorPreferences(): Promise<TutorPreferences>
  saveTutorPreferences(prefs: Partial<TutorPreferences>): Promise<void>
}
