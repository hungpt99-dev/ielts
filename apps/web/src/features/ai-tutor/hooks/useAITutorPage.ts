import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadLearningProfile } from '../repositories/learningProfileRepository'
import type { RawLearningProfile } from '../repositories/learningProfileRepository'
import {
  determineSessionStrategy,
  buildSessionFromStrategy,
  getFeedbackSummary,
  generateAdviceItems,
} from '../services/aiTutorSessionService'
import { getRecentActivities, recordActivity } from '../services/activityRepository'
import { emitAITutorEvent } from '../services/aiTutorEventService'
import { getTeacherProgressReview, invalidateAIReviewCache } from '../services/teacherProgressReviewService'
import { getRouteForSkill } from '../utils/skillRouting'
import { AI_TUTOR_REFRESH } from '../constants'
import type { TutorSession, LearningProfile, FeedbackSummary, TeacherAdviceItem, ActivityItem } from '../types/aiTutor.types'
import type { ProgressReview } from '../services/teacherProgressReviewService'

const emptyProgressReview: ProgressReview = {
  summary: 'Keep up the good work!',
  improvements: [],
  struggles: [],
  focusAreas: ['Start your first lesson to get personalized recommendations'],
  streak: 0,
  weeklyCompletion: 0,
  totalStudyHours: 0,
  mistakesReviewed: 0,
  vocabLearned: 0,
  weakSkills: [],
  examCountdown: 0,
  skillBreakdown: [],
  weeklyTasksDone: 0,
  weeklyTasksTotal: 0,
  vocabDueReview: 0,
  vocabMastered: 0,
  mistakesUnresolved: 0,
  mistakesRecent: 0,
  todayUnfinished: 0,
  isExamUrgent: false,
  skillProgress: [],
  studyPlanAdherence: '',
  tutorFeedback: '',
  generatedAt: null,
}

const emptyProfile: LearningProfile = {
  targetBand: '', currentBand: 0, targetBandNum: 0, examDate: '', examCountdown: 0,
  weakSkills: '', weakSkillsList: [], todayFocus: '', savedWords: 0, mistakesToReview: 0,
  studyStreak: 0, weeklyTasksDone: 0, weeklyTasksTotal: 0, totalStudyHours: 0,
  roadmapProgress: 0, dailyStudyMinutes: 0, vocabMastered: 0, vocabDueReview: 0, loading: true,
}

export interface AITutorPageState {
  session: TutorSession
  profile: LearningProfile
  progressReview: ProgressReview
  feedbackSummary: FeedbackSummary
  adviceItems: TeacherAdviceItem[]
  recentActivities: ActivityItem[]
  isAiConfigured: boolean
  loading: boolean
  refreshing: boolean
  onRefresh: () => void
  onStartSession: () => void
  onViewDetails: () => void
  onStartLesson: () => void
  onReviewMistakes: () => void
  onPracticeVocabulary: () => void
  onUpdateStudyPlan: () => void
  onAdviceAction: (key: string) => void
  onAskTutor: (message: string) => void
  onConfigureAi: () => void
  onSetTargetBand: () => void
  onSetExamDate: () => void
}

function useCheckAiConfig(): boolean {
  try {
    const raw = localStorage.getItem('ielts-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      return !!(parsed.aiApiKey)
    }
  } catch {}
  return false
}

const emptySession: TutorSession = {
  focus: 'Getting Started',
  lessonTitle: 'Welcome to Your IELTS Journey',
  reason: 'Set up your target band, exam date, and study preferences so your AI Tutor can prepare personalized lessons for you.',
  estimatedTime: '10 minutes',
  skill: 'Getting Started',
  focusArea: 'Setup',
}

const emptyFeedback: FeedbackSummary = {
  mainWeakness: 'Not enough data yet',
  mostCommonIssue: 'Keep studying to get personalized insights',
  recommendedNextStep: "Start Today's Lesson",
  streak: 0, examCountdown: 0, isExamUrgent: false,
}

function deriveProfile(raw: RawLearningProfile): LearningProfile {
  return {
    targetBand: raw.targetBandDisplay,
    currentBand: raw.currentBand,
    targetBandNum: raw.targetBandNum,
    examDate: raw.examDate,
    examCountdown: raw.examCountdown,
    weakSkills: raw.weakSkillsDisplay,
    weakSkillsList: raw.weakSkillsList,
    todayFocus: '',
    savedWords: raw.savedWords,
    mistakesToReview: raw.mistakesToReview,
    studyStreak: raw.studyStreak,
    weeklyTasksDone: raw.weeklyTasksDone,
    weeklyTasksTotal: raw.weeklyTasksTotal,
    totalStudyHours: raw.totalStudyHours,
    roadmapProgress: raw.roadmapProgress,
    dailyStudyMinutes: raw.dailyStudyMinutes,
    vocabMastered: raw.vocabMastered,
    vocabDueReview: raw.vocabDueReview,
    loading: false,
  }
}

