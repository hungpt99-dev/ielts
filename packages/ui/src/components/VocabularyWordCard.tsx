import { type HTMLAttributes, type ReactNode, useRef, useCallback, useState } from 'react'
import { IconCircle, IconClock, IconStar, IconVolume } from '../icons/IconMap'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type ReviewStatus = 'new' | 'learning' | 'reviewing' | 'mastered'

export interface VocabularyWordCardProps extends HTMLAttributes<HTMLDivElement> {
  word: string
  meaning: string
  difficulty?: DifficultyLevel
  reviewStatus?: ReviewStatus
  partOfSpeech?: string
  onPlay?: () => void
  onDetail?: () => void
  actions?: ReactNode
  compact?: boolean
  selected?: boolean
  onSwipe?: (direction: 'left' | 'right') => void
  onSwipeThreshold?: number
}

const difficultyColors: Record<DifficultyLevel, { bg: string; text: string }> = {
  easy: { bg: 'var(--color-success-light)', text: 'var(--color-success-dark)' },
  medium: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)' },
  hard: { bg: 'var(--color-danger-light)', text: 'var(--color-danger-dark)' },
}

const statusIconComponent: Record<ReviewStatus, ReactNode> = {
  new: <IconCircle size={12} />,
  learning: <IconClock size={12} />,
  reviewing: <IconClock size={12} />,
  mastered: <IconStar size={12} />,
}

const statusColor: Record<ReviewStatus, string> = {
  new: 'var(--color-muted)',
  learning: 'var(--color-primary)',
  reviewing: 'var(--color-warning)',
  mastered: 'var(--color-success)',
}

export function VocabularyWordCard({
  word,
  meaning,
  difficulty,
  reviewStatus = 'new',
  partOfSpeech,
  onPlay,
  onDetail,
  actions,
  compact = false,
  selected = false,
  onSwipe,
  onSwipeThreshold = 80,
  style,
  ...props
}: VocabularyWordCardProps) {
  const diffColors = difficulty ? difficultyColors[difficulty] : undefined
  const cardRef = useRef<HTMLDivElement>(null)
  const [swiping, setSwiping] = useState(false)
  const swipeStartRef = useRef({ x: 0, y: 0 })
  const swipeOffsetRef = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onSwipe) return
    swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    swipeOffsetRef.current = 0
    setSwiping(true)
  }, [onSwipe])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!onSwipe || !swiping || !cardRef.current) return
    const dx = e.touches[0].clientX - swipeStartRef.current.x
    const dy = e.touches[0].clientY - swipeStartRef.current.y
    if (Math.abs(dx) > Math.abs(dy)) {
      swipeOffsetRef.current = dx
      cardRef.current.style.transform = `translateX(${dx}px)`
      cardRef.current.style.opacity = `${1 - Math.abs(dx) / (onSwipeThreshold * 2)}`
    }
  }, [onSwipe, swiping, onSwipeThreshold])

  const handleTouchEnd = useCallback(() => {
    if (!onSwipe || !swiping) return
    setSwiping(false)
    if (cardRef.current) {
      if (Math.abs(swipeOffsetRef.current) > onSwipeThreshold) {
        onSwipe(swipeOffsetRef.current > 0 ? 'right' : 'left')
      }
      cardRef.current.style.transform = ''
      cardRef.current.style.opacity = ''
    }
    swipeOffsetRef.current = 0
  }, [onSwipe, swiping, onSwipeThreshold])

  return (
    <div
      ref={cardRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: compact ? 'var(--spacing-xs) var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)',
        background: selected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        border: selected
          ? '1px solid var(--color-primary)'
          : '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-lg)',
        cursor: onDetail ? 'pointer' : undefined,
        transition: swiping ? 'none' : 'all var(--transition-fast)',
        userSelect: 'none',
        touchAction: 'pan-y',
        ...(style as Record<string, string>),
      }}
      onClick={(e) => {
        if (Math.abs(swipeOffsetRef.current) > 5) return
        onDetail?.()
        props.onClick?.(e)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      <span
        style={{
          fontSize: compact ? 'var(--text-xs)' : 'var(--text-xs)',
          color: statusColor[reviewStatus],
          flexShrink: 0,
        }}
        title={reviewStatus}
      >
        {statusIconComponent[reviewStatus]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2xs)',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: compact ? 'var(--text-sm)' : 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {word}
          </span>
          {partOfSpeech && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted)',
                fontStyle: 'italic',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {partOfSpeech}
            </span>
          )}
          {diffColors && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                padding: '0 var(--spacing-2xs)',
                borderRadius: 'var(--radius-xs)',
                background: diffColors.bg,
                color: diffColors.text,
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {difficulty}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 'var(--spacing-2xs) 0 0',
            fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-normal)',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {meaning}
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-2xs)',
          flexShrink: 0,
        }}
      >
        {onPlay && (
          <button
            type="button"
            aria-label={`Pronounce ${word}`}
            onClick={(e) => {
              e.stopPropagation()
              onPlay()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'var(--spacing-lg)',
              height: 'var(--spacing-lg)',
              padding: 0,
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-xs)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <IconVolume size={12} />
          </button>
        )}
        {actions}
      </div>
    </div>
  )
}
