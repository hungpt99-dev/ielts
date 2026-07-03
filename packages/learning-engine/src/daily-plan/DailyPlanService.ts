import type { TaskEntry } from '@ielts/storage'
import type {
  DailyPlan,
  DailyPlanItem,
  StudySkill,
  WeakSkill,
  DueReviews,
  ISOString,
} from '../types'

export class DailyPlanService {
  generateDailyPlan(
    tasks: TaskEntry[],
    weakSkills: WeakSkill[],
    dueReviews: DueReviews,
    dailyStudyMinutes: number,
    now: Date = new Date(),
  ): DailyPlan {
    const todayStr = now.toISOString().slice(0, 10)
    const todayTasks = tasks.filter(t => t.date.slice(0, 10) === todayStr)

    const items = this.buildPlanItems(todayTasks, weakSkills, dueReviews, dailyStudyMinutes)

    const totalMinutes = items.reduce((s, i) => s + i.minutes, 0)
    const focusSkills = this.extractFocusSkills(items)
    const studyPriority = this.calculateStudyPriority(weakSkills, dueReviews, now)

    return {
      date: now.toISOString(),
      totalMinutes,
      studyPriority,
      items,
      focusSkills,
    }
  }

  getTasksForToday(tasks: TaskEntry[], now: Date = new Date()): TaskEntry[] {
    const todayStr = now.toISOString().slice(0, 10)
    return tasks.filter(t => {
      const taskDate = t.date.slice(0, 10)
      if (taskDate === todayStr) return true
      if (t.isRecurring && t.recurringDays) {
        const dayOfWeek = now.getDay()
        return t.recurringDays.includes(dayOfWeek)
      }
      return false
    })
  }

  getWeeklySchedule(
    tasks: TaskEntry[],
    now: Date = new Date(),
  ): Array<{ date: ISOString; items: number }> {
    const weekStart = this.getWeekStart(now)
    const schedule: Array<{ date: ISOString; items: number }> = []
    const startMs = new Date(weekStart + 'T00:00:00.000Z').getTime()

    for (let i = 0; i < 7; i++) {
      const d = new Date(startMs + i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const dayTasks = tasks.filter(t => t.date.slice(0, 10) === dateStr)
      schedule.push({
        date: dateStr,
        items: dayTasks.length,
      })
    }

    return schedule
  }

  private getWeekStart(now: Date): string {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const day = d.getUTCDay()
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
    d.setUTCDate(diff)
    return d.toISOString().slice(0, 10)
  }

  private buildPlanItems(
    tasks: TaskEntry[],
    weakSkills: WeakSkill[],
    dueReviews: DueReviews,
    dailyMinutes: number,
  ): DailyPlanItem[] {
    const items: DailyPlanItem[] = []
    let remainingMinutes = dailyMinutes

    const topWeakSkills = weakSkills.filter(w => w.severity === 'high' || w.severity === 'medium').slice(0, 2)
    for (const weak of topWeakSkills) {
      if (remainingMinutes <= 0) break
      const minutes = Math.min(20, remainingMinutes)
      items.push({
        skill: weak.skill,
        activity: `Practice ${weak.skill}`,
        minutes,
        reason: `Weak area (${weak.severity} severity, ${weak.accuracy}% accuracy)`,
      })
      remainingMinutes -= minutes
    }

    if (dueReviews.totalDue > 0 && remainingMinutes > 0) {
      const minutes = Math.min(15, remainingMinutes)
      items.push({
        skill: 'vocabulary',
        activity: 'Review vocabulary',
        minutes,
        reason: `${dueReviews.vocabularyDue.length} vocabulary items due for review`,
      })
      remainingMinutes -= minutes
    }

    if (dueReviews.mistakesDue.length > 0 && remainingMinutes > 0) {
      const minutes = Math.min(10, remainingMinutes)
      items.push({
        skill: 'grammar',
        activity: 'Review mistakes',
        minutes,
        reason: `${dueReviews.mistakesDue.length} mistakes pending review`,
      })
      remainingMinutes -= minutes
    }

    for (const task of tasks) {
      if (remainingMinutes <= 0) break
      if (task.isDone) continue

      const skill = this.taskCategoryToSkill(task.category)
      const minutes = Math.min(task.timeMinutes || 20, remainingMinutes)
      items.push({
        skill,
        activity: task.title || `Complete ${task.category}`,
        minutes,
        reason: task.description || `Task from your study plan`,
      })
      remainingMinutes -= minutes
    }

    if (items.length === 0) {
      items.push({
        skill: 'reading',
        activity: 'Daily reading practice',
        minutes: Math.min(20, remainingMinutes),
        reason: 'General IELTS preparation',
      })
    }

    return items
  }

  private taskCategoryToSkill(category: string): StudySkill | 'mock-test' | 'general' {
    const cat = category.toLowerCase()
    if (cat.includes('reading')) return 'reading'
    if (cat.includes('listening')) return 'listening'
    if (cat.includes('writing')) return 'writing'
    if (cat.includes('speaking')) return 'speaking'
    if (cat.includes('vocabulary')) return 'vocabulary'
    if (cat.includes('grammar')) return 'grammar'
    if (cat.includes('mock test')) return 'mock-test'
    return 'general'
  }

  private extractFocusSkills(items: DailyPlanItem[]): StudySkill[] {
    const skills = new Set<StudySkill>()
    for (const item of items) {
      if (item.skill !== 'mock-test' && item.skill !== 'general') {
        skills.add(item.skill)
      }
    }
    return Array.from(skills)
  }

  private calculateStudyPriority(
    weakSkills: WeakSkill[],
    dueReviews: DueReviews,
    _now: Date,
  ): number {
    let priority = 5

    if (dueReviews.totalDue > 10) priority += 3
    else if (dueReviews.totalDue > 5) priority += 2
    else if (dueReviews.totalDue > 0) priority += 1

    const highSeverityCount = weakSkills.filter(w => w.severity === 'high').length
    priority += highSeverityCount * 2

    priority = Math.max(1, Math.min(10, priority))

    return priority
  }

}
