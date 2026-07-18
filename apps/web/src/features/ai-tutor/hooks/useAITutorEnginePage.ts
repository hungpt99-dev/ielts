import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { initializeAITutorEngine } from '../../../services/engineBootstrap'
import { taskRepo, vocabularyRepo, mistakeRepo } from '../../../services/repositories'
import { ROUTES, STORAGE_KEYS } from '@ielts/config'

import type { TaskEntry, VocabularyEntry, MistakeEntry } from '../../../models'
import type { ProgressReview } from '../components/TeacherProgressReviewCard'
import type { TutorSession, LearningProfile, FeedbackSummary, TeacherAdviceItem, ActivityItem } from '../types/aiTutor.types'

function computeSkillBreakdown(tasks: TaskEntry[], mistakes: MistakeEntry[], weakSkillsList: string[]): ProgressReview['skillBreakdown'] {
  const skillSet = ['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary'] as const
  const now = new Date()
  return skillSet.map(skill => {
    const skillTasks = tasks.filter(t => t.category?.toLowerCase() === skill)
    const doneTasks = skillTasks.filter(t => t.isDone)
    const taskCount = skillTasks.length
    const accuracy = taskCount > 0 ? Math.round((doneTasks.length / taskCount) * 100) : 0
    const mistakeCount = mistakes.filter(m => m.skill?.toLowerCase() === skill).length
    const lastDone = doneTasks.length > 0
      ? doneTasks.filter(t => t.completedAt).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0]
      : null
    const daysSincePractice = lastDone?.completedAt
      ? Math.floor((now.getTime() - new Date(lastDone.completedAt).getTime()) / 86400000)
      : 999
    const doneDates = doneTasks.filter(t => t.completedAt).map(t => t.completedAt!.slice(0, 10))
    const uniqueDays = [...new Set(doneDates)].sort()
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (uniqueDays.length >= 4) {
      const half = Math.floor(uniqueDays.length / 2)
      const recentCount = uniqueDays.slice(half).length
      const earlyCount = half
      if (recentCount > earlyCount + 1) trend = 'improving'
      else if (recentCount < earlyCount - 1) trend = 'declining'
    }
    return {
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      accuracy,
      mistakeCount,
      trend,
      daysSincePractice: Math.min(daysSincePractice, 999),
      taskCount,
      isWeak: weakSkillsList.some(w => w.toLowerCase() === skill),
    }
  })
}

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
    reading: ROUTES.reading,
    listening: ROUTES.listening,
    writing: ROUTES.writing,
    speaking: ROUTES.speaking,
    vocabulary: ROUTES.vocabulary,
    grammar: ROUTES.grammar,
  }
  return map[skill.toLowerCase()] ?? ROUTES.dashboard
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

const INITIAL_REVIEW: ProgressReview = {
  summary: 'Keep up the good work!', improvements: [], struggles: [], focusAreas: ['Start your first lesson to get personalized recommendations'],
  streak: 0, weeklyCompletion: 0, totalStudyHours: 0, mistakesReviewed: 0, vocabLearned: 0, weakSkills: [],
  examCountdown: 0, skillBreakdown: [], weeklyTasksDone: 0, weeklyTasksTotal: 0, vocabDueReview: 0,
  vocabMastered: 0, mistakesUnresolved: 0, mistakesRecent: 0, todayUnfinished: 0, isExamUrgent: false,
  skillProgress: [], studyPlanAdherence: '', tutorFeedback: '', generatedAt: null,
}

