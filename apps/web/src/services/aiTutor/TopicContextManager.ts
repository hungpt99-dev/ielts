import { LocalTutorStorage } from '../storage/LocalTutorStorage'
import type {
  TutorMemory,
  TutorContext,
  AssistantMode,
} from '../../models/aiTutorModels'

export type DetectedTopic =
  | 'grammar'
  | 'vocabulary'
  | 'speaking'
  | 'writing'
  | 'reading'
  | 'listening'
  | 'ielts'
  | 'planning'
  | 'environment'
  | 'education'
  | 'technology'
  | 'health'
  | 'travel'
  | 'work'
  | 'greeting'
  | 'thanks'
  | 'general'

const TOPIC_PATTERNS: Record<string, RegExp> = {
  grammar: /\b(grammar|tense|verb|noun|adjective|adverb|preposition|sentence|clause|article|plural|singular)\b/i,
  vocabulary: /\b(vocabulary|word|meaning|phrase|expression|idiom|collocation|synonym|antonym)\b/i,
  speaking: /\b(speaking|speak|pronunciation|fluency|accent|part\s*[123]|cue\s*card)\b/i,
  writing: /\b(writing|essay|paragraph|thesis|introduction|conclusion|task\s*[12]|cohesion|coherence)\b/i,
  reading: /\b(reading|passage|article|text|comprehension|skim|scan|main idea)\b/i,
  listening: /\b(listening|audio|transcript|listen|hear|accent|lecture|conversation)\b/i,
  ielts: /\b(ielts|band|score|exam|test|practice|mock|preparation)\b/i,
  planning: /\b(plan|schedule|study|goal|target|deadline|exam date)\b/i,
  environment: /\b(environment|climate|pollution|recycling|sustainability|energy|nature)\b/i,
  education: /\b(education|school|university|student|teacher|learn|study|exam|online\s*learning)\b/i,
  technology: /\b(technology|internet|computer|ai|digital|social media|smartphone)\b/i,
  health: /\b(health|exercise|diet|doctor|hospital|medicine|sleep|wellness)\b/i,
  travel: /\b(travel|tourism|holiday|vacation|country|culture|abroad)\b/i,
  work: /\b(work|job|career|business|office|company|employ|profession)\b/i,
  greeting: /\b(hello|hi|hey|how are you|good morning|good evening)\b/i,
  thanks: /\b(thank|thanks|appreciate)\b/i,
}

const SKILL_TOPICS = new Set([
  'grammar', 'vocabulary', 'speaking', 'writing', 'reading', 'listening',
])

const IELTS_TOPIC_LABELS: Record<string, string> = {
  environment: 'Environment',
  education: 'Education',
  technology: 'Technology',
  health: 'Health',
  travel: 'Travel',
  work: 'Work',
}

export class TopicContextManager {
  private memory: TutorMemory | null = null
  private currentTopic: DetectedTopic = 'general'
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.memory = await LocalTutorStorage.loadMemory()
    if (this.memory?.currentTopic) {
      const loaded = this.memory.currentTopic as DetectedTopic
      if (TOPIC_PATTERNS[loaded] || loaded === 'general') {
        this.currentTopic = loaded
      }
    }
    this.initialized = true
  }

  detectTopic(message: string): DetectedTopic {
    const lower = message.toLowerCase()
    for (const [topic, pattern] of Object.entries(TOPIC_PATTERNS)) {
      if (pattern.test(lower)) return topic as DetectedTopic
    }
    return 'general'
  }

  async updateTopicFromMessage(message: string): Promise<DetectedTopic> {
    await this.initialize()
    const detected = this.detectTopic(message)
    if (detected !== 'general' && detected !== this.currentTopic) {
      this.currentTopic = detected
      const skill = SKILL_TOPICS.has(detected) ? detected : undefined
      await LocalTutorStorage.patchMemory({
        currentTopic: detected,
        currentTopicSkill: skill,
      })
    }
    return detected
  }

  async setTopic(topic: string, skill?: string): Promise<void> {
    await this.initialize()
    this.currentTopic = topic as DetectedTopic
    await LocalTutorStorage.patchMemory({
      currentTopic: topic,
      currentTopicSkill: skill,
    })
  }

  getCurrentTopic(): string {
    return this.currentTopic
  }

  getCurrentTopicLabel(): string {
    if (this.currentTopic === 'general') return ''
    return IELTS_TOPIC_LABELS[this.currentTopic] ||
      this.currentTopic.charAt(0).toUpperCase() + this.currentTopic.slice(1)
  }

  getWeakPointsSummary(limit = 3): string {
    if (!this.memory?.weakPoints?.length) return ''
    return this.memory.weakPoints
      .slice(0, limit)
      .map(w => `• ${w.skill}: ${w.description}`)
      .join('\n')
  }

  async getContextForPrompt(_mode: AssistantMode): Promise<string> {
    await this.initialize()
    const parts: string[] = []
    if (this.currentTopic && this.currentTopic !== 'general') {
      parts.push(`Current learning topic: ${this.getCurrentTopicLabel()}`)
    }
    if (this.memory?.targetBand) {
      parts.push(`Target IELTS band: ${this.memory.targetBand}`)
    }
    if (this.memory?.examDate) {
      const examDate = new Date(this.memory.examDate)
      parts.push(`Exam date: ${examDate.toLocaleDateString()}`)
    }
    const weakSummary = this.getWeakPointsSummary(2)
    if (weakSummary) {
      parts.push(`Weak areas:\n${weakSummary}`)
    }
    if (this.memory?.currentPlan) {
      parts.push(`Today's study plan: ${this.memory.currentPlan}`)
    }
    return parts.length > 0 ? parts.join('\n') : ''
  }

  async getContext(mode: AssistantMode): Promise<TutorContext> {
    await this.initialize()
    return {
      mode,
      currentTopic: this.currentTopic !== 'general' ? this.currentTopic : undefined,
      userMemory: this.memory || undefined,
      targetBand: this.memory?.targetBand,
      examDate: this.memory?.examDate,
      weakSkills: this.memory?.weakPoints?.map(w => w.skill),
      todayStudyPlan: this.memory?.currentPlan,
    }
  }

  reset(): void {
    this.currentTopic = 'general'
    this.memory = null
    this.initialized = false
  }
}

export const topicContextManager = new TopicContextManager()
