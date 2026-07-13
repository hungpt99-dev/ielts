import { createAITutorEngine } from '@ielts/ai-tutor-engine'
import type { AITutorEngine, AITutorEngineDependencies } from '@ielts/ai-tutor-engine'
import type { TutorAIClient } from '@ielts/ai-tutor-engine'
import { callAI } from '@ielts/ai'
import { LearnerContextBuilder } from '@ielts/ai-tutor-engine'
import type { ContextSourceRegistry } from '@ielts/ai-tutor-engine'
import { SystemClock } from '@ielts/ai-tutor-engine'
import { createLearningEngine, createDefaultSkillRegistry } from '@ielts/learning-engine'
import type { LearningEngine } from '@ielts/learning-engine'
import { DatabaseService } from '../services/storage/Database'

const AI_TUTOR_KEY = 'ielts-ai-tutor-engine'

let engineInstance: AITutorEngine | null = null
let learningEngineInstance: LearningEngine | null = null

const systemClock = new SystemClock()

function createAIClient(): TutorAIClient {
  return {
    async generateStructured(request: any) {
      const result = await callAI(request.systemPrompt ?? '', request.userMessage ?? '', {
        temperature: request.temperature ?? 0.3,
        maxTokens: request.maxTokens ?? 2048,
      })
      if (result.content) {
        try { return { success: true as const, data: JSON.parse(result.content) } }
        catch { return { success: true as const, data: { text: result.content } } }
      }
      return { success: false as const, error: { code: 'ai_failed', message: result.error ?? 'AI call failed', recoverable: true } }
    },
  }
}

function createDbMessageRepository() {
  return {
    async findSession(sessionId: string) {
      try {
        const msgs = await DatabaseService.queryByIndex('aiContents', 'sessionId', sessionId)
        return msgs.length > 0 ? { id: sessionId, messages: msgs } : null
      } catch { return null }
    },
    async saveSession(session: any) {
      try { await DatabaseService.safePut('aiContents', session) } catch {}
    },
    async appendMessages(sessionId: string, messages: any[]) {
      for (const msg of messages) {
        try { await DatabaseService.safePut('aiContents', { ...msg, sessionId }) } catch {}
      }
    },
  }
}

