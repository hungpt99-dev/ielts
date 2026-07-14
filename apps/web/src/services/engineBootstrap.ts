import { createAITutorEngine } from '@ielts/ai-tutor-engine'
import type { AITutorEngine, AITutorEngineDependencies } from '@ielts/ai-tutor-engine'
import type { TutorAIClient } from '@ielts/ai-tutor-engine'
import { callAI, AiConfigurationResolver } from '@ielts/ai'
import type { AiCredentialProvider, ResolvedAiConnectionConfig } from '@ielts/ai'
import { userConfigurationSchema } from '@ielts/settings'
import type { AiUserSettings } from '@ielts/settings'
import { DEFAULT_APP_CONFIG, AI_PROVIDER_DEFINITIONS, STORAGE_KEYS } from '@ielts/config'
import { LearnerContextBuilder, CachedContextBuilder } from '@ielts/ai-tutor-engine'
import type { ContextSourceRegistry } from '@ielts/ai-tutor-engine'
import { SystemClock } from '@ielts/ai-tutor-engine'
import { AI_TUTOR_CACHE } from '../features/ai-tutor/constants'
import { createLearningEngine, createDefaultSkillRegistry } from '@ielts/learning-engine'
import type { LearningEngine } from '@ielts/learning-engine'
import { DatabaseService } from '../services/storage/Database'

const AI_TUTOR_KEY = 'ielts-ai-tutor-engine'

let engineInstance: AITutorEngine | null = null
let learningEngineInstance: LearningEngine | null = null

const systemClock = new SystemClock()

function mapNativeLanguage(lang: string | undefined): string {
  if (!lang || lang === '' || lang.toLowerCase() === 'auto') return 'english'
  const lower = lang.toLowerCase()
  const map: Record<string, string> = {
    vi: 'vietnamese', vietnamese: 'vietnamese',
    en: 'english', english: 'english',
    ar: 'arabic', arabic: 'arabic',
    bn: 'bengali', bengali: 'bengali',
    nl: 'dutch', dutch: 'dutch',
    fr: 'french', french: 'french',
    de: 'german', german: 'german',
    el: 'greek', greek: 'greek',
    hi: 'hindi', hindi: 'hindi',
    id: 'indonesian', indonesian: 'indonesian',
    it: 'italian', italian: 'italian',
    ja: 'japanese', japanese: 'japanese',
    ko: 'korean', korean: 'korean',
    ms: 'malay', malay: 'malay',
    fa: 'persian', persian: 'persian',
    pl: 'polish', polish: 'polish',
    pt: 'portuguese', portuguese: 'portuguese',
    ru: 'russian', russian: 'russian',
    es: 'spanish', spanish: 'spanish',
    sw: 'swahili', swahili: 'swahili',
    tl: 'tagalog', tagalog: 'tagalog',
    ta: 'tamil', tamil: 'tamil',
    th: 'thai', thai: 'thai',
    tr: 'turkish', turkish: 'turkish',
    ur: 'urdu', urdu: 'urdu',
    'chinese': 'chinese', 'chinese (simplified)': 'chinese',
    'chinese (traditional)': 'chinese',
  }
  return map[lower] ?? 'english'
}

