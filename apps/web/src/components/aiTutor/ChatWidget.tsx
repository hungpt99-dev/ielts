import React, { useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ChatWidgetProps, ChatMessage, ContextSuggestion } from '@ielts/ai-tutor-engine'
import { MessageStorage } from '@ielts/ai-tutor-engine'
import { useChatWidget } from '../../hooks/useChatWidget'
import { ChatBubble } from './ChatBubble'
import { QuickActions } from './QuickActions'
import { NotificationCenter } from './NotificationCenter'
import { TutorAvatar } from './TutorAvatar'
import { MissingKeyBanner } from './MissingKeyBanner'
import { TypingIndicator } from './TypingIndicator'
import { WelcomeState } from './WelcomeState'
import { ChatStyles } from './ChatStyles'
import { useExitAnimation } from '../../hooks/useExitAnimation'
import { ContextSuggestionCard } from './ContextSuggestionCard'
import { IconBell, IconDelete, IconClose, IconSend } from '@ielts/ui'

const DEFAULT_QUICK_PROMPTS = [
  { label: 'Quiz me', action: 'quiz-me' },
  { label: 'Teach me', action: 'teach-me' },
  { label: 'Explain simply', action: 'explain-simply' },
  { label: 'Give examples', action: 'give-examples' },
  { label: 'Practice with me', action: 'practice-with-me' },
  { label: 'Correct my English', action: 'correct-english' },
]

export { ChatBubble } from './ChatBubble'
export { QuickActions } from './QuickActions'
export { ProactiveMessagePreview } from './ProactiveMessagePreview'
export { NotificationCenter } from './NotificationCenter'
export { TutorAvatar } from './TutorAvatar'
export { MissingKeyBanner } from './MissingKeyBanner'
export { TypingIndicator } from './TypingIndicator'
export { WelcomeState } from './WelcomeState'
export { ChatStyles } from './ChatStyles'
export { useExitAnimation } from '../../hooks/useExitAnimation'
export { ContextSuggestionCard } from './ContextSuggestionCard'

