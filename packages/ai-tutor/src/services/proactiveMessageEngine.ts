import type { ProactiveMessage, ProactiveMessageAction, ProactiveMessageCategory, ChatMessage, ContextSuggestion } from '../types'
import { generateId } from '../utils/id'

const ACTIONS: Record<string, { label: string; actionPayload: string }> = {
  'vocabulary-review': { label: 'Review vocabulary', actionPayload: 'quiz-me' },
  'mistake-review': { label: 'Review mistakes', actionPayload: 'correct-english' },
  'study-plan': { label: 'View plan', actionPayload: 'practice-with-me' },
  'speaking-practice': { label: 'Practice speaking', actionPayload: 'practice-with-me' },
  'writing-practice': { label: 'Practice writing', actionPayload: 'make-exercise' },
  'exam-countdown': { label: 'View countdown', actionPayload: 'teach-me' },
  'motivation': { label: 'Keep going', actionPayload: 'teach-me' },
  'saved-content': { label: 'View content', actionPayload: 'teach-me' },
}

function makeAction(category: ProactiveMessageCategory): ProactiveMessageAction | undefined {
  const preset = ACTIONS[category]
  if (!preset) return undefined
  return {
    type: 'action',
    label: preset.label,
    payload: { action: preset.actionPayload },
  }
}

export interface LearnerProfile {
  targetBand?: number
  currentBand?: number
  examDate?: string
  studyStreak?: number
  weakSkills?: string[]
  consecutiveDays?: number
  totalExercisesAttempted?: number
  averageAccuracy?: number
}

export interface ProactiveEngineInput {
  dueVocabularyCount?: number
  dueMistakeCount?: number
  dailyPlanReady?: boolean
  newContentCount?: number
  recentMistakeCount?: number
  lowActivityDays?: number
  lastVisitDate?: string
  learnerProfile?: LearnerProfile
}

