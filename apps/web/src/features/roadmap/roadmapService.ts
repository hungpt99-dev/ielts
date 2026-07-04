import type { TaskEntry, AppSettings, StudyGoal } from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { loadAppSettings } from '../../services/storage/SettingsStorage'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export interface RoadmapDay {
  id: string
  date: string
  dayNumber: number
  skillFocus: string
  taskId: string | null
  isComplete: boolean
  objective: string
}

export interface RoadmapWeek {
  id: string
  weekNumber: number
  label: string
  focus: string
  goal: string
  days: RoadmapDay[]
  isComplete: boolean
  completedTasks: number
  totalTasks: number
}

export interface RoadmapPhase {
  id: string
  name: string
  description: string
  order: number
  targetRange: string
  weeks: RoadmapWeek[]
  isComplete: boolean
  completedTasks: number
  totalTasks: number
}

export interface RoadmapData {
  phases: RoadmapPhase[]
  currentPhaseIndex: number
  currentWeekIndex: number
  overallProgress: number
  totalTasks: number
  completedTasks: number
  generatedAt: string
  updatedAt: string
}

export interface RoadmapRecommendation {
  type: 'next_task' | 'weak_skill' | 'review' | 'milestone'
  message: string
  action: string
  route?: string
}

const ROADMAP_STORAGE_KEY = 'ielts-roadmap'

function getWeekDates(startDate: Date, weekIndex: number): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  start.setDate(start.getDate() + weekIndex * 7)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function getPhaseName(order: number, targetBand: number): string {
  if (order === 0) return 'Foundation Building'
  if (order === 1) return 'Skill Development'
  if (order === 2) return 'Advanced Practice'
  if (order === 3) return 'Test Readiness'
  return `Phase ${order + 1}`
}

function getPhaseDescription(order: number, targetBand: number): string {
  if (order === 0) return 'Build essential vocabulary, grammar, and basic IELTS skills'
  if (order === 1) return 'Develop core strategies for each IELTS skill section'
  if (order === 2) return 'Practice with complex materials and timed exercises'
  if (order === 3) return 'Simulate full tests and refine weak areas before exam day'
  return ''
}

function getPhaseTargetRange(order: number): string {
  if (order === 0) return 'Band 4.0-5.5'
  if (order === 1) return 'Band 5.5-6.5'
  if (order === 2) return 'Band 6.5-7.5'
  if (order === 3) return 'Band 7.5+'
  return ''
}

function getWeekFocus(phaseOrder: number, weekNumber: number, weakSkills: string[]): string {
  const primarySkills = weakSkills.length > 0 ? weakSkills : ['Vocabulary', 'Reading', 'Writing', 'Listening', 'Speaking', 'Grammar']
  const skill = primarySkills[(phaseOrder * 4 + weekNumber) % primarySkills.length]
  const weekFoci = [
    `${skill} Fundamentals`,
    `${skill} Practice & Application`,
    `${skill} Advanced Techniques`,
    `${skill} Review & Assessment`,
  ]
  return weekFoci[weekNumber % 4]
}

function getWeekGoal(phaseOrder: number, weekNumber: number, focus: string): string {
  const goals = [
    `Master the basics of ${focus.toLowerCase()} with daily exercises`,
    `Apply ${focus.toLowerCase()} strategies in timed practice sessions`,
    `Refine ${focus.toLowerCase()} techniques with advanced materials`,
    `Consolidate ${focus.toLowerCase()} skills and identify remaining gaps`,
  ]
  return goals[weekNumber % 4]
}

