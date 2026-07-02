import { LocalTutorStorage } from '../storage/LocalTutorStorage'
import { topicContextManager } from './TopicContextManager'
import type {
  TutorMemory,
  AssistantMode,
  UserTutorPreferences,
} from '../../models/aiTutorModels'

export type ContextDataType =
  | 'target-band'
  | 'exam-date'
  | 'current-topic'
  | 'todays-plan'
  | 'saved-vocabulary'
  | 'weak-points'
  | 'recent-mistakes'
  | 'saved-articles'
  | 'writing-drafts'
  | 'exercise-results'
  | 'learning-goals'
  | 'study-streak'

export interface ContextDataItem {
  type: ContextDataType
  label: string
  summary: string
  detail: string
  data: unknown
}

export interface ContextDataGroup {
  type: 'user-profile' | 'learning-progress' | 'recent-activity'
  label: string
  items: ContextDataItem[]
}

export class ContextManager {
  private preferences: UserTutorPreferences | null = null
  private memory: TutorMemory | null = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.preferences = LocalTutorStorage.loadPreferences()
    this.memory = await LocalTutorStorage.loadMemory()
    await topicContextManager.initialize()
    this.initialized = true
  }

  hasPermission(): boolean {
    return this.preferences?.contextPermission ?? false
  }

  async grantPermission(): Promise<void> {
    await this.initialize()
    this.preferences = LocalTutorStorage.patchPreferences({ contextPermission: true })
  }

  async revokePermission(): Promise<void> {
    await this.initialize()
    this.preferences = LocalTutorStorage.patchPreferences({ contextPermission: false })
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize()
  }

  async getContextPreview(): Promise<ContextDataItem[]> {
    await this.ensureInitialized()
    const items: ContextDataItem[] = []

    if (this.memory?.targetBand) {
      items.push({
        type: 'target-band',
        label: 'Target IELTS Band',
        summary: `Band ${this.memory.targetBand}`,
        detail: `Your target IELTS band score is ${this.memory.targetBand}.`,
        data: this.memory.targetBand,
      })
    }

    if (this.memory?.examDate) {
      const examDate = new Date(this.memory.examDate)
      const daysUntil = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const dayStr = daysUntil > 0 ? `${daysUntil} days away` : daysUntil === 0 ? 'today!' : 'past'
      items.push({
        type: 'exam-date',
        label: 'Exam Date',
        summary: examDate.toLocaleDateString(),
        detail: `Your IELTS exam is on ${examDate.toLocaleDateString()} (${dayStr}).`,
        data: this.memory.examDate,
      })
    }

    const currentTopic = topicContextManager.getCurrentTopicLabel()
    if (currentTopic) {
      items.push({
        type: 'current-topic',
        label: 'Current Topic',
        summary: currentTopic,
        detail: `You are currently learning about "${currentTopic}".`,
        data: currentTopic,
      })
    }

    if (this.memory?.currentPlan) {
      const plan = this.memory.currentPlan
      items.push({
        type: 'todays-plan',
        label: "Today's Study Plan",
        summary: plan.length > 80 ? plan.slice(0, 80) + '...' : plan,
        detail: `Your study plan: ${plan}`,
        data: plan,
      })
    }

    if (this.memory?.weakPoints?.length) {
      const wps = this.memory.weakPoints
      items.push({
        type: 'weak-points',
        label: 'Weak Areas',
        summary: `${wps.length} area(s): ${wps.map(w => w.skill).join(', ')}`,
        detail: wps.map(w => `• ${w.skill}: ${w.description}`).join('\n'),
        data: wps,
      })
    }

    if (this.memory?.repeatedMistakePatterns?.length) {
      const mps = this.memory.repeatedMistakePatterns
      items.push({
        type: 'recent-mistakes',
        label: 'Repeated Mistakes',
        summary: `${mps.length} pattern(s): ${mps.map(m => m.pattern).join(', ').slice(0, 100)}`,
        detail: mps.map(m => `• ${m.pattern} (${m.skill}): ${m.suggestion}`).join('\n'),
        data: mps,
      })
    }

    if (this.memory?.learningStreak && this.memory.learningStreak > 0) {
      items.push({
        type: 'study-streak',
        label: 'Study Streak',
        summary: `${this.memory.learningStreak} day${this.memory.learningStreak > 1 ? 's' : ''}`,
        detail: `You've studied for ${this.memory.learningStreak} consecutive day${this.memory.learningStreak > 1 ? 's' : ''}.`,
        data: this.memory.learningStreak,
      })
    }

    if (this.memory?.goals?.length) {
      const activeGoals = this.memory.goals.filter(g => !g.isAchieved)
      if (activeGoals.length > 0) {
        items.push({
          type: 'learning-goals',
          label: 'Learning Goals',
          summary: `${activeGoals.length} active goal${activeGoals.length > 1 ? 's' : ''}`,
          detail: activeGoals.map(g => `• ${g.title}${g.targetDate ? ` (by ${new Date(g.targetDate).toLocaleDateString()})` : ''}`).join('\n'),
          data: activeGoals,
        })
      }
    }

    return items
  }

  async gatherContext(): Promise<ContextDataItem[]> {
    await this.ensureInitialized()
    if (!this.hasPermission()) return []
    return this.getContextPreview()
  }

  async getContextGroups(): Promise<ContextDataGroup[]> {
    const items = await this.gatherContext()
    if (items.length === 0) return []

    const groups: ContextDataGroup[] = []

    const profileTypes = new Set<ContextDataType>(['target-band', 'exam-date', 'current-topic', 'todays-plan'])
    const profileItems = items.filter(i => profileTypes.has(i.type))
    if (profileItems.length > 0) {
      groups.push({ type: 'user-profile', label: 'User Profile', items: profileItems })
    }

    const progressTypes = new Set<ContextDataType>(['weak-points', 'recent-mistakes', 'study-streak', 'learning-goals'])
    const progressItems = items.filter(i => progressTypes.has(i.type))
    if (progressItems.length > 0) {
      groups.push({ type: 'learning-progress', label: 'Learning Progress', items: progressItems })
    }

    const activityTypes = new Set<ContextDataType>(['saved-vocabulary', 'saved-articles', 'writing-drafts', 'exercise-results'])
    const activityItems = items.filter(i => activityTypes.has(i.type))
    if (activityItems.length > 0) {
      groups.push({ type: 'recent-activity', label: 'Recent Activity', items: activityItems })
    }

    return groups
  }

  async getFormattedContextString(): Promise<string> {
    const items = await this.gatherContext()
    if (items.length === 0) return ''

    const lines: string[] = ['[USER CONTEXT]']
    for (const item of items) {
      if (item.type === 'weak-points' || item.type === 'recent-mistakes' || item.type === 'learning-goals') {
        lines.push(item.label + ':')
        lines.push(item.detail)
      } else {
        lines.push(`${item.label}: ${item.summary}`)
      }
    }
    lines.push('[/USER CONTEXT]')
    return lines.join('\n')
  }

  async buildSystemPrompt(mode: AssistantMode): Promise<string> {
    await this.ensureInitialized()
    const items = await this.gatherContext()

    const parts: string[] = [
      'You are an AI Tutor Assistant for IELTS preparation.',
      'You are friendly, encouraging, clear, and patient.',
      '',
      this.getModeInstructions(mode),
    ]

    if (items.length > 0) {
      parts.push('', '=== USER CONTEXT ===')
      for (const item of items) {
        parts.push(item.detail)
      }
      parts.push('=== END CONTEXT ===')
    }

    parts.push(
      '',
      'Answer in a helpful, supportive way.',
      'Adapt explanations to the user\'s level.',
      'Correct mistakes gently and encourage progress.',
      'Connect responses to the user\'s IELTS learning journey.',
    )

    return parts.join('\n')
  }

  async buildUserPrompt(userMessage: string): Promise<string> {
    const items = await this.gatherContext()
    if (items.length === 0) return userMessage

    const contextSummary = items.map(i => `- ${i.label}: ${i.summary}`).join('\n')
    return `${userMessage}\n\n[Available user context:\n${contextSummary}\nUse this to personalize your response.]`
  }

  getModeInstructions(mode: AssistantMode): string {
    const instructions: Record<AssistantMode, string> = {
      'friendly-chat': 'Chat naturally like a learning friend. Connect conversation to English learning. Gently correct mistakes. Use casual, warm language.',
      'ielts-tutor': 'Act as a comprehensive IELTS tutor. Teach step by step. Explain vocabulary, grammar, and skills. Give mini exercises. Guide the user like a real tutor.',
      'speaking-partner': 'Act as an IELTS Speaking test examiner. Ask Part 1/2/3 questions. Give natural follow-ups. Correct mistakes after answers. Estimate band score.',
      'writing-coach': 'Act as an IELTS Writing tutor. Help brainstorm ideas, create outlines, improve thesis statements, check paragraph structure, and suggest better vocabulary and linking words.',
      'grammar-teacher': 'Explain grammar rules simply with examples. Give mini exercises. Correct errors gently. Focus on one grammar point at a time.',
      'vocabulary-coach': 'Teach topic-based vocabulary with meanings, examples, and collocations. Create practice exercises. Help the user build useful word banks.',
      'reading-explainer': 'Help the user understand texts. Summarize content, explain difficult sentences, extract useful vocabulary, and connect to IELTS reading skills.',
      'listening-coach': 'Help with listening comprehension. Discuss transcripts, extract useful language, create comprehension questions, and practice listening strategies.',
      'study-planner': 'Help create realistic study plans. Consider the user\'s target band, exam date, weak areas, and available time. Keep them accountable and motivated.',
      'motivation-coach': 'Encourage and motivate the user. Celebrate progress. Help them stay consistent. Remind them of their goals. Be warm and uplifting.',
      'socratic-tutor': 'Guide the user with questions instead of giving direct answers. Encourage critical thinking. Help them discover answers themselves.',
    }
    return instructions[mode] || 'Help the user learn English and prepare for IELTS.'
  }

  async getContextSummary(): Promise<string> {
    const items = await this.gatherContext()
    if (items.length === 0) return ''
    return items.map(i => i.summary).join(' · ')
  }

  clearCache(): void {
    this.preferences = null
    this.memory = null
    this.initialized = false
  }
}

export const contextManager = new ContextManager()
