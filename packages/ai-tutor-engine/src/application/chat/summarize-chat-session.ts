import type { TutorChatMessage } from '../../domain/entities/tutor-message'

export interface SessionSummary {
  sessionId: string
  messageCount: number
  topics: string[]
  duration: string
  keyPoints: string[]
}

export function summarizeChatSession(
  sessionId: string,
  messages: TutorChatMessage[],
): SessionSummary {
  const assistantMessages = messages.filter(m => m.role === 'assistant')

  const firstMessage = messages[0]
  const lastMessage = messages[messages.length - 1]

  const topics = extractTopics(messages)

  return {
    sessionId,
    messageCount: messages.length,
    topics,
    duration: calculateDuration(firstMessage?.createdAt, lastMessage?.createdAt),
    keyPoints: assistantMessages
      .filter(m => m.recommendations && m.recommendations.length > 0)
      .flatMap(m => m.recommendations!.map(r => r.title))
      .slice(0, 5),
  }
}

function extractTopics(messages: TutorChatMessage[]): string[] {
  const topicKeywords = ['writing', 'speaking', 'reading', 'listening', 'vocabulary', 'grammar', 'ielts', 'exam']
  const found = new Set<string>()

  for (const msg of messages) {
    const lower = msg.content.toLowerCase()
    for (const keyword of topicKeywords) {
      if (lower.includes(keyword)) found.add(keyword)
    }
  }

  return Array.from(found)
}

function calculateDuration(start?: string, end?: string): string {
  if (!start || !end) return 'unknown'
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
}