function createDbMemoryRepository() {
  const store = new Map<string, any>()
  return {
    async get(learnerId: string) {
      if (store.has(learnerId)) return store.get(learnerId)
      try {
        const raw = localStorage.getItem(`tutor-memory-${learnerId}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          store.set(learnerId, parsed)
          return parsed
        }
      } catch {}
      return null
    },
    async save(memory: any) {
      store.set(memory.learnerId, memory)
      try { localStorage.setItem(`tutor-memory-${memory.learnerId}`, JSON.stringify(memory)) } catch {}
    },
  }
}

function createDependencyRepos() {
  return {
    sessionRepository: {
      async getById(id: string) {
        try {
          const all = await DatabaseService.safeGetAll('aiContents')
          const found = all.find((a: any) => a.id === id)
          if (!found) return null
          if (found.prompt === 'learning-session' && found.content) {
            return JSON.parse(found.content)
          }
          return found
        } catch { return null }
      },
      async save(session: any) {
        try {
          await DatabaseService.safePut('aiContents', {
            id: session.id,
            type: 'general' as const,
            prompt: 'learning-session',
            content: JSON.stringify(session),
            title: 'Session',
            topic: 'general',
            model: 'engine',
            tokens: 0,
            tags: [],
            isFavorite: false,
            createdAt: new Date().toISOString(),
          })
        } catch {}
      },
      async findActive() {
        try {
          const all = await DatabaseService.safeGetAll('aiContents')
          return all
            .filter((a: any) => a.prompt === 'learning-session' && a.content)
            .map((a: any) => JSON.parse(a.content))
            .filter((s: any) => s.status === 'in-progress' || s.status === 'prepared')
        } catch { return [] }
      },
    },
    attemptRepository: {
      async getById(id: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingPracticeSessions')
          return all.find((a: any) => a.id === id) ?? null
        } catch { return null }
      },
      async save(attempt: any) {
        try { await DatabaseService.safePut('readingPracticeSessions', attempt) } catch {}
      },
      async findBySession(sessionId: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingPracticeSessions')
          return all.filter((a: any) => a.sessionId === sessionId)
        } catch { return [] }
      },
    },
    outcomeRepository: {
      async save(outcome: any) {
        try { await DatabaseService.safePut('progressRecords', outcome) } catch {}
      },
      async findRecent(query?: any) {
        try {
          const all = await DatabaseService.safeGetAll('progressRecords')
          let filtered = all as any[]
          if (query?.skill) filtered = filtered.filter((o: any) => o.skill === query.skill)
          filtered.sort((a: any, b: any) => String(b.completedAt ?? '').localeCompare(String(a.completedAt ?? '')))
          return query?.limit ? filtered.slice(0, query.limit) : filtered
        } catch { return [] }
      },
    },
    exerciseRepository: {
      async getById(id: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingExercises')
          return all.find((a: any) => a.id === id) ?? null
        } catch { return null }
      },
      async save(exercise: any) {
        try { await DatabaseService.safePut('readingExercises', exercise) } catch {}
      },
    },
    progressRepository: {
      async getSkillProgress() { return {} },
      async updateSkillProgress() {},
      async getOverallProgress() { return 0 },
      async updateOverallProgress() {},
    },
    mistakeRepository: {
      async save(mistake: any) {
        try { await DatabaseService.safePut('mistakes', mistake) } catch {}
      },
      async findRecent(skill: string, limit = 10) {
        try {
          const all = await DatabaseService.safeGetAll('mistakes')
          const filtered = all.filter((m: any) => !skill || m.skill === skill)
          filtered.sort((a: any, b: any) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
          return filtered.slice(0, limit)
        } catch { return [] }
      },
      async findByPattern() { return [] },
      async getRecurringPatterns() { return [] },
    },
    vocabularyRepository: {
      async getDueForReview(limit = 10) {
        try {
          const all = await DatabaseService.safeGetAll('vocabulary')
          const now = new Date().toISOString()
          return all.filter((v: any) => v.nextReviewAt && v.nextReviewAt <= now).slice(0, limit)
        } catch { return [] }
      },
      async getByTopic() { return [] },
      async updateMastery() {},
      async markReviewed() {},
    },
    eventPublisher: {
      async publish(event: any) {
        try {
          await DatabaseService.safePut('aiContents', event)
          if (event.type === 'learning_session_completed' || event.type === 'roadmap_task_fulfilled') {
            await DatabaseService.safePut('progressRecords', {
              id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: event.type as any,
              value: event.accuracy ?? event.score ?? 0,
              date: new Date().toISOString().slice(0, 10),
              category: event.skill ?? 'general',
              label: event.type,
              createdAt: new Date().toISOString(),
              metadata: JSON.stringify(event),
            })
          }
        } catch {}
      },
      async publishMany(events: any[]) {
        for (const event of events) {
          try {
            await this.publish(event)
          } catch {}
        }
      },
    },
  }
}

export async function initializeAITutorEngine(): Promise<AITutorEngine | null> {
  if (engineInstance) return engineInstance

  try {
    const profileRepo = {
      async get() {
        try {
          const raw = localStorage.getItem('ielts-settings')
          return raw ? JSON.parse(raw) : null
        } catch { return null }
      },
      async save(profile: any) {
        try { localStorage.setItem('ielts-settings', JSON.stringify(profile)) } catch {}
      },
    }

    const settingsRepo = {
      async getProactiveSettings() {
        try {
          const raw = localStorage.getItem(AI_TUTOR_KEY)
          return raw ? JSON.parse(raw) : getDefaultSettings()
        } catch { return getDefaultSettings() }
      },
      async saveProactiveSettings(settings: any) {
        try { localStorage.setItem(AI_TUTOR_KEY, JSON.stringify(settings)) } catch {}
      },
    }

    function getDefaultSettings() {
      return {
        enabled: true,
        browserNotifications: false,
        extensionNotifications: false,
        aiEnhanced: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        maxMessagesPerDay: 5,
        minIntervalMinutes: 60,
        categories: {},
        examReminders: true,
        inactivityReminders: true,
        vocabularyReminders: true,
        roadmapReminders: true,
        motivationMessages: true,
        preferredTone: 'friendly' as const,
        preferredMessageLength: 'medium' as const,
      }
    }

    const memRepo = createDbMemoryRepository()
    const msgRepo = createDbMessageRepository()

    const eventPublisher = {
      publishTutorEvent(event: any) {
        try { localStorage.setItem('tutor-event', JSON.stringify(event)) } catch {}
      },
      publishLearningEvent(event: any) {
        try {
          DatabaseService.safePut('progressRecords', event)
        } catch {}
      },
    }

    const registry: ContextSourceRegistry = {
      sources: new Map(),
      register(name: string, source: any) { this.sources.set(name, source) },
      get(name: string) { return this.sources.get(name) },
      getAll() { return Array.from(this.sources.values()) },
    }

    const contextBuilder = new LearnerContextBuilder({
      registry,
      getProfile: () => profileRepo.get(),
      getExamContext: async () => {
        try {
          const settings = JSON.parse(localStorage.getItem('ielts-settings') ?? '{}')
          const examDate = settings.examDate ?? null
          if (!examDate) return {}
          const daysUntil = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return { examDate, daysUntilExam: Math.max(0, daysUntil), isUrgent: daysUntil <= 30, isFinalWeek: daysUntil <= 7 }
        } catch { return {} }
      },
      getRoadmapContext: async () => {
        try {
          const tasks = await DatabaseService.getAll<any>('tasks')
          const todayStr = new Date().toISOString().slice(0, 10)
          const todayTasks = tasks.filter(t => t.date?.slice(0, 10) === todayStr)
          return {
            active: tasks.length > 0,
            currentPhase: null,
            currentWeek: null,
            todayTasks: todayTasks.map(t => ({ id: t.id, title: t.title ?? '', skill: t.category ?? 'reading', estimatedMinutes: t.estimatedMinutes ?? 20, isCompleted: !!t.isDone, isMissed: false, dueDate: t.date })),
            nextTasks: [],
            completedTasks: tasks.filter(t => t.isDone).length,
            missedTasks: 0,
            weeklyStudyMinutesTarget: 300,
            weeklyStudyMinutesCompleted: 0,
          }
        } catch { return null }
      },
      getProgress: async () => {
        try {
          const records = await DatabaseService.getAll<any>('progressRecords')
          const recent = records.filter(r => r.type === 'learning-outcome')
          const overall = recent.length > 0 ? Math.round(recent.reduce((s: number, r: any) => s + (r.value ?? 0), 0) / recent.length * 100) : 0
          return { overallCompletionPercent: overall, skillProgress: {}, weeklyCompletionPercent: 0, studyStreak: 0, inactiveDays: 0, consistency: 0 }
        } catch { return {} }
      },
      getSkillStates: async () => {
        try {
          const records = await DatabaseService.getAll<any>('progressRecords')
          const outcomes = records.filter(r => r.type === 'learning-outcome' || r.type === 'learning_session_completed')
          const bySkill: any = {}
          for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
            const skillOutcomes = outcomes.filter((o: any) => o.category === skill || o.metadata?.includes(skill))
            bySkill[skill] = {
              skill,
              currentBand: undefined,
              targetBand: undefined,
              gap: undefined,
              recentPerformance: skillOutcomes.length > 0 ? Math.round(skillOutcomes.reduce((s: number, o: any) => s + (o.value ?? 0), 0) / skillOutcomes.length) : undefined,
              trend: 'unknown' as const,
              confidence: 0.5,
              priorityScore: 0,
              frequentWeaknesses: [],
              recentStrengths: [],
            }
          }
          return bySkill
        } catch { return {} }
      },
      getMistakes: async () => {
        try {
          const all = await DatabaseService.getAll<any>('mistakes')
          return {
            total: all.length,
            unreviewed: all.filter(m => m.status === 'new').length,
            recentCount: all.filter(m => new Date(m.createdAt) > new Date(Date.now() - 7 * 86400000)).length,
            recurringPatterns: [],
            bySkill: {},
          }
        } catch { return { total: 0, unreviewed: 0, recentCount: 0, recurringPatterns: [], bySkill: {} } }
      },
      getVocabulary: async () => {
        try {
          const all = await DatabaseService.getAll<any>('vocabulary')
          return {
            totalSaved: all.length,
            dueForReview: all.filter((v: any) => v.nextReviewAt && v.nextReviewAt <= new Date().toISOString()).length,
            mastered: all.filter((v: any) => v.status === 'mastered').length,
            byTopic: {},
          }
        } catch { return { totalSaved: 0, dueForReview: 0, mastered: 0, byTopic: {} } }
      },
      getActivity: async () => {
        try {
          const tasks = await DatabaseService.getAll<any>('tasks')
          const todayStr = new Date().toISOString().slice(0, 10)
          return {
            lastActiveAt: new Date().toISOString(),
            todayStudyMinutes: 0,
            weeklyStudyMinutes: 0,
            tasksCompletedToday: tasks.filter(t => t.isDone && t.completedAt?.slice(0, 10) === todayStr).length,
          }
        } catch { return { lastActiveAt: null, todayStudyMinutes: 0, weeklyStudyMinutes: 0, tasksCompletedToday: 0 } }
      },
      getPreferences: async () => {
        try {
          const settings = JSON.parse(localStorage.getItem('ielts-settings') ?? '{}')
          return {
            preferredMode: 'general-teacher' as const,
            language: settings.nativeLanguage === 'vi' ? 'vietnamese' as const : 'english' as const,
            explanationLevel: 'detailed' as const,
            correctionStyle: 'gentle' as const,
            proactiveEnabled: true,
            maxProactiveMessagesPerDay: 5,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            allowedCategories: [],
          }
        } catch { return {} }
      },
    })

    const deps: AITutorEngineDependencies = {
      aiClient: createAIClient(),
      contextBuilder,
      messageRepository: msgRepo as any,
      memoryRepository: memRepo as any,
      settingsRepository: settingsRepo as any,
      eventPublisher: eventPublisher as any,
      clock: systemClock,
    }

    engineInstance = createAITutorEngine(deps)
    await engineInstance.initialize()
    return engineInstance
  } catch {
    return null
  }
}

export function getAITutorEngine(): AITutorEngine | null {
  return engineInstance
}

function readAiConfig() {
  try {
    const s = JSON.parse(localStorage.getItem('ielts-settings') ?? '{}')
    return { apiKey: s.aiApiKey ?? '', baseUrl: s.aiBaseUrl ?? 'https://api.openai.com/v1', model: s.aiModel ?? 'gpt-4o-mini' }
  } catch { return { apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' } }
}

export async function initializeLearningEngine(): Promise<LearningEngine | null> {
  if (learningEngineInstance) return learningEngineInstance
  try {
    const repos = createDependencyRepos()

    // Use AI Tutor Engine's context builder when initialized, otherwise build from localStorage
    const tutorEngine = getAITutorEngine()

    learningEngineInstance = createLearningEngine({
      contextPort: {
        async buildLearningContext() {
          const aiAvailable = !!readAiConfig().apiKey
          return {
            generatedAt: new Date().toISOString(),
            learner: {
              currentSkillBands: {},
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              examType: 'academic',
            },
            progress: { skillProgress: {}, recentAccuracy: {}, trendBySkill: {} },
            weaknesses: [],
            strengths: [],
            recentMistakes: [],
            savedVocabulary: [],
            relevantContent: [],
            recentAttempts: [],
            previousFeedback: [],
            preferences: { preferredLearningMethods: [], preferredTaskTypes: [], preferredLanguage: 'en' },
            constraints: { offlineOnly: false, aiAvailable },
            contextQuality: { status: 'partial', missingSources: [], staleSources: [], warnings: [] },
          }
        },
      },
      tutorPort: {
        async getLearnerContext() { return null as any },
        async selectTeachingStrategy() { return { strategy: 'explain', reason: 'default' } },
        async generateEducationalContent(request: any) {
          const cfg = readAiConfig()
          if (!cfg.apiKey) return { success: false, error: { code: 'ai_not_configured', message: 'No AI API key', recoverable: true } }
          try {
            const { callAI } = await import('@ielts/ai')
            const raw = await callAI(request.systemPrompt ?? '', request.userMessage ?? '', () => cfg, { temperature: request.temperature ?? 0.5, maxTokens: request.maxTokens ?? 2000 })
            if (raw.error) return { success: false, error: { code: 'ai_failed', message: raw.error, recoverable: true } }
            try { return { success: true, data: JSON.parse(raw.content ?? '{}') } }
            catch { return { success: true, data: { text: raw.content } } }
          } catch { return { success: false, error: { code: 'ai_unavailable', message: 'AI unavailable', recoverable: true } } }
        },
        async evaluateOpenResponse(request: any) {
          const cfg = readAiConfig()
          if (!cfg.apiKey) return { success: false, error: { code: 'ai_not_configured', message: 'No AI API key', recoverable: true } }
          try {
            const { callAI } = await import('@ielts/ai')
            const raw = await callAI(`Evaluate this ${request.rubric?.join(', ') ?? 'response'}.\nReturn JSON.`, request.response ?? '', () => cfg, { temperature: 0.3, maxTokens: 1500 })
            if (raw.error) return { success: false, error: { code: 'ai_failed', message: raw.error, recoverable: true } }
            try { return { success: true, data: JSON.parse(raw.content ?? '{}') } }
            catch { return { success: true, data: { feedback: raw.content } } }
          } catch { return { success: false, error: { code: 'ai_unavailable', message: 'AI unavailable', recoverable: true } } }
        },
        async explainFeedback() { return { explanation: '', suggestions: [] } },
        async recordLearningOutcome(outcome: any) {
          try {
            await DatabaseService.safePut('progressRecords', {
              id: `outcome-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'learning-outcome' as const,
              value: outcome.accuracy ?? 0,
              date: new Date().toISOString().slice(0, 10),
              category: outcome.skill,
              label: `${outcome.skill} session`,
              createdAt: new Date().toISOString(),
              metadata: JSON.stringify(outcome),
            })
          } catch {}
          try {
            const existing = localStorage.getItem('tutor-memory-learning')
            const mem = existing ? JSON.parse(existing) : { sessions: [], mistakes: [], strengths: [] }
            mem.sessions.push({ skill: outcome.skill, score: outcome.score, maxScore: outcome.maximumScore, accuracy: outcome.accuracy, timestamp: new Date().toISOString() })
            if (outcome.mistakes?.length) mem.mistakes.push(...outcome.mistakes)
            if (outcome.strengths?.length) mem.strengths.push(...outcome.strengths)
            localStorage.setItem('tutor-memory-learning', JSON.stringify(mem))
          } catch {}
          return { success: true }
        },
      },
      studyPlanPort: {
        async getCurrentTask() { return null },
        async getTaskById() { return null },
        async markTaskFulfilled(taskId: string, accuracy?: number) {
          try {
            const tasks = await DatabaseService.safeGetAll('tasks')
            const task = tasks.find((t: any) => t.id === taskId)
            if (task) {
              task.isDone = true
              task.completedAt = new Date().toISOString()
              task.accuracy = accuracy
              await DatabaseService.safePut('tasks', task)
            }
          } catch {}
        },
      },
      ...repos,
      clock: systemClock,
      skillRegistry: createDefaultSkillRegistry(),
    })
    return learningEngineInstance
  } catch {
    return null
  }
}

export function getLearningEngine(): LearningEngine | null {
  return learningEngineInstance
}
