import { useState, useEffect, useRef } from 'react'

interface UseExitAnimationOptions {
  isOpen: boolean
  duration?: number
}

interface UseExitAnimationResult {
  shouldRender: boolean
  animationStyle: React.CSSProperties
}

export function useExitAnimation({
  isOpen,
  duration = 250,
}: UseExitAnimationOptions): UseExitAnimationResult {
  const [isExiting, setIsExiting] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const prevOpen = useRef(isOpen)

  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setIsExiting(false)
      setShouldRender(true)
    } else if (!isOpen && prevOpen.current) {
      setIsExiting(true)
      const timer = setTimeout(() => {
        setIsExiting(false)
        setShouldRender(false)
      }, duration)
      return () => clearTimeout(timer)
    }
    prevOpen.current = isOpen
  }, [isOpen, duration])

  const animationStyle: React.CSSProperties = isExiting
    ? {
        animation: `chat-popup-out ${duration}ms ease-in forwards`,
        pointerEvents: 'none' as const,
      }
    : {
        animation: `chat-popup-in ${duration}ms ease-out`,
      }

  return { shouldRender, animationStyle }
}
