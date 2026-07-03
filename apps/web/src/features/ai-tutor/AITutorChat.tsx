import { useState, useEffect, useCallback, useRef } from 'react'
import type { ContextSuggestion } from '@ielts/ai-tutor'
import { ChatPopup } from '@ielts/ai-tutor'
import { aiTutorService } from './aiTutorService'
import type { PersonalizationContext } from '../personalization/types'
import type { TutorDailyBriefing } from './aiTutorService'

interface AITutorChatProps {
  isOpen: boolean
  onClose: () => void
  hasAiKey?: boolean
  onOpenSettings?: () => void
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function AITutorChat({ isOpen, onClose, hasAiKey, onOpenSettings }: AITutorChatProps) {
  const [context, setContext] = useState<PersonalizationContext | null>(null)
  const [briefing, setBriefing] = useState<TutorDailyBriefing | null>(null)
  const [contextSuggestions, setContextSuggestions] = useState<ContextSuggestion[]>([])
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!isOpen || loadingRef.current) return
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

        const suggestions: ContextSuggestion[] = []

        if (b.whyTodayMatters) {
          suggestions.push({
            title: 'Why today matters',
            message: b.whyTodayMatters,
            actionLabel: 'Show me what to do',
          })
        }

        if (b.weakSkillReminder) {
          suggestions.push({
            title: 'Weak skill reminder',
            message: b.weakSkillReminder,
            actionLabel: 'Practice now',
          })
        }

        if (b.suggestedTasks.length > 0) {
          const task = b.suggestedTasks[0]
          suggestions.push({
            title: task.title,
            message: task.contextExplanation,
            actionLabel: task.actionLabel,
          })
        }

        if (b.examCountdownMessage) {
          suggestions.push({
            title: 'Exam countdown',
            message: b.examCountdownMessage,
            actionLabel: 'View plan',
          })
        }

        setContextSuggestions(suggestions.slice(0, 3))
      } catch {
        setContextSuggestions([
          {
            title: 'Welcome to IELTS Journey',
            message: "I'm your AI Tutor. Ask me anything about your IELTS preparation, or use the quick actions below to get started.",
            actionLabel: 'Get started',
          },
        ])
      } finally {
        loadingRef.current = false
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  const handleSendMessage = useCallback(async (text: string): Promise<string> => {
    const ctx = context ?? await aiTutorService.buildContext()
    const response = await aiTutorService.answerQuestion(text, ctx)
    if (response) return response
    return "I'm here to help with your IELTS journey! You can ask me:\n\n• What should I study today?\n• What are my weak skills?\n• How many days until my exam?\n• Review my mistakes\n• Create vocabulary exercises\n• Motivate me!\n\nWhat would you like help with?"
  }, [context])

  const handleQuickAction = useCallback((action: string) => {
    if (action === 'practice-with-me') {
      window.dispatchEvent(new CustomEvent('toggle-ai-tutor-chat'))
      window.location.hash = '#/dashboard'
    }
  }, [])

  const subtitle = context
    ? `Band ${context.profile.currentBand} → ${context.profile.targetBand}`
    : 'IELTS Coach'

  return (
    <ChatPopup
      isOpen={isOpen}
      onClose={onClose}
      hasAiKey={hasAiKey}
      onOpenSettings={onOpenSettings}
      onSendMessage={handleSendMessage}
      onQuickAction={handleQuickAction}
      contextSuggestions={contextSuggestions.length > 0 ? contextSuggestions : undefined}
      title="AI Tutor"
      subtitle={subtitle}
    />
  )
}
