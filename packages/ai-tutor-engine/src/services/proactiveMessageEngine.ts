import type {
  ProactiveMessage,
  ProactiveMessageAction,
  ProactiveMessageCategory,
  ProactiveMessageTriggerType,
  ProactiveMessagePriority,
  TutorTone,
  ProactiveMessageSettings,
} from '../types/proactiveMessage'
import { generateId } from '../utils/id'

// ─── Action presets ──────────────────────────────────────────────────────────

const CATEGORY_ACTIONS: Record<string, { label: string; type: string; action: string }> = {
  'vocabulary-review': { label: 'Review vocabulary', type: 'action', action: 'quiz-me' },
  'mistake-review': { label: 'Review mistakes', type: 'action', action: 'correct-english' },
  'study-plan': { label: 'View plan', type: 'action', action: 'practice-with-me' },
  'speaking-practice': { label: 'Practice speaking', type: 'action', action: 'practice-with-me' },
  'writing-practice': { label: 'Practice writing', type: 'action', action: 'make-exercise' },
  'reading-practice': { label: 'Practice reading', type: 'action', action: 'make-exercise' },
  'listening-practice': { label: 'Practice listening', type: 'action', action: 'make-exercise' },
  'exam-countdown': { label: 'View countdown', type: 'action', action: 'teach-me' },
  'motivation': { label: 'Keep going', type: 'action', action: 'teach-me' },
  'saved-content': { label: 'View content', type: 'action', action: 'teach-me' },
  'daily-tip': { label: 'Show tip', type: 'action', action: 'teach-me' },
  'progress-report': { label: 'View progress', type: 'action', action: 'teach-me' },
  'suggestion': { label: 'Try it', type: 'action', action: 'practice-with-me' },
}

