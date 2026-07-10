import type { StudyActivityType } from '../types'

export interface LearningEvent {
  type: StudyActivityType
  videoId: string
  sessionId?: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export type LearningEventListener = (event: LearningEvent) => void

export class LearningEventBus {
  private listeners: Map<string, Set<LearningEventListener>> = new Map()
  private history: LearningEvent[] = []
  private maxHistory: number = 500
  private static instance: LearningEventBus

  static getInstance(): LearningEventBus {
    if (!LearningEventBus.instance) {
      LearningEventBus.instance = new LearningEventBus()
    }
    return LearningEventBus.instance
  }

  on(eventType: string, listener: LearningEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(listener)
    return () => {
      this.listeners.get(eventType)?.delete(listener)
    }
  }

  off(eventType: string, listener: LearningEventListener): void {
    this.listeners.get(eventType)?.delete(listener)
  }

  emit(event: LearningEvent): void {
    this.history.push(event)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    const specificListeners = this.listeners.get(event.type)
    if (specificListeners) {
      specificListeners.forEach(l => l(event))
    }

    const allListeners = this.listeners.get('*')
    if (allListeners) {
      allListeners.forEach(l => l(event))
    }
  }

  getHistory(): LearningEvent[] {
    return [...this.history]
  }

  getHistoryByType(type: string): LearningEvent[] {
    return this.history.filter(e => e.type === type)
  }

  clearHistory(): void {
    this.history = []
  }

  destroy(): void {
    this.listeners.clear()
    this.history = []
  }
}