function deriveSession(raw: RawLearningProfile): TutorSession {
  const strategy = determineSessionStrategy(raw)
  return buildSessionFromStrategy(strategy, raw)
}

function deriveAdviceItems(raw: RawLearningProfile): TeacherAdviceItem[] {
  return generateAdviceItems(raw).map((a) => {
    let iconName: TeacherAdviceItem['iconName'] = 'target'
    if (a.key.includes('grammar')) iconName = 'grammar'
    else if (a.key.includes('vocabulary') || a.key.includes('vocab')) iconName = 'vocabulary'
    else if (a.key.includes('speaking') || a.key.includes('warmup')) iconName = 'speaking'
    else if (a.key.includes('mock') || a.key.includes('test')) iconName = 'target'
    return { ...a, iconName }
  })
}

function applyRawProfile(raw: RawLearningProfile): {
  profile: LearningProfile
  session: TutorSession
  feedbackSummary: FeedbackSummary
  adviceItems: TeacherAdviceItem[]
  recentActivities: ActivityItem[]
} {
  const session = deriveSession(raw)
  const profile = deriveProfile(raw)
  profile.todayFocus = session.focus
  return {
    profile,
    session,
    feedbackSummary: getFeedbackSummary(raw),
    adviceItems: deriveAdviceItems(raw),
    recentActivities: getRecentActivities(5),
  }
}