function makeAction(category: ProactiveMessageCategory): ProactiveMessageAction | undefined {
  const preset = CATEGORY_ACTIONS[category]
  if (!preset) return undefined
  return {
    type: preset.type,
    label: preset.label,
    payload: { action: preset.action },
  }
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface LearnerProfile {
  targetBand?: number
  currentBand?: number
  examDate?: string
  studyStreak?: number
  weakSkills?: string[]
  consecutiveDays?: number
  totalExercisesAttempted?: number
  averageAccuracy?: number
  strongestSkill?: string
  weakestSkill?: string
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
  lessonCompleted?: string
  unfinishedLessonTitle?: string
  savedWordCount?: number
  missedStudyDays?: number
  daysUntilExam?: number
  isWeeklyReviewReady?: boolean
  isMonthlyReviewReady?: boolean
  isMockTestReady?: boolean
  savedArticleCount?: number
  habitScore?: number
  recentAccuracyTrend?: 'improving' | 'declining' | 'stable'
}

// ─── Tone application ────────────────────────────────────────────────────────

const TONE_PREFIXES: Record<TutorTone, string[]> = {
  friendly: ['Hey there! ', 'Hi! ', 'Great to see you! '],
  strict: ['', '', ''],
  motivational: ['Let\'s go! ', 'You\'ve got this! ', 'Keep pushing! '],
  simple: ['', '', ''],
  vietnamese: ['Chào bạn! ', 'Xin chào! ', 'Bạn ơi! '],
}

function applyTone(message: string, tone: TutorTone): string {
  if (tone === 'friendly') {
    return TONE_PREFIXES.friendly[0] + message.charAt(0).toLowerCase() + message.slice(1)
  }
  if (tone === 'motivational') {
    return TONE_PREFIXES.motivational[0] + message
  }
  if (tone === 'vietnamese') {
    return TONE_PREFIXES.vietnamese[0] + message
  }
  return message
}

// ─── Spam prevention ─────────────────────────────────────────────────────────

const TRIGGER_COOLDOWN_MS: Partial<Record<ProactiveMessageTriggerType, number>> = {
  due_review: 4 * 60 * 60 * 1000,
  study_streak: 24 * 60 * 60 * 1000,
  low_activity: 12 * 60 * 60 * 1000,
  weekly_review: 6 * 24 * 60 * 60 * 1000,
  monthly_review: 28 * 24 * 60 * 60 * 1000,
  daily_tip: 24 * 60 * 60 * 1000,
  progress_celebration: 24 * 60 * 60 * 1000,
  lesson_completed: 2 * 60 * 60 * 1000,
}

function isInQuietHours(settings: ProactiveMessageSettings): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startParts = settings.quietHoursStart.split(':').map(Number)
  const endParts = settings.quietHoursEnd.split(':').map(Number)
  const startMinutes = startParts[0] * 60 + startParts[1]
  const endMinutes = endParts[0] * 60 + endParts[1]
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

function getMessagesTodayCount(messages: ProactiveMessage[]): number {
  const today = new Date().toDateString()
  return messages.filter(m => new Date(m.createdAt).toDateString() === today).length
}

function hasRecentMessageOfType(
  messages: ProactiveMessage[],
  triggerType: ProactiveMessageTriggerType,
  cooldownMs: number,
): boolean {
  const cutoff = Date.now() - cooldownMs
  return messages.some(
    m => m.triggerType === triggerType && new Date(m.createdAt).getTime() > cutoff,
  )
}

function isCategoryEnabled(
  settings: ProactiveMessageSettings,
  category: ProactiveMessageCategory,
): boolean {
  return settings.categories[category] !== false
}

// ─── Frequency and quiet hours enforcement types ─────────────────────────────

export interface QuietHoursDelayResult {
  isInQuietHours: boolean
  remainingMs: number
  endsAt: string
}

export interface CanSendResult {
  canSend: boolean
  reason?: string
  delayUntil?: string
  messagesToday: number
  maxPerDay: number
}

// ─── Frequency and quiet hours enforcement ─────────────────────────────────

/**
 * Returns the number of milliseconds until quiet hours end.
 * Returns 0 if not currently in quiet hours.
 */
export function getQuietHoursRemainingMs(settings: ProactiveMessageSettings): number {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startParts = settings.quietHoursStart.split(':').map(Number)
  const endParts = settings.quietHoursEnd.split(':').map(Number)
  const startMinutes = startParts[0] * 60 + startParts[1]
  const endMinutes = endParts[0] * 60 + endParts[1]

  const crossedMidnight = startMinutes > endMinutes

  const inQuietHours = crossedMidnight
    ? currentMinutes >= startMinutes || currentMinutes <= endMinutes
    : currentMinutes >= startMinutes && currentMinutes <= endMinutes

  if (!inQuietHours) return 0

  const nowDate = new Date()
  const nowMs = nowDate.getTime()

  if (!crossedMidnight) {
    const endDate = new Date(nowDate)
    endDate.setHours(endParts[0], endParts[1], 0, 0)
    return Math.max(0, endDate.getTime() - nowMs)
  }

  const isAfterMidnight = currentMinutes <= endMinutes
  const endDate = new Date(nowDate)
  if (!isAfterMidnight) {
    endDate.setDate(endDate.getDate() + 1)
  }
  endDate.setHours(endParts[0], endParts[1], 0, 0)
  return Math.max(0, endDate.getTime() - nowMs)
}

/**
 * Checks if the current time is in quiet hours and returns delay information.
 */
export function shouldDelayToQuietHours(settings: ProactiveMessageSettings): QuietHoursDelayResult | null {
  const remainingMs = getQuietHoursRemainingMs(settings)
  if (remainingMs === 0) return null
  const endsAt = new Date(Date.now() + remainingMs).toISOString()
  return {
    isInQuietHours: true,
    remainingMs,
    endsAt,
  }
}

/**
 * Comprehensive pre-send check that enforces all frequency and quiet hours limits.
 * Returns whether a message can be sent, and if not, why.
 * If suppressed, the caller should not send. If delayed, the caller can schedule for later.
 */
export function canSendProactiveMessage(
  settings: ProactiveMessageSettings,
  existingMessages: ProactiveMessage[] = [],
): CanSendResult {
  if (!settings.enabled) {
    return { canSend: false, reason: 'Proactive tutor is disabled', messagesToday: 0, maxPerDay: settings.maxMessagesPerDay }
  }

  const quietHoursDelay = shouldDelayToQuietHours(settings)
  if (quietHoursDelay) {
    return {
      canSend: false,
      reason: 'Quiet hours are active',
      delayUntil: quietHoursDelay.endsAt,
      messagesToday: getMessagesTodayCount(existingMessages),
      maxPerDay: settings.maxMessagesPerDay,
    }
  }

  const todayCount = getMessagesTodayCount(existingMessages)
  if (todayCount >= settings.maxMessagesPerDay) {
    return {
      canSend: false,
      reason: 'Max messages per day reached',
      messagesToday: todayCount,
      maxPerDay: settings.maxMessagesPerDay,
    }
  }

  return {
    canSend: true,
    messagesToday: todayCount,
    maxPerDay: settings.maxMessagesPerDay,
  }
}

/**
 * Computes the next allowed time for sending a proactive message.
 * Returns the ISO string of the earliest time a message can be sent,
 * considering quiet hours and daily limit reset.
 */
export function getNextAllowedTime(
  settings: ProactiveMessageSettings,
  existingMessages: ProactiveMessage[] = [],
): string | undefined {
  const quietHoursDelay = shouldDelayToQuietHours(settings)
  if (quietHoursDelay) {
    return quietHoursDelay.endsAt
  }

  const todayCount = getMessagesTodayCount(existingMessages)
  if (todayCount >= settings.maxMessagesPerDay) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow.toISOString()
  }

  return undefined
}

