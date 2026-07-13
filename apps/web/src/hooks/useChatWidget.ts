import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ChatMessage, ContextSuggestion } from '@ielts/ai-tutor-engine'
import { MessageStorage, generateId } from '@ielts/ai-tutor-engine'
import { useProactiveMessages, getWelcomeMessage, generateQuickResponse, ACTION_LABELS, DEFAULT_QUICK_ACTIONS } from './useProactiveMessages'

interface UseChatWidgetOptions {
  onSendMessage?: (text: string) => Promise<string>
  onQuickAction?: (action: string) => void
  onClearChat?: () => void
  contextSuggestions?: ContextSuggestion[]
}

interface UseChatWidgetReturn {
  messages: ChatMessage[]
  isTyping: boolean
  showActions: boolean
  showNotifications: boolean
  isMobileFullscreen: boolean
  inputValue: string
  sendError: string | null
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  popupRef: React.RefObject<HTMLDivElement | null>
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>
  handleQuickAction: (action: string) => void
  handleSendMessage: () => Promise<void>
  handleClearChat: () => void
  addMessage: (role: 'user' | 'assistant', content: string) => void
  hasMessages: boolean
  welcomeMessage: string
  currentActions: typeof DEFAULT_QUICK_ACTIONS
  internalContextSuggestion: ContextSuggestion | null
  contextSuggestionDismissed: React.MutableRefObject<boolean>
  setInternalContextSuggestion: (suggestion: ContextSuggestion | null) => void
  proactive: ReturnType<typeof useProactiveMessages>
}

export function useChatWidget(options: UseChatWidgetOptions): UseChatWidgetReturn {
  const {
    onSendMessage: externalSendMessage,
    onQuickAction: externalQuickAction,
    onClearChat: externalClearChat,
  } = options

  const [messages, setMessages] = useState<ChatMessage[]>(MessageStorage.getMessages)
  const [isTyping, setIsTyping] = useState(false)
  const [showActions, setShowActions] = useState(true)
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const contextSuggestionDismissed = useRef(false)

  const proactive = useProactiveMessages()
  const [internalContextSuggestion, setInternalContextSuggestion] = useState<ContextSuggestion | null>(null)

  useEffect(() => {
    const check = () => setIsMobileFullscreen(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    MessageStorage.setMessages(messages)
  }, [messages])

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      role,
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    MessageStorage.recordInteraction()
  }, [])

  const handleQuickAction = useCallback(
    (action: string) => {
      if (externalQuickAction) {
        externalQuickAction(action)
        return
      }
      const prompt = ACTION_LABELS[action] || action
      addMessage('user', prompt)
      setShowActions(false)
      setIsTyping(true)
      setSendError(null)

      if (externalSendMessage) {
        externalSendMessage(prompt)
          .then(response => {
            setIsTyping(false)
            addMessage('assistant', response)
            setShowActions(true)
          })
          .catch(() => {
            setIsTyping(false)
            addMessage('assistant', "I'm sorry, I couldn't process your message right now. Please try again.")
            setShowActions(true)
          })
      } else {
        const delay = 1000 + Math.random() * 600
        setTimeout(() => {
          setIsTyping(false)
          addMessage('assistant', generateQuickResponse(action))
          setShowActions(true)
        }, delay)
      }
    },
    [addMessage, externalQuickAction, externalSendMessage],
  )

  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim()
    if (!text) return
    addMessage('user', text)
    setInputValue('')
    setShowActions(false)
    setIsTyping(true)
    setSendError(null)

    if (externalSendMessage) {
      try {
        const response = await externalSendMessage(text)
        setIsTyping(false)
        addMessage('assistant', response)
        setShowActions(true)
      } catch (err) {
        setIsTyping(false)
        setSendError(err instanceof Error ? err.message : 'Failed to get response')
        addMessage('assistant', "I'm sorry, I couldn't process your message right now. Please try again or use one of the quick actions above.")
        setShowActions(true)
      }
    } else {
      const delay = 800 + Math.random() * 400
      setTimeout(() => {
        setIsTyping(false)
        addMessage(
          'assistant',
          "Thanks for your message! 😊 I'm here to help with your IELTS journey. Feel free to use the quick action buttons above for specific help, or tell me more about what you'd like to work on.",
        )
        setShowActions(true)
      }, delay)
    }
  }, [inputValue, addMessage, externalSendMessage])

  const handleClearChat = useCallback(() => {
    if (externalClearChat) {
      externalClearChat()
    }
    setMessages([])
    setShowActions(true)
    setSendError(null)
    MessageStorage.clearMessages()
    autoSentRef.current.clear()
  }, [externalClearChat])

  const autoSentRef = useRef(new Set<string>())
  const markAsReadRef = useRef(proactive.markAsRead)
  const dismissMessageRef = useRef(proactive.dismissMessage)
  markAsReadRef.current = proactive.markAsRead
  dismissMessageRef.current = proactive.dismissMessage

  useEffect(() => {
    const newMessages = proactive.messages.filter(
      m => !m.isDismissed && !m.isRead && !autoSentRef.current.has(m.id)
    )
    for (const msg of newMessages) {
      autoSentRef.current.add(msg.id)
      const text = msg.title ? `${msg.title}\n\n${msg.message}` : msg.message
      addMessage('assistant', text)
      markAsReadRef.current(msg.id)
    }
  }, [proactive.messages, addMessage])

  const hasMessages = messages.length > 0
  const welcomeMessage = useMemo(() => getWelcomeMessage(), [])
  const currentActions = DEFAULT_QUICK_ACTIONS

  return {
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
    addMessage,
    hasMessages,
    welcomeMessage,
    currentActions,
    internalContextSuggestion,
    contextSuggestionDismissed,
    setInternalContextSuggestion,
    proactive,
  }
}
