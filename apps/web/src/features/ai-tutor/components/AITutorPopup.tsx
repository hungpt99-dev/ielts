import { useState, useEffect, useCallback, useRef } from 'react'
import { ChatPopup } from '@ielts/ai-tutor'
import type { ContextSuggestion } from '@ielts/ai-tutor'
import { aiTutorService } from '../aiTutorService'
import type { PersonalizationContext } from '../../personalization/types'
import type { TutorDailyBriefing } from '../aiTutorService'

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
    'Read actively — underline key points, summarize paragraphs, question the author.',
    'Mistakes are proof that you are trying. Each error teaches you something valuable.',
    'Twenty minutes of focused practice beats two hours of distraction every time.',
    'Your IELTS journey is a marathon, not a sprint. Enjoy the process.',
  ]
  return tips[Math.floor(Math.random() * tips.length)]
}

export default function AITutorPopup({
  isOpen,
  onClose,
  hasAiKey,
  onOpenSettings,
  initialContext,
}: AITutorPopupProps) {
  const [context, setContext] = useState<PersonalizationContext | null>(null)
  const [briefing, setBriefing] = useState<TutorDailyBriefing | null>(null)
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
    } catch {
      // storage not available
    }

    if (pendingMessage) {
      setVoiceInput(pendingMessage)
    }

    if (loadingRef.current) return
    loadingRef.current = true
    let cancelled = false

    ;(async () => {
      try {
        const ctx = await aiTutorService.buildContext()
        if (cancelled) return
        setContext(ctx)

        const b = await aiTutorService.getDailyBriefing(ctx)
        if (cancelled) return
        setBriefing(b)

        const timeGreeting = getTimeBasedGreeting()
        const name = ctx.userName || 'IELTS Learner'
        const bandInfoStr = `Band ${ctx.profile.currentBand} → ${ctx.profile.targetBand}`
        setBandInfo(bandInfoStr)

        const suggestions: ContextSuggestion[] = []
        setGreeting(`${timeGreeting}, ${name}`)

        if (initialContext) {
          suggestions.push({
            title: `Context: ${initialContext}`,
            message: `I remember you were working on this. Let's continue where you left off.`,
            action: 'teach-me',
            actionLabel: 'Continue',
          })
        }

        suggestions.push({
          title: `${timeGreeting}, ${name}`,
          message: `You are at ${bandInfoStr}. ${
            b.whyTodayMatters || b.examCountdownMessage || getMotivationalTip()
          }`,
          action: 'teach-me',
          actionLabel: 'What should I study?',
        })

        if (b.whyTodayMatters) {
          suggestions.push({
            title: 'Why today matters',
            message: b.whyTodayMatters,
            action: 'teach-me',
            actionLabel: 'Show me what to do',
          })
        }

        if (b.weakSkillReminder) {
          suggestions.push({
            title: 'Weak skill reminder',
            message: b.weakSkillReminder,
            action: 'practice-with-me',
            actionLabel: 'Practice now',
          })
        }

        if (b.suggestedTasks.length > 0) {
          const task = b.suggestedTasks[0]
          suggestions.push({
            title: task.title,
            message: task.contextExplanation,
            action: 'teach-me',
            actionLabel: task.actionLabel,
          })
        }

        if (ctx.profile.dueReviews && ctx.profile.dueReviews > 0) {
          suggestions.push({
            title: 'Vocabulary review due',
            message: `You have ${ctx.profile.dueReviews} words waiting for review. A quick review session keeps your vocabulary fresh.`,
            action: 'quiz-me',
            actionLabel: `Review ${ctx.profile.dueReviews} words`,
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
            message: `I am your AI Tutor. I can help you plan your study, review mistakes, build vocabulary, and keep you motivated. What would you like help with today?`,
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

    return () => {
      cancelled = true
    }
  }, [isOpen, initialContext])

  const handleSendMessage = useCallback(async (text: string): Promise<string> => {
    const ctx = context ?? await aiTutorService.buildContext()
    const response = await aiTutorService.answerQuestion(text, ctx)
    if (response) return response
    return "I am here to help with your IELTS journey! Ask me about what to study today, your weak skills, exam countdown, mistake review, vocabulary exercises, or anything else. What can I help with?"
  }, [context])

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