function getDayObjective(skillFocus: string, dayNumber: number): string {
  const objectives: Record<string, string[]> = {
    Vocabulary: [
      'Learn 10 new topic-specific words',
      'Practice using new words in sentences',
      'Review collocations and word families',
      'Complete vocabulary exercise',
      'Learn 10 more topic words',
      'Review all words learned this week',
      'Self-test on weekly vocabulary',
    ],
    Reading: [
      'Practice skimming for main ideas',
      'Practice scanning for specific details',
      'Answer heading-matching questions',
      'Answer True/False/Not Given questions',
      'Practice summary completion',
      'Timed reading exercise',
      'Review reading strategies',
    ],
    Writing: [
      'Study essay structure basics',
      'Practice writing introductions',
      'Write one body paragraph',
      'Review complex sentence structures',
      'Write a full Task 2 essay',
      'Practice Task 1 description',
      'Review and improve your writing',
    ],
    Listening: [
      'Practice Section 1 listening',
      'Practice Section 2 listening',
      'Practice Section 3 listening',
      'Practice Section 4 listening',
      'Answer multiple-choice questions',
      'Practice form completion',
      'Review listening strategies',
    ],
    Speaking: [
      'Practice Part 1 introduction questions',
      'Practice describing people and places',
      'Practice Part 2 cue card topics',
      'Practice expressing opinions',
      'Practice Part 3 discussion questions',
      'Record and review your speaking',
      'Review useful speaking phrases',
    ],
    Grammar: [
      'Review tenses and articles',
      'Practice conditionals and modals',
      'Review passive voice',
      'Practice relative clauses',
      'Review reported speech',
      'Practice sentence transformation',
      'Review common grammar mistakes',
    ],
  }

  const skillObjectives = objectives[skillFocus] ?? [
    `Practice ${skillFocus.toLowerCase()} skills`,
    `Review ${skillFocus.toLowerCase()} techniques`,
    `Apply ${skillFocus.toLowerCase()} strategies`,
    `Complete ${skillFocus.toLowerCase()} exercise`,
    `Advanced ${skillFocus.toLowerCase()} practice`,
    `Timed ${skillFocus.toLowerCase()} session`,
    `Review ${skillFocus.toLowerCase()} progress`,
  ]

  return skillObjectives[dayNumber % 7]
}

function getTaskTitle(skillFocus: string, dayNumber: number, objective: string): string {
  const titles: Record<string, string[]> = {
    Vocabulary: [
      'Learn 10 new IELTS vocabulary words',
      'Practice using vocabulary in sentences',
      'Review word families and collocations',
      'Complete vocabulary exercise',
      'Learn 10 more topic-specific words',
      'Weekly vocabulary review quiz',
      'Self-test on saved vocabulary',
    ],
    Reading: [
      'Skim a passage for main ideas',
      'Scan for specific information',
      'Match headings to paragraphs',
      'Answer True/False/Not Given questions',
      'Complete a summary with words from the passage',
      'Timed reading practice (20 min)',
      'Review reading test strategies',
    ],
    Writing: [
      'Study Task 2 essay structure',
      'Write an introduction paragraph',
      'Develop a body paragraph with examples',
      'Practice complex sentence structures',
      'Write a full Task 2 opinion essay',
      'Practice Task 1 data description',
      'Review and improve yesterday\'s essay',
    ],
    Listening: [
      'Listen to Section 1 conversation',
      'Listen to Section 2 monologue',
      'Listen to Section 3 group discussion',
      'Listen to Section 4 lecture',
      'Answer multiple-choice listening questions',
      'Practice form and note completion',
      'Review listening tips and strategies',
    ],
    Speaking: [
      'Practice Part 1: personal questions',
      'Describe a person or place you know',
      'Practice a Part 2 cue card topic',
      'Express opinions on familiar topics',
      'Practice Part 3: abstract discussion',
      'Record yourself speaking for 3 minutes',
      'Review speaking band descriptors',
    ],
    Grammar: [
      'Review articles and tenses',
      'Practice conditionals and modals',
      'Master passive voice constructions',
      'Practice relative clauses',
      'Review reported speech rules',
      'Practice sentence transformation exercises',
      'Review common grammar mistakes from your notes',
    ],
  }

  const skillTitles = titles[skillFocus] ?? [
    `Practice ${skillFocus.toLowerCase()} - session ${dayNumber + 1}`,
  ]
  return skillTitles[dayNumber % skillTitles.length]
}

function getTaskDescription(skillFocus: string, objective: string): string {
  return `Focus: ${skillFocus}. ${objective}. This task helps strengthen your ${skillFocus.toLowerCase()} skills for IELTS.`
}

