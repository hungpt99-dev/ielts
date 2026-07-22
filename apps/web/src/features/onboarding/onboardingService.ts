import type { StudyGoal } from '../../models'

import { taskRepo } from '../../services/repositories'
import { STORAGE_KEYS, DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER_ID } from '@ielts/config'

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export interface OnboardingData {
  currentBand: number
  targetBand: number
  examDate: string
  dailyStudyMinutes: number
  weakSkills: string[]
  strongSkills: string[]
  preferredTopics: string[]
  studyGoal: StudyGoal
  preferredSchedule: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[]
  preferredLanguage: string
  tutorStyle: 'encouraging' | 'direct' | 'detailed'
}

export function isOnboardingComplete(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    if (!raw) return false
    const settings = JSON.parse(raw)
    const study = settings.study
    return (
      typeof (study?.targetBand ?? settings.targetBand) === 'number' &&
      typeof (study?.currentBand ?? settings.currentBand) === 'number' &&
      typeof (study?.examDate ?? settings.examDate) === 'string' &&
      typeof (study?.dailyStudyMinutes ?? settings.dailyStudyMinutes) === 'number' &&
      Array.isArray(study?.weakSkills ?? settings.weakSkills) &&
      typeof (study?.studyGoal ?? settings.studyGoal) !== 'undefined'
    )
  } catch (error) {
    console.error('apps/web/src/features/onboarding/onboardingService.ts error:', error);
    return false
  }
}

function generateRoadmapTasks(settings: Record<string, unknown>): Array<{
  id: string
  title: string
  description: string
  category: 'Vocabulary' | 'Reading' | 'Listening' | 'Writing Task 2' | 'Speaking Part 1' | 'Grammar'
  date: string
  isDone: boolean
  isRecurring: boolean
  timeMinutes: number
  notes: string
  createdAt: string
  updatedAt: string
  completedAt: null
}> {
  const tasks: ReturnType<typeof generateRoadmapTasks> = []
  const today = new Date()
  const s = settings as { study?: Record<string, unknown>; weakSkills?: string[]; dailyStudyMinutes?: number }
  const study = s.study
  const weakSkills = (study?.weakSkills as string[]) ?? s.weakSkills ?? []
  const dailyMin = (study?.dailyStudyMinutes as number) ?? s.dailyStudyMinutes ?? 60
  const needsWriting = weakSkills.some(s => s.toLowerCase().includes('writing'))
  const needsSpeaking = weakSkills.some(s => s.toLowerCase().includes('speaking'))
  const needsReading = weakSkills.some(s => s.toLowerCase().includes('reading'))
  const needsListening = weakSkills.some(s => s.toLowerCase().includes('listening'))
  const needsVocab = weakSkills.some(s => s.toLowerCase().includes('vocabulary'))
  const needsGrammar = weakSkills.some(s => s.toLowerCase().includes('grammar'))

  const baseTasks = [
    { title: 'Learn 10 new IELTS vocabulary words', category: 'Vocabulary' as const, min: 10 },
    { title: 'Practice skimming with a short reading passage', category: 'Reading' as const, min: 15 },
    { title: 'Review complex sentences for Writing Task 2', category: 'Writing Task 2' as const, min: 15 },
    { title: 'Listen to a short audio and answer IELTS-style questions', category: 'Listening' as const, min: 15 },
    { title: 'Write one opinion paragraph', category: 'Writing Task 2' as const, min: 15 },
    { title: 'Practice speaking about a familiar topic for 3 minutes', category: 'Speaking Part 1' as const, min: 10 },
    { title: 'Review grammar: articles and tenses', category: 'Grammar' as const, min: 10 },
  ]

  const weekDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const dayIndex = today.getDay()
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  function getSkillTasks(skill: string, idx: number): string[] {
    const skillBase = skill.toLowerCase()
    const all: string[] = []
    baseTasks.forEach((t, i) => {
      if (t.category.toLowerCase().includes(skillBase) || skillBase.includes(t.category.toLowerCase().split(' ')[0])) {
        all.push(t.title)
      }
    })
    return all.length > 0 ? all : [baseTasks[idx % baseTasks.length].title]
  }

  function pickTaskForDay(dayOffset: number): typeof baseTasks[0] {
    const preferred = (study?.preferredSchedule as string[]) ?? settings.preferredSchedule
    const dayName = weekDays[((mondayOffset + dayOffset + 7) % 7)] as typeof weekDays[number]
    const prefersToday = preferred.includes(dayName)
    const index = (dayOffset + (prefersToday ? 0 : 2)) % baseTasks.length
    return baseTasks[index]
  }

  for (let day = 0; day < 28; day++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]
    const base = pickTaskForDay(day)
    let category = base.category

    if (day === 0) {
      category = 'Vocabulary'
    } else if (needsWriting && day % 3 === 0) {
      category = 'Writing Task 2'
    } else if (needsSpeaking && day % 4 === 0) {
      category = 'Speaking Part 1'
    } else if (needsReading && day % 2 === 0) {
      category = 'Reading'
    } else if (needsListening && day % 2 === 0) {
      category = 'Listening'
    } else if (needsGrammar && day % 5 === 0) {
      category = 'Grammar'
    }

    tasks.push({
      id: generateId(),
      title: base.title,
      description: `Focus on improving your ${category.toLowerCase()} skills. Estimated time: ${base.min} minutes.`,
      category,
      date: dateStr,
      isDone: false,
      isRecurring: false,
      timeMinutes: Math.min(base.min, dailyMin),
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    })
  }

  return tasks
}

export async function completeOnboarding(data: OnboardingData): Promise<void> {
  const settings: Record<string, unknown> = {
    version: 1,
    study: {
      targetBand: data.targetBand,
      currentBand: data.currentBand,
      examDate: data.examDate || undefined,
      dailyStudyMinutes: data.dailyStudyMinutes,
      weakSkills: data.weakSkills,
      nativeLanguage: data.preferredLanguage || '',
      studyGoal: data.studyGoal,
      preferredSchedule: data.preferredSchedule,
    },
    ai: {
      providerId: DEFAULT_AI_PROVIDER_ID,
      model: undefined,
      customApiUrl: undefined,
      temperature: undefined,
    },
    theme: {
      mode: 'system' as const,
      accentColor: '#2563eb',
    },
    notifications: {
      enabled: true,
      reminderTime: '09:00',
    },
  }

  localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify(settings))
  localStorage.setItem(STORAGE_KEYS.localStorage.onboardingComplete, 'true')
  localStorage.setItem(STORAGE_KEYS.localStorage.preferredLanguage, data.preferredLanguage || 'en')
  localStorage.setItem(STORAGE_KEYS.localStorage.tutorStyle, data.tutorStyle || 'encouraging')
  localStorage.setItem(STORAGE_KEYS.localStorage.strongSkills, JSON.stringify(data.strongSkills || []))

  const existingTasks = await taskRepo.findAll()
  if (existingTasks.length === 0) {
    const roadmapTasks = generateRoadmapTasks(settings)
    await taskRepo.bulkCreate(roadmapTasks)
  }
}