export function ChatWidget({
  isOpen,
  onClose,
  hasAiKey,
  onOpenSettings,
  className,
  contextSuggestions: externalSuggestions,
  onSendMessage: externalSendMessage,
  onQuickAction: externalQuickAction,
  onClearChat: externalClearChat,
  title = 'AI Tutor',
  subtitle = 'IELTS Coach',
  placeholder = 'Ask me anything about IELTS...',
  voiceButton,
  voiceInput,
}: ChatWidgetProps) {
  const { shouldRender, animationStyle } = useExitAnimation({ isOpen })

  const {
    messages,
    isTyping,
    showActions,
    showNotifications,
    isMobileFullscreen,
    inputValue,
    sendError,
    messagesEndRef,
    popupRef,
    setInputValue,
    setShowNotifications,
    handleQuickAction,
    handleSendMessage,
    handleClearChat,
    hasMessages,
    welcomeMessage,
    currentActions,
    internalContextSuggestion,
    contextSuggestionDismissed,
    setInternalContextSuggestion,
    proactive,
  } = useChatWidget({
    onSendMessage: externalSendMessage,
    onQuickAction: externalQuickAction,
    onClearChat: externalClearChat,
    contextSuggestions: externalSuggestions,
  })

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) return
    MessageStorage.recordOpen()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => textareaRef.current?.focus(), 300)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !popupRef.current) return
    const firstFocusable = popupRef.current.querySelector('button, [tabindex]:not([tabindex="-1"])') as HTMLElement | null
    firstFocusable?.focus()
  }, [isOpen, popupRef])

  const prevVoiceInput = useRef(voiceInput)
  useEffect(() => {
    if (!voiceInput || voiceInput === prevVoiceInput.current) return
    prevVoiceInput.current = voiceInput
    setInputValue(voiceInput)
    setTimeout(() => handleSendMessage(), 50)
  }, [voiceInput, setInputValue, handleSendMessage])

  const contextSuggestions = useMemo(
    () => externalSuggestions ?? (internalContextSuggestion ? [internalContextSuggestion] : []),
    [externalSuggestions, internalContextSuggestion],
  )

  const handleNotificationAction = useCallback(
    (msgId: string) => {
      const msg = proactive.messages.find(m => m.id === msgId)
      if (!msg) return
      proactive.markAsRead(msgId)
      proactive.dismissMessage(msgId)
      if (msg.action?.type === 'navigate' && msg.action.payload?.path) {
        window.location.href = msg.action.payload.path as string
      } else if (msg.action?.type === 'action' && msg.action.payload?.action) {
        handleQuickAction(msg.action.payload.action as string)
      }
    },
    [proactive, handleQuickAction],
  )

  const handleSuggestionDismiss = useCallback(() => {
    contextSuggestionDismissed.current = true
    setInternalContextSuggestion(null)
  }, [contextSuggestionDismissed, setInternalContextSuggestion])

  const handleSuggestionAction = useCallback(
    (suggestion: ContextSuggestion) => {
      contextSuggestionDismissed.current = true
      setInternalContextSuggestion(null)
      if (suggestion.action) {
        handleQuickAction(suggestion.action)
      }
    },
    [handleQuickAction, contextSuggestionDismissed, setInternalContextSuggestion],
  )

  const handlePromptClick = useCallback(
    (action: string) => {
      handleQuickAction(action)
    },
    [handleQuickAction],
  )

  const handleSaveNote = useCallback((content: string) => {
    try {
      const notes = JSON.parse(localStorage.getItem('savedAiNotes') || '[]')
      notes.push({ id: Date.now().toString(), content, createdAt: new Date().toISOString() })
      localStorage.setItem('savedAiNotes', JSON.stringify(notes))
    } catch (error) {
 console.error('apps/web/src/components/aiTutor/ChatWidget.tsx error:', error);
 /* ignore */ }
  }, [])

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch(() => {})
  }, [])

  const showWelcome = !hasMessages && !isTyping && contextSuggestions.length === 0

  const quickPrompts = DEFAULT_QUICK_PROMPTS

  const popup = (
    <>
      <ChatStyles />
      <div
        ref={popupRef}
        role="dialog"
        aria-modal={isMobileFullscreen ? 'true' : 'false'}
        aria-label="AI Tutor chat"
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: isMobileFullscreen ? '0' : '16px',
          borderWidth: isMobileFullscreen ? '0' : '1px',
          borderStyle: isMobileFullscreen ? 'none' : 'solid',
          borderColor: 'var(--color-border)',
          zIndex: 9999,
          position: 'fixed',
          overflow: 'hidden',
          backgroundColor: 'var(--color-surface)',
          boxShadow: 'var(--shadow-lg)',
          ...(isMobileFullscreen
            ? {
                width: '100vw',
                height: '100dvh',
                bottom: '0',
                right: '0',
              }
            : {
                width: '380px',
                height: '560px',
                maxHeight: 'calc(100dvh - 96px)',
                bottom: isMobileFullscreen ? '80px' : '24px',
                right: '24px',
              }),
          ...animationStyle,
        }}
      >
        <Header
          title={title}
          subtitle={subtitle}
          unreadCount={proactive.unreadCount}
          showNotifications={showNotifications}
          onToggleNotifications={() => setShowNotifications(prev => !prev)}
          onClearChat={handleClearChat}
          onClose={onClose}
        />

        {showNotifications ? (
          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            messages={proactive.messages}
            unreadCount={proactive.unreadCount}
            onMarkRead={proactive.markAsRead}
            onMarkAllRead={proactive.markAllAsRead}
            onDismiss={proactive.dismissMessage}
            onSnooze={proactive.snoozeMessage}
            onDelete={proactive.deleteMessage}
            onClearAll={proactive.clearAllMessages}
            onAction={msg => handleNotificationAction(msg.id)}
          />
        ) : (
          <>
            <MessagesArea
              messages={messages}
              isTyping={isTyping}
              showWelcome={showWelcome}
              hasAiKey={hasAiKey}
              onOpenSettings={onOpenSettings}
              welcomeMessage={welcomeMessage}
              contextSuggestions={contextSuggestions}
              sendError={sendError}
              messagesEndRef={messagesEndRef}
              onSuggestionDismiss={handleSuggestionDismiss}
              onSuggestionAction={handleSuggestionAction}
              onSaveNote={handleSaveNote}
              onCopy={handleCopy}
            />

            {showActions && hasMessages && currentActions.length > 0 && (
              <div
                className="flex shrink-0 flex-nowrap gap-1.5 overflow-x-auto border-t px-4 py-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex shrink-0 flex-nowrap gap-1.5">
                  <QuickActions actions={currentActions} onAction={handleQuickAction} />
                </div>
              </div>
            )}

            {showWelcome && (
              <div
                className="flex shrink-0 flex-nowrap items-center gap-1.5 overflow-x-auto border-t px-4 py-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {quickPrompts.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt.action}
                    onClick={() => handlePromptClick(prompt.action)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-on-primary)',
                      border: 'none',
                    }}
                    type="button"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            )}

            <ChatInputArea
              ref={textareaRef}
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              placeholder={placeholder}
              disabled={isTyping}
              voiceButton={voiceButton}
            />
          </>
        )}
      </div>
    </>
  )

  if (!shouldRender) return null

  return createPortal(popup, document.body)
}

