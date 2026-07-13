export interface Reminder {
  id: string
  type: string
  title: string
  message: string
  scheduledTime?: string
  scheduledDate?: string
  repeatDays: number[]
  isEnabled: boolean
  isTriggered: boolean
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
}

export interface ReminderRepository {
  getAll(): Promise<Reminder[]>
  getEnabled(): Promise<Reminder[]>
  save(reminder: Reminder): Promise<void>
  delete(id: string): Promise<void>
}
