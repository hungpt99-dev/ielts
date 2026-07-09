import type { ActivityItem } from '../types/aiTutor.types'

const STORAGE_KEY = 'ai-tutor-activity'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getRecentActivities(limit = 10): ActivityItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items: ActivityItem[] = JSON.parse(raw)
    return items.slice(0, limit)
  } catch {
    return []
  }
}

export function recordActivity(label: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const items: ActivityItem[] = raw ? JSON.parse(raw) : []
    items.unshift({ id: generateId(), label, timestamp: Date.now() })
    if (items.length > 50) items.length = 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}