function getTaskMinutes(skillFocus: string, dailyMinutes: number): number {
  const estimates: Record<string, number> = {
    Vocabulary: 15,
    Reading: 25,
    Writing: 30,
    Listening: 25,
    Speaking: 15,
    Grammar: 15,
  }
  return Math.min(estimates[skillFocus] ?? 20, dailyMinutes)
}

export function generateRoadmap(settings: AppSettings, existingTasks: TaskEntry[]): RoadmapData {
  const today = new Date()
  const numberOfPhases = 4
  const weeksPerPhase = 4
  const totalWeeks = numberOfPhases * weeksPerPhase

  const weakSkills = settings.weakSkills.length > 0
    ? settings.weakSkills
    : ['Vocabulary', 'Reading', 'Writing', 'Listening', 'Speaking', 'Grammar']

  const doneTaskIds = new Set(existingTasks.filter(t => t.isDone).map(t => t.id))
  const doneDates = new Set(existingTasks.filter(t => t.isDone).map(t => t.date.slice(0, 10)))

  const phases: RoadmapPhase[] = []

  for (let p = 0; p < numberOfPhases; p++) {
    const weeks: RoadmapWeek[] = []

    for (let w = 0; w < weeksPerPhase; w++) {
      const weekIndex = p * weeksPerPhase + w
      const focus = getWeekFocus(p, w, weakSkills)
      const dates = getWeekDates(today, weekIndex)
      const days: RoadmapDay[] = []

      for (let d = 0; d < 7; d++) {
        const dateStr = dates[d]
        const skillFocus = weakSkills[(weekIndex * 7 + d) % weakSkills.length]
        const objective = getDayObjective(skillFocus, d)
        const taskTitle = getTaskTitle(skillFocus, d, objective)

        const existingTask = existingTasks.find(
          t => t.date.slice(0, 10) === dateStr && t.title === taskTitle
        )
        const taskId = existingTask?.id ?? null
        const isComplete = existingTask ? existingTask.isDone : doneDates.has(dateStr)

        days.push({
          id: generateId(),
          date: dateStr,
          dayNumber: d + 1,
          skillFocus,
          taskId,
          isComplete,
          objective,
        })
      }

      const completedTasks = days.filter(d => d.isComplete).length
      weeks.push({
        id: generateId(),
        weekNumber: weekIndex + 1,
        label: `Week ${weekIndex + 1}`,
        focus,
        goal: getWeekGoal(p, w, focus),
        days,
        isComplete: days.every(d => d.isComplete),
        completedTasks,
        totalTasks: days.length,
      })
    }

    const phaseCompleted = weeks.every(w => w.isComplete)
    const phaseDone = weeks.reduce((s, w) => s + w.completedTasks, 0)
    const phaseTotal = weeks.reduce((s, w) => s + w.totalTasks, 0)
    phases.push({
      id: generateId(),
      name: getPhaseName(p, settings.targetBand),
      description: getPhaseDescription(p, settings.targetBand),
      order: p,
      targetRange: getPhaseTargetRange(p),
      weeks,
      isComplete: phaseCompleted,
      completedTasks: phaseDone,
      totalTasks: phaseTotal,
    })
  }

  const totalTasks = phases.reduce((s, p) => s + p.totalTasks, 0)
  const completedTasks = phases.reduce((s, p) => s + p.completedTasks, 0)
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  let currentPhaseIndex = 0
  let currentWeekIndex = 0

  for (let p = 0; p < phases.length; p++) {
    if (!phases[p].isComplete) {
      currentPhaseIndex = p
      for (let w = 0; w < phases[p].weeks.length; w++) {
        if (!phases[p].weeks[w].isComplete) {
          currentWeekIndex = w
          break
        }
      }
      break
    }
  }

  return {
    phases,
    currentPhaseIndex,
    currentWeekIndex,
    overallProgress,
    totalTasks,
    completedTasks,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function saveRoadmap(roadmap: RoadmapData): void {
  try {
    localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(roadmap))
  } catch (err) {
    console.error('Failed to save roadmap:', err)
  }
}

export function loadRoadmap(): RoadmapData | null {
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RoadmapData
  } catch {
    return null
  }
}

