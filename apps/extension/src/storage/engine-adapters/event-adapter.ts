import type { LearningEventPublisher } from '@ielts/learning-engine'
import { safeStorageGet, safeStorageSet } from '../../utils/safe-chrome'

const EVENTS_KEY = 'engine-events'

export const extensionEventPublisher: LearningEventPublisher = {
  publish(event: any) {
    safeStorageGet<any[]>(EVENTS_KEY).then(result => {
      const events = result[EVENTS_KEY] ?? []
      events.push(event)
      safeStorageSet({ [EVENTS_KEY]: events })
    }).catch(() => {})
  },
  publishMany(events: any[]) {
    safeStorageGet<any[]>(EVENTS_KEY).then(result => {
      const existing = result[EVENTS_KEY] ?? []
      existing.push(...events)
      safeStorageSet({ [EVENTS_KEY]: existing })
    }).catch(() => {})
  },
}
