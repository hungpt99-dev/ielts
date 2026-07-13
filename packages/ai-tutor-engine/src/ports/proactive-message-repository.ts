import type { ProactiveMessage, ProactiveMessageSettings } from '../types'

export interface ProactiveMessageRepositoryPort {
  loadMessages(): ProactiveMessage[]
  saveMessages(msgs: ProactiveMessage[]): void
  clearMessages(): void
  loadSettings(): ProactiveMessageSettings
  saveSettings(settings: ProactiveMessageSettings): void
}
