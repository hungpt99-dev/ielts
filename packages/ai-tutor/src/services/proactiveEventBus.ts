import type { ProactiveMessage, ProactiveMessageSettings } from '../types'

type ProactiveEventHandler = (message: ProactiveMessage) => void
type MessageIdHandler = (id: string) => void
type SnoozedHandler = (id: string, until: string) => void
type SettingsHandler = (settings: ProactiveMessageSettings) => void
type ClearEventHandler = () => void

interface EventHandlers {
  newMessage: Set<ProactiveEventHandler>
  messageRead: Set<MessageIdHandler>
  messageDismissed: Set<MessageIdHandler>
  messageSnoozed: Set<SnoozedHandler>
  messagesCleared: Set<ClearEventHandler>
  settingsChanged: Set<SettingsHandler>
}

const handlers: EventHandlers = {
  newMessage: new Set(),
  messageRead: new Set(),
  messageDismissed: new Set(),
  messageSnoozed: new Set(),
  messagesCleared: new Set(),
  settingsChanged: new Set(),
}

function safeInvoke<T extends (...args: never[]) => void>(fn: T, ...args: Parameters<T>): void {
  try {
    fn(...args)
  } catch (e) {
    console.error('ProactiveEventBus handler error:', e)
  }
}

export const ProactiveEventBus = {
  onNewMessage(fn: ProactiveEventHandler): () => void {
    handlers.newMessage.add(fn)
    return () => { handlers.newMessage.delete(fn) }
  },

  emitNewMessage(message: ProactiveMessage): void {
    handlers.newMessage.forEach(fn => safeInvoke(fn, message))
  },

  onMessageRead(fn: MessageIdHandler): () => void {
    handlers.messageRead.add(fn)
    return () => { handlers.messageRead.delete(fn) }
  },

  emitMessageRead(id: string): void {
    handlers.messageRead.forEach(fn => safeInvoke(fn, id))
  },

  onMessageDismissed(fn: MessageIdHandler): () => void {
    handlers.messageDismissed.add(fn)
    return () => { handlers.messageDismissed.delete(fn) }
  },

  emitMessageDismissed(id: string): void {
    handlers.messageDismissed.forEach(fn => safeInvoke(fn, id))
  },

  onMessageSnoozed(fn: SnoozedHandler): () => void {
    handlers.messageSnoozed.add(fn)
    return () => { handlers.messageSnoozed.delete(fn) }
  },

  emitMessageSnoozed(id: string, until: string): void {
    handlers.messageSnoozed.forEach(fn => safeInvoke(fn, id, until))
  },

  onMessagesCleared(fn: ClearEventHandler): () => void {
    handlers.messagesCleared.add(fn)
    return () => { handlers.messagesCleared.delete(fn) }
  },

  emitMessagesCleared(): void {
    handlers.messagesCleared.forEach(fn => safeInvoke(fn))
  },

  onSettingsChanged(fn: SettingsHandler): () => void {
    handlers.settingsChanged.add(fn)
    return () => { handlers.settingsChanged.delete(fn) }
  },

  emitSettingsChanged(settings: ProactiveMessageSettings): void {
    handlers.settingsChanged.forEach(fn => safeInvoke(fn, settings))
  },

  clear(): void {
    handlers.newMessage.clear()
    handlers.messageRead.clear()
    handlers.messageDismissed.clear()
    handlers.messageSnoozed.clear()
    handlers.messagesCleared.clear()
    handlers.settingsChanged.clear()
  },
}
