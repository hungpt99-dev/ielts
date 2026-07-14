import { getDb } from '@ielts/storage'
import { createLearningEngine, createDefaultSkillRegistry } from '@ielts/learning-engine'
import type { LearnerContextPort, TutorIntelligencePort, StudyPlanPort, LearningSessionRepository, LearningAttemptRepository, LearningOutcomeRepository, ExerciseRepository, ProgressRepository, MistakeRepository, VocabularyRepository, LearningEventPublisher } from '@ielts/learning-engine'

let engineInstance: ReturnType<typeof createLearningEngine> | null = null

const systemClock = {
  now: () => new Date(),
  toISOString: () => new Date().toISOString(),
  today: () => new Date().toISOString().slice(0, 10),
}

const extensionLearnerContextPort: LearnerContextPort = {
  async buildLearningContext() {
    return {
      generatedAt: new Date().toISOString(),
      learner: {
        currentSkillBands: {},
        targetSkillBands: {},
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      progress: {
        skillProgress: {},
        recentAccuracy: {},
        trendBySkill: {},
      },
      weaknesses: [],
      strengths: [],
      recentMistakes: [],
      savedVocabulary: [],
      relevantContent: [],
      recentAttempts: [],
      previousFeedback: [],
      preferences: {
        preferredLearningMethods: [],
        preferredTaskTypes: [],
        preferredLanguage: 'en',
      },
      constraints: {
        offlineOnly: true,
        aiAvailable: false,
      },
      contextQuality: {
        status: 'partial',
        missingSources: ['learner-profile'],
        warnings: [],
      },
    }
  },
}

const extensionTutorPort: TutorIntelligencePort = {
  async getLearnerContext() {
    return null as any
  },
  async selectTeachingStrategy() {
    return { strategy: 'explain', reason: 'default' }
  },
  async generateEducationalContent() {
    return { success: false, error: { code: 'ai_unavailable', message: 'AI not available in extension offline mode', recoverable: true } }
  },
  async evaluateOpenResponse() {
    return { success: false, error: { code: 'ai_unavailable', message: 'AI not available in extension offline mode', recoverable: true } }
  },
  async explainFeedback() {
    return { explanation: '', suggestions: [] }
  },
  async recordLearningOutcome() {
    return { success: true }
  },
}

const studyPlanPort: StudyPlanPort = {
  async getCurrentTask() { return null },
  async getTaskById() { return null },
  async markTaskFulfilled() {},
}

function createDbSessionRepository(): LearningSessionRepository {
  return {
    async getById(id: string) {
      const db = getDb()
      const all = await db.table('learningEvents').toArray()
      return (all as any[]).find((s: any) => s.id === id && s.prompt === 'learning-session') ?? null
    },
    async save(session: any) {
      const db = getDb()
      await db.table('learningEvents').put({
        id: session.id,
        type: 'general',
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
    },
    async findActive() {
      const db = getDb()
      const all = await db.table('learningEvents').toArray()
      return (all as any[])
        .filter((a: any) => a.prompt === 'learning-session' && a.content)
        .map((a: any) => JSON.parse(a.content))
        .filter((s: any) => s.status === 'in-progress' || s.status === 'prepared')
    },
  }
}

function createDbAttemptRepository(): LearningAttemptRepository {
  return {
    async getById() { return null },
    async save() {},
    async findBySession() { return [] },
  }
}

function createDbOutcomeRepository(): LearningOutcomeRepository {
  return {
    async save(outcome: any) {
      const db = getDb()
      await db.table('progressRecords').put(outcome)
    },
    async findRecent(query?: { skill?: string; limit?: number }) {
      const db = getDb()
      let all: any[] = await db.table('progressRecords').toArray()
      if (query?.skill) all = all.filter((o: any) => o.skill === query.skill)
      all.sort((a: any, b: any) => String(b.completedAt ?? '').localeCompare(String(a.completedAt ?? '')))
      return query?.limit ? all.slice(0, query.limit) : all
    },
  }
}

function createDbExerciseRepository(): ExerciseRepository {
  return {
    async getById() { return null },
    async save() {},
  }
}

function createDbProgressRepository(): ProgressRepository {
  return {
    async getSkillProgress(skill: string) {
      const db = getDb()
      const records: any[] = await db.table('progressRecords').toArray()
      const skillRecords = records.filter((r: any) => r.skill === skill)
      if (skillRecords.length === 0) return null
      return {
        exercisesCompleted: skillRecords.length,
        trend: 'unknown' as const,
        recentAccuracy: skillRecords[0].value ?? 0,
        lastPracticedAt: skillRecords[0].createdAt,
      }
    },
    async updateSkillProgress(skill: string, progress: any) {
      const db = getDb()
      await db.table('progressRecords').put({
        id: `skill-${skill}-${Date.now()}`,
        skill,
        type: 'skill-progress',
        value: progress.recentAccuracy ?? 0,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        metadata: JSON.stringify(progress),
      })
    },
    async getOverallProgress() {
      const db = getDb()
      const tasks: any[] = await db.table('tasks').toArray()
      const done = tasks.filter((t: any) => t.isDone).length
      return tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
    },
    async updateOverallProgress() {},
  }
}

function createDbMistakeRepository(): MistakeRepository {
  return {
    async save(mistake: any) {
      const db = getDb()
      await db.mistakes.put(mistake)
    },
    async findRecent(skill?: string, limit = 10) {
      const db = getDb()
      let all: any[] = await db.mistakes.toArray()
      if (skill) all = all.filter((m: any) => m.skill === skill)
      all.sort((a: any, b: any) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
      return all.slice(0, limit)
    },
    async findByPattern() { return [] },
    async getRecurringPatterns() { return [] },
  }
}

function createDbVocabularyRepository(): VocabularyRepository {
  return {
    async getDueForReview(limit = 10) {
      const db = getDb()
      const all: any[] = await db.vocabulary.toArray()
      const now = new Date().toISOString()
      return all.filter((v: any) => v.nextReviewAt && v.nextReviewAt <= now).slice(0, limit)
    },
    async getByTopic() { return [] },
    async updateMastery() {},
    async markReviewed() {},
  }
}

const extensionEventPublisher: LearningEventPublisher = {
  publish(event: any) {
    getDb().table('progressRecords').put({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: event.type,
      value: event.accuracy ?? event.score ?? 0,
      date: new Date().toISOString().slice(0, 10),
      category: event.skill ?? 'general',
      label: event.type,
      createdAt: new Date().toISOString(),
      metadata: JSON.stringify(event),
    }).catch(() => {})
  },
  publishMany(events: any[]) {
    for (const event of events) {
      this.publish(event)
    }
  },
}

export async function initializeExtensionEngine() {
  if (engineInstance) return engineInstance

  const engine = createLearningEngine({
    contextPort: extensionLearnerContextPort,
    tutorPort: extensionTutorPort,
    studyPlanPort,
    sessionRepository: createDbSessionRepository(),
    attemptRepository: createDbAttemptRepository(),
    exerciseRepository: createDbExerciseRepository(),
    outcomeRepository: createDbOutcomeRepository(),
    progressRepository: createDbProgressRepository(),
    mistakeRepository: createDbMistakeRepository(),
    vocabularyRepository: createDbVocabularyRepository(),
    eventPublisher: extensionEventPublisher,
    clock: systemClock,
    skillRegistry: createDefaultSkillRegistry(),
  })

  engineInstance = engine
  return engine
}

export function getExtensionEngine() {
  return engineInstance
}
