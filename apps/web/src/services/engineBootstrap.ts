import { createAITutorEngine } from '@ielts/ai-tutor-engine'
import type { AITutorEngine, AITutorEngineDependencies } from '@ielts/ai-tutor-engine'
import { userConfigurationSchema } from '@ielts/settings'
import { STORAGE_KEYS } from '@ielts/config'
import { LearnerContextBuilder, CachedContextBuilder } from '@ielts/ai-tutor-engine'
import type { ContextSourceRegistry } from '@ielts/ai-tutor-engine'
import { SystemClock } from '@ielts/ai-tutor-engine'
import { AI_TUTOR_CACHE } from '../features/ai-tutor/constants'
import { createLearningEngine, createDefaultSkillRegistry } from '@ielts/learning-engine'
import type { LearningEngine } from '@ielts/learning-engine'
import { DatabaseService } from '../services/storage/Database'
import { createAiCredentialProvider, resolveAiConfig, createAIClient, readConfigFromSettings } from '../bootstrap/createAiInfrastructure'
import { createDbMessageRepository, createDbMemoryRepository, createDependencyRepos } from '../bootstrap/createRepositories'
import { generateEducationalContent, evaluateOpenResponse } from '../bootstrap/createAiPorts'
import { createAllContextSources, createExamContextSource, createProgressContextSource, createSkillStatesContextSource, createMistakesContextSource, createVocabularyContextSource, createActivityContextSource, createPreferencesContextSource } from '../bootstrap/createContextSources'
import type { LearningContext, LearningContextScope } from '@ielts/learning-engine'
import { loadUserConfiguration } from '@ielts/settings'


const AI_TUTOR_KEY = 'ielts-ai-tutor-engine'

let engineInstance: AITutorEngine | null = null
let learningEngineInstance: LearningEngine | null = null

const systemClock = new SystemClock()

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
      ...createAllContextSources({ getLearningEngine }),
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

    // Use AI Tutor Engine's context builder when initialized, otherwise build from localStorage
    const tutorEngine = getAITutorEngine()

    learningEngineInstance = createLearningEngine({
      contextPort: {
        async buildLearningContext(request?: { scope?: LearningContextScope }) {
          const aiAvailable = !!(await readConfigFromSettings()).apiKey
          try {
            const config = loadUserConfiguration()
            const examSource = createExamContextSource()
            const progressSource = createProgressContextSource({ getLearningEngine })
            const mistakesSource = createMistakesContextSource({ getLearningEngine })
            const vocabSource = createVocabularyContextSource()
            const activitySource = createActivityContextSource()
            const prefSource = createPreferencesContextSource()
            const [examCtx, progress, mistakes, vocab, activity, prefs] = await Promise.all([
              examSource(),
              progressSource(),
              mistakesSource(),
              vocabSource(),
              activitySource(),
              prefSource(),
            ])
            const skillStates = await createSkillStatesContextSource({ getLearningEngine })()
            const currentBand = config.study.currentBand
            const targetBand = config.study.targetBand
            const weaknesses: Array<{ skill: string; description: string; severity: number }> = []
            const strengths: Array<{ skill: string; description: string }> = []
            const recentMistakes: Array<{ skill: string; category: string; frequency: number; lastOccurred: string }> = []
            if (mistakes.recurringPatterns) {
              for (const p of mistakes.recurringPatterns) {
                recentMistakes.push({ skill: p.skill, category: p.pattern, frequency: p.frequency, lastOccurred: '' })
                if (p.frequency >= 3) weaknesses.push({ skill: p.skill, description: p.pattern, severity: Math.min(10, p.frequency) })
              }
            }
            const savedVocabulary = (vocab.totalSaved > 0)
              ? [{ wordId: 'all', word: `${vocab.totalSaved} words`, mastery: vocab.mastered / Math.max(1, vocab.totalSaved), dueForReview: vocab.dueForReview > 0 }]
              : []

            const currentSkillBands: Record<string, number> = {}
            const targetSkillBands: Record<string, number> = {}
            const skillProgress: Record<string, number> = {}
            const recentAccuracy: Record<string, number> = {}
            const trendBySkill: Record<string, string> = {}

            if (skillStates && typeof skillStates === 'object') {
              for (const [skill, state] of Object.entries(skillStates as Record<string, any>)) {
                if (state.currentBand != null) currentSkillBands[skill] = state.currentBand
                if (state.currentBand != null) targetSkillBands[skill] = state.targetBand
                if (state.recentPerformance != null) {
                  skillProgress[skill] = state.recentPerformance
                  recentAccuracy[skill] = state.recentPerformance / 100
                }
                if (state.trend) trendBySkill[skill] = state.trend
                if (state.frequentWeaknesses?.length) {
                  for (const w of state.frequentWeaknesses) {
                    weaknesses.push({ skill, description: String(w), severity: 5 })
                  }
                }
                if (state.recentStrengths?.length) {
                  for (const s of state.recentStrengths) {
                    strengths.push({ skill, description: String(s) })
                  }
                }
              }
            }

            return {
              generatedAt: new Date().toISOString(),
              learner: {
                currentOverallBand: currentBand ?? undefined,
                targetOverallBand: targetBand ?? undefined,
                currentSkillBands,
                targetSkillBands,
                examDate: config.study.examDate ?? undefined,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              progress: {
                skillProgress,
                recentAccuracy,
                studyStreak: progress.studyStreak ?? 0,
                trendBySkill,
                overallProgress: progress.overallCompletionPercent ?? 0,
              },
              weaknesses,
              strengths,
              recentMistakes,
              savedVocabulary,
              relevantContent: [],
              recentAttempts: [],
              previousFeedback: [],
              preferences: {
                preferredLearningMethods: [],
                preferredTaskTypes: [],
                preferredLanguage: prefs.language ?? 'en',
              },
              constraints: { offlineOnly: false, aiAvailable },
              contextQuality: { status: 'partial', missingSources: [], staleSources: [], warnings: [] },
            }
          } catch {
            return {
              generatedAt: new Date().toISOString(),
              learner: { currentSkillBands: {}, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, examType: 'academic' },
              progress: { skillProgress: {}, recentAccuracy: {}, trendBySkill: {}, overallProgress: 0 },
              weaknesses: [], strengths: [], recentMistakes: [], savedVocabulary: [], relevantContent: [],
              recentAttempts: [], previousFeedback: [],
              preferences: { preferredLearningMethods: [], preferredTaskTypes: [], preferredLanguage: 'en' },
              constraints: { offlineOnly: false, aiAvailable },
              contextQuality: { status: 'partial', missingSources: [], staleSources: [], warnings: [] },
            }
          }
        },
      },
      tutorPort: {
        async getLearnerContext() { return null as any },
        async selectTeachingStrategy() { return { strategy: 'explain', reason: 'default' } },
        generateEducationalContent,
        evaluateOpenResponse,
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
