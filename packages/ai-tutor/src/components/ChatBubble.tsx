import type { ChatMessage } from '../types'
import { formatMessageTime } from '../hooks/useProactiveMessages'
import { TutorAvatar } from './TutorAvatar'
import { IconEdit, IconCopy, IconThumbsUp, IconThumbsDown, IconUser } from '../../../ui/src/icons/IconMap'

interface ChatBubbleProps {
  message: ChatMessage
  showActionBar?: boolean
  onSaveNote?: (content: string) => void
  onCopy?: (content: string) => void
  onRate?: (id: string, rating: 'up' | 'down') => void
}

export function ChatBubble({
  message,
  showActionBar = false,
  onSaveNote,
  onCopy,
  onRate,
}: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className="flex w-full gap-2"
      style={{
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animation: 'chat-message-in 0.25s ease-out',
      }}
    >
      {!isUser && (
        <div className="mt-1 shrink-0">
          <TutorAvatar size={32} />
        </div>
      )}

      <div
        className="flex max-w-[80%] flex-col sm:max-w-[70%]"
        style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}
      >
        <div
          className="whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed"
          style={
            isUser
              ? {
                  backgroundColor: 'var(--color-tutor-userBubble)',
                  color: 'var(--color-tutor-userText)',
                  borderRadius: '18px 18px 4px 18px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }
              : {
                  backgroundColor: 'var(--color-tutor-background)',
                  color: 'var(--color-tutor-text)',
                  borderRadius: '18px 18px 18px 4px',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }
          }
        >
          {message.content}
        </div>

        <div
          className="mt-1 flex items-center gap-2 px-1"
          style={{ color: 'var(--color-muted)' }}
        >
          <span className="text-[10px]">
            {formatMessageTime(message.createdAt)}
          </span>

          {!isUser && showActionBar && (
            <div className="flex items-center gap-0.5">
              {onSaveNote && (
                <button
                  onClick={() => onSaveNote(message.content)}
                  className="flex h-6 w-6 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-muted)' }}
                  aria-label="Save as note"
                  title="Save as note"
                >
                  <IconEdit size={12} />
                </button>
              )}
              {onCopy && (
                <button
                  onClick={() => onCopy(message.content)}
                  className="flex h-6 w-6 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-muted)' }}
                  aria-label="Copy message"
                  title="Copy"
                >
                  <IconCopy size={12} />
                </button>
              )}
              {onRate && (
                <div className="ml-1 flex items-center gap-0.5 border-l pl-1.5" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => onRate(message.id, 'up')}
                    className="flex h-6 w-6 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-muted)' }}
                    aria-label="Rate as helpful"
                    title="Helpful"
                  >
                    <IconThumbsUp size={12} />
                  </button>
                  <button
                    onClick={() => onRate(message.id, 'down')}
                    className="flex h-6 w-6 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-muted)' }}
                    aria-label="Rate as not helpful"
                    title="Not helpful"
                  >
                    <IconThumbsDown size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}
          aria-hidden="true"
        >
          <IconUser size={16} color="var(--color-tutor-accent)" strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}
