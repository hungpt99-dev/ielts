import type { QuickAction } from '../types'

const GREETINGS = ['Good morning', 'Good afternoon', 'Good evening']

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return GREETINGS[0]
  if (hour < 18) return GREETINGS[1]
  return GREETINGS[2]
}

export function getWelcomeMessage(): string {
  const greeting = getTimeBasedGreeting()
  return `${greeting}! 👋 I'm your AI Tutor Assistant. I'm here to help with your IELTS journey — whether you need to practice, learn something new, or review mistakes. How can I help?`
}

export function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  )
}

const QUICK_RESPONSES: Record<string, string> = {
  'teach-me': "I'd be happy to teach you! What topic would you like to learn about? We can focus on vocabulary, grammar, writing, speaking, or anything IELTS-related.\n\n👉 Open the full tutor page for more options!",
  'quiz-me': "Great choice! Let me create a quick quiz for you. What skill would you like to practice? Vocabulary, grammar, or a specific IELTS topic?\n\n👉 Head to the full tutor for interactive quizzes!",
  'practice-with-me': "Let's practice! 🎯 Tell me what you'd like to work on:\n\n• Speaking — I'll ask IELTS questions\n• Writing — brainstorming or essay check\n• Reading — discuss a passage\n• Listening — work with a transcript\n\nOr open the full tutor page for guided practice!",
  'make-exercise': "Let me create an exercise for you! I can make:\n\n• Grammar exercises\n• Vocabulary quizzes\n• IELTS task practice\n\nWhat type would you like? Open the full tutor for interactive exercises!",
  'correct-english': "Sure! Show me a sentence you've written and I'll help fix it. I can explain grammar mistakes, suggest better vocabulary, and help you improve.\n\nShare your sentence and I'll review it! 📝",
  'remind-later': "I'll remind you later! ⏰ Your study reminder has been noted.\n\nYou can set reminders in Settings to get notified about daily vocabulary review, mistake review, and study plan check-ins.",
}

export function generateQuickResponse(action: string): string {
  return QUICK_RESPONSES[action] ?? "How can I help you with your IELTS journey today? 😊"
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { type: 'teach-me', label: 'Teach me this', icon: '📚' },
  { type: 'quiz-me', label: 'Quiz me', icon: '🧠' },
  { type: 'practice-with-me', label: 'Practice now', icon: '🎯' },
  { type: 'make-exercise', label: 'Generate exercise', icon: '✍️' },
  { type: 'correct-english', label: 'Explain my mistake', icon: '💡' },
  { type: 'remind-later', label: 'Remind me later', icon: '⏰' },
]

export const ACTION_LABELS: Record<string, string> = {
  'teach-me': 'Teach me this',
  'quiz-me': 'Quiz me',
  'practice-with-me': 'Practice now',
  'make-exercise': 'Generate exercise',
  'correct-english': 'Explain my mistake',
  'remind-later': 'Remind me later',
  'explain-simply': 'Explain simply',
  'give-examples': 'Give examples',
}
