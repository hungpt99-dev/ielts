import type { ProactiveMessage } from '../types'

type ProactiveEventHandler = (message: ProactiveMessage) => void
type ClearEventHandler = () => void

interface EventHandlers {
  newMessage: Set<ProactiveEventHandler>
  messagesCleared: Set<ClearEventHandler>
}

const handlers: EventHandlers = {
  newMessage: new Set(),
  messagesCleared: new Set(),
}

export const ProactiveEventBus = {
  onNewMessage(fn: ProactiveEventHandler): () => void {
    handlers.newMessage.add(fn)
    return () => { handlers.newMessage.delete(fn) }
  },

  emitNewMessage(message: ProactiveMessage): void {
    handlers.newMessage.forEach(fn => fn(message))
  },

  onMessagesCleared(fn: ClearEventHandler): () => void {
    handlers.messagesCleared.add(fn)
    return () => { handlers.messagesCleared.delete(fn) }
  },

  emitMessagesCleared(): void {
    handlers.messagesCleared.forEach(fn => fn())
  },

  clear(): void {
    handlers.newMessage.clear()
    handlers.messagesCleared.clear()
  },
}