function generateVocabularyReview(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.dueVocabularyCount ?? 0
  if (count <= 0) return null
  return {
    id: generateId(),
    triggerType: 'due_review',
    category: 'vocabulary-review',
    title: `${count} words due for review`,
    message: `You have ${count} vocabulary word${count === 1 ? '' : 's'} waiting to be reviewed. A quick session can help solidify them in long-term memory.`,
    priority: count > 20 ? 'high' : 'medium',
    action: makeAction('vocabulary-review'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateMistakeReview(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.dueMistakeCount ?? 0
  if (count <= 0) return null
  return {
    id: generateId(),
    triggerType: 'due_review',
    category: 'mistake-review',
    title: `${count} mistake${count === 1 ? '' : 's'} to review`,
    message: `Reviewing your past mistakes is one of the most effective ways to improve. You have ${count} mistake${count === 1 ? '' : 's'} ready for review.`,
    priority: count > 10 ? 'high' : 'medium',
    action: makeAction('mistake-review'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateWeakSkill(input: ProactiveEngineInput): ProactiveMessage | null {
  const skills = input.learnerProfile?.weakSkills
  if (!skills || skills.length === 0) return null
  const skillList = skills.slice(0, 3).join(', ')
  return {
    id: generateId(),
    triggerType: 'weak_skill_warning',
    category: 'study-plan',
    title: `Focus on your weaker areas`,
    message: `Based on your progress, consider spending more time on: ${skillList}. Targeted practice can help improve your band score faster.`,
    priority: 'medium',
    action: makeAction('study-plan'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateExamCountdown(input: ProactiveEngineInput): ProactiveMessage | null {
  const examDate = input.learnerProfile?.examDate
  if (!examDate) return null
  const examTime = new Date(examDate).getTime()
  if (isNaN(examTime)) return null
  const daysUntil = Math.ceil((examTime - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return null
  if (daysUntil > 90) return null
  const urgency = daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'medium' : 'low'
  return {
    id: generateId(),
    triggerType: 'exam_countdown',
    category: 'exam-countdown',
    title: `${daysUntil} day${daysUntil === 1 ? '' : 's'} until your exam`,
    message: daysUntil <= 7
      ? `Your IELTS exam is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}! Focus on reviewing key strategies and taking mock tests.`
      : `You have ${daysUntil} day${daysUntil === 1 ? '' : 's'} until your IELTS exam. Keep up with your study plan!`,
    priority: urgency,
    action: makeAction('exam-countdown'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateStudyStreak(input: ProactiveEngineInput): ProactiveMessage | null {
  const streak = input.learnerProfile?.studyStreak ?? input.learnerProfile?.consecutiveDays ?? 0
  if (streak < 3) return null
  const milestone = streak >= 30 ? 'month' : streak >= 7 ? 'week' : 'streak'
  const labels: Record<string, string> = {
    month: '🔥 Amazing consistency!',
    week: 'Great week of learning!',
    streak: 'Learning streak growing!',
  }
  return {
    id: generateId(),
    triggerType: 'study_streak',
    category: 'motivation',
    title: `${streak}-day learning streak!`,
    message: `${labels[milestone]} You've studied for ${streak} consecutive days. Keep it up — consistency is key to IELTS success.`,
    priority: streak >= 30 ? 'high' : 'medium',
    action: makeAction('motivation'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateLowActivity(input: ProactiveEngineInput): ProactiveMessage | null {
  const days = input.lowActivityDays ?? 0
  if (days < 2) return null
  return {
    id: generateId(),
    triggerType: 'low_activity',
    category: 'motivation',
    title: days >= 7 ? 'It\'s been a while!' : 'Haven\'t studied today?',
    message: days >= 7
      ? `It's been ${days} days since your last study session. Even 10 minutes of vocabulary review can help maintain your progress.`
      : `You haven't studied yet today. A quick 10-minute session can keep your streak going.`,
    priority: days >= 7 ? 'high' : 'low',
    action: makeAction('motivation'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateNewContent(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.newContentCount ?? 0
  if (count <= 0) return null
  return {
    id: generateId(),
    triggerType: 'new_content_saved',
    category: 'saved-content',
    title: `New content available`,
    message: `You've saved ${count} new item${count === 1 ? '' : 's'}. Turn them into exercises or review them in your content library.`,
    priority: 'low',
    action: makeAction('saved-content'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateDailyPlan(input: ProactiveEngineInput): ProactiveMessage | null {
  if (!input.dailyPlanReady) return null
  return {
    id: generateId(),
    triggerType: 'daily_plan_ready',
    category: 'study-plan',
    title: 'Your daily study plan is ready',
    message: 'Check out today\'s personalized study plan based on your progress and goals.',
    priority: 'medium',
    action: makeAction('study-plan'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

function generateMistakePattern(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.recentMistakeCount ?? 0
  if (count < 5) return null
  return {
    id: generateId(),
    triggerType: 'mistake_pattern_detected',
    category: 'mistake-review',
    title: `Pattern detected in your mistakes`,
    message: `You've made ${count} recent mistake${count === 1 ? '' : 's'}. Reviewing them now can help prevent repeating the same errors.`,
    priority: count > 15 ? 'high' : 'medium',
    action: makeAction('mistake-review'),
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    createdAt: new Date().toISOString(),
  }
}

type MessageGenerator = (input: ProactiveEngineInput) => ProactiveMessage | null

const generators: MessageGenerator[] = [
  generateVocabularyReview,
  generateMistakeReview,
  generateWeakSkill,
  generateExamCountdown,
  generateStudyStreak,
  generateLowActivity,
  generateNewContent,
  generateDailyPlan,
  generateMistakePattern,
]

export function generateProactiveMessages(input: ProactiveEngineInput): ProactiveMessage[] {
  return generators
    .map(fn => fn(input))
    .filter((msg): msg is ProactiveMessage => msg !== null)
}

export function generateContextSuggestions(
  input: ProactiveEngineInput,
  recentMessages: ChatMessage[],
): ContextSuggestion[] {
  const suggestions: ContextSuggestion[] = []

  if (input.dueVocabularyCount && input.dueVocabularyCount > 0) {
    suggestions.push({
      title: 'Words waiting for review',
      message: `You have ${input.dueVocabularyCount} vocabulary words due for review. Would you like to practice them now?`,
      action: 'quiz-me',
      actionLabel: 'Review vocabulary',
    })
  }

  if (input.dueMistakeCount && input.dueMistakeCount > 0) {
    suggestions.push({
      title: 'Mistakes to revisit',
      message: `Review your ${input.dueMistakeCount} pending mistake${input.dueMistakeCount === 1 ? '' : 's'} to avoid repeating them.`,
      action: 'correct-english',
      actionLabel: 'Review mistakes',
    })
  }

  const weakSkills = input.learnerProfile?.weakSkills
  if (weakSkills && weakSkills.length > 0) {
    suggestions.push({
      title: 'Focus on weak skills',
      message: `Spend some time improving your ${weakSkills.slice(0, 2).join(' and ')} skills today.`,
      action: 'practice-with-me',
      actionLabel: 'Practice now',
    })
  }

  if (!input.learnerProfile?.examDate && suggestions.length < 2) {
    suggestions.push({
      title: 'Set your exam date',
      message: 'Setting your IELTS exam date helps me create a more targeted study plan for you.',
      actionLabel: 'Set date',
    })
  }

  if (recentMessages.length === 0 && suggestions.length < 2) {
    suggestions.push({
      title: 'Start your IELTS journey',
      message: 'Try teaching me about a topic, generating exercises, or practicing your English skills.',
      action: 'teach-me',
      actionLabel: 'Teach me something',
    })
  }

  return suggestions.slice(0, 3)
}

export const GENERATORS: Record<string, MessageGenerator> = {
  generateVocabularyReview,
  generateMistakeReview,
  generateWeakSkill,
  generateExamCountdown,
  generateStudyStreak,
  generateLowActivity,
  generateNewContent,
  generateDailyPlan,
  generateMistakePattern,
}