export function loadUserSettings(): AppSettings | null {
  try {
    return loadAppSettings()
  } catch {
    return null
  }
}

export async function ensureRoadmap(): Promise<RoadmapData> {
  const existing = loadRoadmap()
  const settings = loadUserSettings()
  if (!settings) {
    throw new Error('User settings not found. Please complete onboarding first.')
  }

  const tasks = await DatabaseService.getAll<TaskEntry>('tasks')

  if (existing && existing.generatedAt) {
    const existingGenerated = new Date(existing.generatedAt)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (existingGenerated > oneDayAgo && existing.phases.length > 0) {
      const updated = recalculateProgress(existing, tasks)
      saveRoadmap(updated)
      return updated
    }
  }

  try {
    const { generatePlanWithAI } = await import('./aiRoadmapGenerator')
    const completedTaskCount = tasks.filter(t => t.isDone).length
    const result = await generatePlanWithAI(settings, { completedTaskCount })
    if (result.roadmap) {
      saveRoadmap(result.roadmap)
      return result.roadmap
    }
  } catch {
    // AI generation failed; fall through to static generation
  }

  const roadmap = generateRoadmap(settings, tasks)
  saveRoadmap(roadmap)
  return roadmap
}

export function recalculateProgress(roadmap: RoadmapData, tasks: TaskEntry[]): RoadmapData {
  const doneDates = new Set(tasks.filter(t => t.isDone).map(t => t.date.slice(0, 10)))
  const doneMap = new Map(tasks.filter(t => t.isDone).map(t => [t.id, true]))

  let totalCompleted = 0
  let totalAll = 0

  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        if (day.taskId && doneMap.has(day.taskId)) {
          day.isComplete = true
        } else if (!day.taskId && doneDates.has(day.date)) {
          day.isComplete = true
        }
        if (day.isComplete) totalCompleted++
        totalAll++
      }
      week.completedTasks = week.days.filter(d => d.isComplete).length
      week.totalTasks = week.days.length
      week.isComplete = week.days.every(d => d.isComplete)
    }
    phase.completedTasks = phase.weeks.reduce((s, w) => s + w.completedTasks, 0)
    phase.totalTasks = phase.weeks.reduce((s, w) => s + w.totalTasks, 0)
    phase.isComplete = phase.weeks.every(w => w.isComplete)
  }

  let currentPhaseIndex = 0
  let currentWeekIndex = 0
  for (let p = 0; p < roadmap.phases.length; p++) {
    if (!roadmap.phases[p].isComplete) {
      currentPhaseIndex = p
      for (let w = 0; w < roadmap.phases[p].weeks.length; w++) {
        if (!roadmap.phases[p].weeks[w].isComplete) {
          currentWeekIndex = w
          break
        }
      }
      break
    }
  }

  return {
    ...roadmap,
    currentPhaseIndex,
    currentWeekIndex,
    overallProgress: totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0,
    totalTasks: totalAll,
    completedTasks: totalCompleted,
    updatedAt: new Date().toISOString(),
  }
}

export async function toggleTask(roadmap: RoadmapData, phaseIndex: number, weekIndex: number, dayIndex: number): Promise<RoadmapData> {
  const day = roadmap.phases[phaseIndex].weeks[weekIndex].days[dayIndex]
  day.isComplete = !day.isComplete

  if (day.taskId) {
    try {
      const task = await DatabaseService.get<TaskEntry>('tasks', day.taskId)
      if (task) {
        if (day.isComplete) {
          await DatabaseService.update('tasks', day.taskId, {
            isDone: true,
            completedAt: new Date().toISOString(),
          } as Partial<TaskEntry>)
        } else {
          await DatabaseService.update('tasks', day.taskId, {
            isDone: false,
            completedAt: null,
          } as Partial<TaskEntry>)
        }
      }
    } catch (err) {
      day.isComplete = !day.isComplete
      throw err
    }
  }

  const updated = recalculateProgress(roadmap, [])
  saveRoadmap(updated)
  return updated
}

export function getCurrentWeek(roadmap: RoadmapData): { phase: RoadmapPhase; week: RoadmapWeek } | null {
  const phase = roadmap.phases[roadmap.currentPhaseIndex]
  if (!phase) return null
  const week = phase.weeks[roadmap.currentWeekIndex]
  if (!week) return null
  return { phase, week }
}

