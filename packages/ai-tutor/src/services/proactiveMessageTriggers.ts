import { ProactiveEventBus } from './proactiveEventBus'
import { generateProactiveMessages, generateProactiveMessagesWithSettings } from './proactiveMessageEngine'
import { ProactiveMessageStorage } from './proactiveMessageStorage'
import type { ProactiveEngineInput, LearnerProfile } from './proactiveMessageEngine'
import type { ProactiveMessage, ProactiveMessageInput } from '../types/proactiveMessage'

// ─── Trigger Result ────────────────────────────────────────────────────────────

export interface TriggerResult {
  generated: number
  throttled: number
  messages: ProactiveMessage[]
}

// ─── Recent word stats (in-memory to avoid circular deps) ─────────────────────

interface TextSelectionData {
  text: string
  savedWords: number
  articleTitle?: string
}

const recentTextSelections: Map<string, TextSelectionData> = new Map()

// ─── Helper: load learner profile from storage ─────────────────────────────────

function loadLearnerProfile(): LearnerProfile | undefined {
  try {
    const raw = localStorage.getItem('ielts-learner-profile')
    if (!raw) return undefined
    return JSON.parse(raw) as LearnerProfile
  } catch {
    return undefined
  }
}

function getStoredNumber(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const val = Number(raw)
    return Number.isFinite(val) ? val : 0
  } catch {
    return 0
  }
}

function countDueVocabulary(): number {
  return getStoredNumber('ielts-due-vocabulary-count')
}

function countDueMistakes(): number {
  return getStoredNumber('ielts-due-mistake-count')
}

function getLowActivityDays(): number {
  return getStoredNumber('ielts-low-activity-days')
}

function getMissedStudyDays(): number {
  return getStoredNumber('ielts-missed-study-days')
}

function getHabitScore(): number {
  return getStoredNumber('ielts-habit-score')
}

function getSavedWordCount(): number {
  return getStoredNumber('ielts-saved-word-count')
}

function getRecentMistakeCount(): number {
  return getStoredNumber('ielts-recent-mistake-count')
}

function getNewContentCount(): number {
  return getStoredNumber('ielts-new-content-count')
}

function getLastWeeklyReviewDate(): string | undefined {
  try {
    return localStorage.getItem('ielts-last-weekly-review-date') ?? undefined
  } catch {
    return undefined
  }
}

// ─── Core trigger builder ──────────────────────────────────────────────────────

function buildInput(overrides: Partial<ProactiveEngineInput> = {}): ProactiveEngineInput {
  const storedProfile = loadLearnerProfile()
  const mergedProfile = overrides.learnerProfile
    ? { ...storedProfile, ...overrides.learnerProfile }
    : storedProfile

  return {
    dueVocabularyCount: countDueVocabulary(),
    dueMistakeCount: countDueMistakes(),
    lowActivityDays: getLowActivityDays(),
    missedStudyDays: getMissedStudyDays(),
    habitScore: getHabitScore(),
    savedWordCount: getSavedWordCount(),
    recentMistakeCount: getRecentMistakeCount(),
    newContentCount: getNewContentCount(),
    ...overrides,
    learnerProfile: mergedProfile,
  }
}

// ─── Internal generate + persist ───────────────────────────────────────────────

function trigger(
  input: ProactiveEngineInput,
  alwaysGenerate = false,
): TriggerResult {
  const settings = ProactiveMessageStorage.loadSettings()
  const existingMessages = ProactiveMessageStorage.loadMessages()

  let messages: ProactiveMessage[]

  if (alwaysGenerate) {
    messages = generateProactiveMessages(input)
  } else {
    const result = generateProactiveMessagesWithSettings(
      input,
      settings,
      existingMessages,
    )
    messages = result.messages
    if (result.throttled > 0) {
      const excess = generateProactiveMessages(input).filter(
        m => !messages.some(n => n.id === m.id),
      ).slice(0, result.throttled)
      return { generated: messages.length, throttled: result.throttled, messages: excess }
    }
  }

  if (messages.length === 0) {
    return { generated: 0, throttled: 0, messages: [] }
  }

  const saved: ProactiveMessage[] = []
  for (const msg of messages) {
    const inputMsg: ProactiveMessageInput = {
      triggerType: msg.triggerType,
      category: msg.category,
      title: msg.title,
      message: msg.message,
      priority: msg.priority,
      action: msg.action,
      skill: msg.skill,
      sourceData: msg.sourceData,
      expiresAt: msg.expiresAt,
    }
    const stored = ProactiveMessageStorage.addMessage(inputMsg)
    saved.push(stored)
    ProactiveEventBus.emitNewMessage(stored)
  }

  return { generated: saved.length, throttled: 0, messages: saved }
}

// ─── Individual Triggers ───────────────────────────────────────────────────────

export function onLessonCompleted(lessonTitle: string): TriggerResult {
  if (!canTrigger('onLessonCompleted')) return { generated: 0, throttled: 0, messages: [] }
  return trigger(buildInput({ lessonCompleted: lessonTitle }))
}

