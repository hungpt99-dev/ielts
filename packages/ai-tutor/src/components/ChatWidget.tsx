import React, { useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { ChatWidgetProps, ChatMessage, ContextSuggestion, QuickAction } from '../types'
import { MessageStorage } from '../services/messageStorage'
import { useChatWidget } from '../hooks/useChatWidget'
import { ChatBubble } from './ChatBubble'
import { QuickActions } from './QuickActions'
import { ProactiveMessagePreview } from './ProactiveMessagePreview'
import { NotificationCenter } from './NotificationCenter'
import { TutorAvatar } from './TutorAvatar'
import { MissingKeyBanner } from './MissingKeyBanner'
import { TypingIndicator } from './TypingIndicator'
import { WelcomeState } from './WelcomeState'
import { ChatStyles } from './ChatStyles'
import { useExitAnimation } from './useExitAnimation'
import { ContextSuggestionCard } from './ContextSuggestionCard'

export { ChatBubble } from './ChatBubble'
export { QuickActions } from './QuickActions'
export { ProactiveMessagePreview } from './ProactiveMessagePreview'
export { NotificationCenter } from './NotificationCenter'
export { TutorAvatar } from './TutorAvatar'
export { MissingKeyBanner } from './MissingKeyBanner'
export { TypingIndicator } from './TypingIndicator'
export { WelcomeState } from './WelcomeState'
export { ChatStyles } from './ChatStyles'
export { useExitAnimation } from './useExitAnimation'
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
  title = 'AI Tutor Assistant',
  subtitle = 'Online · IELTS Coach',
  placeholder = 'Type a message...',
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
    inputRef,
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
    const timer = setTimeout(() => inputRef.current?.focus(), 300)
    return () => clearTimeout(timer)
  }, [isOpen, inputRef])

  useEffect(() => {
    if (!isOpen || !popupRef.current) return
    const firstFocusable = popupRef.current.querySelector('button, [tabindex]:not([tabindex="-1"])') as HTMLElement | null
    firstFocusable?.focus()
  }, [isOpen, popupRef])

  const contextSuggestions = useMemo(
    () => externalSuggestions ?? (internalContextSuggestion ? [internalContextSuggestion] : []),
    [externalSuggestions, internalContextSuggestion],
  )

  const pendingProactive = useMemo(
    () => proactive.messages.filter(m => !m.isDismissed && !m.isSnoozed).slice(0, 3),
    [proactive.messages],
  )

  const handleDismissProactive = useCallback(
    (msgId: string) => proactive.dismissMessage(msgId),
    [proactive],
  )

  const handleSnoozeProactive = useCallback(
    (msgId: string) => proactive.snoozeMessage(msgId),
    [proactive],
  )

  const handleProactiveAction = useCallback(
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

  const handleNotificationAction = useCallback(
    (msgId: string) => {
      const msg = proactive.messages.find(m => m.id === msgId)
      if (!msg) return
      proactive.markAsRead(msgId)
      if (msg.action?.type === 'navigate' && msg.action.payload?.path) {
        window.location.href = msg.action.payload.path as string
      }
    },
    [proactive],
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

  const showWelcome = !hasMessages && !isTyping && contextSuggestions.length === 0

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
          ...popupContainerStyle,
          ...(isMobileFullscreen ? mobileFullscreenStyle : desktopStyle),
          ...animationStyle,
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <ChatHeader
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
            <ChatMessagesArea
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
            />

            {pendingProactive.length > 0 && (
              <div
                className="flex shrink-0 flex-col gap-2 border-t px-4 py-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                  Tutor Suggestions
                </p>
                {pendingProactive.map(msg => (
                  <ProactiveMessagePreview
                    key={msg.id}
                    message={msg}
                    onDismiss={() => handleDismissProactive(msg.id)}
                    onAction={() => handleProactiveAction(msg.id)}
                    onSnooze={() => handleSnoozeProactive(msg.id)}
                  />
                ))}
              </div>
            )}

            {showActions && (
              <QuickActionsRow actions={currentActions} onAction={handleQuickAction} />
            )}

            <ChatInput
              ref={inputRef}
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              placeholder={placeholder}
              disabled={isTyping}
            />
          </>
        )}
      </div>
    </>
  )

  if (!shouldRender) return null

  return createPortal(popup, document.body)
}

function ChatHeader({
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
      style={{ borderColor: 'var(--color-border)' }}
    >
      <TutorAvatar size={40} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </p>
        <p className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-success)' }}>
          <span>{subtitle}</span>
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onToggleNotifications}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: showNotifications ? 'var(--color-primary)' : 'var(--color-muted)' }}
          aria-label="Notification center"
          title="Notifications"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
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
          title="Clear chat"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Close chat"
          title="Minimize"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ChatMessagesArea({
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
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollBehavior: 'smooth' }}>
      {showWelcome && (
        <div className="flex h-full flex-col items-center justify-center py-4 text-center">
          {!hasAiKey && onOpenSettings && (
            <MissingKeyBanner onOpenSettings={onOpenSettings} />
          )}
          <WelcomeState greeting={welcomeMessage} />
        </div>
      )}

      {!showWelcome && contextSuggestions.length > 0 && (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-2">
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
        <div className="flex flex-col gap-3">
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}

      {sendError && (
        <div
          className="mx-2 mt-2 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
            color: 'var(--color-danger)',
          }}
          role="alert"
        >
          {sendError}
        </div>
      )}
    </div>
  )
}

function QuickActionsRow({
  actions,
  onAction,
}: {
  actions: QuickAction[]
  onAction: (action: string) => void
}) {
  return (
    <div
      className="flex shrink-0 flex-wrap gap-1.5 border-t px-4 py-3"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <QuickActions actions={actions} onAction={onAction} />
    </div>
  )
}

const ChatInput = React.forwardRef<HTMLInputElement, {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder: string
  disabled: boolean
}>(function ChatInput({ value, onChange, onSend, placeholder, disabled }, ref) {
  return (
    <div
      className="flex shrink-0 gap-2 border-t px-4 py-3"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50"
        style={{
          backgroundColor: 'var(--color-surface-secondary)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
        }}
        aria-label="Chat message input"
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80 disabled:opacity-40"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
        }}
        aria-label="Send message"
        title="Send"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
        </svg>
      </button>
    </div>
  )
})

const popupContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  border: '1px solid',
  overflow: 'hidden',
  zIndex: 9999,
  position: 'fixed',
}

const desktopStyle: React.CSSProperties = {
  width: '380px',
  height: '560px',
  bottom: '24px',
  right: '24px',
}

const mobileFullscreenStyle: React.CSSProperties = {
  width: '100vw',
  height: '100dvh',
  bottom: '0',
  right: '0',
  borderRadius: '0',
  border: 'none',
}