// ─── Generator type ──────────────────────────────────────────────────────────

type MessageGenerator = (input: ProactiveEngineInput) => ProactiveMessage | null

const PRIORITY_ORDER: Record<ProactiveMessagePriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function createMessage(
  triggerType: ProactiveMessageTriggerType,
  category: ProactiveMessageCategory,
  title: string,
  message: string,
  priority: ProactiveMessagePriority,
  options?: {
    action?: ProactiveMessageAction
    skill?: string
    sourceData?: string
    expiresAt?: string
  },
): ProactiveMessage {
  return {
    id: generateId(),
    triggerType,
    category,
    title,
    message,
    priority,
    action: options?.action ?? makeAction(category),
    skill: options?.skill,
    sourceData: options?.sourceData,
    expiresAt: options?.expiresAt,
    isRead: false,
    isDismissed: false,
    isSnoozed: false,
    autoGenerated: true,
    createdAt: new Date().toISOString(),
  }
}

// ─── Individual generators ───────────────────────────────────────────────────

function generateVocabularyReview(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.dueVocabularyCount ?? 0
  if (count <= 0) return null
  return createMessage(
    'due_review',
    'vocabulary-review',
    `${count} words due for review`,
    `You have ${count} vocabulary word${count === 1 ? '' : 's'} waiting to be reviewed. A quick session can help solidify them in long-term memory.`,
    count > 20 ? 'high' : 'medium',
    { sourceData: `dueVocabularyCount:${count}` },
  )
}

function generateMistakeReview(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.dueMistakeCount ?? 0
  if (count <= 0) return null
  return createMessage(
    'due_review',
    'mistake-review',
    `${count} mistake${count === 1 ? '' : 's'} to review`,
    `Reviewing your past mistakes is one of the most effective ways to improve. You have ${count} mistake${count === 1 ? '' : 's'} ready for review.`,
    count > 10 ? 'high' : 'medium',
    { sourceData: `dueMistakeCount:${count}` },
  )
}

function generateWeakSkill(input: ProactiveEngineInput): ProactiveMessage | null {
  const skills = input.learnerProfile?.weakSkills
  if (!skills || skills.length === 0) return null
  const skillList = skills.slice(0, 3).join(', ')
  const target = input.learnerProfile?.targetBand
  const current = input.learnerProfile?.currentBand
  const gap = target && current ? target - current : undefined
  const message = gap && gap > 1
    ? `You're ${gap} band${gap > 1 ? 's' : ''} away from your target of ${target}. Focusing on ${skillList} can help close that gap faster.`
    : `Based on your progress, consider spending more time on: ${skillList}. Targeted practice can help improve your band score faster.`
  return createMessage(
    'weak_skill_warning',
    'study-plan',
    `Focus on your weaker areas`,
    message,
    gap && gap > 1.5 ? 'high' : 'medium',
    { sourceData: `weakSkills:${skills.join(',')}` },
  )
}