export function onRepeatedMistakes(count: number, _pattern?: string): TriggerResult {
  if (!canTrigger('onRepeatedMistakes')) return { generated: 0, throttled: 0, messages: [] }
  return trigger(buildInput({ recentMistakeCount: count }))
}

export function onInactivityDetected(inactiveDays: number): TriggerResult {
  if (!canTrigger('onInactivityDetected')) return { generated: 0, throttled: 0, messages: [] }
  const input = buildInput({
    lowActivityDays: inactiveDays,
    missedStudyDays: Math.max(0, inactiveDays - 1),
  })
  return trigger(input)
}

export function onVocabularySaved(wordCount: number): TriggerResult {
  if (!canTrigger('onVocabularySaved')) return { generated: 0, throttled: 0, messages: [] }
  return trigger(buildInput({ savedWordCount: wordCount }))
}

export function onTextSelected(text: string, articleTitle?: string): TriggerResult {
  if (!canTrigger('onTextSelected')) return { generated: 0, throttled: 0, messages: [] }
  const savedWords = Math.ceil(text.split(/\s+/).length * 0.15)
  const entry: TextSelectionData = { text, savedWords, articleTitle }
  const key = `text-${Date.now()}`
  recentTextSelections.set(key, entry)
  if (recentTextSelections.size > 20) {
    const first = recentTextSelections.keys().next().value
    if (first) recentTextSelections.delete(first)
  }
  return trigger(buildInput({
    newContentCount: savedWords > 0 ? 1 : 0,
    savedWordCount: getSavedWordCount() + savedWords,
  }))
}

export function onWeeklyReviewReady(accuracyTrend?: 'improving' | 'declining' | 'stable'): TriggerResult {
  if (!canTrigger('onWeeklyReviewReady')) return { generated: 0, throttled: 0, messages: [] }
  localStorage.setItem('ielts-last-weekly-review-date', new Date().toISOString())
  return trigger(buildInput({
    isWeeklyReviewReady: true,
    recentAccuracyTrend: accuracyTrend ?? 'stable',
  }), true)
}

export function onMonthlyReviewReady(): TriggerResult {
  if (!canTrigger('onMonthlyReviewReady')) return { generated: 0, throttled: 0, messages: [] }
  return trigger(buildInput({ isMonthlyReviewReady: true }), true)
}

export function onDailyPlanReady(): TriggerResult {
  return trigger(buildInput({ dailyPlanReady: true }))
}

export function onUnfinishedLesson(lessonTitle: string): TriggerResult {
  return trigger(buildInput({ unfinishedLessonTitle: lessonTitle }))
}

export function onMockTestReady(): TriggerResult {
  return trigger(buildInput({ isMockTestReady: true }))
}

export function onStreakMilestone(streak: number): TriggerResult {
  if (!canTrigger('onStreakMilestone')) return { generated: 0, throttled: 0, messages: [] }
  return trigger(buildInput({
    learnerProfile: { studyStreak: streak },
  }))
}

// ─── Batch trigger (for initial load or daily check) ──────────────────────────

export function triggerDailyCheck(): TriggerResult {
  const input = buildInput({
    dailyPlanReady: true,
    isWeeklyReviewReady: checkWeeklyReviewDue(),
    isMonthlyReviewReady: checkMonthlyReviewDue(),
  })
  return trigger(input)
}

function checkWeeklyReviewDue(): boolean {
  const last = getLastWeeklyReviewDate()
  if (!last) return true
  const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= 7
}

function checkMonthlyReviewDue(): boolean {
  const last = getLastWeeklyReviewDate()
  if (!last) return true
  const daysSince = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince >= 28
}

// ─── Trigger tracking (for deduplication) ─────────────────────────────────────

const recentTriggers = new Map<string, number>()
const TRIGGER_COOLDOWN_MS: Record<string, number> = {
  onLessonCompleted: 2 * 60 * 60 * 1000,
  onRepeatedMistakes: 4 * 60 * 60 * 1000,
  onInactivityDetected: 12 * 60 * 60 * 1000,
  onVocabularySaved: 6 * 60 * 60 * 1000,
  onTextSelected: 60 * 60 * 1000,
  onWeeklyReviewReady: 6 * 24 * 60 * 60 * 1000,
  onMonthlyReviewReady: 28 * 24 * 60 * 60 * 1000,
  onStreakMilestone: 24 * 60 * 60 * 1000,
}

export function isTriggerOnCooldown(triggerName: string): boolean {
  const cooldown = TRIGGER_COOLDOWN_MS[triggerName]
  if (!cooldown) return false
  const last = recentTriggers.get(triggerName)
  if (!last) return false
  return Date.now() - last < cooldown
}

export function canTrigger(triggerName: string): boolean {
  const settings = ProactiveMessageStorage.loadSettings()
  if (!settings.enabled) return false
  if (isTriggerOnCooldown(triggerName)) return false
  recentTriggers.set(triggerName, Date.now())
  return true
}

// ─── Reset (for testing) ──────────────────────────────────────────────────────

export function resetRecentTriggers(): void {
  recentTriggers.clear()
  recentTextSelections.clear()
}
