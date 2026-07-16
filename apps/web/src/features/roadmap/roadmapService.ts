import type { TaskEntry, StudyGoal } from '../../models'
import { DatabaseService } from '../../services/storage/Database'

import {
  STORAGE_KEYS,
  DEFAULT_APP_CONFIG,
  AI_PROVIDER_DEFINITIONS,
  DEFAULT_AI_API_URL,
  DEFAULT_TARGET_BAND,
  DEFAULT_CURRENT_BAND,
  DEFAULT_DAILY_STUDY_MINUTES,
  DEFAULT_STUDY_GOAL,
  DEFAULT_SCHEDULE,
  DEFAULT_WEAK_SKILLS,
  DEFAULT_AI_MAX_TOKENS,
  DEFAULT_PLAN_ENRICH_MAX_CALLS,
} from '@ielts/config'
import { SKILL_TO_CATEGORY } from './constants'
import { getLearningEngine } from '../../services/engineBootstrap'
import type { RoadmapLearningTask } from '@ielts/learning-engine'

const CATEGORY_TO_SKILL: Record<string, 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary'> = {
  Vocabulary: 'vocabulary',
  Reading: 'reading',
  Listening: 'listening',
  'Writing Task 1': 'writing',
  'Writing Task 2': 'writing',
  'Speaking Part 1': 'speaking',
  'Speaking Part 2': 'speaking',
  'Speaking Part 3': 'speaking',
  Grammar: 'grammar',
  'Mock Test': 'reading',
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export interface RoadmapDay {
  id: string
  date: string
  dayNumber: number
  taskIds: string[]
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

const ROADMAP_STORAGE_KEY = STORAGE_KEYS.localStorage.roadmap

const PHASE_META = [
  { name: 'Foundation Building', desc: 'Build essential vocabulary, grammar, and basic IELTS skills', range: 'Building foundations' },
  { name: 'Skill Development', desc: 'Develop core strategies for each IELTS skill section', range: 'Developing core skills' },
  { name: 'Advanced Practice', desc: 'Practice with complex materials and timed exercises', range: 'Advanced practice' },
  { name: 'Test Readiness', desc: 'Simulate full tests and refine weak areas before exam day', range: 'Preparing for exam day' },
]

const WEEK_FOCUS_TEMPLATES = [
  (s: string) => `${s} Fundamentals`,
  (s: string) => `${s} Practice & Application`,
  (s: string) => `${s} Advanced Techniques`,
  (s: string) => `${s} Review & Assessment`,
]

const WEEK_GOAL_TEMPLATES = [
  (s: string) => `Master the basics of ${s.toLowerCase()} with daily exercises`,
  (s: string) => `Apply ${s.toLowerCase()} strategies in timed practice sessions`,
  (s: string) => `Refine ${s.toLowerCase()} techniques with advanced materials`,
  (s: string) => `Consolidate ${s.toLowerCase()} skills and identify remaining gaps`,
]

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

const TASK_TITLES: Record<string, string[]> = {
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

const SKILL_NAMES = ['Vocabulary', 'Reading', 'Writing', 'Listening', 'Speaking', 'Grammar']

function getStudyDates(settings: Record<string, unknown>): string[] {
  const today = new Date()
  const s = settings as { study?: Record<string, unknown>; preferredSchedule?: string[]; examDate?: string }
  const study = s.study
  const preferredSchedule = (study?.preferredSchedule as string[]) ?? (s.preferredSchedule ?? [])
  const examDate = (study?.examDate as string) ?? s.examDate
  const scheduleSet = new Set(preferredSchedule.map(d => d.toLowerCase()))
  const hasSchedule = scheduleSet.size > 0 && !preferredSchedule.every(d => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].includes(d))

  const endDate = examDate ? new Date(examDate.slice(0, 10) + 'T00:00:00') : new Date(today)
  if (!examDate || endDate <= today) {
    endDate.setDate(endDate.getDate() + 84)
  }
  const maxDays = Math.min(Math.ceil((endDate.getTime() - today.getTime()) / 86400000), 365)
  const dates: string[] = []
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().slice(0, 3)
    if (!hasSchedule || scheduleSet.has(dayKey)) {
      dates.push(d.toISOString().split('T')[0])
    }
  }
  return dates
}

