import type { ChatMessage } from '../types'
import { formatMessageTime } from '../hooks/useProactiveMessages'

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className="flex w-full"
      style={{
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animation: 'chat-message-in 0.25s ease-out',
      }}
    >
      {!isUser && (
        <div
          className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
          aria-hidden="true"
        >
          🤖
        </div>
      )}

      <div
        className="flex max-w-[80%] flex-col"
        style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}
      >
        <div
          className="whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={
            isUser
              ? {
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  borderBottomRightRadius: '4px',
                }
              : {
                  backgroundColor: 'var(--color-surface-alt)',
                  color: 'var(--color-text)',
                  borderBottomLeftRadius: '4px',
                }
          }
        >
          {message.content}
        </div>
        <span className="mt-1 px-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
          {formatMessageTime(message.createdAt)}
        </span>
      </div>

      {isUser && (
        <div
          className="ml-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
          aria-hidden="true"
        >
          👤
        </div>
      )}
    </div>
  )
}