function generateExamCountdown(input: ProactiveEngineInput): ProactiveMessage | null {
  const examDate = input.learnerProfile?.examDate
  if (!examDate) return null
  const examTime = new Date(examDate).getTime()
  if (isNaN(examTime)) return null
  const daysUntil = Math.ceil((examTime - Date.now()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0 || daysUntil > 90) return null
  const urgency: ProactiveMessagePriority = daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'medium' : 'low'
  const target = input.learnerProfile?.targetBand
  const targetNote = target ? ` Don't forget your target is band ${target}.` : ''
  const message = daysUntil <= 7
    ? `Your IELTS exam is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}! Focus on reviewing key strategies and taking mock tests.${targetNote}`
    : `You have ${daysUntil} day${daysUntil === 1 ? '' : 's'} until your IELTS exam. Keep up with your study plan!${targetNote}`
  return createMessage(
    'exam_countdown',
    'exam-countdown',
    `${daysUntil} day${daysUntil === 1 ? '' : 's'} until your exam`,
    message,
    urgency,
    { sourceData: `daysUntilExam:${daysUntil}`, skill: 'general' },
  )
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
  return createMessage(
    'study_streak',
    'motivation',
    `${streak}-day learning streak!`,
    `${labels[milestone]} You've studied for ${streak} consecutive days. Keep it up — consistency is key to IELTS success.`,
    streak >= 30 ? 'high' : 'medium',
    { sourceData: `streak:${streak}` },
  )
}

function generateLowActivity(input: ProactiveEngineInput): ProactiveMessage | null {
  const days = input.lowActivityDays ?? 0
  if (days < 2) return null
  return createMessage(
    'low_activity',
    'motivation',
    days >= 7 ? 'It\'s been a while!' : 'Haven\'t studied today?',
    days >= 7
      ? `It's been ${days} days since your last study session. Even 10 minutes of vocabulary review can help maintain your progress.`
      : `You haven't studied yet today. A quick 10-minute session can keep your streak going.`,
    days >= 7 ? 'high' : 'low',
    { sourceData: `lowActivityDays:${days}` },
  )
}

function generateNewContent(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.newContentCount ?? 0
  if (count <= 0) return null
  return createMessage(
    'new_content_saved',
    'saved-content',
    `New content available`,
    `You've saved ${count} new item${count === 1 ? '' : 's'}. Turn them into exercises or review them in your content library.`,
    'low',
    { sourceData: `newContentCount:${count}` },
  )
}

function generateDailyPlan(input: ProactiveEngineInput): ProactiveMessage | null {
  if (!input.dailyPlanReady) return null
  const streak = input.learnerProfile?.studyStreak ?? 0
  const message = streak > 0
    ? `Your daily study plan is ready! You're on a ${streak}-day streak — let's keep the momentum going.`
    : 'Check out today\'s personalized study plan based on your progress and goals.'
  return createMessage(
    'daily_plan_ready',
    'study-plan',
    'Your daily study plan is ready',
    message,
    'medium',
  )
}

function generateMistakePattern(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.recentMistakeCount ?? 0
  if (count < 5) return null
  return createMessage(
    'mistake_pattern_detected',
    'mistake-review',
    `Pattern detected in your mistakes`,
    `You've made ${count} recent mistake${count === 1 ? '' : 's'}. Reviewing them now can help prevent repeating the same errors.`,
    count > 15 ? 'high' : 'medium',
    { sourceData: `recentMistakeCount:${count}` },
  )
}

function generateLessonCompleted(input: ProactiveEngineInput): ProactiveMessage | null {
  if (!input.lessonCompleted) return null
  const streak = input.learnerProfile?.studyStreak ?? 0
  const message = streak >= 7
    ? `Nice work completing "${input.lessonCompleted}"! You're on a ${streak}-day streak — impressive dedication.`
    : `Great job finishing "${input.lessonCompleted}"! Every lesson brings you closer to your goal.`
  return createMessage(
    'lesson_completed',
    'motivation',
    `Lesson completed!`,
    message,
    'low',
    { sourceData: `lessonCompleted:${input.lessonCompleted}` },
  )
}

function generateInactiveDays(input: ProactiveEngineInput): ProactiveMessage | null {
  const days = input.missedStudyDays ?? 0
  if (days < 1) return null
  if (days === 1) {
    return createMessage(
      'inactive_days',
      'motivation',
      `Missed yesterday? No problem`,
      `You missed yesterday's study session. Let's do a lighter review today to get back on track — consistency matters more than perfection.`,
      'low',
      { sourceData: `missedStudyDays:${days}` },
    )
  }
  return createMessage(
    'inactive_days',
    'motivation',
    `${days} missed study day${days > 1 ? 's' : ''} this week`,
    `You missed ${days} study day${days > 1 ? 's' : ''} this week. No problem — let's do a focused session today to get back on track.`,
    days >= 3 ? 'medium' : 'low',
    { sourceData: `missedStudyDays:${days}` },
  )
}

function generateWeeklyReview(input: ProactiveEngineInput): ProactiveMessage | null {
  if (!input.isWeeklyReviewReady) return null
  const accuracy = input.learnerProfile?.averageAccuracy
  const trend = input.recentAccuracyTrend
  let message = 'Your weekly progress review is ready. Let\'s see how far you\'ve come!'
  if (accuracy !== undefined && trend === 'improving') {
    message = `Your weekly review is ready! Your accuracy is ${accuracy}% and trending up — great improvement this week.`
  } else if (accuracy !== undefined && trend === 'declining') {
    message = `Your weekly review is ready. Your accuracy is ${accuracy}% — let's identify what needs more focus.`
  }
  return createMessage(
    'weekly_review',
    'progress-report',
    'Weekly progress review ready',
    message,
    'medium',
    { sourceData: `weeklyReview:accuracy=${accuracy ?? 'N/A'},trend=${trend ?? 'stable'}` },
  )
}

function generateMonthlyReview(input: ProactiveEngineInput): ProactiveMessage | null {
  if (!input.isMonthlyReviewReady) return null
  const target = input.learnerProfile?.targetBand
  const current = input.learnerProfile?.currentBand
  let message = 'Your monthly progress review is ready! Time to reflect on your journey.'
  if (target && current) {
    message = `Your monthly review is ready! You're currently at band ${current}, working toward ${target}. Let's check your progress.`
  }
  return createMessage(
    'monthly_review',
    'progress-report',
    'Monthly progress review ready',
    message,
    'medium',
    { sourceData: `monthlyReview:current=${current ?? 'N/A'},target=${target ?? 'N/A'}` },
  )
}

function generateUnfinishedLesson(input: ProactiveEngineInput): ProactiveMessage | null {
  if (!input.unfinishedLessonTitle) return null
  return createMessage(
    'unfinished_lesson',
    'study-plan',
    `Continue your lesson`,
    `You left "${input.unfinishedLessonTitle}" unfinished. Would you like to pick up where you stopped?`,
    'medium',
    { sourceData: `unfinishedLesson:${input.unfinishedLessonTitle}` },
  )
}

function generateSavedWordExercise(input: ProactiveEngineInput): ProactiveMessage | null {
  const count = input.savedWordCount ?? 0
  if (count < 3) return null
  return createMessage(
    'saved_word_exercise',
    'vocabulary-review',
    `${count} saved word${count > 1 ? 's' : ''} ready for practice`,
    `You have ${count} saved word${count > 1 ? 's' : ''}. Let's turn them into a quick exercise before you forget them.`,
    'low',
    { sourceData: `savedWordCount:${count}` },
  )
}

function generateDailyTip(_input: ProactiveEngineInput): ProactiveMessage | null {
  const tips = [
    'Try reading an IELTS passage without a dictionary — focus on understanding the main idea first.',
    'For Task 2 essays, spend 5 minutes planning before you start writing.',
    'In Speaking Part 2, use the 1-minute preparation time to jot down key points.',
    'Listen for signpost words like "however" and "firstly" in the Listening test.',
    'Practice paraphrasing — it\'s essential for both Writing and Speaking.',
    'Read the questions before the passage in Reading — it saves time.',
    'For true/false/not given questions, look for exact matches, not just similar words.',
    'In Writing Task 1, don\'t describe every data point — highlight the main trends.',
    'Record yourself speaking and listen back to identify areas for improvement.',
    'Build a template for each essay type — it saves time on exam day.',
    'Learn 5 new collocations every day, not just individual words.',
    'Use the "rule of three" in Speaking: make a point, explain it, give an example.',
  ]
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const tip = tips[dayOfYear % tips.length]
  return createMessage(
    'daily_tip',
    'daily-tip',
    'Daily IELTS tip',
    tip,
    'low',
    { expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
  )
}

function generateMockTestReady(input: ProactiveEngineInput): ProactiveMessage | null {
  if (!input.isMockTestReady) return null
  const target = input.learnerProfile?.targetBand
  const message = target
    ? `You're ready for a mock test! Your target is band ${target} — this will help you see how close you are.`
    : 'You\'re ready for a mock test! It\'s a great way to assess your current level under real exam conditions.'
  return createMessage(
    'mock_test_ready',
    'suggestion',
    'Ready for a mock test?',
    message,
    'medium',
    { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
  )
}

function generateExamDateReminder(input: ProactiveEngineInput): ProactiveMessage | null {
  const profile = input.learnerProfile
  if (!profile?.examDate && !profile?.targetBand) return null
  if (profile.examDate) {
    const examTime = new Date(profile.examDate).getTime()
    if (isNaN(examTime)) return null
    const daysUntil = Math.ceil((examTime - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntil < 0) return null
    if (profile.targetBand) {
      return createMessage(
        'exam_date_reminder',
        'exam-countdown',
        `Your IELTS goal is band ${profile.targetBand}`,
        `Your exam is ${daysUntil === 0 ? 'today' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} away`} and your target is band ${profile.targetBand}. Keep that goal in sight!`,
        daysUntil <= 14 ? 'high' : 'medium',
        { sourceData: `examDate:${profile.examDate},targetBand:${profile.targetBand}` },
      )
    }
    return createMessage(
      'exam_date_reminder',
      'exam-countdown',
      `Exam day is approaching`,
      `Your IELTS exam is ${daysUntil === 0 ? 'today' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} away`}. Make sure you're prepared!`,
      daysUntil <= 14 ? 'high' : 'medium',
      { sourceData: `examDate:${profile.examDate}` },
    )
  }
  if (profile.targetBand) {
    return createMessage(
      'exam_date_reminder',
      'exam-countdown',
      `Your target is band ${profile.targetBand}`,
      `You haven't set an exam date yet, but your target is band ${profile.targetBand}. Setting a date can help you stay motivated and focused.`,
      'low',
      { sourceData: `targetBand:${profile.targetBand}` },
    )
  }
  return null
}

function generateProgressCelebration(input: ProactiveEngineInput): ProactiveMessage | null {
  const streak = input.learnerProfile?.studyStreak ?? 0
  const accuracy = input.learnerProfile?.averageAccuracy
  const exercises = input.learnerProfile?.totalExercisesAttempted ?? 0
  const celebrations: string[] = []
  if (streak >= 7) celebrations.push(`${streak}-day streak`)
  if (accuracy && accuracy >= 80) celebrations.push(`${accuracy}% accuracy`)
  if (exercises >= 100) celebrations.push(`${exercises} total exercises`)
  if (celebrations.length === 0) return null
  const message = `Amazing progress! ${celebrations.join(' and ')} — you're working hard and it shows. Keep it up!`
  return createMessage(
    'progress_celebration',
    'motivation',
    'Progress milestone reached!',
    message,
    'low',
    { sourceData: `celebrations:${celebrations.join(',')}` },
  )
}

function generateStudySessionSuggestion(input: ProactiveEngineInput): ProactiveMessage | null {
  const habitScore = input.habitScore ?? 50
  const streak = input.learnerProfile?.studyStreak ?? 0
  const weakSkills = input.learnerProfile?.weakSkills
  const target = input.learnerProfile?.targetBand
  if (habitScore >= 80 && streak >= 14) {
    const skill = weakSkills?.[0] ?? 'general'
    const bandNote = target ? ` With band ${target} as your goal, focusing on ${skill} would be strategic.` : ''
    return createMessage(
      'study_session_suggestion',
      'suggestion',
      'Ready for a challenge?',
      `You've been consistently studying — how about pushing yourself with a harder ${skill} session?${bandNote}`,
      'low',
      { sourceData: `habitScore:${habitScore},streak:${streak}`, skill: weakSkills?.[0] },
    )
  }
  if (habitScore < 40) {
    return createMessage(
      'study_session_suggestion',
      'suggestion',
      'How about a light session?',
      'Even 15 minutes of vocabulary review can keep your learning on track. Start small and build momentum.',
      'low',
      { sourceData: `habitScore:${habitScore}` },
    )
  }
  return null
}

function generateTopicPracticeSuggestion(input: ProactiveEngineInput): ProactiveMessage | null {
  const weakSkills = input.learnerProfile?.weakSkills
  if (!weakSkills || weakSkills.length === 0) return null
  const skill = weakSkills[0]
  const categoryMap: Record<string, ProactiveMessageCategory> = {
    writing: 'writing-practice',
    speaking: 'speaking-practice',
    reading: 'reading-practice',
    listening: 'listening-practice',
  }
  const category = categoryMap[skill] ?? 'suggestion'
  return createMessage(
    'topic_practice_suggestion',
    category,
    `Practice your ${skill} skills`,
    `Since ${skill} is one of your weaker areas, I recommend doing a focused practice session today.`,
    'medium',
    { skill, sourceData: `weakSkill:${skill}` },
  )
}

// ─── Generator registry ──────────────────────────────────────────────────────

const generators: MessageGenerator[] = [
  generateExamCountdown,
  generateExamDateReminder,
  generateVocabularyReview,
  generateMistakeReview,
  generateMistakePattern,
  generateWeakSkill,
  generateTopicPracticeSuggestion,
  generateStudyStreak,
  generateProgressCelebration,
  generateStudySessionSuggestion,
  generateDailyPlan,
  generateUnfinishedLesson,
  generateLessonCompleted,
  generateInactiveDays,
  generateLowActivity,
  generateNewContent,
  generateSavedWordExercise,
  generateMockTestReady,
  generateWeeklyReview,
  generateMonthlyReview,
  generateDailyTip,
]

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Generate proactive messages from input data.
 * Returns all possible messages without settings-based filtering.
 */
export function generateProactiveMessages(input: ProactiveEngineInput): ProactiveMessage[] {
  const messages = generators
    .map(fn => fn(input))
    .filter((msg): msg is ProactiveMessage => msg !== null)
  messages.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  return messages
}

/**
 * Generate proactive messages with settings-aware filtering.
 * Respects quiet hours, max messages per day, enabled categories, and cooldowns.
 */
export function generateProactiveMessagesWithSettings(
  input: ProactiveEngineInput,
  settings: ProactiveMessageSettings,
  existingMessages: ProactiveMessage[] = [],
): { messages: ProactiveMessage[]; throttled: number; reason?: string; delayUntil?: string; nextAllowedTime?: string } {
  const sendCheck = canSendProactiveMessage(settings, existingMessages)
  if (!sendCheck.canSend) {
    return {
      messages: [],
      throttled: 0,
      reason: sendCheck.reason,
      delayUntil: sendCheck.delayUntil,
      nextAllowedTime: getNextAllowedTime(settings, existingMessages),
    }
  }

  const capacity = settings.maxMessagesPerDay - sendCheck.messagesToday
  const generated = generators
    .map(fn => fn(input))
    .filter((msg): msg is ProactiveMessage => msg !== null)
    .filter(msg => isCategoryEnabled(settings, msg.category))
    .filter(msg => {
      const cooldown = TRIGGER_COOLDOWN_MS[msg.triggerType]
      if (!cooldown) return true
      return !hasRecentMessageOfType(existingMessages, msg.triggerType, cooldown)
    })

  generated.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  const allowed = generated.slice(0, capacity)
  const throttled = generated.length - allowed.length
  const tone = settings.tone ?? 'friendly'
  const messages = allowed.map(msg => ({
    ...msg,
    message: tone !== 'simple' ? applyTone(msg.message, tone) : msg.message,
  }))

  return { messages, throttled }
}

/**
 * Get the current quiet hours state.
 */
export function isCurrentlyQuietHours(settings: ProactiveMessageSettings): boolean {
  return isInQuietHours(settings)
}

// ─── Context suggestions (kept for backward compatibility) ───────────────────

export function generateContextSuggestions(
  input: ProactiveEngineInput,
  recentMessages: import('../types').ChatMessage[],
): import('../types').ContextSuggestion[] {
  const suggestions: import('../types').ContextSuggestion[] = []

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
  generateLessonCompleted,
  generateInactiveDays,
  generateWeeklyReview,
  generateMonthlyReview,
  generateUnfinishedLesson,
  generateSavedWordExercise,
  generateDailyTip,
  generateMockTestReady,
  generateExamDateReminder,
  generateProgressCelebration,
  generateStudySessionSuggestion,
  generateTopicPracticeSuggestion,
}