function getPhaseCount(totalStudyDays: number): number {
  if (totalStudyDays <= 7) return 1
  if (totalStudyDays <= 21) return 2
  if (totalStudyDays <= 49) return 3
  return 4
}

function getTaskTitle(skillFocus: string, dayOffset: number): string {
  const titles = TASK_TITLES[skillFocus]
  if (!titles) return `Practice ${skillFocus.toLowerCase()} - session ${dayOffset + 1}`
  return titles[dayOffset % titles.length]
}

export async function generateRoadmap(settings: Record<string, unknown>, existingTasks: TaskEntry[]): Promise<RoadmapData> {
  const s = settings as { study?: Record<string, unknown>; weakSkills?: string[]; dailyStudyMinutes?: number }
  const study = s.study
  const weakSkillsRaw = (study?.weakSkills as string[]) ?? (s.weakSkills ?? [])
  const weakSkills = weakSkillsRaw.length > 0 ? weakSkillsRaw : [...SKILL_NAMES]
  const studyDates = getStudyDates(settings)
  const numberOfPhases = getPhaseCount(studyDates.length)
  const daysPerPhase = Math.ceil(studyDates.length / numberOfPhases)

  const doneDates = new Set(existingTasks.filter(t => t.isDone).map(t => t.date.slice(0, 10)))
  const existingByKey = new Map(existingTasks.map(t => [t.date.slice(0, 10) + '|' + t.title, t]))

  const phases: RoadmapPhase[] = []

  for (let p = 0; p < numberOfPhases; p++) {
    const phaseStart = p * daysPerPhase
    const phaseEnd = Math.min(phaseStart + daysPerPhase, studyDates.length)
    const phaseDates = studyDates.slice(phaseStart, phaseEnd)
    const weeks: RoadmapWeek[] = []
    const skillsInPhase = weakSkills.slice(p % weakSkills.length).concat(weakSkills.slice(0, p % weakSkills.length))

    for (let w = 0; w < Math.ceil(phaseDates.length / 7); w++) {
      const weekStart = w * 7
      const weekEnd = Math.min(weekStart + 7, phaseDates.length)
      const weekDates = phaseDates.slice(weekStart, weekEnd)
      const skillForWeek = skillsInPhase[w % skillsInPhase.length]
      const focus = WEEK_FOCUS_TEMPLATES[w % 4](skillForWeek)
      const days: RoadmapDay[] = []
      let weekDone = 0

      const dailyStudyMinutesVal = (study?.dailyStudyMinutes as number) ?? s.dailyStudyMinutes ?? 60
      const tasksPerDay = Math.max(1, Math.min(4, Math.round(dailyStudyMinutesVal / 22)))

      for (let d = 0; d < weekDates.length; d++) {
        const dateStr = weekDates[d]
        const dayOffset = studyDates.indexOf(dateStr)
        const taskIds: string[] = []

        for (let t = 0; t < tasksPerDay; t++) {
          const globalTaskIdx = dayOffset * tasksPerDay + t
          const skillFocus = skillsInPhase[globalTaskIdx % skillsInPhase.length]
          const objective = getDayObjective(skillFocus, globalTaskIdx)
          const taskTitle = getTaskTitle(skillFocus, globalTaskIdx)
          const timeMinutes = Math.min(Math.round(dailyStudyMinutesVal / tasksPerDay), 30)

          const existing = existingByKey.get(dateStr + '|' + taskTitle)
          if (existing) {
            taskIds.push(existing.id)
            if (existing.isDone) weekDone++
          } else {
            const isDone = doneDates.has(dateStr)
            const entry = await DatabaseService.addTask({
              title: taskTitle,
              description: `Skill: ${skillFocus}. ${objective}`,
              category: SKILL_TO_CATEGORY[skillFocus] ?? 'Vocabulary',
              date: dateStr + 'T00:00:00.000Z',
              isDone,
              isRecurring: false,
              recurringDays: [],
              notes: '',
              timeMinutes,
              completedAt: isDone ? new Date().toISOString() : null,
            })
            taskIds.push(entry.id)
            if (isDone) weekDone++
          }
        }

        days.push({ id: generateId(), date: dateStr, dayNumber: d + 1, taskIds })
      }

      const total = days.length
      weeks.push({
        id: generateId(),
        weekNumber: weeks.length + 1,
        label: `Week ${weeks.length + 1}`,
        focus,
        goal: WEEK_GOAL_TEMPLATES[w % 4](focus),
        days,
        isComplete: total > 0 && weekDone === total,
        completedTasks: weekDone,
        totalTasks: total,
      })
    }

    const meta = PHASE_META[p] ?? PHASE_META[PHASE_META.length - 1]
    phases.push({
      id: generateId(),
      name: meta.name,
      description: meta.desc,
      order: p,
      targetRange: meta.range,
      weeks,
      isComplete: weeks.every(w => w.isComplete),
      completedTasks: weeks.reduce((s, w) => s + w.completedTasks, 0),
      totalTasks: weeks.reduce((s, w) => s + w.totalTasks, 0),
    })
  }

  const totalTasks = phases.reduce((s, p) => s + p.totalTasks, 0)
  const completedTasks = phases.reduce((s, p) => s + p.completedTasks, 0)

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
    overallProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
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
    const data = JSON.parse(raw) as RoadmapData & { phases: Array<{ weeks: Array<{ days: Array<{ tasks?: Array<{ taskId?: string | null }>; taskId?: string | null }> }> }> }

    for (const phase of data.phases) {
      for (const week of phase.weeks) {
        for (const day of week.days) {
          if (!day.taskIds) {
            if (day.tasks) {
              day.taskIds = day.tasks.map(t => t.taskId).filter((id): id is string => !!id)
              delete day.tasks
            } else if (day.taskId) {
              day.taskIds = day.taskId ? [day.taskId] : []
              delete day.taskId
            } else {
              day.taskIds = []
            }
            delete (day as any).skillFocus
            delete (day as any).objective
            delete (day as any).isComplete
          }
        }
      }
    }

    return data as RoadmapData
  } catch (error) {
    console.error('apps/web/src/features/roadmap/roadmapService.ts error:', error);
    return null
  }
}

