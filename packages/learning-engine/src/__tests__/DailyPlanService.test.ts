import { describe, it, expect } from 'vitest'
import { DailyPlanService } from '../daily-plan/DailyPlanService'

describe('DailyPlanService', () => {
  const service = new DailyPlanService()

  it('generates daily plan with weak skill focus', () => {
    const tasks: any[] = []
    const weakSkills = [
      { skill: 'writing' as const, accuracy: 45, sessionCount: 2, severity: 'high' as const },
    ]
    const dueReviews = { vocabularyDue: [], mistakesDue: [], totalDue: 0 }

    const plan = service.generateDailyPlan(tasks, weakSkills, dueReviews, 60)
    expect(plan.items.length).toBeGreaterThan(0)
    expect(plan.totalMinutes).toBeGreaterThanOrEqual(60)
    expect(plan.studyPriority).toBeGreaterThanOrEqual(1)
  })

  it('includes vocabulary review when due reviews exist', () => {
    const tasks: any[] = []
    const weakSkills: any[] = []
    const dueReviews = {
      vocabularyDue: [{ vocabulary: {} as any, review: {} as any }],
      mistakesDue: [],
      totalDue: 1,
    }

    const plan = service.generateDailyPlan(tasks, weakSkills, dueReviews, 60)
    const vocabItem = plan.items.find(i => i.activity.toLowerCase().includes('vocabulary'))
    expect(vocabItem).toBeTruthy()
  })

  it('includes mistake review when mistakes due', () => {
    const tasks: any[] = []
    const weakSkills: any[] = []
    const dueReviews = {
      vocabularyDue: [],
      mistakesDue: [{ mistake: { id: 'm1' } as any, daysSinceLastReview: 3 }],
      totalDue: 1,
    }

    const plan = service.generateDailyPlan(tasks, weakSkills, dueReviews, 60)
    const mistakeItem = plan.items.find(i => i.activity.toLowerCase().includes('mistake'))
    expect(mistakeItem).toBeTruthy()
  })

  it('includes tasks for today', () => {
    const today = new Date().toISOString()
    const tasks = [
      {
        id: 't1',
        title: 'Reading practice',
        description: 'Practice reading passage',
        category: 'Reading' as const,
        date: today,
        isDone: false,
        isRecurring: false,
        recurringDays: [],
        notes: '',
        timeMinutes: 30,
        createdAt: today,
        updatedAt: today,
        completedAt: null,
      },
    ]
    const weakSkills: any[] = []
    const dueReviews = { vocabularyDue: [], mistakesDue: [], totalDue: 0 }

    const plan = service.generateDailyPlan(tasks, weakSkills, dueReviews, 60)
    const taskItem = plan.items.find(i => i.activity.includes('Reading'))
    expect(taskItem).toBeTruthy()
  })

  it('provides fallback item when no other items exist', () => {
    const tasks: any[] = []
    const weakSkills: any[] = []
    const dueReviews = { vocabularyDue: [], mistakesDue: [], totalDue: 0 }

    const plan = service.generateDailyPlan(tasks, weakSkills, dueReviews, 30)
    expect(plan.items.length).toBeGreaterThanOrEqual(1)
    expect(plan.items[0].activity).toBeTruthy()
  })

  it('calculates study priority based on due reviews and weaknesses', () => {
    const weakSkills = [
      { skill: 'reading' as const, accuracy: 50, sessionCount: 1, severity: 'high' as const },
      { skill: 'writing' as const, accuracy: 40, sessionCount: 1, severity: 'high' as const },
    ]

    const highDueReviews = {
      vocabularyDue: new Array(6).fill(null).map(() => ({ vocabulary: {} as any, review: {} as any })),
      mistakesDue: [],
      totalDue: 6,
    }

    const highPriorityPlan = service.generateDailyPlan([], weakSkills, highDueReviews, 60)

    const lowDueReviews = { vocabularyDue: [], mistakesDue: [], totalDue: 0 }

    const lowPriorityPlan = service.generateDailyPlan([], [], lowDueReviews, 60)

    expect(highPriorityPlan.studyPriority).toBeGreaterThan(lowPriorityPlan.studyPriority)
  })

  it('gets tasks for today correctly', () => {
    const today = new Date().toISOString()
    const yesterday = new Date(Date.now() - 86400000).toISOString()

    const tasks = [
      { id: 't1', title: 'Today task', category: 'Reading' as const, date: today, isDone: false, isRecurring: false, recurringDays: [], description: '', notes: '', timeMinutes: 20, createdAt: today, updatedAt: today, completedAt: null },
      { id: 't2', title: 'Yesterday task', category: 'Reading' as const, date: yesterday, isDone: false, isRecurring: false, recurringDays: [], description: '', notes: '', timeMinutes: 20, createdAt: yesterday, updatedAt: yesterday, completedAt: null },
    ]

    const todayTasks = service.getTasksForToday(tasks)
    expect(todayTasks.length).toBe(1)
    expect(todayTasks[0].id).toBe('t1')
  })

  it('returns recurring tasks matching today', () => {
    const today = new Date()
    const todayDayOfWeek = today.getDay()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDayOfWeek = tomorrow.getDay()

    const tasks = [
      {
        id: 't1',
        title: 'Recurring task',
        category: 'Reading' as const,
        date: today.toISOString(),
        isDone: false,
        isRecurring: true,
        recurringDays: [todayDayOfWeek],
        description: '',
        notes: '',
        timeMinutes: 20,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
        completedAt: null,
      },
      {
        id: 't2',
        title: 'Wrong day recurring task',
        category: 'Reading' as const,
        date: tomorrow.toISOString(),
        isDone: false,
        isRecurring: true,
        recurringDays: [tomorrowDayOfWeek],
        description: '',
        notes: '',
        timeMinutes: 20,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
        completedAt: null,
      },
    ]

    const todayTasks = service.getTasksForToday(tasks)
    const t1 = todayTasks.find(t => t.id === 't1')
    expect(t1).toBeTruthy()
  })
})
