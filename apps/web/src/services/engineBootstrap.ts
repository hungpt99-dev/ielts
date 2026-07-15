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
  const credentialProvider = createAiCredentialProvider()
  const resolver = new AiConfigurationResolver(
    credentialProvider,
    DEFAULT_APP_CONFIG.ai,
  )

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    const userSettings: AiUserSettings = raw
      ? { providerId: 'openai', ...JSON.parse(raw)?.ai }
      : { providerId: 'openai' }
    const cred = await credentialProvider.getCredential(userSettings.providerId)
    console.log('[AiConfig] settings key found:', !!raw, 'provider:', userSettings.providerId, 'credential found:', !!cred)
    const resolved = await resolver.resolve(userSettings)
    console.log('[AiConfig] resolved apiKey present:', !!resolved.apiKey)
    return resolved
  } catch (err) {
    console.error('[AiConfig] fallback due to:', err)
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
          return { success: true as const, data: { response: result.content } }
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

function tryParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return raw as any }
  }
  return raw as T
}

function extractText(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  if (!raw || raw === '""' || raw === '{}') return ''
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'string') return parsed
    return parsed?.passage || parsed?.text || parsed?.transcript || ''
  } catch {
    return raw
  }
}

function normalizeEntry(entry: any, sourceTable: string): any {
  const id = entry.id || ''
  const title = entry.title || 'Untitled'
  const content = extractText(entry.content)
  const topic = entry.topic || 'General'
  const rawDiff = String(entry.difficulty || '').toLowerCase()
  const difficulty = rawDiff === 'beginner' || rawDiff === 'easy' ? 'beginner' : rawDiff === 'advanced' || rawDiff === 'hard' ? 'advanced' : 'intermediate'

  let questions = entry.questions
  if (!questions || (typeof questions === 'string' && questions === '[]')) {
    try {
      const notes = typeof entry.notes === 'string' ? JSON.parse(entry.notes) : entry.notes
      questions = JSON.stringify(notes?.questions || [])
    } catch { questions = '[]' }
  }
  if (!Array.isArray(questions) && typeof questions !== 'string') questions = '[]'
  if (Array.isArray(questions)) questions = JSON.stringify(questions)

  const estimatedMinutes = entry.estimatedMinutes || Math.max(1, Math.ceil((content.split(/\s+/).filter(Boolean).length || 1) / 80))
  const skill = (entry.skill as string) || 'reading'
  const source = entry.source === 'built-in' || sourceTable === 'readingPassages' ? 'built-in' : entry.source === 'user-created' || sourceTable === 'passages' ? 'user-created' : 'ai-generated'
  const metadata = tryParse(entry.metadata, {})

  if (skill === 'speaking') {
    console.log('[normalizeEntry] speaking:', JSON.stringify({ id: id.slice(0, 25), title: title.slice(0, 30), source, hasPhrases: !!(metadata as any)?.phrases }))
  }

  return { id, title, content, topic, difficulty, questions, estimatedMinutes, skill, source, metadata }
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
        try {
          await DatabaseService.safePut('readingPracticeSessions', {
            id: attempt.id,
            passageId: attempt.passageId ?? attempt.exerciseId ?? '',
            title: attempt.title ?? 'Practice Session',
            topic: attempt.topic ?? 'general',
            passageText: attempt.passageText ?? '',
            questions: attempt.questions ?? [],
            answers: Array.isArray(attempt.answers) ? Object.fromEntries(attempt.answers.map((a: any, i: number) => [`${i}`, a])) : (attempt.answers ?? {}),
            score: attempt.score ?? 0,
            totalQuestions: attempt.totalQuestions ?? 0,
            accuracy: attempt.accuracy ?? 0,
            timeSpentSeconds: attempt.timeSpentSeconds ?? 0,
            mistakes: attempt.mistakes ?? [],
            createdAt: attempt.createdAt ?? new Date().toISOString(),
          })
        } catch (error) {
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
          const tables = ['readingExercises', 'listeningExercises', 'readingPassages', 'passages'] as const
          for (const table of tables) {
            const item = await DatabaseService.safeGetById<any>(table, id).catch(() => undefined)
            if (item) return normalizeEntry(item, table)
          }
          return null
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return null }
      },
      async save(exercise: any) {
        try {
          const { exerciseToEntry } = await import('./learning/adapters/exercise-to-entry')
          await DatabaseService.safePut('readingExercises', exerciseToEntry(exercise))
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async delete(id: string) {
        try {
          await Promise.all([
            DatabaseService.safeRemove('readingExercises', id).catch(() => {}),
            DatabaseService.safeRemove('listeningExercises', id).catch(() => {}),
            DatabaseService.safeRemove('passages', id).catch(() => {}),
          ])
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
        }
      },
      async findAll(skill?: string) {
        try {
          const [reading, listening, seeded, userContent] = await Promise.all([
            DatabaseService.safeGetAll<any>('readingExercises').catch(() => []),
            DatabaseService.safeGetAll<any>('listeningExercises').catch(() => []),
            DatabaseService.safeGetAll<any>('readingPassages').catch(() => []),
            DatabaseService.safeGetAll<any>('passages').catch(() => []),
          ])
          const seen = new Set<string>()
          const all: any[] = []
          for (const entry of [
            ...reading.map((e: any) => normalizeEntry(e, 'readingExercises')),
            ...listening.map((e: any) => normalizeEntry(e, 'listeningExercises')),
            ...seeded.map((e: any) => normalizeEntry(e, 'readingPassages')),
            ...userContent.map((e: any) => normalizeEntry(e, 'passages')),
          ]) {
            if (!seen.has(entry.id)) {
              seen.add(entry.id)
              all.push(entry)
            }
          }
          return skill ? all.filter((e: any) => e.skill === skill) : all
        } catch (error) {
      console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return [] }
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
          const le = getLearningEngine()
          let records: any[]
          if (le) {
            const result = await le.getOutcomes()
            records = result.status === 'success' && result.data ? result.data.outcomes.map((o: any) => ({ ...o, type: 'learning-outcome' })) : []
          } else {
            records = await DatabaseService.getAll<any>('progressRecords')
          }
          const recent = records.filter(r => r.type === 'learning-outcome')
          const overall = recent.length > 0 ? Math.round(recent.reduce((s: number, r: any) => s + (r.value ?? 0), 0) / recent.length * 100) : 0
          const lastActiveKey = 'ielts-last-active-at'
          const stored = localStorage.getItem(lastActiveKey)
          const lastActive = stored ? new Date(stored) : new Date()
          const inactiveDays = Math.floor((Date.now() - lastActive.getTime()) / 86400000)
          const streakRaw = localStorage.getItem('ielts-study-streak')
          const studyStreak = streakRaw ? parseInt(streakRaw, 10) || 0 : 0
          return { overallCompletionPercent: overall, skillProgress: {}, weeklyCompletionPercent: 0, studyStreak, inactiveDays, consistency: 0 }
        } catch (error) {
 console.error('apps/web/src/services/engineBootstrap.ts error:', error);
 return {} }
      },
      getSkillStates: async () => {
        try {
          const le = getLearningEngine()
          let records: any[]
          if (le) {
            const result = await le.getOutcomes()
            records = result.status === 'success' && result.data ? result.data.outcomes.map((o: any) => ({ ...o, type: 'learning-outcome' })) : []
          } else {
            records = await DatabaseService.getAll<any>('progressRecords')
          }
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
          const le = getLearningEngine()
          let all: any[]
          if (le) {
            const result = await le.getMistakes()
            all = result.status === 'success' && result.data ? result.data.mistakes : []
          } else {
            all = await DatabaseService.getAll<any>('mistakes')
          }
          return {
            total: all.length,
            unreviewed: all.filter(m => m.status === 'new' || m.reviewStatus === 'unreviewed').length,
            recentCount: all.filter(m => new Date(m.createdAt || m.occurredAt) > new Date(Date.now() - 7 * 86400000)).length,
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
          const lastActiveKey = 'ielts-last-active-at'
          const stored = localStorage.getItem(lastActiveKey)
          const lastActiveAt = stored || new Date().toISOString()
          if (!stored) {
            localStorage.setItem(lastActiveKey, new Date().toISOString())
          }
          return {
            lastActiveAt,
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
          console.log('[AiTutorPort] generateEducationalContent apiKey:', !!cfg.apiKey, 'baseUrl:', cfg.baseUrl)
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
    await Promise.all([
      seedWritingPrompts(learningEngineInstance),
      seedListeningExercises(learningEngineInstance),
      seedSpeakingQuestions(learningEngineInstance),
      seedSpeakingPhrases(learningEngineInstance),
    ])
    return learningEngineInstance
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
    return null
  }
}

const WRITING_SEED_PROMPTS = [
  { taskType: 'task2', prompt: 'Some people believe that unpaid community service should be a compulsory part of high school programs. To what extent do you agree or disagree?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Education', description: 'Discuss compulsory community service in high schools' },
  { taskType: 'task2', prompt: 'In many countries, the amount of crime is increasing. What do you think are the main causes of crime? How can we deal with those causes?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Society', description: 'Analyze causes of crime and propose solutions' },
  { taskType: 'task2', prompt: 'Some people think that governments should spend more money on public services rather than on arts such as music and painting. To what extent do you agree or disagree?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Government', description: 'Debate government spending priorities' },
  { taskType: 'task2', prompt: 'Globalization has both advantages and disadvantages. Discuss both views and give your own opinion.', wordLimit: 250, timeMinutes: 40, difficulty: 'hard', topic: 'Globalization', description: 'Discuss pros and cons of globalization' },
  { taskType: 'task1', prompt: 'The chart below shows the percentage of households in different income groups who owned various electronic devices in 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.', wordLimit: 150, timeMinutes: 20, difficulty: 'medium', topic: 'Technology', description: 'Summarize data about household device ownership' },
  { taskType: 'task1', prompt: 'The table below gives information about the average daily water consumption in four different countries. Summarize the information by selecting and reporting the main features.', wordLimit: 150, timeMinutes: 20, difficulty: 'easy', topic: 'Environment', description: 'Compare water consumption across countries' },
  { taskType: 'task2', prompt: 'Some people believe that studying online is more effective than studying in a traditional classroom. Discuss the advantages and disadvantages of both approaches.', wordLimit: 250, timeMinutes: 40, difficulty: 'easy', topic: 'Education', description: 'Compare online vs traditional learning' },
  { taskType: 'task2', prompt: 'Many people today are choosing to work from home rather than in a traditional office. Is this a positive or negative development?', wordLimit: 250, timeMinutes: 40, difficulty: 'easy', topic: 'Work', description: 'Evaluate the trend of working from home' },
  { taskType: 'task2', prompt: 'Climate change is one of the biggest challenges facing the world today. What measures can individuals and governments take to combat climate change?', wordLimit: 250, timeMinutes: 40, difficulty: 'medium', topic: 'Environment', description: 'Propose solutions to climate change' },
]

async function seedWritingPrompts(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('writing')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.schemaVersion === '1.0' && e.metadata?.seedVersion === '1',
    )
    if (alreadySeeded) return

    const difficultyMap: Record<string, any> = { easy: 'easy', medium: 'medium', hard: 'hard' }
    for (const p of WRITING_SEED_PROMPTS) {
      await engine.saveExercise({
        id: `writing-builtin-${p.prompt.slice(0, 40).replace(/\s+/g, '-').toLowerCase()}`,
        sessionId: '',
        skill: 'writing',
        exerciseType: 'essay',
        objectiveId: '',
        title: `${p.taskType === 'task1' ? 'Task 1' : 'Task 2'}: ${p.description}`,
        instructions: `Write at least ${p.wordLimit} words. ${p.taskType === 'task1' ? 'Summarize the information by selecting and reporting the main features.' : 'Plan your response with a clear introduction, body paragraphs, and conclusion.'}`,
        content: { passage: p.prompt },
        questions: [{
          type: 'essay',
          prompt: p.prompt,
          wordLimit: p.wordLimit,
          rubric: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'],
        }],
        difficulty: difficultyMap[p.difficulty] || 'medium',
        estimatedMinutes: p.timeMinutes,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'ai-assisted',
        metadata: { focusAreas: [], contextSnapshotHash: '', schemaVersion: '1.0', seedVersion: '1', topic: p.topic, description: p.description, taskType: p.taskType },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}

;const listeningSeedData: any[] = [
  {
    title: 'Campus Facilities Tour',
    topic: 'Education',
    difficulty: 'easy',
    transcript: 'Welcome to the university campus. Today I will show you the main facilities available to students. The library is located in the central building and is open from 8 AM to 10 PM on weekdays. It contains over 500,000 books and provides quiet study areas on the second floor. The computer lab is in the science building and offers free printing services. Students can also access the sports centre, which has a swimming pool, a gym, and tennis courts. Membership is included in the tuition fee. Finally, the student union building houses a cafeteria, a bookshop, and several meeting rooms for clubs and societies.',
    questions: [
      { type: 'multiple-choice', question: 'What time does the library close on weekdays?', options: ['8 PM', '9 PM', '10 PM', '11 PM'], correctIndex: 2, explanation: 'The library is open from 8 AM to 10 PM on weekdays.' },
      { type: 'multiple-choice', question: 'Where is the computer lab located?', options: ['Central building', 'Science building', 'Sports centre', 'Student union'], correctIndex: 1, explanation: 'The computer lab is in the science building.' },
      { type: 'gap-fill', question: 'The library has over ______ books.', blanks: ['500,000'], explanation: 'It contains over 500,000 books.' },
      { type: 'multiple-choice', question: 'What is NOT mentioned as a facility at the sports centre?', options: ['Swimming pool', 'Gym', 'Basketball court', 'Tennis courts'], correctIndex: 2, explanation: 'The sports centre has a swimming pool, a gym, and tennis courts.' },
    ],
  },
  {
    title: 'Weather Forecast Report',
    topic: 'Environment',
    difficulty: 'easy',
    transcript: 'And now for the weather forecast. Tomorrow will start with cloudy skies across most of the region. However, by midday, the clouds will clear in the east, bringing sunny spells and temperatures reaching 22 degrees Celsius. In the west, rain is expected to move in during the afternoon, with heavy showers possible around 4 PM. Winds will be light, coming from the south-west. The overnight temperature will drop to around 12 degrees. Looking ahead to the weekend, Saturday will be mostly dry with some sunshine, while Sunday is likely to be wet and windy.',
    questions: [
      { type: 'multiple-choice', question: 'What will the weather be like in the east by midday?', options: ['Cloudy', 'Rainy', 'Sunny', 'Windy'], correctIndex: 2, explanation: 'The clouds will clear in the east, bringing sunny spells.' },
      { type: 'multiple-choice', question: 'When are heavy showers expected in the west?', options: ['Morning', 'Midday', 'Around 4 PM', 'Evening'], correctIndex: 2, explanation: 'Heavy showers are possible around 4 PM in the west.' },
      { type: 'gap-fill', question: 'The maximum temperature tomorrow will be ______ degrees Celsius.', blanks: ['22', '22 degrees'], explanation: 'Temperatures reaching 22 degrees Celsius.' },
      { type: 'multiple-choice', question: 'What does the forecast say about the weekend?', options: ['Both days will be sunny', 'Saturday dry, Sunday wet', 'Both days will be rainy', 'Saturday wet, Sunday dry'], correctIndex: 1, explanation: 'Saturday will be mostly dry, while Sunday is likely to be wet and windy.' },
    ],
  },
  {
    title: 'Job Interview Advice',
    topic: 'Work',
    difficulty: 'medium',
    transcript: 'Today I would like to offer some advice for job interviews. First impressions are crucial, so dressing appropriately is essential. I recommend wearing formal business attire, even if the company has a casual dress code. Before the interview, research the company thoroughly. Look at their website, recent news, and understand their products or services. During the interview, listen carefully to each question and take a moment to think before answering. Use specific examples from your previous experience to demonstrate your skills. At the end of the interview, prepare two or three thoughtful questions to ask the interviewer. After the interview, send a thank-you email within 24 hours to express your appreciation and reinforce your interest in the position.',
    questions: [
      { type: 'multiple-choice', question: 'What does the speaker recommend wearing to an interview?', options: ['Casual clothes', 'Formal business attire', 'Company uniform', 'Smart casual'], correctIndex: 1, explanation: 'The speaker recommends formal business attire.' },
      { type: 'multiple-choice', question: 'How should you respond to interview questions?', options: ['Answer immediately', 'Use examples from experience', 'Keep answers short', 'Memorize responses'], correctIndex: 1, explanation: 'Use specific examples from your previous experience to demonstrate your skills.' },
      { type: 'gap-fill', question: 'Prepare ______ thoughtful questions to ask the interviewer.', blanks: ['two or three', '2 or 3'], explanation: 'Prepare two or three thoughtful questions.' },
      { type: 'multiple-choice', question: 'When should you send a thank-you email after the interview?', options: ['Within 12 hours', 'Within 24 hours', 'Within 48 hours', 'Within a week'], correctIndex: 1, explanation: 'Send a thank-you email within 24 hours.' },
    ],
  },
  {
    title: 'Public Transport Developments',
    topic: 'Transport',
    difficulty: 'medium',
    transcript: 'The city council has announced major improvements to the public transport system. A new tram line will be constructed connecting the city centre with the northern suburbs, which is expected to reduce travel time by approximately 20 minutes. The project is scheduled for completion in 2026. In addition, bus fares will be reduced by 15 percent starting next month to encourage more people to use public transport. The council is also planning to introduce electric buses on all major routes by 2028. Furthermore, cycle lanes will be expanded throughout the city, creating a safer environment for cyclists. These measures are part of the city\'s commitment to reducing carbon emissions by 50 percent by 2030.',
    questions: [
      { type: 'multiple-choice', question: 'What will the new tram line connect?', options: ['East and west suburbs', 'City centre and northern suburbs', 'Airport and city centre', 'South and north'], correctIndex: 1, explanation: 'A new tram line will connect the city centre with the northern suburbs.' },
      { type: 'gap-fill', question: 'The tram project is expected to be completed in ______.', blanks: ['2026'], explanation: 'The project is scheduled for completion in 2026.' },
      { type: 'multiple-choice', question: 'By how much will bus fares be reduced?', options: ['10 percent', '15 percent', '20 percent', '25 percent'], correctIndex: 1, explanation: 'Bus fares will be reduced by 15 percent.' },
      { type: 'multiple-choice', question: 'What is the city\'s target for reducing carbon emissions by 2030?', options: ['30 percent', '40 percent', '50 percent', '60 percent'], correctIndex: 2, explanation: 'The city aims to reduce carbon emissions by 50 percent by 2030.' },
    ],
  },
  {
    title: 'Health and Nutrition Study',
    topic: 'Health',
    difficulty: 'hard',
    transcript: 'A recent study published in the Journal of Nutritional Science has revealed interesting findings about the relationship between breakfast habits and academic performance. Researchers followed 2,000 university students over a period of three years. The results showed that students who consumed a balanced breakfast containing protein, whole grains, and fruit scored on average 12 percent higher on examinations compared to those who skipped breakfast or consumed only sugary cereals. Furthermore, the study found that students who ate breakfast also reported better concentration levels and lower stress during exam periods. However, researchers noted that the quality of breakfast was more important than the frequency. They recommended that educational institutions consider implementing breakfast programs to support student achievement.',
    questions: [
      { type: 'multiple-choice', question: 'How many students participated in the study?', options: ['500', '1,000', '2,000', '5,000'], correctIndex: 2, explanation: 'Researchers followed 2,000 university students.' },
      { type: 'gap-fill', question: 'Students who ate a balanced breakfast scored ______ percent higher on exams.', blanks: ['12'], explanation: 'Students scored on average 12 percent higher.' },
      { type: 'multiple-choice', question: 'What did researchers find more important than breakfast frequency?', options: ['Time of breakfast', 'Quality of breakfast', 'Amount of food', 'Type of drink'], correctIndex: 1, explanation: 'The quality of breakfast was more important than the frequency.' },
      { type: 'multiple-choice', question: 'What did breakfast-eating students NOT report?', options: ['Better concentration', 'Lower stress', 'Higher attendance', 'Better exam scores'], correctIndex: 2, explanation: 'They reported better concentration levels and lower stress.' },
    ],
  },
  {
    title: 'Museum Exhibition Announcement',
    topic: 'Culture',
    difficulty: 'hard',
    transcript: 'Good evening and welcome to the City Museum. I am delighted to announce our upcoming exhibition, "Ancient Civilizations of the Mediterranean," which will open on March 15th and run until September 30th. The exhibition features over 300 artifacts from Egypt, Greece, and Rome, many of which have never been displayed outside their home countries. Highlights include a collection of Egyptian jewelry from the Tomb of Tutankhamun, Greek marble sculptures, and Roman coins. Audio guides are available in eight languages, and guided tours run every hour from 10 AM to 4 PM. Admission prices are 15 pounds for adults, 8 pounds for students, and children under 12 enter free. Group bookings of ten or more receive a 20 percent discount. Please note that photography is permitted but flash photography is strictly prohibited to protect the artifacts.',
    questions: [
      { type: 'multiple-choice', question: 'When will the exhibition open?', options: ['January 15th', 'March 15th', 'June 1st', 'September 30th'], correctIndex: 1, explanation: 'The exhibition opens on March 15th.' },
      { type: 'multiple-choice', question: 'How many artifacts are in the exhibition?', options: ['100', '200', '300', '400'], correctIndex: 2, explanation: 'The exhibition features over 300 artifacts.' },
      { type: 'gap-fill', question: 'Children under ______ enter the museum for free.', blanks: ['12'], explanation: 'Children under 12 enter free.' },
      { type: 'multiple-choice', question: 'What discount do group bookings receive?', options: ['10 percent', '15 percent', '20 percent', '25 percent'], correctIndex: 2, explanation: 'Group bookings of ten or more receive a 20 percent discount.' },
    ],
  },
]
const SPEAKING_PHRASES_SEED = [
  {
    category: 'Giving Opinions',
    phrases: [
      'In my opinion, ...',
      'From my perspective, ...',
      'As far as I am concerned, ...',
      'I strongly believe that ...',
      'It seems to me that ...',
      'I would argue that ...',
      'My view is that ...',
      'Personally, I think ...',
      'The way I see it, ...',
      'I am convinced that ...',
    ],
  },
  {
    category: 'Agreeing',
    phrases: [
      'I completely agree with that.',
      'That is exactly what I think.',
      'You are absolutely right.',
      'I could not agree more.',
      'That is a valid point.',
      'I share the same opinion.',
      'That is true to a certain extent.',
      'I tend to agree with that.',
    ],
  },
  {
    category: 'Disagreeing',
    phrases: [
      'I am afraid I disagree.',
      'I see it differently.',
      'That is not entirely true.',
      'I respect your opinion, but ...',
      'I cannot support that view.',
      'That is one way to look at it, however ...',
      'I beg to differ.',
      'While I understand your point, I think ...',
    ],
  },
  {
    category: 'Expressing Certainty',
    phrases: [
      'I am absolutely certain that ...',
      'There is no doubt that ...',
      'I am convinced that ...',
      'Without a doubt, ...',
      'It is clear that ...',
      'I am sure that ...',
      'Undoubtedly, ...',
      'It is obvious that ...',
    ],
  },
  {
    category: 'Expressing Uncertainty',
    phrases: [
      'I am not entirely sure, but ...',
      'I am not certain about ...',
      'It is difficult to say, but ...',
      'I suppose that ...',
      'Maybe I am wrong, but ...',
      'I am not completely convinced that ...',
      'It could be argued that ...',
      'I am not entirely convinced that ...',
    ],
  },
  {
    category: 'Giving Examples',
    phrases: [
      'For example, ...',
      'For instance, ...',
      'Such as ...',
      'To illustrate this, ...',
      'A good example of this is ...',
      'This can be seen in ...',
      'Take ... for example.',
      'One notable example is ...',
    ],
  },
  {
    category: 'Comparing and Contrasting',
    phrases: [
      'Similarly, ...',
      'In the same way, ...',
      'On the other hand, ...',
      'In contrast, ...',
      'Whereas ...',
      'While ...',
      'Compared to ...',
      'The main difference is that ...',
      'Both are similar in that ...',
    ],
  },
  {
    category: 'Cause and Effect',
    phrases: [
      'As a result, ...',
      'Consequently, ...',
      'Therefore, ...',
      'This leads to ...',
      'As a consequence, ...',
      'One of the main causes is ...',
      'The primary reason is ...',
      'This results in ...',
      'Due to ...',
    ],
  },
  {
    category: 'Structuring Your Answer',
    phrases: [
      'There are several reasons for this.',
      'First of all, ...',
      'Firstly, ... / Secondly, ... / Finally, ...',
      'The main point is that ...',
      'In addition to this, ...',
      'Moreover, ...',
      'Furthermore, ...',
      'Another important aspect is ...',
      'To conclude, ...',
      'In summary, ...',
    ],
  },
  {
    category: 'Hesitating and Buying Time',
    phrases: [
      'That is an interesting question.',
      'Let me think about that for a moment.',
      'Well, I have never really thought about that before, but ...',
      'That is a difficult question to answer, but I would say ...',
      'How can I put this? ...',
      'Let me see ...',
    ],
  },
  {
    category: 'Clarifying and Rephrasing',
    phrases: [
      'In other words, ...',
      'What I mean is ...',
      'To put it another way, ...',
      'Let me rephrase that.',
      'What I am trying to say is ...',
      'That is to say, ...',
    ],
  },
  {
    category: 'Expressing Preferences',
    phrases: [
      'I would rather ... than ...',
      'I prefer ... because ...',
      'My preference is ...',
      'Given the choice, I would ...',
      'I am more inclined to ...',
      'I favor ... over ...',
    ],
  },
]

const SPEAKING_QUESTIONS_SEED = [
  { part: 1, question: 'Tell me about your hometown.', topic: 'Hometown', difficulty: 'easy' },
  { part: 1, question: 'What do you do for work or study?', topic: 'Work', difficulty: 'easy' },
  { part: 1, question: 'What are your hobbies?', topic: 'Hobbies', difficulty: 'easy' },
  { part: 1, question: 'Do you like to travel? Why or why not?', topic: 'Travel', difficulty: 'easy' },
  { part: 1, question: 'What kind of music do you enjoy?', topic: 'Music', difficulty: 'easy' },
  { part: 1, question: 'Tell me about your family.', topic: 'Family', difficulty: 'easy' },
  { part: 1, question: 'How has technology changed the way people communicate?', topic: 'Technology', difficulty: 'medium' },
  { part: 1, question: 'What role does social media play in your daily life?', topic: 'Technology', difficulty: 'medium' },
  { part: 1, question: 'Do you prefer reading books or watching movies? Why?', topic: 'Hobbies', difficulty: 'medium' },
  { part: 2, question: 'Describe a place you like to visit.', topic: 'Travel', difficulty: 'easy', cueCard: { topic: 'A place you like to visit', points: ['where it is', 'how you know about it', 'what you can do there'], followUp: ['Why do you like it?'] } },
  { part: 2, question: 'Describe a memorable event from your childhood.', topic: 'Family', difficulty: 'easy', cueCard: { topic: 'A memorable childhood event', points: ['what the event was', 'when it happened', 'who was there'], followUp: ['Why was it memorable?'] } },
  { part: 2, question: 'Describe a person who has influenced you.', topic: 'Society', difficulty: 'easy', cueCard: { topic: 'An influential person', points: ['who this person is', 'how you know them', 'what they did'], followUp: ['Why did they influence you?'] } },
  { part: 2, question: 'Describe a challenge you have overcome.', topic: 'Work', difficulty: 'medium', cueCard: { topic: 'A challenge you overcame', points: ['what the challenge was', 'how you approached it', 'what the outcome was'], followUp: ['What did you learn?'] } },
  { part: 2, question: 'Describe a skill you would like to learn.', topic: 'Education', difficulty: 'medium', cueCard: { topic: 'A skill you want to learn', points: ['what the skill is', 'why you want to learn it', 'how you plan to learn it'], followUp: ['How would it benefit you?'] } },
  { part: 2, question: 'Describe a time you worked in a team.', topic: 'Work', difficulty: 'medium', cueCard: { topic: 'A teamwork experience', points: ['what the task was', 'who was in the team', 'what your role was'], followUp: ['Was the teamwork successful?'] } },
  { part: 3, question: 'How do you think education will change in the future?', topic: 'Education', difficulty: 'medium' },
  { part: 3, question: 'What are the main causes of environmental problems in your country?', topic: 'Environment', difficulty: 'medium' },
  { part: 3, question: 'Do you think cities are becoming too crowded? What can be done?', topic: 'Society', difficulty: 'medium' },
  { part: 3, question: 'To what extent should governments regulate the use of artificial intelligence?', topic: 'Technology', difficulty: 'hard' },
  { part: 3, question: 'What are the long-term effects of social media on interpersonal relationships?', topic: 'Technology', difficulty: 'hard' },
  { part: 3, question: 'How can societies balance economic development with environmental protection?', topic: 'Environment', difficulty: 'hard' },
]

async function seedSpeakingQuestions(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('speaking')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.part,
    )
    if (alreadySeeded) return

    for (const q of SPEAKING_QUESTIONS_SEED) {
      const diffMap: Record<string, any> = { easy: 'easy', medium: 'medium', hard: 'hard' }
      await engine.saveExercise({
        id: `speaking-q-${q.part}-${q.question.slice(0, 30).replace(/\s+/g, '-').toLowerCase()}`,
        sessionId: '',
        skill: 'speaking',
        exerciseType: 'speaking',
        objectiveId: '',
        title: `Part ${q.part}: ${q.question.slice(0, 50)}`,
        instructions: `Part ${q.part} speaking question. ${q.part === 2 ? 'You have 1 minute to prepare and up to 2 minutes to speak.' : q.part === 1 ? 'Answer in 45 seconds.' : 'Answer in 90 seconds.'}`,
        content: { passage: q.question },
        questions: [],
        difficulty: diffMap[q.difficulty] || 'medium',
        estimatedMinutes: q.part === 2 ? 3 : 2,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'deterministic',
        metadata: {
          focusAreas: ['speaking-questions'],
          contextSnapshotHash: '',
          schemaVersion: '1.0',
          part: q.part,
          topic: q.topic,
          cueCard: q.cueCard ? JSON.stringify(q.cueCard) : undefined,
          seedVersion: '1',
        },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}

async function seedSpeakingPhrases(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('speaking')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.phrases,
    )
    if (alreadySeeded) return

    for (const group of SPEAKING_PHRASES_SEED) {
      await engine.saveExercise({
        id: `speaking-phrases-${group.category.toLowerCase().replace(/\s+/g, '-')}`,
        sessionId: '',
        skill: 'speaking',
        exerciseType: 'speaking',
        objectiveId: '',
        title: group.category,
        instructions: 'Common phrases to help you in the IELTS Speaking test.',
        content: { passage: group.phrases.join('\n') },
        questions: [],
        difficulty: 'medium',
        estimatedMinutes: 0,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'deterministic',
        metadata: {
          focusAreas: ['speaking-phrases'],
          contextSnapshotHash: '',
          schemaVersion: '1.0',
          phrases: JSON.stringify(group.phrases),
        },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}

async function seedListeningExercises(engine: LearningEngine): Promise<void> {
  try {
    const existing = await engine.getExercises('listening')
    const alreadySeeded = existing.status === 'success' && existing.data?.exercises.some(
      (e: any) => (e.source || e.sourceType) === 'built-in' && e.metadata?.seedVersion === '1',
    )
    if (alreadySeeded) return

    const diffMap: Record<string, any> = { easy: 'easy', medium: 'medium', hard: 'hard' }
    for (const ex of listeningSeedData) {
      await engine.saveExercise({
        id: `listening-seed-${ex.title.toLowerCase().replace(/\s+/g, '-')}`,
        sessionId: '',
        skill: 'listening',
        exerciseType: 'comprehension',
        objectiveId: '',
        title: ex.title,
        instructions: 'Listen to the recording and answer the questions.',
        content: { transcript: ex.transcript },
        questions: ex.questions.map((q: any, i: number) => ({
          id: `ls-q-${i}`,
          type: q.type === 'gap-fill' ? 'gap-fill' : 'multiple-choice',
          question: q.question,
          options: q.options || [],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          blanks: Array.isArray(q.blanks) ? q.blanks : undefined,
          explanation: q.explanation || '',
        })),
        difficulty: diffMap[ex.difficulty] || 'medium',
        estimatedMinutes: 12,
        sourceType: 'built-in',
        sourceIds: [],
        explanationPolicy: 'after-attempt',
        evaluationPolicy: 'deterministic',
        metadata: {
          focusAreas: [],
          contextSnapshotHash: '',
          schemaVersion: '1.0',
          topic: ex.topic,
          seedVersion: '1',
        },
      } as any)
    }
  } catch (error) {
    console.error('apps/web/src/services/engineBootstrap.ts error:', error);
  }
}

export function getLearningEngine(): LearningEngine | null {
  return learningEngineInstance
}
