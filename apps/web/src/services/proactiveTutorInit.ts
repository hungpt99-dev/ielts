import { ProactiveEventBus } from '@ielts/ai-tutor'
import { proactiveMessageEngine } from './ProactiveMessageEngine'

let initialized = false
let lastAutoOpen = 0
const AUTO_OPEN_COOLDOWN_MS = 60_000

function isQuietHours(): boolean {
  const hour = new Date().getHours()
  return hour >= 22 || hour < 8
}

function tryAutoOpenPopup(): void {
  if (isQuietHours()) return
  const now = Date.now()
  if (now - lastAutoOpen < AUTO_OPEN_COOLDOWN_MS) return
  lastAutoOpen = now
  window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
}

export async function initProactiveTutor(): Promise<void> {
  if (initialized) return
  initialized = true

  proactiveMessageEngine.onMessage((message) => {
    ProactiveEventBus.emitNewMessage(message as Parameters<typeof ProactiveEventBus.emitNewMessage>[0])

    if (message.priority === 'high') {
      tryAutoOpenPopup()
    }
  })

  await proactiveMessageEngine.initialize()
}