export function useAITutorEnginePage(): AITutorPageState {
  const navigate = useNavigate()
  const mountedRef = useRef(true)
  const forceRefreshRef = useRef(false)

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
  const [progressReview, setProgressReview] = useState<ProgressReview>(INITIAL_REVIEW)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const isAiConfigured = (() => {
    try {
      const storedKey = localStorage.getItem(`${STORAGE_KEYS.localStorage.apiKeyPrefix}openai`)
      if (storedKey) return true
      const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      if (!raw) return false
      const cfg = JSON.parse(raw)
      return !!(cfg.aiApiKey || cfg.ai?.apiKey)
    } catch (error) {
 console.error('apps/web/src/features/ai-tutor/hooks/useAITutorEnginePage.ts error:', error);
 return false }
  })()

  const loadData = useCallback(async () => {
    try {
      const settings = (() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
          return raw ? JSON.parse(raw) : {}
        } catch { return {} }
      })()
      const [tasks, vocabulary, mistakes] = await Promise.all([
        taskRepo.findAll(),
        vocabularyRepo.findAll(),
        mistakeRepo.findAll(),
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
      const examDate = settings?.study?.examDate || settings?.examDate || ''
      const examCountdown = getExamCountdown(examDate)
      const isExamUrgent = examCountdown > 0 && examCountdown <= 14
      const weakSkillsList = (settings?.study?.weakSkills || settings?.weakSkills || []) as string[]
      const weakSkills = weakSkillsList.join(', ') || 'None identified'
      const currentBand = settings?.study?.currentBand || settings?.currentBand || 0
      const targetBandNum = settings?.study?.targetBand || settings?.targetBand || 0
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
        dailyStudyMinutes: settings?.study?.dailyStudyMinutes || settings?.dailyStudyMinutes || 30,
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
        skillBreakdown: computeSkillBreakdown(tasks, mistakes, weakSkillsList),
      }))

      const engine = await initializeAITutorEngine()
      if (engine) {
        try {
          const [nextAction, progressResult] = await Promise.all([
            engine.getNextBestAction({}),
            engine.generateProgressReview({ forceRegenerate: forceRefreshRef.current }),
          ])
          forceRefreshRef.current = false

          if (mountedRef.current) {
            setProgressReview(prev => {
              const updates: Partial<ProgressReview> = {}

              if (nextAction.status === 'success' && nextAction.data) {
                updates.focusAreas = [nextAction.data.reason]
              }

              if (progressResult.status === 'success' && progressResult.data) {
                const d = progressResult.data
                updates.summary = d.summary
                updates.improvements = d.improvements.map(i => `${i.area}: ${i.evidence}`)
                updates.struggles = d.weaknesses.map(w => `${w.area}: ${w.evidence}`)
                if (!updates.focusAreas) {
                  updates.focusAreas = [d.recommendedFocus]
                }
                const skillTasksMap = tasks.reduce((acc, t) => {
                  const s = (t.category ?? '').toLowerCase()
                  if (!acc[s]) acc[s] = { total: 0, done: 0 }
                  acc[s].total++
                  if (t.isDone) acc[s].done++
                  return acc
                }, {} as Record<string, { total: number; done: number }>)
                const doneTasksArr = tasks.filter(t => t.isDone)
                updates.skillProgress = d.skillPriorityChanges.map(spc => {
                  const skillLower = spc.skill.toLowerCase()
                  const st = skillTasksMap[skillLower]
                  const sessions = st?.done ?? 0
                  const accuracy = st && st.total > 0 ? Math.round((st.done / st.total) * 100) : 0
                  const mistakeCount = mistakes.filter(m => (m.skill ?? '').toLowerCase() === skillLower).length
                  let status = 'stable'
                  if (spc.reason.includes('gap')) status = 'needs work'
                  if (mistakeCount > 5) status = 'needs work'
                  if (accuracy >= 80 && sessions > 0) status = 'improving'
                  let trend: 'improving' | 'declining' | 'stable' = 'stable'
                  if (spc.reason.includes('improving')) trend = 'improving'
                  else if (spc.reason.includes('declining')) trend = 'declining'
                  else if (accuracy >= 80) trend = 'improving'
                  else if (mistakeCount > 10) trend = 'declining'
                  const analysis = mistakeCount > 0 && sessions > 0
                    ? `${spc.reason} — ${sessions} sessions, ${mistakeCount} mistakes`
                    : sessions > 0
                      ? `${spc.reason} — ${sessions} sessions completed`
                      : spc.reason
                  return {
                    skill: skillLower.charAt(0).toUpperCase() + skillLower.slice(1),
                    status,
                    sessions,
                    accuracy,
                    trend,
                    analysis,
                  }
                })
                updates.studyPlanAdherence =
                  `Weekly completion: ${d.studyConsistency.weeklyCompletionRate}% | ` +
                  `Streak: ${d.studyConsistency.streakDays}d | ` +
                  `Inactive: ${d.studyConsistency.inactiveDays}d`
                if (d.examRisk) {
                  updates.tutorFeedback = d.examRisk
                }
                updates.generatedAt = d.generatedAt
              }

              return { ...prev, ...updates }
            })
          }
        } catch (error) {
    console.error('apps/web/src/features/ai-tutor/hooks/useAITutorEnginePage.ts error:', error);
        }
      }
    } catch (error) {
      console.error('apps/web/src/features/ai-tutor/hooks/useAITutorEnginePage.ts error:', error);
      /* use defaults */
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadData()
    return () => { mountedRef.current = false }
  }, [loadData])

  const onRefresh = useCallback(() => {
    forceRefreshRef.current = true
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
    onReviewMistakes: useCallback(() => recordAndNavigate(ROUTES.mistakes), [recordAndNavigate]),
    onPracticeVocabulary: useCallback(() => recordAndNavigate(ROUTES.vocabulary), [recordAndNavigate]),
    onUpdateStudyPlan: useCallback(() => recordAndNavigate(ROUTES.roadmap), [recordAndNavigate]),
    onAdviceAction: useCallback((key: string) => {
      const actionMap: Record<string, string> = {
        'complete-tasks': '/today-plan', 'review-grammar': ROUTES.grammar, 'vocabulary-review': ROUTES.vocabulary,
        'practice-vocabulary': ROUTES.vocabulary, 'speaking-warmup': ROUTES.speaking, speaking: ROUTES.speaking,
        'mock-test-prep': ROUTES.mockTests, 'start-learning': ROUTES.dashboard, 'review-mistakes': ROUTES.mistakes,
      }
      navigate(actionMap[key] ?? '/today-plan')
    }, [navigate]),
    onAskTutor: useCallback((message: string) => {
      if (!isAiConfigured) return
      try { sessionStorage.setItem(STORAGE_KEYS.sessionStorage.aiTutorPendingMessage, message) } catch (error) {
      console.error('apps/web/src/features/ai-tutor/hooks/useAITutorEnginePage.ts error:', error);
      }
      window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
    }, [isAiConfigured]),
    onConfigureAi: useCallback(() => navigate(ROUTES.settingsAi), [navigate]),
    onSetTargetBand: useCallback(() => {
      window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
      try { sessionStorage.setItem(STORAGE_KEYS.sessionStorage.aiTutorPendingMessage, 'I want to set my IELTS target band.') } catch (error) {
    console.error('apps/web/src/features/ai-tutor/hooks/useAITutorEnginePage.ts error:', error);
      }
    }, []),
    onSetExamDate: useCallback(() => {
      window.dispatchEvent(new CustomEvent('open-ai-tutor-chat'))
      try { sessionStorage.setItem(STORAGE_KEYS.sessionStorage.aiTutorPendingMessage, 'I want to set my IELTS exam date.') } catch (error) {
    console.error('apps/web/src/features/ai-tutor/hooks/useAITutorEnginePage.ts error:', error);
      }
    }, []),
  }
}
