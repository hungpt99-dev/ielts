import { useState, useEffect, useCallback, useRef } from 'react'
import { ChatPopup } from '@ielts/ai-tutor-engine'
import type { ContextSuggestion } from '@ielts/ai-tutor-engine'
import { loadAppSettings } from '../../../services/storage/SettingsStorage'
import { callAI } from '@ielts/ai'
import { DatabaseService } from '../../../services/storage/Database'
import type { TaskEntry, VocabularyEntry, MistakeEntry } from '../../../models'

interface AITutorPopupProps {
  isOpen: boolean
  onClose: () => void
  hasAiKey?: boolean
  onOpenSettings?: () => void
  initialContext?: string
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getMotivationalTip(): string {
  const tips = [
    'Consistency beats intensity. Study a little every day, and you will see real progress.',
    'Focus on your weakest skill first. That is where you gain the most bands.',
    'Review vocabulary in context, not in isolation. Read articles and note useful words.',
    'Practice speaking out loud, even if you are alone. Your mouth needs practice too.',
    'Mistakes are proof that you are trying. Each error teaches you something valuable.',
    'Twenty minutes of focused practice beats two hours of distraction every time.',
    'Your IELTS journey is a marathon, not a sprint. Enjoy the process.',
  ]
  return tips[Math.floor(Math.random() * tips.length)]
}

function getExamCountdown(examDate: string): number {
  if (!examDate) return 0
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  if (isNaN(exam.getTime())) return 0
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  return Math.max(0, Math.floor((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(tasks: TaskEntry[]): number {
  let streak = 0
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const doneDates = new Set(tasks.filter(t => t.isDone && t.completedAt).map(t => t.completedAt!.slice(0, 10)))
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    if (doneDates.has(d.toISOString().slice(0, 10))) streak++; else break
  }
  return streak
}

export default function AITutorPopup({
  isOpen,
  onClose,
  hasAiKey,
  onOpenSettings,
  initialContext,
}: AITutorPopupProps) {
  const [contextSuggestions, setContextSuggestions] = useState<ContextSuggestion[]>([])
  const [greeting, setGreeting] = useState('')
  const [bandInfo, setBandInfo] = useState('IELTS Coach')
  const [voiceInput, setVoiceInput] = useState<string | undefined>(undefined)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return

    let pendingMessage: string | null = null
    try {
      pendingMessage = sessionStorage.getItem('ai-tutor-pending-message')
      if (pendingMessage) sessionStorage.removeItem('ai-tutor-pending-message')
    } catch {}

    if (pendingMessage) setVoiceInput(pendingMessage)
    if (loadingRef.current) return
    loadingRef.current = true
    let cancelled = false

    ;(async () => {
      try {
        const settings = loadAppSettings()
        const [tasks, vocabulary, mistakes] = await Promise.all([
          DatabaseService.getAll<TaskEntry>('tasks'),
          DatabaseService.getAll<VocabularyEntry>('vocabulary'),
          DatabaseService.getAll<MistakeEntry>('mistakes'),
        ])

        if (cancelled) return

        const todayStr = getTodayStr()
        const todayUnfinished = tasks.filter(t => t.date.slice(0, 10) === todayStr && !t.isDone).length
        const streak = computeStreak(tasks)
        const examCountdown = getExamCountdown(settings?.examDate || '')
        const dueReviews = vocabulary.filter(v => v.nextReviewAt && v.nextReviewAt <= todayStr).length
        const weakSkills = (settings?.weakSkills || []) as string[]
        const currentBand = settings?.currentBand || 0
        const targetBand = settings?.targetBand || 0
        const userName = settings?.userName || 'IELTS Learner'
        const timeGreeting = getTimeBasedGreeting()
        const bandInfoStr = currentBand > 0 ? `Band ${currentBand} → ${targetBand}` : 'IELTS Coach'

        setGreeting(`${timeGreeting}, ${userName}`)
        setBandInfo(bandInfoStr)

        const suggestions: ContextSuggestion[] = []

        if (initialContext) {
          suggestions.push({
            title: `Context: ${initialContext}`,
            message: "Let's continue where you left off.",
            action: 'teach-me',
            actionLabel: 'Continue',
          })
        }

        const motivationalMsg = examCountdown > 0
          ? examCountdown <= 7
            ? `Your IELTS exam is in ${examCountdown} days! Focus on mock tests and reviewing your weak areas.`
            : `You have ${examCountdown} days until your IELTS exam. Stay consistent with your study plan.`
          : getMotivationalTip()

        suggestions.push({
          title: `${timeGreeting}, ${userName}`,
          message: motivationalMsg,
          action: 'teach-me',
          actionLabel: 'What should I study?',
        })

        if (todayUnfinished > 0) {
          suggestions.push({
            title: 'Unfinished tasks',
            message: `You have ${todayUnfinished} task${todayUnfinished > 1 ? 's' : ''} waiting. Completing them keeps your roadmap on track.`,
            action: 'teach-me',
            actionLabel: 'View tasks',
          })
        }

        if (dueReviews > 0) {
          suggestions.push({
            title: 'Vocabulary review due',
            message: `You have ${dueReviews} words waiting for review. A quick session keeps your vocabulary fresh.`,
            action: 'quiz-me',
            actionLabel: `Review ${dueReviews} words`,
          })
        }

        if (weakSkills.length > 0) {
          suggestions.push({
            title: 'Weak skill reminder',
            message: `Your weak ${weakSkills.length > 1 ? 'skills are' : 'skill is'} ${weakSkills.join(' and ')}. Focused practice will improve your band score.`,
            action: 'practice-with-me',
            actionLabel: 'Practice now',
          })
        }

        if (streak > 0 && streak % 7 === 0) {
          suggestions.push({
            title: 'Streak milestone',
            message: `Amazing — ${streak} days in a row! Consistency is the most important factor in IELTS success.`,
            action: 'teach-me',
            actionLabel: 'Keep going!',
          })
        }

        const unresolvedMistakes = mistakes.filter(m => m.status !== 'resolved').length
        if (unresolvedMistakes > 3) {
          suggestions.push({
            title: 'Mistakes to review',
            message: `You have ${unresolvedMistakes} unresolved mistakes. Reviewing them prevents repeated errors.`,
            action: 'correct-english',
            actionLabel: 'Review mistakes',
          })
        }

        setContextSuggestions(suggestions.slice(0, 4))
      } catch {
        const timeGreeting = getTimeBasedGreeting()
        setGreeting(`${timeGreeting}!`)
        setBandInfo('IELTS Coach')
        setContextSuggestions([
          {
            title: `${timeGreeting}! Welcome to IELTS Journey`,
            message: 'I am your AI Tutor. I can help you plan your study, review mistakes, build vocabulary, and keep you motivated. What would you like help with today?',
            action: 'teach-me',
            actionLabel: 'Get started',
          },
          {
            title: 'Quick tip for today',
            message: getMotivationalTip(),
            action: 'teach-me',
            actionLabel: 'Tell me more',
          },
        ])
      } finally {
        loadingRef.current = false
      }
    })()

    return () => { cancelled = true }
  }, [isOpen, initialContext])

  const handleSendMessage = useCallback(async (text: string): Promise<string> => {
    try {
      const settings = loadAppSettings()
      if (!settings?.aiApiKey) return "I am here to help with your IELTS journey! Ask me about what to study today, your weak skills, or anything IELTS-related."

      const { content, error } = await callAI(
        'You are an expert IELTS tutor assistant. Keep responses under 150 words. Be practical, actionable, and friendly.',
        text,
        { temperature: 0.7, maxTokens: 300 },
      )
      if (!error && content) return content
    } catch {}
    return "I am here to help with your IELTS journey! Ask me about what to study today, your weak skills, exam countdown, mistake review, vocabulary exercises, or anything else. What can I help with?"
  }, [])

  return (
    <ChatPopup
      isOpen={isOpen}
      onClose={onClose}
      hasAiKey={hasAiKey}
      onOpenSettings={onOpenSettings}
      onSendMessage={handleSendMessage}
      contextSuggestions={contextSuggestions.length > 0 ? contextSuggestions : undefined}
      title={greeting || 'AI Tutor'}
      subtitle={bandInfo}
      placeholder="Ask me anything about IELTS..."
      voiceInput={voiceInput}
    />
  )
}