function createAiCredentialProvider(): AiCredentialProvider {
  return {
      async getCredential(providerId) {
        try {
          const key = localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}${providerId}`)
          if (key) return { apiKey: key }
          const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
          if (!raw) return undefined
          const config = JSON.parse(raw)
          const flatKey = config?.aiApiKey
          if (flatKey) return { apiKey: flatKey }
          return undefined
        } catch { return undefined }
      },
    async storeCredential() {},
    async clearCredential() {},
  }
}

async function resolveAiConfig(): Promise<ResolvedAiConnectionConfig> {
  const resolver = new AiConfigurationResolver(
    createAiCredentialProvider(),
    DEFAULT_APP_CONFIG.ai,
  )

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    const userSettings: AiUserSettings = raw
      ? { providerId: 'openai', ...JSON.parse(raw)?.ai }
      : { providerId: 'openai' }
    return await resolver.resolve(userSettings)
  } catch {
    return {
      providerId: 'openai',
      adapterType: 'openai-compatible',
      apiUrl: AI_PROVIDER_DEFINITIONS.openai.defaultApiUrl ?? '',
      model: DEFAULT_APP_CONFIG.ai.defaultModel,
      timeoutMs: DEFAULT_APP_CONFIG.ai.timeoutMs,
      maxRetries: DEFAULT_APP_CONFIG.ai.maxRetries,
      temperature: DEFAULT_APP_CONFIG.ai.temperature,
    }
  }
}

function createAIClient(): TutorAIClient {
  let resolvedConfigCache: ResolvedAiConnectionConfig | null = null

  async function getResolvedConfig() {
    if (resolvedConfigCache) return resolvedConfigCache
    resolvedConfigCache = await resolveAiConfig()
    return resolvedConfigCache
  }

  return {
    async generateStructured(request: any) {
      const config = await getResolvedConfig()
      const result = await callAI(
        request.systemPrompt ?? '',
        request.userMessage ?? '',
        () => ({
          apiKey: config.apiKey ?? '',
          baseUrl: config.apiUrl,
          model: config.model,
          temperature: request.temperature ?? config.temperature,
          maxTokens: request.maxTokens ?? 2048,
        }),
        {
          temperature: request.temperature ?? config.temperature,
          maxTokens: request.maxTokens ?? 2048,
        },
      )
      if (result.content) {
        try { return { success: true as const, data: JSON.parse(result.content) } }
        catch {
          return { success: true as const, data: { text: result.content } }
        }
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
      } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
    },
    async saveSession(session: any) {
      try {
        await DatabaseService.safePut('aiContents', {
          id: session.id,
          type: 'general',
          prompt: 'chat-session',
          content: JSON.stringify(session),
          title: 'Chat Session',
          topic: 'general',
          model: 'engine',
          tokens: 0,
          tags: [],
          isFavorite: false,
          createdAt: new Date().toISOString(),
        })
      } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
      }
    },
    async appendMessages(sessionId: string, messages: any[]) {
      for (const msg of messages) {
        try {
          await DatabaseService.safePut('aiContents', {
            id: msg.id,
            type: msg.type ?? 'general',
            prompt: msg.prompt ?? 'chat-message',
            content: msg.content ?? '',
            title: msg.title ?? '',
            topic: msg.topic ?? 'general',
            model: msg.model ?? '',
            tokens: msg.tokens ?? 0,
            tags: msg.tags ?? [],
            isFavorite: msg.isFavorite ?? false,
            createdAt: msg.createdAt ?? new Date().toISOString(),
            sessionId,
          })
        } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
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
        const raw = localStorage.getItem(`${STORAGE_KEYS.localStorage.tutorMemoryPrefix}${learnerId}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          store.set(learnerId, parsed)
          return parsed
        }
      } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
      }
      return null
    },
    async save(memory: any) {
      store.set(memory.learnerId, memory)
      try { localStorage.setItem(`${STORAGE_KEYS.localStorage.tutorMemoryPrefix}${memory.learnerId}`, JSON.stringify(memory)) } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
      }
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
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
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
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findActive() {
        try {
          const all = await DatabaseService.safeGetAll('aiContents')
          return all
            .filter((a: any) => a.prompt === 'learning-session' && a.content)
            .map((a: any) => JSON.parse(a.content))
            .filter((s: any) => s.status === 'in-progress' || s.status === 'prepared')
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
    },
    attemptRepository: {
      async getById(id: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingPracticeSessions')
          return all.find((a: any) => a.id === id) ?? null
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
      },
      async save(attempt: any) {
        try { await DatabaseService.safePut('readingPracticeSessions', attempt) } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findBySession(sessionId: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingPracticeSessions')
          return all.filter((a: any) => a.sessionId === sessionId)
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
    },
    outcomeRepository: {
      async save(outcome: any) {
        try { await DatabaseService.safePut('progressRecords', outcome) } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findRecent(query?: any) {
        try {
          const all = await DatabaseService.safeGetAll('progressRecords')
          let filtered = all as any[]
          if (query?.skill) filtered = filtered.filter((o: any) => o.skill === query.skill)
          filtered.sort((a: any, b: any) => String(b.completedAt ?? '').localeCompare(String(a.completedAt ?? '')))
          return query?.limit ? filtered.slice(0, query.limit) : filtered
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
    },
    exerciseRepository: {
      async getById(id: string) {
        try {
          const all = await DatabaseService.safeGetAll('readingExercises')
          return all.find((a: any) => a.id === id) ?? null
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
      },
      async save(exercise: any) {
        try {
          await DatabaseService.safePut('readingExercises', {
            id: exercise.id,
            title: exercise.title ?? 'Exercise',
            description: exercise.description ?? '',
            skill: exercise.skill ?? 'reading',
            topic: exercise.topic ?? 'general',
            source: exercise.source ?? 'ai-generated',
            difficulty: exercise.difficulty ?? 'intermediate',
            content: typeof exercise.content === 'string' ? exercise.content : JSON.stringify(exercise.content ?? ''),
            questions: Array.isArray(exercise.questions) ? JSON.stringify(exercise.questions) : (exercise.questions ?? '[]'),
            totalPoints: exercise.totalPoints ?? 0,
            estimatedMinutes: exercise.estimatedMinutes ?? 0,
            status: exercise.status ?? 'published',
            tags: exercise.tags ?? [],
            sourceId: exercise.sourceId,
            contentVersion: exercise.contentVersion,
            metadata: typeof exercise.metadata === 'string' ? exercise.metadata : JSON.stringify(exercise.metadata ?? {}),
            isFavorite: exercise.isFavorite ?? false,
            createdAt: exercise.createdAt ?? new Date().toISOString(),
            updatedAt: exercise.updatedAt ?? new Date().toISOString(),
          })
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
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
        try { await DatabaseService.safePut('mistakes', mistake) } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findRecent(skill: string, limit = 10) {
        try {
          const all = await DatabaseService.safeGetAll('mistakes')
          const filtered = all.filter((m: any) => !skill || m.skill === skill)
          filtered.sort((a: any, b: any) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
          return filtered.slice(0, limit)
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
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
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
      },
      async getByTopic() { return [] },
      async updateMastery() {},
      async markReviewed() {},
    },
    eventPublisher: {
      async publish(event: any) {
        try {
          await DatabaseService.safePut('aiContents', {
            id: event.id ?? `evt-${Date.now()}`,
            type: event.type === 'learning_session_completed' || event.type === 'roadmap_task_fulfilled' ? 'general' : 'general',
            prompt: event.type ?? 'learning-event',
            content: JSON.stringify(event),
            title: event.type ?? 'Event',
            topic: event.skill ?? 'general',
            model: 'engine',
            tokens: 0,
            tags: [],
            isFavorite: false,
            createdAt: event.occurredAt ?? new Date().toISOString(),
          })
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
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async publishMany(events: any[]) {
        for (const event of events) {
          try {
            await this.publish(event)
          } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
          }
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
          const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
          if (!raw) return {}
          const rawObj = JSON.parse(raw)
          const parsed = userConfigurationSchema.safeParse(rawObj)
          if (!parsed.success) return {}
          const { study, ai } = parsed.data
          return {
            ...parsed.data,
            currentOverallBand: study.currentBand,
            targetOverallBand: study.targetBand,
            currentBand: study.currentBand,
            targetBand: study.targetBand,
            examDate: study.examDate,
            weakSkills: study.weakSkills,
            studyGoal: study.studyGoal,
            dailyStudyMinutes: study.dailyStudyMinutes,
            preferredSchedule: study.preferredSchedule,
            aiEnabled: !!(rawObj.aiApiKey || ai.providerId),
            aiProvider: ai.providerId,
            aiApiKey: rawObj.aiApiKey ?? '',
            aiBaseUrl: ai.customApiUrl ?? '',
            aiModel: ai.model ?? '',
          }
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return {} }
      },
      async save(profile: any) {
        try { localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify(profile)) } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
    }

    const settingsRepo = {
      async getProactiveSettings() {
        try {
          const raw = localStorage.getItem(AI_TUTOR_KEY)
          return raw ? JSON.parse(raw) : getDefaultSettings()
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return getDefaultSettings() }
      },
      async saveProactiveSettings(settings: any) {
        try { localStorage.setItem(AI_TUTOR_KEY, JSON.stringify(settings)) } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
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
        try { localStorage.setItem('tutor-event', JSON.stringify(event)) } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      publishLearningEvent(event: any) {
        try {
          DatabaseService.safePut('progressRecords', event)
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
    }

    const registry: ContextSourceRegistry = {
      sources: new Map(),
      register(name: string, source: any) { this.sources.set(name, source) },
      get(name: string) { return this.sources.get(name) },
      getAll() { return Array.from(this.sources.values()) },
      async collectAll() { return Array.from(this.sources.values()) },
    }

    const contextBuilder = new LearnerContextBuilder({
      registry,
      getProfile: () => profileRepo.get(),
      getExamContext: async () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
          const settings = raw ? JSON.parse(raw) : {}
          const study = settings.study ?? {}
          const examDate = study.examDate ?? null
          if (!examDate) return {}
          const daysUntil = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return { examDate, daysUntilExam: Math.max(0, daysUntil), isUrgent: daysUntil <= 30, isFinalWeek: daysUntil <= 7 }
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return {} }
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
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
      },
      getProgress: async () => {
        try {
          const records = await DatabaseService.getAll<any>('progressRecords')
          const recent = records.filter(r => r.type === 'learning-outcome')
          const overall = recent.length > 0 ? Math.round(recent.reduce((s: number, r: any) => s + (r.value ?? 0), 0) / recent.length * 100) : 0
          return { overallCompletionPercent: overall, skillProgress: {}, weeklyCompletionPercent: 0, studyStreak: 0, inactiveDays: 0, consistency: 0 }
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return {} }
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
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return {} }
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
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return { total: 0, unreviewed: 0, recentCount: 0, recurringPatterns: [], bySkill: {} } }
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
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return { totalSaved: 0, dueForReview: 0, mastered: 0, byTopic: {} } }
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
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return { lastActiveAt: null, todayStudyMinutes: 0, weeklyStudyMinutes: 0, tasksCompletedToday: 0 } }
      },
      getPreferences: async () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
          const settings = raw ? JSON.parse(raw) : {}
          const study = settings.study ?? {}
          return {
            preferredMode: 'general-teacher' as const,
            language: mapNativeLanguage(study.nativeLanguage as string),
            explanationLevel: 'detailed' as const,
            correctionStyle: 'gentle' as const,
            proactiveEnabled: true,
            maxProactiveMessagesPerDay: 5,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            allowedCategories: [],
          }
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return {} }
      },
    })

    const cachedBuilder = new CachedContextBuilder(contextBuilder)
    const deps: AITutorEngineDependencies = {
      aiClient: createAIClient(),
      contextBuilder: cachedBuilder,
      messageRepository: msgRepo as any,
      memoryRepository: memRepo as any,
      settingsRepository: settingsRepo as any,
      eventPublisher: eventPublisher as any,
      clock: systemClock,
      progressReviewTtlMs: AI_TUTOR_CACHE.PROGRESS_REVIEW_TTL_MS,
      progressReviewCache: {
        get: () => {
          try {
            const raw = localStorage.getItem(AI_TUTOR_CACHE.PROGRESS_REVIEW_STORAGE_KEY)
            if (!raw) return null
            const entry = JSON.parse(raw)
            const age = Date.now() - new Date(entry.generatedAt).getTime()
            if (age > AI_TUTOR_CACHE.PROGRESS_REVIEW_TTL_MS) {
              localStorage.removeItem(AI_TUTOR_CACHE.PROGRESS_REVIEW_STORAGE_KEY)
              return null
            }
            return entry
          } catch { return null }
        },
        set: (result) => {
          try { localStorage.setItem(AI_TUTOR_CACHE.PROGRESS_REVIEW_STORAGE_KEY, JSON.stringify(result)) } catch {}
        },
      },
    }

    engineInstance = createAITutorEngine(deps)
    await engineInstance.initialize()
    return engineInstance
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
    return null
  }
}

export function getAITutorEngine(): AITutorEngine | null {
  return engineInstance
}

export async function initializeLearningEngine(): Promise<LearningEngine | null> {
  if (learningEngineInstance) return learningEngineInstance
  try {
    const repos = createDependencyRepos()

    async function readConfigFromSettings() {
      try {
        const config = await resolveAiConfig()
        return {
          apiKey: config.apiKey ?? '',
          baseUrl: config.apiUrl,
          model: config.model,
        }
      } catch {
        return { apiKey: '', baseUrl: AI_PROVIDER_DEFINITIONS.openai.defaultApiUrl ?? '', model: DEFAULT_APP_CONFIG.ai.defaultModel }
      }
    }

    // Use AI Tutor Engine's context builder when initialized, otherwise build from localStorage
    const tutorEngine = getAITutorEngine()

    learningEngineInstance = createLearningEngine({
      contextPort: {
        async buildLearningContext() {
          const aiAvailable = !!(await readConfigFromSettings()).apiKey
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
          const cfg = await readConfigFromSettings()
          if (!cfg.apiKey) return { success: false, error: { code: 'ai_not_configured', message: 'No AI API key', recoverable: true } }
          try {
            const { callAI } = await import('@ielts/ai')
            const raw = await callAI(request.systemPrompt ?? '', request.userMessage ?? '', () => cfg, { temperature: request.temperature ?? 0.5, maxTokens: request.maxTokens ?? 2000 })
            if (raw.error) return { success: false, error: { code: 'ai_failed', message: raw.error, recoverable: true } }
            try { return { success: true, data: JSON.parse(raw.content ?? '{}') } }
            catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return { success: true, data: { text: raw.content } } }
          } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return { success: false, error: { code: 'ai_unavailable', message: 'AI unavailable', recoverable: true } } }
        },
        async evaluateOpenResponse(request: any) {
          const cfg = await readConfigFromSettings()
          if (!cfg.apiKey) return { success: false, error: { code: 'ai_not_configured', message: 'No AI API key', recoverable: true } }
          try {
            const { callAI } = await import('@ielts/ai')
            const raw = await callAI(`Evaluate this ${request.rubric?.join(', ') ?? 'response'}.\nReturn JSON.`, request.response ?? '', () => cfg, { temperature: 0.3, maxTokens: 1500 })
            if (raw.error) return { success: false, error: { code: 'ai_failed', message: raw.error, recoverable: true } }
            try { return { success: true, data: JSON.parse(raw.content ?? '{}') } }
            catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return { success: true, data: { feedback: raw.content } } }
          } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return { success: false, error: { code: 'ai_unavailable', message: 'AI unavailable', recoverable: true } } }
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
          } catch (error) {
          console.error('apps/web/src/services/engineBootstrap.ts error:', error);
          }
          try {
            const existing = localStorage.getItem(`${STORAGE_KEYS.localStorage.tutorMemoryPrefix}learning`)
            const mem = existing ? JSON.parse(existing) : { sessions: [], mistakes: [], strengths: [] }
            mem.sessions.push({ skill: outcome.skill, score: outcome.score, maxScore: outcome.maximumScore, accuracy: outcome.accuracy, timestamp: new Date().toISOString() })
            if (outcome.mistakes?.length) mem.mistakes.push(...outcome.mistakes)
            if (outcome.strengths?.length) mem.strengths.push(...outcome.strengths)
            localStorage.setItem(`${STORAGE_KEYS.localStorage.tutorMemoryPrefix}learning`, JSON.stringify(mem))
          } catch (error) {
          console.error('apps/web/src/services/engineBootstrap.ts error:', error);
          }
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
          } catch (error) {
        console.error('apps/web/src/services/engineBootstrap.ts error:', error);
          }
        },
      },
      ...repos,
      clock: systemClock,
      skillRegistry: createDefaultSkillRegistry(),
    })
    return learningEngineInstance
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
    return null
  }
}

export function getLearningEngine(): LearningEngine | null {
  return learningEngineInstance
}
