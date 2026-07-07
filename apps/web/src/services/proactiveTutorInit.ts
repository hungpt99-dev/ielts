import { ProactiveEventBus } from '@ielts/ai-tutor'
import { proactiveMessageEngine } from './ProactiveMessageEngine'

let initialized = false

export async function initProactiveTutor(): Promise<void> {
  if (initialized) return
  initialized = true

  proactiveMessageEngine.onMessage((message) => {
    ProactiveEventBus.emitNewMessage(message as Parameters<typeof ProactiveEventBus.emitNewMessage>[0])
  })

  await proactiveMessageEngine.initialize()
}