function Header({
  title,
  subtitle,
  unreadCount,
  showNotifications,
  onToggleNotifications,
  onClearChat,
  onClose,
}: {
  title: string
  subtitle: string
  unreadCount: number
  showNotifications: boolean
  onToggleNotifications: () => void
  onClearChat: () => void
  onClose: () => void
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <TutorAvatar size={36} showStatus isOnline />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </p>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-success)' }}
          />
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleNotifications}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: showNotifications ? 'var(--color-tutor-accent)' : 'var(--color-muted)' }}
          aria-label="Notification center"
          title="Notifications"
        >
          <IconBell size={16} />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-tight"
              style={{
                backgroundColor: 'var(--color-danger)',
                color: 'var(--color-on-danger, #fff)',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onClearChat}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Clear chat"
          title="Clear conversation"
        >
          <IconDelete size={16} />
        </button>

        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Close chat"
          title="Minimize"
        >
          <IconClose size={16} />
        </button>
      </div>
    </div>
  )
}

function MessagesArea({
  messages,
  isTyping,
  showWelcome,
  hasAiKey,
  onOpenSettings,
  welcomeMessage,
  contextSuggestions,
  sendError,
  messagesEndRef,
  onSuggestionDismiss,
  onSuggestionAction,
  onSaveNote,
  onCopy,
}: {
  messages: ChatMessage[]
  isTyping: boolean
  showWelcome: boolean
  hasAiKey?: boolean
  onOpenSettings?: () => void
  welcomeMessage: string
  contextSuggestions: ContextSuggestion[]
  sendError: string | null
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onSuggestionDismiss: () => void
  onSuggestionAction: (suggestion: ContextSuggestion) => void
  onSaveNote: (content: string) => void
  onCopy: (content: string) => void
}) {
  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        scrollBehavior: 'smooth',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {showWelcome && (
        <div className="flex h-full flex-col items-center justify-center px-4 py-4 text-center">
          {!hasAiKey && onOpenSettings && (
            <MissingKeyBanner onOpenSettings={onOpenSettings} />
          )}
          <WelcomeState greeting={welcomeMessage} />
        </div>
      )}

      {messages.length === 0 && contextSuggestions.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-4">
          {!hasAiKey && onOpenSettings && (
            <MissingKeyBanner onOpenSettings={onOpenSettings} />
          )}
          {contextSuggestions.map((suggestion, index) => (
            <ContextSuggestionCard
              key={index}
              suggestion={suggestion}
              onDismiss={onSuggestionDismiss}
              onAction={() => onSuggestionAction(suggestion)}
            />
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-4 px-4 py-4">
          {messages.map(msg => (
            <ChatBubble
              key={msg.id}
              message={msg}
              showActionBar={msg.role === 'assistant'}
              onSaveNote={msg.role === 'assistant' ? onSaveNote : undefined}
              onCopy={msg.role === 'assistant' ? onCopy : undefined}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}

      {sendError && (
        <div
          className="mx-4 mb-2 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            color: 'var(--color-danger)',
            animation: 'chat-slide-up 0.2s ease-out',
          }}
          role="alert"
        >
          {sendError}
        </div>
      )}
    </div>
  )
}

const ChatInputArea = React.forwardRef<HTMLTextAreaElement, {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  disabled: boolean
  voiceButton?: React.ReactNode
}>(function ChatInputArea({ value, onChange, onSend, placeholder, disabled, voiceButton }, ref) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }, [onSend])

  const rows = useMemo(() => {
    const lines = value.split('\n').length
    return Math.min(Math.max(lines, 1), 4)
  }, [value])

  return (
    <div
      className="flex shrink-0 items-end gap-2 border-t px-4 py-3"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div
        className="relative flex flex-1 items-end rounded-xl border px-3 py-2 transition-colors"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="min-h-[24px] w-full resize-none bg-transparent text-sm outline-none disabled:opacity-50"
          style={{
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            lineHeight: '1.5',
          }}
          aria-label="Message to AI Tutor"
        />
      </div>

      {voiceButton}

      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm transition-all hover:opacity-80 disabled:opacity-40"
        style={{
          backgroundColor: !value.trim() || disabled ? 'var(--color-surface-alt)' : 'var(--color-tutor-accent)',
          color: 'var(--color-on-primary)',
        }}
        aria-label="Send message"
        title="Send"
      >
        <IconSend size={20} />
      </button>
    </div>
  )
})
