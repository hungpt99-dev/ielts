import { ProactiveEventBus } from '@ielts/ai-tutor'
import { proactiveMessageEngine } from './ProactiveMessageEngine'
import { proactiveTutorSettingsRepository } from '../features/proactiveTutor/ProactiveTutorSettingsRepository'

let initialized = false
let lastAutoOpen = 0
const AUTO_OPEN_COOLDOWN_MS = 60_000

function isQuietHours(): boolean {
  return proactiveTutorSettingsRepository.isInQuietHours()
}

function tryAutoOpenPopup(): void {
  const now = Date.now()
  if (now - lastAutoOpen < AUTO_OPEN_COOLDOWN_MS) return
  if (isQuietHours()) return
  if (!proactiveTutorSettingsRepository.isEnabled()) return
  lastAutoOpen = now
  window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
}

export async function initProactiveTutor(): Promise<void> {
  if (initialized) return

  try {
    proactiveMessageEngine.onMessage((message) => {
      ProactiveEventBus.emitNewMessage(message as Parameters<typeof ProactiveEventBus.emitNewMessage>[0])

      if (message.priority === 'high') {
        tryAutoOpenPopup()
      }
    })

    await proactiveMessageEngine.initialize()
    initialized = true
  } catch (err) {
    console.error('Failed to initialize proactive tutor:', err)
  }
}