async function loadUserSettings(): Promise<Record<string, unknown> | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('apps/web/src/features/roadmap/roadmapService.ts error:', error);
    return null
  }
}

export async function ensureRoadmap(): Promise<RoadmapData> {
  const existing = loadRoadmap()
  const settings = await loadUserSettings()
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
    // Clean up all tasks in the roadmap's date range before regenerating
    const dateSet = new Set<string>()
    for (const phase of existing.phases) {
      for (const week of phase.weeks) {
        for (const day of week.days) dateSet.add(day.date)
      }
    }
    const allDbTasks = await DatabaseService.getAll<TaskEntry>('tasks')
    for (const t of allDbTasks) {
      if (dateSet.has(t.date.slice(0, 10))) {
        try { await DatabaseService.remove('tasks', t.id) } catch (error) {
  console.error('apps/web/src/features/roadmap/roadmapService.ts error:', error);
        }
      }
    }
  }

  const roadmap = await generateRoadmapWithEngine(settings)
  if (roadmap) {
    saveRoadmap(roadmap)
    return roadmap
  }

  const error = new Error('Engine failed to generate a valid roadmap')
  console.error('[Roadmap]', error.message)
  throw error
}

export async function generateRoadmapWithEngine(settings: Record<string, unknown>): Promise<RoadmapData> {
  console.log('[RoadmapGen] Starting generateRoadmapWithEngine...')
  const { DailyPlanEngine, AiPlanOrchestrator, buildNormalizedProfile } = await import('@ielts/learning-engine')
  const { studyPlanToRoadmapData } = await import('./planConverter')
  const s = settings as Record<string, unknown>

  const today = new Date().toISOString().split('T')[0]
  const engine = new DailyPlanEngine()
  const study = s.study as Record<string, unknown> | undefined
  const defaultedExamDate = (study?.examDate as string) || (s.examDate as string) || new Date(Date.now() + 84 * 86400000).toISOString().split('T')[0]
  console.log('[RoadmapGen] Building profile...', { targetBand: study?.targetBand ?? s.targetBand, currentBand: study?.currentBand ?? s.currentBand })
  const profile = buildNormalizedProfile({
    settings: {
      targetBand: (study?.targetBand as number) ?? (s.targetBand as number) ?? DEFAULT_TARGET_BAND,
      currentBand: (study?.currentBand as number) ?? (s.currentBand as number) ?? DEFAULT_CURRENT_BAND,
      examDate: defaultedExamDate,
      dailyStudyMinutes: (study?.dailyStudyMinutes as number) ?? (s.dailyStudyMinutes as number) ?? DEFAULT_DAILY_STUDY_MINUTES,
      weakSkills: (study?.weakSkills as string[]) ?? (s.weakSkills as string[]) ?? [...DEFAULT_WEAK_SKILLS],
      studyGoal: (study?.studyGoal as string) ?? (s.studyGoal as string) ?? DEFAULT_STUDY_GOAL,
      preferredSchedule: (study?.preferredSchedule as string[]) ?? (s.preferredSchedule as string[]) ?? [...DEFAULT_SCHEDULE],
      aiEnabled: (s.aiEnabled as boolean) ?? !!((s.ai as Record<string, unknown>)?.apiKey || s.aiApiKey || localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}openai`)),
      aiProvider: (s.aiProvider as string) ?? (s.ai as Record<string, unknown>)?.providerId as string ?? 'openai',
      aiApiKey: (s.aiApiKey as string) ?? (s.ai as Record<string, unknown>)?.apiKey as string ?? localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}openai`) ?? '',
    },
    overrides: { planStartDate: today },
  })

  const result = engine.generatePlan(profile)
  console.log('[RoadmapGen] Engine plan result status:', result.status)

  if (result.status === 'success') {
    console.log('[RoadmapGen] Plan generated, enriching with AI...')
    const enriched = await enrichPlanWithAI(result.plan, profile, settings)
    const resolvedCurrentBand = (study?.currentBand as number) ?? (s.currentBand as number) ?? DEFAULT_CURRENT_BAND
    const resolvedTargetBand = (study?.targetBand as number) ?? (s.targetBand as number) ?? DEFAULT_TARGET_BAND
    const roadmap = await studyPlanToRoadmapData(enriched, resolvedCurrentBand, resolvedTargetBand)
    saveRoadmap(roadmap)
    return roadmap
  }

  if (result.status === 'requires-confirmation') {
    console.warn('Learning engine: high-risk plan, proceeding anyway')
  }

  if (result.status === 'failure') {
    console.warn('[Roadmap] Engine failure:', result.reason?.message)
  }
  return null
}

