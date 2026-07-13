import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAITutorEngine } from '../../../services/engineBootstrap'
import { DatabaseService } from '../../../services/storage/Database'
import { loadAppSettings } from '../../../services/storage/SettingsStorage'
import type { TaskEntry, VocabularyEntry, MistakeEntry } from '../../../models'
import type { ProgressReview } from '../components/TeacherProgressReviewCard'
import type { TutorSession, LearningProfile, FeedbackSummary, TeacherAdviceItem, ActivityItem } from '../types/aiTutor.types'

function computeStreak(tasks: TaskEntry[]): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const doneDates = new Set(
    tasks.filter(t => t.isDone && t.completedAt).map(t => t.completedAt!.slice(0, 10))
  )
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (doneDates.has(d.toISOString().slice(0, 10))) streak++
    else break
  }
  return streak
}

function getExamCountdown(examDate: string): number {
  if (!examDate) return 0
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  if (isNaN(exam.getTime())) return 0
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return Math.max(0, Math.floor((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
}

function getRouteForSkill(skill: string): string {
  const map: Record<string, string> = {
    reading: '/reading',
    listening: '/listening',
    writing: '/writing',
    speaking: '/speaking',
    vocabulary: '/vocabulary',
    grammar: '/grammar',
  }
  return map[skill.toLowerCase()] ?? '/dashboard'
}

const SKILL_NAMES = ['Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary', 'Grammar'] as const

const WEAK_SKILL_LESSONS: Record<string, { title: string; reason: string; estimatedTime: string }> = {
  Reading: { title: 'Reading Comprehension Practice', reason: 'Practice skimming, scanning, and understanding complex passages to improve your Reading score.', estimatedTime: '30 minutes' },
  Listening: { title: 'Listening for Key Information', reason: 'Train your ear to catch important details, signpost words, and speaker attitudes in IELTS Listening.', estimatedTime: '30 minutes' },
  Writing: { title: 'Writing Task Structure & Coherence', reason: 'Learn to structure your essays with clear introductions, body paragraphs, and conclusions.', estimatedTime: '45 minutes' },
  Speaking: { title: 'Speaking Fluency & Pronunciation', reason: 'Practice expressing ideas clearly, using varied vocabulary, and maintaining natural flow.', estimatedTime: '20 minutes' },
  Grammar: { title: 'Grammar Accuracy Review', reason: 'Master the most common grammar patterns tested in IELTS, including tenses and conditionals.', estimatedTime: '25 minutes' },
  Vocabulary: { title: 'Topic-Specific Vocabulary Building', reason: 'Expand your active vocabulary for common IELTS topics like environment, education, and technology.', estimatedTime: '20 minutes' },
}

function determineFocus(weakSkills: string[], todayUnfinished: number, dueReviews: number, mistakesDue: number, isUrgent: boolean): { focus: string; skill: string; focusArea: string } {
  if (isUrgent && weakSkills.length > 0) return { focus: 'Urgent Practice', skill: weakSkills[0], focusArea: weakSkills[0] }
  if (todayUnfinished > 0) return { focus: "Complete Today's Tasks", skill: weakSkills[0] || 'Reading', focusArea: weakSkills[0] || 'Reading' }
  if (dueReviews > 5) return { focus: 'Vocabulary Review', skill: 'Vocabulary', focusArea: 'Vocabulary' }
  if (mistakesDue > 3) return { focus: 'Mistake Review', skill: 'Grammar', focusArea: 'Mistakes' }
  if (weakSkills.length > 0) return { focus: `Improve ${weakSkills[0]}`, skill: weakSkills[0], focusArea: weakSkills[0] }
  return { focus: 'Daily Practice', skill: 'Reading', focusArea: 'Reading' }
}

export function useAITutorEnginePage(): AITutorPageState {
  const navigate = useNavigate()
  const mountedRef = useRef(true)

  const [profile, setProfile] = useState<LearningProfile>({
    targetBand: '', currentBand: 0, targetBandNum: 0, examDate: '', examCountdown: 0,
    weakSkills: '', weakSkillsList: [], todayFocus: '', savedWords: 0, mistakesToReview: 0,
    studyStreak: 0, weeklyTasksDone: 0, weeklyTasksTotal: 0, totalStudyHours: 0,
    roadmapProgress: 0, dailyStudyMinutes: 0, vocabMastered: 0, vocabDueReview: 0, loading: true,
  })
  const [session, setSession] = useState<TutorSession>({
    focus: 'Getting Started', lessonTitle: 'Welcome to Your IELTS Journey',
    reason: 'Set up your target band, exam date, and study preferences so your AI Tutor can prepare personalized lessons for you.',
    estimatedTime: '10 minutes', skill: 'Getting Started', focusArea: 'Setup',
  })
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary>({
    mainWeakness: 'Not enough data yet', mostCommonIssue: 'Keep studying to get personalized insights',
    recommendedNextStep: "Start Today's Lesson", streak: 0, examCountdown: 0, isExamUrgent: false,
  })
  const [adviceItems, setAdviceItems] = useState<TeacherAdviceItem[]>([])
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([])
  const [progressReview, setProgressReview] = useState<ProgressReview>({
    summary: 'Keep up the good work!', improvements: [], struggles: [], focusAreas: ['Start your first lesson to get personalized recommendations'],
    streak: 0, weeklyCompletion: 0, totalStudyHours: 0, mistakesReviewed: 0, vocabLearned: 0, weakSkills: [],
    examCountdown: 0, skillBreakdown: [], weeklyTasksDone: 0, weeklyTasksTotal: 0, vocabDueReview: 0,
    vocabMastered: 0, mistakesUnresolved: 0, mistakesRecent: 0, todayUnfinished: 0, isExamUrgent: false,
    skillProgress: [], studyPlanAdherence: '', tutorFeedback: '', generatedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const isAiConfigured = (() => {
    try {
      const raw = localStorage.getItem('ielts-settings')
      return raw ? !!JSON.parse(raw).aiApiKey : false
    } catch { return false }
  })()

  const loadData = useCallback(async () => {
    try {
      const settings = loadAppSettings()
      const [tasks, vocabulary, mistakes] = await Promise.all([
        DatabaseService.getAll<TaskEntry>('tasks'),
        DatabaseService.getAll<VocabularyEntry>('vocabulary'),
        DatabaseService.getAll<MistakeEntry>('mistakes'),
      ])

      const todayStr = new Date().toISOString().slice(0, 10)
      const todayTasks = tasks.filter(t => t.date.slice(0, 10) === todayStr)
      const todayUnfinished = todayTasks.filter(t => !t.isDone).length
      const completedTasks = tasks.filter(t => t.isDone)
      const weeklyTasksDone = completedTasks.filter(t => {
        const d = new Date(t.completedAt!)
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
        return d >= weekStart
      }).length
      const streak = computeStreak(tasks)
      const examDate = settings?.examDate || ''
      const examCountdown = getExamCountdown(examDate)
      const isExamUrgent = examCountdown > 0 && examCountdown <= 14
      const weakSkillsList = (settings?.weakSkills || []) as string[]
      const weakSkills = weakSkillsList.join(', ') || 'None identified'
      const currentBand = settings?.currentBand || 0
      const targetBandNum = settings?.targetBand || 0
      const monthlyMinutes = tasks.reduce((s, t) => s + (t.timeMinutes || 0), 0)
      const dueReviews = vocabulary.filter(v => v.nextReviewAt && v.nextReviewAt <= todayStr).length
      const mistakesUnresolved = mistakes.filter(m => m.status !== 'resolved').length

      const focus = determineFocus(weakSkillsList, todayUnfinished, dueReviews, mistakesUnresolved, isExamUrgent)
      const lesson = WEAK_SKILL_LESSONS[focus.skill]

      setProfile({
        targetBand: currentBand > 0 ? `Band ${currentBand} → ${targetBandNum}` : '',
        currentBand, targetBandNum, examDate, examCountdown,
        weakSkills, weakSkillsList, todayFocus: focus.focus,
        savedWords: vocabulary.length, mistakesToReview: mistakesUnresolved,
        studyStreak: streak, weeklyTasksDone, weeklyTasksTotal: tasks.length,
        totalStudyHours: Math.round(monthlyMinutes / 60),
        roadmapProgress: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        dailyStudyMinutes: settings?.dailyStudyMinutes || 30,
        vocabMastered: vocabulary.filter(v => v.status === 'mastered').length,
        vocabDueReview: dueReviews, loading: false,
      })

      setSession({
        focus: focus.focus,
        lessonTitle: lesson?.title || 'Welcome to Your IELTS Journey',
        reason: lesson?.reason || 'Keep practicing to improve your skills.',
        estimatedTime: lesson?.estimatedTime || '20 minutes',
        skill: focus.skill,
        focusArea: focus.focusArea,
      })

      setFeedbackSummary({
        mainWeakness: weakSkillsList.length > 0
          ? (isExamUrgent ? `URGENT: ${weakSkillsList.join(', ')} need attention (exam in ${examCountdown}d)` : `Weak in ${weakSkillsList.join(', ')}`)
          : 'Keep studying to get personalized insights',
        mostCommonIssue: mistakesUnresolved > 0 ? `${mistakesUnresolved} unresolved mistakes` : 'No issues detected yet',
        recommendedNextStep: streak === 0 ? 'Start Your First Session' : dueReviews > 5 ? 'Review Vocabulary' : isExamUrgent ? 'Mock Test Prep' : "Start Today's Lesson",
        streak, examCountdown, isExamUrgent,
      })

      const items: TeacherAdviceItem[] = []
      if (todayUnfinished > 0) items.push({ key: 'complete-tasks', title: `Complete ${todayUnfinished} Task${todayUnfinished > 1 ? 's' : ''}`, description: 'You have unfinished tasks from today\'s plan.', iconName: 'target', actionLabel: 'Open Plan' })
      if (dueReviews > 0) items.push({ key: 'vocabulary-review', title: `Review ${dueReviews} Word${dueReviews > 1 ? 's' : ''}`, description: 'Due for spaced repetition review.', iconName: 'vocabulary', actionLabel: 'Review Now' })
      if (mistakesUnresolved > 0) items.push({ key: 'review-mistakes', title: `Review ${mistakesUnresolved} Mistake${mistakesUnresolved > 1 ? 's' : ''}`, description: 'Review your recent mistakes.', iconName: 'grammar', actionLabel: 'Review' })
      for (const skill of weakSkillsList) {
        const key = skill.toLowerCase()
        if (!items.some(i => i.key.includes(key))) items.push({ key: `practice-${key}`, title: `Practice ${skill}`, description: 'Marked as a weak area. Focused practice will improve your band score.', iconName: skill.toLowerCase() as any, actionLabel: `Practice ${skill}` })
      }
      if (isExamUrgent) items.push({ key: 'mock-test-prep', title: 'Mock Test Time', description: `Exam in ${examCountdown}d. Take a mock test to assess readiness.`, iconName: 'target', actionLabel: 'View Mock Tests' })
      if (vocabulary.length === 0 && mistakes.length === 0 && streak === 0) items.push({ key: 'start-learning', title: 'Start Your IELTS Journey', description: 'Begin with a lesson or practice exercise.', iconName: 'target', actionLabel: 'Get Started' })
      setAdviceItems(items)

      setProgressReview(prev => ({
        ...prev,
        streak, weeklyCompletion: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        totalStudyHours: Math.round(monthlyMinutes / 60), mistakesReviewed: mistakes.length,
        vocabLearned: vocabulary.length, weakSkills: weakSkillsList, examCountdown,
        weeklyTasksDone, weeklyTasksTotal: tasks.length,
        vocabDueReview: dueReviews, vocabMastered: vocabulary.filter(v => v.status === 'mastered').length,
        mistakesUnresolved, mistakesRecent: mistakes.filter(m => m.status !== 'resolved').length,
        todayUnfinished, isExamUrgent,
      }))

      const engine = getAITutorEngine()
      if (engine) {
        try {
          const nextAction = await engine.getNextBestAction({})
          if (nextAction.status === 'success' && nextAction.data && mountedRef.current) {
            setProgressReview(prev => ({
              ...prev,
              focusAreas: [nextAction.data!.reason || prev.focusAreas[0]],
            }))
          }
        } catch {}
      }
    } catch {
      /* use defaults */
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    return () => { mountedRef.current = false }
  }, [loadData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadData().finally(() => {
      if (mountedRef.current) setRefreshing(false)
    })
  }, [loadData])

  const recordAndNavigate = useCallback((route: string) => {
    navigate(route)
  }, [navigate])

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
    onStartSession: useCallback(() => recordAndNavigate(getRouteForSkill(session.skill)), [session.skill, recordAndNavigate]),
    onViewDetails: useCallback(() => navigate('/today-plan'), [navigate]),
    onStartLesson: useCallback(() => recordAndNavigate(getRouteForSkill(session.skill)), [session.skill, recordAndNavigate]),
    onReviewMistakes: useCallback(() => recordAndNavigate('/mistakes'), [recordAndNavigate]),
    onPracticeVocabulary: useCallback(() => recordAndNavigate('/vocabulary'), [recordAndNavigate]),
    onUpdateStudyPlan: useCallback(() => recordAndNavigate('/roadmap'), [recordAndNavigate]),
    onAdviceAction: useCallback((key: string) => {
      const actionMap: Record<string, string> = {
        'complete-tasks': '/today-plan', 'review-grammar': '/grammar', 'vocabulary-review': '/vocabulary',
        'practice-vocabulary': '/vocabulary', 'speaking-warmup': '/speaking', speaking: '/speaking',
        'mock-test-prep': '/mock-tests', 'start-learning': '/dashboard', 'review-mistakes': '/mistakes',
      }
      navigate(actionMap[key] ?? '/today-plan')
    }, [navigate]),
    onAskTutor: useCallback((message: string) => {
      if (!isAiConfigured) return
      try { sessionStorage.setItem('ai-tutor-pending-message', message) } catch {}
      window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
    }, [isAiConfigured]),
    onConfigureAi: useCallback(() => navigate('/settings/ai'), [navigate]),
    onSetTargetBand: useCallback(() => {
      window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
      try { sessionStorage.setItem('ai-tutor-pending-message', 'I want to set my IELTS target band.') } catch {}
    }, []),
    onSetExamDate: useCallback(() => {
      window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
      try { sessionStorage.setItem('ai-tutor-pending-message', 'I want to set my IELTS exam date.') } catch {}
    }, []),
  }
}
