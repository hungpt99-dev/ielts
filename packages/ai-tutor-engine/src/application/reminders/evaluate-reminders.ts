import type { Reminder } from '../../ports/reminder-repository'

export interface ReminderEvaluationResult {
  due: Reminder[]
  nextCheckAt?: string
}

export function evaluateReminders(
  reminders: Reminder[],
  now: Date = new Date(),
): ReminderEvaluationResult {
  const due: Reminder[] = []

  for (const reminder of reminders) {
    if (!reminder.isEnabled) continue
    if (reminder.isTriggered) continue

    if (isReminderDue(reminder, now)) {
      due.push(reminder)
    }
  }

  return { due }
}

function isReminderDue(reminder: Reminder, now: Date): boolean {
  if (reminder.scheduledDate && reminder.scheduledTime) {
    const scheduled = new Date(`${reminder.scheduledDate}T${reminder.scheduledTime}`)
    if (Math.abs(now.getTime() - scheduled.getTime()) < 300_000) return true
  }

  if (reminder.scheduledTime && reminder.repeatDays.length > 0) {
    const [hours, minutes] = reminder.scheduledTime.split(':').map(Number)
    const reminderMinutes = hours * 60 + minutes
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    if (Math.abs(currentMinutes - reminderMinutes) < 5 && reminder.repeatDays.includes(now.getDay())) {
      return true
    }
  }

  return false
}