async function enrichPlanWithAI(
  plan: import('@ielts/learning-engine').StudyPlan,
  profile: import('@ielts/learning-engine').NormalizedProfile,
  settings: Record<string, unknown>,
): Promise<import('@ielts/learning-engine').StudyPlan> {
  console.log('[AIEnrich] Starting AI enrichment...')
  const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
  const userCfg = raw ? JSON.parse(raw) : {}
  const ai = (userCfg?.ai as Record<string, unknown>) ?? {}
  const providerId = (ai.providerId as string) ?? 'openai'
  const storedKey = localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}${providerId}`)
  const apiKey = (ai.apiKey as string) || (settings.aiApiKey as string) || storedKey || ''
  const hasAI = !!((settings.aiEnabled as boolean) ?? !!apiKey) && !!apiKey
  console.log('[AIEnrich] hasAI:', hasAI, 'providerId:', providerId, 'keyFound:', !!apiKey, 'planWeeks:', plan.weeks.length)
  if (!hasAI || plan.weeks.length === 0) {
    console.log('[AIEnrich] Skipping AI enrichment:', !hasAI ? 'no AI configured' : 'no weeks in plan')
    return plan
  }

  try {
    const { callAI } = await import('@ielts/ai')
    const { AiPlanOrchestrator, applyTaskEnrichments, buildTaskEnrichmentRequirements, selectRequirementsForAi, buildTaskGenerationBatches, calculateAffordableCandidateCount } = await import('@ielts/learning-engine')

    const config = {
      apiKey,
      baseUrl: (ai.customApiUrl as string) || (settings.aiBaseUrl as string) || AI_PROVIDER_DEFINITIONS[providerId as keyof typeof AI_PROVIDER_DEFINITIONS]?.defaultApiUrl || DEFAULT_AI_API_URL,
      model: (ai.model as string) || (settings.aiModel as string) || DEFAULT_APP_CONFIG.ai.defaultModel,
    }

    const aiCallFn: import('@ielts/learning-engine').AICallFn = async (systemPrompt, userPrompt) => {
      const result = await callAI(systemPrompt, userPrompt, () => config, {
        temperature: 0.7,
        maxTokens: DEFAULT_AI_MAX_TOKENS,
      })
      return result.content
    }

    // Build exact task enrichment requirements
    const requirements = buildTaskEnrichmentRequirements(plan)
    console.log('[AIEnrich] Built', requirements.length, 'enrichment requirements from plan tasks')

    // Select which requirements to send to AI (coverage policy)
    const affordableCount = calculateAffordableCandidateCount(
      { profileAnalysisCalls: 1, objectiveBatchCalls: 3, taskCandidateBatchCalls: 8, requiredCalls: 12, repairBudget: 1, maximumCalls: 13, hardCallLimit: 25 },
      DEFAULT_PLAN_ENRICH_MAX_CALLS,
    )
    const { selected, deterministic } = selectRequirementsForAi(requirements, {
      targetAiCoverage: 0.5,
      minimumAiPerWeekSkillGroup: 1,
      prioritizeWeakSkills: true,
      prioritizeHighValueTasks: true,
      distributeAcrossEntireRoadmap: true,
    }, affordableCount)

    console.log('[AIEnrich] Selected', selected.length, 'for AI,', deterministic.length, 'deterministic')

    const orchestrator = new AiPlanOrchestrator(aiCallFn, {
      callLimits: { maximumCallsPerGeneration: DEFAULT_PLAN_ENRICH_MAX_CALLS },
      onProgress: (phase, current, total) => {
        window.dispatchEvent(new CustomEvent('plan-enrich-progress', { detail: { phase, current, total } }))
      },
    })
    const enrichment = await orchestrator.enrichPlan({
      profile,
      planningWindow: plan.planningWindow,
      phases: plan.phases,
      weeks: plan.weeks,
      feasibility: plan.feasibility,
      skillGaps: computeSkillGaps(profile),
      requirements: selected,
    })
    console.log('[AIEnrich] enrichment candidates:', enrichment.taskCandidates?.length, 'plan tasks:', plan.tasks.length)

    // Apply exact task enrichment merge with coverage info
    const selectedForAiIds = selected.map(r => r.id)
    const { plan: enrichedPlan, report } = applyTaskEnrichments(
      plan,
      requirements,
      enrichment.taskCandidates ?? [],
      selectedForAiIds,
    )
    console.log('[AIEnrich] Enrichment merge report:', JSON.stringify({
      totalTaskRequirements: report.totalTaskRequirements,
      selectedForAi: report.selectedForAi,
      intentionallyDeterministic: report.intentionallyDeterministic,
      validAiCandidates: report.validAiCandidates,
      fallbackAfterAiFailureTasks: report.fallbackAfterAiFailureTasks,
      plannedDeterministicTasks: report.plannedDeterministicTasks,
      duplicates: report.duplicateRequirementIds.length,
      unknown: report.unknownRequirementIds.length,
    }))

    return enrichedPlan
  } catch (err) {
    console.error('apps/web/src/features/roadmap/roadmapService.ts error:', err);
    console.warn('AI enrichment failed, using deterministic plan:', err)
    return plan
  }
}

function computeSkillGaps(profile: import('@ielts/learning-engine').NormalizedProfile): import('@ielts/learning-engine').SkillGapScore[] {
  const skillNames = ['listening', 'reading', 'writing', 'speaking', 'vocabulary', 'grammar'] as const
  const scores: import('@ielts/learning-engine').SkillGapScore[] = []

  for (const skill of skillNames) {
    const current = (profile.currentSkillBands as Record<string, number>)[skill] ?? profile.currentOverallBand
    const target = (profile.targetSkillBands as Record<string, number>)[skill] ?? profile.targetOverallBand
    const bandGap = Math.max(0, target - current)

    const isWeak = profile.weakSkills.includes(skill as any)
    const priorityScore = (bandGap / 9) * 0.5 + (isWeak ? 0.3 : 0) + 0.2

    scores.push({
      skill: skill as any,
      bandGap,
      priorityScore: Math.round(priorityScore * 100) / 100,
      normalizedWeight: 0,
      reasons: [
        ...(bandGap > 0 ? [`Band gap of ${bandGap.toFixed(1)}`] : []),
        ...(isWeak ? ['User-declared weak skill'] : []),
      ],
    })
  }

  const total = scores.reduce((s, sc) => s + sc.priorityScore, 0) || 1
  for (const sc of scores) {
    sc.normalizedWeight = Math.round((sc.priorityScore / total) * 100) / 100
  }

  return scores
}

export function recalculateProgress(roadmap: RoadmapData, tasks: TaskEntry[]): RoadmapData {
  const taskMap = new Map(tasks.map(t => [t.id, t]))

  let totalCompleted = 0
  let totalAll = 0

  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      let weekDone = 0
      let weekTotal = 0
      for (const day of week.days) {
        for (const taskId of day.taskIds) {
          const dbTask = taskMap.get(taskId)
          if (dbTask?.isDone) totalCompleted++
          totalAll++
          if (dbTask?.isDone) weekDone++
          weekTotal++
        }
      }
      week.completedTasks = weekDone
      week.totalTasks = weekTotal
      week.isComplete = weekTotal > 0 && weekDone === weekTotal
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

export async function toggleTask(roadmap: RoadmapData, phaseIndex: number, weekIndex: number, dayIndex: number, taskIndex: number): Promise<RoadmapData> {
  const day = roadmap.phases[phaseIndex].weeks[weekIndex].days[dayIndex]
  const taskId = day.taskIds[taskIndex]

  const dbTask = await DatabaseService.getById<TaskEntry>('tasks', taskId)
  if (!dbTask) throw new Error('Task not found')

  const nowDone = !dbTask.isDone

  await DatabaseService.update('tasks', taskId, {
    isDone: nowDone,
    completedAt: nowDone ? new Date().toISOString() : null,
  } as Partial<TaskEntry>)

  if (nowDone) {
    const engine = getLearningEngine()
    if (engine) {
      const skill = CATEGORY_TO_SKILL[dbTask.category] ?? 'reading'
      const roadmapTask: RoadmapLearningTask = {
        roadmapId: roadmap.phases[phaseIndex]?.id ?? '',
        phaseId: roadmap.phases[phaseIndex]?.id ?? '',
        weekId: roadmap.phases[phaseIndex]?.weeks[weekIndex]?.id ?? '',
        taskId,
        skill: skill as any,
        taskType: dbTask.category.toLowerCase(),
        objective: dbTask.title,
        reason: `Roadmap task: ${dbTask.title}`,
        scheduledDate: dbTask.date,
        estimatedMinutes: dbTask.timeMinutes || 20,
        priority: 'normal',
        sourceType: 'roadmap',
      }
      try {
        const sessionResult = await engine.createSessionFromRoadmapTask(roadmapTask)
        if (sessionResult.status === 'success') {
          await engine.completeSession({
            sessionId: sessionResult.data.session.id,
            actualMinutes: 0,
            hintCount: 0,
            correlationId: taskId,
          })
        }
      } catch (error) {
 console.error('apps/web/src/features/roadmap/roadmapService.ts error:', error);
 /* engine recording is best-effort */ }
    }
  }

  const tasks = await DatabaseService.getAll<TaskEntry>('tasks')
  const updated = recalculateProgress(roadmap, tasks)
  saveRoadmap(updated)
  return updated
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
  let settings: Record<string, unknown> | null = null
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    settings = raw ? JSON.parse(raw) : null
  } catch { settings = null }
  if (!settings) return null
  const s = settings as Record<string, unknown>
  const study = s.study as Record<string, unknown> | undefined
  return {
    targetBand: (study?.targetBand as number) ?? (s.targetBand as number),
    currentBand: (study?.currentBand as number) ?? (s.currentBand as number),
    examDate: (study?.examDate as string) ?? (s.examDate as string),
    dailyStudyMinutes: (study?.dailyStudyMinutes as number) ?? (s.dailyStudyMinutes as number),
    weakSkills: (study?.weakSkills as string[]) ?? (s.weakSkills as string[]),
    studyGoal: (study?.studyGoal as string) ?? (s.studyGoal as string),
    preferredSchedule: (study?.preferredSchedule as string[]) ?? (s.preferredSchedule as string[]),
  }
}

export function getTodayTask(roadmap: RoadmapData, tasks: TaskEntry[]): { day: RoadmapDay; task: TaskEntry } | null {
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  const todayStr = new Date().toISOString().split('T')[0]
  for (const phase of roadmap.phases) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        if (day.date === todayStr) {
          const dayTasks = day.taskIds.map(id => taskMap.get(id)).filter((t): t is TaskEntry => !!t)
          const firstIncomplete = dayTasks.find(t => !t.isDone)
          return { day, task: firstIncomplete ?? dayTasks[0] }
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