export function getTodayDay(roadmap: RoadmapData): { phase: RoadmapPhase; week: RoadmapWeek; day: RoadmapDay } | null {
  const todayStr = new Date().toISOString().split('T')[0]
  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        if (day.date === todayStr) {
          return { phase, week, day }
        }
      }
    }
  }

  const current = getCurrentWeek(roadmap)
  if (!current) return null
  const todayDay = current.week.days.find(d => d.date === new Date().toISOString().split('T')[0])
  if (todayDay) {
    return { ...current, day: todayDay }
  }
  const firstIncomplete = current.week.days.find(d => !d.isComplete)
  if (firstIncomplete) {
    return { ...current, day: firstIncomplete }
  }
  return { ...current, day: current.week.days[0] }
}

export function getRecommendations(roadmap: RoadmapData): RoadmapRecommendation[] {
  const recs: RoadmapRecommendation[] = []
  const current = getCurrentWeek(roadmap)

  if (!current) {
    if (roadmap.phases.length > 0 && roadmap.phases.every(p => p.isComplete)) {
      recs.push({
        type: 'milestone',
        message: 'Congratulations! You have completed all phases of your IELTS roadmap.',
        action: 'Take a mock test to assess your level',
        route: '/mock-tests',
      })
    }
    return recs
  }

  const incomplete = current.week.days.filter(d => !d.isComplete)
  if (incomplete.length > 0) {
    const next = incomplete[0]
    recs.push({
      type: 'next_task',
      message: `Continue with ${next.skillFocus}: ${next.objective}`,
      action: 'Start task',
    })
  }

  const weakSkillDays = current.week.days.filter(d => !d.isComplete)
  if (weakSkillDays.length > 2) {
    const skillCounts = new Map<string, number>()
    for (const d of weakSkillDays) {
      skillCounts.set(d.skillFocus, (skillCounts.get(d.skillFocus) ?? 0) + 1)
    }
    const mostNeeded = [...skillCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    if (mostNeeded) {
      recs.push({
        type: 'weak_skill',
        message: `You have ${weakSkillDays.length} incomplete tasks. Focus on ${mostNeeded[0]} to stay on track.`,
        action: `Practice ${mostNeeded[0]}`,
      })
    }
  }

  if (roadmap.completedTasks > 0 && roadmap.completedTasks % 7 === 0) {
    recs.push({
      type: 'milestone',
      message: `You have completed ${roadmap.completedTasks} tasks! Keep up the great work.`,
      action: 'View progress',
      route: '/progress',
    })
  }

  return recs
}

export function getNextIncompleteTask(roadmap: RoadmapData): RoadmapDay | null {
  const current = getCurrentWeek(roadmap)
  if (!current) return null
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTask = current.week.days.find(d => d.date === todayStr && !d.isComplete)
  if (todayTask) return todayTask
  return current.week.days.find(d => !d.isComplete) ?? null
}

export interface RoadmapUserProfile {
  targetBand: number
  currentBand: number
  examDate: string
  dailyStudyMinutes: number
  weakSkills: string[]
  studyGoal: StudyGoal
  preferredSchedule: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
}

export function getRoadmapUserProfile(): RoadmapUserProfile | null {
  const settings = loadAppSettings()
  if (!settings) return null
  return {
    targetBand: settings.targetBand,
    currentBand: settings.currentBand,
    examDate: settings.examDate,
    dailyStudyMinutes: settings.dailyStudyMinutes,
    weakSkills: settings.weakSkills,
    studyGoal: settings.studyGoal,
    preferredSchedule: settings.preferredSchedule,
  }
}

export function getTodayTask(roadmap: RoadmapData): RoadmapDay | null {
  const todayStr = new Date().toISOString().split('T')[0]
  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        if (day.date === todayStr) {
          return day
        }
      }
    }
  }
  return null
}

export function getExamCountdown(examDate: string): number {
  if (!examDate) return 0
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  if (isNaN(exam.getTime())) return 0
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diff = exam.getTime() - today.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}