export function useAITutorPage(): AITutorPageState {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<LearningProfile>(emptyProfile)
  const [session, setSession] = useState<TutorSession>(emptySession)
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary>(emptyFeedback)
  const [adviceItems, setAdviceItems] = useState<TeacherAdviceItem[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [progressReview, setProgressReview] = useState<ProgressReview>(emptyProgressReview)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const refreshingRef = useRef(false)
  const refreshGenRef = useRef(0)
  const reviewGenRef = useRef(0)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAiConfigured = useCheckAiConfig()
  const mountedRef = useRef(true)

  const refreshActivities = useCallback(() => {
    setRecentActivities(getRecentActivities(5))
  }, [])

  useEffect(() => {
    let cancelled = false
    mountedRef.current = true

    loadLearningProfile()
      .then(async (raw) => {
        if (cancelled) return
        const data = applyRawProfile(raw)
        setProfile(data.profile)
        setSession(data.session)
        setFeedbackSummary(data.feedbackSummary)
        setAdviceItems(data.adviceItems)
        setRecentActivities(data.recentActivities)
        setLoading(false)

        const pageGen = reviewGenRef.current
        const review = await getTeacherProgressReview(raw.context)
        if (cancelled || pageGen !== reviewGenRef.current) return
        setProgressReview(review)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      mountedRef.current = false
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [])

  const finishRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
    refreshingRef.current = false
    setRefreshing(false)
  }, [])

  const onRefresh = useCallback(() => {
    if (refreshingRef.current) return
    const gen = ++refreshGenRef.current
    refreshingRef.current = true
    setRefreshing(true)

    refreshTimeoutRef.current = setTimeout(() => {
      if (gen === refreshGenRef.current) finishRefresh()
    }, AI_TUTOR_REFRESH.SAFETY_TIMEOUT_MS)

    const MIN_REFRESH_DURATION_MS = 600
    const refreshStartedAt = Date.now()

    setTimeout(async () => {
      try {
        const raw = await loadLearningProfile()
        if (!mountedRef.current) return
        const data = applyRawProfile(raw)
        setProfile(data.profile)
        setSession(data.session)
        setFeedbackSummary(data.feedbackSummary)
        setAdviceItems(data.adviceItems)
        setRecentActivities(data.recentActivities)

        ++reviewGenRef.current

        const review = await getTeacherProgressReview(raw.context, true)
        if (mountedRef.current) setProgressReview(review)
      } catch (err) {
        console.error('AI Tutor refresh failed:', err)
      } finally {
        const elapsed = Date.now() - refreshStartedAt
        const remaining = MIN_REFRESH_DURATION_MS - elapsed
        if (remaining > 0) {
          setTimeout(() => {
            if (gen === refreshGenRef.current) finishRefresh()
          }, remaining)
        } else {
          if (gen === refreshGenRef.current) finishRefresh()
        }
      }
    }, 0)
  }, [finishRefresh])

  const recordAndNavigate = useCallback((eventType: Parameters<typeof emitAITutorEvent>[0]['eventType'], activityLabel: string, route: string) => {
    emitAITutorEvent({ eventType, todayFocus: session.focus, skill: session.skill })
    recordActivity(activityLabel)
    refreshActivities()
    navigate(route)
  }, [navigate, session, refreshActivities])

  const onStartSession = useCallback(() => {
    recordAndNavigate('TODAY_SESSION_STARTED', `Started ${session.focus} session`, getRouteForSkill(session.skill))
  }, [session, recordAndNavigate])

  const onViewDetails = useCallback(() => {
    navigate('/today-plan')
  }, [navigate])

  const onStartLesson = useCallback(() => {
    recordAndNavigate('TODAY_LESSON_STARTED', `Started ${session.lessonTitle}`, getRouteForSkill(session.skill))
  }, [session, recordAndNavigate])

  const onReviewMistakes = useCallback(() => {
    recordAndNavigate('MISTAKE_REVIEW_OPENED', 'Reviewed grammar mistakes', '/mistakes')
  }, [recordAndNavigate])

  const onPracticeVocabulary = useCallback(() => {
    recordAndNavigate('VOCAB_PRACTICE_STARTED', 'Practiced saved vocabulary', '/vocabulary')
  }, [recordAndNavigate])

  const onUpdateStudyPlan = useCallback(() => {
    recordAndNavigate('STUDY_PLAN_UPDATE_CLICKED', 'Updated study plan', '/roadmap')
  }, [recordAndNavigate])

  const onAdviceAction = useCallback((key: string) => {
    const actionMap: Record<string, { activity: string; route: string }> = {
      'complete-tasks': { activity: 'Viewed study plan', route: '/today-plan' },
      'review-grammar': { activity: 'Reviewed grammar mistakes', route: '/grammar' },
      'vocabulary-review': { activity: 'Reviewed vocabulary', route: '/vocabulary' },
      'practice-vocabulary': { activity: 'Practiced saved vocabulary', route: '/vocabulary' },
      'speaking-warmup': { activity: 'Started speaking warm-up', route: '/speaking' },
      speaking: { activity: 'Started speaking warm-up', route: '/speaking' },
      'mock-test-prep': { activity: 'Viewed mock tests', route: '/mock-tests' },
      'start-learning': { activity: 'Started learning', route: '/dashboard' },
    }
    const action = actionMap[key] ?? { activity: 'Started lesson', route: '/today-plan' }
    emitAITutorEvent({ eventType: 'TEACHER_ADVICE_CLICKED', metadata: { adviceKey: key } })
    recordActivity(action.activity)
    refreshActivities()
    navigate(action.route)
  }, [navigate, refreshActivities])

  const onAskTutor = useCallback((message: string) => {
    emitAITutorEvent({ eventType: 'ASK_TUTOR_SUBMITTED', todayFocus: session.focus, metadata: { question: message } })
    recordActivity(`Asked tutor: ${message.slice(0, 60)}`)
    refreshActivities()
    if (!isAiConfigured) return
    try {
      sessionStorage.setItem('ai-tutor-pending-message', message)
    } catch {}
    window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
  }, [isAiConfigured, session.focus, refreshActivities])

  const onConfigureAi = useCallback(() => {
    navigate('/settings/ai')
  }, [navigate])

  const onSetTargetBand = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
    try { sessionStorage.setItem('ai-tutor-pending-message', 'I want to set my IELTS target band.') } catch {}
  }, [])

  const onSetExamDate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
    try { sessionStorage.setItem('ai-tutor-pending-message', 'I want to set my IELTS exam date.') } catch {}
  }, [])

  return {
    session,
    profile,
    progressReview,
    feedbackSummary,
    adviceItems,
    recentActivities,
    isAiConfigured,
    loading,
    refreshing,
    onRefresh,
    onStartSession,
    onViewDetails,
    onStartLesson,
    onReviewMistakes,
    onPracticeVocabulary,
    onUpdateStudyPlan,
    onAdviceAction,
    onAskTutor,
    onConfigureAi,
    onSetTargetBand,
    onSetExamDate,
  }
}
